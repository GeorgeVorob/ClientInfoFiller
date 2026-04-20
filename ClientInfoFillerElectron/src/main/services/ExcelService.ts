/**
 * ExcelService.ts
 *
 * Column mapping (same as original C# app):
 *  A(1)  — ID
 *  B(2)  — CustomerName
 *  C(3)  — CostumeName
 *  D(4)  — Phone
 *  E(5)  — CreationDate
 *  F(6)  — ActualOrderDate
 *  G(7)  — ReturnDate
 *  H(8)  — Price
 *  I(9)  — PrepaymentDigital
 *  J(10) — PrepaymentCash
 *  K(11) — Owe (computed, write-only)
 *  L(12) — PledgeCash
 *  M(13) — PledgeDigital
 *  N(14) — Comment
 *
 * Sell sheet (separate file):
 *  A(1) — ID
 *  B(2) — CustomerName
 *  C(3) — CostumeName
 *  D(4) — Phone
 *  E(5) — PrepaymentCash (cash payment)
 *  F(6) — PrepaymentDigital (digital payment)
 *  G(7) — Comment
 */

import ExcelJS from 'exceljs'
import type { Row } from '../../shared/types'

const DATE_FMT = 'dd.mm.yyyy'

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDateDMY(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

function parseDateDMY(text: string): string {
  if (!text) return defaultISO()
  // dd.MM.yyyy
  const m = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) {
    const d = new Date(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1]))
    if (!isNaN(d.getTime())) return d.toISOString()
  }
  // Excel may hand us a JS Date object serialised as text — try generic parse
  const d = new Date(text)
  return isNaN(d.getTime()) ? defaultISO() : d.toISOString()
}

function defaultISO(): string {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), 15).toISOString()
}

/** Extracts a plain string from an ExcelJS cell regardless of its value type */
function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return formatDateDMY(v.toISOString())
  if (typeof v === 'object') {
    if ('richText' in v) return (v as ExcelJS.CellRichTextValue).richText.map(r => r.text).join('')
    if ('result' in v) return String((v as ExcelJS.CellFormulaValue).result ?? '')
    if ('text' in v) return String((v as { text: string }).text)
    if ('error' in v) return ''
  }
  return String(v)
}

function numCell(cell: ExcelJS.Cell): number {
  const n = parseInt(cellText(cell))
  return isNaN(n) ? 0 : n
}

// ── row positions ─────────────────────────────────────────────────────────────

interface LastEmptyResult {
  rowPos: number   // 1-based index of the first empty row (ready to write)
  lastId: number   // next available ID (last occupied ID + 1)
}

function findLastEmptyRow(ws: ExcelJS.Worksheet): LastEmptyResult {
  let rowPos = 2
  let lastId = 0
  while (true) {
    const cell = ws.getRow(rowPos).getCell(1)
    const text = cellText(cell)
    if (text !== '') {
      const id = parseInt(text)
      if (!isNaN(id)) lastId = id
      rowPos++
    } else {
      break
    }
  }
  return { rowPos, lastId: lastId + 1 }
}

// ── read / write ──────────────────────────────────────────────────────────────

function readRow(ws: ExcelJS.Worksheet, rowPos: number): Row {
  const exRow = ws.getRow(rowPos)
  const c = (col: number) => exRow.getCell(col)
  return {
    rowPos,
    id: parseInt(cellText(c(1))) || -1,
    customerName: cellText(c(2)),
    costumeName: cellText(c(3)),
    phone: cellText(c(4)),
    creationDate: parseDateDMY(cellText(c(5))),
    actualOrderDate: parseDateDMY(cellText(c(6))),
    returnDate: parseDateDMY(cellText(c(7))),
    price: numCell(c(8)),
    prepaymentDigital: numCell(c(9)),
    prepaymentCash: numCell(c(10)),
    // col 11 = Owe (computed, skip on read)
    pledgeCash: numCell(c(12)),
    pledgeDigital: numCell(c(13)),
    comment: cellText(c(14)),
  }
}

function writeRow(ws: ExcelJS.Worksheet, data: Row): void {
  if (data.rowPos < 2) throw new Error('Некорректная позиция строки при сохранении.')
  const owe = data.price - data.prepaymentCash - data.prepaymentDigital
  const exRow = ws.getRow(data.rowPos)

  exRow.getCell(1).value = data.id
  exRow.getCell(2).value = data.customerName
  exRow.getCell(3).value = data.costumeName
  exRow.getCell(4).value = data.phone

  const setDate = (col: number, iso: string) => {
    const cell = exRow.getCell(col)
    cell.value = new Date(iso)
    cell.numFmt = DATE_FMT
  }
  setDate(5, data.creationDate)
  setDate(6, data.actualOrderDate)
  setDate(7, data.returnDate)

  exRow.getCell(8).value = data.price
  exRow.getCell(9).value = data.prepaymentDigital
  exRow.getCell(10).value = data.prepaymentCash
  exRow.getCell(11).value = owe
  exRow.getCell(12).value = data.pledgeCash
  exRow.getCell(13).value = data.pledgeDigital
  exRow.getCell(14).value = data.comment

  exRow.commit()
}

function writeSellRow(ws: ExcelJS.Worksheet, data: Row): void {
  if (data.rowPos < 2) throw new Error('Некорректная позиция строки при сохранении.')
  const exRow = ws.getRow(data.rowPos)
  exRow.getCell(1).value = data.id
  exRow.getCell(2).value = data.customerName
  exRow.getCell(3).value = data.costumeName
  exRow.getCell(4).value = data.phone
  exRow.getCell(5).value = data.prepaymentCash
  exRow.getCell(6).value = data.prepaymentDigital
  exRow.getCell(7).value = data.comment
  exRow.commit()
}

// ── public API ────────────────────────────────────────────────────────────────

export class ExcelService {
  constructor(private filePath: string) {}

  private async open(): Promise<{ wb: ExcelJS.Workbook; ws: ExcelJS.Worksheet }> {
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(this.filePath)
    const ws = wb.worksheets[0]
    if (!ws) throw new Error('В файле не найдено ни одного листа.')
    return { wb, ws }
  }

  /** Save or update an order row. Mutates data.rowPos and data.id when new. */
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

  /** Always appends a new row to the sell sheet. */
  async saveSellRow(data: Row): Promise<Row> {
    const { wb, ws } = await this.open()
    const { rowPos, lastId } = findLastEmptyRow(ws)
    data = { ...data, rowPos, id: lastId }
    writeSellRow(ws, data)
    await wb.xlsx.writeFile(this.filePath)
    return data
  }

  /** Returns all non-empty rows for autocomplete population. */
  async getAllRows(): Promise<Row[]> {
    const { ws } = await this.open()
    const { rowPos: lastEmpty } = findLastEmptyRow(ws)
    const rows: Row[] = []
    for (let i = 2; i < lastEmpty; i++) {
      rows.push(readRow(ws, i))
    }
    return rows
  }
}
