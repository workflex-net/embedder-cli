# Embedder CLI Installer — 架构文档

## 1. 项目概述

Embedder CLI Installer 是一个跨平台的 CLI 安装器，负责从 GitHub Releases 下载并部署 `embedder-cli` 二进制文件及其配套依赖工具。项目由原始 Bash 安装脚本 (`install.sh`, 667 行) 逆向工程为 TypeScript 模块化实现，运行于 Bun 运行时。

**源项目**: `https://embedder.com/install` → `https://install.embedder.com/scripts/latest/install.sh`
**目标仓库**: `github.com/embedder-dev/embedder-cli`

---

## 2. 技术栈

| 层面       | 技术选择                    |
| ---------- | --------------------------- |
| 语言       | TypeScript (strict mode)    |
| 运行时     | Bun                         |
| 网络       | Web Fetch API (Bun 内置)    |
| 文件系统   | Node.js `fs` 兼容 API      |
| 子进程     | `Bun.spawn`                 |
| 压缩/解压  | 外部命令 (`tar`, `unzip`, `gunzip`) |

---

## 3. 目录结构

```
src/
├── index.ts          入口点 — 编排主安装流程
├── constants.ts      全局常量 — 版本号、路径、颜色、URL
├── args.ts           CLI 参数解析
├── platform.ts       平台检测 (OS / Arch / libc / CPU)
├── download.ts       二进制下载 (含进度条)
├── dependencies.ts   依赖工具安装 (ripgrep / clangd / rust-analyzer)
├── shell.ts          Shell 配置 & PATH 注入
├── version.ts        已安装版本检测
├── npm.ts            npm 全局包冲突清理
├── cache.ts          缓存目录清理
└── utils.ts          基础工具函数
```

**总计**: 11 个模块, 1,116 行 TypeScript

---

## 4. 模块依赖图

```
                         index.ts
                            │
          ┌─────────┬───────┼────────┬──────────┬──────────┐
          ▼         ▼       ▼        ▼          ▼          ▼
       args.ts  platform.ts download.ts  dependencies.ts  shell.ts
          │         │       │    │       │                  │
          ▼         │       ▼    │       ▼                  ▼
       utils.ts ◄───┘   utils.ts │    utils.ts          utils.ts
          │               │      │       │
          ▼               ▼      │       ▼
      constants.ts   constants.ts│   constants.ts
                                 │
          ┌──────────────────────┘
          ▼
      version.ts    npm.ts    cache.ts
          │           │          │
          ▼           ▼          ▼
       utils.ts    utils.ts  constants.ts
          │           │
          ▼           ▼
      constants.ts constants.ts
```

**核心依赖关系**:
- `constants.ts` 是叶节点，被所有模块依赖
- `utils.ts` 是公共工具层，提供日志、命令执行、进度条
- `index.ts` 是唯一入口，串联所有模块
- 模块间无循环依赖

---

## 5. 分层架构

```
┌──────────────────────────────────────────────┐
│               index.ts (编排层)               │
│  解析参数 → 检测平台 → 下载安装 → 配置环境   │
├──────────┬──────────┬──────────┬─────────────┤
│ 安装层   │ 环境层   │ 清理层   │  检测层      │
│download  │ shell    │ cache    │ platform     │
│dependen- │          │ npm      │ version      │
│ cies     │          │          │              │
├──────────┴──────────┴──────────┴─────────────┤
│              基础设施层                        │
│       utils.ts      constants.ts              │
└──────────────────────────────────────────────┘
```

### 层级职责

| 层级     | 模块                          | 职责                           |
| -------- | ----------------------------- | ------------------------------ |
| 编排层   | `index.ts`                    | 主流程控制、错误处理、输出 banner |
| 安装层   | `download.ts`, `dependencies.ts` | 二进制获取、解压、权限设置       |
| 环境层   | `shell.ts`                    | Shell 配置文件修改、PATH 注入    |
| 清理层   | `cache.ts`, `npm.ts`          | 旧缓存清除、npm 冲突包卸载      |
| 检测层   | `platform.ts`, `version.ts`   | 系统环境探测、版本对比           |
| 基础设施 | `utils.ts`, `constants.ts`    | 日志、命令执行、全局配置         |

---

## 6. 关键设计决策

### 6.1 Bun 原生 API 优先

- **网络请求**: 使用 Web `fetch()` API 而非 `curl` 子进程下载主二进制文件
- **文件写入**: 使用 `Bun.write()` / `Bun.file()` 进行高性能 I/O
- **子进程**: 使用 `Bun.spawn()` 替代 `child_process.exec`
- **依赖安装**: 仍然委托给外部 `curl` + `tar`/`unzip`/`gunzip`，因为 Bun 未内置解压能力

### 6.2 并行安装策略

依赖工具 (ripgrep, clangd, rust-analyzer) 通过 `Promise.all()` 并行安装，与原始 bash 脚本的 `&` + `wait` 策略一致。

### 6.3 优雅降级

下载逻辑实现两级降级:
1. TTY 环境 → 流式进度条下载 (`downloadWithProgress`)
2. 进度条失败 → 静默全量下载 (`downloadSimple`)
3. Windows / 非 TTY → 直接跳到静默下载

### 6.4 幂等性设计

- 版本检测: 若目标版本已安装，直接 `process.exit(0)`
- 依赖检测: 每个依赖先检查 `which` 和 `INSTALL_DIR` 内是否已存在
- PATH 注入: 检查配置文件中是否已包含相同命令行

---

## 7. 安装目录布局

安装完成后，`~/.embedder/bin/` 目录结构:

```
~/.embedder/bin/
├── embedder          主 CLI 二进制
├── rg                ripgrep (代码搜索)
├── clangd            C/C++ LSP 服务器
└── rust-analyzer     Rust LSP 服务器
```

---

## 8. 外部依赖

本项目不使用任何 npm 包，仅依赖:

| 依赖           | 来源                    | 用途                   |
| -------------- | ----------------------- | ---------------------- |
| Bun 运行时      | 系统安装                | TypeScript 执行、API   |
| curl           | 系统 PATH               | 依赖工具下载           |
| tar            | 系统 PATH               | ripgrep .tar.gz 解压   |
| unzip          | 系统 PATH               | clangd .zip 解压       |
| gunzip         | 系统 PATH               | rust-analyzer .gz 解压 |
| xattr          | macOS 系统              | 去除隔离属性           |
| codesign       | macOS 系统              | Ad-hoc 代码签名        |
| sysctl         | macOS 系统              | Rosetta / AVX2 检测    |
