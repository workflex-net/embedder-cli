# 报告 2: 需求拆解 (Requirement Decomposition)

> embedder-cli v0.3.16 — HIL 流程逆向分析报告

## 1. 概述

需求拆解是 HIL 链路的第二步：用户描述项目需求后，embedder 将其分解为结构化的项目配置（EMBEDDER.md）和可执行的任务列表（TODO）。此流程涉及项目初始化、任务分解、和 Plan/Act 双模式架构。

## 2. 涉及模块清单

| 模块 ID | 文件 | 大小 | 功能 |
|---------|------|------|------|
| Z7 | `tools_init_project.js` | 10.7K | init_project 工具 — EMBEDDER.md 初始化 |
| J6B | `tools_todoWrite.js` | 13.6K | TODO 管理 + 工具注册表 (uJ) |
| tZB | `tools_submitPlan.js` | 5.9K | 计划提交 + Plan/Act 模式切换 |
| ZKA | `tools_askQuestion.js` | — | 用户交互问答（多选/单选） |
| txB | `lib_app.js:84-158` | — | EMBEDDER.md 初始化模板 |
| lxB | `lib_app.js:84` | — | `/init` 命令入口函数 |

## 3. 核心实现逻辑

### 3.1 EMBEDDER.md 初始化流程

#### 3.1.1 `/init` 命令触发链

```
用户输入 /init
  → mxB() 命令注册表中 name:"init" 的 action
    → lxB() 异步函数
      → modeHandler("act")       // 强制切换到 act 模式
      → autoApprovalHandler(true) // 开启自动批准（跳过确认对话框）
      → initPromptHandler(txB, "/init")  // 注入 txB 模板作为 prompt
      → setInitInProgress(true)   // 标记初始化进行中
```

关键代码 (`lib_app.js:84`)：
```javascript
async function lxB() {
  let A = yB.getState(), B = A.modeHandler;
  if (B) B("act");              // 切换到 act 模式
  let Q = A.autoApprovalHandler;
  if (Q) Q(true);               // 自动批准所有工具调用
  let E = A.initPromptHandler;
  // ...
  A.setInitInProgress(true);
  await E(txB, "/init");         // 注入模板 prompt
  return { success: true };
}
```

#### 3.1.2 txB 模板内容

模板 (`lib_app.js:84-158`) 指导 AI 执行以下步骤：

1. **信息收集阶段**：使用 `askQuestion` 工具询问用户缺失信息
   - Target MCU/chip family
   - Development board
   - Build system and toolchain preferences
   - Debug interface (ST-Link, J-Link, serial)
   - Serial port and baudrate

2. **文件创建阶段**：使用 `writeFile` 创建 EMBEDDER.md，包含两个核心区块：

**`<OVERVIEW>` 区块**：
```
Name = MyProject
Target MCU = <chip or family>
Board = <board>
Toolchain = <toolchain>
Debug Interface = <st-link|jlink|serial>
RTOS / SDK = <freertos|zephyr|sdk>
Project Summary = <one-line description>
```

**`<COMMANDS>` 区块**：
```
build_command = <shell command to build>
flash_command = <shell command to flash>
gdb_server_command = <optional>
gdb_server_host = localhost
gdb_server_port = 61234
gdb_client_command = arm-none-eabi-gdb
target_connection = remote
serial_port = /dev/ttyACM0
serial_baudrate = 115200
serial_monitor_command = tio {port} -b {baud}
serial_monitor_interactive = false
serial_encoding = ascii
serial_startup_commands = []
```

3. **文档推荐阶段**：初始化完成后建议用户上传相关文档
   - 开发板数据手册
   - MCU 数据手册和勘误表
   - 外设数据手册和应用笔记

#### 3.1.3 init_project 工具 (Z7)

```javascript
// tools_init_project.js
$xB = dE({
  metadata: {
    name: "init_project",
    displayName: "Initialize Project",
    description: "Initialize the project by creating or improving an EMBEDDER.md...",
    category: "system",
    requiresConfirmation: false  // 不需要用户确认
  },
  inputSchema: S.object({}),     // 无输入参数
  execute: async () => {
    let A = yB.getState().initHandler;
    let B = await A();
    if (B.success) {
      return {
        success: true,
        llmContent: `${txB}\n\nPlease now analyze the codebase and create the EMBEDDER.md file...`
      };
    }
  }
});
```

### 3.2 任务分解机制 — todoWrite (J6B)

#### 3.2.1 TODO 数据结构

```javascript
// 状态机：pending → in_progress → completed | cancelled
// Xg 枚举定义状态值
{
  id: string,          // 唯一标识符（G6B() 生成）
  content: string,     // 任务描述（非空）
  status: "pending" | "in_progress" | "completed" | "cancelled"
}
```

#### 3.2.2 核心约束

1. **唯一 ID**：每个 TODO 必须有唯一 ID，重复 ID 会被拒绝
2. **非空内容**：content 不能为空字符串
3. **单一进行中**：同一时间只能有一个 `in_progress` 任务
4. **会话级存储**：通过 `ZF()` 获取 session ID，`AN()` 持久化

#### 3.2.3 todoWrite 验证逻辑

```javascript
validateParams: ({ todos: A }) => {
  for (let E of A) {
    if (!E.content || E.content.trim().length === 0)
      return "All todo items must have non-empty content";
    if (!E.id || E.id.trim().length === 0)
      return "All todo items must have an ID";
  }
  let B = A.map(E => E.id);
  if (B.length !== new Set(B).size)
    return "Todo items must have unique IDs";
  if (A.filter(E => E.status === Xg.IN_PROGRESS).length > 1)
    return "Only one todo can be 'in_progress' at a time";
  return null;
}
```

#### 3.2.4 存储机制

```javascript
// ZF() — 获取当前 session ID
function ZF() { return yB.getState().currentSessionId; }

// AN() — 持久化 TODO 列表到 session
function AN(A, B) { yB.getState().setTodos(A, B); }
```

TODO 数据随会话保存到本地文件系统（conversations 目录下的 JSON 文件）。

### 3.3 Plan/Act 模式

#### 3.3.1 双模式架构

embedder 有两种操作模式：

- **Plan 模式**：只读探索 + 写计划文件，不能修改项目文件
- **Act 模式**：完全权限，可以编辑文件、执行 shell 命令

#### 3.3.2 submitPlan 工具 (tZB)

```javascript
_ZB = dE({
  metadata: {
    name: "submitPlan",
    displayName: "Submit Plan",
    description: "Submit your plan for user approval..."
  },
  execute: async (A, B) => {
    // 1. 验证 session 信息
    let Q = aU(B.projectRoot, B.sessionSlug, B.sessionCreatedAt);

    // 2. 验证计划文件存在
    let E = Bun.file(Q);
    if (!await E.exists()) return { success: false, ... };

    // 3. 验证计划长度 >= 50 字符
    let g = await E.text();
    if (g.length < 50) return { success: false, ... };

    // 4. 通过 questionHandler 展示给用户
    let w = {
      questions: [{
        question: "Do you approve this plan?",
        options: [{
          label: "Approve and Execute",
          description: "Switch to act mode and begin implementing"
        }]
      }],
      markdownContent: g,  // 计划内容以 Markdown 渲染
      customInputLabel: "Tell embedder to do something different",
    };

    // 5. 处理用户选择
    let H = await C(w);
    if (H.isCustom) {
      // 用户提供新指令 → redirectPromptHandler
      R(H.answers[0]);
    } else if (H.answers[0] === "Approve and Execute") {
      // 切换到 act 模式
      I("act");
      // 注入 plan 执行 prompt
      U(g);  // planExecutionHandler
    }
  }
});
```

#### 3.3.3 Plan 模式文件权限控制

`Cz()` 函数检查 Plan 模式下的文件编辑权限：

```javascript
// writeFile 中的检查
let C = Cz("writeFile", Q.mode ?? "act", E, {
  projectRoot: g,
  sessionSlug: Q.sessionSlug,
  createdAt: Q.sessionCreatedAt
});
// 如果在 plan 模式下尝试编辑非计划文件，返回 false
```

计划文件路径由 `aU(projectRoot, sessionSlug, createdAt)` 生成，确保每个会话有独立的计划文件。

#### 3.3.4 Plan Mode System Prompt

Plan 模式下注入的系统提示 (`jZB`)：

```
Plan mode is active. You MUST NOT make any edits (with the exception of
the plan file), run any non-readonly tools, or otherwise make any changes.

Enhanced Planning Workflow:
- Phase 1: Initial Understanding (launch up to 5 explorer agents IN PARALLEL)
- Phase 2: Planning (write plan using writeFile)
- Phase 3: Synthesis (use askQuestion for trade-offs)
- Phase 4: Final Plan (update plan file)
- Phase 5: Call submitPlan
```

### 3.4 工具可用性过滤

```javascript
// RHE() — 根据模式过滤可用工具
function RHE(A) {
  if (A === "act") return uJ;  // act 模式返回全部 22 个工具
  return Object.fromEntries(
    Object.entries(uJ).filter(([Q]) => LZB(Q, A))
  );  // plan 模式只返回只读工具子集
}
```

## 4. 关键函数/变量映射表

| 混淆名 | 推测原名 | 位置 | 功能 |
|--------|---------|------|------|
| Z7 | `initProjectModule` | tools_init_project.js | init_project 工具模块 |
| $xB | `initProjectTool` | tools_init_project.js | init_project 工具实例 |
| txB | `initTemplate` | lib_app.js:84-158 | EMBEDDER.md 初始化模板 |
| lxB | `runInit` | lib_app.js:84 | /init 命令入口 |
| J6B | `todoWriteModule` | tools_todoWrite.js | todoWrite 工具模块 |
| Y6B | `todoWriteTool` | tools_todoWrite.js | todoWrite 工具实例 |
| tZB | `submitPlanModule` | tools_submitPlan.js | submitPlan 工具模块 |
| _ZB | `submitPlanTool` | tools_submitPlan.js | submitPlan 工具实例 |
| Xg | `TodoStatus` | tools_todoWrite.js | TODO 状态枚举 |
| ZF | `getSessionId` | lib_app.js | 获取当前会话 ID |
| AN | `persistTodos` | lib_app.js | 持久化 TODO 列表 |
| Cz | `checkPlanModePermission` | lib_app.js | Plan 模式权限检查 |
| aU | `getPlanFilePath` | lib_app.js | 获取计划文件路径 |
| jZB | `planModeSystemPrompt` | tools_writeFile.js:94-155 | Plan 模式系统提示 |
| uJ | `toolRegistry` | tools_todoWrite.js | 完整工具注册表（22 个） |
| RHE | `getToolsForMode` | tools_todoWrite.js | 按模式过滤工具 |
| mxB | `createCommands` | lib_app.js | 斜杠命令注册工厂 |

## 5. 与 src/ 骨架的差异对比

| 方面 | embedder 原始实现 | 我们的 src/ 骨架 |
|------|------------------|-----------------|
| 项目初始化 | txB 模板 + askQuestion 交互式采集 | 需要实现 |
| 配置格式 | EMBEDDER.md (key=value 文本) | 需要实现 |
| 任务管理 | todoWrite 结构化 TODO，会话级持久化 | 需要实现 |
| 模式切换 | Plan/Act 双模式 + submitPlan 审批流 | 需要实现 |
| 工具权限 | Plan 模式自动过滤为只读子集 | 需要实现 |
| 计划审批 | Markdown 渲染 + 两个选项（批准/重定向） | 需要实现 |

## 6. 逆向改进建议

1. **EMBEDDER.md 可改用 YAML/TOML**：当前 key=value 格式缺乏层次结构，解析容易出错。YAML 可以支持更复杂的配置（如多个串口、多 target 构建等）。

2. **TODO 管理应支持层级**：当前 TODO 是扁平列表，缺少父子关系。嵌入式项目经常需要层次化任务分解（如"初始化 SPI 外设"→"配置 GPIO"→"配置 DMA"→"编写驱动"）。

3. **Plan 模式可增加 diff 预览**：在用户批准计划前，展示计划执行后可能变更的文件列表，提升用户信心。

4. **`/init` 命令可支持模板选择**：不同项目类型（bare-metal、RTOS、Arduino）可以有不同的初始化模板。

5. **自动检测现有配置**：如果项目已有 CMakeLists.txt 或 Makefile，应自动提取 build/flash 命令，减少用户手动输入。
