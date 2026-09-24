import {
    selectAvailableActors,
    selectSelectedActors,
    selectVisibleMovies,
    useMovieLibraryStore
} from "@renderer/store";
import {useShallow} from "zustand/react/shallow";

export const ActorFilter = () => {

    const loading = useMovieLibraryStore((state) => state.loading)
    const removeActorFilter = useMovieLibraryStore((state) => state.removeActorFilter)
    const selectActor = useMovieLibraryStore((state) => state.selectActor)

    const movies = useMovieLibraryStore(useShallow(selectVisibleMovies))
    const selectedActors = useMovieLibraryStore(useShallow(selectSelectedActors))
    const availableActors = useMovieLibraryStore(useShallow(selectAvailableActors))

    return (
        <>
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
        </>
    );
}