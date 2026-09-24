import { normalize, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'
import { normalizeMovieFilePath } from '../../src/main/database/movieFilePath'

describe('normalizeMovieFilePath', () => {
  test('keeps an absolute movie path and trims surrounding whitespace', () => {
    const filepath = resolve('fixtures', 'movie.mp4')

    expect(normalizeMovieFilePath(`  ${filepath}  `)).toBe(normalize(filepath))
  })

  test('rejects an empty path', () => {
    expect(() => normalizeMovieFilePath('   ')).toThrow('Movie file path must not be empty.')
  })

  test('rejects a filename without an absolute path', () => {
    expect(() => normalizeMovieFilePath('movie.mp4')).toThrow(
      'Movie file path must be absolute.'
    )
  })

  test('rejects a relative path', () => {
    expect(() => normalizeMovieFilePath('movies/movie.mp4')).toThrow(
      'Movie file path must be absolute.'
    )
  })
})
