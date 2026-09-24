import {useMovieLibraryStore} from '@renderer/store'

export const FilepathFilter = (): React.JSX.Element => {
    const filepathFilter = useMovieLibraryStore(
        (state) => state.filepathFilter
    )

    const setFilepathFilter = useMovieLibraryStore(
        (state) => state.setFilepathFilter
    )

    return (
        <div className="filepath-filter">
            <label htmlFor="filepath-filter">File path</label>

            <input
                id="filepath-filter"
                type="text"
                value={filepathFilter}
                onChange={(event) => setFilepathFilter(event.target.value)}
                placeholder="Filter by file path…"
                spellCheck={false}
            />

            {filepathFilter && (
                <button
                    type="button"
                    onClick={() => setFilepathFilter('')}
                >
                    Clear
                </button>
            )}
        </div>
    )
}
