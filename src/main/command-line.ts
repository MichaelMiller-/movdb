import { open, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const SQLITE_HEADER = Buffer.from('SQLite format 3\0', 'utf8')

export interface CommandLineOptions {
  databasePath?: string
}

export function parseCommandLine(argv: readonly string[]): CommandLineOptions {
  let databasePath: string | undefined

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === '--db') {
      if (databasePath !== undefined) {
        throw new Error('--db may only be specified once.')
      }

      const value = argv[index + 1]
      if (!value || value.startsWith('--')) {
        throw new Error('--db requires a SQLite database filename.')
      }

      databasePath = value
      index += 1
      continue
    }

    if (argument.startsWith('--db=')) {
      if (databasePath !== undefined) {
        throw new Error('--db may only be specified once.')
      }

      const value = argument.slice('--db='.length)
      if (!value) {
        throw new Error('--db requires a SQLite database filename.')
      }

      databasePath = value
    }
  }

  return { databasePath }
}

export async function validateSqliteDatabase(filename: string): Promise<string> {
  const databasePath = resolve(filename)

  let fileStat
  try {
    fileStat = await stat(databasePath)
  } catch {
    throw new Error(`Database file does not exist: ${databasePath}`)
  }

  if (!fileStat.isFile()) {
    throw new Error(`Database path is not a regular file: ${databasePath}`)
  }

  const file = await open(databasePath, 'r')

  try {
    const header = Buffer.alloc(SQLITE_HEADER.length)
    const { bytesRead } = await file.read(header, 0, header.length, 0)

    if (bytesRead !== SQLITE_HEADER.length || !header.equals(SQLITE_HEADER)) {
      throw new Error(`File is not a valid SQLite database: ${databasePath}`)
    }
  } finally {
    await file.close()
  }

  return databasePath
}
