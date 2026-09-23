import { contextBridge, ipcRenderer, webUtils } from 'electron'
import {
  IPC_CHANNELS,
  type ActorSummary,
  type MovieCreateInput,
  type MovieImportResult,
  type MovieLibraryApi,
  type MovieSummary,
  type PickedMovieFile,
  type TagSummary
} from '../shared/movies'

const api: MovieLibraryApi = {
  listMovies: (): Promise<MovieSummary[]> => ipcRenderer.invoke(IPC_CHANNELS.moviesList),
  createMovie: (input: MovieCreateInput): Promise<MovieSummary> =>
    ipcRenderer.invoke(IPC_CHANNELS.moviesCreate, input),
  deleteMovie: (id: number): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.moviesDelete, id),
  playMovie: (id: number): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.moviesPlay, id),
  playMovies: (ids: number[]): Promise<void> =>
    ipcRenderer.invoke(IPC_CHANNELS.moviesPlayList, ids),
  listTags: (): Promise<TagSummary[]> => ipcRenderer.invoke(IPC_CHANNELS.tagsList),
  createTag: (name: string): Promise<TagSummary> => ipcRenderer.invoke(IPC_CHANNELS.tagsCreate, name),
  updateMovieTags: (id: number, tagIds: number[]): Promise<MovieSummary> =>
    ipcRenderer.invoke(IPC_CHANNELS.moviesUpdateTags, id, tagIds),
  listActors: (): Promise<ActorSummary[]> => ipcRenderer.invoke(IPC_CHANNELS.actorsList),
  createActor: (name: string): Promise<ActorSummary> =>
    ipcRenderer.invoke(IPC_CHANNELS.actorsCreate, name),
  updateMovieActors: (id: number, actorIds: number[]): Promise<MovieSummary> =>
    ipcRenderer.invoke(IPC_CHANNELS.moviesUpdateActors, id, actorIds),
  pickMovieFile: (): Promise<PickedMovieFile | null> =>
    ipcRenderer.invoke(IPC_CHANNELS.moviesPickFile),
  importDroppedFiles: (files: readonly unknown[]): Promise<MovieImportResult> => {
    const filePaths = files
      .map((file) =>
        webUtils.getPathForFile(
          file as Parameters<typeof webUtils.getPathForFile>[0]
        )
      )
      .filter((filePath) => filePath.length > 0)
    return ipcRenderer.invoke(IPC_CHANNELS.moviesImportFiles, filePaths)
  }
}

contextBridge.exposeInMainWorld('movieLibrary', api)
