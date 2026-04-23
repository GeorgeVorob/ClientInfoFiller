import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import type { AppConfig } from '../../shared/types'
import { logError } from './logError'

const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json')

const DEFAULT_CONFIG: AppConfig = {
  mainExcelFilePath: '',
  sellExcelFilePath: '',
  sbpEnabled: true,
}

export function loadConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8')
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    }
  } catch (e) {
    logError('ConfigService.loadConfig', e, { CONFIG_PATH })
    // Corrupt config — fall back to defaults
  }
  return { ...DEFAULT_CONFIG }
}

export function saveConfig(config: AppConfig): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    logError('ConfigService.saveConfig', e, { CONFIG_PATH, config })
    throw e
  }
}
