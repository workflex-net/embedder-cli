# Embedder CLI Installer — 模块详解

## 1. constants.ts (34 行)

全局常量定义，所有模块的配置中心。

### 导出

| 名称                    | 类型     | 值                              | 说明               |
| ----------------------- | -------- | ------------------------------- | ------------------ |
| `APP`                   | string   | `"embedder-cli"`                | 应用标识           |
| `DEFAULT_VERSION`       | string   | `"0.3.16"`                      | 默认安装版本       |
| `INSTALL_DIR`           | string   | `~/.embedder/bin`               | 安装目录           |
| `GITHUB_REPO`           | string   | `"embedder-dev/embedder-cli"`   | GitHub 仓库路径    |
| `GITHUB_RELEASES_BASE`  | string   | GitHub releases URL             | 下载基础 URL       |
| `Colors`                | object   | ANSI 转义码映射                 | 终端颜色常量       |
| `RIPGREP_VERSION`       | string   | `"14.1.1"`                      | ripgrep 版本       |
| `CLANGD_VERSION`        | string   | `"19.1.2"`                      | clangd 版本        |
| `RUST_ANALYZER_VERSION` | string   | `"2024-12-23"`                  | rust-analyzer 版本 |
| `BANNER`                | string   | ASCII Art                       | 安装完成 banner    |

### Colors 对象

```typescript
{
  MUTED:  "\x1b[0;2m",      // 暗淡灰色
  BOLD:   "\x1b[1m",        // 粗体
  RED:    "\x1b[0;31m",     // 红色 (错误)
  GREEN:  "\x1b[0;32m",     // 绿色 (成功)
  ORANGE: "\x1b[38;5;214m", // 橙色 (警告/进度条)
  NC:     "\x1b[0m",        // 重置颜色
}
```

---

## 2. utils.ts (68 行)

基础工具函数，被所有业务模块依赖。

### 类型

```typescript
type LogLevel = "info" | "success" | "warning" | "error";
```

### 函数

#### `printMessage(level: LogLevel, message: string): void`
彩色日志输出到 stderr。颜色映射: info→NC, success→GREEN, warning→ORANGE, error→RED。

#### `usage(): void`
输出 CLI 帮助文本到 stdout。包含所有可用选项和使用示例。

#### `printProgress(bytes: number, total: number): void`
渲染下载进度条到 stderr。宽度 50 字符，使用 `■` (已完成) 和 `･` (未完成) 字符，橙色显示。
通过 `\r` 回车实现原地刷新。

#### `execCommand(cmd: string[]): Promise<{stdout, stderr, exitCode}>`
封装 `Bun.spawn()` 执行外部命令。stdout/stderr 捕获为字符串并 trim。

#### `commandExists(command: string): Promise<boolean>`
通过 `which` 命令检测系统中是否存在指定命令。

---

## 3. args.ts (70 行)

CLI 参数解析模块。

### 接口

```typescript
interface InstallOptions {
  requestedVersion: string;  // 指定安装版本 (空字符串=默认)
  noModifyPath: boolean;     // 是否跳过 PATH 修改
  binaryPath: string;        // 本地二进制路径 (空字符串=从 GitHub 下载)
}
```

### 函数

#### `parseArgs(argv: string[]): InstallOptions`

手写的参数解析器，支持:

| 参数              | 短格式 | 说明                          | 需要值 |
| ----------------- | ------ | ----------------------------- | ------ |
| `--help`          | `-h`   | 显示帮助并退出                | 否     |
| `--version`       | `-v`   | 指定安装版本                  | 是     |
| `--binary`        | `-b`   | 从本地文件安装                | 是     |
| `--no-modify-path`| —      | 不修改 shell 配置文件         | 否     |

**特殊行为**: 支持 `VERSION` 环境变量作为版本的默认值。未知参数输出警告但不中断。

---

## 4. platform.ts (153 行)

平台探测模块，执行多层检测以确定正确的下载目标。

### 接口

```typescript
interface PlatformInfo {
  os: string;            // "darwin" | "linux" | "windows"
  arch: string;          // "x64" | "arm64"
  target: string;        // 完整目标字符串，如 "linux-x64-baseline-musl"
  binaryName: string;    // GitHub 上的文件名，如 "embedder-cli-linux"
  isMusl: boolean;       // 是否为 musl libc 环境
  needsBaseline: boolean;// 是否需要 baseline (无 AVX2) 构建
}
```

### 函数

#### `detectPlatform(): Promise<PlatformInfo>`

执行 5 步检测流程:

1. **OS 检测** — `os.platform()` 映射到 `darwin`/`linux`/`windows`
2. **架构检测** — `os.arch()` 映射 + macOS Rosetta 透明翻译检测 (`sysctl.proc_translated`)
3. **平台校验** — 验证 OS+Arch 组合是否在支持列表内
4. **libc 检测** (Linux) — Alpine (`/etc/alpine-release`) 或 `ldd --version` 输出中检测 musl
5. **CPU 特性检测** (x64) — Linux 读取 `/proc/cpuinfo` 检查 AVX2，macOS 读取 `hw.optional.avx2_0`

### 二进制名称映射

| Target 前缀         | Binary Name                |
| -------------------- | -------------------------- |
| `darwin-x64*`        | `embedder-cli-darwin`      |
| `darwin-arm64`       | `embedder-cli-darwin-arm64`|
| `linux-x64*`         | `embedder-cli-linux`       |
| `windows-x64`        | `embedder-cli.exe`         |

---

## 5. download.ts (179 行)

核心下载模块，实现二进制获取与安装。

### 函数

#### `resolveDownloadUrl(platformInfo, requestedVersion): {url, version}`
构造 GitHub Releases 下载 URL。处理 `v` 前缀去除。无自定义版本时使用 `DEFAULT_VERSION`。

#### `verifyRelease(version: string): Promise<void>`
HEAD 请求 GitHub release tag 页面验证版本存在。404 时打印错误并退出。

#### `downloadWithProgress(url, outputPath): Promise<void>`
流式下载实现:
- 使用 `ReadableStream.getReader()` 逐块读取
- 根据 `Content-Length` 头计算百分比
- TTY 环境下渲染进度条，隐藏/恢复光标
- 全部 chunk 读完后 `Buffer.concat()` 写入文件

#### `downloadAndInstall(platformInfo, url, version): Promise<void>`
完整下载安装流程:
1. 创建临时目录 (`/tmp/embedder_install_{pid}`)
2. 选择下载策略 (进度条 vs 静默)
3. 移动到安装目录并设置 `chmod 755`
4. macOS: 去除隔离属性 + ad-hoc 签名
5. 清理临时目录 (finally 块保证)

#### `installFromBinary(binaryPath: string): Promise<void>`
从本地路径安装 (对应 `--binary` 参数)。使用 `Bun.file()` 读取，`Bun.write()` 写入。

#### `downloadSimple(url, outputPath): Promise<void>` (私有)
无进度条的全量下载降级方案。

#### `macosCodesign(binaryPath: string): Promise<void>` (私有)
macOS 三步签名处理: `xattr -d` → `codesign --remove-signature` → `codesign -s -`。
所有步骤 `.catch(() => {})` 静默失败。

---

## 6. dependencies.ts (277 行)

依赖工具并行安装模块，是代码量最大的模块。

### 函数

#### `installDependencies(platformInfo): Promise<void>`
通过 `Promise.all()` 并行调用三个安装函数。

#### `installRipgrep(platformInfo): Promise<void>` (私有)

| 字段        | 值                                |
| ----------- | --------------------------------- |
| 版本        | 14.1.1                           |
| 来源        | `github.com/BurntSushi/ripgrep`  |
| 格式        | `.tar.gz`                         |
| 解压方式    | `curl -sL | tar -xz`             |

目标映射:

| OS-Arch         | Release Target               |
| --------------- | ---------------------------- |
| darwin-arm64    | aarch64-apple-darwin         |
| darwin-x64      | x86_64-apple-darwin          |
| linux-x64       | x86_64-unknown-linux-musl    |

#### `installClangd(platformInfo): Promise<void>` (私有)

| 字段        | 值                              |
| ----------- | ------------------------------- |
| 版本        | 19.1.2                         |
| 来源        | `github.com/clangd/clangd`    |
| 格式        | `.zip`                          |
| 解压方式    | `curl -sL -o` + `unzip -q`    |

目标映射:

| OS-Arch                 | Release Target            |
| ----------------------- | ------------------------- |
| darwin-arm64 / darwin-x64 | clangd-mac-19.1.2       |
| linux-x64               | clangd-linux-19.1.2      |

#### `installRustAnalyzer(platformInfo): Promise<void>` (私有)

| 字段        | 值                                        |
| ----------- | ----------------------------------------- |
| 版本        | 2024-12-23                               |
| 来源        | `github.com/rust-lang/rust-analyzer`     |
| 格式        | `.gz` (单文件 gzip)                       |
| 解压方式    | `curl -sL | gunzip`                       |

目标映射:

| OS-Arch      | Release Target                          |
| ------------ | --------------------------------------- |
| darwin-arm64 | rust-analyzer-aarch64-apple-darwin      |
| darwin-x64   | rust-analyzer-x86_64-apple-darwin       |
| linux-x64    | rust-analyzer-x86_64-unknown-linux-gnu  |

### 共通安装模式

每个依赖安装函数遵循相同模式:

```
1. 检查系统 PATH (commandExists)
2. 检查 INSTALL_DIR 内是否已有二进制
3. 确定平台目标 → 构造下载 URL
4. 创建临时目录 → 下载解压 → 移动到 INSTALL_DIR
5. chmod 755 + macOS codesign
6. finally 清理临时目录
7. 异常时仅输出警告，不中断安装流程
```

---

## 7. shell.ts (130 行)

Shell 环境配置模块。

### 函数

#### `configureShellPath(noModifyPath: boolean): void`
主函数。检测当前 shell → 查找配置文件 → 注入 PATH export。

#### `getConfigFiles(shell: string): string[]` (私有)
返回每种 shell 的候选配置文件列表 (按优先级排序):

| Shell   | 候选文件                                                       |
| ------- | -------------------------------------------------------------- |
| fish    | `~/.config/fish/config.fish`                                   |
| zsh     | `$ZDOTDIR/.zshrc`, `.zshenv`, `$XDG/.zshrc`, `$XDG/.zshenv`  |
| bash    | `~/.bashrc`, `~/.bash_profile`, `~/.profile`, `$XDG/bash/*`  |
| ash/sh  | `~/.ashrc`, `~/.profile`, `/etc/profile`                      |

#### `addToPath(configFile, command): void` (私有)
- 先读取文件内容检查是否已包含相同命令 (精确行匹配)
- 追加 `\n# embedder\n{command}\n` 到文件末尾
- 文件不可写时输出手动操作提示

#### `updateCurrentPath(): void`
修改当前进程 `process.env.PATH`，确保安装目录在 PATH 中。

#### `configureGithubActions(): void`
检测 `GITHUB_ACTIONS=true` 环境变量，追加安装目录到 `$GITHUB_PATH` 文件。

### PATH 注入命令

| Shell   | 注入命令                                |
| ------- | --------------------------------------- |
| fish    | `fish_add_path "~/.embedder/bin"`       |
| 其他    | `export PATH="~/.embedder/bin:$PATH"`   |

---

## 8. version.ts (26 行)

版本检测模块。

#### `checkVersion(specificVersion: string): Promise<void>`

逻辑:
1. 检查 `embedder` 命令是否存在于 PATH
2. 执行 `embedder --version` 获取已安装版本
3. 版本相同 → 打印提示并 `process.exit(0)` (跳过安装)
4. 版本不同 → 打印当前版本信息，继续安装

---

## 9. npm.ts (73 行)

npm 全局包冲突清理模块。

#### `removeNpmGlobal(): Promise<void>`

处理历史遗留的 npm 全局安装:

```
1. 检查 npm 命令是否存在
2. npm list -g @embedder/embedder 检查是否已安装
3. 先尝试 npm uninstall -g (无 sudo)
4. 失败后重试 sudo npm uninstall -g
5. 重试期间临时显示光标 (允许用户输入密码)
6. 全部失败时输出手动操作提示
```

---

## 10. cache.ts (27 行)

缓存清理模块。

#### `clearCache(): void`

清除 Rust embedding 库的缓存文件:

| 平台    | 缓存路径                                       |
| ------- | ---------------------------------------------- |
| macOS   | `~/Library/Caches/embedder-cli`                |
| Linux   | `$XDG_CACHE_HOME/embedder-cli` (默认 `~/.cache`) |

---

## 11. index.ts (79 行)

入口模块，编排完整安装流程。详见 [flow.md](./flow.md)。
