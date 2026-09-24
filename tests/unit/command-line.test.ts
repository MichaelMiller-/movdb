import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { parseCommandLine, validateSqliteDatabase } from '../../src/main/command-line'

const temporaryDirectories: string[] = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  )
})

describe('parseCommandLine', () => {
  test('accepts --db followed by a filename', () => {
    expect(parseCommandLine(['electron', '.', '--db', 'movies.sqlite'])).toEqual({
      databasePath: 'movies.sqlite'
    })
  })

  test('accepts --db=<filename>', () => {
    expect(parseCommandLine(['electron', '.', '--db=movies.sqlite'])).toEqual({
      databasePath: 'movies.sqlite'
    })
  })

  test('rejects a missing or duplicate --db argument', () => {
    expect(() => parseCommandLine(['electron', '.', '--db'])).toThrow(
      '--db requires a SQLite database filename.'
    )
    expect(() =>
      parseCommandLine(['electron', '.', '--db', 'one.sqlite', '--db=two.sqlite'])
    ).toThrow('--db may only be specified once.')
  })
})

describe('validateSqliteDatabase', () => {
  test('accepts a file with a SQLite database header', async () => {
    const directory = await createTemporaryDirectory()
    const filename = join(directory, 'movies.sqlite')
    await writeFile(filename, Buffer.from('SQLite format 3\0', 'utf8'))

    await expect(validateSqliteDatabase(filename)).resolves.toBe(resolve(filename))
  })

  test('rejects a non-SQLite file', async () => {
    const directory = await createTemporaryDirectory()
    const filename = join(directory, 'not-a-database.sqlite')
    await writeFile(filename, 'not sqlite', 'utf8')

    await expect(validateSqliteDatabase(filename)).rejects.toThrow(
      'File is not a valid SQLite database:'
    )
  })
})

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'movie-library-unit-'))
  temporaryDirectories.push(directory)
  return directory
}
