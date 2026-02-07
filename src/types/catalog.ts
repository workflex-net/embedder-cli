// /home/leo/work/embedder/src/types/catalog.ts
// Catalog types for embedded hardware definitions: chips, boards, peripherals, and platforms.

export interface Chip {
  id: string;
  name: string;
  manufacturer: string;
  architecture: ChipArchitecture;
  core: string;
  flashSizeKb: number;
  ramSizeKb: number;
  maxClockMhz: number;
  peripherals: PeripheralRef[];
  packageTypes: string[];
  datasheet?: string;
}

export type ChipArchitecture =
  | "arm-cortex-m0"
  | "arm-cortex-m0+"
  | "arm-cortex-m3"
  | "arm-cortex-m4"
  | "arm-cortex-m7"
  | "arm-cortex-m33"
  | "riscv32"
  | "xtensa"
  | "avr"
  | "mips";

export interface Board {
  id: string;
  name: string;
  manufacturer: string;
  chip: Chip;
  platform: Platform;
  connectors: Connector[];
  debugInterface?: DebugInterface;
  imageUrl?: string;
  purchaseUrl?: string;
}

export interface Connector {
  name: string;
  type: "header" | "usb" | "jtag" | "swd" | "grove" | "qwiic" | "other";
  pinCount: number;
}

export type DebugInterface = "swd" | "jtag" | "uart" | "usb" | "builtin";

export interface Peripheral {
  id: string;
  name: string;
  type: PeripheralType;
  description: string;
  channels?: number;
  maxSpeed?: number;
  resolution?: number;
}

export type PeripheralType =
  | "gpio"
  | "uart"
  | "spi"
  | "i2c"
  | "adc"
  | "dac"
  | "pwm"
  | "timer"
  | "can"
  | "usb"
  | "ethernet"
  | "dma"
  | "rtc"
  | "watchdog";

export interface PeripheralRef {
  peripheralId: string;
  instanceCount: number;
}

export interface Platform {
  id: string;
  name: string;
  framework: "zephyr" | "esp-idf" | "stm32cube" | "arduino" | "mbed" | "freertos" | "bare-metal";
  version: string;
  supportedArchitectures: ChipArchitecture[];
  toolchainId?: string;
}

export interface CatalogItem {
  type: "chip" | "board" | "peripheral" | "platform";
  item: Chip | Board | Peripheral | Platform;
  tags: string[];
  lastUpdated: number;
}

export interface CatalogFilter {
  type?: CatalogItem["type"];
  architecture?: ChipArchitecture;
  manufacturer?: string;
  searchQuery?: string;
}
