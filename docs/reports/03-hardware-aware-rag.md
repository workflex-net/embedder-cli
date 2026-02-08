# 报告 3: 硬件感知 RAG 召回 (Hardware-Aware RAG)

> embedder-cli v0.3.16 — HIL 流程逆向分析报告

## 1. 概述

硬件感知 RAG（Retrieval-Augmented Generation）是 HIL 链路的核心知识检索层。当 AI agent 需要查阅寄存器定义、引脚映射、外设配置等硬件信息时，embedder 通过三层 RAG 架构提供上下文增强。

## 2. 涉及模块清单

| 模块 ID | 文件 | 大小 | 功能 |
|---------|------|------|------|
| BZB | `tools_documentSearch.js` | 2.4K | 语义向量文档搜索（Layer 1） |
| eVB | `tools_codeSearch.js` | 2.2K | Web Context 代码搜索（Layer 2） |
| tVB | `tools_delegateSubagent.js` | 7.6K | 子代理（Layer 3） |
| AZB | — | — | documentSearch 工具实例 |
| rVB | — | — | codeSearch 工具实例 |
| uVB | — | — | delegateSubagent 工具实例 |

## 3. 核心实现逻辑

### 3.1 三层 RAG 架构

```
┌─────────────────────────────────────────────────┐
│                  AI Agent (LLM)                  │
├─────────┬─────────────────┬─────────────────────┤
│ Layer 1 │    Layer 2      │      Layer 3        │
│ docSearch│   codeSearch    │  delegateSubagent   │
│ (语义)   │   (Web Context) │  (自主子代理)        │
├─────────┼─────────────────┼─────────────────────┤
│ 用户上传 │  公开代码/文档   │ 组合搜索 + 综合     │
│ PDF文档  │  API/SDK/库     │ document-explorer   │
│ 数据手册 │  社区代码示例    │ web-searcher        │
│ 勘误表   │                 │ codebase-explorer   │
└─────────┴─────────────────┴─────────────────────┘
```

### 3.2 Layer 1 — documentSearch (BZB) — 语义向量搜索

#### API 调用

```javascript
// tools_documentSearch.js
AZB = dE({
  metadata: {
    name: "documentSearch",
    displayName: "Document Search",
    description: "Performs semantic search across documentation using vector embeddings.",
    category: "search",
    requiresConfirmation: false
  },
  inputSchema: S.object({
    query: S.string().min(1),           // 搜索词
    max_results: S.number().min(1).max(100).optional(),  // 默认 10，上限 100
    threshold: S.number().min(0).max(1).optional()       // 相似度阈值 0-1，默认 0.0
  }),
  execute: async ({ query, max_results = 10, threshold = 0 }, E) => {
    // 前置条件检查
    if (!E.projectId) return { success: false, llmContent: "No project selected." };
    if (!E.apiFetch)  return { success: false, llmContent: "API not available." };

    // 调用后端 API
    let C = await E.apiFetch.post(
      `api/v1/projects/${E.projectId}/retrieve-context`,
      { query, max_results, threshold }
    );

    // 结果处理
    let I = CME(C.text);  // 计算 chunk 数量
    return {
      success: true,
      llmContent: C.text ?? "",
      summary: `Found ${I} chunk(s)`
    };
  }
});
```

#### Chunk 计数函数

```javascript
// tools_codeSearch.js 底部
function CME(A) {
  if (!A?.trim()) return 0;
  let B = A.split(/\n---+\n/).filter(Q => Q.trim());
  if (B.length > 1) return B.length;
  return Math.max(1, A.split(/\n\n+/).filter(Q => Q.trim()).length);
}
```

文档片段以 `---` 分隔符返回。如果没有分隔符，则用空行分段计数。

#### 使用场景

- 寄存器查找：`query: "RCC_AHB2ENR"` → 在数据手册 PDF 中检索
- GPIO 引脚映射：`query: "PA5 alternate function"` → 引脚复用表
- 时序参数：`query: "SPI clock maximum frequency"` → 电气参数
- 错误分析：`query: "hard fault debug"` → 应用笔记

### 3.3 Layer 2 — codeSearch (eVB) — Web Context 代码搜索

#### API 调用

```javascript
// tools_codeSearch.js
rVB = dE({
  metadata: {
    name: "codeSearch",
    displayName: "Code Search",
    description: gME,  // 描述变量引用
    category: "search",
    requiresConfirmation: false
  },
  inputSchema: S.object({
    query: S.string().min(1),
    tokensNum: S.number().int().min(1000).max(50000).optional()
    // 默认值 qKA，范围 1000-50000
  }),
  execute: async ({ query, tokensNum }, Q) => {
    if (!Q.apiFetch) return { success: false, ... };

    // 调用 Web Context 代理 API
    let g = await Q.apiFetch.post(
      "api/v1/proxy/web-context",
      { query, tokensNum: tokensNum ?? qKA }
    );

    if (!g.response) return {
      success: false,
      llmContent: "No code snippets or documentation found..."
    };

    return {
      success: true,
      llmContent: g.response,
      summary: "Code search completed"
    };
  }
});
```

#### 关键特性

- **不需要 projectId**：只需要认证（apiFetch），不依赖特定项目
- **可调 token 数量**：`tokensNum` 参数控制返回量（1000-50000）
- **自然语言查询**：支持描述性查询如 "React useState hook examples"

#### 使用场景

- SDK 用法：`query: "STM32G4 GPIO configuration CMSIS"` → HAL/CMSIS 代码示例
- 库文档：`query: "FreeRTOS queue send from ISR"` → API 用法和注意事项
- 驱动模式：`query: "SPI DMA circular mode STM32"` → 社区代码片段

### 3.4 Layer 3 — delegateSubagent (tVB) — 自主子代理

#### 子代理类型

```javascript
_VB = S.enum([
  "codebase-explorer",    // 代码库探索（只读）
  "document-explorer",    // 文档搜索综合（只读）
  "web-searcher",         // Web 搜索（只读）
  "planning-agent"        // 规划代理（只读）
]);
```

#### 配置获取

```javascript
// 从后端获取子代理配置
let E = await fetch(
  `${OC.apiUrl}/api/v1/subagents/${A.agent_type}/config`,
  { method: "GET", headers: { ...Q, "Content-Type": "application/json" } }
);
let g = await E.json();
// g 包含：provider, modelId, timeoutMinutes, maxTokens, maxToolCalls, temperature, allowedTools
```

#### 多模型提供商支持

```javascript
switch (g.provider) {
  case "anthropic":
    H = C9({ baseURL: `${OC.apiUrl}/api/v1/proxy/anthropic/`, apiKey: yKA, fetch: D });
    break;
  case "openai":
    H = D9({ baseURL: `${OC.apiUrl}/api/v1/proxy/openai/`, apiKey: yKA, fetch: D });
    break;
  case "google":
    H = w9({ baseURL: `${OC.apiUrl}/api/v1/proxy/google/`, apiKey: yKA, fetch: D });
    break;
}
// yKA = "embedder-proxy" — 代理 API key
```

#### 子代理执行引擎

```javascript
// 使用 AI SDK 的 generateText (G4) 流式执行
let T = await G4({
  model: L,                    // 配置的模型
  messages: [{ role: "user", content: I }],  // 任务描述
  tools: C,                    // 过滤后的工具子集（VKA 函数）
  maxOutputTokens: g.maxTokens,
  stopWhen: G9(g.maxToolCalls), // 最大工具调用次数限制
  abortSignal: U.signal,       // 超时信号
  temperature: g.temperature
});

// 流式处理
for await (let j of T.fullStream) {
  switch (j.type) {
    case "text-delta":  J += j.text; break;
    case "tool-call":   /* 嵌套工具调用上报 */ break;
    case "tool-result": /* 工具结果上报 */ break;
    case "tool-error":  /* 错误处理 */ break;
    case "finish":      /* 完成 */ break;
  }
}
```

#### 工具过滤 — VKA 函数

```javascript
async function VKA(A) {
  // A = allowedTools 数组（从服务端配置）
  let B = Object.fromEntries(
    Object.entries(uJ).filter(([E]) => A.includes(E))
  );
  // 检查每个工具的 isAvailable 条件
  let Q = await Promise.all(
    Object.entries(B).map(async ([E, g]) => {
      if (g.metadata.isAvailable)
        return await g.metadata.isAvailable() ? [E, g] : null;
      return [E, g];
    })
  );
  return Object.fromEntries(Q.filter(Boolean));
}
```

#### 子代理的嵌套工具调用

子代理的工具调用通过 `nestedToolCallHandler` 和 `nestedToolUpdateHandler` 上报给父 agent 的 UI：

```javascript
let k = yB.getState().nestedToolCallHandler;
let q = yB.getState().nestedToolUpdateHandler;
let s = B.toolCallId;  // 父工具调用 ID

// 在 tool-call 事件中
if (s && k) k(s, d);  // 上报嵌套工具开始

// 在 tool-result 事件中
if (s && q) q(s, i, { status, result, endTime }); // 上报嵌套工具结果
```

### 3.5 硬件感知搜索模式

实际使用中，三层 RAG 按场景组合：

| 场景 | Layer 1 (docSearch) | Layer 2 (codeSearch) | Layer 3 (subagent) |
|------|-------------------|--------------------|--------------------|
| 查寄存器定义 | ✅ 主要 | | |
| 查外设引脚映射 | ✅ 主要 | | ✅ document-explorer |
| 查 SDK/HAL API 用法 | | ✅ 主要 | |
| 综合分析外设初始化 | ✅ 辅助 | ✅ 辅助 | ✅ document-explorer |
| 查社区代码示例 | | ✅ 主要 | ✅ web-searcher |
| 项目代码结构分析 | | | ✅ codebase-explorer |

## 4. 关键函数/变量映射表

| 混淆名 | 推测原名 | 位置 | 功能 |
|--------|---------|------|------|
| BZB | `docSearchModule` | tools_documentSearch.js | documentSearch 模块 |
| AZB | `documentSearchTool` | tools_documentSearch.js | documentSearch 工具实例 |
| eVB | `codeSearchModule` | tools_codeSearch.js | codeSearch 模块 |
| rVB | `codeSearchTool` | tools_codeSearch.js | codeSearch 工具实例 |
| tVB | `subagentEnumModule` | tools_delegateSubagent.js | 子代理类型枚举 |
| aVB | `subagentToolModule` | tools_delegateSubagent.js | delegateSubagent 工具模块 |
| uVB | `delegateSubagentTool` | tools_delegateSubagent.js | delegateSubagent 工具实例 |
| _VB | `SubagentType` | tools_delegateSubagent.js | 子代理类型枚举 schema |
| CME | `countChunks` | tools_codeSearch.js | 计算文档片段数量 |
| qKA | `defaultTokensNum` | tools_codeSearch.js | codeSearch 默认 token 数 |
| VKA | `filterToolsByAllowedList` | lib_app.js:182 | 按白名单过滤工具 |
| G4 | `generateText` | AI SDK | AI SDK 的文本生成函数 |
| G9 | `stopWhen` | AI SDK | 工具调用次数限制 |
| C9 | `createAnthropicProvider` | AI SDK | Anthropic 提供商 |
| D9 | `createOpenAIProvider` | AI SDK | OpenAI 提供商 |
| w9 | `createGoogleProvider` | AI SDK | Google 提供商 |
| yKA | `PROXY_API_KEY` | tools_delegateSubagent.js | 值为 "embedder-proxy" |
| OC | `config` | — | 全局配置对象（apiUrl 等） |

## 5. 与 src/ 骨架的差异对比

| 方面 | embedder 原始实现 | 我们的 src/ 骨架 |
|------|------------------|-----------------|
| 文档搜索 | 后端向量 API (`retrieve-context`) | 需要实现向量存储 |
| 代码搜索 | Web Context 代理 API | 需要实现或对接 |
| 子代理 | 独立 LLM 上下文 + 工具子集 | 需要实现 |
| 多模型 | Anthropic/OpenAI/Google 三家 | 需要实现 |
| 文档上传 | PDF 上传到项目 (50MB 上限) | 需要实现 |
| 流式执行 | AI SDK fullStream | 需要实现 |

## 6. 逆向改进建议

1. **本地向量存储**：embedder 完全依赖后端 API 进行向量搜索。我们可以在本地运行向量数据库（如 Qdrant、ChromaDB），减少网络延迟并支持离线使用。

2. **分片策略优化**：embedder 的 chunk 计数用简单的 `---` 分隔符。对于硬件数据手册，应按寄存器表、章节标题等语义边界分片。

3. **codeSearch 缓存**：Web Context 搜索结果可以本地缓存（同一 MCU 的 HAL 用法不会频繁变化），减少 API 调用。

4. **子代理池化**：当前每次调用都创建新的子代理连接。可以复用连接和上下文。

5. **document-explorer 可增加 RAG 融合**：让 document-explorer 子代理同时使用 documentSearch 和 codeSearch，实现数据手册 + 代码示例的自动关联。
