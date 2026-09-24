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
    selectAvailableActors,
    selectAvailableTags,
    selectExcludedTags,
    selectIncludedTag, selectPaginatedMovies,
    selectPlayableVisibleMovies,
    selectSelectedActors, selectTotalPages,
    selectVisibleMovies,
    useMovieLibraryStore,
} from './stores/movieLibraryStore'
import {useShallow} from "zustand/react/shallow";
import {SelectionCount} from "@renderer/components/SelectionCount";
import {TableHeader} from "@renderer/components/TableHeader";
import {MovieTable} from "@renderer/components/MovieTable";
import {TableColumn} from "@renderer/components/TableColumn";

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
        playVisibleMovies,
        deleteMovie: remove,
        excludeTag,
        includeOnlyTag,
        removeTagExclusion,
        clearTagInclusion,
        selectActor,
        removeActorFilter,
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
    const playableVisibleMovies = useMovieLibraryStore(useShallow(selectPlayableVisibleMovies))
    const totalPages = useMovieLibraryStore(selectTotalPages)
    const includedTag = useMovieLibraryStore(selectIncludedTag)
    const excludedTags = useMovieLibraryStore(useShallow(selectExcludedTags))
    const availableTags = useMovieLibraryStore(useShallow(selectAvailableTags))
    const selectedActors = useMovieLibraryStore(useShallow(selectSelectedActors))
    const availableActors = useMovieLibraryStore(useShallow(selectAvailableActors))

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
                <div className="section-header">
                    <h2>Library</h2>
                    <div className="library-status">
                        <IconButton
                            label={`Play ${playableVisibleMovies.length} available movie${playableVisibleMovies.length === 1 ? '' : 's'}`}
                            onClick={() => void playVisibleMovies()}
                            disabled={playableVisibleMovies.length === 0}
                        >
                            <PlayIcon/>
                        </IconButton>
                    </div>
                </div>

                {!loading && movies.length > 0 && (
                    <div className="tag-filter-panel" aria-label="Tag filters">
            <span className="muted tag-filter-hint">
              Click a tag to exclude it · Shift+click to show only that tag
            </span>

                        {includedTag && (
                            <div className="included-tag-filter">
                                <span className="tag-filter-label">Only</span>
                                <button
                                    className="tag-filter-button tag-filter-button--included"
                                    type="button"
                                    onClick={clearTagInclusion}
                                    title={`Show all movies instead of only ${includedTag.name}`}
                                >
                                    {includedTag.name}
                                    <span aria-hidden="true">×</span>
                                </button>
                            </div>
                        )}

                        {excludedTags.length > 0 && (
                            <div className="excluded-tag-filters">
                                <span className="tag-filter-label">Excluded</span>
                                <div className="tag-filter-list">
                                    {excludedTags.map((tag) => (
                                        <button
                                            key={tag.id}
                                            className="tag-filter-button tag-filter-button--excluded"
                                            type="button"
                                            onClick={() => removeTagExclusion(tag.id)}
                                            title={`Include ${tag.name} again`}
                                        >
                                            {tag.name}
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableTags.length > 0 ? (
                            <div className="tag-filter-list tag-filter-list--available">
                                {availableTags.map((tag) => (
                                    <button
                                        key={tag.id}
                                        className="tag-filter-button"
                                        type="button"
                                        onClick={(event) =>
                                            event.shiftKey ? includeOnlyTag(tag.id) : excludeTag(tag.id)
                                        }
                                        title={`Exclude ${tag.name}; Shift+click to show only ${tag.name}`}
                                    >
                                        {tag.name}
                                    </button>
                                ))}
                            </div>
                        ) : excludedTags.length === 0 && includedTag === null ? (
                            <span className="muted tag-filter-empty">No tags in the current library.</span>
                        ) : null}
                    </div>
                )}

                {!loading && movies.length > 0 && (
                    <div className="actor-filter-panel" aria-label="Actor filters">
            <span className="muted actor-filter-hint">
              Actors · select one or more to require all selected actors
            </span>

                        {selectedActors.length > 0 && (
                            <div className="selected-actor-filters">
                                <span className="actor-filter-label">Selected</span>
                                <div className="actor-filter-list">
                                    {selectedActors.map((actor) => (
                                        <button
                                            key={actor.id}
                                            className="actor-filter-button actor-filter-button--selected"
                                            type="button"
                                            onClick={() => removeActorFilter(actor.id)}
                                            title={`Remove ${actor.name} from actor filter`}
                                        >
                                            {actor.name}
                                            <span aria-hidden="true">×</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {availableActors.length > 0 ? (
                            <div className="actor-filter-list actor-filter-list--available">
                                {availableActors.map((actor) => (
                                    <button
                                        key={actor.id}
                                        className="actor-filter-button"
                                        type="button"
                                        onClick={() => selectActor(actor.id)}
                                        title={`Show movies containing ${actor.name}`}
                                    >
                                        {actor.name}
                                    </button>
                                ))}
                            </div>
                        ) : selectedActors.length === 0 ? (
                            <span className="muted actor-filter-empty">No actors in the current library view.</span>
                        ) : null}
                    </div>
                )}

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
                                    <TableColumn name={'Filepath'} />
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
                                        <td>{movie.filepath}</td>
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
                {/*<h2>Add movies</h2>*/}
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
