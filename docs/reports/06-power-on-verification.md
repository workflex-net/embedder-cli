# 报告 6: 上电验证 (Power-On Verification)

> embedder-cli v0.3.16 — HIL 流程逆向分析报告

## 1. 概述

上电验证是 HIL 链路的最后一步：固件烧录完成后，通过串口监控验证设备是否正常启动和运行。embedder 提供了三个串口工具（monitor、read_history、send_command）和一个基于 Rust FFI 的底层串口驱动（lib_serial.js），实现完整的设备交互验证。

## 2. 涉及模块清单

| 模块 ID | 文件 | 大小 | 功能 |
|---------|------|------|------|
| TZB | `tools_writeFile.js` 中嵌入 | — | serial_monitor 工具 |
| VZB | `tools_writeFile.js` 中嵌入 | — | serial_read_history 工具 |
| WZB | `tools_writeFile.js` 中嵌入 | — | serial_send_command 工具 |
| YxB | `lib_serial.js` | 503K | Rust FFI 原生串口驱动 |
| ZI | `lib_app.js` | — | SharedSerialManager 单例 |
| fg | `lib_app.js` | — | 串口 UI store（tabs/状态管理） |
| NZB | — | — | serial_monitor 工具实例 |
| yZB | — | — | serial_read_history 工具实例 |
| qZB | — | — | serial_send_command 工具实例 |

## 3. 核心实现逻辑

### 3.1 串口架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    AI Agent (LLM)                        │
├────────────┬──────────────────┬──────────────────────────┤
│ serial_    │ serial_read_     │ serial_send_             │
│ monitor    │ history          │ command                  │
│ (TZB/NZB) │ (VZB/yZB)        │ (WZB/qZB)               │
├────────────┴──────────────────┴──────────────────────────┤
│              SharedSerialManager (ZI)                     │
│         subscribe / unsubscribe / write / isConnected     │
├──────────────────────────────────────────────────────────┤
│              串口 UI Store (fg)                           │
│         tabs / outputLines / connectionState              │
├──────────────────────────────────────────────────────────┤
│              Rust FFI 串口驱动 (YxB)                      │
│         platform-specific .so / .dylib / .dll            │
└──────────────────────────────────────────────────────────┘
```

### 3.2 SharedSerialManager (ZI)

`ZI` 是串口连接管理器单例，提供统一的串口操作接口：

| 方法 | 功能 |
|------|------|
| `ZI.subscribe(port, baudRate, listener)` | 订阅串口数据 |
| `ZI.unsubscribe(port, listenerId)` | 取消订阅 |
| `ZI.write(port, data)` | 写入数据 |
| `ZI.isConnected(port)` | 检查连接状态 |
| `ZI.getBaudRate(port)` | 获取当前波特率 |

### 3.3 串口 UI Store (fg)

`fg` 是一个状态管理 store，管理串口 UI 相关状态：

```javascript
fg.getState() = {
  tabs: [
    {
      id: string,
      activePort: string,          // 如 "/dev/ttyACM0"
      activeBaudRate: number,       // 如 115200
      connectionState: "connected" | "disconnected" | "error",
      outputLines: string[],        // 缓冲的输出行
      lastRetrievedIndex: number,   // 上次读取位置（轮询用）
      config: { port: string },
      error: string | null
    }
  ],
  getTabByPort(port): Tab | undefined,
  getUnretrievedOutput(port): { lines, newCount },
  sendToPort(port, data): boolean
};
```

### 3.4 serial_monitor 工具 (TZB/NZB)

#### 3.4.1 两种工作模式

| 模式 | 条件 | 超时默认值 | 行为 |
|------|------|----------|------|
| 停止字符串模式 | 提供 `stop_string` | 30 秒 | 持续监控直到检测到指定字符串 |
| 定时捕获模式 | 不提供 `stop_string` | 3 秒 | 捕获指定时间内的所有输出 |

#### 3.4.2 核心监控函数 — ZME()

```javascript
async function ZME(A, B, Q, E, g, C) {
  // A = port, B = baudRate, Q = stop_string, E = timeout, g = updateOutput, C = signal
  return new Promise((I) => {
    let w = "";           // 累积输出
    let D = false;         // stop_string 是否已检测到
    let H = "";            // 行缓冲（处理不完整行）
    let L = null;          // 超时定时器
    let R = null;          // 连接超时定时器
    let U = `serial-monitor-${Date.now()}-${Math.random()}`;

    // 行缓冲处理
    let J = () => {
      let h = H.split("\n");
      if (h.length > 1) {
        H = h.pop() || "";
        let V = h.join("\n") + (h.length > 0 ? "\n" : "");
        if (V.trim()) {
          w += V;
          if (g) g(w + (H ? H : ""));  // 流式更新 UI
        }
      }
    };

    let c = {
      id: U,
      onData: (h) => {
        H += h;
        J();  // 处理新数据

        // 检测 stop_string
        if (Q && !D && (w.includes(Q) || h.includes(Q) || H.includes(Q))) {
          D = true;
          // 等 1 秒收集额外数据后返回
          setTimeout(() => {
            J(); Y(); I({ output: w, success: true });
          }, 1000);
        }
      },
      onError: (h) => { Y(); I({ output: w, success: false, reason: `Serial port error: ${h}` }); },
      onClose: () => { if (!D) Y(); I({ output: w, success: false, reason: "Serial port closed unexpectedly" }); }
    };

    // 连接超时（5 秒）
    R = setTimeout(() => {
      if (!D && !ZI.isConnected(A))
        Y(); I({ output: w, success: false, reason: `Connection timeout` });
    }, 5000);

    // 订阅串口
    ZI.subscribe(A, B, c).then(() => {
      clearTimeout(R);
      yB.getState().serialAutoConnectHandler?.(A, B);

      // 主超时
      L = setTimeout(() => {
        if (!D) {
          J(); Y();
          if (Q) I({ output: w, success: false, reason: `Timeout: stop_string "${Q}" not found` });
          else   I({ output: w, success: true, reason: `Captured output for ${E/1000} seconds` });
        }
      }, E);
    });

    // 取消信号处理
    if (C) C.addEventListener("abort", G, { once: true });
  });
}
```

#### 3.4.3 自动波特率检测

```javascript
// serial_monitor execute 中
let g = A.baud_rate;
if (!g) {
  let R = FG().find(G => G.path === E) ?? null;  // FG() 列举所有端口
  g = (await z4(E, R)).baudRate;                   // z4() 自动检测波特率
}
```

#### 3.4.4 端口自动发现

```javascript
let E = A.port || MW();  // MW() 获取默认端口
```

`MW()` 从 EMBEDDER.md 配置或系统默认端口中获取。`FG()` 列举所有可用端口（可能通过 Rust FFI 调用系统串口枚举 API）。

#### 3.4.5 非打印字符检测（波特率不匹配提示）

```javascript
if (/[\x00-\x08\x0E-\x1F\x7F-\u00FF]/.test(w.output)) {
  D += "\nNOTE: Output contains non-printable characters, which may indicate:\n";
  D += "- Incorrect baud rate (try common rates: 9600, 19200, 38400, 57600, 115200)\n";
  D += "- Mismatched data bits, stop bits, or parity settings\n";
  D += "- Device not ready or sending binary data\n";
}
```

#### 3.4.6 输出截断

```javascript
var OZB = 10000;  // 最大字符数

if (w.output.length > OZB) {
  D += `\n--- Serial Output (truncated) ---\n`;
  D += w.output.substring(0, OZB);
  D += `\n... (output truncated, ${w.output.length} total characters)`;
}
```

### 3.5 serial_read_history 工具 (VZB/yZB)

不等待新数据，直接读取已缓冲的输出。

#### 3.5.1 三种使用模式

**模式 1：无 port 参数 — 列出所有连接的监控器**

```javascript
if (!A.port) {
  let Q = B.tabs.filter(H =>
    H.connectionState === "connected" && H.activePort
  );
  // 返回每个端口的状态：port, baudRate, lineCount, unreadCount
}
```

**模式 2：指定 port — 返回缓冲输出**

```javascript
let E = Q.find(H => H.activePort === A.port);
// 返回 E.outputLines
```

**模式 3：only_new: true — 只返回新数据（轮询模式）**

```javascript
if (A.only_new) {
  let H = B.getUnretrievedOutput(A.port);
  g = H.lines;
  C = H.newCount;
}
```

#### 3.5.2 行数截断 — jME()

```javascript
var qME = 100;   // 总行数上限
var WME = 30;    // 前部保留行数
var zME = 70;    // 后部保留行数

function jME(A) {
  if (A.length <= qME) return A;
  let B = A.slice(0, WME);
  let Q = A.slice(-zME);
  let E = A.length - B.length - Q.length;
  return [...B, `\n... (${E} lines truncated) ...\n`, ...Q];
}
```

超过 100 行时，保留前 30 行 + 后 70 行，中间截断。

### 3.6 serial_send_command 工具 (WZB/qZB)

发送命令到串口设备，等待 1 秒响应。

#### 3.6.1 三种连接状态处理

```javascript
execute: async (A, B) => {
  let { port: Q, baud_rate: E } = A;

  // 自动波特率检测
  if (!E) {
    let I = FG().find(D => D.path === Q) ?? null;
    E = (await z4(Q, I)).baudRate;
  }

  // 状态 1：已有 UI tab 连接
  let g = fg.getState().getTabByPort(Q);
  if (g) return await iME(g.id, Q, A.command);

  // 状态 2：已有底层连接（无 tab）
  if (ZI.isConnected(Q)) {
    let I = ZI.getBaudRate(Q);
    return await sME(Q, I || E, A.command);
  }

  // 状态 3：未连接 → 建立新连接后发送
  return await bME(Q, E, A.command);
}
```

#### 3.6.2 iME — 通过 UI tab 发送

```javascript
async function iME(A, B, Q) {
  let E = fg.getState();
  let g = E.tabs.find(D => D.id === A);
  let I = g.outputLines.length;  // 记录发送前的行数

  if (!E.sendToPort(B, Q)) return { success: false, ... };

  await new Promise(D => setTimeout(D, Lu));  // Lu = 1000ms 等待响应
  return sKA(B, C, Q, I);  // 收集响应
}
```

#### 3.6.3 sME — 通过 ZI 直接发送（无 tab）

```javascript
async function sME(A, B, Q) {
  yB.getState().serialAutoConnectHandler?.(A, B);
  let { tabId: E } = await ZZB(A, 2000);  // 等待 tab 创建

  if (E) {
    // tab 创建成功，通过 tab 发送
    let g = fg.getState();
    if (!g.sendToPort(A, Q)) return { success: false, ... };
    await new Promise(D => setTimeout(D, Lu));
    return sKA(A, B, Q, I);
  }

  // 直接通过 ZI 发送
  ZI.write(A, `${Q}\n`);
  return { success: true, llmContent: `Sent "${Q}" to ${A}...` };
}
```

#### 3.6.4 bME — 建立新连接后发送

```javascript
async function bME(A, B, Q) {
  let E = `serial-send-${Date.now()}-${Math.random()}`;
  try {
    // 订阅串口（建立连接）
    await ZI.subscribe(A, B, {
      id: E,
      onData: () => {},
      onError: () => {},
      onClose: () => {}
    });

    yB.getState().serialAutoConnectHandler?.(A, B);
    let { tabId: g, error: C } = await ZZB(A);  // 等待连接完成

    if (!g) {
      ZI.unsubscribe(A, E);
      return { success: false, llmContent: `Failed to connect: ${C}` };
    }

    // 连接成功，通过 tab 发送
    let I = fg.getState();
    let w = I.tabs.find(U => U.id === g);
    let H = w?.outputLines.length || 0;

    if (!I.sendToPort(A, Q)) {
      ZI.unsubscribe(A, E);
      return { success: false, ... };
    }

    await new Promise(U => setTimeout(U, Lu));  // 等待 1 秒
    ZI.unsubscribe(A, E);
    return sKA(A, D, Q, H);
  } catch (g) {
    ZI.unsubscribe(A, E);
    return { success: false, ... };
  }
}
```

#### 3.6.5 响应收集 — sKA()

```javascript
var Lu = 1000;    // 等待响应时间
var iKA = 50;     // 最大响应行数

function sKA(A, B, Q, E) {
  // E = 发送前的行数位置
  let I = fg.getState().tabs.find(L => L.activePort === A)
    ?.outputLines.slice(E) ?? [];

  let w = I.length > iKA;
  let D = w ? I.slice(0, iKA) : I;

  let H = `Sent "${Q}" to ${A} at ${B} baud.\n\n`;
  if (D.length > 0) {
    H += `--- Device Response from ${A} ---\n`;
    H += D.join("\n");
    if (w) H += `\n\n... (${I.length - iKA} more lines truncated)`;
  } else {
    H += "(No response received within 1 second)";
  }

  return { success: true, llmContent: H };
}
```

#### 3.6.6 连接等待 — ZZB()

```javascript
var vME = 5000;  // 最大等待时间

async function ZZB(A, B = vME) {
  let Q = Date.now();
  while (Date.now() - Q < B) {
    let E = fg.getState();

    // 检查连接成功
    let g = E.tabs.find(I => I.activePort === A && I.connectionState === "connected");
    if (g) return { tabId: g.id };

    // 检查连接失败
    let C = E.tabs.find(I => I.config.port === A && I.connectionState === "error");
    if (C) return { tabId: null, error: C.error || "Connection failed" };

    await new Promise(I => setTimeout(I, 100));  // 100ms 轮询
  }
  return { tabId: null, error: "Connection timeout" };
}
```

### 3.7 Rust FFI 串口驱动 (YxB)

`lib_serial.js` (503KB gzip) 是一个 Rust 编写的原生串口 I/O 库，编译为 platform-specific 动态库：
- Linux: `.so`
- macOS: `.dylib`
- Windows: `.dll`

通过 Bun 的 FFI 接口调用，提供底层串口操作（打开/关闭/读/写/配置波特率等）。这是 embedder 唯一使用 Rust 原生代码的模块。

### 3.8 上电验证的典型 AI 工作流

```
1. 烧录完成后，AI 自动执行上电验证
2. serial_monitor(port, baud_rate, stop_string="Ready")
   → 等待设备启动输出 "Ready" 字符串
3. 如果超时（30s 无 "Ready"）：
   → serial_read_history 检查已有输出
   → 分析输出内容（是否 Hard Fault、波特率不匹配等）
4. 如果成功：
   → serial_send_command(port, "AT") 测试命令响应
   → 验证设备功能正常
5. 报告验证结果给用户
```

## 4. 关键函数/变量映射表

| 混淆名 | 推测原名 | 位置 | 功能 |
|--------|---------|------|------|
| TZB | `serialMonitorModule` | tools_writeFile.js | serial_monitor 模块 |
| NZB | `serialMonitorTool` | tools_writeFile.js | serial_monitor 实例 |
| VZB | `serialReadHistoryModule` | tools_writeFile.js | serial_read_history 模块 |
| yZB | `serialReadHistoryTool` | tools_writeFile.js | serial_read_history 实例 |
| WZB | `serialSendCommandModule` | tools_writeFile.js | serial_send_command 模块 |
| qZB | `serialSendCommandTool` | tools_writeFile.js | serial_send_command 实例 |
| ZME | `monitorSerial` | tools_writeFile.js | 核心串口监控函数 |
| ZI | `SharedSerialManager` | lib_app.js | 串口连接管理器单例 |
| fg | `serialStore` | lib_app.js | 串口 UI 状态 store |
| YxB | `libSerial` | lib_serial.js | Rust FFI 串口驱动 |
| z4 | `autoDetectBaudRate` | — | 自动波特率检测 |
| MW | `getDefaultPort` | — | 获取默认串口 |
| FG | `listSerialPorts` | — | 列举所有串口 |
| OZB | `MAX_OUTPUT_CHARS` | tools_writeFile.js | 10000 字符截断阈值 |
| Lu | `RESPONSE_WAIT_MS` | tools_writeFile.js | 1000ms 响应等待 |
| iKA | `MAX_RESPONSE_LINES` | tools_writeFile.js | 50 行响应上限 |
| vME | `CONNECTION_TIMEOUT_MS` | tools_writeFile.js | 5000ms 连接超时 |
| qME | `MAX_HISTORY_LINES` | tools_writeFile.js | 100 行历史上限 |
| WME | `HEAD_LINES` | tools_writeFile.js | 30 行前部保留 |
| zME | `TAIL_LINES` | tools_writeFile.js | 70 行后部保留 |
| ZZB | `waitForConnection` | tools_writeFile.js | 轮询等待连接完成 |
| iME | `sendViaTab` | tools_writeFile.js | 通过 UI tab 发送 |
| sME | `sendViaDirect` | tools_writeFile.js | 通过 ZI 直接发送 |
| bME | `sendWithNewConnection` | tools_writeFile.js | 建立新连接后发送 |
| sKA | `collectResponse` | tools_writeFile.js | 收集设备响应 |
| jME | `truncateLines` | tools_writeFile.js | 行截断（前30+后70） |
| sfB | `serialMonitorSchema` | — | serial_monitor 输入 schema |
| bfB | `serialReadHistorySchema` | — | serial_read_history 输入 schema |
| dfB | `serialSendCommandSchema` | — | serial_send_command 输入 schema |

## 5. 与 src/ 骨架的差异对比

| 方面 | embedder 原始实现 | 我们的 src/ 骨架 |
|------|------------------|-----------------|
| 串口驱动 | Rust FFI 原生库 (503KB) | 需要实现 |
| 连接管理 | SharedSerialManager 单例 + subscribe/unsubscribe | 需要实现 |
| 状态管理 | fg store（tabs, outputLines, connectionState） | 需要实现 |
| 串口监控 | stop_string 模式 + 定时捕获模式 | 需要实现 |
| 历史读取 | 缓冲输出 + only_new 轮询 + 行截断 | 需要实现 |
| 命令发送 | 三种连接状态自动处理 + 1 秒响应等待 | 需要实现 |
| 波特率检测 | z4() 自动探测 + 非打印字符提示 | 需要实现 |

## 6. 逆向改进建议

1. **串口驱动可用 Node.js serialport**：embedder 使用 503KB 的 Rust FFI 库。如果不需要极致性能，Node.js 的 `serialport` 包更易维护，且 Bun 也支持。

2. **stop_string 应支持正则**：当前只支持精确字符串匹配。嵌入式设备的启动输出格式可能有变化（如版本号变动），正则匹配更灵活。

3. **响应等待应自适应**：当前固定等待 1 秒。有些设备响应快（< 100ms），有些慢（> 5s）。可以实现"无新数据超过 N ms 即认为响应完成"的自适应策略。

4. **串口数据应支持二进制模式**：当前只处理文本数据。有些嵌入式协议（如 Modbus RTU、自定义协议）需要二进制串口通信。

5. **增加串口录制/回放**：记录串口通信日志，用于调试和回归测试。embedder 当前的 outputLines 缓冲是易失的（会话结束即丢失）。

6. **并行多串口支持**：embedder 的 fg store 已支持多 tab，但 AI agent 一次只处理一个端口。可以支持同时监控多个串口（如 MCU 串口 + 外设 UART）。
