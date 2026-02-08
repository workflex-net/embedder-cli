# 报告 1: 硬件识别 (Hardware Identification)

> embedder-cli v0.3.16 — HIL 流程逆向分析报告

## 1. 概述

硬件识别是 HIL（Hardware-in-Loop）链路的第一步：在用户连接开发板后，embedder 需要检测 MCU 型号、调试接口、串口设备和工具链版本。

**关键发现：embedder 没有专门的"硬件识别工具"**——它完全依赖通用 shell 工具 (Q1B) + LLM 的领域理解力来解析硬件信息。硬件感知是 AI agent 行为，不是硬编码逻辑。

## 2. 涉及模块清单

| 模块 ID | 文件 | 大小 | 功能 |
|---------|------|------|------|
| Q1B | `tools_shell.js` | 7.4MB | PTY Shell 执行引擎，支持交互式命令 |
| FZB | `lib_app.js:182` | — | 16 个工具白名单集合 |
| tVB | `tools_delegateSubagent.js` | 7.6K | 4 种子代理（codebase-explorer 可用于信息收集） |
| txB | `lib_app.js:84-158` | — | EMBEDDER.md 初始化模板（定义硬件字段） |

## 3. 核心实现逻辑

### 3.1 Shell 工具 (Q1B) — 硬件检测的基础

`tools_shell.js` 是一个 7.4MB 的巨型模块，包含完整的 PTY（伪终端）子进程管理。所有硬件识别操作都通过它执行系统命令。

#### ST-Link 探针检测

embedder 通过 shell 工具调用以下命令获取芯片信息：

```bash
st-info --probe
```

LLM 解析 stdout 中的关键字段：
- `chip id` → MCU 型号标识
- `flash` → Flash 大小
- `sram` → RAM 大小
- `chipid` → 芯片系列

#### 串口枚举

```bash
ls /dev/ttyACM* /dev/ttyUSB*
```

枚举所有可能的串口设备（ACM 用于 CDC 设备如 ST-Link 虚拟串口，USB 用于 FTDI/CH340 等转换器）。

#### 波特率检测

在 serial_monitor 工具 (TZB) 中定义了自动波特率探测函数 `z4(port, portInfo)`。常用波特率数组：

```
[9600, 19200, 38400, 57600, 115200]
```

非打印字符检测正则用于判断波特率是否匹配：
```javascript
/[\x00-\x08\x0E-\x1F\x7F-\u00FF]/
```

如果输出包含大量非打印字符，提示用户可能波特率不匹配。

#### 工具链检测

通过 shell 调用版本命令验证工具链安装：

```bash
arm-none-eabi-gcc --version
openocd --version
st-flash --version
```

### 3.2 FZB 工具白名单 (`lib_app.js:182`)

```javascript
FZB = new Set([
  "readFile", "listDirectory", "grep", "glob",
  "todoRead", "documentSearch", "codeSearch",
  "webSearch", "webFetch", "submitPlan",
  "askQuestion", "writeFile", "editFile", "lsp",
  "serialReadHistory", "delegateSubagent"
])
```

16 个工具组成 AI agent 的能力集。注意 `shell` 不在此白名单内——shell 工具 (`H6B`) 通过独立的注册路径加入完整工具集 `uJ`（共 22 个工具）。

### 3.3 EMBEDDER.md 模板中的硬件字段 (txB)

`/init` 命令触发的模板 (`txB`, `lib_app.js:84-158`) 定义了需要采集的硬件信息：

```
Target MCU = <chip or family>
Board = <board>
Toolchain = <toolchain>
Debug Interface = <st-link|jlink|serial>
RTOS / SDK = <freertos|zephyr|sdk>
```

模板要求 AI 使用 `askQuestion` 工具主动询问用户无法从代码库推断的信息（MCU 型号、开发板、工具链偏好等）。

### 3.4 delegateSubagent 的角色

`codebase-explorer` 子代理可用于分析项目结构来推断硬件信息（如从 Makefile、linker script、CMakeLists.txt 中提取 MCU 型号）。子代理是只读的，拥有独立上下文窗口。

## 4. 关键函数/变量映射表

| 混淆名 | 推测原名 | 位置 | 功能 |
|--------|---------|------|------|
| Q1B | `tools_shell` 模块 | tools_shell.js | Shell 工具完整模块 |
| H6B | `shellTool` | tools_todoWrite.js (uJ) | Shell 工具实例 |
| FZB | `allowedToolsSet` | lib_app.js:182 | 16 个工具白名单 |
| txB | `initTemplate` | lib_app.js:84-158 | EMBEDDER.md 初始化模板 |
| z4 | `autoDetectBaudRate` | tools_writeFile.js | 自动波特率探测 |
| MW | `getDefaultPort` | tools_writeFile.js | 获取默认串口 |
| FG | `listSerialPorts` | tools_writeFile.js | 列举所有串口 |
| ZI | `SharedSerialManager` | lib_app.js | 串口连接管理器单例 |

## 5. 与 src/ 骨架的差异对比

| 方面 | embedder 原始实现 | 我们的 src/ 骨架 |
|------|------------------|-----------------|
| 硬件检测方式 | 纯 AI agent 行为，通过 shell + LLM 理解 | 需要实现 |
| MCU 识别 | AI 调用 `st-info --probe` 并解析输出 | 可硬编码解析器 |
| 串口发现 | `ls /dev/tty*` + z4 自动波特率 | 需要实现 |
| 工具链检测 | shell 执行 `--version` 命令 | 可硬编码检查 |
| 硬件信息存储 | EMBEDDER.md 文本文件 | 需要实现 |

## 6. 逆向改进建议

1. **可考虑专用硬件检测模块**：虽然 embedder 依赖 AI 理解力，但我们可以实现结构化的硬件检测器（如解析 `st-info --probe` 输出为 JSON），减少 LLM token 消耗。

2. **串口枚举应使用原生 API**：embedder 的 `FG()` 函数可能内部调用了 Rust FFI (lib_serial.js)，比 `ls /dev/tty*` 更可靠（能获取 VID/PID 信息）。

3. **波特率检测可优化**：embedder 的 `z4()` 逐一尝试 `commonBaudRates`，可以用更智能的策略（如先尝试 115200，它是最常见的嵌入式波特率）。

4. **EMBEDDER.md 可升级为结构化格式**：当前的 key=value 文本格式容易被 LLM 误解析，可考虑 YAML/TOML。
