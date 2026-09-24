import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { MovieLibraryApi, MovieSummary } from '../../src/shared/movies'
import {
  selectPaginatedMovies,
  selectTotalPages,
  selectVisibleMovies,
  useMovieLibraryStore
} from '../../src/renderer/src/stores/movieLibraryStore'

const defaultStoreState = {
  movies: [] as MovieSummary[],
  excludedTagIds: [] as number[],
  includedTagId: null as number | null,
  selectedActorIds: [] as number[],
  currentPage: 1,
  pageSize: 25,
  form: {
    title: '',
    filepath: '',
    releaseDate: '',
    publisherName: ''
  },
  loading: false,
  importing: false,
  dragging: false,
  importResult: null,
  error: null,
  tagEditorMovie: null,
  allTags: [],
  editedTagIds: [],
  newTagName: '',
  loadingTags: false,
  savingTags: false,
  creatingTag: false,
  tagEditorError: null,
  actorEditorMovie: null,
  allActors: [],
  editedActorIds: [],
  newActorName: '',
  loadingActors: false,
  savingActors: false,
  creatingActor: false,
  actorEditorError: null
}

beforeEach(() => {
  useMovieLibraryStore.setState(defaultStoreState)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('movie selectors', () => {
  test('combines tag filtering with actor OR filtering', () => {
    const movies = [
      makeMovie(1, { tagId: 1, actorId: 10 }),
      makeMovie(2, { tagId: 2, actorId: 20 }),
      makeMovie(3, { tagId: 1, actorId: 20 })
    ]

    useMovieLibraryStore.setState({
      movies,
      includedTagId: 1,
      selectedActorIds: [20]
    })

    expect(selectVisibleMovies(useMovieLibraryStore.getState()).map((movie) => movie.id)).toEqual([3])

    useMovieLibraryStore.setState({
      includedTagId: null,
      selectedActorIds: [10, 20]
    })

    expect(selectVisibleMovies(useMovieLibraryStore.getState()).map((movie) => movie.id)).toEqual([1, 2, 3])
  })

  test('paginates filtered movies with 25 movies per page by default', () => {
    useMovieLibraryStore.setState({
      movies: Array.from({ length: 60 }, (_, index) => makeMovie(index + 1)),
      currentPage: 2
    })

    const state = useMovieLibraryStore.getState()

    expect(state.pageSize).toBe(25)
    expect(selectTotalPages(state)).toBe(3)
    expect(selectPaginatedMovies(state).map((movie) => movie.id)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 26)
    )
  })
})

describe('pagination actions', () => {
  test('clamps pages and resets to page one when filters or page size change', () => {
    const movies = Array.from({ length: 60 }, (_, index) =>
      makeMovie(index + 1, { tagId: index % 2 === 0 ? 1 : 2 })
    )
    useMovieLibraryStore.setState({ movies })

    useMovieLibraryStore.getState().setPage(99)
    expect(useMovieLibraryStore.getState().currentPage).toBe(3)

    useMovieLibraryStore.getState().excludeTag(1)
    expect(useMovieLibraryStore.getState().currentPage).toBe(1)

    useMovieLibraryStore.getState().setPage(2)
    useMovieLibraryStore.getState().setPageSize(50)
    expect(useMovieLibraryStore.getState().pageSize).toBe(50)
    expect(useMovieLibraryStore.getState().currentPage).toBe(1)

    useMovieLibraryStore.getState().setPageSize(42)
    expect(useMovieLibraryStore.getState().pageSize).toBe(50)
  })

  test('reload removes stale filters and clamps the current page', async () => {
    const movies = [makeMovie(1, { tagId: 1, actorId: 10 })]
    const api = createMovieLibraryApi({ listMovies: vi.fn(async () => movies) })
    vi.stubGlobal('window', { movieLibrary: api })

    useMovieLibraryStore.setState({
      excludedTagIds: [999],
      includedTagId: 998,
      selectedActorIds: [997],
      currentPage: 4
    })

    await useMovieLibraryStore.getState().reload()

    const state = useMovieLibraryStore.getState()
    expect(state.movies).toEqual(movies)
    expect(state.excludedTagIds).toEqual([])
    expect(state.includedTagId).toBeNull()
    expect(state.selectedActorIds).toEqual([])
    expect(state.currentPage).toBe(1)
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()
  })
})

function makeMovie(
  id: number,
  options: { tagId?: number; actorId?: number; available?: boolean } = {}
): MovieSummary {
  return {
    id,
    title: `Movie ${String(id).padStart(2, '0')}`,
    originalTitle: null,
    releaseDate: null,
    publisherName: null,
    filename: `movie-${id}.mp4`,
    filepath: `/tmp/movie-${id}.mp4`,
    durationSeconds: null,
    available: options.available ?? true,
    tags: options.tagId === undefined ? [] : [{ id: options.tagId, name: `Tag ${options.tagId}` }],
    actors: options.actorId === undefined
      ? []
      : [{ id: options.actorId, name: `Actor ${options.actorId}` }],
    createdAt: '2026-09-24T00:00:00.000Z'
  }
}

function createMovieLibraryApi(
  overrides: Partial<MovieLibraryApi> = {}
): MovieLibraryApi {
  return {
    listMovies: vi.fn(async () => []),
    createMovie: vi.fn(),
    deleteMovie: vi.fn(),
    playMovie: vi.fn(),
    playMovies: vi.fn(),
    listTags: vi.fn(async () => []),
    createTag: vi.fn(),
    updateMovieTags: vi.fn(),
    listActors: vi.fn(async () => []),
    createActor: vi.fn(),
    updateMovieActors: vi.fn(),
    pickMovieFile: vi.fn(async () => null),
    importDroppedFiles: vi.fn(async () => ({ added: [], skipped: [] })),
    ...overrides
  } as MovieLibraryApi
}
