// /home/leo/work/embedder/src/types/serial.ts
// Serial types for serial port communication, configuration, and connection management.

export type BaudRate =
  | 300
  | 1200
  | 2400
  | 4800
  | 9600
  | 19200
  | 38400
  | 57600
  | 115200
  | 230400
  | 460800
  | 921600
  | 1000000;

export type DataBits = 5 | 6 | 7 | 8;
export type StopBits = 1 | 1.5 | 2;
export type Parity = "none" | "even" | "odd" | "mark" | "space";
export type FlowControl = "none" | "hardware" | "software";

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "reconnecting";

export interface SerialPortInfo {
  path: string;
  manufacturer?: string;
  productId?: string;
  vendorId?: string;
  serialNumber?: string;
  friendlyName?: string;
  pnpId?: string;
}

export interface SerialConfig {
  baudRate: BaudRate;
  dataBits: DataBits;
  stopBits: StopBits;
  parity: Parity;
  flowControl: FlowControl;
  encoding: BufferEncoding;
  lineEnding: LineEnding;
  localEcho: boolean;
  autoReconnect: boolean;
  reconnectIntervalMs: number;
}

export type LineEnding = "lf" | "cr" | "crlf" | "none";
export type BufferEncoding = "utf-8" | "ascii" | "hex" | "binary";

export interface SerialTab {
  id: string;
  label: string;
  portInfo: SerialPortInfo;
  config: SerialConfig;
  state: ConnectionState;
  openedAt: number;
  lastDataAt: number | null;
  scrollback: SerialMessage[];
  maxScrollbackLines: number;
  filters: SerialFilter[];
}

export interface SerialMessage {
  timestamp: number;
  direction: "rx" | "tx";
  data: string;
  raw: Uint8Array;
  highlighted?: boolean;
}

export interface SerialFilter {
  id: string;
  pattern: string;
  isRegex: boolean;
  caseSensitive: boolean;
  highlight: boolean;
  color?: string;
  hide?: boolean;
}

export interface SerialMonitorState {
  tabs: SerialTab[];
  activeTabId: string | null;
  availablePorts: SerialPortInfo[];
  defaultConfig: SerialConfig;
  isScanning: boolean;
}

export interface SerialEvent {
  type: "data" | "open" | "close" | "error" | "drain";
  tabId: string;
  payload?: string | Error;
  timestamp: number;
}
