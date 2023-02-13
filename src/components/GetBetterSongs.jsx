import React, { useEffect, useRef, useState } from 'react'

import { Configuration, OpenAIApi } from 'openai'
import { Icon } from '@iconify/react';

import { getAllTracksInAPlaylist, createPlayList, addTracksToPlayList } from '../../lib/spotify';
import { getAllTracks, getEveryAlbum, copyToClipboard } from '../../lib/utils';

import Input from './Input';

const configuration = new Configuration({
  apiKey: import.meta.env.VITE_API_KEY
});

const openai = new OpenAIApi(configuration);

const GetBetterSongs = ({ isConnected, logOut }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [playListData, setPlayListData] = useState({
    link: '',
    name: ''
  })
  const [buttonClick, setButtonClicked] = useState(false)
  const [errorMessages, setErrorMessages] = useState({
    notCorrectSpotifyLink: null,
    notCorrectFormatForArtist: null,
  })
  const [isDifferentTypesOfArtists, setIsDifferentTypesOfArtists] = useState(null)
  const [isNotPopularArtists, setIsNotPopularArtists] = useState(null)

  const spotifyPlaylist = useRef(null)
  const artistName = useRef(null)

  useEffect(() => {
    if (!isLoading) {
      spotifyPlaylist.current.disabled = false
      artistName.current.disabled = false
    } else {
      spotifyPlaylist.current.disabled = true
      artistName.current.disabled = true
    }
  }, [isLoading])

  useEffect(() => {
    if (!isConnected) {
      setIsLoading(false)

      spotifyPlaylist.current.disabled = true
      artistName.current.disabled = true
    } else {
      spotifyPlaylist.current.disabled = false
      artistName.current.disabled = false
    }

  }, [isConnected])

  const getSimilarArtists = async (artists) => {
    setIsLoading(true)

    if (buttonClick === true) {
      setIsLoading(false)
      return
    }
    setButtonClicked(true)
    try {
      const prompt = `Name musicians that ${isNotPopularArtists ? 'not popular' : 'popular'} and are ${isDifferentTypesOfArtists ? 'different' : 'similar'} in genre to the following artist ${artists.slice(0, -1).join(', ') + ' and ' + artists.slice(-1)} seperated by a comma list 20 of them, but don't repeat the artists i listed`

      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: 1024,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const artistList = response.data.choices[0].text.replace(/:\n/g, "").trimStart().split(", ");

      const albums = await getEveryAlbum(artistList)
      const tracks = await getAllTracks(albums)

      const { id, link, name } = await Promise.resolve(createPlayList(artistList.slice(0, -1).join(', ') + ' and ' + artistList.slice(-1)))
      const playListID = id.substring("spotify:playlist:".length)

      addTracksToPlayList(tracks, playListID)
        .then(data => setPlayListData(
          { link, name }
        ))
        .catch(err => {
          return err
        })

      setIsLoading(false)
      timeSignOut()
    } catch (err) {
      console.log(err)
      setIsLoading(false)
      timeSignOut()
    }
  }

  const onInputFocus = (e) => {
    e.target.name === 'artistName' && (spotifyPlaylist.current.value = '')
    e.target.name === 'spotifyPlaylist' && (artistName.current.value = '')
  }

  const handleButton = () => {
    const artistNameValue = artistName.current.value;
    const spotifyPlayListValue = spotifyPlaylist.current.value;
    if (artistNameValue === '' && spotifyPlayListValue === '') return
    artistName.current.value === '' && handleIfItsAPlaylistLink(spotifyPlayListValue)
    spotifyPlaylist.current.value === '' && handleIfItsAListOfArtist(artistNameValue)
  }

  const getDiffientTypesOfArtists = (e) => {
    if (e.target.checked) {
      setIsDifferentTypesOfArtists(true)
    } else {
      setIsDifferentTypesOfArtists(false)
    }
  }

  const getNonePopularArtists = (e) => {
    if (e.target.checked) {
      setIsNotPopularArtists(true)
    } else {
      setIsNotPopularArtists(false)
    }
  }

  async function handleIfItsAPlaylistLink(link) {
    if (!isSpotifyPlaylistLink(link)) {
      setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: true });
      return;
    }

    setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: false });

    try {
      link = getPlaylistIdFromLink()

      const playlistTracks = await getAllTracksInAPlaylist(link);
      const trackArtists = playlistTracks.flat().map(item => item.track.artists);
      const artistNames = trackArtists.flat().map(item => item.name);
      const uniqueArtistNames = [...new Set(artistNames)];

      getSimilarArtists(uniqueArtistNames);
    } catch (err) {
      console.log(err)
      setIsLoading(false)
      timeSignOut()
    }

    // handle logic for if the link is correct
    function isSpotifyPlaylistLink() {
      return link.trim().startsWith('https://open.spotify.com/playlist/');
    }

    // handle logic for if getting the playlist id from the link
    function getPlaylistIdFromLink() {
      if (link.includes('?')) {
        return link.substring(link.lastIndexOf('/') + 1, link.indexOf('?'));
      }

      return link.substring(link.lastIndexOf('/') + 1);
    }
  }

  function handleIfItsAListOfArtist(artists) {
    if (!isListOfArtists(artists)) {
      setErrorMessages({ ...errorMessages, notCorrectFormatForArtist: true });
      return;
    }

    setErrorMessages({ ...errorMessages, notCorrectFormatForArtist: false });

    const artistArray = artists.trim().split(',');
    getSimilarArtists(artistArray);

    function isListOfArtists(artists) {
      return artists.trim().includes(',');
    }
  }

  function timeSignOut() {
    setTimeout(() => {
      logOut()
    }, 60000)
  }

  return (
    <div className='p-4 flex flex-col gap-10 items-center justify-center'>
      <section className='flex flex-col items-center gap-5'>
        <section className='flex flex-col'>
          <div className='flex flex-col items-center'>
            <div>
              <Input
                label='Give Me Your Favourite Artists'
                placeholder='Seperated By a Comma e.g BTS, Travis Scott, Drake'
                name='artistName'
                refDefination={artistName}
                onInputFocus={onInputFocus}
              />
              {errorMessages.notCorrectFormatForArtist === true && <p className='text-fsm text-red-500'>Seems like you either just gave a single artist or you didn't seperate them by a ','</p>}
            </div>
            <p className='my-2'>OR</p>
            <div>
              <Input
                label='Paste a Spotify Playlist'
                placeholder='e.g https://open.spotify.com/playlist/1B2CSnhZXXVC6xQcY3R4Fk'
                name='spotifyPlaylist'
                refDefination={spotifyPlaylist}
                onInputFocus={onInputFocus}
              />
              {errorMessages.notCorrectSpotifyLink === true && <p className='text-fsm text-red-500'>Not a correct spotify link</p>}
            </div>
          </div>

          {isConnected && <div className='flex flex-col gap-1'>
            <label htmlFor="oppositeArtists" className='flex gap-1 text-fxs'>
              <input type="checkbox" name="oppositeArtists" id='oppositeArtists' onChange={getDiffientTypesOfArtists} />
              <h3>Get songs from a different genre</h3>
            </label>
            <label htmlFor="nonePopularArtists" className='flex gap-1 text-fxs'>
              <input type="checkbox" name="nonePopularArtists" id="nonePopularArtists" onChange={getNonePopularArtists} />
              <h3>Get songs from none popular artists</h3>
            </label>
          </div>
          }

        </section>

        {isLoading ? (
          'Please Wait For the Result'
        ) : isConnected ? (
          <button
            onClick={handleButton}
            className={`bg-brand text-white text-fsm p-2 rounded ${buttonClick &&
              'hidden'}`}
          >
            Get Fresh Songs
          </button>
        ) : (
          <p className='text-fmd'>Please Connect Your Spotify</p>
        )}

      </section>
      {!isLoading &&
        <section className='bg-gray-200 md:min-w-[40vw] md:max-w-[50%] min-w-[300px] p-4 rounded'>
          {(playListData.link.length !== 0 && playListData.name.length !== 0)
            ?
            <>
              <div className='text-fmd flex justify-between items-center mb-1'>
                <p className='text-fsm'>Check Your Spotify For The Playlist Or</p>
                <Icon icon="pajamas:copy-to-clipboard" height='18' width='18' color="teal" inline={true} className='cursor-pointer' onClick={() => copyToClipboard(playListData.link)} />
              </div>
              <a href={playListData.link} target="_blank" rel='norefferer' className='flex gap-1 items-center'>
                <Icon icon="logos:spotify-icon" width="20" height="20" />
                <div className='flex flex-col'>
                  <span className='text-fxs font-medium'>Open on Spotify</span>
                  <span className='underline text-brand whitespace-normal text-fxs mt-[-5px]'>{playListData.name}</span>
                </div>
              </a>
            </>
            :
            <p className='text-fsm text-red-500'>{isConnected ? buttonClick && 'Ooops! Something Went Wrong' : ''}</p>
          }

        </section>
      }
    </div>
  )
}

export default GetBetterSongs
// TODO: simplify the useEffect for disabling the inputs