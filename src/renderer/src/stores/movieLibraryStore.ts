import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  ActorSummary,
  MovieCreateInput,
  MovieImportResult,
  MovieSummary,
  TagSummary
} from '../../../shared/movies'

export const MOVIES_PER_PAGE_OPTIONS = [10, 25, 50, 100] as const
const DEFAULT_PAGE_SIZE = 10

const emptyForm: MovieCreateInput = {
  title: '',
  filepath: '',
  releaseDate: '',
  publisherName: ''
}

export interface MovieLibraryStore {
  movies: MovieSummary[]
  excludedTagIds: number[]
  includedTagId: number | null
  selectedActorIds: number[]
  currentPage: number
  pageSize: number
  form: MovieCreateInput
  loading: boolean
  importing: boolean
  dragging: boolean
  importResult: MovieImportResult | null
  error: string | null

  tagEditorMovie: MovieSummary | null
  allTags: TagSummary[]
  editedTagIds: number[]
  newTagName: string
  loadingTags: boolean
  savingTags: boolean
  creatingTag: boolean
  tagEditorError: string | null

  actorEditorMovie: MovieSummary | null
  allActors: ActorSummary[]
  editedActorIds: number[]
  newActorName: string
  loadingActors: boolean
  savingActors: boolean
  creatingActor: boolean
  actorEditorError: string | null

  reload: () => Promise<void>
  setDragging: (dragging: boolean) => void
  setFormField: <K extends keyof MovieCreateInput>(
    field: K,
    value: MovieCreateInput[K]
  ) => void
  chooseFile: () => Promise<void>
  importDroppedFiles: (files: readonly unknown[]) => Promise<void>
  createMovie: () => Promise<void>
  playMovie: (id: number) => Promise<void>
  playVisibleMovies: () => Promise<void>
  deleteMovie: (id: number) => Promise<void>
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void

  excludeTag: (tagId: number) => void
  includeOnlyTag: (tagId: number) => void
  removeTagExclusion: (tagId: number) => void
  clearTagInclusion: () => void

  selectActor: (actorId: number) => void
  removeActorFilter: (actorId: number) => void

  openTagEditor: (movie: MovieSummary) => Promise<void>
  closeTagEditor: () => void
  toggleEditedTag: (tagId: number) => void
  setNewTagName: (name: string) => void
  createTag: () => Promise<void>
  saveTags: () => Promise<void>

  openActorEditor: (movie: MovieSummary) => Promise<void>
  closeActorEditor: () => void
  toggleEditedActor: (actorId: number) => void
  setNewActorName: (name: string) => void
  createActor: () => Promise<void>
  saveActors: () => Promise<void>
}

export const selectTagFilteredMovies = (state: MovieLibraryStore): MovieSummary[] => {
  if (state.includedTagId !== null) {
    return state.movies.filter((movie) =>
      movie.tags.some((tag) => tag.id === state.includedTagId)
    )
  }

  if (state.excludedTagIds.length === 0) return state.movies

  const excluded = new Set(state.excludedTagIds)
  return state.movies.filter(
    (movie) => !movie.tags.some((tag) => excluded.has(tag.id))
  )
}

export const selectVisibleMovies = (state: MovieLibraryStore): MovieSummary[] => {
  const tagFilteredMovies = selectTagFilteredMovies(state)
  if (state.selectedActorIds.length === 0) return tagFilteredMovies

  const selected = new Set(state.selectedActorIds)
  return tagFilteredMovies.filter((movie) =>
    movie.actors.some((actor) => selected.has(actor.id))
  )
}

export const selectPlayableVisibleMovies = (state: MovieLibraryStore): MovieSummary[] =>
  selectVisibleMovies(state).filter((movie) => movie.available)

export const selectTotalPages = (state: MovieLibraryStore): number =>
  totalPages(selectVisibleMovies(state).length, state.pageSize)

export const selectPaginatedMovies = (state: MovieLibraryStore): MovieSummary[] => {
  const visibleMovies = selectVisibleMovies(state)
  const page = clampPage(state.currentPage, visibleMovies.length, state.pageSize)
  const start = (page - 1) * state.pageSize

  return visibleMovies.slice(start, start + state.pageSize)
}

export const selectIncludedTag = (state: MovieLibraryStore): TagSummary | null => {
  if (state.includedTagId === null) return null
  return collectTags(state.movies).get(state.includedTagId) ?? null
}

export const selectExcludedTags = (state: MovieLibraryStore): TagSummary[] => {
  const tagsById = collectTags(state.movies)

  return state.excludedTagIds
    .map((tagId) => tagsById.get(tagId))
    .filter((tag): tag is TagSummary => tag !== undefined)
}

export const selectAvailableTags = (state: MovieLibraryStore): TagSummary[] => {
  const excluded = new Set(state.excludedTagIds)

  return [...collectTags(state.movies).values()]
    .filter((tag) => tag.id !== state.includedTagId && !excluded.has(tag.id))
    .sort(compareTags)
}

export const selectSelectedActors = (state: MovieLibraryStore): ActorSummary[] => {
  const actorsById = collectActors(state.movies)

  return state.selectedActorIds
    .map((actorId) => actorsById.get(actorId))
    .filter((actor): actor is ActorSummary => actor !== undefined)
}

export const selectAvailableActors = (state: MovieLibraryStore): ActorSummary[] => {
  const selected = new Set(state.selectedActorIds)

  return [...collectActors(selectTagFilteredMovies(state)).values()]
    .filter((actor) => !selected.has(actor.id))
    .sort(compareActors)
}

export const useMovieLibraryStore = create<MovieLibraryStore>()(
  devtools(
    (set, get) => ({
      movies: [],
      excludedTagIds: [],
      includedTagId: null,
      selectedActorIds: [],
      currentPage: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      form: emptyForm,
      loading: true,
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
      actorEditorError: null,

      reload: async () => {
        set({ loading: true }, false, 'movies/reload:start')
        try {
          const movies = await window.movieLibrary.listMovies()
          set(
            (state) => ({
              ...synchronizeMovieState(state, movies),
              error: null
            }),
            false,
            'movies/reload:success'
          )
        } catch (error) {
          set({ error: toMessage(error) }, false, 'movies/reload:error')
        } finally {
          set({ loading: false }, false, 'movies/reload:finish')
        }
      },

      setDragging: (dragging) =>
        set({ dragging }, false, dragging ? 'drag/enter' : 'drag/leave'),

      setFormField: (field, value) =>
        set(
          (state) => ({ form: { ...state.form, [field]: value } }),
          false,
          `form/set-${String(field)}`
        ),

      chooseFile: async () => {
        try {
          const picked = await window.movieLibrary.pickMovieFile()
          if (!picked) return

          set(
            (state) => ({
              form: {
                ...state.form,
                filepath: picked.filepath,
                title: state.form.title || picked.suggestedTitle
              },
              error: null
            }),
            false,
            'form/choose-file'
          )
        } catch (error) {
          set({ error: toMessage(error) }, false, 'form/choose-file:error')
        }
      },

      importDroppedFiles: async (files) => {
        if (files.length === 0) return

        set(
          { dragging: false, importing: true, importResult: null, error: null },
          false,
          'import/start'
        )

        try {
          const result = await window.movieLibrary.importDroppedFiles(files)
          set({ importResult: result }, false, 'import/success')
          await get().reload()
        } catch (error) {
          set({ error: toMessage(error) }, false, 'import/error')
        } finally {
          set({ importing: false }, false, 'import/finish')
        }
      },

      createMovie: async () => {
        const form = get().form

        try {
          await window.movieLibrary.createMovie({
            ...form,
            releaseDate: form.releaseDate || null,
            publisherName: form.publisherName || null
          })
          set({ form: emptyForm, error: null }, false, 'movies/create:success')
          await get().reload()
        } catch (error) {
          set({ error: toMessage(error) }, false, 'movies/create:error')
        }
      },

      playMovie: async (id) => {
        try {
          await window.movieLibrary.playMovie(id)
          set({ error: null }, false, 'movies/play:success')
        } catch (error) {
          set({ error: toMessage(error) }, false, 'movies/play:error')
        }
      },

      playVisibleMovies: async () => {
        const playableMovies = selectPlayableVisibleMovies(get())
        if (playableMovies.length === 0) return

        try {
          await window.movieLibrary.playMovies(playableMovies.map((movie) => movie.id))
          set({ error: null }, false, 'movies/play-visible:success')
        } catch (error) {
          set({ error: toMessage(error) }, false, 'movies/play-visible:error')
        }
      },

      deleteMovie: async (id) => {
        try {
          await window.movieLibrary.deleteMovie(id)
          await get().reload()
        } catch (error) {
          set({ error: toMessage(error) }, false, 'movies/delete:error')
        }
      },

      setPage: (page) => {
        const state = get()
        const nextPage = Math.min(
          Math.max(1, Math.trunc(page)),
          selectTotalPages(state)
        )

        set({ currentPage: nextPage }, false, 'pagination/set-page')
      },

      setPageSize: (pageSize) => {
        if (!MOVIES_PER_PAGE_OPTIONS.includes(pageSize as 10 | 25 | 50 | 100)) return

        set(
          { pageSize, currentPage: 1 },
          false,
          'pagination/set-page-size'
        )
      },

      excludeTag: (tagId) =>
        set(
          (state) => ({
            includedTagId: null,
            excludedTagIds: state.excludedTagIds.includes(tagId)
              ? state.excludedTagIds
              : [...state.excludedTagIds, tagId],
            currentPage: 1
          }),
          false,
          'filters/tag-exclude'
        ),

      includeOnlyTag: (tagId) =>
        set(
          { excludedTagIds: [], includedTagId: tagId, currentPage: 1 },
          false,
          'filters/tag-include-only'
        ),

      removeTagExclusion: (tagId) =>
        set(
          (state) => ({
            excludedTagIds: state.excludedTagIds.filter((id) => id !== tagId),
            currentPage: 1
          }),
          false,
          'filters/tag-remove-exclusion'
        ),

      clearTagInclusion: () =>
        set(
          { includedTagId: null, currentPage: 1 },
          false,
          'filters/tag-clear-inclusion'
        ),

      selectActor: (actorId) =>
        set(
          (state) => ({
            selectedActorIds: state.selectedActorIds.includes(actorId)
              ? state.selectedActorIds
              : [...state.selectedActorIds, actorId],
            currentPage: 1
          }),
          false,
          'filters/actor-select'
        ),

      removeActorFilter: (actorId) =>
        set(
          (state) => ({
            selectedActorIds: state.selectedActorIds.filter((id) => id !== actorId),
            currentPage: 1
          }),
          false,
          'filters/actor-remove'
        ),

      openTagEditor: async (movie) => {
        set(
          {
            tagEditorMovie: movie,
            editedTagIds: movie.tags.map((tag) => tag.id),
            newTagName: '',
            loadingTags: true,
            tagEditorError: null,
            error: null
          },
          false,
          'tags/editor-open'
        )

        try {
          const allTags = await window.movieLibrary.listTags()
          set({ allTags }, false, 'tags/load:success')
        } catch (error) {
          set(
            { tagEditorMovie: null, error: toMessage(error) },
            false,
            'tags/load:error'
          )
        } finally {
          set({ loadingTags: false }, false, 'tags/load:finish')
        }
      },

      closeTagEditor: () => {
        const { savingTags, creatingTag } = get()
        if (savingTags || creatingTag) return

        set(resetTagEditorState(), false, 'tags/editor-close')
      },

      toggleEditedTag: (tagId) =>
        set(
          (state) => ({
            editedTagIds: state.editedTagIds.includes(tagId)
              ? state.editedTagIds.filter((id) => id !== tagId)
              : [...state.editedTagIds, tagId]
          }),
          false,
          'tags/toggle'
        ),

      setNewTagName: (newTagName) =>
        set({ newTagName }, false, 'tags/set-new-name'),

      createTag: async () => {
        const name = get().newTagName.trim()
        if (!name) return

        set({ creatingTag: true, tagEditorError: null }, false, 'tags/create:start')

        try {
          const tag = await window.movieLibrary.createTag(name)
          set(
            (state) => ({
              allTags: [...state.allTags.filter((item) => item.id !== tag.id), tag].sort(compareTags),
              editedTagIds: state.editedTagIds.includes(tag.id)
                ? state.editedTagIds
                : [...state.editedTagIds, tag.id],
              newTagName: '',
              tagEditorError: null
            }),
            false,
            'tags/create:success'
          )
        } catch (error) {
          set({ tagEditorError: toMessage(error) }, false, 'tags/create:error')
        } finally {
          set({ creatingTag: false }, false, 'tags/create:finish')
        }
      },

      saveTags: async () => {
        const { tagEditorMovie, editedTagIds } = get()
        if (!tagEditorMovie) return

        set({ savingTags: true, tagEditorError: null }, false, 'tags/save:start')

        try {
          const updated = await window.movieLibrary.updateMovieTags(
            tagEditorMovie.id,
            editedTagIds
          )
          set(
            (state) => ({
              ...synchronizeMovieState(
                state,
                state.movies.map((movie) => movie.id === updated.id ? updated : movie)
              ),
              ...resetTagEditorState()
            }),
            false,
            'tags/save:success'
          )
        } catch (error) {
          set({ tagEditorError: toMessage(error) }, false, 'tags/save:error')
        } finally {
          set({ savingTags: false }, false, 'tags/save:finish')
        }
      },

      openActorEditor: async (movie) => {
        set(
          {
            actorEditorMovie: movie,
            editedActorIds: movie.actors.map((actor) => actor.id),
            newActorName: '',
            loadingActors: true,
            actorEditorError: null,
            error: null
          },
          false,
          'actors/editor-open'
        )

        try {
          const allActors = await window.movieLibrary.listActors()
          set({ allActors }, false, 'actors/load:success')
        } catch (error) {
          set(
            { actorEditorMovie: null, error: toMessage(error) },
            false,
            'actors/load:error'
          )
        } finally {
          set({ loadingActors: false }, false, 'actors/load:finish')
        }
      },

      closeActorEditor: () => {
        const { savingActors, creatingActor } = get()
        if (savingActors || creatingActor) return

        set(resetActorEditorState(), false, 'actors/editor-close')
      },

      toggleEditedActor: (actorId) => {
        set(
          (state) => ({
            editedActorIds: state.editedActorIds.includes(actorId)
              ? state.editedActorIds.filter((id) => id !== actorId)
              : [...state.editedActorIds, actorId]
          }),
          false,
          'actors/toggle'
        )},

      setNewActorName: (newActorName) =>
        set({ newActorName }, false, 'actors/set-new-name'),

      createActor: async () => {
        const name = get().newActorName.trim()
        if (!name) return

        set(
          { creatingActor: true, actorEditorError: null },
          false,
          'actors/create:start'
        )

        try {
          const actor = await window.movieLibrary.createActor(name)
          set(
            (state) => ({
              allActors: [...state.allActors.filter((item) => item.id !== actor.id), actor].sort(compareActors),
              editedActorIds: state.editedActorIds.includes(actor.id)
                ? state.editedActorIds
                : [...state.editedActorIds, actor.id],
              newActorName: ''
            }),
            false,
            'actors/create:success'
          )
        } catch (error) {
          set({ actorEditorError: toMessage(error) }, false, 'actors/create:error')
        } finally {
          set({ creatingActor: false }, false, 'actors/create:finish')
        }
      },

      saveActors: async () => {
        const { actorEditorMovie, editedActorIds } = get()
        if (!actorEditorMovie) return

        set(
          { savingActors: true, actorEditorError: null },
          false,
          'actors/save:start'
        )

        try {
          const updated = await window.movieLibrary.updateMovieActors(
            actorEditorMovie.id,
            editedActorIds
          )
          set(
            (state) => ({
              ...synchronizeMovieState(
                state,
                state.movies.map((movie) => movie.id === updated.id ? updated : movie)
              ),
              ...resetActorEditorState()
            }),
            false,
            'actors/save:success'
          )
        } catch (error) {
          set({ actorEditorError: toMessage(error) }, false, 'actors/save:error')
        } finally {
          set({ savingActors: false }, false, 'actors/save:finish')
        }
      }
    }),
    {
      name: 'MovieLibraryStore',
      enabled: import.meta.env.DEV
    }
  )
)

function synchronizeMovieState(
  state: MovieLibraryStore,
  movies: MovieSummary[]
): Pick<
  MovieLibraryStore,
  | 'movies'
  | 'excludedTagIds'
  | 'includedTagId'
  | 'selectedActorIds'
  | 'currentPage'
  | 'pageSize'
> {
  const knownTagIds = new Set(
    movies.flatMap((movie) => movie.tags.map((tag) => tag.id))
  )
  const knownActorIds = new Set(
    movies.flatMap((movie) => movie.actors.map((actor) => actor.id))
  )
  const synchronized = {
    movies,
    excludedTagIds: state.excludedTagIds.filter((tagId) => knownTagIds.has(tagId)),
    includedTagId:
      state.includedTagId !== null && knownTagIds.has(state.includedTagId)
        ? state.includedTagId
        : null,
    selectedActorIds: state.selectedActorIds.filter((actorId) => knownActorIds.has(actorId))
  }
  const visibleMovieCount = selectVisibleMovies({ ...state, ...synchronized }).length

  return {
    ...synchronized,
    currentPage: clampPage(state.currentPage, visibleMovieCount, state.pageSize),
    pageSize: state.pageSize
  }
}

function totalPages(movieCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(movieCount / pageSize))
}

function clampPage(page: number, movieCount: number, pageSize: number): number {
  return Math.min(Math.max(1, Math.trunc(page)), totalPages(movieCount, pageSize))
}

function resetTagEditorState(): Pick<
  MovieLibraryStore,
  'tagEditorMovie' | 'allTags' | 'editedTagIds' | 'newTagName' | 'tagEditorError'
> {
  return {
    tagEditorMovie: null,
    allTags: [],
    editedTagIds: [],
    newTagName: '',
    tagEditorError: null
  }
}

function resetActorEditorState(): Pick<
  MovieLibraryStore,
  'actorEditorMovie' | 'allActors' | 'editedActorIds' | 'newActorName' | 'actorEditorError'
> {
  return {
    actorEditorMovie: null,
    allActors: [],
    editedActorIds: [],
    newActorName: '',
    actorEditorError: null
  }
}

function collectTags(movies: MovieSummary[]): Map<number, TagSummary> {
  const tags = new Map<number, TagSummary>()

  for (const movie of movies) {
    for (const tag of movie.tags) {
      tags.set(tag.id, tag)
    }
  }

  return tags
}

function compareTags(left: TagSummary, right: TagSummary): number {
  return left.name.localeCompare(right.name)
}

function collectActors(movies: MovieSummary[]): Map<number, ActorSummary> {
  const actors = new Map<number, ActorSummary>()

  for (const movie of movies) {
    for (const actor of movie.actors) {
      actors.set(actor.id, actor)
    }
  }

  return actors
}

function compareActors(left: ActorSummary, right: ActorSummary): number {
  return left.name.localeCompare(right.name)
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
