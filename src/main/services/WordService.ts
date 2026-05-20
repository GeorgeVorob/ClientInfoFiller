/**
 * WordService
 *
 * The template uses plain docxtemplater placeholders, not legacy bookmarks.
 *
 * Required placeholders inside the Word file:
 *   {ID}
 *   {CustomerName}
 *   {CostumeName}
 *   {Phone}
 *   {CreationDate}
 *   {ActualOrderDate}
 *   {ReturnDate}
 *   {Price}
 *   {Prepayment}
 *   {Owe}
 *   {Pledge}
 *   {Comment}
 *   {PrintDateTime}
 *
 * Portable / packaged layout:
 *   - "Шаблон Word.docx" lives next to the main .exe file
 *   - "Шаблон Word backup.docx" is shipped there as a backup copy
 */

import path from 'path'
import fs from 'fs'
import { app, shell } from 'electron'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import type { Row } from '../../shared/types'
import { logError } from './logError'

const TEMPLATE_FILE_NAME = 'Шаблон Word.docx'
const TEMPLATE_BACKUP_FILE_NAME = 'Шаблон Word backup.docx'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

function moneyParts(cash: number, digital: number, sbp?: number, total?: number): string {
  if (total != null && total > 0) {
    return String(total)
  }
  const parts: string[] = []
  if (cash) parts.push(`${cash}(н)`)
  if (digital) parts.push(`${digital}(бн)`)
  if (sbp) parts.push(`${sbp}(сбп)`)
  return parts.join(' ')
}

function executableDir(): string {
  return app.isPackaged ? path.dirname(process.execPath) : app.getAppPath()
}

function templatePath(): string {
  return path.join(executableDir(), TEMPLATE_FILE_NAME)
}

function backupTemplatePath(): string {
  return path.join(executableDir(), TEMPLATE_BACKUP_FILE_NAME)
}

function tempDir(): string {
  const dir = path.join(app.getPath('temp'), 'CostumeCRM')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function cleanTempDir(dir: string): void {
  try {
    for (const file of fs.readdirSync(dir)) {
      try {
        fs.unlinkSync(path.join(dir, file))
      } catch {
        // file may be in use
      }
    }
  } catch {
    // dir may not exist yet
  }
}

export async function fillAndPrint(data: Row): Promise<void> {
  try {
    const tplPath = templatePath()
    if (!fs.existsSync(tplPath)) {
      throw new Error(
        `Шаблон Word не найден по пути:\n${tplPath}\n\nПоложите файл "${TEMPLATE_FILE_NAME}" рядом с .exe.\nРезервная копия должна лежать там же:\n${backupTemplatePath()}`
      )
    }

    const content = fs.readFileSync(tplPath, 'binary')
    const zip = new PizZip(content)
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      errorLogging: false,
    })

    const owe = data.price - data.prepaymentCash - data.prepaymentDigital - (data.prepaymentSBP ?? 0)

    doc.render({
      ID: String(data.id),
      CustomerName: data.customerName,
      CostumeName: data.costumeName,
      Phone: data.phone,
      CreationDate: fmtDate(data.creationDate),
      ActualOrderDate: fmtDate(data.actualOrderDate),
      ReturnDate: fmtDate(data.returnDate),
      Price: String(data.price),
      Prepayment: moneyParts(data.prepaymentCash, data.prepaymentDigital, data.prepaymentSBP),
      Owe: String(owe),
      Pledge: moneyParts(data.pledgeCash, data.pledgeDigital, data.pledgeSBP, data.pledgeTotal),
      Comment: data.comment,
      PrintDateTime: (() => {
        const n = new Date()
        const dd = String(n.getDate()).padStart(2, '0')
        const mm = String(n.getMonth() + 1).padStart(2, '0')
        const hh = String(n.getHours()).padStart(2, '0')
        const min = String(n.getMinutes()).padStart(2, '0')
        return `${dd}.${mm}.${n.getFullYear()} ${hh}:${min}`
      })(),
    })

    const buf = doc.getZip().generate({ type: 'nodebuffer' })

    const dir = tempDir()
    cleanTempDir(dir)

    const outPath = path.join(dir, `order-${data.id}-${Date.now()}.docx`)
    fs.writeFileSync(outPath, buf)

    const err = await shell.openPath(outPath)
    if (err) throw new Error(`Не удалось открыть файл: ${err}`)
  } catch (e) {
    logError('WordService.fillAndPrint', e, { data })
    throw e
  }
}
