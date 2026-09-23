import 'reflect-metadata'

import { join } from 'node:path'
import { app, BrowserWindow, dialog } from 'electron'
import { parseCommandLine, validateSqliteDatabase } from './command-line'
import { createDataSource } from './database/data-source'
import { registerIpcHandlers } from './ipc'

async function createWindow(): Promise<void> {
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1200,
    minWidth: 900,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools()
  }
  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  try {
    const options = parseCommandLine(process.argv)
    const databasePath = options.databasePath
      ? await validateSqliteDatabase(options.databasePath)
      : join(app.getPath('userData'), 'movie-library.sqlite')

    const dataSource = createDataSource(databasePath)

    await dataSource.initialize()
    registerIpcHandlers(dataSource)
    await createWindow()

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) await createWindow()
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    console.error('Failed to start application:', error)
    dialog.showErrorBox('Movie Library', message)
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
