import {IconButton} from "@renderer/components/IconButton";
import {PlayIcon} from "@renderer/components/icons/PlayIcon";
import {selectPlayableVisibleMovies, useMovieLibraryStore} from "@renderer/store";
import {useShallow} from "zustand/react/shallow";

export const LibraryStatus = (): React.JSX.Element => {
    const playableVisibleMovies = useMovieLibraryStore(
        useShallow(selectPlayableVisibleMovies)
    )

    const playVisibleMovies = useMovieLibraryStore(
        (state) => state.playVisibleMovies
    )

    return (
        <div className="section-header">
            <h2>Library</h2>

            <div className="library-status">
                <IconButton
                    label={`Play ${playableVisibleMovies.length} available movie${
                        playableVisibleMovies.length === 1 ? '' : 's'
                    }`}
                    onClick={() => void playVisibleMovies()}
                    disabled={playableVisibleMovies.length === 0}
                >
                    <PlayIcon />
                </IconButton>
            </div>
        </div>
    )
}
