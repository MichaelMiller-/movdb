import { stat, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, dialog, ipcMain, shell } from 'electron'
import type { DataSource } from 'typeorm'
import {
  IPC_CHANNELS,
  type MovieCreateInput,
  type MovieImportResult,
  type PickedMovieFile
} from '../shared/movies'
import { MovieRepository } from './database/repositories/MovieRepository'
import { TagRepository } from './database/repositories/TagRepository'

const VIDEO_EXTENSIONS = new Set(['.mkv', '.mp4', '.avi', '.webm', '.mov', '.m4v'])

export function registerIpcHandlers(dataSource: DataSource): void {
  const movies = new MovieRepository(dataSource)
  const tags = new TagRepository(dataSource)

  ipcMain.handle(IPC_CHANNELS.moviesList, () => movies.list())

  ipcMain.handle(IPC_CHANNELS.moviesCreate, (_event, input: MovieCreateInput) => {
    return movies.create(input)
  })

  ipcMain.handle(IPC_CHANNELS.moviesDelete, async (_event, id: number) => {
    await movies.delete(id)
  })

  ipcMain.handle(IPC_CHANNELS.moviesUpdateTags, (_event, id: number, tagIds: unknown) => {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid movie id.')
    }

    if (!Array.isArray(tagIds) || !tagIds.every((tagId) => Number.isInteger(tagId) && tagId > 0)) {
      throw new Error('Invalid tag selection.')
    }

    return movies.updateTags(id, tagIds as number[])
  })

  ipcMain.handle(IPC_CHANNELS.tagsList, () => tags.list())

  ipcMain.handle(IPC_CHANNELS.tagsCreate, (_event, name: unknown) => {
    if (typeof name !== 'string') {
      throw new Error('Invalid tag name.')
    }

    return tags.create(name)
  })

  ipcMain.handle(IPC_CHANNELS.moviesPlay, async (_event, id: number) => {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid movie id.')
    }

    const movie = await movies.findById(id)
    if (!movie) {
      throw new Error('Movie not found.')
    }

    if (!movie.available) {
      throw new Error('Movie file is currently unavailable.')
    }

    const errorMessage = await shell.openPath(movie.filepath)
    if (errorMessage) {
      throw new Error(errorMessage)
    }
  })

  ipcMain.handle(IPC_CHANNELS.moviesPlayList, async (_event, ids: unknown) => {
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !ids.every((id) => Number.isInteger(id) && id > 0)
    ) {
      throw new Error('Invalid watch-list.')
    }

    const movieIds = [...new Set(ids as number[])]
    const playlistLines = ['#EXTM3U']

    for (const id of movieIds) {
      const movie = await movies.findById(id)
      if (!movie) {
        throw new Error(`Movie ${id} not found.`)
      }

      if (!movie.available) {
        continue
      }

      const title = movie.title.replace(/[\r\n]+/g, ' ').trim()
      playlistLines.push(`#EXTINF:-1,${title}`)
      playlistLines.push(pathToFileURL(movie.filepath).href)
    }

    if (playlistLines.length === 1) {
      throw new Error('No available movie files in the watch-list.')
    }

    const playlistPath = join(app.getPath('temp'), 'movdb-watchlist.m3u8')
    await writeFile(playlistPath, `${playlistLines.join('\n')}\n`, 'utf8')

    const errorMessage = await shell.openPath(playlistPath)
    if (errorMessage) {
      throw new Error(errorMessage)
    }
  })

  ipcMain.handle(IPC_CHANNELS.moviesPickFile, async (): Promise<PickedMovieFile | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Video files', extensions: [...VIDEO_EXTENSIONS].map((ext) => ext.slice(1)) }]
    })

    if (result.canceled || result.filePaths.length === 0) return null

    return toPickedMovieFile(result.filePaths[0])
  })

  ipcMain.handle(
    IPC_CHANNELS.moviesImportFiles,
    async (_event, input: unknown): Promise<MovieImportResult> => {
      if (!Array.isArray(input)) {
        throw new Error('Invalid dropped file list.')
      }

      const filePaths = [
        ...new Set(input.filter((value): value is string => typeof value === 'string' && value.length > 0))
      ]

      const result: MovieImportResult = {
        added: [],
        skipped: []
      }

      for (const filepath of filePaths) {
        const filename = basename(filepath)
        const extension = extname(filename).toLowerCase()

        if (!VIDEO_EXTENSIONS.has(extension)) {
          result.skipped.push({ filename, reason: 'Unsupported video format.' })
          continue
        }

        try {
          const fileStat = await stat(filepath)
          if (!fileStat.isFile()) {
            result.skipped.push({ filename, reason: 'Not a regular file.' })
            continue
          }

          const picked = toPickedMovieFile(filepath)
          const movie = await movies.create({
            title: picked.suggestedTitle,
            filepath: picked.filepath
          })

          result.added.push(movie)
        } catch (error) {
          result.skipped.push({
            filename,
            reason: error instanceof Error ? error.message : String(error)
          })
        }
      }

      return result
    }
  )
}

function toPickedMovieFile(filepath: string): PickedMovieFile {
  const filename = basename(filepath)
  const extension = extname(filename)

  return {
    filepath,
    filename,
    suggestedTitle: filename.slice(0, Math.max(0, filename.length - extension.length))
  }
}
