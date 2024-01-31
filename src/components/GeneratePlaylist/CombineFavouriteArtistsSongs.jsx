import { useRef, useState } from 'react'

import { Icon } from '@iconify/react';

import Loading from '../Loading'
import { getAllTracks, getEveryAlbum } from '../../../lib/utils'
import { addTracksToPlayList, createPlayList } from '../../../lib/spotify'

import { useTheme } from '../../context/themeContext'
import { useAuth } from '../../context/authContext';

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
  const [artistArray, setArtistArray] = useState([]);
  // const [inputUsed, setInputUsed] = useState('manual')
  // const artistButton = useRef(null)

  const artistName = useRef(null)

  const { isDarkMode } = useTheme()
  const { isLoggedIn, toggleLoginStatus } = useAuth();

  // useEffect(() => {
  //   if (inputUsed !== 'auto') return

  //   if (topArtists.length != 0) {
  //     artistButton.current.disabled = false
  //   }
  // }, [topArtists])

  const combineSongs = async (artists) => {
    console.log('here1')
    if (buttonClick === true) {
      setIsLoading({ state: false, message: null })
      return
    }
    console.log('here2')
    setButtonClicked(true)

    // calculate the max album to get based on the number of artists
    const maxAlbums = Math.floor((100 / (artists.length * 2)));
    const maxTracksPerAlbum = Math.floor((100 / (artists.length * maxAlbums)));

    console.log('here3')
    try {
      setIsLoading({ state: true, message: 'Getting the albums of each artist' })
      const albums = await getEveryAlbum(artists)
      console.log('here4')

      setIsLoading((prevState) => ({ ...prevState, message: 'Getting All Tracks' }));
      const tracks = await getAllTracks(albums, maxTracksPerAlbum)

      console.log('here5')
      setIsLoading((prevState) => ({ ...prevState, message: 'Creating The PlayList' }));
      const { id, link, name } = await Promise.resolve(createPlayList(artists.slice(0, -1).join(', ') + ' and ' + artists.slice(-1), 'old'));
      const playListID = id.substring("spotify:playlist:".length);

      console.log('here6')
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
    setIsLoading((prevState) => ({ ...prevState, state: true }))
    artistArray && artistArray.length > 1 && combineSongs(artistArray)
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
      toggleLoginStatus()
    }, 60000)
  }

  const handleKeyPress = (e) => {
    if (e.key === ',') {
      e.preventDefault();

      if (artistName.current.value.trim() !== '') {
        setArtistArray([...artistArray, artistName.current.value.trim()]);
        artistName.current.value = '';
      }
    }
  };

  const handleArtistDelete = (e, index) => {
    const artists = [...artistArray]
    artists.splice(index, 1);

    setArtistArray(artists)
  }

  return (
    <div className={`w-3/5 border-2 border-brand rounded flex flex-col justify-center gap-6 py-14 px-10 items-center max-w-[800px] min-w-[300px] relative ${isDarkMode ? 'text-lightest' : 'text-darkest'}`}>
      <section className='flex flex-col items-center gap-5'>
        {/* <button className="border-brand border-2 rounded text-fsm md:min-w-[40vw] md:max-w-[50%] min-w-[300px] h-10" onClick={handleGetTopArtist}>Use your top artists on Spotify</button> */}

        <label htmlFor="artistName" className={`flex flex-col w-full`}>
          <span className={`w-fit`}>
            <h2
              className={`text-fmd md:text-fsm`}>Enter the name of an artist you love</h2>
            <h3
              className={`${isDarkMode ? 'text-gray' : 'text-dark'} text-fsm md:text-fxs`}>Add artist name, and type a ',' at the end to include them in the list.</h3>
            <input
              type="text"
              name="artistName"
              className='h-8 rounded p-2 outline-none border-2 focus:border-brand w-full text-darkest'
              ref={artistName}
              onKeyDown={handleKeyPress}
              aria-label="artistName"
              autoComplete="off" />
            {
              artistArray.length !== 0 && <span className={`mt-2 flex items-center gap-2`}>
                {artistArray.map((value, index) => (
                  <div
                    key={index}
                    className={`bg-brand px-2 py-1 flex gap-2 w-fit items-center justify-center cursor-pointer rounded`}
                    onClick={(e) => handleArtistDelete(e, index)}
                  >
                    <span
                      className={`text-lightest text-fsm md:text-fxs`}>{value}</span>
                    <Icon
                      icon="iconoir:cancel"
                      className="text-lightest w-4 h-4" />
                  </div>))}
              </span>
            }
          </span>
        </label>
        {isLoading.state ? <Loading loadingMessage={isLoading.message} /> : !buttonClick && <button
          className={`bg-brand text-lightest rounded p-3`}
          onClick={handleButton}>Generate Playlist</button>
        }
      </section>
      {
        !isLoading.state &&
        <section className='w-5/12'>
          {(playListData.link.length !== 0 && playListData.name.length !== 0)
            ?
              <>
                <div className={`border-brand rounded border-2 px-4 py-3 flex flex-col gap-4`}>
                  <div className={`flex gap-1 ml-auto w-fit cursor-pointer`}>
                    <Icon icon="solar:copy-bold" className={`h-4 w-4`} />
                    <span className={`text-fxs md:text-f2xs`}>Copy Playlist Link</span>
                  </div>
                  <div className={`flex gap-1 items-center`}>
                    <Icon icon="logos:spotify-icon" width="30" height="30" />
                    <a href={playListData.link} target="_blank" rel='norefferer' className='flex flex-col'>
                      <span className={`text-fsm md:text-fxs`}>Open on Spotify</span>
                      <span className="underline text-brand whitespace-normal text-fxs md:text-f2xs -mt-1 text-ellipsis">Playlist generated by HearItFresh</span>
                    </a>
                  </div>
                </div>
              </>
            :
              <p className='text-fxs text-red-500'>{
                buttonClick && errorMessages.error !== null && errorMessages.error}</p>
            }
          </section>
      }

      {!isLoggedIn && <div className={`absolute w-full h-full flex items-center justify-center bg-gray bg-opacity-80`}>
        <p className={`text-flg md:text-fmd font-bold`}>Please login to connect your spotify and use this tool</p>
      </div>}
    </div>
  )
}

export default CombineFavouriteArtistsSongs