import { useState } from "react"
import DiscoverNewSongs from "./GeneratePlaylist/DiscoverNewSongs"
import CombineFavouriteArtistsSongs from "./GeneratePlaylist/CombineFavouriteArtistsSongs"

const GeneratePlaylist = ({ isConnected, logOut }) => {
  const [content, setContent] = useState(null)

  const contentToShow = () => {
    if (content === 'new') {
      return <DiscoverNewSongs logOut={logOut} />
    } else if (content === 'combine') {
      return <CombineFavouriteArtistsSongs logOut={logOut} />
    } else if (content === null) {
      return null
    }
  }

  const handleOnClick = (e) => {
    setContent(e.target.name)
  }

  return (
    <>
      {/* Option */}
      {
        content === null &&
        <div className="h-full flex flex-col my-6 justify-center items-center">
          <h2 className="font-semibold text-fmd">Select one of the two options below</h2>
          <div className="h-full flex gap-4 px-3 flex-wrap justify-center relative">
            <button onClick={handleOnClick} name="new" className={`sm:w-[30%] sm:max-w-[30%] w-[200px] min-w-[200px] h-3/6 max-h-[200px] border-brand border-2 rounded text-fsm p-2 ${!isConnected && 'opacity-20'}`} disabled={!isConnected}>Discover songs based on your favourite artists or Spotify playlist</button>
            <button onClick={handleOnClick} name="combine" className={`sm:w-[30%] sm:max-w-[30%] w-[200px] min-w-[200px] h-3/6 max-h-[200px] border-brand border-2 rounded text-fsm p-2 ${!isConnected && 'opacity-20'}`} disabled={!isConnected}>Make a playlist of your favorite artists' songs</button>
            {!isConnected && <p className="absolute top-1/4 left-2/4 transform -translate-x-2/4 -translate-y-2/4 whitespace-nowrap">Please Connect Your Spotify</p>}
          </div>
        </div>
      }

      {/* content */}
      {contentToShow()}

    </>
  )
}

export default GeneratePlaylist