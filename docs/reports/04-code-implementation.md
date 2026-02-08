# 报告 4: 代码实现 (Code Implementation)

> embedder-cli v0.3.16 — HIL 流程逆向分析报告

## 1. 概述

代码实现是 HIL 链路的核心执行阶段：AI agent 根据需求和硬件文档，创建/编辑源代码文件。embedder 提供了完整的文件操作工具链，包括文件写入（带 diff 预览和 LSP 诊断）、精确文本替换编辑、代码搜索（自带 ripgrep）、LSP 代码智能等。

## 2. 涉及模块清单

| 模块 ID | 文件 | 大小 | 功能 |
|---------|------|------|------|
| PZB | `tools_writeFile.js` | 22.4K | 文件创建/覆写（含 diff 预览、LSP 诊断） |
| YZB | `tools_editFile.js` | 4.4K | 精确文本替换编辑 |
| eZB | `tools_grep.js` | 4.6K | Regex 代码搜索（自带 ripgrep） |
| mZB | `tools_glob.js` | — | 文件模式匹配 |
| hZB | `tools_readFile.js` | — | 文件读取 |
| fZB | `tools_listDirectory.js` | — | 目录列举 |
| B6B | `tools_lsp.js` | — | LSP 代码智能（9 种操作） |

## 3. 核心实现逻辑

### 3.1 writeFile 完整流程 (PZB)

writeFile 是最复杂的工具之一，包含完整的安全、快照、权限、诊断流程。

#### 3.1.1 执行流水线

```
writeFile 调用
  → 路径安全检查 (xx)
  → Plan 模式限制检查 (Cz)
  → 快照注册 (snapshotService.registerFile)
  → 创建目标目录 (VME recursive)
  → 获取文件锁 (Hu)
    → 读取原始内容
    → 生成 diff (c4)
    → 权限确认 (ask) [Plan 文件编辑跳过]
    → 写入文件 (Bun.write)
    → LSP 诊断 (sC.touchFile + sC.diagnostics)
  → 释放文件锁
```

#### 3.1.2 路径安全检查 — xx()

```javascript
// 确保路径不超出 projectRoot
if (!xx(E, g)) {
  return {
    success: false,
    llmContent: `Error: File path "${E}" is outside the project directory "${g}".`
  };
}
```

#### 3.1.3 快照服务 — snapshotService

```javascript
// 注册文件用于 undo/rewind
yB.getState().snapshotService?.registerFile(E);
```

快照服务 (`pKA` 类) 使用 Git 内部命令（`git --git-dir=... add`、`git write-tree`）在 `~/.embedder/snapshots/` 下维护文件快照。支持：
- `registerFile()` — 注册文件追踪
- `track()` — 创建快照（git write-tree）
- `patch()` — 计算变更差异
- `revert()` — 回退到之前的快照

#### 3.1.4 文件锁 — Hu()

```javascript
// 每文件异步互斥锁（Promise 链式排队）
async function Hu(A, B) {
  let Q = Iz.get(A) ?? Promise.resolve();
  let E = Iz.has(A);  // 是否已有锁

  let C = () => {};
  let I = new Promise(D => { C = D; });
  let w = Q.then(() => I);  // 排队等待

  Iz.set(A, w);  // 注册锁
  await Q;        // 等待前序操作完成

  try {
    return await B();  // 执行实际操作
  } finally {
    C();  // 释放锁
    if (Iz.get(A) === w) Iz.delete(A);
  }
}
```

`Iz` 是一个 Map，键为文件路径，值为 Promise 链。确保同一文件的并发写入按顺序执行。

#### 3.1.5 Diff 生成 — c4()

```javascript
// 生成 unified diff 用于确认对话框
let U = c4(E, R, B);
// E = 文件路径, R = 原始内容, B = 新内容
```

#### 3.1.6 权限确认 — ask() 机制

```javascript
// Plan 文件编辑跳过确认
let Y = Q.mode === "plan" && ... && E === G;  // G = 计划文件路径

if (!Y) {
  await Q.ask?.({
    permission: "edit",
    patterns: [E],
    always: ["*"],
    metadata: {
      confirmationDetails: {
        type: "edit",
        title: H ? `Create ${L}` : `Overwrite ${L}`,
        description: ...,
        fileDiff: U,           // diff 数据
        originalContent: ...,
        newContent: B
      }
    }
  });
}
```

#### 3.1.7 LSP 诊断 — 写入后编译检查

```javascript
// qN 数组定义需要 LSP 检查的源文件扩展名
let h = WL.extname(E);
if (qN.includes(h)) {
  try {
    await sC.touchFile(E, true);   // 通知 LSP 文件已变更
    let k = ((await sC.diagnostics())[E] || [])
      .filter(q => q.severity === 1);  // severity 1 = Error

    if (k.length > 0) {
      let q = k.map(sC.formatDiagnostic).join("\n");
      c += `\n\nThis file has compilation errors that need to be fixed:
<file_diagnostics>
${q}
</file_diagnostics>`;
    }
  } catch (V) {
    fA.warn("LSP diagnostics failed", V);
  }
}
```

`qN` 数组包含 `.c`, `.h` 等需要 LSP 检查的扩展名。

### 3.2 editFile 精确编辑 (YZB)

#### 3.2.1 执行流程

```
editFile 调用
  → 验证 oldText ≠ newText 且 oldText 非空
  → 路径安全检查 (xx)
  → Plan 模式限制检查 (Cz)
  → 文件存在性检查
  → 快照注册 (snapshotService.registerFile)
  → 获取文件锁 (Hu)
    → 读取文件内容
    → 行尾规范化 (Do)
    → 核心替换 (jKA)
    → 生成 diff (c4)
    → 权限确认 (ask)
    → 写入文件 (Bun.write)
    → LSP 诊断
  → 释放文件锁
```

#### 3.2.2 行尾规范化 — Do()

```javascript
let U = Do(R);   // 原始内容
let G = Do(B);   // oldText
let Y = Do(Q);   // newText
// Do() 统一换行符（\r\n → \n）
```

#### 3.2.3 核心替换 — jKA()

```javascript
try {
  J = jKA(U, G, Y, E);  // E = replaceAll boolean
} catch (q) {
  // 替换失败（如 oldText 不存在或不唯一）
  return { success: false, llmContent: `Failed to edit: ${s}` };
}
```

`jKA()` 执行实际的文本查找替换。当 `replaceAll=false`（默认）时，要求 `oldText` 在文件中唯一出现；当 `replaceAll=true` 时，替换所有出现。

#### 3.2.4 验证逻辑

```javascript
validateParams: ({ oldText: A, newText: B }) => {
  if (A === B) return "oldText and newText cannot be identical";
  if (!A)     return "oldText cannot be empty";
  return null;
}
```

### 3.3 代码搜索工具链

#### 3.3.1 grep (eZB) — Regex 搜索

```javascript
rZB = dE({
  metadata: {
    name: "grep",
    displayName: "Search Files",
    description: "Fast content search tool... Searches file contents using regular expressions.",
    category: "search"
  },
  inputSchema: S.object({
    pattern: S.string(),                           // regex 模式
    path: S.string().optional(),                    // 搜索目录
    filePattern: S.string().optional(),             // 文件过滤（如 "*.c"）
    caseSensitive: S.boolean().optional()           // 大小写敏感，默认 true
  }),
  execute: async ({ pattern, path, filePattern, caseSensitive = true }) => {
    let C = path ? WN.isAbsolute(path) ? path : WN.resolve(process.cwd(), path) : process.cwd();
    let { matches, hasErrors } = await AHE(C, pattern, filePattern, caseSensitive);

    let D = matches.length > pZB;  // pZB = 结果截断阈值
    let H = D ? matches.slice(0, pZB) : matches;
    let L = BHE(H, D, hasErrors);  // 格式化输出
    return { success: true, llmContent: L };
  }
});
```

#### 3.3.2 自带 ripgrep — _KA() 安装器

```javascript
async function _KA() {
  if (lx) return lx;  // 缓存路径

  // 1. 检查 ~/.embedder/bin/rg
  let E = lJ(Q, B);  // Q = ~/.embedder/bin, B = "rg"
  if (await mME(E)) { lx = E; return lx; }

  // 2. fallback 到系统 rg
  let g = Bun.which("rg");
  if (g) { lx = g; return lx; }

  // 3. 从 GitHub 下载 ripgrep 14.1.1
  lx = await nME(Q);  // 下载安装
  return lx;
}
```

下载安装过程 (`nME`)：
```javascript
// 下载 URL 模式
let w = `https://github.com/BurntSushi/ripgrep/releases/download/${dKA}/${I}`;
// dKA = "14.1.1"

// 解压 tar.gz
let U = ["tar", "-xzf", H, "--strip-components=1", "-C", D];
U.push("--wildcards", "*/rg");

// 设置执行权限
await tME(E, 493);  // 493 = 0o755
```

#### 3.3.3 glob (mZB) — 文件模式匹配

```javascript
// 使用 ripgrep 的 --files 模式
async function* lZB(A) {
  let B = await _KA();  // 获取 rg 路径
  let Q = ["--files", "--glob=!.git/*"];

  if (A.follow !== false) Q.push("--follow");
  if (A.hidden !== false) Q.push("--hidden");
  if (A.glob)
    for (let w of A.glob) Q.push(`--glob=${w}`);

  let E = Bun.spawn([B, ...Q], {
    cwd: A.cwd, stdout: "pipe", stderr: "ignore"
  });
  // 逐行 yield 文件路径
}
```

#### 3.3.4 LSP (B6B) — 代码智能

支持 9 种 LSP 操作：

```javascript
async function CHE(A, B, Q) {
  switch (A) {
    case "goToDefinition":       return sC.definition(B);
    case "findReferences":       return sC.references(B);
    case "hover":                return sC.hover(B);
    case "documentSymbol":       return sC.documentSymbol(Q);
    case "workspaceSymbol":      return sC.workspaceSymbol("");
    case "goToImplementation":   return sC.implementation(B);
    case "prepareCallHierarchy": return sC.prepareCallHierarchy(B);
    case "incomingCalls":        return sC.incomingCalls(B);
    case "outgoingCalls":        return sC.outgoingCalls(B);
  }
}
```

所有操作通过 `sC`（LSP 客户端实例，`lib_lsp.js` 模块）执行。行号/列号输入为 1-based（编辑器格式），内部转换为 0-based（LSP 协议），输出再转回 1-based：

```javascript
function uKA(A) {
  // 递归处理对象，将 line/character 字段 +1
  if ((Q === "line" || Q === "character") && typeof E === "number")
    B[Q] = E + 1;
}
```

### 3.4 文件操作安全机制总结

```
┌──────────────────────────────────────────┐
│              安全检查层                    │
├──────────────────────────────────────────┤
│ 1. xx() — 路径不超出 projectRoot          │
│ 2. Cz() — Plan 模式只能编辑计划文件       │
│ 3. Hu() — 文件级异步互斥锁               │
│ 4. snapshotService — 写前快照（undo 支持）│
│ 5. ask() — 用户确认（展示 diff）          │
│ 6. sC.diagnostics() — 写后编译检查        │
└──────────────────────────────────────────┘
```

## 4. 关键函数/变量映射表

| 混淆名 | 推测原名 | 位置 | 功能 |
|--------|---------|------|------|
| PZB | `writeFileModule` | tools_writeFile.js | writeFile 工具模块 |
| XZB | `writeFileTool` | tools_writeFile.js | writeFile 工具实例 |
| YZB | `editFileModule` | tools_editFile.js | editFile 工具模块 |
| KZB | `editFileTool` | tools_editFile.js | editFile 工具实例 |
| eZB | `grepModule` | tools_grep.js | grep 工具模块 |
| rZB | `grepTool` | tools_grep.js | grep 工具实例 |
| B6B | `lspModule` | tools_lsp.js | LSP 工具模块 |
| A6B | `lspTool` | tools_lsp.js | LSP 工具实例 |
| xx | `isPathInProject` | — | 路径安全检查 |
| Cz | `checkPlanModePermission` | — | Plan 模式权限检查 |
| Hu | `withFileLock` | lib_app.js:182 | 文件级异步互斥锁 |
| Iz | `fileLockMap` | lib_app.js:182 | 文件锁 Map |
| c4 | `generateDiff` | — | 生成 unified diff |
| Do | `normalizeLineEndings` | — | 行尾规范化 |
| jKA | `replaceText` | — | 核心文本替换 |
| sC | `lspClient` | — | LSP 客户端实例 |
| qN | `lspFileExtensions` | — | LSP 支持的文件扩展名数组 |
| _KA | `getRipgrepPath` | tools_submitPlan.js | 获取/安装 ripgrep |
| lx | `cachedRgPath` | tools_submitPlan.js | ripgrep 路径缓存 |
| dKA | `RIPGREP_VERSION` | tools_submitPlan.js | "14.1.1" |
| pKA | `SnapshotService` | lib_app.js | 快照服务类 |
| VME | `mkdirRecursive` | — | 递归创建目录 |
| WL/UK | `path` | — | Node.js path 模块引用 |

## 5. 与 src/ 骨架的差异对比

| 方面 | embedder 原始实现 | 我们的 src/ 骨架 |
|------|------------------|-----------------|
| 文件写入 | 完整安全流水线（6 层检查） | 需要实现 |
| 文件编辑 | oldText/newText 精确替换 | 需要实现 |
| Diff 预览 | unified diff + 用户确认对话框 | 需要实现 |
| 文件锁 | Promise 链式排队（Hu） | 需要实现 |
| 快照/Undo | Git 内部命令实现 | 需要实现 |
| LSP 集成 | 写后自动诊断 + 9 种操作 | 需要实现 |
| 代码搜索 | 自带 ripgrep 14.1.1 | 需要实现 |
| 文件模式匹配 | rg --files 模式 | 需要实现 |

## 6. 逆向改进建议

1. **LSP 应预启动**：embedder 在首次文件写入时才触发 LSP。对于嵌入式开发，应在项目打开时就启动 `clangd`，并使用 `compile_commands.json`。

2. **editFile 应支持多区域编辑**：当前每次只能替换一处文本。嵌入式驱动开发经常需要同时修改 `.c` 和对应 `.h` 文件的多处位置。

3. **快照服务可简化**：embedder 使用 Git 底层命令实现快照，过于复杂。可以使用简单的文件拷贝 + 时间戳方案。

4. **ripgrep 应预装**：首次搜索时下载 ripgrep 会导致延迟。可以在安装时预装，或使用 Bun 自带的文件搜索能力。

5. **写入确认可优化**：对于 Plan 模式中的计划文件编辑自动跳过确认是合理的，但 Act 模式中对生成代码的首次写入也应考虑自动批准（用户已通过 Plan 审批）。
