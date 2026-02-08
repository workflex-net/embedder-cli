# Ralph Loop 工作机制示例：场景 03 EMBEDDER.md 初始化

以场景 03 为例，完整追踪 `make ralph` 的一次执行流程。

---

## 场景定义

```typescript
// ralph/scenarios/03-embedder-md-init.ts
{
  id: "03",
  name: "EMBEDDER.md Project Initialization",
  phase: "requirement-decomposition",
  prompt: "为 STM32G4 裸机项目创建 EMBEDDER.md。MCU: STM32G431KB, 工具链: arm-none-eabi-gcc,
           调试接口: ST-Link, 串口: /dev/ttyACM0, 波特率: 115200, 项目名: blink-test",
  allowedTools: ["Bash", "Read", "Write", "Glob", "Grep"],
  timeout: 120_000,
}
```

---

## 第一步：创建两个空目录

`harness.ts:23-24`:

```typescript
const oursDir   = await mkdtemp(join(tmpdir(), "ralph-ours-03-"));
const theirsDir = await mkdtemp(join(tmpdir(), "ralph-theirs-03-"));
```

结果：

```
/tmp/ralph-ours-03-a8f2c1/      ← 空的
/tmp/ralph-theirs-03-b3d9e7/    ← 空的
```

两个 agent 各自在自己的空目录里工作，互不可见。

---

## 第二步：并行启动两个 Claude Sonnet 实例

`agent.ts` 通过 Claude Agent SDK 的 `query()` 启动两个独立的 Claude Code 子进程。

**OurRunner** 收到的系统提示（`agent.ts:44-62`，我们重建的）：

```
You are an embedded systems engineering assistant.
You help developers write firmware for microcontrollers using bare-metal and SDK approaches.

Core capabilities:
- Hardware identification (ST-Link probe, serial port discovery)
- Project initialization (EMBEDDER.md creation)
- Task decomposition for firmware development
...

When working on embedded projects:
1. Check for EMBEDDER.md in the project root for configuration
2. Use register-level CMSIS access unless HAL is specified
3. Generate complete build artifacts (main.c, startup, linker script, Makefile)
4. Use OpenOCD for flashing via ST-Link
5. Configure serial monitoring with correct port and baud rate
```

**TheirRunner** 收到的系统提示（`agent.ts:17-39`，从 extracted/modules/lib_app.js 提取的）：

```
You are an expert embedded systems engineer assistant called Embedder.
You help developers build firmware for microcontrollers. You have deep knowledge of:
- STM32, ESP32, nRF, RP2040 and other MCU families
- Bare-metal register-level programming
...

When working on a project, always check for an EMBEDDER.md file in the project root.
This file contains project-specific configuration including:
- Target MCU and board
- Toolchain and build commands
- Debug interface configuration
- Serial monitor settings
```

两者收到 **同一个 prompt**，工具集相同，cwd 分别是各自的空 tmpdir。

---

## 第三步：两个 agent 各自生成文件

两个 Claude 实例独立思考、调用工具。

**OurRunner 可能的行为**：

```
tool_call: Write(
  file_path: "/tmp/ralph-ours-03-a8f2c1/EMBEDDER.md",
  content: "# EMBEDDER.md\n\n## Project: blink-test\n\nTarget MCU = STM32G431KB\n
            Toolchain = arm-none-eabi-gcc\nDebug Interface = ST-Link\n
            Serial Port = /dev/ttyACM0\nBaud Rate = 115200\n..."
)
```

**TheirRunner 可能的行为**：

```
tool_call: Write(
  file_path: "/tmp/ralph-theirs-03-b3d9e7/EMBEDDER.md",
  content: "# blink-test\n\n<OVERVIEW>\nTarget MCU = STM32G431KB\nBoard = custom\n
            Toolchain = arm-none-eabi-gcc\nDebug Interface = st-link\n</OVERVIEW>\n\n
            <COMMANDS>\nbuild_command = make\n
            flash_command = openocd -f interface/stlink.cfg -f target/stm32g4x.cfg
            -c \"program build/blink-test.elf verify reset exit\"\n
            serial_port = /dev/ttyACM0\nbaud_rate = 115200\n</COMMANDS>"
)
```

**关键差异**：TheirRunner 的系统提示提到 EMBEDDER.md 包含 "project-specific configuration"，LLM 更可能生成带 `<OVERVIEW>`/`<COMMANDS>` 标记的结构化文件。OurRunner 的系统提示没有这些格式细节，倾向生成普通 Markdown。

---

## 第四步：捕获产出

### 4a. PostToolUse hook 捕获

`capture.ts` 通过 SDK hook 记录每次工具调用：

```typescript
// OurRunner 的 capture 结果
ours = {
  scenarioId: "03",
  source: "ours",
  success: true,
  toolCalls: [
    { toolName: "Write",
      input: { file_path: "/tmp/ralph-ours-03-a8f2c1/EMBEDDER.md", content: "..." },
      output: "File written successfully" }
  ],
  artifacts: {
    "/tmp/ralph-ours-03-a8f2c1/EMBEDDER.md": "# EMBEDDER.md\n..."   // 绝对路径 key
  }
}
```

### 4b. workspace scan 补充捕获

`harness.ts:46-51` 扫描 tmpdir 获取所有文件（捕获 Bash 等工具间接创建的文件）：

```typescript
const oursFiles = await captureWorkspaceFiles(oursDir);
// → { "EMBEDDER.md": "# EMBEDDER.md\n..." }    // 相对路径 key

Object.assign(ours.artifacts, oursFiles);
```

合并后 `ours.artifacts` 包含两个 key 指向同一文件：

```typescript
ours.artifacts = {
  "/tmp/ralph-ours-03-a8f2c1/EMBEDDER.md": "...",   // 绝对路径 (from hook)
  "EMBEDDER.md": "..."                                // 相对路径 (from scan)
}
```

---

## 第五步：comparator 结构化对比

`comparator.ts` 的 `compareResults(ours, theirs)` 做三层对比：

### 5a. 工具集匹配

```
compareToolSets(ours, theirs):
  ours 调用的工具:  [Write] → 核心集 filterCoreTools → {Write}
  theirs 调用的工具: [Write] → 核心集 filterCoreTools → {Write}
  → toolSetMatch = true
```

只比较 "核心工具"（Write、Edit、Bash），忽略 Read/Grep/Glob 等只读工具。

### 5b. artifact 文件对比

```
compareArtifacts(ours.artifacts, theirs.artifacts):
  allPaths = {
    "/tmp/ralph-ours-03-a8f2c1/EMBEDDER.md",     // 只在 ours → type: "added"
    "/tmp/ralph-theirs-03-b3d9e7/EMBEDDER.md",   // 只在 theirs → type: "removed"
    "EMBEDDER.md"                                  // 两边都有 → 进入 diff
  }
```

对于匹配上的 `"EMBEDDER.md"`，调用 `diffEmbedderMd`：

```
diffEmbedderMd(ours, theirs):
  // 解析 KV 对
  oursKV  = { "Target MCU": "STM32G431KB", "Toolchain": "arm-none-eabi-gcc", ... }
  theirsKV = { "Target MCU": "STM32G431KB", "Toolchain": "arm-none-eabi-gcc", ... }
  // KV 大部分相同

  // 检查 section 标记
  ours   没有 <OVERVIEW>  → "absent"
  theirs 有   <OVERVIEW>  → "present"
  → structuralDiff: { field: "section:<OVERVIEW>", ours: "absent", theirs: "present" }
  → structuralDiff: { field: "section:<COMMANDS>", ours: "absent", theirs: "present" }
```

结果：`"EMBEDDER.md"` 判定为 `type: "modified"`。

### 5c. 计算 similarity

```
computeSimilarity():
  工具集匹配:    0.3 × 1.0  = 0.30
  artifact 相似: 0.4 × score
    3 个 artifact: 1 个 modified(×0.5), 1 个 added(×0), 1 个 removed(×0)
    score = (0 + 0.5 + 0) / 3 = 0.167
    0.4 × 0.167 = 0.067
  成功一致性:    0.2 × 1.0  = 0.20   (两者都 success=true)
  序列 LCS:      0.1 × 1.0  = 0.10   (都只调了 Write → LCS=1)
  总分: 0.667 / 1.0 = 0.667  (66.7%)
```

### 5d. 对比判定

```
comparison = {
  scenarioId: "03",
  similarity: 0.667,
  toolSetMatch: true,
  pass: false              // 0.667 < 0.7，不通过
}
```

---

## 第六步：validation 验证（只验 ours）

`scenario.validate(ours)` 对 OurRunner 的产出做功能检查：

```
findArtifact(ours, "EMBEDDER.md") → 找到（匹配相对路径 key）
content = "# embedder.md\n\n## project: blink-test\ntarget mcu = stm32g431kb\n..."

checks:
  file_created:          PASS  (文件存在)
  has_overview_section:  FAIL  (没有 <overview>)
  has_commands_section:  FAIL  (没有 <commands>)
  target_mcu:            PASS  (含 "stm32g4")
  debug_interface:       PASS  (含 "st-link")
  flash_command_openocd: FAIL  (没有 openocd + stm32g4x 同时出现)
  serial_port:           PASS  (含 "/dev/ttyacm0")
  baud_rate:             PASS  (含 "115200")
  toolchain:             PASS  (含 "arm-none-eabi")

pass = checks.every(c => c.pass)   // 场景 03 要求全部 9 项通过
→ validation.pass = false           // 3 项未通过
```

---

## 第七步：最终结果

```
comparison.pass = false  (similarity 66.7% < 70%)
validation.pass = false  (3 个 check 未通过: <OVERVIEW>, <COMMANDS>, openocd)

→ 场景 03: FAIL
```

控制台输出：

```
[03] EMBEDDER.md Project Initialization
  Phase: requirement-decomposition
  Workspace (ours):   /tmp/ralph-ours-03-a8f2c1
  Workspace (theirs): /tmp/ralph-theirs-03-b3d9e7
  Running dual agents...
  Comparing results...
  Validating...
  Result: FAIL (similarity: 66.7%)
  Behavior notes:
    - ...
  Failed checks:
    - has_overview_section: Must contain <OVERVIEW> section
    - has_commands_section: Must contain <COMMANDS> section
    - flash_command_openocd: flash_command must reference openocd + stm32g4x.cfg
```

---

## 第八步：下一轮迭代

Runner.ts 循环逻辑：场景 03 未通过 → 加入下一轮。

```
ITERATION 2/10 — 1 scenario(s) remaining
```

用完全相同的配置（同样的系统提示、同样的 prompt）再跑一遍。由于 LLM 非确定性，OurRunner 这次可能碰巧生成了 `<OVERVIEW>` 标记 → validation pass。也可能连续 10 轮都不通过。

---

## 清理

无论通过与否，`harness.ts:89-96` 的 `finally` 块删除临时目录：

```typescript
await rm(oursDir, { recursive: true, force: true });
await rm(theirsDir, { recursive: true, force: true });
```

结果保存到 `ralph/results/<timestamp>/scenario-03/`。

---

## 此例暴露的问题

| 问题 | 说明 |
|------|------|
| **artifacts 路径混乱** | hook 记录绝对路径 `/tmp/ralph-ours-03-xxx/EMBEDDER.md`，workspace scan 记录相对路径 `EMBEDDER.md`，同一个文件出现两个 key。绝对路径永远匹配不上对面的，被当成 `added`/`removed` 拉低 similarity |
| **对比的是两个 LLM 的生成结果** | 不是对比 `src/` 里的代码实现。两个 Claude 实例面对同一道嵌入式题目，自然会写出相似的答案（main.c、Makefile 的结构高度确定），跟逆向还原质量无关 |
| **validation 依赖 LLM 碰运气** | OurRunner 是否生成 `<OVERVIEW>` 取决于 Claude 当次的随机输出，不取决于 `src/` 代码是否正确实现了 init_project 工具 |
| **循环重跑无收敛** | 每轮配置完全不变（相同系统提示 + 相同 prompt），纯靠 LLM 非确定性碰通过 |
| **similarity 易受干扰** | 绝对路径 artifact 导致分母膨胀，真实文件匹配被 added/removed 稀释 |
