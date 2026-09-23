export interface TagSummary {
  id: number
  name: string
}

export interface MovieSummary {
  id: number
  title: string
  releaseDate: string | null
  publisherName: string | null
  filename: string
  filepath: string
  durationSeconds: number | null
  available: boolean
  tags: TagSummary[]
  createdAt: string
}

export interface MovieCreateInput {
  title: string
  originalTitle?: string | null
  releaseDate?: string | null
  publisherName?: string | null
  filepath: string
}

export interface PickedMovieFile {
  filepath: string
  filename: string
  suggestedTitle: string
}

export interface MovieImportSkipped {
  filename: string
  reason: string
}

export interface MovieImportResult {
  added: MovieSummary[]
  skipped: MovieImportSkipped[]
}

export interface MovieLibraryApi {
  listMovies(): Promise<MovieSummary[]>
  createMovie(input: MovieCreateInput): Promise<MovieSummary>
  deleteMovie(id: number): Promise<void>
  playMovie(id: number): Promise<void>
  playMovies(ids: number[]): Promise<void>
  listTags(): Promise<TagSummary[]>
  createTag(name: string): Promise<TagSummary>
  updateMovieTags(id: number, tagIds: number[]): Promise<MovieSummary>
  pickMovieFile(): Promise<PickedMovieFile | null>
  importDroppedFiles(files: readonly unknown[]): Promise<MovieImportResult>
}

export const IPC_CHANNELS = {
  moviesList: 'movies:list',
  moviesCreate: 'movies:create',
  moviesDelete: 'movies:delete',
  moviesPlay: 'movies:play',
  moviesPlayList: 'movies:play-list',
  moviesUpdateTags: 'movies:update-tags',
  tagsList: 'tags:list',
  tagsCreate: 'tags:create',
  moviesPickFile: 'movies:pick-file',
  moviesImportFiles: 'movies:import-files'
} as const
