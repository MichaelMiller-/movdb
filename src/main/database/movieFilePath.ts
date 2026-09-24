import { isAbsolute, normalize } from 'node:path'

export function normalizeMovieFilePath(input: string): string {
  const filepath = input.trim()

  if (!filepath) {
    throw new Error('Movie file path must not be empty.')
  }

  if (!isAbsolute(filepath)) {
    throw new Error('Movie file path must be absolute.')
  }

  return normalize(filepath)
}

export function isAbsoluteMovieFilePath(filepath: string): boolean {
  return isAbsolute(filepath)
}
