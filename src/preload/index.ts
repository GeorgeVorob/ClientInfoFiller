import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type { AppConfig, Row } from '../shared/types'

/**
 * All renderer↔main communication goes through this typed bridge.
 * Available in renderer as `window.api`.
 */
const api = {
  /** Open a native file-picker for .xlsx/.xls files. Returns path or null on cancel. */
  openExcelFile(): Promise<string | null> {
    return ipcRenderer.invoke(IPC.DIALOG_OPEN_EXCEL)
  },

  getConfig(): Promise<AppConfig> {
    return ipcRenderer.invoke(IPC.CONFIG_GET)
  },

  setConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
    return ipcRenderer.invoke(IPC.CONFIG_SET, partial)
  },

  /** Save or update an order row. Returns the row with id/rowPos assigned. */
  saveRow(filePath: string, row: Row, sbpEnabled: boolean): Promise<Row> {
    return ipcRenderer.invoke(IPC.EXCEL_SAVE_ROW, filePath, row, sbpEnabled)
  },

  saveSellRow(filePath: string, row: Row): Promise<Row> {
    return ipcRenderer.invoke(IPC.EXCEL_SAVE_SELL_ROW, filePath, row)
  },

  /** Load unique customer names and phones for autocomplete. */
  getAutocomplete(filePath: string, sbpEnabled: boolean): Promise<{ names: string[]; phones: string[]; nameToPhone: Record<string, string> }> {
    return ipcRenderer.invoke(IPC.EXCEL_GET_AUTOCOMPLETE, filePath, sbpEnabled)
  },

  /** Fill the Word template and open it for review/printing. */
  fillAndPrint(row: Row): Promise<void> {
    return ipcRenderer.invoke(IPC.WORD_FILL_AND_PRINT, row)
  },
}

contextBridge.exposeInMainWorld('api', api)

// TypeScript declaration for window.api in renderer
export type ElectronAPI = typeof api
