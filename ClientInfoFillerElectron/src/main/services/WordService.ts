/**
 * WordService.ts
 *
 * ⚠️  IMPORTANT — Word template format change
 * The original C# app used Word bookmarks (named anchors).
 * docxtemplater works with inline placeholders instead.
 *
 * You must update wordTemplate.docx so that wherever a bookmark used to be,
 * there is a plain-text placeholder in curly braces, e.g.:
 *
 *   Old (bookmark named "CustomerName"): [cursor placed here]
 *   New (plain text in the docx):        {CustomerName}
 *
 * Full list of placeholders to put in the template:
 *   {ID}              — record number
 *   {CustomerName}    — full name
 *   {CostumeName}     — costume
 *   {Phone}           — phone
 *   {CreationDate}    — date of order (dd.MM.yyyy)
 *   {ActualOrderDate} — pickup date
 *   {ReturnDate}      — return date
 *   {Price}           — total price
 *   {Prepayment}      — "1500(н) 500(бн)"
 *   {Owe}             — remaining amount
 *   {Pledge}          — deposit
 *   {Comment}         — comment
 *   {PrintDateTime}   — filled automatically at print time
 *
 * Place wordTemplate.docx in the /assets folder of the project root.
 */

import path from 'path'
import fs from 'fs'
import { app, shell } from 'electron'
import PizZip from 'pizzip'
import Docxtemplater from 'docxtemplater'
import type { Row } from '../../shared/types'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

function moneyParts(cash: number, digital: number): string {
  const parts: string[] = []
  if (cash) parts.push(`${cash}(н)`)
  if (digital) parts.push(`${digital}(бн)`)
  return parts.join(' ')
}

function templatePath(): string {
  // In packaged build the assets folder is copied next to app.asar via extraResources
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', 'wordTemplate.docx')
  }
  return path.join(app.getAppPath(), 'assets', 'wordTemplate.docx')
}

function tempDir(): string {
  const dir = path.join(app.getPath('temp'), 'CostumeCRM')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function cleanTempDir(dir: string): void {
  try {
    for (const file of fs.readdirSync(dir)) {
      try { fs.unlinkSync(path.join(dir, file)) } catch { /* file in use — skip */ }
    }
  } catch { /* dir may not exist yet */ }
}

export async function fillAndPrint(data: Row): Promise<void> {
  const tplPath = templatePath()
  if (!fs.existsSync(tplPath)) {
    throw new Error(
      `Шаблон Word не найден по пути:\n${tplPath}\n\nПоложите wordTemplate.docx в папку assets/ проекта.`
    )
  }

  const content = fs.readFileSync(tplPath, 'binary')
  const zip = new PizZip(content)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // Ошибки — в исключение, а не в тихий пропуск
    errorLogging: false,
  })

  const owe = data.price - data.prepaymentCash - data.prepaymentDigital

  doc.render({
    ID: String(data.id),
    CustomerName: data.customerName,
    CostumeName: data.costumeName,
    Phone: data.phone,
    CreationDate: fmtDate(data.creationDate),
    ActualOrderDate: fmtDate(data.actualOrderDate),
    ReturnDate: fmtDate(data.returnDate),
    Price: String(data.price),
    Prepayment: moneyParts(data.prepaymentCash, data.prepaymentDigital),
    Owe: String(owe),
    Pledge: moneyParts(data.pledgeCash, data.pledgeDigital),
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

  // Opens the file with whatever the OS has set as default for .docx (Word, LibreOffice, etc.)
  const err = await shell.openPath(outPath)
  if (err) throw new Error(`Не удалось открыть файл: ${err}`)
}
