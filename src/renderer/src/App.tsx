import {
    DragEvent,
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react'
import type {
    ActorSummary,
    MovieCreateInput,
    MovieImportResult,
    MovieSummary,
    TagSummary
} from '@shared/movies'
import {IconButton} from "@renderer/components/IconButton";
import {TrashIcon} from "@renderer/components/icons/TrashIcon";
import {PlayIcon} from "@renderer/components/icons/PlayIcon";
import {TagIcon} from "@renderer/components/icons/TagIcon";
import {Panel} from "@renderer/components/Panel";
import {ActorIcon} from "@renderer/components/icons/ActorIcon";
import {Dialog, DialogActions, DialogFooter, DialogHeader} from "@renderer/components/Dialog";

const emptyForm: MovieCreateInput = {
    title: '',
    filepath: '',
    releaseDate: '',
    publisherName: ''
}

export default function App(): React.JSX.Element {
    const [movies, setMovies] = useState<MovieSummary[]>([])
    const [excludedTagIds, setExcludedTagIds] = useState<number[]>([])
    const [includedTagId, setIncludedTagId] = useState<number | null>(null)
    const [selectedActorIds, setSelectedActorIds] = useState<number[]>([])
    const [form, setForm] = useState<MovieCreateInput>(emptyForm)
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [importResult, setImportResult] = useState<MovieImportResult | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [tagEditorMovie, setTagEditorMovie] = useState<MovieSummary | null>(null)
    const [allTags, setAllTags] = useState<TagSummary[]>([])
    const [editedTagIds, setEditedTagIds] = useState<number[]>([])
    const [newTagName, setNewTagName] = useState('')
    const [loadingTags, setLoadingTags] = useState(false)
    const [savingTags, setSavingTags] = useState(false)
    const [creatingTag, setCreatingTag] = useState(false)
    const [tagEditorError, setTagEditorError] = useState<string | null>(null)

    const [actorEditorMovie, setActorEditorMovie] = useState<MovieSummary | null>(null)
    const [allActors, setAllActors] = useState<ActorSummary[]>([])
    const [editedActorIds, setEditedActorIds] = useState<number[]>([])
    const [newActorName, setNewActorName] = useState('')
    const [loadingActors, setLoadingActors] = useState(false)
    const [savingActors, setSavingActors] = useState(false)
    const [creatingActor, setCreatingActor] = useState(false)
    const [actorEditorError, setActorEditorError] = useState<string | null>(null)

    const tagFilteredMovies = useMemo(() => {
        if (includedTagId !== null) {
            return movies.filter((movie) =>
                movie.tags.some((tag) => tag.id === includedTagId)
            )
        }

        if (excludedTagIds.length === 0) return movies

        const excluded = new Set(excludedTagIds)
        return movies.filter(
            (movie) => !movie.tags.some((tag) => excluded.has(tag.id))
        )
    }, [movies, excludedTagIds, includedTagId])

    const visibleMovies = useMemo(() => {
        if (selectedActorIds.length === 0) return tagFilteredMovies

        const selected = new Set(selectedActorIds)

        return tagFilteredMovies.filter((movie) =>
            movie.actors.some((actor) => selected.has(actor.id))
        )
    }, [tagFilteredMovies, selectedActorIds])

    const playableVisibleMovies = useMemo(
        () => visibleMovies.filter((movie) => movie.available),
        [visibleMovies]
    )

    const includedTag = useMemo(() => {
        if (includedTagId === null) return null
        return collectTags(movies).get(includedTagId) ?? null
    }, [movies, includedTagId])

    const excludedTags = useMemo(() => {
        const tagsById = collectTags(movies)

        return excludedTagIds
            .map((tagId) => tagsById.get(tagId))
            .filter((tag): tag is TagSummary => tag !== undefined)
    }, [movies, excludedTagIds])

    const availableTags = useMemo(() => {
        const excluded = new Set(excludedTagIds)

        return [...collectTags(movies).values()]
            .filter((tag) => tag.id !== includedTagId && !excluded.has(tag.id))
            .sort(compareTags)
    }, [movies, excludedTagIds, includedTagId])

    const selectedActors = useMemo(() => {
        const actorsById = collectActors(movies)

        return selectedActorIds
            .map((actorId) => actorsById.get(actorId))
            .filter((actor): actor is ActorSummary => actor !== undefined)
    }, [movies, selectedActorIds])

    const availableActors = useMemo(() => {
        const selected = new Set(selectedActorIds)

        return [...collectActors(tagFilteredMovies).values()]
            .filter((actor) => !selected.has(actor.id))
            .sort(compareActors)
    }, [visibleMovies, selectedActorIds])

    const reload = useCallback(async () => {
        setLoading(true)
        try {
            const nextMovies = await window.movieLibrary.listMovies()
            const knownTagIds = new Set(
                nextMovies.flatMap((movie) => movie.tags.map((tag) => tag.id))
            )
            const knownActorIds = new Set(
                nextMovies.flatMap((movie) => movie.actors.map((actor) => actor.id))
            )

            setMovies(nextMovies)
            setExcludedTagIds((current) => current.filter((tagId) => knownTagIds.has(tagId)))
            setIncludedTagId((current) =>
                current !== null && knownTagIds.has(current) ? current : null
            )
            setSelectedActorIds((current) =>
                current.filter((actorId) => knownActorIds.has(actorId))
            )
            setError(null)
        } catch (err) {
            setError(toMessage(err))
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        void reload()
    }, [reload])

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

    async function chooseFile(): Promise<void> {
        const picked = await window.movieLibrary.pickMovieFile()
        if (!picked) return

        setForm((current) => ({
            ...current,
            filepath: picked.filepath,
            title: current.title || picked.suggestedTitle
        }))
    }

    async function importDroppedFiles(event: DragEvent<HTMLDivElement>): Promise<void> {
        event.preventDefault()
        event.stopPropagation()
        setDragging(false)

        const files = Array.from(event.dataTransfer.files)
        if (files.length === 0) {
            console.log('files.length === 0)')
            return
        }

        setImporting(true)
        setImportResult(null)
        setError(null)

        try {
            const result = await window.movieLibrary.importDroppedFiles(files)
            setImportResult(result)
            await reload()
        } catch (err) {
            setError(toMessage(err))
        } finally {
            setImporting(false)
        }
    }

    async function playVisibleMovies(): Promise<void> {
        if (playableVisibleMovies.length === 0) return

        try {
            await window.movieLibrary.playMovies(playableVisibleMovies.map((movie) => movie.id))
            setError(null)
        } catch (err) {
            setError(toMessage(err))
        }
    }

    async function remove(id: number): Promise<void> {
        try {
            await window.movieLibrary.deleteMovie(id)
            await reload()
        } catch (err) {
            setError(toMessage(err))
        }
    }

    async function play(id: number): Promise<void> {
        try {
            await window.movieLibrary.playMovie(id)
            setError(null)
        } catch (err) {
            setError(toMessage(err))
        }
    }

    async function openTagEditor(movie: MovieSummary): Promise<void> {
        setTagEditorMovie(movie)
        setEditedTagIds(movie.tags.map((tag) => tag.id))
        setNewTagName('')
        setLoadingTags(true)
        setTagEditorError(null)
        setError(null)

        try {
            setAllTags(await window.movieLibrary.listTags())
        } catch (err) {
            setTagEditorMovie(null)
            setError(toMessage(err))
        } finally {
            setLoadingTags(false)
        }
    }

    function closeTagEditor(): void {
        if (savingTags || creatingTag) return
        setTagEditorMovie(null)
        setAllTags([])
        setEditedTagIds([])
        setNewTagName('')
        setTagEditorError(null)
    }

    function toggleEditedTag(tagId: number): void {
        setEditedTagIds((current) =>
            current.includes(tagId)
                ? current.filter((id) => id !== tagId)
                : [...current, tagId]
        )
    }

    async function createTag(event: FormEvent): Promise<void> {
        event.preventDefault()
        const name = newTagName.trim()
        if (!name) return

        setCreatingTag(true)
        setTagEditorError(null)

        try {
            const tag = await window.movieLibrary.createTag(name)
            setAllTags((current) =>
                [...current.filter((item) => item.id !== tag.id), tag].sort(compareTags)
            )
            setEditedTagIds((current) =>
                current.includes(tag.id) ? current : [...current, tag.id]
            )
            setNewTagName('')
            setTagEditorError(null)
        } catch (err) {
            setTagEditorError(toMessage(err))
        } finally {
            setCreatingTag(false)
        }
    }

    async function saveTags(): Promise<void> {
        if (!tagEditorMovie) return

        setSavingTags(true)
        setTagEditorError(null)

        try {
            const updated = await window.movieLibrary.updateMovieTags(
                tagEditorMovie.id,
                editedTagIds
            )
            const nextMovies = movies.map((movie) =>
                movie.id === updated.id ? updated : movie
            )
            const knownTagIds = new Set(
                nextMovies.flatMap((movie) => movie.tags.map((tag) => tag.id))
            )
            const knownActorIds = new Set(
                nextMovies.flatMap((movie) => movie.actors.map((actor) => actor.id))
            )

            setMovies(nextMovies)
            setExcludedTagIds((current) => current.filter((tagId) => knownTagIds.has(tagId)))
            setIncludedTagId((current) =>
                current !== null && knownTagIds.has(current) ? current : null
            )
            setSelectedActorIds((current) =>
                current.filter((actorId) => knownActorIds.has(actorId))
            )
            setTagEditorMovie(null)
            setAllTags([])
            setEditedTagIds([])
            setNewTagName('')
        } catch (err) {
            setTagEditorError(toMessage(err))
        } finally {
            setSavingTags(false)
        }
    }

    async function openActorEditor(movie: MovieSummary): Promise<void> {
        setActorEditorMovie(movie)
        setEditedActorIds(movie.actors.map((actor) => actor.id))
        setNewActorName('')
        setLoadingActors(true)
        setActorEditorError(null)
        setError(null)

        try {
            setAllActors(await window.movieLibrary.listActors())
        } catch (err) {
            setActorEditorMovie(null)
            setError(toMessage(err))
        } finally {
            setLoadingActors(false)
        }
    }

    function closeActorEditor(): void {
        if (savingActors || creatingActor) return
        setActorEditorMovie(null)
        setAllActors([])
        setEditedActorIds([])
        setNewActorName('')
        setActorEditorError(null)
    }

    function toggleEditedActor(actorId: number): void {
        setEditedActorIds((current) =>
            current.includes(actorId)
                ? current.filter((id) => id !== actorId)
                : [...current, actorId]
        )
    }

    async function createActor(event: FormEvent): Promise<void> {
        event.preventDefault()
        const name = newActorName.trim()
        if (!name) return

        setCreatingActor(true)
        setActorEditorError(null)

        try {
            const actor = await window.movieLibrary.createActor(name)
            setAllActors((current) =>
                [...current.filter((item) => item.id !== actor.id), actor].sort(compareActors)
            )
            setEditedActorIds((current) =>
                current.includes(actor.id) ? current : [...current, actor.id]
            )
            setNewActorName('')
        } catch (err) {
            setActorEditorError(toMessage(err))
        } finally {
            setCreatingActor(false)
        }
    }

    async function saveActors(): Promise<void> {
        if (!actorEditorMovie) return

        setSavingActors(true)
        setActorEditorError(null)

        try {
            const updated = await window.movieLibrary.updateMovieActors(
                actorEditorMovie.id,
                editedActorIds
            )
            const nextMovies = movies.map((movie) =>
                movie.id === updated.id ? updated : movie
            )
            const knownActorIds = new Set(
                nextMovies.flatMap((movie) => movie.actors.map((actor) => actor.id))
            )

            setMovies(nextMovies)
            setSelectedActorIds((current) =>
                current.filter((actorId) => knownActorIds.has(actorId))
            )
            setActorEditorMovie(null)
            setAllActors([])
            setEditedActorIds([])
            setNewActorName('')
        } catch (err) {
            setActorEditorError(toMessage(err))
        } finally {
            setSavingActors(false)
        }
    }

    function selectActor(actorId: number): void {
        setSelectedActorIds((current) =>
            current.includes(actorId) ? current : [...current, actorId]
        )
    }

    function removeActorFilter(actorId: number): void {
        setSelectedActorIds((current) => current.filter((id) => id !== actorId))
    }

    function excludeTag(tagId: number): void {
        setIncludedTagId(null)
        setExcludedTagIds((current) =>
            current.includes(tagId) ? current : [...current, tagId]
        )
    }

    function includeOnlyTag(tagId: number): void {
        setExcludedTagIds([])
        setIncludedTagId(tagId)
    }

    function removeTagExclusion(tagId: number): void {
        setExcludedTagIds((current) => current.filter((id) => id !== tagId))
    }

    function clearTagInclusion(): void {
        setIncludedTagId(null)
    }

    return (
        <main className="app-shell">

            {error && <div className="error-box">{error}</div>}

            <Panel>
                <div className="section-header">
                    <h2>Library</h2>
                    <div className="library-status">
                        <div className="movie-count">
                            {excludedTagIds.length > 0
                                ? `${visibleMovies.length} of ${movies.length} movies`
                                : `${movies.length} movie${movies.length === 1 ? '' : 's'}`}
                        </div>
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
                ) : visibleMovies.length === 0 ? (
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
                    <div className="table-wrap">
                        <table>
                            <thead>
                            <tr>
                                <th>Release</th>
                                <th>Publisher</th>
                                <th>Title</th>
                                <th>Actors</th>
                                <th>Tags</th>
                                <th>Filename</th>
                                <th aria-label="Actions"/>
                            </tr>
                            </thead>
                            <tbody>
                            {visibleMovies.map((movie) => (
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
                                    <td>{movie.releaseDate}</td>
                                    <td>{movie.publisherName}</td>
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
                                    <td className="filename">{movie.filename}</td>
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
                        </table>
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
                    onDrop={(event) => void importDroppedFiles(event)}
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

                    <form className="tag-create-form" onSubmit={(event) => void createTag(event)}>
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
            <span className="muted">
              {editedTagIds.length} tag{editedTagIds.length === 1 ? '' : 's'} selected
            </span>
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

                    <form className="actor-create-form" onSubmit={(event) => void createActor(event)}>
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
            <span className="muted">
              {editedTagIds.length} tag{editedTagIds.length === 1 ? '' : 's'} selected
            </span>
                        <DialogActions>
                            <button
                                className="primary"
                                type="button"
                                onClick={() => void closeActorEditor()}
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
