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
  prepaymentSBP: number
  pledgeCash: number
  pledgeDigital: number
  pledgeSBP: number
  pledgeTotal: number
  comment: string
}

export function calcOwe(row: Row): number {
  return row.price - row.prepaymentCash - row.prepaymentDigital - row.prepaymentSBP
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
    prepaymentSBP: 0,
    pledgeCash: 0,
    pledgeDigital: 0,
    pledgeSBP: 0,
    pledgeTotal: 0,
    comment: '',
  }
}

export interface AppConfig {
  mainExcelFilePath: string
  sellExcelFilePath: string
  sbpEnabled: boolean
}

export interface AutocompleteData {
  names: string[]
  phones: string[]
}

export type SearchMode = 'byName' | 'byPhone' | 'byCostume' | 'byId'

export interface SearchRequest {
  mode: SearchMode
  query: string
  limit: number
}

// IPC channel names (single source of truth shared between main and preload)
export const IPC = {
  DIALOG_OPEN_EXCEL: 'dialog:openExcel',
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  EXCEL_SAVE_ROW: 'excel:saveRow',
  EXCEL_SAVE_SELL_ROW: 'excel:saveSellRow',
  EXCEL_GET_AUTOCOMPLETE: 'excel:getAutocomplete',
  EXCEL_SEARCH_ROWS: 'excel:searchRows',
  WORD_FILL_AND_PRINT: 'word:fillAndPrint',
} as const
