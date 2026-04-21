
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

function getLogPath(): string {
  // В portable режиме exe и app.asar лежат рядом, process.resourcesPath — путь к app.asar
  // В dev — app.getAppPath() это папка src/main
  let baseDir: string
  try {
    baseDir = app.isPackaged ? process.resourcesPath : app.getAppPath()
  } catch {
    baseDir = '.'
  }
  return path.join(baseDir, 'ClientInfoFiller-error.log')
}

export function logError(context: string, error: unknown, details?: Record<string, any>) {
  const time = new Date().toISOString()
  let msg = `[${time}] [${context}]\n`
  if (details) {
    try {
      msg += 'Details: ' + JSON.stringify(details, null, 2) + '\n'
    } catch {}
  }
  if (error instanceof Error) {
    msg += `Error: ${error.message}\nStack: ${error.stack}\n`
  } else {
    msg += `Error: ${String(error)}\n`
  }
  msg += '\n'
  try {
    fs.appendFileSync(getLogPath(), msg, 'utf-8')
  } catch {}
}
