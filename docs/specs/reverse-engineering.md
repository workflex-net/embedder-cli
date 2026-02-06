# Embedder CLI v0.3.16 — 逆向分析报告

## 1. 二进制概况

| 属性             | 值                                      |
| ---------------- | --------------------------------------- |
| 文件             | embedder-cli-linux                      |
| 大小             | 125 MB                                  |
| 格式             | ELF 64-bit LSB executable, x86-64       |
| 链接方式         | 动态链接 (glibc)                        |
| Strip 状态       | **未 strip** (保留符号表)               |
| 打包工具         | **Bun compile** (单文件可执行)          |
| Trailer 标识     | `\n---- Bun! ----\n` @ offset 0x7c9a96f |
| 嵌入条目数       | 12                                      |

### 动态库依赖

```
libc.so.6
ld-linux-x86-64.so.2
libpthread.so.0
libdl.so.2
libm.so.6
```

无额外 native 依赖，运行在标准 Linux glibc 环境。

---

## 2. 内部架构

Embedder CLI 是用 **Bun + TypeScript + React (Ink/OpenTUI)** 构建的终端 AI 编码助手，专为嵌入式固件开发设计。

### 打包方式

```
[Bun 运行时二进制 ~102MB] + [JS Bundle + Assets ~23MB] + [Bun Trailer]
```

使用 `bun compile` 将整个 Node.js 应用打包为单文件可执行文件。JS 源码以 **minified 但未编译为字节码** 的形式嵌入，可直接提取。

### 嵌入的 JS Bundle

| 区域           | 偏移                | 大小     | 内容                   |
| -------------- | ------------------- | -------- | ---------------------- |
| 主 Bundle      | 0x6143311           | ~20 MB   | 完整应用代码 (minified)|
| 辅助数据块     | 0x753dcd6+          | ~3 MB    | Tree-sitter 语法、资源 |

主 Bundle 以 `// @bun` 注释开头，是一个 Bun bundler 生成的单文件 JS 模块。

---

## 3. 项目元数据

```
name:    embedder-cli-v3
version: 0.3.16
module:  src/index.tsx
type:    module
```

### 构建工具链

| 工具       | 用途               |
| ---------- | ------------------ |
| Bun        | 运行时 + 打包器    |
| Biome      | 代码格式化 + Lint  |
| TypeScript | 类型检查           |
| Cargo      | 原生 serial FFI 编译 |

### 构建脚本

```
bun run embed:serial   → 嵌入串口 FFI 库
bun run embed:assets   → 嵌入静态资源
bun run scripts/build.ts → 最终编译
```

支持的编译目标:
- `bun-linux-x64`
- `bun-linux-x64-baseline`
- `bun-windows-x64`
- `bun-darwin-x64`
- `bun-darwin-arm64`

---

## 4. 原始源码目录结构 (172 个文件)

从 bundle 中提取到的原始 TypeScript 源码路径:

```
src/
├── index.tsx                          # 应用入口
├── main.ts                            # 主函数
│
├── pages/                             # 页面 (React/Ink 组件)
│   ├── Main.tsx                       # 主聊天页面
│   ├── Authentication.tsx             # 登录认证
│   ├── Welcome.tsx                    # 欢迎页
│   ├── ChipSelector.tsx               # 芯片选择器
│   ├── ModelSelector.tsx              # AI 模型选择
│   ├── PeripheralSelector.tsx         # 外设选择器
│   ├── KeybindingSelector.tsx         # 快捷键配置
│   ├── ThemeSelector.tsx              # 主题选择
│   ├── ThreadSelector.tsx             # 会话选择
│   ├── ResumeConversation.tsx         # 恢复会话
│   ├── TasksView.tsx                  # 任务视图
│   ├── PlanRequired.tsx               # 计划模式
│   ├── ProjectLimit.tsx               # 项目限制提示
│   ├── SelectProject.tsx              # 项目选择
│   ├── SelectTeam.tsx                 # 团队选择
│   ├── CreateProject.tsx              # 创建项目
│   ├── AddCustomPeripheral.tsx        # 添加自定义外设
│   ├── AddCustomPlatform.tsx          # 添加自定义平台
│   ├── Loading.tsx                    # 加载页
│   └── Error.tsx                      # 错误页
│
├── components/                        # UI 组件
│   ├── chat/
│   │   ├── ChatContainer.tsx          # 聊天容器
│   │   ├── ChatInput.tsx              # 输入框
│   │   ├── MessageEntry.tsx           # 消息条目
│   │   ├── ScrollableBox.tsx          # 滚动容器
│   │   ├── ConfirmationInput.tsx      # 确认输入
│   │   ├── BashOutputPanel.tsx        # Bash 输出面板
│   │   ├── BashExecutionDisplay.tsx   # Bash 执行展示
│   │   ├── HelpPanel.tsx              # 帮助面板
│   │   └── StatusBar.tsx              # 状态栏
│   ├── tools/
│   │   ├── DiffView.tsx               # 差异视图
│   │   ├── FullscreenDiffView.tsx     # 全屏差异
│   │   ├── ToolMessage.tsx            # 工具消息展示
│   │   ├── ToolGroup.tsx              # 工具分组
│   │   ├── statusUtils.ts             # 状态工具
│   │   └── index.ts
│   ├── markdown/
│   │   ├── MarkdownDisplay.tsx        # Markdown 渲染
│   │   ├── TableRenderer.tsx          # 表格渲染
│   │   └── index.ts
│   ├── rewind/
│   │   ├── RewindInterface.tsx        # 回退界面
│   │   ├── RewindListItem.tsx         # 回退列表项
│   │   └── index.ts
│   ├── serial/
│   │   ├── PortSwitcherPopup.tsx      # 串口切换弹窗
│   │   ├── SerialTerminalSidebar.tsx  # 串口终端侧边栏
│   │   └── index.ts
│   ├── ErrorBoundary.tsx
│   ├── Corner.tsx
│   ├── CommandSuggestions.tsx          # 命令建议
│   ├── FileSuggestions.tsx             # 文件建议
│   ├── QuestionPanel.tsx              # 问答面板
│   └── SearchableSelect.tsx           # 可搜索选择器
│
├── context/                           # React Context 状态管理
│   ├── AIContext.tsx                   # AI 模型/对话上下文
│   ├── AuthContext.tsx                 # 认证上下文 (Firebase)
│   ├── SessionContext.tsx             # 会话上下文
│   ├── UserContext.tsx                # 用户上下文
│   ├── TeamsContext.tsx               # 团队上下文
│   ├── ProjectsContext.tsx            # 项目上下文
│   ├── BillingContext.tsx             # 计费上下文
│   ├── ModeContext.tsx                # 模式 (act/plan) 上下文
│   ├── SerialContext.tsx              # 串口上下文
│   ├── ThemeContext.tsx               # 主题上下文
│   ├── ToolContextProvider.tsx        # 工具上下文
│   ├── ToolQueueContext.tsx           # 工具队列上下文
│   ├── ToolStreamingContext.tsx       # 工具流式上下文
│   ├── TreeSitterContext.tsx          # Tree-sitter 上下文
│   ├── KeybindingContext.tsx          # 快捷键上下文
│   ├── FocusContext.tsx               # 焦点上下文
│   ├── ToastContext.tsx               # Toast 提示
│   ├── CommandsContext.tsx            # 命令上下文
│   ├── FilesContext.tsx               # 文件上下文
│   ├── InputModeContext.tsx           # 输入模式上下文
│   ├── ContentDimensionsContext.tsx   # 内容尺寸
│   ├── AppStateContext.tsx            # 应用状态
│   └── CallbackRegistryContext.tsx    # 回调注册
│
├── lib/                               # 核心业务逻辑
│   ├── tools/                         # AI 工具系统
│   │   ├── core/
│   │   │   ├── engine.ts              # 工具执行引擎
│   │   │   ├── createTool.ts          # 工具工厂函数
│   │   │   ├── registry.ts            # 工具注册表
│   │   │   ├── modeUtils.ts           # 模式工具
│   │   │   └── subagentUtils.ts       # 子 Agent 工具
│   │   ├── file/
│   │   │   ├── readFile.ts            # 读文件工具
│   │   │   ├── writeFile.ts           # 写文件工具
│   │   │   ├── editFile.ts            # 编辑文件工具
│   │   │   └── listDirectory.ts       # 列目录工具
│   │   ├── search/
│   │   │   ├── glob.ts                # Glob 搜索
│   │   │   ├── grep.ts                # Grep 搜索
│   │   │   └── lsp.ts                 # LSP 搜索
│   │   ├── system/
│   │   │   ├── shell.ts               # Shell 执行
│   │   │   └── safeCommands.ts        # 安全命令白名单
│   │   ├── conversation/
│   │   │   ├── askQuestion.ts         # 交互式问答
│   │   │   ├── codeSearch.ts          # 代码搜索
│   │   │   ├── documentSearch.ts      # 文档搜索 (向量嵌入)
│   │   │   ├── webFetch.ts            # 网页获取
│   │   │   ├── webSearch.ts           # 网络搜索
│   │   │   └── compressConversation.ts # 上下文压缩
│   │   ├── hardware/
│   │   │   ├── serialMonitor.ts       # 串口监控
│   │   │   ├── serialReadHistory.ts   # 串口历史读取
│   │   │   └── serialSendCommand.ts   # 串口发送命令
│   │   ├── agent/
│   │   │   └── delegateSubagent.ts    # 子 Agent 委派
│   │   ├── mode/
│   │   │   ├── prompts.ts             # 模式提示词
│   │   │   └── submitPlan.ts          # 提交计划
│   │   ├── todo/
│   │   │   ├── todoRead.ts            # TODO 读取
│   │   │   ├── todoWrite.ts           # TODO 写入
│   │   │   ├── todoState.ts           # TODO 状态
│   │   │   └── todoTypes.ts           # TODO 类型
│   │   └── project/
│   │       └── initProject.ts         # 项目初始化
│   │
│   ├── lsp/                           # LSP 客户端
│   │   ├── client.ts                  # LSP 客户端
│   │   ├── server.ts                  # LSP 服务端管理
│   │   ├── language.ts                # 语言检测
│   │   └── index.ts
│   │
│   ├── serial/                        # 硬件串口通信 (FFI)
│   │   ├── SerialPort.ts             # 串口封装
│   │   ├── ffi.ts                     # Bun FFI 绑定 (Rust)
│   │   ├── embeddedLibrary.ts         # 嵌入的 .so/.dylib
│   │   ├── baudDetection.ts           # 波特率检测
│   │   ├── sharedSerialManager.ts     # 串口管理器
│   │   ├── textProcessing.ts          # 串口文本处理
│   │   └── index.ts
│   │
│   ├── treeSitter/                    # 语法分析
│   │   ├── grammars.ts                # 语法加载
│   │   ├── embeddedAssets.ts          # 嵌入的 .wasm 资源
│   │   └── init.ts                    # 初始化
│   │
│   ├── stores/                        # Zustand 状态管理
│   │   ├── contextStore.ts            # 上下文 Store
│   │   ├── documentsStore.ts          # 文档 Store
│   │   ├── serialStore.ts             # 串口 Store
│   │   └── updateStore.ts             # 更新 Store
│   │
│   ├── batts/                         # 遥测/分析 (BATTS)
│   │   ├── client.ts                  # 遥测客户端
│   │   ├── queue.ts                   # 事件队列
│   │   └── index.ts
│   │
│   ├── services/
│   │   ├── compression.ts             # 上下文压缩服务
│   │   ├── snapshot.ts                # 快照服务
│   │   ├── bugReport.ts               # Bug 报告
│   │   └── documentUpload.ts          # 文档上传
│   │
│   ├── inputModes/
│   │   ├── bashMode.ts                # Bash 输入模式
│   │   ├── serialMode.ts              # 串口输入模式
│   │   └── index.ts
│   │
│   ├── keybindings/
│   │   └── defaults.ts                # 默认快捷键 (Emacs/Vim)
│   │
│   ├── bus/index.ts                   # 事件总线
│   ├── cli.ts                         # CLI 参数处理
│   ├── config.ts                      # 配置管理
│   ├── logger.ts                      # 日志 (Winston)
│   ├── firebase.ts                    # Firebase 集成
│   ├── sentry.ts                      # Sentry 错误追踪
│   ├── paths.ts                       # 路径常量
│   ├── storage.ts                     # 本地存储
│   ├── catalog.ts                     # 芯片/外设目录
│   ├── clipboard.ts                   # 剪贴板
│   ├── contextMessages.ts             # 上下文消息构建
│   ├── conversations.ts               # 会话管理
│   ├── commandDefinitions.ts          # 命令定义
│   ├── environment.ts                 # 环境检测
│   ├── exit.ts                        # 退出处理
│   ├── fileMentions.ts                # 文件引用
│   ├── folderStructure.ts             # 目录结构
│   ├── format.ts                      # 格式化
│   ├── git.ts                         # Git 操作
│   ├── globalStore.ts                 # 全局 Store
│   ├── keySymbols.ts                  # 按键符号
│   ├── lipsumData.ts                  # 测试数据
│   ├── lspBinaries.ts                 # LSP 二进制管理
│   ├── messageUtils.ts                # 消息工具
│   ├── nativeFilePicker.ts            # 文件选择器
│   ├── permission/index.ts            # 权限管理
│   ├── plans.ts                       # 计划模式
│   ├── platform.ts                    # 平台检测
│   ├── ripgrep.ts                     # ripgrep 封装
│   ├── update.ts                      # 版本更新检测
│   └── utils/
│       ├── diff.ts                    # Diff 工具
│       ├── fileLock.ts                # 文件锁
│       ├── index.ts
│       ├── security.ts                # 安全工具
│       ├── slug.ts                    # Slug 生成
│       ├── textReplacer.ts            # 文本替换
│       └── tokenCounter.ts            # Token 计数
│
├── hooks/                             # React Hooks
│   ├── useChat.ts                     # 聊天 Hook
│   ├── useAutoScroll.ts               # 自动滚动
│   ├── useConfirmationActions.ts      # 确认操作
│   ├── useConversationPersistence.ts  # 会话持久化
│   ├── useMessageQueue.ts             # 消息队列
│   ├── useNavigationKeys.ts           # 导航按键
│   ├── useResizable.ts               # 可调整大小
│   ├── useRewind.ts                   # 回退功能
│   └── useSnapshotService.ts          # 快照服务
│
└── types/                             # TypeScript 类型定义
    ├── api.ts
    ├── catalog.ts
    ├── cli.ts
    ├── input.ts
    ├── keybindings.ts
    ├── lsp.ts
    ├── questions.ts
    ├── serial.ts
    ├── subagent.ts
    └── todos.ts
```

---

## 5. AI 工具系统

Embedder 实现了一套完整的 Tool-use 系统，对接 LLM API:

### 已注册工具

| 工具名              | 描述                                       |
| ------------------- | ------------------------------------------ |
| `readFile`          | 读取本地文件 (支持行号范围)                |
| `writeFile`         | 创建/覆盖文件                              |
| `editFile`          | 编辑文件 (字符串替换)                      |
| `listDirectory`     | 列出目录内容                               |
| `glob`              | Glob 模式文件搜索                          |
| `grep`              | 文本搜索 (基于 ripgrep)                    |
| `shell`             | 执行 Shell 命令                            |
| `askQuestion`       | 向用户提问 (多选)                          |
| `codeSearch`        | 代码搜索                                   |
| `documentSearch`    | 语义文档搜索 (向量嵌入)                    |
| `webFetch`          | 网页内容获取                               |
| `webSearch`         | 网络搜索                                   |
| `compressConversation` | 压缩对话历史                            |
| `delegateSubagent`  | 委派任务给子 Agent                         |
| `serialMonitor`     | 串口监控                                   |
| `serialReadHistory` | 读取串口历史                               |
| `serialSendCommand` | 发送串口命令                               |
| `todoRead`          | 读取 TODO 列表                             |
| `todoWrite`         | 写入 TODO 列表                             |
| `submitPlan`        | 提交实施计划                               |
| `initProject`       | 初始化项目 (生成 EMBEDDER.md)              |
| `lsp`               | LSP 查询 (定义/引用/符号)                  |

### 子 Agent 类型

从代码中发现至少 3 类子 Agent:

- **planning-agent**: 分析代码库，创建实施计划 (READ-ONLY)
- **web-searcher**: 搜索网络信息 (READ-ONLY)
- **datasheet**: 解析数据手册/寄存器信息

Agent 可并行执行，最多 5 个，通过 `delegateSubagent` 工具调度。

---

## 6. 后端服务架构

### 环境配置

| 环境       | API URL                                        | Web URL                         |
| ---------- | ---------------------------------------------- | ------------------------------- |
| Production | `https://backend-service-prod.embedder.dev`    | `https://app.embedder.dev`      |
| Staging    | `https://backend-service-stage.embedder.dev`   | `https://app-stage.embedder.dev`|
| Infineon   | `https://infineon-backend-service-prod.embedder.com` | `https://infineon.embedder.com` |
| Local      | `http://localhost:3000`                        | `http://localhost:3001`         |

### API 端点

| 端点                               | 用途             |
| ---------------------------------- | ---------------- |
| `api/v1/auth/device/start`         | 设备认证启动     |
| `api/v1/auth/device/token`         | 设备 Token 获取  |
| `api/v1/users/me`                  | 用户信息         |
| `api/v1/users/me/billing/status`   | 计费状态         |
| `api/v1/users/me/billing/portal-sessions` | 计费门户  |
| `api/v1/models`                    | 可用模型列表     |
| `api/v1/projects`                  | 项目管理         |
| `api/v1/sessions`                  | 会话管理         |
| `api/v1/proxy/web-context`         | 网页上下文代理   |
| `api/v1/proxy/web-fetch`           | 网页获取代理     |
| `api/v1/proxy/web-search`          | 网络搜索代理     |
| `api/v1/bug-report`                | Bug 报告         |

### 认证

- **Firebase Auth** (项目: `embedder-dev`, App ID: `1:547074918538:web:...`)
- 设备授权流程 (Device Flow): start → 用户在浏览器授权 → 轮询 token

### 遥测

- **Sentry**: `https://ffddaca20e5fd45b5c4c4263140fd909@sentry-service-prod.embedder.dev/3`
- **BATTS** (自建分析): `https://batts-ingest-prod.embedder.dev/api/v1/ingest`

### 分析事件

```
session_started, session_closed, user_prompt, assistant_response,
tool_call, tool_confirmation, file_operation, command_used,
llm_request, response_latency, mode_switch, conversation_resume,
project_init, rewind, error
```

---

## 7. 支持的 LLM 模型

从 bundle 中提取到的模型标识:

### Anthropic Claude
通过后端代理 (`api/v1` 端点)

### OpenAI
- `gpt-4`, `gpt-4o-mini-search-preview`, `gpt-4o-search-preview`
- `gpt-5`, `gpt-5-chat`, `gpt-5-mini`, `gpt-5-nano`
- `o1-mini`, `o1-preview`, `o3`, `o3-mini`, `o4-mini`

### Google Gemini
- `gemini-1.5-flash`, `gemini-2`
- 端点: `https://generativelanguage.googleapis.com/v1beta`

### Vercel AI SDK
- `https://ai-gateway.vercel.sh/v1/ai`

---

## 8. 嵌入式硬件支持

### 串口通信 (FFI)

通过 Bun FFI 加载 Rust 编译的原生库 (`libserial_ffi.so`/`.dylib`/`.dll`):

```
src/lib/serial/ffi.ts         → Bun FFI 绑定
src/lib/serial/SerialPort.ts  → 高层封装
src/lib/serial/baudDetection.ts → 自动波特率检测
```

### LSP 集成

管理外部 LSP 服务器进程:
- **clangd**: C/C++ 代码智能
- **rust-analyzer**: Rust 代码智能

协议支持:
```
textDocument/definition, textDocument/references, textDocument/hover,
textDocument/documentSymbol, textDocument/implementation,
textDocument/prepareCallHierarchy, workspace/symbol
```

### Tree-Sitter 语法

支持的语言语法 (嵌入 WASM):
```
c, cpp, javascript, typescript, python, rust, zig, markdown
```

---

## 9. UI 框架

应用使用 **React + OpenTUI** 构建终端 UI:

- **OpenTUI**: 自研终端 UI 框架 (`github.com/anomalyco/opentui`)
  - 支持 Kitty 图片协议
  - Unicode/ZWJ 宽度处理
  - 原生渲染 (FFI)
- **Zustand**: 轻量状态管理 (4 个 Store)
- **React Context**: 23 个 Context Provider
- **React Hooks**: 9 个自定义 Hook

### 输入模式

- **Normal**: 标准聊天输入
- **Bash**: 直接 Shell 命令输入
- **Serial**: 串口终端输入
- 快捷键支持 Emacs/Vim 两种模式

---

## 10. 主要第三方依赖

| 依赖                    | 用途                     |
| ----------------------- | ------------------------ |
| zustand                 | 状态管理                 |
| winston                 | 日志                     |
| @sentry/node-core       | 错误追踪                 |
| diff                    | 文本差异对比             |
| semver                  | 语义版本管理             |
| vscode-jsonrpc          | LSP 通信协议             |
| lorem-ipsum             | 测试数据生成             |
| cli-spinners            | 终端加载动画             |
| opentui-spinner         | OpenTUI 加载组件         |
| is-docker / is-wsl      | 环境检测                 |
| open                    | 打开浏览器/URL           |
| import-in-the-middle    | Sentry ESM hook          |

---

## 11. 逆向可行性评估

| 维度             | 难度 | 说明                                                |
| ---------------- | ---- | --------------------------------------------------- |
| 源码提取         | ✅ 低 | JS 以 minified 明文嵌入，可直接提取 20MB bundle     |
| 模块辨识         | ✅ 低 | 原始文件路径完整保留在 bundle 中 (172 个源文件)     |
| 变量还原         | ⚠️ 中 | 变量名被 minify (如 `A`, `B`, `fA`)，需手动映射    |
| 控制流还原       | ⚠️ 中 | 函数结构完整，但 import 被扁平化为单文件             |
| 类型还原         | ⚠️ 中 | TypeScript 类型信息已擦除，需从运行时行为推断        |
| API 协议逆向     | ✅ 低 | 所有 URL、端点、请求格式以明文存在                   |
| 原生 FFI 逆向    | ⚠️ 中 | Rust serial FFI 库编译为原生代码，需单独逆向         |
| 系统提示词提取   | ✅ 低 | 大段 prompt 文本以字符串字面量存在                   |
| 完整还原为 TS    | ❌ 高 | 20MB minified 代码 + 类型擦除，完全还原工作量极大   |
