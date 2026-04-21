export interface Row {
  rowPos: number
  id: number
  customerName: string
  costumeName: string
  phone: string
  /** ISO date string */
  creationDate: string
  /** ISO date string */
  actualOrderDate: string
  /** ISO date string */
  returnDate: string
  price: number
  prepaymentCash: number
  prepaymentDigital: number
  pledgeCash: number
  pledgeDigital: number
  comment: string
}

export function calcOwe(row: Row): number {
  return row.price - row.prepaymentCash - row.prepaymentDigital
}

export function newRow(): Row {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  return {
    rowPos: -1,
    id: -1,
    customerName: '',
    costumeName: '',
    phone: '',
    creationDate: today,
    actualOrderDate: today,
    returnDate: today,
    price: 0,
    prepaymentCash: 0,
    prepaymentDigital: 0,
    pledgeCash: 0,
    pledgeDigital: 0,
    comment: '',
  }
}

export interface AppConfig {
  mainExcelFilePath: string
  sellExcelFilePath: string
}

export interface AutocompleteData {
  names: string[]
  phones: string[]
}

// IPC channel names (single source of truth shared between main and preload)
export const IPC = {
  DIALOG_OPEN_EXCEL: 'dialog:openExcel',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  EXCEL_SAVE_ROW: 'excel:saveRow',
  EXCEL_SAVE_SELL_ROW: 'excel:saveSellRow',
  EXCEL_GET_AUTOCOMPLETE: 'excel:getAutocomplete',
  WORD_FILL_AND_PRINT: 'word:fillAndPrint',
} as const
