# Ralph Loop — 功能对齐验证环

## 1. 概述

Ralph Loop 是一个自动化的 AI Agent 验证系统，用于检测我们重建的 embedder-cli 实现与真实 embedder-cli (v0.3.16) 之间的功能差异。核心机制：**双 Runner 对比** — 对同一 prompt 分别以真实 embedder 系统提示和我们的系统提示运行 Claude Agent，比较两者产出的工具调用序列和文件 artifacts 的结构差异。

```
                        ┌─────────────┐
                        │ ralph.config│  模型、路径、超时、工具集
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │  runner.ts  │  主循环入口
                        └──────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐  ┌────────────┐  ┌────────────┐
       │ scenario-01│  │ scenario-02│  │ scenario-10│
       │  ...       │  │  ...       │  │  ...       │
       └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
             │               │               │
             └───────────────┼───────────────┘
                             ▼
                      ┌─────────────┐
                      │  harness.ts │  场景执行框架
                      └──────┬──────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
             ┌────────────┐   ┌────────────┐
             │ OurRunner  │   │ TheirRunner│
             │ (重建 SP)  │   │ (真实 SP)  │
             └─────┬──────┘   └─────┬──────┘
                   │                │
                   └───────┬────────┘
                           ▼
                    ┌─────────────┐
                    │ comparator  │  结构化 diff
                    └──────┬──────┘
                           ▼
                    ┌─────────────┐
                    │  reporter   │  JSON + Markdown
                    └─────────────┘
```

---

## 2. 技术栈

| 层面 | 技术选择 |
|------|----------|
| 语言 | TypeScript (strict mode) |
| 运行时 | Bun |
| Agent SDK | `@anthropic-ai/claude-agent-sdk` ^0.2.34 |
| 验证 | Zod ^4.3.6 |
| Claude Code | v2.1.33 (通过 SDK 以子进程方式调用) |
| 模型 | claude-sonnet-4-20250514 |

---

## 3. 目录结构

```
ralph/
├── package.json              依赖声明
├── tsconfig.json             扩展 ../tsconfig.json
├── ralph.config.ts           集中配置 (路径、模型、工具集、超时)
├── runner.ts                 主循环入口 (CLI 参数解析 + 迭代循环)
├── lib/
│   ├── types.ts              共享类型 (ScenarioResult, ComparisonResult, ...)
│   ├── agent.ts              双 Runner — Claude Agent SDK wrapper
│   ├── harness.ts            场景执行框架 (tmpdir → 双 run → compare → validate)
│   ├── comparator.ts         结构化 diff 引擎
│   ├── reporter.ts           结果持久化 (JSON + Markdown + symlink)
│   ├── hardware.ts           ST-Link 检测、串口枚举
│   └── capture.ts            工具调用记录 + 工作区文件捕获
├── scenarios/
│   ├── 01-stlink-probe.ts    硬件识别: ST-Link 探针检测
│   ├── 02-serial-discovery.ts 硬件识别: 串口发现
│   ├── 03-embedder-md-init.ts 需求拆解: EMBEDDER.md 初始化
│   ├── 04-task-decomposition.ts 需求拆解: 任务分解
│   ├── 05-catalog-query.ts   RAG 召回: 硬件目录查询
│   ├── 06-document-search.ts RAG 召回: 寄存器文档搜索
│   ├── 07-gpio-driver-gen.ts 代码实现: GPIO 驱动生成
│   ├── 08-build-system.ts    代码实现: 构建系统
│   ├── 09-flash-firmware.ts  烧录验证: 固件烧录
│   └── 10-serial-verify.ts   烧录验证: 串口监控
├── fixtures/
│   ├── prompts/              10 个场景的标准化 prompt 文本
│   ├── expected/             Zod 验证 schemas
│   └── workspace/            临时工作区模板
└── results/                  .gitignore, 运行时填充
    └── latest -> <timestamp>/
```

---

## 4. 核心机制: 迭代循环

`make ralph` 执行的不是单次运行，而是一个**迭代收敛循环**：

```
 加载配置 + 过滤场景
       │
       ▼
 ┌──→ ITERATION N (最多 10 轮)
 │          │
 │    取未通过的场景
 │          │
 │    ┌─────┴─────────────────────────────┐
 │    │  对每个场景:                       │
 │    │  1. 创建 2 个隔离 tmpdir          │
 │    │  2. 并行启动 OurRunner + TheirRunner│
 │    │  3. PostToolUse hook 捕获工具调用  │
 │    │  4. 扫描 tmpdir 收集文件 artifacts │
 │    │  5. comparator 结构化 diff        │
 │    │  6. validate() 功能正确性检查     │
 │    │  7. 清理 tmpdir                   │
 │    └─────┬─────────────────────────────┘
 │          │
 │    保存中间结果到 results/<timestamp>/
 │          │
 │    ┌─────┴──────┐
 │    │ 全部通过?  │──→ 是 → 退出循环 ✓
 │    └─────┬──────┘
 │          │ 否
 │    打印失败分析 (工具计数、错误、检查项)
 │          │
 │    检查是否有进展 (新通过数 > 0?)
 │          │
 └──────────┘
       │
  最终报告 (summary.md)
```

### 关键设计

- **已通过的场景不再重跑**: `passedScenarioIds` Set 跟踪通过的场景 ID，后续迭代只运行失败的
- **进展检测**: 连续两轮无新通过场景时输出 WARNING
- **中间结果持久化**: 每轮结束都保存一次，保证崩溃不丢数据
- **最终结果合并**: `allResults` 保留每个场景的最新一次运行结果

---

## 5. 双 Runner 架构

每个场景会并行启动两个 Claude Agent SDK `query()` 实例：

| | OurRunner | TheirRunner |
|---|-----------|-------------|
| **系统提示** | 从 `src/` 骨架分析重建的 prompt | 从 `extracted/modules/lib_app.js` txB 提取的真实 prompt |
| **工具集** | Claude Code 内置工具 (Bash, Read, Write, Edit, Glob, Grep) | 同上 |
| **工作目录** | 隔离的 `/tmp/ralph-ours-XX-*` | 隔离的 `/tmp/ralph-theirs-XX-*` |
| **权限** | `bypassPermissions` (无交互确认) | 同上 |

### SDK 调用关键参数

```typescript
query({
  prompt: scenario.prompt,
  options: {
    systemPrompt: "...",           // 区分 ours/theirs
    cwd: "/tmp/ralph-...",         // 隔离工作区
    model: "claude-sonnet-4-20250514",
    maxTurns: 25,
    allowedTools: ["Bash", "Read", "Write", ...],
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    executable: "node",            // SDK 通过 node 启动 Claude Code CLI
    pathToClaudeCodeExecutable: "/home/leo/.npm-global/bin/claude",
    env: cleanEnv,                 // 移除 CLAUDECODE 避免嵌套会话冲突
    hooks: {
      PostToolUse: [{ hooks: [captureCallback] }]
    }
  }
})
```

### 工具调用捕获 (双保险)

1. **PostToolUse hook**: SDK 原生回调，每次工具执行后触发，记录 `tool_name`, `tool_input`, `tool_response`
2. **Assistant message 解析**: 从 `SDKAssistantMessage.message.content` 中提取 `tool_use` 块，作为 hook 未触发时的后备

### 超时与中止处理

- 每个场景有独立的 `AbortController` + `setTimeout`
- 超时时调用 `abortController.abort()` → `q.close()` 清理 SDK 子进程
- 内层 try/catch 捕获 abort 错误，避免一个超时场景崩掉整个循环
- 超时场景生成带 `"Timed out after Xms"` 错误的 `ScenarioResult`

---

## 6. 结构化对比引擎

`comparator.ts` 对两个 Runner 的产出做三个维度的比较：

### 6.1 工具集对比

比较两者调用的**核心工具集** (Write, Edit, Bash)，忽略只读工具 (Read, Grep, Glob) 的差异。工具名通过映射表归一化：

```
readFile → Read    writeFile → Write    editFile → Edit
listDirectory → Bash    grep → Grep    glob → Glob
```

### 6.2 文件 Artifact 对比

按文件类型做结构化 diff：

| 文件类型 | 比较方式 |
|----------|----------|
| `EMBEDDER.md` | 解析为 KV 对 → 逐字段比较 + 检查 `<OVERVIEW>` / `<COMMANDS>` 区块存在性 |
| `.c` / `.h` | 比较 `#include` 集合、函数签名列表、寄存器访问 (RCC/GPIO/TIM→字段) |
| `Makefile` | 比较 target 名称、编译器 flags (`-m*`)、内存布局 (FLASH/RAM ORIGIN+LENGTH) |
| 其他 | 行数差异超过 30% 时标记 |

### 6.3 相似度评分

综合加权评分 (0.0 ~ 1.0)：

| 维度 | 权重 | 计算方式 |
|------|------|----------|
| 工具集匹配 | 30% | 核心工具集是否相同 |
| Artifact 相似 | 40% | identical=1.0, modified=0.5, added/removed=0 |
| 成功一致性 | 20% | 两者是否同时成功或失败 |
| 调用序列 | 10% | LCS (最长公共子序列) / 平均长度 |

**通过条件**: `similarity >= 0.7 && toolSetMatch == true`

---

## 7. 十个场景

按嵌入式开发生命周期排列为 5 个阶段：

### Phase 1: 硬件识别 (Hardware Identification)

| # | 场景 | Prompt | 验证要点 | 需要硬件 |
|---|------|--------|----------|----------|
| 01 | ST-Link 探针 | 检测调试探针，识别 MCU/Flash/RAM | 调用 `st-info --probe`; 检测到 STM32G4; 输出 flash/RAM 大小 | 是 |
| 02 | 串口发现 | 枚举串口，检测波特率 | 列出 `/dev/ttyACM*`; 检测 115200 baud | 是 |

### Phase 2: 需求拆解 (Requirement Decomposition)

| # | 场景 | Prompt | 验证要点 | 需要硬件 |
|---|------|--------|----------|----------|
| 03 | EMBEDDER.md | 创建项目配置文件 | 包含 `<OVERVIEW>` + `<COMMANDS>` 区块; MCU=STM32G4; flash_command 含 openocd | 否 |
| 04 | 任务分解 | PA5 LED 1Hz 闪烁子任务 | 4-15 个子任务; 覆盖 RCC/GPIO/PA5/延时/主循环 | 否 |

### Phase 3: 硬件感知 RAG 召回

| # | 场景 | Prompt | 验证要点 | 需要硬件 |
|---|------|--------|----------|----------|
| 05 | 目录查询 | STM32G4 外设和引脚映射 | 识别 Cortex-M4F; 列出 GPIO/USART/SPI/I2C/TIM/ADC; 找到 PA5 | 否 |
| 06 | 文档搜索 | RCC_AHB2ENR 寄存器位定义 | 找到 RCC_AHB2ENR; 识别 GPIOAEN = bit 0; 偏移 0x4C | 否 |

### Phase 4: 代码实现

| # | 场景 | Prompt | 验证要点 | 需要硬件 |
|---|------|--------|----------|----------|
| 07 | GPIO 驱动 | 裸机 CMSIS PA5 闪烁驱动 | main.c 含 RCC→AHB2ENR / GPIOA→MODER / toggle; linker script; startup 向量表 | 否 |
| 08 | 构建系统 | STM32G431KB Makefile | arm-none-eabi-gcc; -mcpu=cortex-m4 -mthumb -mfloat-abi=hard; openocd flash | 否 |

### Phase 5: 烧录与验证

| # | 场景 | Prompt | 验证要点 | 需要硬件 |
|---|------|--------|----------|----------|
| 09 | 固件烧录 | 编译 + ST-Link 烧录 | 调用 make; openocd program verify reset exit | 是 |
| 10 | 串口验证 | 115200 baud 监控 10s | 正确端口 + 波特率; 含超时机制 | 是 |

**依赖关系**: 09 依赖 07+08; 10 依赖 09

---

## 8. 结果输出

每次运行生成：

```
ralph/results/<timestamp>/
├── summary.json              机器可读汇总
├── summary.md                人可读 Markdown 报告
├── scenario-01/
│   ├── ours.json             OurRunner 完整输出 (工具调用、artifacts、错误)
│   ├── theirs.json           TheirRunner 完整输出
│   ├── diff.json             结构化 diff (similarity、toolSetMatch、artifactDiffs)
│   └── validation.json       验证检查结果
├── scenario-02/
│   └── ...
└── ...
```

`results/latest` 是指向最新运行的 symlink。

### summary.md 示例

```markdown
| # | Scenario | Similarity | Tool Match | Validation | Status |
|---|----------|-----------|------------|------------|--------|
| 03 | EMBEDDER.md Init | 70.0% | yes | NO | FAIL |
| 07 | GPIO Driver Gen | 85.2% | yes | yes | PASS |
```

---

## 9. CLI 用法

```bash
# 迭代循环 — 所有场景，最多 10 轮
make ralph

# 迭代循环 — 只运行不需要硬件的 6 个场景
make ralph-no-hw

# 指定场景 + 迭代次数
make ralph-scenario S=03 I=5

# 单次运行 (不循环)
make ralph-once

# 查看最近报告
make ralph-report
```

### runner.ts 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `-s, --scenario <id>` | 只运行指定场景 (01-10) | 全部 |
| `-p, --phase <phase>` | 只运行指定阶段 | 全部 |
| `--no-hardware` | 跳过需要硬件的场景 | false |
| `-i, --max-iterations <n>` | 最大循环次数 | 10 |
| `--single-pass` | 单次运行不循环 | false |
| `-c, --continue-on-failure` | 失败继续 | loop 模式默认 true |
| `--dry-run` | 只列出场景不执行 | false |

---

## 10. 环境要求

| 依赖 | 要求 | 检查方式 |
|------|------|----------|
| Claude Code CLI | v2.x (`/home/leo/.npm-global/bin/claude`) | `claude --version` |
| API 认证 | `ANTHROPIC_AUTH_TOKEN` + `ANTHROPIC_BASE_URL` 在 `~/.bashrc` | `env \| grep ANTHROPIC` |
| Bun | 1.x | `bun --version` |
| ST-Link 工具 | `st-info` (stlink-tools) | `st-info --probe` |
| arm-none-eabi-gcc | 交叉编译工具链 | `arm-none-eabi-gcc --version` |
| OpenOCD | 烧录/调试 | `openocd --version` |
| 硬件 | STM32G4 开发板 + ST-Link (场景 01/02/09/10) | USB 连接 |

---

## 11. 与逆向工程的闭环

Ralph Loop 的核心价值在于**量化对齐度**，为后续逆向分析提供精确方向：

```
  逆向提取              重建实现               Ralph Loop
  ┌─────────┐          ┌─────────┐          ┌──────────────┐
  │ extracted│ ──参考──→│  src/   │ ──构建──→│ OurRunner    │
  │ /modules │          │ 骨架代码 │          │ (我们的 SP)  │
  └─────────┘          └─────────┘          └──────┬───────┘
       │                                           │
       │                                    ┌──────┴───────┐
       └───────── 真实 SP ────────────────→ │ TheirRunner  │
                                            │ (真实的 SP)  │
                                            └──────┬───────┘
                                                   │
                                            ┌──────┴───────┐
                                            │  diff.json   │
                                            │  similarity  │
                                            └──────┬───────┘
                                                   │
                                            差异指向需要深入
                                            逆向的模块/函数
                                                   │
                                                   ▼
                                            回到 extracted/
                                            modules/ 分析
```

**典型工作流**:

1. `make ralph-no-hw` → 运行 6 个软件场景
2. 查看 `results/latest/summary.md` → 找到 FAIL 的场景
3. 读取 `results/latest/scenario-XX/diff.json` → 找到具体 artifact 差异
4. 差异指向: 例如 `EMBEDDER.md` 缺少 `<OVERVIEW>` 区块 → 回到 `extracted/modules/lib_app.js` 行 84-158 分析 `txB` 模板
5. 改进 `src/` 重建代码或 `ralph/lib/agent.ts` 中的系统提示
6. 重新 `make ralph-no-hw` → 验证改进

### 关键逆向参考映射

| 场景 | 对齐目标 | 关键提取文件 |
|------|----------|-------------|
| 03 EMBEDDER.md | txB 模板格式 | `extracted/modules/lib_app.js:84-158` |
| 03 EMBEDDER.md | init_project 工具 | `extracted/modules/tools_init_project.js` |
| 04 任务分解 | TodoStatus 枚举 | `src/lib/tools/todo/todoTypes.ts` |
| 05 目录查询 | getCatalog() | `src/lib/catalog.ts` |
| 06 文档搜索 | 向量搜索 (模块 BZB) | `src/lib/tools/conversation/documentSearch.ts` |
| 07-08 代码生成 | 22 工具集 FZB | `extracted/modules/lib_app.js:182` |
| 10 串口监控 | port/baud/stop/timeout | `src/lib/tools/hardware/serialMonitor.ts` |

---

## 12. 已知限制

1. **系统提示差异**: OurRunner 的系统提示是手工重建的，与 txB 真实模板有格式差异 (如缺少 `<OVERVIEW>`/`<COMMANDS>` 标记)，这本身就是 Loop 要发现的问题
2. **工具集不对等**: 真实 embedder 有 16 个自定义工具 (FZB)，Ralph Loop 使用 Claude Code 内置工具 (Bash/Read/Write/Edit/Glob/Grep) 近似映射
3. **LLM 非确定性**: 同一 prompt 不同运行可能产出不同的工具调用序列，导致 similarity 波动
4. **硬件场景受限**: 场景 01/02/09/10 需要物理硬件连接，CI 环境无法运行
