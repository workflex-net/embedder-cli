// Hardware catalog

export interface Chip {
  id: string;
  name: string;
  family: string;
  architecture: string;
}

export interface Board {
  id: string;
  name: string;
  chipId: string;
  peripherals: string[];
}

export interface Peripheral {
  id: string;
  name: string;
  type: string;
}

let catalogData: { chips: Chip[]; boards: Board[]; peripherals: Peripheral[] } | null = null;

export function getCatalog(): { chips: Chip[]; boards: Board[]; peripherals: Peripheral[] } {
  if (!catalogData) {
    catalogData = { chips: [], boards: [], peripherals: [] };
  }
  return catalogData;
}

export function getChips(): Chip[] {
  return getCatalog().chips;
}

export function getBoards(): Board[] {
  return getCatalog().boards;
}

export function getPeripherals(): Peripheral[] {
  return getCatalog().peripherals;
}

/** Get peripherals for a specific project ($R) */
export function $R(projectId: string): Peripheral[] {
  // Resolve project peripherals from board configuration
  return getPeripherals();
}

export default { getCatalog, getChips, getBoards, getPeripherals, $R };
