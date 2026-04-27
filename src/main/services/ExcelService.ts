import fs from 'fs'
import ExcelJS from 'exceljs'
import { logError } from './logError'
import type { Row, SearchRequest } from '../../shared/types'

/**
 * ExcelService
 *
 * Order sheet column mapping:
 *
 * Shared columns:
 *  A(1) — ID
 *  B(2) — CustomerName
 *  C(3) — CostumeName
 *  D(4) — Phone
 *  E(5) — CreationDate
 *  F(6) — ActualOrderDate
 *  G(7) — ReturnDate
 *  H(8) — Price
 *  I(9) — PrepaymentDigital
 *
 * SBP enabled:
 *  J(10) — PrepaymentSBP
 *  K(11) — PrepaymentCash
 *  L(12) — Owe (computed, write-only)
 *  M(13) — PledgeCash
 *  N(14) — PledgeDigital
 *  O(15) — PledgeSBP
 *  P(16) — Comment
 *
 * SBP disabled:
 *  J(10) — PrepaymentCash
 *  K(11) — Owe (computed, write-only)
 *  L(12) — PledgeCash
 *  M(13) — PledgeDigital
 *  N(14) — Comment
 *
 * Sell sheet (separate file):
 *  A(1)  — ID
 *  B(2)  — CustomerName
 *  C(3)  — CostumeName
 *  D(4)  — Phone
 *  E(5)  — PrepaymentCash
 *  F(6)  — PrepaymentDigital
 *  G(7)  — PrepaymentSBP
 *  H(8)  — PledgeCash
 *  I(9)  — PledgeDigital
 *  J(10) — PledgeSBP
 *  K(11) — Comment
 */

function assertFileWritable(filePath: string): void {
  try {
    const fd = fs.openSync(filePath, 'r+')
    fs.closeSync(fd)
  } catch {
    throw new Error('FILE_LOCKED')
  }
}

interface ExcelServiceOptions {
  sbpEnabled: boolean
}

interface LastEmptyResult {
  rowPos: number
  lastId: number
}

interface OrderColumnMap {
  prepaymentDigital: number
  prepaymentSBP?: number
  prepaymentCash: number
  owe: number
  pledgeCash: number
  pledgeDigital: number
  pledgeSBP?: number
  comment: number
}

function formatDateDMY(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

function parseDateDMY(text: string): string {
  if (!text) return defaultISO()

  const m = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (m) {
    const d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10))
    if (!isNaN(d.getTime())) return d.toISOString()
  }

  const d = new Date(text)
  return isNaN(d.getTime()) ? defaultISO() : d.toISOString()
}

function defaultISO(): string {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate()).toISOString()
}

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
  const n = parseInt(cellText(cell), 10)
  return isNaN(n) ? 0 : n
}

function getOrderColumnMap(sbpEnabled: boolean): OrderColumnMap {
  if (sbpEnabled) {
    return {
      prepaymentDigital: 9,
      prepaymentSBP: 10,
      prepaymentCash: 11,
      owe: 12,
      pledgeCash: 13,
      pledgeDigital: 14,
      pledgeSBP: 15,
      comment: 16,
    }
  }

  return {
    prepaymentDigital: 9,
    prepaymentCash: 10,
    owe: 11,
    pledgeCash: 12,
    pledgeDigital: 13,
    comment: 14,
  }
}

function findLastEmptyRow(ws: ExcelJS.Worksheet): LastEmptyResult {
  let rowPos = 2
  let lastId = 0

  while (true) {
    const cell = ws.getRow(rowPos).getCell(1)
    const text = cellText(cell)
    if (text !== '') {
      const id = parseInt(text, 10)
      if (!isNaN(id)) lastId = id
      rowPos++
    } else {
      break
    }
  }

  return { rowPos, lastId: lastId + 1 }
}

function readRow(ws: ExcelJS.Worksheet, rowPos: number, sbpEnabled: boolean): Row {
  const exRow = ws.getRow(rowPos)
  const c = (col: number) => exRow.getCell(col)
  const map = getOrderColumnMap(sbpEnabled)

  return {
    rowPos,
    id: parseInt(cellText(c(1)), 10) || -1,
    customerName: cellText(c(2)),
    costumeName: cellText(c(3)),
    phone: cellText(c(4)),
    creationDate: parseDateDMY(cellText(c(5))),
    actualOrderDate: parseDateDMY(cellText(c(6))),
    returnDate: parseDateDMY(cellText(c(7))),
    price: numCell(c(8)),
    prepaymentDigital: numCell(c(map.prepaymentDigital)),
    prepaymentSBP: map.prepaymentSBP ? numCell(c(map.prepaymentSBP)) : 0,
    prepaymentCash: numCell(c(map.prepaymentCash)),
    pledgeCash: numCell(c(map.pledgeCash)),
    pledgeDigital: numCell(c(map.pledgeDigital)),
    pledgeSBP: map.pledgeSBP ? numCell(c(map.pledgeSBP)) : 0,
    comment: cellText(c(map.comment)),
  }
}

function writeRow(ws: ExcelJS.Worksheet, data: Row, sbpEnabled: boolean): void {
  if (data.rowPos < 2) throw new Error('Некорректная позиция строки при сохранении.')

  const map = getOrderColumnMap(sbpEnabled)
  const owe = data.price - data.prepaymentCash - data.prepaymentDigital - data.prepaymentSBP
  const exRow = ws.getRow(data.rowPos)

  exRow.getCell(1).value = data.id
  exRow.getCell(2).value = data.customerName
  exRow.getCell(3).value = data.costumeName
  exRow.getCell(4).value = data.phone

  const setDate = (col: number, iso: string) => {
    exRow.getCell(col).value = formatDateDMY(iso)
  }

  setDate(5, data.creationDate)
  setDate(6, data.actualOrderDate)
  setDate(7, data.returnDate)

  exRow.getCell(8).value = data.price
  exRow.getCell(map.prepaymentDigital).value = data.prepaymentDigital
  if (map.prepaymentSBP) exRow.getCell(map.prepaymentSBP).value = data.prepaymentSBP
  exRow.getCell(map.prepaymentCash).value = data.prepaymentCash
  exRow.getCell(map.owe).value = owe
  exRow.getCell(map.pledgeCash).value = data.pledgeCash
  exRow.getCell(map.pledgeDigital).value = data.pledgeDigital
  if (map.pledgeSBP) exRow.getCell(map.pledgeSBP).value = data.pledgeSBP
  exRow.getCell(map.comment).value = data.comment

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
  exRow.getCell(7).value = data.prepaymentSBP
  exRow.getCell(8).value = data.pledgeCash
  exRow.getCell(9).value = data.pledgeDigital
  exRow.getCell(10).value = data.pledgeSBP
  exRow.getCell(11).value = data.comment
  exRow.commit()
}

export class ExcelService {
  constructor(private filePath: string, private options: ExcelServiceOptions = { sbpEnabled: true }) {}

  private async open(): Promise<{ wb: ExcelJS.Workbook; ws: ExcelJS.Worksheet }> {
    try {
      const wb = new ExcelJS.Workbook()
      await wb.xlsx.readFile(this.filePath)
      const ws = wb.worksheets[0]
      if (!ws) throw new Error('В файле не найдено ни одного листа.')
      return { wb, ws }
    } catch (e) {
      logError('ExcelService.open', e, { filePath: this.filePath })
      throw e
    }
  }

  async saveRow(data: Row): Promise<Row> {
    try {
      assertFileWritable(this.filePath)
      const { wb, ws } = await this.open()
      let usedData = data

      if (data.rowPos === -1) {
        const { rowPos, lastId } = findLastEmptyRow(ws)
        usedData = { ...data, rowPos, id: lastId }
      }

      writeRow(ws, usedData, this.options.sbpEnabled)
      await wb.xlsx.writeFile(this.filePath)
      return usedData
    } catch (e) {
      logError('ExcelService.saveRow', e, { filePath: this.filePath, data, options: this.options })
      throw e
    }
  }

  async saveSellRow(data: Row): Promise<Row> {
    try {
      assertFileWritable(this.filePath)
      const { wb, ws } = await this.open()
      const { rowPos, lastId } = findLastEmptyRow(ws)
      const usedData = { ...data, rowPos, id: lastId }
      writeSellRow(ws, usedData)
      await wb.xlsx.writeFile(this.filePath)
      return usedData
    } catch (e) {
      logError('ExcelService.saveSellRow', e, { filePath: this.filePath, data })
      throw e
    }
  }

  async getAllRows(): Promise<Row[]> {
    try {
      const { ws } = await this.open()
      const { rowPos: lastEmpty } = findLastEmptyRow(ws)
      const rows: Row[] = []

      for (let i = 2; i < lastEmpty; i++) {
        rows.push(readRow(ws, i, this.options.sbpEnabled))
      }

      return rows
    } catch (e) {
      logError('ExcelService.getAllRows', e, { filePath: this.filePath, options: this.options })
      throw e
    }
  }

  async searchRows(request: SearchRequest): Promise<Row[]> {
    try {
      const { ws } = await this.open()
      const { rowPos: lastEmpty } = findLastEmptyRow(ws)
      const results: Row[] = []
      const query = request.query.toLowerCase().trim()

      for (let i = lastEmpty - 1; i >= 2 && results.length < request.limit; i--) {
        const row = readRow(ws, i, this.options.sbpEnabled)
        let match = false

        switch (request.mode) {
          case 'byName':
            match = row.customerName.toLowerCase().includes(query)
            break
          case 'byPhone':
            match = row.phone.includes(query)
            break
          case 'byCostume':
            match = row.costumeName.toLowerCase().includes(query)
            break
          case 'byId':
            match = row.id.toString() === query
            break
        }

        if (match) results.push(row)
      }

      return results
    } catch (e) {
      logError('ExcelService.searchRows', e, { filePath: this.filePath, request, options: this.options })
      throw e
    }
  }
}
