import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from '../shared/types'
import type { AppConfig, Row } from '../shared/types'
import { loadConfig, saveConfig } from './services/ConfigService'
import fs from 'fs'
import { ExcelService } from './services/ExcelService'
import { fillAndPrint } from './services/WordService'

export function registerIpcHandlers(win: BrowserWindow): void {
  // ── Config ──────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.CONFIG_GET, (): AppConfig => {
    const cfg = loadConfig()
    // сбрасываем несуществующие пути чтобы renderer не показывал мёртвые пути
    if (cfg.mainExcelFilePath && !fs.existsSync(cfg.mainExcelFilePath))
      cfg.mainExcelFilePath = ''
    if (cfg.sellExcelFilePath && !fs.existsSync(cfg.sellExcelFilePath))
      cfg.sellExcelFilePath = ''
    return cfg
  })

  ipcMain.handle(IPC.CONFIG_SET, (_e, partial: Partial<AppConfig>): AppConfig => {
    const current = loadConfig()
    const next = { ...current, ...partial }
    saveConfig(next)
    return next
  })

  // ── File dialog ─────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.DIALOG_OPEN_EXCEL, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Excel файлы', extensions: ['xlsx', 'xls'] }],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  // ── Excel ───────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.EXCEL_SAVE_ROW, async (_e, filePath: string, row: Row): Promise<Row> => {
    const svc = new ExcelService(filePath)
    return await svc.saveRow(row)
  })

  ipcMain.handle(IPC.EXCEL_SAVE_SELL_ROW, async (_e, filePath: string, row: Row): Promise<Row> => {
    const svc = new ExcelService(filePath)
    return await svc.saveSellRow(row)
  })

  ipcMain.handle(
    IPC.EXCEL_GET_AUTOCOMPLETE,
    async (_e, filePath: string): Promise<{ names: string[]; phones: string[] }> => {
      const svc = new ExcelService(filePath)
      const rows = await svc.getAllRows()

      // Deduplicate, case-insensitive for names
      const namesSeen = new Set<string>()
      const names: string[] = []
      for (const r of rows) {
        const key = r.customerName.toLowerCase()
        if (key && !namesSeen.has(key)) {
          namesSeen.add(key)
          names.push(r.customerName)
        }
      }

      const phones = [...new Set(rows.map(r => r.phone).filter(Boolean))]

      return { names, phones }
    }
  )

  // ── Word ────────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.WORD_FILL_AND_PRINT, async (_e, row: Row): Promise<void> => {
    await fillAndPrint(row)
  })
}
