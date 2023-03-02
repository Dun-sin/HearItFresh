import { Configuration, OpenAIApi } from 'openai'
import React, { useEffect, useRef, useState } from 'react'
import { getEveryAlbum, isValidPlaylistLink, extractPlaylistId, getAllTracks } from '../../../lib/utils';
import { getAllTracksInAPlaylist, createPlayList, addTracksToPlayList } from '../../../lib/spotify';
import UserInput from './DiscoverNewSongs/UserInput';
import DisplayResult from '../DisplayResult';
import Loading from '../Loading';


// Open AI configuration
const configuration = new Configuration({
  apiKey: import.meta.env.VITE_API_KEY
});
const openai = new OpenAIApi(configuration);

const DiscoverNewSongs = ({ logOut }) => {
  const [isLoading, setIsLoading] = useState({
    state: false,
    message: null
  })
  const [playListData, setPlayListData] = useState({
    link: '',
    name: ''
  })
  const [buttonClick, setButtonClicked] = useState(false)
  const [errorMessages, setErrorMessages] = useState({
    notCorrectSpotifyLink: null,
    notCorrectFormatForArtist: null,
    error: null
  })
  const [isDifferentTypesOfArtists, setIsDifferentTypesOfArtists] = useState(null)
  const [isNotPopularArtists, setIsNotPopularArtists] = useState(null)

  const spotifyPlaylist = useRef(null)
  const artistName = useRef(null)

  useEffect(() => {
    const disabled = isLoading.state;
    spotifyPlaylist.current.disabled = disabled;
    artistName.current.disabled = disabled;
  }, [isLoading.state]);

  const getSimilarArtists = async (artists) => {
    if (buttonClick === true) {
      setIsLoading({ state: false, message: null })
      return
    }
    setButtonClicked(true)

    try {
      const type = isDifferentTypesOfArtists ? 'completely different' : 'the same';
      const popularity = isNotPopularArtists ? 'not popular' : 'popular';
      const prompt = `Give me 20 musicians who are ${popularity}  and ${type} to the following artists provided: ${artists.join(', ')}. Be sure none of the musicians listed overlap with those provided and that the result is not in list form and not more than 20 musicians. The results should also be separated by a comma.`;


      const newPrompt = `Please analyze the following list of musicians: '${artists.join(', ')}', and identify the sub-genre that is associated with 70 - 90% of them. Based on this analysis, please provide a list of 20 musicians who are ${popularity} and are ${type} as the sub-genres. Please ensure that the resulting list does not include any of the musicians from the original list provided. To help narrow down the results, please only provide the list of recommended musicians separated by commas.`

      setIsLoading((prevState) => ({ ...prevState, message: `Getting the list of new artists` }));
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: newPrompt,
        max_tokens: 1024,
        temperature: 0.9,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const artistList = response.data.choices[0].text.replace(/:\n/g, "").trimStart().split(':').at(-1).split(', ');
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

  const handleButton = () => {
    const artistNameValue = artistName.current.value;
    const spotifyPlayListValue = spotifyPlaylist.current.value;


    setIsLoading((prevState) => ({ ...prevState, state: true }));
    if (artistNameValue === '' && spotifyPlayListValue === '') {
      setIsLoading((prevState) => ({ ...prevState, state: false }));
      return;
    }

    if (artistNameValue === '') {
      handleIfItsAPlaylistLink(spotifyPlayListValue);
      return;
    }

    if (spotifyPlayListValue === '') {
      handleIfItsAListOfArtist(artistNameValue);
      return;
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

  function handleIfItsAListOfArtist(artists) {
    if (!artists.trim().includes(',')) {
      setErrorMessages({ ...errorMessages, notCorrectFormatForArtist: true });
      setIsLoading((prevState) => ({ ...prevState, state: false }));
      return;
    }

    setErrorMessages({ ...errorMessages, notCorrectFormatForArtist: false });

    const artistArray = artists.trim().split(',');
    getSimilarArtists(artistArray);
  }


  function timeSignOut() {
    setTimeout(() => {
      logOut()
    }, 60000)
  }
  return (
    <div className='p-4 flex flex-col gap-10 items-center justify-center'>
      <section className='flex flex-col items-center gap-5'>
        <UserInput
          artistName={artistName}
          spotifyPlaylist={spotifyPlaylist}
          errorMessages={errorMessages}
          setIsDifferentTypesOfArtists={setIsDifferentTypesOfArtists}
          setIsNotPopularArtists={setIsNotPopularArtists}
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
              Get Fresh Songs
            </button>
        }
      </section>

      <DisplayResult
        isLoading={isLoading}
        playListData={playListData}
        buttonClick={buttonClick}
        errorMessages={errorMessages}
      />
    </div>
  )
}

export default DiscoverNewSongs