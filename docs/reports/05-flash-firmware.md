# 报告 5: 固件烧录 (Flash Firmware)

> embedder-cli v0.3.16 — HIL 流程逆向分析报告

## 1. 概述

固件烧录是 HIL 链路的关键部署步骤：编译完成后将二进制固件写入目标 MCU 的 Flash 存储器。

**关键发现：embedder 没有内建编译器或烧录器——它只是一个"能调用 shell 的 AI agent"。** 所有编译/烧录知识来自 EMBEDDER.md 配置 + AI 的领域知识，通过通用 shell 工具 (Q1B) 执行。

## 2. 涉及模块清单

| 模块 ID | 文件 | 大小 | 功能 |
|---------|------|------|------|
| Q1B | `tools_shell.js` | 7.4MB | PTY Shell 执行引擎 |
| txB | `lib_app.js:84-158` | — | EMBEDDER.md 模板（定义 build/flash 命令） |
| H6B | `tools_todoWrite.js` (uJ) | — | Shell 工具实例引用 |

## 3. 核心实现逻辑

### 3.1 Shell 工具 (Q1B) — 编译烧录的唯一通道

`tools_shell.js` 是一个 7.4MB 的巨型模块（gzip 压缩存储），包含：
- 完整的 PTY（伪终端）子进程管理
- 命令执行、输出捕获、超时控制
- 交互式终端支持

shell 工具在工具注册表 `uJ` 中以 `H6B` 引用：
```javascript
uJ = {
  // ...
  shell: H6B,
  // ...
};
```

注意：shell 不在 FZB 白名单（16 个工具）中，但在完整工具集 `uJ`（22 个工具）中。这意味着 **Plan 模式下不能执行 shell 命令**（只有 Act 模式可以）。

### 3.2 编译流程

#### 3.2.1 EMBEDDER.md 中的 build_command

```
<COMMANDS>
# --- Build / Compile --------------------------------------------------------
build_command = make
# 或
build_command = cmake --build build/
# 或
build_command = cargo build --release --target thumbv7em-none-eabihf
```

#### 3.2.2 AI Agent 执行编译

典型的 AI 执行流程：

```
1. AI 读取 EMBEDDER.md（readFile 工具）
2. 解析 build_command 字段
3. 通过 shell 工具执行命令
4. 分析 stdout/stderr 输出
5. 如果编译失败：
   - 解析错误信息
   - 定位源文件和行号
   - 使用 editFile 修复代码
   - 重新编译
```

AI 没有硬编码的编译逻辑——它依赖 LLM 理解力来解析编译器输出并采取行动。

### 3.3 烧录流程

#### 3.3.1 EMBEDDER.md 中的 flash_command

```
<COMMANDS>
# --- Flash ------------------------------------------------------------------
flash_command = openocd -f interface/stlink.cfg -f target/stm32g4x.cfg \
  -c "program build/firmware.elf verify reset exit"
# 或
flash_command = st-flash write build/firmware.bin 0x08000000
# 或
flash_command = pyocd flash build/firmware.hex
# 或
flash_command = cargo flash --chip STM32G431CBUx
```

#### 3.3.2 AI Agent 执行烧录

```
1. AI 确认编译成功（检查 build 输出）
2. 读取 EMBEDDER.md 中的 flash_command
3. 通过 shell 工具执行烧录命令
4. 解析烧录输出：
   - 成功：看到 "verify OK" / "Programming Complete"
   - 失败：分析错误（连接失败、Flash 锁定等）
5. 如果失败，AI 可能尝试：
   - 检查 ST-Link 连接状态
   - 尝试解锁 Flash
   - 建议用户检查接线
```

### 3.4 Debug 配置

EMBEDDER.md 还定义了调试配置：

```
<COMMANDS>
# --- Debug ------------------------------------------------------------------
gdb_server_command = openocd -f interface/stlink.cfg -f target/stm32g4x.cfg
gdb_server_host = localhost
gdb_server_port = 61234
gdb_client_command = arm-none-eabi-gdb
target_connection = remote
```

AI 可以通过 shell 启动 GDB server，但 embedder 目前没有内建的 GDB 集成——调试也是通过 shell 工具 + LLM 理解力实现。

### 3.5 Shell 工具在 uJ 注册表中的位置

```javascript
// tools_todoWrite.js — gz() 函数注册所有工具
uJ = {
  readFile:            oZB,
  writeFile:           XZB,
  editFile:            KZB,
  listDirectory:       xZB,
  grep:                rZB,
  shell:               H6B,    // ← shell 工具
  glob:                $ZB,
  todoRead:            R6B,
  todoWrite:           Y6B,
  askQuestion:         pVB,
  documentSearch:      AZB,
  codeSearch:          rVB,
  webSearch:           IZB,
  webFetch:            gZB,
  serialMonitor:       NZB,
  serialReadHistory:   yZB,
  serialSendCommand:   qZB,
  compressConversation: _xB,
  initProject:         $xB,
  submitPlan:          _ZB,
  lsp:                 A6B,
  delegateSubagent:    uVB
};
```

共 22 个工具。shell (H6B) 是唯一的外部命令执行通道。

### 3.6 编译烧录错误恢复

由于编译和烧录完全是 AI agent 行为，错误恢复也依赖 LLM：

| 错误类型 | AI 的典型响应 |
|---------|-------------|
| 编译错误 | 解析 `error:` 行，定位文件和行号，使用 editFile 修复 |
| 链接错误 | 分析未定义符号，检查 Makefile/CMakeLists.txt |
| Flash 连接失败 | 建议检查 ST-Link 连接、驱动安装 |
| Flash 写入失败 | 尝试 `st-flash erase` 或建议用户手动解锁 |
| 权限错误 | 建议添加 udev 规则或使用 sudo |

## 4. 关键函数/变量映射表

| 混淆名 | 推测原名 | 位置 | 功能 |
|--------|---------|------|------|
| Q1B | `shellModule` | tools_shell.js | Shell 工具完整模块 (7.4MB) |
| H6B | `shellTool` | tools_todoWrite.js (uJ) | Shell 工具实例 |
| txB | `initTemplate` | lib_app.js:84-158 | EMBEDDER.md 模板 |
| uJ | `toolRegistry` | tools_todoWrite.js | 完整工具注册表 |
| FZB | `allowedToolsSet` | lib_app.js:182 | 16 工具白名单（不含 shell） |

## 5. 与 src/ 骨架的差异对比

| 方面 | embedder 原始实现 | 我们的 src/ 骨架 |
|------|------------------|-----------------|
| 编译 | shell + EMBEDDER.md 中的 build_command | 需要实现 |
| 烧录 | shell + EMBEDDER.md 中的 flash_command | 需要实现 |
| 调试 | shell + EMBEDDER.md 中的 gdb 配置 | 需要实现 |
| 错误恢复 | 纯 AI agent 行为 | 可硬编码常见错误模式 |
| 进度展示 | PTY 原始输出流 | 需要实现 |
| Shell 引擎 | 7.4MB PTY 模块（含 node-pty） | 需要实现 |

## 6. 逆向改进建议

1. **结构化编译输出解析**：embedder 让 LLM 直接阅读编译器输出。我们可以实现 GCC/Clang 输出的结构化解析器（提取文件名、行号、错误类型），减少 token 消耗并提高准确性。

2. **烧录进度监控**：当前 shell 只返回最终输出。我们可以解析 OpenOCD/st-flash 的进度输出（如 Flash 写入百分比），提供实时进度条。

3. **编译缓存感知**：embedder 不区分全量编译和增量编译。我们可以检测 Make/CMake 的缓存状态，在只有小改动时只重新编译变更的文件。

4. **烧录前验证**：在执行 flash_command 前，可以自动检查：
   - 二进制文件是否存在
   - 文件大小是否合理（不超过 MCU Flash 大小）
   - ST-Link/J-Link 是否连接
   - Flash 是否被写保护

5. **多目标支持**：EMBEDDER.md 当前只支持单一 build/flash 命令。可以扩展为多目标配置（如 debug/release build，不同的 Flash 方式）。

6. **Shell 模块瘦身**：7.4MB 的 shell 模块过于庞大。可以评估是否需要完整的 PTY 支持，或者简单的 `child_process.exec` 就够用。
