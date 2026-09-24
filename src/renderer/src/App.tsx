import {
    FormEvent,
    useEffect,
} from 'react'
import {IconButton} from "@renderer/components/IconButton";
import {TrashIcon} from "@renderer/components/icons/TrashIcon";
import {PlayIcon} from "@renderer/components/icons/PlayIcon";
import {TagIcon} from "@renderer/components/icons/TagIcon";
import {Panel} from "@renderer/components/Panel";
import {ActorIcon} from "@renderer/components/icons/ActorIcon";
import {Dialog, DialogActions, DialogFooter, DialogHeader} from "@renderer/components/Dialog";
import {
    MOVIES_PER_PAGE_OPTIONS,
    selectPaginatedMovies,
    selectTotalPages,
    selectVisibleMovies,
    useMovieLibraryStore,
} from './store'
import {useShallow} from "zustand/react/shallow";
import {SelectionCount} from "@renderer/components/SelectionCount";
import {TableHeader} from "@renderer/components/TableHeader";
import {MovieTable} from "@renderer/components/MovieTable";
import {TableColumn} from "@renderer/components/TableColumn";
import {LibraryStatus} from "@renderer/components/LibraryStatus";
import {FilepathFilter} from "@renderer/components/FilepathFilter";
import {TagFilter} from "@renderer/components/TagFilter";
import {ActorFilter} from "@renderer/components/ActorFilter";
import {Row} from "@renderer/components/Row";

export default function App(): React.JSX.Element {
    const {
        movies,
        excludedTagIds,
        includedTagId,
        loading,
        importing,
        dragging,
        importResult,
        error,
        tagEditorMovie,
        allTags,
        editedTagIds,
        newTagName,
        loadingTags,
        savingTags,
        creatingTag,
        tagEditorError,
        actorEditorMovie,
        allActors,
        editedActorIds,
        newActorName,
        loadingActors,
        savingActors,
        creatingActor,
        actorEditorError,
        setDragging,
        importDroppedFiles,
        playMovie: play,
        deleteMovie: remove,
        openTagEditor,
        closeTagEditor,
        toggleEditedTag,
        setNewTagName,
        createTag,
        saveTags,
        openActorEditor,
        closeActorEditor,
        toggleEditedActor,
        setNewActorName,
        createActor,
        saveActors,
        currentPage,
        pageSize,
        setPage,
        setPageSize,
    } = useMovieLibraryStore(
        useShallow((state) => ({
            movies: state.movies,
            excludedTagIds: state.excludedTagIds,
            includedTagId: state.includedTagId,
            selectedActorIds: state.selectedActorIds,
            form: state.form,
            loading: state.loading,
            importing: state.importing,
            dragging: state.dragging,
            importResult: state.importResult,
            error: state.error,
            tagEditorMovie: state.tagEditorMovie,
            allTags: state.allTags,
            editedTagIds: state.editedTagIds,
            newTagName: state.newTagName,
            loadingTags: state.loadingTags,
            savingTags: state.savingTags,
            creatingTag: state.creatingTag,
            tagEditorError: state.tagEditorError,
            actorEditorMovie: state.actorEditorMovie,
            allActors: state.allActors,
            editedActorIds: state.editedActorIds,
            newActorName: state.newActorName,
            loadingActors: state.loadingActors,
            savingActors: state.savingActors,
            creatingActor: state.creatingActor,
            actorEditorError: state.actorEditorError,
            setDragging: state.setDragging,
            setFormField: state.setFormField,
            chooseFile: state.chooseFile,
            importDroppedFiles: state.importDroppedFiles,
            createMovie: state.createMovie,
            playMovie: state.playMovie,
            playVisibleMovies: state.playVisibleMovies,
            deleteMovie: state.deleteMovie,
            excludeTag: state.excludeTag,
            includeOnlyTag: state.includeOnlyTag,
            removeTagExclusion: state.removeTagExclusion,
            clearTagInclusion: state.clearTagInclusion,
            selectActor: state.selectActor,
            removeActorFilter: state.removeActorFilter,
            openTagEditor: state.openTagEditor,
            closeTagEditor: state.closeTagEditor,
            toggleEditedTag: state.toggleEditedTag,
            setNewTagName: state.setNewTagName,
            createTag: state.createTag,
            saveTags: state.saveTags,
            openActorEditor: state.openActorEditor,
            closeActorEditor: state.closeActorEditor,
            toggleEditedActor: state.toggleEditedActor,
            setNewActorName: state.setNewActorName,
            createActor: state.createActor,
            saveActors: state.saveActors,
            currentPage: state.currentPage,
            pageSize: state.pageSize,
            setPage: state.setPage,
            setPageSize: state.setPageSize,
        }))
    )

    const visibleMovies = useMovieLibraryStore(useShallow(selectVisibleMovies))
    const paginatedMovies = useMovieLibraryStore(useShallow(selectPaginatedMovies))
    const totalPages = useMovieLibraryStore(selectTotalPages)

    // Prevent Chromium from navigating to a file when it is dropped outside
    // our drop target.
    useEffect(() => {
        const preventFileNavigation = (event: globalThis.DragEvent): void => {
            if (event.dataTransfer?.types.includes('Files')) {
                event.preventDefault()
            }
        }

        window.addEventListener('dragover', preventFileNavigation)
        window.addEventListener('drop', preventFileNavigation)

        return () => {
            window.removeEventListener('dragover', preventFileNavigation)
            window.removeEventListener('drop', preventFileNavigation)
        }
    }, [])

    function submitTag(event: FormEvent): void {
        event.preventDefault()
        void createTag()
    }

    function submitActor(event: FormEvent): void {
        event.preventDefault()
        void createActor()
    }

    async function handleDrop(event: DragEvent): Promise<void> {
        event.preventDefault()
        if (event.dataTransfer) {
            const files = Array.from(event.dataTransfer.files)
            if (files.length === 0) {
                console.log('files.length === 0)')
                return
            }
            void importDroppedFiles(files)
        }
    }

    return (
        <main className="app-shell">

            {error && <div className="error-box">{error}</div>}

            <Panel>
                <LibraryStatus />
                <Row>
                    <TagFilter/>
                    <ActorFilter/>
                </Row>
                <FilepathFilter/>

                {loading ? (
                    <p className="muted">Loading…</p>
                ) : movies.length === 0 ? (
                    <p className="muted">No movies yet. Drop video files below to get started.</p>
                ) : paginatedMovies.length === 0 ? (
                    <p className="muted">
                        {excludedTagIds.length > 0
                            ? 'No movies match the selected tags.'
                            : 'No movies yet. Drop video files below to get started.'}
                        {includedTagId !== null
                            ? 'No movies contain the selected tag.'
                            : excludedTagIds.length > 0
                                ? 'No movies remain after excluding the selected tags.'
                                : 'No movies yet. Drop video files above to get started.'}
                    </p>
                ) : (
                    <div>
                        <MovieTable>
                                <TableHeader>
                                    <TableColumn name={'Title'} />
                                    <TableColumn name={'Actors'} />
                                    <TableColumn name={'Tags'} />
                                    <TableColumn name={''} aria-label="Actions" />
                                </TableHeader>
                                <tbody>
                                {paginatedMovies.map((movie) => (
                                    <tr
                                        key={movie.id}
                                        className={`movie-row${movie.available ? '' : ' movie-row--unavailable'}`}
                                        title={
                                            movie.available
                                                ? `${movie.filepath}\nDouble-click to play`
                                                : `${movie.filepath}\nFile unavailable`
                                        }
                                        onDoubleClick={() => {
                                            if (movie.available) void play(movie.id)
                                        }}
                                    >
                                        <td>{movie.title}</td>
                                        <td>
                                            {movie.actors.length > 0 ? (
                                                <div className="movie-actors">
                                                    {movie.actors.map((actor) => (
                                                        <span key={actor.id} className="actor-badge">
                              {actor.name}
                            </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="muted">—</span>
                                            )}
                                        </td>
                                        <td>
                                            {movie.tags.length > 0 ? (
                                                <div className="movie-tags">
                                                    {movie.tags.map((tag) => (
                                                        <span key={tag.id} className="tag-badge">
                              {tag.name}
                            </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="muted">—</span>
                                            )}
                                        </td>
                                        {/* <td className="filename">{movie.filename}</td> */}
                                        <td className="actions">
                                            <IconButton
                                                label={`Delete ${movie.title}`}
                                                variant="danger"
                                                onClick={() => void remove(movie.id)}
                                                disabled={true}
                                            >
                                                <TrashIcon/>
                                            </IconButton>
                                            <IconButton
                                                label={`Edit tags for ${movie.title}`}
                                                onClick={() => void openTagEditor(movie)}
                                            >
                                                <TagIcon/>
                                            </IconButton>
                                            <IconButton
                                                label={`Edit actors for ${movie.title}`}
                                                onClick={() => void openActorEditor(movie)}
                                            >
                                                <ActorIcon/>
                                            </IconButton>
                                            <IconButton
                                                label={movie.available ? `Play ${movie.title}` : `${movie.title} is unavailable`}
                                                onClick={() => void play(movie.id)}
                                                disabled={!movie.available}
                                            >
                                                <PlayIcon/>
                                            </IconButton>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                        </MovieTable>
                        <div className="pagination" aria-label="Movie list pagination">
                    <span className="muted">
                    Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visibleMovies.length)} of {visibleMovies.length}
            </span>
                            <div className="pagination-controls">
                                <label className="pagination-page-size">
                                    <span>Per page</span>
                                    <select
                                        value={pageSize}
                                        onChange={(event) => setPageSize(Number(event.target.value))}
                                    >
                                        {MOVIES_PER_PAGE_OPTIONS.map((size) => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                >
                                    Previous
                                </button>
                                <span className="movie-count">Page {currentPage} of {totalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => setPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Panel>

            <Panel>
                <div
                    className={`drop-zone${dragging ? ' drop-zone-active' : ''}`}
                    onDragEnter={(event) => {
                        event.preventDefault()
                        if (event.dataTransfer.types.includes('Files')) setDragging(true)
                    }}
                    onDragOver={(event) => {
                        event.preventDefault()
                        event.dataTransfer.dropEffect = 'copy'
                        if (!dragging) setDragging(true)
                    }}
                    onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                            setDragging(false)
                        }
                    }}
                    onDrop={(event) => handleDrop(event)}
                    aria-busy={importing}
                >
                    <strong>{importing ? 'Adding movies…' : 'Drop video files or folders here'}</strong>
                    <span>Folders are scanned recursively for supported video files.</span>
                </div>

                {importResult && (
                    <div className="import-result">
                        <span>{importResult.added.length} added</span>
                        {importResult.skipped.length > 0 && (
                            <span
                                title={importResult.skipped.map((item) => `${item.filename}: ${item.reason}`).join('\n')}>
                {importResult.skipped.length} skipped
              </span>
                        )}
                    </div>
                )}
            </Panel>

            {tagEditorMovie && (
                <Dialog
                    labelledBy="tag-editor-title"
                    onClose={closeTagEditor}
                    closeDisabled={savingTags || creatingTag}
                >
                    <DialogHeader
                        titleId="tag-editor-title"
                        title="Edit tags"
                        subtitle={tagEditorMovie.title}
                        onClose={closeTagEditor}
                        closeDisabled={savingTags || creatingTag}
                    />

                    <form className="tag-create-form" onSubmit={submitTag}>
                        <input
                            value={newTagName}
                            onChange={(event) => setNewTagName(event.target.value)}
                            placeholder="Create a new tag…"
                            aria-label="New tag name"
                            disabled={creatingTag}
                        />
                        <button
                            className="primary"
                            type="submit"
                            disabled={creatingTag || newTagName.trim().length === 0}
                        >
                            {creatingTag ? 'Creating…' : 'Create tag'}
                        </button>
                    </form>

                    {tagEditorError && <div className="error-box tag-editor-error">{tagEditorError}</div>}

                    <div className="tag-editor-list" aria-label="Movie tags">
                        {loadingTags ? (
                            <span className="muted">Loading tags…</span>
                        ) : allTags.length === 0 ? (
                            <span className="muted">No tags yet. Create the first one above.</span>
                        ) : (
                            allTags.map((tag) => {
                                const selected = editedTagIds.includes(tag.id)
                                return (
                                    <button
                                        key={tag.id}
                                        className={`tag-editor-tag${selected ? ' tag-editor-tag--selected' : ''}`}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => toggleEditedTag(tag.id)}
                                    >
                                        {tag.name}
                                    </button>
                                )
                            })
                        )}
                    </div>

                    <DialogFooter>
                        <SelectionCount elementNameSingular={'tag'} count={editedTagIds.length}/>
                        <DialogActions>
                            <button
                                className="primary"
                                type="button"
                                onClick={() => void saveTags()}
                                disabled={loadingTags || savingTags || creatingTag}
                            >
                                {savingTags ? 'Saving…' : 'Save tags'}
                            </button>
                        </DialogActions>
                    </DialogFooter>
                </Dialog>
            )}

            {actorEditorMovie && (
                <Dialog
                    labelledBy="actor-editor-title"
                    onClose={closeActorEditor}
                    closeDisabled={savingActors || creatingActor}
                >
                    <DialogHeader
                        titleId="actor-editor-title"
                        title="Edit actors"
                        subtitle={actorEditorMovie.title}
                        onClose={closeActorEditor}
                        closeDisabled={savingActors || creatingActor}
                    />

                    <form className="actor-create-form" onSubmit={submitActor}>
                        <input
                            value={newActorName}
                            onChange={(event) => setNewActorName(event.target.value)}
                            placeholder="Create a new actor…"
                            aria-label="New actor name"
                            disabled={creatingActor}
                        />
                        <button
                            className="primary"
                            type="submit"
                            disabled={creatingActor || newActorName.trim().length === 0}
                        >
                            {creatingActor ? 'Creating…' : 'Create actor'}
                        </button>
                    </form>

                    {actorEditorError && (
                        <div className="error-box actor-editor-error">{actorEditorError}</div>
                    )}

                    <div className="actor-editor-list" aria-label="Movie actors">
                        {loadingActors ? (
                            <span className="muted">Loading actors…</span>
                        ) : allActors.length === 0 ? (
                            <span className="muted">No actors yet. Create the first one above.</span>
                        ) : (
                            allActors.map((actor) => {
                                const selected = editedActorIds.includes(actor.id)
                                return (
                                    <button
                                        key={actor.id}
                                        className={`actor-editor-actor${selected ? ' actor-editor-actor--selected' : ''}`}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => toggleEditedActor(actor.id)}
                                    >
                                        {actor.name}
                                    </button>
                                )
                            })
                        )}
                    </div>

                    <DialogFooter>
                        <SelectionCount elementNameSingular={'actor'} count={editedActorIds.length}/>
                        <DialogActions>
                            <button
                                className="primary"
                                type="button"
                                onClick={() => void saveActors()}
                                disabled={loadingActors || savingActors || creatingActor}
                            >
                                {savingTags ? 'Saving…' : 'Save actors'}
                            </button>
                        </DialogActions>
                    </DialogFooter>
                </Dialog>
            )}

        </main>
    )
}
