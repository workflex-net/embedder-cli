# Embedder CLI Installer — 安装流程

## 1. 主流程时序图

```
bun src/index.ts [-- args]
        │
        ▼
  ┌─────────────┐
  │ parseArgs() │  解析 CLI 参数
  └──────┬──────┘
         │
         ▼
  ┌──────────────────┐
  │ mkdir INSTALL_DIR│  确保 ~/.embedder/bin 存在
  └──────┬───────────┘
         │
         ├── args.binaryPath ? ──────────────────┐
         │   (本地安装模式)                       │
         │                                        ▼
         │                              ┌──────────────────┐
         │                              │ existsSync(path) │
         │                              └────────┬─────────┘
         │                                       ▼
         │                              ┌──────────────┐
         │                              │ clearCache() │
         │                              └────────┬─────┘
         │                                       ▼
         │                              ┌────────────────────┐
         │                              │ installFromBinary() │
         │                              └────────┬───────────┘
         │                                       │
         │   (远程下载模式)                       │
         ▼                                        │
  ┌──────────────────┐                            │
  │ detectPlatform() │                            │
  └──────┬───────────┘                            │
         ▼                                        │
  ┌────────────────────┐                          │
  │ resolveDownloadUrl │                          │
  └──────┬─────────────┘                          │
         ▼                                        │
  ┌──────────────────────┐                        │
  │ verifyRelease()      │  (仅自定义版本)        │
  └──────┬───────────────┘                        │
         ▼                                        │
  ┌──────────────────┐                            │
  │ checkVersion()   │  版本相同则 exit(0)        │
  └──────┬───────────┘                            │
         ▼                                        │
  ┌──────────────────────┐                        │
  │ removeNpmGlobal()    │                        │
  └──────┬───────────────┘                        │
         ▼                                        │
  ┌──────────────┐                                │
  │ clearCache() │                                │
  └──────┬───────┘                                │
         ▼                                        │
  ┌────────────────────────┐                      │
  │ downloadAndInstall()   │                      │
  └──────┬─────────────────┘                      │
         ▼                                        │
  ┌────────────────────────┐                      │
  │ installDependencies()  │  ← Promise.all       │
  │  ├─ installRipgrep()   │    (并行)            │
  │  ├─ installClangd()    │                      │
  │  └─ installRustAnalyzer│                      │
  └──────┬─────────────────┘                      │
         │                                        │
         ◄────────────────────────────────────────┘
         │          (两条路径在此汇合)
         ▼
  ┌────────────────────────┐
  │ configureShellPath()   │  修改 shell 配置文件
  └──────┬─────────────────┘
         ▼
  ┌──────────────────┐
  │ updateCurrentPath│  更新当前进程 PATH
  └──────┬───────────┘
         ▼
  ┌────────────────────────┐
  │ configureGithubActions │  CI 环境 PATH 写入
  └──────┬─────────────────┘
         ▼
  ┌──────────────────┐
  │ 输出 BANNER      │
  │ "Installation    │
  │  complete!"      │
  └──────────────────┘
```

---

## 2. 下载策略决策树

```
downloadAndInstall()
        │
        ├── os === "windows" ? ─── YES ──→ downloadSimple()
        │
        ├── !process.stderr.isTTY ? ─── YES ──→ downloadSimple()
        │
        └── TTY 环境
                │
                ▼
        downloadWithProgress()
                │
                ├── 成功 → 继续
                │
                └── 失败 → downloadSimple() (降级)
```

---

## 3. 平台检测流程

```
detectPlatform()
    │
    ├── 1. OS 检测
    │       os.platform() → darwin | linux | win32
    │
    ├── 2. 架构检测
    │       os.arch() → x64 | arm64
    │       │
    │       └── macOS + x64 ?
    │               sysctl.proc_translated === 1 ?
    │               → 修正为 arm64 (Rosetta)
    │
    ├── 3. 平台校验
    │       combo ∈ {linux-x64, darwin-x64, darwin-arm64, windows-x64}
    │       linux-arm64 → 专门错误提示
    │       其他 → 通用错误
    │
    ├── 4. libc 检测 (仅 Linux)
    │       /etc/alpine-release 存在 → musl
    │       ldd --version 输出含 "musl" → musl
    │
    ├── 5. CPU 特性检测 (仅 x64)
    │       Linux: /proc/cpuinfo 不含 "avx2" → baseline
    │       macOS: hw.optional.avx2_0 !== 1 → baseline
    │
    └── 6. 构建 target 字符串
            "{os}-{arch}[-baseline][-musl]"
            → 映射到具体 binary name
```

---

## 4. 依赖安装流程 (每个依赖通用)

```
installXxx()
    │
    ├── which xxx 存在 ? → 跳过 ("already installed")
    │
    ├── INSTALL_DIR/xxx 存在 ? → 跳过
    │
    ├── 平台不支持 ? → 输出警告，return
    │
    └── 下载安装
            │
            ├── 创建临时目录 /tmp/xxx_install_{pid}
            │
            ├── 下载 + 解压
            │       ripgrep:       curl | tar -xz
            │       clangd:        curl -o zip + unzip
            │       rust-analyzer: curl | gunzip
            │
            ├── mv → INSTALL_DIR/xxx
            │
            ├── chmod 755
            │
            ├── macOS ? → xattr + codesign
            │
            └── finally: rm -rf 临时目录
```

---

## 5. Shell 配置流程

```
configureShellPath()
    │
    ├── noModifyPath === true ? → return
    │
    ├── 检测 shell: basename($SHELL)
    │
    ├── 获取候选配置文件列表
    │       fish: config.fish
    │       zsh:  .zshrc, .zshenv, XDG variants
    │       bash: .bashrc, .bash_profile, .profile, XDG variants
    │       ash/sh: .ashrc, .profile, /etc/profile
    │
    ├── 找到第一个存在的文件
    │       未找到 → 输出手动操作提示
    │
    ├── INSTALL_DIR 已在 PATH 中 ? → return
    │
    └── addToPath()
            │
            ├── 文件中已有相同行 ? → 跳过
            │
            └── 追加 "\n# embedder\n{export命令}\n"
```

---

## 6. npm 冲突清理流程

```
removeNpmGlobal()
    │
    ├── npm 不存在 ? → return
    │
    ├── npm list -g 不含 @embedder/embedder ? → return
    │
    ├── npm uninstall -g @embedder/embedder
    │       │
    │       ├── 成功 → return
    │       │
    │       └── 失败
    │               │
    │               ├── 显示光标 (允许 sudo 密码输入)
    │               │
    │               ├── sudo npm uninstall -g
    │               │       │
    │               │       ├── 成功 → return
    │               │       │
    │               │       └── 失败 → 输出手动操作提示
    │               │
    │               └── 隐藏光标
```

---

## 7. 错误处理策略

| 阶段           | 错误类型             | 处理方式                    |
| -------------- | -------------------- | --------------------------- |
| 参数解析       | 缺少必需值           | 打印错误，exit(1)          |
| 平台检测       | 不支持的平台         | 打印错误，exit(1)          |
| 版本验证       | release 不存在 (404) | 打印错误 + releases 链接，exit(1) |
| 主二进制下载   | 网络/IO 错误         | 降级到 downloadSimple，最终抛异常 |
| 依赖安装       | 下载/解压失败        | **警告但不中断** (非致命)  |
| Shell 配置     | 文件不可写           | 输出手动操作提示           |
| npm 卸载       | 权限不足             | 升级到 sudo，最终输出手动操作提示 |
| 全局异常       | 未捕获 Promise 异常  | main().catch → 打印错误，exit(1) |
