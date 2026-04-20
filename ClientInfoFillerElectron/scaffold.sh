#!/usr/bin/env bash
# scaffold.sh — создаёт всю структуру проекта costume-crm с нуля
# Запуск: bash scaffold.sh
set -e

ROOT="costume-crm"

echo "📁 Создаём структуру папок..."
mkdir -p "$ROOT/src/main/services"
mkdir -p "$ROOT/src/preload"
mkdir -p "$ROOT/src/renderer/src/components"
mkdir -p "$ROOT/src/shared"
mkdir -p "$ROOT/assets"

echo "📝 Пишем файлы..."

# ── package.json ──────────────────────────────────────────────────────────────
cat > "$ROOT/package.json" << 'HEREDOC'
{
  "name": "costume-crm",
  "version": "1.0.0",
  "description": "Costume rental CRM",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "package": "electron-vite build && electron-builder"
  },
  "dependencies": {
    "docxtemplater": "^3.45.0",
    "exceljs": "^4.4.0",
    "pizzip": "^3.1.6"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "electron": "^31.0.0",
    "electron-builder": "^24.0.0",
    "electron-vite": "^2.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "build": {
    "appId": "com.costume.crm",
    "productName": "CostumeCRM",
    "directories": { "output": "release" },
    "extraResources": [{ "from": "assets/", "to": "assets/" }],
    "win": { "target": "nsis" },
    "nsis": { "oneClick": false, "allowToChangeInstallationDirectory": true }
  }
}
HEREDOC

# ── tsconfig.json ─────────────────────────────────────────────────────────────
cat > "$ROOT/tsconfig.json" << 'HEREDOC'
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
HEREDOC

# ── tsconfig.node.json ────────────────────────────────────────────────────────
cat > "$ROOT/tsconfig.node.json" << 'HEREDOC'
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src/main/**/*", "src/preload/**/*", "electron.vite.config.*"]
}
HEREDOC

# ── tsconfig.web.json ─────────────────────────────────────────────────────────
cat > "$ROOT/tsconfig.web.json" << 'HEREDOC'
{
  "compilerOptions": {
    "composite": true,
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "outDir": "dist/renderer",
    "rootDir": "src/renderer/src",
    "paths": {
      "@shared/*": ["../../shared/*"]
    }
  },
  "include": ["src/renderer/src/**/*"]
}
HEREDOC

# ── electron.vite.config.ts ───────────────────────────────────────────────────
cat > "$ROOT/electron.vite.config.ts" << 'HEREDOC'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': resolve('src/shared') } }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { '@shared': resolve('src/shared') } }
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@': resolve('src/renderer/src')
      }
    }
  }
})
HEREDOC

# ── src/shared/types.ts ───────────────────────────────────────────────────────
cat > "$ROOT/src/shared/types.ts" << 'HEREDOC'
export interface Row {
  rowPos: number
  id: number
  customerName: string
  costumeName: string
  phone: string
  creationDate: string
  actualOrderDate: string
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
  const day15 = new Date(now.getFullYear(), now.getMonth(), 15).toISOString()
  return {
    rowPos: -1, id: -1,
    customerName: '', costumeName: '', phone: '',
    creationDate: day15, actualOrderDate: day15, returnDate: day15,
    price: 0, prepaymentCash: 0, prepaymentDigital: 0,
    pledgeCash: 0, pledgeDigital: 0, comment: '',
  }
}

export interface AppConfig {
  mainExcelFilePath: string
  sellExcelFilePath: string
}

export const IPC = {
  DIALOG_OPEN_EXCEL:      'dialog:openExcel',
  CONFIG_GET:             'config:get',
  CONFIG_SET:             'config:set',
  EXCEL_SAVE_ROW:         'excel:saveRow',
  EXCEL_SAVE_SELL_ROW:    'excel:saveSellRow',
  EXCEL_GET_AUTOCOMPLETE: 'excel:getAutocomplete',
  WORD_FILL_AND_PRINT:    'word:fillAndPrint',
} as const
HEREDOC

# ── src/main/services/ConfigService.ts ───────────────────────────────────────
cat > "$ROOT/src/main/services/ConfigService.ts" << 'HEREDOC'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { AppConfig } from '../../shared/types'

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json')
const DEFAULT_CONFIG: AppConfig = { mainExcelFilePath: '', sellExcelFilePath: '' }

export function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    }
  } catch { /* corrupt — fall back */ }
  return { ...DEFAULT_CONFIG }
}

export function saveConfig(config: AppConfig): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
}
HEREDOC

# ── src/main/services/ExcelService.ts ────────────────────────────────────────
cat > "$ROOT/src/main/services/ExcelService.ts" << 'HEREDOC'
/**
 * Column mapping (matches original C# app):
 *  A(1)  ID              H(8)  Price
 *  B(2)  CustomerName    I(9)  PrepaymentDigital
 *  C(3)  CostumeName     J(10) PrepaymentCash
 *  D(4)  Phone           K(11) Owe (computed)
 *  E(5)  CreationDate    L(12) PledgeCash
 *  F(6)  ActualOrderDate M(13) PledgeDigital
 *  G(7)  ReturnDate      N(14) Comment
 *
 * Sell sheet: A ID, B CustomerName, C CostumeName, D Phone,
 *             E PrepaymentCash, F PrepaymentDigital, G Comment
 */
import ExcelJS from 'exceljs'
import type { Row } from '../../shared/types'

const DATE_FMT = 'dd.mm.yyyy'

function formatDMY(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
}

function parseDMY(text: string): string {
  const m = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) {
    const d = new Date(+m[3], +m[2]-1, +m[1])
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  const d = new Date(text)
  return isNaN(d.getTime()) ? defaultISO() : d.toISOString()
}

function defaultISO(): string {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), 15).toISOString()
}

function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return formatDMY(v.toISOString())
  if (typeof v === 'object') {
    if ('richText' in v) return (v as ExcelJS.CellRichTextValue).richText.map(r => r.text).join('')
    if ('result' in v) return String((v as ExcelJS.CellFormulaValue).result ?? '')
    if ('error' in v) return ''
  }
  return String(v)
}

function numCell(cell: ExcelJS.Cell): number {
  const n = parseInt(cellText(cell)); return isNaN(n) ? 0 : n
}

function findLastEmptyRow(ws: ExcelJS.Worksheet): { rowPos: number; lastId: number } {
  let rowPos = 2, lastId = 0
  while (true) {
    const text = cellText(ws.getRow(rowPos).getCell(1))
    if (text !== '') { const id = parseInt(text); if (!isNaN(id)) lastId = id; rowPos++ }
    else break
  }
  return { rowPos, lastId: lastId + 1 }
}

function readRow(ws: ExcelJS.Worksheet, rowPos: number): Row {
  const r = ws.getRow(rowPos)
  const c = (col: number) => r.getCell(col)
  return {
    rowPos, id: parseInt(cellText(c(1))) || -1,
    customerName: cellText(c(2)), costumeName: cellText(c(3)), phone: cellText(c(4)),
    creationDate: parseDMY(cellText(c(5))), actualOrderDate: parseDMY(cellText(c(6))),
    returnDate: parseDMY(cellText(c(7))), price: numCell(c(8)),
    prepaymentDigital: numCell(c(9)), prepaymentCash: numCell(c(10)),
    pledgeCash: numCell(c(12)), pledgeDigital: numCell(c(13)), comment: cellText(c(14)),
  }
}

function writeRow(ws: ExcelJS.Worksheet, data: Row): void {
  if (data.rowPos < 2) throw new Error('Некорректная позиция строки.')
  const owe = data.price - data.prepaymentCash - data.prepaymentDigital
  const r = ws.getRow(data.rowPos)
  r.getCell(1).value = data.id
  r.getCell(2).value = data.customerName
  r.getCell(3).value = data.costumeName
  r.getCell(4).value = data.phone
  const setDate = (col: number, iso: string) => {
    const cell = r.getCell(col); cell.value = new Date(iso); cell.numFmt = DATE_FMT
  }
  setDate(5, data.creationDate); setDate(6, data.actualOrderDate); setDate(7, data.returnDate)
  r.getCell(8).value = data.price
  r.getCell(9).value = data.prepaymentDigital
  r.getCell(10).value = data.prepaymentCash
  r.getCell(11).value = owe
  r.getCell(12).value = data.pledgeCash
  r.getCell(13).value = data.pledgeDigital
  r.getCell(14).value = data.comment
  r.commit()
}

function writeSellRow(ws: ExcelJS.Worksheet, data: Row): void {
  if (data.rowPos < 2) throw new Error('Некорректная позиция строки.')
  const r = ws.getRow(data.rowPos)
  r.getCell(1).value = data.id
  r.getCell(2).value = data.customerName
  r.getCell(3).value = data.costumeName
  r.getCell(4).value = data.phone
  r.getCell(5).value = data.prepaymentCash
  r.getCell(6).value = data.prepaymentDigital
  r.getCell(7).value = data.comment
  r.commit()
}

export class ExcelService {
  constructor(private filePath: string) {}

  private async open() {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(this.filePath)
    const ws = wb.worksheets[0]
    if (!ws) throw new Error('В файле нет листов.')
    return { wb, ws }
  }

  async saveRow(data: Row): Promise<Row> {
    const { wb, ws } = await this.open()
    if (data.rowPos === -1) {
      const { rowPos, lastId } = findLastEmptyRow(ws)
      data = { ...data, rowPos, id: lastId }
    }
    writeRow(ws, data)
    await wb.xlsx.writeFile(this.filePath)
    return data
  }

  async saveSellRow(data: Row): Promise<Row> {
    const { wb, ws } = await this.open()
    const { rowPos, lastId } = findLastEmptyRow(ws)
    data = { ...data, rowPos, id: lastId }
    writeSellRow(ws, data)
    await wb.xlsx.writeFile(this.filePath)
    return data
  }

  async getAllRows(): Promise<Row[]> {
    const { ws } = await this.open()
    const { rowPos: lastEmpty } = findLastEmptyRow(ws)
    const rows: Row[] = []
    for (let i = 2; i < lastEmpty; i++) rows.push(readRow(ws, i))
    return rows
  }
}
HEREDOC

# ── src/main/services/WordService.ts ─────────────────────────────────────────
cat > "$ROOT/src/main/services/WordService.ts" << 'HEREDOC'
/**
 * Шаблон Word должен содержать плейсхолдеры в фигурных скобках вместо закладок:
 *   {ID} {CustomerName} {CostumeName} {Phone}
 *   {CreationDate} {ActualOrderDate} {ReturnDate}
 *   {Price} {Prepayment} {Owe} {Pledge} {Comment} {PrintDateTime}
 *
 * Положите wordTemplate.docx в папку assets/ проекта.
 */
import path from 'path'
import fs from 'fs'
import { app, shell } from 'electron'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import type { Row } from '../../shared/types'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`
}

function money(cash: number, digital: number): string {
  const parts: string[] = []
  if (cash) parts.push(`${cash}(н)`)
  if (digital) parts.push(`${digital}(бн)`)
  return parts.join(' ')
}

function tplPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'wordTemplate.docx')
    : path.join(app.getAppPath(), 'assets', 'wordTemplate.docx')
}

export async function fillAndPrint(data: Row): Promise<void> {
  const tp = tplPath()
  if (!fs.existsSync(tp))
    throw new Error(`Шаблон Word не найден:\n${tp}\n\nПоложите wordTemplate.docx в папку assets/.`)

  const zip = new PizZip(fs.readFileSync(tp, 'binary'))
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, errorLogging: false })

  doc.render({
    ID: String(data.id),
    CustomerName: data.customerName,
    CostumeName: data.costumeName,
    Phone: data.phone,
    CreationDate: fmtDate(data.creationDate),
    ActualOrderDate: fmtDate(data.actualOrderDate),
    ReturnDate: fmtDate(data.returnDate),
    Price: String(data.price),
    Prepayment: money(data.prepaymentCash, data.prepaymentDigital),
    Owe: String(data.price - data.prepaymentCash - data.prepaymentDigital),
    Pledge: money(data.pledgeCash, data.pledgeDigital),
    Comment: data.comment,
    PrintDateTime: new Date().toLocaleString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }),
  })

  const dir = path.join(app.getPath('temp'), 'CostumeCRM')
  fs.mkdirSync(dir, { recursive: true })
  // clean old files
  for (const f of fs.readdirSync(dir)) { try { fs.unlinkSync(path.join(dir, f)) } catch {} }

  const out = path.join(dir, `order-${data.id}-${Date.now()}.docx`)
  fs.writeFileSync(out, doc.getZip().generate({ type: 'nodebuffer' }))

  const err = await shell.openPath(out)
  if (err) throw new Error(`Не удалось открыть файл: ${err}`)
}
HEREDOC

# ── src/main/ipc.ts ───────────────────────────────────────────────────────────
cat > "$ROOT/src/main/ipc.ts" << 'HEREDOC'
import { ipcMain, dialog, BrowserWindow } from 'electron'
import { IPC } from '../shared/types'
import type { AppConfig, Row } from '../shared/types'
import { loadConfig, saveConfig } from './services/ConfigService'
import { ExcelService } from './services/ExcelService'
import { fillAndPrint } from './services/WordService'

export function registerIpcHandlers(win: BrowserWindow): void {
  ipcMain.handle(IPC.CONFIG_GET, (): AppConfig => loadConfig())

  ipcMain.handle(IPC.CONFIG_SET, (_e, partial: Partial<AppConfig>): AppConfig => {
    const next = { ...loadConfig(), ...partial }
    saveConfig(next)
    return next
  })

  ipcMain.handle(IPC.DIALOG_OPEN_EXCEL, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [{ name: 'Excel файлы', extensions: ['xlsx', 'xls'] }],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle(IPC.EXCEL_SAVE_ROW, async (_e, filePath: string, row: Row): Promise<Row> =>
    new ExcelService(filePath).saveRow(row))

  ipcMain.handle(IPC.EXCEL_SAVE_SELL_ROW, async (_e, filePath: string, row: Row): Promise<Row> =>
    new ExcelService(filePath).saveSellRow(row))

  ipcMain.handle(IPC.EXCEL_GET_AUTOCOMPLETE, async (_e, filePath: string) => {
    const rows = await new ExcelService(filePath).getAllRows()
    const seen = new Set<string>()
    const names: string[] = []
    for (const r of rows) {
      const k = r.customerName.toLowerCase()
      if (k && !seen.has(k)) { seen.add(k); names.push(r.customerName) }
    }
    const phones = [...new Set(rows.map(r => r.phone).filter(Boolean))]
    return { names, phones }
  })

  ipcMain.handle(IPC.WORD_FILL_AND_PRINT, async (_e, row: Row): Promise<void> =>
    fillAndPrint(row))
}
HEREDOC

# ── src/main/index.ts ─────────────────────────────────────────────────────────
cat > "$ROOT/src/main/index.ts" << 'HEREDOC'
import { app, BrowserWindow } from 'electron'
import path from 'path'
import { registerIpcHandlers } from './ipc'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 900, height: 700, minWidth: 750, minHeight: 600,
    title: 'CostumeCRM',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  return win
}

app.whenReady().then(() => {
  const win = createWindow()
  registerIpcHandlers(win)
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
HEREDOC

# ── src/preload/index.ts ──────────────────────────────────────────────────────
cat > "$ROOT/src/preload/index.ts" << 'HEREDOC'
import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type { AppConfig, Row } from '../shared/types'

const api = {
  openExcelFile: (): Promise<string | null>                          => ipcRenderer.invoke(IPC.DIALOG_OPEN_EXCEL),
  getConfig:     (): Promise<AppConfig>                              => ipcRenderer.invoke(IPC.CONFIG_GET),
  setConfig:     (p: Partial<AppConfig>): Promise<AppConfig>         => ipcRenderer.invoke(IPC.CONFIG_SET, p),
  saveRow:       (fp: string, row: Row): Promise<Row>                => ipcRenderer.invoke(IPC.EXCEL_SAVE_ROW, fp, row),
  saveSellRow:   (fp: string, row: Row): Promise<Row>                => ipcRenderer.invoke(IPC.EXCEL_SAVE_SELL_ROW, fp, row),
  getAutocomplete: (fp: string): Promise<{names: string[]; phones: string[]}> =>
                                                                        ipcRenderer.invoke(IPC.EXCEL_GET_AUTOCOMPLETE, fp),
  fillAndPrint:  (row: Row): Promise<void>                           => ipcRenderer.invoke(IPC.WORD_FILL_AND_PRINT, row),
}

contextBridge.exposeInMainWorld('api', api)
export type ElectronAPI = typeof api
HEREDOC

# ── src/renderer/index.html ───────────────────────────────────────────────────
cat > "$ROOT/src/renderer/index.html" << 'HEREDOC'
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CostumeCRM</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
HEREDOC

# ── src/renderer/src/main.tsx ─────────────────────────────────────────────────
cat > "$ROOT/src/renderer/src/main.tsx" << 'HEREDOC'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode><App /></React.StrictMode>
)
HEREDOC

# ── src/renderer/src/App.css ─────────────────────────────────────────────────
cat > "$ROOT/src/renderer/src/App.css" << 'HEREDOC'
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;background:#f0f2f5;color:#1a1a1a}
.app{display:flex;flex-direction:column;height:100%}
.tab-bar{display:flex;background:#2c3e50;border-bottom:2px solid #1a252f}
.tab-btn{padding:10px 24px;color:#bdc3c7;background:transparent;border:none;cursor:pointer;font-size:14px;font-family:inherit;transition:background .15s,color .15s}
.tab-btn:hover{background:#34495e;color:#ecf0f1}
.tab-btn.active{background:#3498db;color:#fff;font-weight:600}
.tab-content{flex:1;overflow-y:auto;padding:20px}
.card{background:#fff;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,.12);padding:18px 20px;margin-bottom:16px}
.card h2{font-size:15px;font-weight:600;margin-bottom:14px;color:#2c3e50;border-bottom:1px solid #ecf0f1;padding-bottom:8px}
.file-row{display:flex;align-items:center;gap:8px}
.file-path{flex:1;padding:6px 10px;border:1px solid #ddd;border-radius:4px;background:#f8f9fa;font-size:12px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.file-path.empty{color:#aaa}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px}
.form-grid.cols-3{grid-template-columns:1fr 1fr 1fr}
.form-grid.cols-1{grid-template-columns:1fr}
.field{display:flex;flex-direction:column;gap:4px}
.field.span-2{grid-column:span 2}
.field.span-3{grid-column:span 3}
.field label{font-size:12px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:.03em}
.field input,.field textarea,.field select{padding:7px 10px;border:1px solid #ccc;border-radius:4px;font-size:14px;font-family:inherit;background:#fff;transition:border-color .15s;width:100%}
.field input:focus,.field textarea:focus{outline:none;border-color:#3498db;box-shadow:0 0 0 2px rgba(52,152,219,.15)}
.field input:disabled,.field textarea:disabled{background:#f8f9fa;color:#888}
.field textarea{resize:vertical;min-height:60px}
.computed-badge{padding:7px 10px;border-radius:4px;background:#eaf4fe;border:1px solid #aad4f5;font-size:14px;font-weight:600;color:#2980b9;text-align:right}
.computed-badge.negative{background:#fdecea;border-color:#f5c6cb;color:#c0392b}
.btn-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
button,.btn{padding:8px 18px;border:none;border-radius:4px;cursor:pointer;font-size:14px;font-family:inherit;font-weight:500;transition:opacity .15s,filter .15s}
button:hover:not(:disabled){filter:brightness(.93)}
button:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{background:#3498db;color:#fff}
.btn-success{background:#27ae60;color:#fff}
.btn-secondary{background:#95a5a6;color:#fff}
.btn-sm{padding:6px 12px;font-size:13px}
.error-banner{background:#fdecea;border:1px solid #f5c6cb;color:#c0392b;border-radius:4px;padding:10px 14px;margin-bottom:12px;font-size:13px;white-space:pre-wrap}
.status-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;background:#e74c3c}
.status-dot.ok{background:#27ae60}
HEREDOC

# ── src/renderer/src/App.tsx ──────────────────────────────────────────────────
cat > "$ROOT/src/renderer/src/App.tsx" << 'HEREDOC'
import React, { useEffect, useState } from 'react'
import OrderTab from './components/OrderTab'
import SellTab from './components/SellTab'
import type { AppConfig } from '@shared/types'

type Tab = 'order' | 'sell'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('order')
  const [config, setConfig] = useState<AppConfig | null>(null)

  useEffect(() => { window.api.getConfig().then(setConfig) }, [])

  async function updateConfig(partial: Partial<AppConfig>) {
    const next = await window.api.setConfig(partial)
    setConfig(next)
    return next
  }

  if (!config) return <div style={{ padding: 20 }}>Загрузка…</div>

  return (
    <div className="app">
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === 'order' ? 'active' : ''}`} onClick={() => setActiveTab('order')}>
          📋 Оформление заказа
        </button>
        <button className={`tab-btn ${activeTab === 'sell' ? 'active' : ''}`} onClick={() => setActiveTab('sell')}>
          🛍 Продажа
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'order' && <OrderTab config={config} onConfigChange={updateConfig} />}
        {activeTab === 'sell'  && <SellTab  config={config} onConfigChange={updateConfig} />}
      </div>
    </div>
  )
}

declare global {
  interface Window {
    api: {
      openExcelFile(): Promise<string | null>
      getConfig(): Promise<AppConfig>
      setConfig(p: Partial<AppConfig>): Promise<AppConfig>
      saveRow(path: string, row: import('@shared/types').Row): Promise<import('@shared/types').Row>
      saveSellRow(path: string, row: import('@shared/types').Row): Promise<import('@shared/types').Row>
      getAutocomplete(path: string): Promise<{ names: string[]; phones: string[] }>
      fillAndPrint(row: import('@shared/types').Row): Promise<void>
    }
  }
}
HEREDOC

# ── src/renderer/src/components/OrderTab.tsx ─────────────────────────────────
cat > "$ROOT/src/renderer/src/components/OrderTab.tsx" << 'HEREDOC'
import React, { useCallback, useEffect, useState } from 'react'
import type { AppConfig, Row } from '@shared/types'
import { calcOwe, newRow } from '@shared/types'

interface Props { config: AppConfig; onConfigChange: (p: Partial<AppConfig>) => Promise<AppConfig> }

function isoToInput(iso: string) { return iso.slice(0, 10) }
function inputToIso(val: string) {
  const d = new Date(val + 'T00:00:00')
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

export default function OrderTab({ config, onConfigChange }: Props) {
  const [row, setRow] = useState<Row>(newRow())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [ac, setAc] = useState<{ names: string[]; phones: string[] }>({ names: [], phones: [] })

  const filePath = config.mainExcelFilePath
  const hasFile = Boolean(filePath)
  const isNewRow = row.rowPos === -1
  const owe = calcOwe(row)

  const loadAc = useCallback(async (p: string) => {
    if (!p) return
    try { setAc(await window.api.getAutocomplete(p)) } catch {}
  }, [])

  useEffect(() => { loadAc(filePath) }, [filePath, loadAc])

  function set<K extends keyof Row>(key: K, value: Row[K]) { setRow(prev => ({ ...prev, [key]: value })) }

  function setNum(key: 'price' | 'prepaymentCash' | 'prepaymentDigital' | 'pledgeCash' | 'pledgeDigital') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D/g, '').slice(0, 9)
      set(key, v === '' ? 0 : parseInt(v))
    }
  }

  function nd(v: number) { return v === 0 ? '' : String(v) }

  async function pickFile() {
    const p = await window.api.openExcelFile()
    if (p) { await onConfigChange({ mainExcelFilePath: p }); await loadAc(p) }
  }

  async function handleSave(andPrint = false) {
    if (!filePath) { setError('Сначала выберите файл таблицы.'); return }
    setBusy(true); setError(null)
    try {
      const saved = await window.api.saveRow(filePath, row)
      if (isNewRow || andPrint) await window.api.fillAndPrint(saved)
      if (isNewRow) { setRow(newRow()); await loadAc(filePath) }
      else setRow(saved)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  return (
    <>
      <div className="card">
        <h2>📁 Файл таблицы заказов</h2>
        <div className="file-row">
          <span className={`file-path ${hasFile ? '' : 'empty'}`}>
            <span className={`status-dot ${hasFile ? 'ok' : ''}`} />{filePath || 'Файл не выбран'}
          </span>
          <button className="btn-secondary btn-sm" onClick={pickFile} disabled={busy}>Обзор…</button>
        </div>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}
      {!isNewRow && <div style={{marginBottom:10,color:'#27ae60',fontWeight:600,fontSize:13}}>✏️ Режим редактирования — запись #{row.id}</div>}

      <datalist id="dl-names">{ac.names.map(n => <option key={n} value={n} />)}</datalist>
      <datalist id="dl-phones">{ac.phones.map(p => <option key={p} value={p} />)}</datalist>

      <div className="card">
        <h2>Данные заказа</h2>
        <div className="form-grid">
          <div className="field">
            <label>ФИО клиента</label>
            <input type="text" list="dl-names" value={row.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Иванов Иван Иванович" disabled={busy} />
          </div>
          <div className="field">
            <label>Номер телефона</label>
            <input type="text" list="dl-phones" value={row.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 (000) 000-00-00" disabled={busy} />
          </div>
          <div className="field span-2">
            <label>Костюм</label>
            <input type="text" value={row.costumeName} onChange={e => set('costumeName', e.target.value)} placeholder="Название костюма" disabled={busy} />
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Даты</h2>
        <div className="form-grid cols-3">
          {([['creationDate','Дата заявки'],['actualOrderDate','Дата выдачи'],['returnDate','Дата возврата']] as const).map(([key, label]) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input type="date" value={isoToInput(row[key])} onChange={e => set(key, inputToIso(e.target.value))} disabled={busy} />
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Оплата</h2>
        <div className="form-grid cols-3">
          <div className="field"><label>Стоимость (₽)</label><input type="text" inputMode="numeric" value={nd(row.price)} onChange={setNum('price')} placeholder="0" disabled={busy} /></div>
          <div className="field"><label>Предоплата нал (₽)</label><input type="text" inputMode="numeric" value={nd(row.prepaymentCash)} onChange={setNum('prepaymentCash')} placeholder="0" disabled={busy} /></div>
          <div className="field"><label>Предоплата безнал (₽)</label><input type="text" inputMode="numeric" value={nd(row.prepaymentDigital)} onChange={setNum('prepaymentDigital')} placeholder="0" disabled={busy} /></div>
          <div className="field"><label>Остаток (долг)</label><div className={`computed-badge ${owe < 0 ? 'negative' : ''}`}>{owe} ₽</div></div>
          <div className="field"><label>Залог нал (₽)</label><input type="text" inputMode="numeric" value={nd(row.pledgeCash)} onChange={setNum('pledgeCash')} placeholder="0" disabled={busy} /></div>
          <div className="field"><label>Залог безнал (₽)</label><input type="text" inputMode="numeric" value={nd(row.pledgeDigital)} onChange={setNum('pledgeDigital')} placeholder="0" disabled={busy} /></div>
        </div>
      </div>

      <div className="card">
        <h2>Комментарий</h2>
        <div className="form-grid cols-1">
          <div className="field"><textarea value={row.comment} onChange={e => set('comment', e.target.value)} rows={3} placeholder="Дополнительные заметки…" disabled={busy} /></div>
        </div>
      </div>

      <div className="card">
        <div className="btn-row">
          <button className="btn-primary" onClick={() => handleSave(false)} disabled={busy || !hasFile}>
            {busy ? '⏳ Сохранение…' : isNewRow ? '💾 Сохранить' : '💾 Обновить'}
          </button>
          <button className="btn-success" onClick={() => handleSave(true)} disabled={busy || !hasFile}>
            {busy ? '⏳…' : '🖨 Сохранить и распечатать'}
          </button>
          <button className="btn-secondary" onClick={() => { setRow(newRow()); setError(null) }} disabled={busy}>🔄 Сброс</button>
        </div>
      </div>
    </>
  )
}
HEREDOC

# ── src/renderer/src/components/SellTab.tsx ──────────────────────────────────
cat > "$ROOT/src/renderer/src/components/SellTab.tsx" << 'HEREDOC'
import React, { useState } from 'react'
import type { AppConfig, Row } from '@shared/types'
import { newRow } from '@shared/types'

interface Props { config: AppConfig; onConfigChange: (p: Partial<AppConfig>) => Promise<AppConfig> }

export default function SellTab({ config, onConfigChange }: Props) {
  const [row, setRow] = useState<Row>(newRow())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)

  const filePath = config.sellExcelFilePath
  const hasFile = Boolean(filePath)

  function set<K extends keyof Row>(key: K, value: Row[K]) { setRow(prev => ({ ...prev, [key]: value })); setLastSaved(null) }
  function setNum(key: 'prepaymentCash' | 'prepaymentDigital') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value.replace(/\D/g, '').slice(0, 9)
      set(key, v === '' ? 0 : parseInt(v))
    }
  }
  function nd(v: number) { return v === 0 ? '' : String(v) }

  async function pickFile() {
    const p = await window.api.openExcelFile()
    if (p) await onConfigChange({ sellExcelFilePath: p })
  }

  async function handleSell() {
    if (!filePath) { setError('Сначала выберите файл таблицы продаж.'); return }
    if (!row.customerName.trim()) { setError('Укажите ФИО клиента.'); return }
    setBusy(true); setError(null); setLastSaved(null)
    try {
      const saved = await window.api.saveSellRow(filePath, row)
      setLastSaved(`✅ Сохранено — запись #${saved.id}`)
      setRow(newRow())
    } catch (e: unknown) { setError(e instanceof Error ? e.message : String(e)) }
    finally { setBusy(false) }
  }

  return (
    <>
      <div className="card">
        <h2>📁 Файл таблицы продаж</h2>
        <div className="file-row">
          <span className={`file-path ${hasFile ? '' : 'empty'}`}>
            <span className={`status-dot ${hasFile ? 'ok' : ''}`} />{filePath || 'Файл не выбран'}
          </span>
          <button className="btn-secondary btn-sm" onClick={pickFile} disabled={busy}>Обзор…</button>
        </div>
      </div>

      {error && <div className="error-banner">⚠ {error}</div>}
      {lastSaved && <div style={{color:'#27ae60',fontWeight:600,marginBottom:12,fontSize:13}}>{lastSaved}</div>}

      <div className="card">
        <h2>Данные о продаже</h2>
        <div className="form-grid">
          <div className="field"><label>ФИО клиента</label><input type="text" value={row.customerName} onChange={e => set('customerName', e.target.value)} placeholder="Иванов Иван Иванович" disabled={busy} /></div>
          <div className="field"><label>Номер телефона</label><input type="text" value={row.phone} onChange={e => set('phone', e.target.value)} placeholder="+7 (000) 000-00-00" disabled={busy} /></div>
          <div className="field span-2"><label>Наименование товара</label><input type="text" value={row.costumeName} onChange={e => set('costumeName', e.target.value)} placeholder="Название" disabled={busy} /></div>
          <div className="field"><label>Оплата нал (₽)</label><input type="text" inputMode="numeric" value={nd(row.prepaymentCash)} onChange={setNum('prepaymentCash')} placeholder="0" disabled={busy} /></div>
          <div className="field"><label>Оплата безнал (₽)</label><input type="text" inputMode="numeric" value={nd(row.prepaymentDigital)} onChange={setNum('prepaymentDigital')} placeholder="0" disabled={busy} /></div>
          <div className="field span-2"><label>Комментарий</label><textarea value={row.comment} onChange={e => set('comment', e.target.value)} rows={2} placeholder="Дополнительные заметки…" disabled={busy} /></div>
        </div>
      </div>

      <div className="card">
        <div className="btn-row">
          <button className="btn-success" onClick={handleSell} disabled={busy || !hasFile}>
            {busy ? '⏳ Сохранение…' : '💾 Записать продажу'}
          </button>
          <button className="btn-secondary" onClick={() => { setRow(newRow()); setError(null); setLastSaved(null) }} disabled={busy}>🔄 Сброс</button>
        </div>
      </div>
    </>
  )
}
HEREDOC

echo ""
echo "✅ Готово! Структура создана в папке ./$ROOT"
echo ""
echo "Следующие шаги:"
echo "  cd $ROOT"
echo "  npm install"
echo "  npm run dev"
