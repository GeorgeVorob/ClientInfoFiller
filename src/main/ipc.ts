import fs from 'fs'
import { BrowserWindow, dialog, ipcMain } from 'electron'
import { IPC } from '../shared/types'
import type { AppConfig, Row, SearchRequest } from '../shared/types'
import { loadConfig, saveConfig } from './services/ConfigService'
import { ExcelService } from './services/ExcelService'
import { logError } from './services/logError'
import { fillAndPrint } from './services/WordService'

export function registerIpcHandlers(win: BrowserWindow): void {
  ipcMain.handle(IPC.CONFIG_GET, (): AppConfig => {
    try {
      const cfg = loadConfig()
      if (cfg.mainExcelFilePath && !fs.existsSync(cfg.mainExcelFilePath)) cfg.mainExcelFilePath = ''
      if (cfg.sellExcelFilePath && !fs.existsSync(cfg.sellExcelFilePath)) cfg.sellExcelFilePath = ''
      return cfg
    } catch (e) {
      logError('IPC.CONFIG_GET', e)
      throw e
    }
  })

  ipcMain.handle(IPC.CONFIG_SET, (_e, partial: Partial<AppConfig>): AppConfig => {
    try {
      const current = loadConfig()
      const next = { ...current, ...partial }
      saveConfig(next)
      return next
    } catch (e) {
      logError('IPC.CONFIG_SET', e, { partial })
      throw e
    }
  })

  ipcMain.handle(IPC.DIALOG_OPEN_EXCEL, async (): Promise<string | null> => {
    try {
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
        filters: [{ name: 'Excel файлы', extensions: ['xlsx', 'xls'] }],
      })
      return result.canceled ? null : result.filePaths[0]
    } catch (e) {
      logError('IPC.DIALOG_OPEN_EXCEL', e)
      throw e
    }
  })

  ipcMain.handle(IPC.EXCEL_SAVE_ROW, async (_e, filePath: string, row: Row, sbpEnabled: boolean): Promise<Row> => {
    try {
      const svc = new ExcelService(filePath, { sbpEnabled })
      return await svc.saveRow(row)
    } catch (e) {
      logError('IPC.EXCEL_SAVE_ROW', e, { filePath, row, sbpEnabled })
      throw e
    }
  })

  ipcMain.handle(IPC.EXCEL_SAVE_SELL_ROW, async (_e, filePath: string, row: Row): Promise<Row> => {
    try {
      const svc = new ExcelService(filePath)
      return await svc.saveSellRow(row)
    } catch (e) {
      logError('IPC.EXCEL_SAVE_SELL_ROW', e, { filePath, row })
      throw e
    }
  })

  ipcMain.handle(
    IPC.EXCEL_GET_AUTOCOMPLETE,
    async (_e, filePath: string, sbpEnabled: boolean): Promise<{ names: string[]; phones: string[]; nameToPhone: Record<string, string> }> => {
      try {
        const svc = new ExcelService(filePath, { sbpEnabled })
        const rows = await svc.getAllRows()

        const namesSeen = new Set<string>()
        const names: string[] = []
        const nameToPhone: Record<string, string> = {}

        for (const r of rows) {
          const key = r.customerName?.toLowerCase()
          if (key && !namesSeen.has(key)) {
            namesSeen.add(key)
            names.push(r.customerName)
            if (r.phone) nameToPhone[r.customerName] = r.phone
          }
        }

        const phones = [...new Set(rows.map(r => r.phone).filter(Boolean))]
        return { names, phones, nameToPhone }
      } catch (e) {
        logError('IPC.EXCEL_GET_AUTOCOMPLETE', e, { filePath, sbpEnabled })
        throw e
      }
    }
  )

  ipcMain.handle(
    IPC.EXCEL_SEARCH_ROWS,
    async (_e, filePath: string, request: SearchRequest, sbpEnabled: boolean): Promise<Row[]> => {
      try {
        const svc = new ExcelService(filePath, { sbpEnabled })
        return await svc.searchRows(request)
      } catch (e) {
        logError('IPC.EXCEL_SEARCH_ROWS', e, { filePath, request, sbpEnabled })
        throw e
      }
    }
  )

  ipcMain.handle(IPC.WORD_FILL_AND_PRINT, async (_e, row: Row): Promise<void> => {
    try {
      await fillAndPrint(row)
    } catch (e) {
      logError('IPC.WORD_FILL_AND_PRINT', e, { row })
      throw e
    }
  })
}
