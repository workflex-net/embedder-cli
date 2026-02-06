# Embedder CLI Installer — 平台支持矩阵

## 1. 主二进制支持平台

| OS      | Arch  | 状态     | Binary Name                | 备注                   |
| ------- | ----- | -------- | -------------------------- | ---------------------- |
| macOS   | arm64 | ✅ 支持  | embedder-cli-darwin-arm64  | Apple Silicon 原生     |
| macOS   | x64   | ✅ 支持  | embedder-cli-darwin        | Intel Mac              |
| macOS   | x64*  | ✅ 支持  | embedder-cli-darwin-arm64  | Rosetta 自动检测为 arm64 |
| Linux   | x64   | ✅ 支持  | embedder-cli-linux         | glibc & musl           |
| Linux   | arm64 | ❌ 不支持 | —                         | 专门错误提示            |
| Windows | x64   | ✅ 支持  | embedder-cli.exe           | MINGW/MSYS/CYGWIN      |
| 其他    | 其他  | ❌ 不支持 | —                         | 通用错误提示            |

## 2. Target 变体矩阵

x64 架构根据 CPU 和 libc 特性产生多个变体，但最终映射到同一个二进制文件:

| Target 字符串              | Binary Name           | 条件                              |
| -------------------------- | --------------------- | --------------------------------- |
| `darwin-x64`               | embedder-cli-darwin   | macOS Intel + AVX2                |
| `darwin-x64-baseline`      | embedder-cli-darwin   | macOS Intel 无 AVX2              |
| `darwin-arm64`             | embedder-cli-darwin-arm64 | macOS Apple Silicon           |
| `linux-x64`               | embedder-cli-linux    | Linux glibc + AVX2               |
| `linux-x64-baseline`      | embedder-cli-linux    | Linux glibc 无 AVX2             |
| `linux-x64-musl`          | embedder-cli-linux    | Alpine/musl + AVX2               |
| `linux-x64-baseline-musl` | embedder-cli-linux    | Alpine/musl 无 AVX2             |
| `windows-x64`             | embedder-cli.exe      | Windows                          |

> **注意**: 当前 target 变体 (baseline/musl) 在检测后记录于 `PlatformInfo` 中，但实际下载的二进制文件名不区分这些变体。这可能是为未来区分构建预留的接口。

## 3. 依赖工具平台支持

### ripgrep v14.1.1

| OS-Arch      | Release Target               | 格式     |
| ------------ | ---------------------------- | -------- |
| darwin-arm64 | aarch64-apple-darwin         | .tar.gz  |
| darwin-x64   | x86_64-apple-darwin          | .tar.gz  |
| linux-x64    | x86_64-unknown-linux-musl    | .tar.gz  |
| 其他         | ⚠️ 跳过 (警告)               | —        |

### clangd v19.1.2

| OS-Arch              | Release Target         | 格式  |
| -------------------- | ---------------------- | ----- |
| darwin-arm64         | clangd-mac-19.1.2      | .zip  |
| darwin-x64           | clangd-mac-19.1.2      | .zip  |
| linux-x64            | clangd-linux-19.1.2    | .zip  |
| 其他                 | ⚠️ 跳过 (警告)         | —     |

> macOS arm64 和 x64 使用同一个包 (universal 或 Rosetta 兼容)

### rust-analyzer 2024-12-23

| OS-Arch      | Release Target                         | 格式 |
| ------------ | -------------------------------------- | ---- |
| darwin-arm64 | rust-analyzer-aarch64-apple-darwin     | .gz  |
| darwin-x64   | rust-analyzer-x86_64-apple-darwin      | .gz  |
| linux-x64    | rust-analyzer-x86_64-unknown-linux-gnu | .gz  |
| 其他         | ⚠️ 跳过 (警告)                         | —    |

## 4. 平台检测逻辑细节

### Rosetta 检测

```
条件: os === "darwin" && arch === "x64"
方法: sysctl -n sysctl.proc_translated
结果: "1" → 实际运行在 Apple Silicon 上，修正 arch 为 "arm64"
```

### musl libc 检测 (Linux)

两个检测路径 (任一命中即标记):

| 方法                         | 条件                       |
| ---------------------------- | -------------------------- |
| `/etc/alpine-release` 存在  | Alpine Linux 容器环境      |
| `ldd --version` 输出含 musl | 通用 musl 发行版           |

### AVX2 (Baseline CPU) 检测

| 平台    | 方法                              | Baseline 条件            |
| ------- | --------------------------------- | ------------------------ |
| Linux   | 读取 `/proc/cpuinfo`             | 不包含 "avx2" 字符串    |
| macOS   | `sysctl -n hw.optional.avx2_0`   | 返回值不是 "1"           |

## 5. macOS 安全处理

从互联网下载的二进制文件在 macOS 上会被 Gatekeeper 阻止执行。安装器执行以下处理:

```
1. xattr -d com.apple.quarantine <binary>    # 移除隔离属性
2. codesign --remove-signature <binary>      # 移除原有签名
3. codesign -s - <binary>                    # Ad-hoc 重签名
```

此处理应用于所有安装的二进制文件: `embedder`, `rg`, `clangd`, `rust-analyzer`。
每个步骤都包裹在 `.catch(() => {})` 中，确保在非 macOS 或权限不足时静默跳过。

## 6. Shell 配置文件优先级

| Shell | 候选文件 (按优先级)                                                    |
| ----- | ---------------------------------------------------------------------- |
| fish  | `~/.config/fish/config.fish`                                           |
| zsh   | `$ZDOTDIR/.zshrc` → `$ZDOTDIR/.zshenv` → `$XDG/zsh/.zshrc` → `$XDG/zsh/.zshenv` |
| bash  | `~/.bashrc` → `~/.bash_profile` → `~/.profile` → `$XDG/bash/.bashrc` → `$XDG/bash/.bash_profile` |
| ash   | `~/.ashrc` → `~/.profile` → `/etc/profile`                            |
| sh    | `~/.ashrc` → `~/.profile` → `/etc/profile`                            |
| 其他  | (同 bash)                                                              |

## 7. 缓存目录位置

| 平台    | 路径                                               |
| ------- | -------------------------------------------------- |
| macOS   | `~/Library/Caches/embedder-cli`                    |
| Linux   | `${XDG_CACHE_HOME:-~/.cache}/embedder-cli`         |
