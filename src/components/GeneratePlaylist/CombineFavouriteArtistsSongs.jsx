import { useRef, useState } from 'react'
import Loading from '../Loading'
import UserInput from './CombineFavouriteArtistsSongs/UserInput'
import { getAllTracks, getEveryAlbum } from '../../../lib/utils'
import { addTracksToPlayList, getUserTopArtists, createPlayList } from '../../../lib/spotify'
import { useEffect } from 'react'
import DisplayResult from '../DisplayResult'

const CombineFavouriteArtistsSongs = ({ logOut }) => {
  const [isLoading, setIsLoading] = useState({
    state: false,
    message: null
  })
  const [playListData, setPlayListData] = useState({
    link: '',
    name: ''
  })
  // const [topArtists, setTopArtists] = useState([])
  const [buttonClick, setButtonClicked] = useState(false)
  const [errorMessages, setErrorMessages] = useState({
    notCorrectFormatForArtist: null,
    error: null
  })
  // const [inputUsed, setInputUsed] = useState('manual')
  // const artistButton = useRef(null)

  const artistName = useRef(null)

  // useEffect(() => {
  //   if (inputUsed !== 'auto') return

  //   if (topArtists.length != 0) {
  //     artistButton.current.disabled = false
  //   }
  // }, [topArtists])

  const combineSongs = async (artists) => {
    if (buttonClick === true) {
      setIsLoading({ state: false, message: null })
      return
    }
    setButtonClicked(true)

    // calculate the max album to get based on the number of artists
    const maxAlbums = Math.floor((100 / (artists.length * 2)));
    const maxTracksPerAlbum = Math.floor((100 / (artists.length * maxAlbums)));
    try {
      setIsLoading({ state: true, message: 'Getting the albums of each artist' })
      const albums = await getEveryAlbum(artists)
      console.log(albums.length)

      setIsLoading((prevState) => ({ ...prevState, message: 'Getting All Tracks' }));
      const tracks = await getAllTracks(albums, maxTracksPerAlbum)
      console.log(tracks.length)

      setIsLoading((prevState) => ({ ...prevState, message: 'Creating The PlayList' }));
      const { id, link, name } = await Promise.resolve(createPlayList(artists.slice(0, -1).join(', ') + ' and ' + artists.slice(-1), 'old'));
      const playListID = id.substring("spotify:playlist:".length);

      setIsLoading((prevState) => ({ ...prevState, message: 'Adding The Tracks To The Playlist' }));
      addTracksToPlayList(tracks, playListID)
        .then(data => setPlayListData({ link, name }))
        .catch(err => {
          return err;
        });
    } catch (err) {
      setErrorMessages((prevState) => ({ ...prevState, error: 'Error Occured While Generating A Playlist, Try To Login Again' }));
      return err
    } finally {
      setIsLoading({ state: false, message: null })
      timeSignOut();
    }
  }


  const handleButton = () => {
    const artists = artistName.current.value
    if (artists === '') {
      return
    }

    artists.trim()
    const artistsArugment = artists.split(',')
    console.log(artistsArugment)
    combineSongs(artistsArugment)
  }

  // const handleGetTopArtist = async () => {
  //   setInputUsed('auto')
  //   artistName.current.value = ''
  //   artistName.current.disabled = true
  //   artistButton.current.disabled = true

  //   try {
  //     const data = await getUserTopArtists()
  //     setTopArtists(data)
  //   } catch (err) {
  //     setErrorMessages((prevState) => ({ ...prevState, error: 'Error Occured While Getting Your Top Artists, Try To Login Again' }));
  //   }
  // }

  function timeSignOut() {
    setTimeout(() => {
      logOut()
    }, 60000)
  }

  return (
    <div className='p-4 flex flex-col gap-10 items-center justify-center'>
      <section className='flex flex-col items-center gap-5'>
        {/* <button className="border-brand border-2 rounded text-fsm md:min-w-[40vw] md:max-w-[50%] min-w-[300px] h-10" onClick={handleGetTopArtist}>Use your top artists on Spotify</button> */}
        <UserInput
          artistName={artistName}
        />
        {isLoading.state ? (
          // loading animation
          <Loading loadingMessage={isLoading.message} />
        ) :
          buttonClick
            ?
            null
            :
            <button
              onClick={handleButton}
              className={`bg-brand text-white text-fsm p-2 rounded`}
            >
              Combine Songs
            </button>
        }
      </section>
      <section>
        <DisplayResult
          isLoading={isLoading}
          playListData={playListData}
          buttonClick={buttonClick}
          errorMessages={errorMessages}
        />
      </section>

    </div>
  )
}

export default CombineFavouriteArtistsSongs