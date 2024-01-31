import { GoogleGenerativeAI } from "@google/generative-ai"
import { Icon } from '@iconify/react';
import React, { useEffect, useRef, useState } from 'react'

import { getEveryAlbum, isValidPlaylistLink, extractPlaylistId, getAllTracks } from '../../../lib/utils';
import { getAllTracksInAPlaylist, createPlayList, addTracksToPlayList } from '../../../lib/spotify';

import Loading from '../Loading';
import { useTheme } from "../../context/themeContext";
import { useAuth } from "../../context/authContext";


const API_KEY = import.meta.env.VITE_API_KEY
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const DiscoverNewSongs = () => {
  const [isLoading, setIsLoading] = useState({
    state: false,
    message: null
  })
  const [playListData, setPlayListData] = useState({
    link: '',
    name: ''
  })

  const [type, setType] = useState('artist')
  const [artistArray, setArtistArray] = useState([]);


  const [buttonClick, setButtonClicked] = useState(false)
  const [errorMessages, setErrorMessages] = useState({
    notCorrectSpotifyLink: null,
    notCorrectFormatForArtist: null,
    error: null
  })
  const [isDifferentTypesOfArtists, setIsDifferentTypesOfArtists] = useState(false)
  const [isNotPopularArtists, setIsNotPopularArtists] = useState(false)

  const spotifyPlaylist = useRef(null)
  const artistName = useRef(null)

  const { isDarkMode } = useTheme()
  const { isLoggedIn, toggleLoginStatus } = useAuth();

  useEffect(() => {
    const disabled = isLoading.state;
    type === 'playlist' && (spotifyPlaylist.current.disabled = disabled);
    type === 'artist' || artistName && (artistName.current.disabled = disabled);
  }, [isLoading.state]);

  const getSimilarArtists = async (artists) => {
    if (buttonClick === true) {
      setIsLoading({ state: false, message: null })
      return
    }
    setButtonClicked(true)

    try {
      const type = isDifferentTypesOfArtists ? 'completely different from' : 'similar to';
      const popularity = isNotPopularArtists ? 'not popular' : 'popular';
      const prompt = `Give me 20 musicians who are ${popularity} and ${type} the following artists provided: ${artists.join(', ')}. Be sure none of the musicians listed overlap with those provided and that the result is not in list form and not more than 20 musicians. The results should also be separated by a comma.`;


      // const newPrompt = `Please analyze the following list of musicians: '${artists.join(', ')}', and identify the sub-genre that is associated with 70 - 90% of them. Based on this analysis, please provide a list of 20 musicians who are ${popularity} and are ${type} as the sub-genres. Please ensure that the resulting list does not include any of the musicians from the original list provided. To help narrow down the results, please only provide the list of recommended musicians separated by commas.`

      setIsLoading((prevState) => ({ ...prevState, message: `Getting the list of new artists` }));
      const result = await model.generateContent(prompt); ``
      const response = await result.response;
      const text = response.text()

      const artistList = text.replace(/:\n/g, "").trimStart().split(':').at(-1).split(', ');

      (artistList.length > 20) ? (artistList.length = 20) : null

      setIsLoading((prevState) => ({ ...prevState, message: `Getting the albums of each artist` }));
      const albums = await getEveryAlbum(artistList);

      setIsLoading((prevState) => ({ ...prevState, message: 'Getting All Tracks' }));
      const tracks = await getAllTracks(albums, 1);

      setIsLoading((prevState) => ({ ...prevState, message: 'Creating The PlayList' }));
      const { id, link, name } = await Promise.resolve(createPlayList(artistList.slice(0, -1).join(', ') + ' and ' + artistList.slice(-1), 'new'));
      const playListID = id.substring("spotify:playlist:".length);

      setIsLoading((prevState) => ({ ...prevState, message: 'Adding The Tracks To The Playlist' }));
      addTracksToPlayList(tracks, playListID)
        .then(() => setPlayListData({ link, name }))
        .catch(err => {
          return err;
        });

      setIsLoading((prevState) => ({ ...prevState, message: 'Done' }));
    } catch (err) {
      setErrorMessages((prevState) => ({ ...prevState, error: 'Error occured while generating a playlist, try to Login again. If the Problem Persits, try contacting the developer using any of the last two links in the footer' }));
      return err;
    } finally {
      setIsLoading({ state: false, message: null })
      timeSignOut();
    }
  };


  async function handleIfItsAPlaylistLink(link) {
    if (!isValidPlaylistLink(link)) {
      setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: true });
      setIsLoading((prevState) => ({ ...prevState, state: false }));
      return;
    }

    setErrorMessages((prevState) => ({ ...prevState, notCorrectSpotifyLink: false }));

    try {
      setIsLoading((prevState) => ({ ...prevState, message: `Extracting Playlist Link` }));
      const playlistId = extractPlaylistId(link);

      setIsLoading((prevState) => ({ ...prevState, message: `Getting All Tracks In The Playlist` }));
      const playlistTracks = await getAllTracksInAPlaylist(playlistId);

      setIsLoading((prevState) => ({ ...prevState, message: `Getting all Artist's In The Playlist` }));
      const trackArtists = playlistTracks.flat().map(item => item.track.artists.slice(0, 2))
      const artistNames = trackArtists.flat().map(item => item.name);
      const uniqueArtistNames = [...new Set(artistNames)];

      getSimilarArtists(uniqueArtistNames);
    } catch (err) {
      setIsLoading((prevState) => ({ ...prevState, state: false }));
      setErrorMessages((prevState) => ({ ...prevState, error: 'Error occured while generating a playlist, try to Login again. If the Problem Persits, try contacting the developer using any of the last two links in the footer' }));
      timeSignOut();
    }
  }


  function timeSignOut() {
    setTimeout(() => {
      toggleLoginStatus()
    }, 60000)
  }


  const onInputFocus = (e) => {
    e.target.name === 'artistName' || spotifyPlaylist && (spotifyPlaylist.current.value = '')
    e.target.name === 'spotifyPlaylist' && (artistName.current.value = '')
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

  const handleSubmit = () => {
    if (type === 'artist') {
      setIsLoading((prevState) => ({ ...prevState, state: true }));

      artistArray && artistArray.length > 1 && getSimilarArtists(artistArray);
    } else if (type === 'playlist') {
      setIsLoading((prevState) => ({ ...prevState, state: true }));

      const link = spotifyPlaylist.current.value
      handleIfItsAPlaylistLink(link)
    }
  }

  const handleArtistDelete = (e, index) => {
    const artists = [...artistArray]
    artists.splice(index, 1);

    setArtistArray(artists)
  }

  return (
    <div className={`w-3/5 border-2 border-brand rounded flex flex-col justify-center gap-6 py-14 px-10 items-center max-w-[800px] min-w-[300px] relative ${isDarkMode ? 'text-lightest' : 'text-darkest'}`}>
      <div className={`w-5/12 max-w-[400px] flex items-center rounded p-1 bg-lightest`}>
        <p
          onClick={() => setType('artist')}
          className={`${type === 'artist' ? 'bg-brand text-lightest' : 'text-darkest'} w-1/2 text-center text-fsm py-1 rounded-l cursor-pointer`}>Artist</p>
        <p
          onClick={() => setType('playlist')}
          className={`${type === 'playlist' ? 'bg-brand text-lightest' : 'text-darkest'} w-1/2 text-center text-fsm py-1 rounded-r cursor-pointer`}
        >Playlist</p>
      </div>
      <div className={`w-full flex flex-col items-center`}>
        <span className={`flex flex-col gap-5`}>
          <div className={``}>
            {type === 'artist' && <>
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
                    onFocus={onInputFocus}
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
              {errorMessages.notCorrectFormatForArtist === true && <p className='text-fsm text-red-500'>Seems like you either just gave a single artist</p>}
            </>
            }
            {
              type === 'playlist' && <>
                <label htmlFor="spotifyPlaylist" className={`flex flex-col w-full`}>
                  <span className={`w-fit`}>
                    <h2 className={`text-fmd md:text-fsm`}>Enter a Spotify Playlist Link</h2>
                    <h3
                      className={`${isDarkMode ? 'text-gray' : 'text-dark'} text-fsm md:text-fxs`}>
                      e.g https://open.spotify.com/playlist/1B2CSnhZXXVC6xQcY3R4Fk
                    </h3>
                    <input
                      type="text"
                      name="spotifyPlaylist"
                      className='h-8 rounded p-2 outline-none border-2 focus:border-brand w-full text-darkest'
                      onFocus={onInputFocus}
                      ref={spotifyPlaylist}
                      aria-label="spotifyPlaylist" />
                  </span>
                </label>
                {errorMessages.notCorrectSpotifyLink === true && <p className='text-fsm text-red-500'>Not a correct spotify link</p>}
              </>
            }
          </div>
          <div className={`flex flex-col gap-2`}>
            <h3 className={`text-fmd md:text-fsm text-gray`}>Options</h3>

            <div className={`flex items-center pl-4`}>
              <label
                htmlFor="nonPopular"
                className="cursor-pointer select-none text-sm font-medium flex items-center gap-2">
                <input
                  type="checkbox"
                  name="nonPopular"
                  onChange={(e) => setIsNotPopularArtists(e.target.value)}
                  className="form-checkbox w-4 h-4 text-brand rounded" />

                <span>Get non-popular artists</span></label>
            </div>
            <div className="flex items-center pl-4">
              <label
                htmlFor="differentGenre"
                className="cursor-pointer select-none text-sm font-medium flex items-center gap-2">
                <input
                  type="checkbox"
                  name="differentGenre"
                  onChange={(e) => setIsDifferentTypesOfArtists(e.target.value)}
                  className="form-checkbox w-4 h-4 text-brand rounded" />
                <span>Get a different genre</span>
              </label>
            </div>
          </div>

          {isLoading.state ? <Loading loadingMessage={isLoading.message} /> :
            !buttonClick && <button
              className={`bg-brand text-lightest rounded p-3`}
              onClick={handleSubmit}>Generate Playlist</button>
          }
        </span>
      </div>
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

export default DiscoverNewSongs



