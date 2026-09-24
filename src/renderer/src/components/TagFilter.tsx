import {
    selectAvailableTags,
    selectExcludedTags,
    selectIncludedTag,
    selectVisibleMovies,
    useMovieLibraryStore
} from "@renderer/store";
import {useShallow} from "zustand/react/shallow";

export const TagFilter = () => {

    const loading = useMovieLibraryStore((state) => state.loading)
    const clearTagInclusion = useMovieLibraryStore((state) => state.clearTagInclusion)
    const removeTagExclusion = useMovieLibraryStore((state) => state.removeTagExclusion)
    const includeOnlyTag = useMovieLibraryStore((state) => state.includeOnlyTag)
    const excludeTag = useMovieLibraryStore((state) => state.excludeTag)

    const movies = useMovieLibraryStore(useShallow(selectVisibleMovies))
    const includedTag = useMovieLibraryStore(useShallow(selectIncludedTag))
    const excludedTags = useMovieLibraryStore(useShallow(selectExcludedTags))
    const availableTags = useMovieLibraryStore(useShallow(selectAvailableTags))


    return (
        <>
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
        </>
    );
}