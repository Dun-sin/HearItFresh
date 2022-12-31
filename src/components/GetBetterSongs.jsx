import React, { useEffect, useRef, useState } from 'react'

import { Configuration, OpenAIApi } from 'openai'
import { Icon } from '@iconify/react';

import { spotifyApi } from '../App';
import Input from './Input';

const configuration = new Configuration({
  apiKey: import.meta.env.VITE_API_KEY
});

const openai = new OpenAIApi(configuration);

const GetBetterSongs = ({ isConnected, logOut }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [playListLink, setPlayListLink] = useState(null)
  const [buttonClick, setButtonClicked] = useState(false)
  const [errorMessages, setErrorMessages] = useState({
    notCorrectSpotifyLink: null,
    notCorrectFormatForArtist: null,
  })
  const [getDifferentTypesOfArtists, setGetDifferentTypesOfArtists] = useState(null)

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
    }

    spotifyPlaylist.current.disabled = true
    artistName.current.disabled = true
  }, [isConnected])


  const copyToClipboard = async () => {
    if ('clipboard' in navigator) {
      return await navigator.clipboard.writeText(playListLink);
    } else {
      return document.execCommand('copy', true, playListLink);
    }
  }

  const getSimilarArtists = async (artists) => {
    setIsLoading(true)

    if (buttonClick === true) {
      setIsLoading(false)
      return
    }
    setButtonClicked(true)
    try {
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: `Name 10 musicians ${getDifferentTypesOfArtists ? 'completely different' : 'similar'} in genre and music style to the following artist ${artists.slice(0, -1).join(', ') + ' and ' + artists.slice(-1)} seperated by a comma, but don't include ${artists.slice(0, -1).join(', ') + ' or ' + artists.slice(-1)}`,
        max_tokens: 1024,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const artistList = response.data.choices[0].text.replace(/:\n/g, "").trimStart().split(", ");

      const getArtistTopTracksPromises = artistList.map(getArtistTopTracks);
      const tracks = await Promise.all(getArtistTopTracksPromises);

      const nonEmptyTracks = tracks.flat().filter(Boolean);
      const { id, link } = await Promise.resolve(createPlayList(artistList.slice(0, -1).join(', ') + ' and ' + artistList.slice(-1)))

      const playListID = id.substring("spotify:playlist:".length)
      addTracksToPlayList(nonEmptyTracks, playListID)
        .then(data => setPlayListLink(link))
        .catch(err => {
          console.log(err)
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

  const handleGetDiffientTypesOfArtists = (e) => {
    if (e.target.checked) {
      setGetDifferentTypesOfArtists(true)
    } else {
      setGetDifferentTypesOfArtists(false)
    }
  }

  async function handleIfItsAPlaylistLink(link) {
    if (!isSpotifyPlaylistLink(link)) {
      setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: true });
      return;
    }

    setErrorMessages({ ...errorMessages, notCorrectSpotifyLink: false });

    link = getPlaylistIdFromLink()

    const playlistTracks = await Promise.resolve(getAllTracksInAPlaylist(link));
    const trackArtists = playlistTracks.flat().map(item => item.track.artists);
    const artistNames = trackArtists.flat().map(item => item.name);
    const uniqueArtistNames = [... new Set(artistNames)];


    getSimilarArtists(uniqueArtistNames)

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

  async function getArtistTopTracks(artist) {
    try {
      const result = [];
      const data = await spotifyApi.searchArtists(artist, { limit: 1, offset: 0 });
      const _data = await spotifyApi.getArtistTopTracks(data.body.artists.items[0].id, 'US');
      _data.body.tracks.forEach(song => result.push(song.uri))
      return result
    } catch (err) {

      return err
    }

  }

  async function createPlayList(artists) {
    try {
      const data = await spotifyApi.createPlaylist('PlayList Generated By HearItFresh', { 'description': `Listen To Something New From ${artists}`, 'public': true });
      return { id: data.body.uri, link: data.body.external_urls.spotify }
    } catch (err) {
      return err
    }
  }

  async function addTracksToPlayList(tracks, playListID) {
    try {
      const _data = await spotifyApi.addTracksToPlaylist(playListID, tracks)
      return _data
    } catch (err) {
      return err
    }
  }

  async function getAllTracksInAPlaylist(link) {
    try {
      const data = await spotifyApi.getPlaylistTracks(link)
      return data.body.items
    } catch (err) {
      return err
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

          {isConnected && <label htmlFor="oppositeArtists" className='flex gap-1 text-fxs'>
            <input type="checkbox" name="oppositeArtists" id='oppositeArtists' onChange={handleGetDiffientTypesOfArtists} />
            <h3>Get songs from a different genre</h3>
          </label>}
        </section>

        {isLoading ? (
          'Please Wait For the Result'
        ) : isConnected ? (
          <button
            onClick={handleButton}
            className={`bg-brand text-white p-2 rounded ${buttonClick &&
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
          {playListLink !== null
            &&
            <>
              <div className='text-fmd flex justify-between items-center mb-1'>
                <div>
                  <p>Check Your Account For The Playlist Or Click On</p>
                  <p>The Playlist link:</p>
                </div>
                {
                  (playListLink.length !== 0)
                  &&
                  <Icon icon="pajamas:copy-to-clipboard" height='18' width='18' color="teal" inline={true} className='cursor-pointer' onClick={copyToClipboard} />}
              </div>
              {
                !(playListLink.length === 0)
                  ?
                  <a href={playListLink} target="_blank" rel='norefferer' className='underline text-brand whitespace-normal'>{playListLink}</a>
                  :
                  <p>Ooops! Something Went Wrong</p>
              }
            </>
          }

        </section>}
    </div>
  )
}

export default GetBetterSongs