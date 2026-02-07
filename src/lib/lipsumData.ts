// Test/demo data

export interface LipsumMessage {
  role: "user" | "assistant";
  content: string;
}

export const lipsumMessages: LipsumMessage[] = [
  {
    role: "user",
    content: "How do I configure UART on STM32?",
  },
  {
    role: "assistant",
    content:
      "To configure UART on an STM32 microcontroller, you need to: 1) Enable the clock for the UART peripheral and GPIO pins, 2) Configure the GPIO pins for alternate function mode, 3) Set baud rate, word length, stop bits, and parity in the UART registers, 4) Enable the UART peripheral.",
  },
  {
    role: "user",
    content: "Can you show me the HAL initialization code?",
  },
  {
    role: "assistant",
    content:
      'Here is a basic UART initialization using STM32 HAL:\n\n```c\nUART_HandleTypeDef huart2;\nhuart2.Instance = USART2;\nhuart2.Init.BaudRate = 115200;\nhuart2.Init.WordLength = UART_WORDLENGTH_8B;\nhuart2.Init.StopBits = UART_STOPBITS_1;\nhuart2.Init.Parity = UART_PARITY_NONE;\nhuart2.Init.Mode = UART_MODE_TX_RX;\nHAL_UART_Init(&huart2);\n```',
  },
];

export function loadLipsum(): LipsumMessage[] {
  return [...lipsumMessages];
}

export default { lipsumMessages, loadLipsum };
