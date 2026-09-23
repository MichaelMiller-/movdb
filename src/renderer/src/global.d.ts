import type { MovieLibraryApi } from '@shared/movies'

declare global {
  interface Window {
    movieLibrary: MovieLibraryApi
  }
}

export {}
