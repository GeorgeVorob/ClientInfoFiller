import { app, BrowserWindow, Menu } from 'electron'
import path from 'path'
import { registerIpcHandlers } from './ipc'

function createWindow(): BrowserWindow {
  Menu.setApplicationMenu(null) // Remove default menu (with "File", "Edit" etc.) — we don't need it
  const win = new BrowserWindow({
    width: 900,
    height: 1000,
    minWidth: 550,
    minHeight: 600,
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
