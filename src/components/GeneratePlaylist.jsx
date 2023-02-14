import { Configuration, OpenAIApi } from 'openai'
import UserInput from './GeneratePlaylist/UserInput';
import React, { useEffect, useRef, useState } from 'react'
import DisplayResult from './GeneratePlaylist/DisplayResult';
import { getAllTracks, getEveryAlbum, isValidPlaylistLink, extractPlaylistId } from '../../lib/utils';
import { getAllTracksInAPlaylist, createPlayList, addTracksToPlayList } from '../../lib/spotify';

// Open AI configuration
const configuration = new Configuration({
  apiKey: import.meta.env.VITE_API_KEY
});
const openai = new OpenAIApi(configuration);

const GeneratePlaylist = ({ isConnected, logOut }) => {
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
    const disabled = isLoading.state || !isConnected;
    spotifyPlaylist.current.disabled = disabled;
    artistName.current.disabled = disabled;
  }, [isLoading.state, isConnected]);

  const getSimilarArtists = async (artists) => {
    if (buttonClick === true) {
      setIsLoading({ state: false, message: null })
      return
    }
    setButtonClicked(true)

    try {
      const type = isDifferentTypesOfArtists ? 'completely different' : 'similar';
      const popularity = isNotPopularArtists ? 'not popular' : 'popular';
      const prompt = `List 20 ${popularity} musicians who are ${type} to the following artists: ${artists.join(', ')}. Ensure that none of the artists listed overlap with the ones provided and make sure the result is not list form but is separated by a comma`;

      setIsLoading((prevState) => ({ ...prevState, message: `Getting New Artist's List` }));
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

      setIsLoading((prevState) => ({ ...prevState, message: `Getting Each Artist's Albums` }));
      const albums = await getEveryAlbum(artistList);

      setIsLoading((prevState) => ({ ...prevState, message: 'Getting All Tracks' }));
      const tracks = await getAllTracks(albums);

      setIsLoading((prevState) => ({ ...prevState, message: 'Creating The PlayList' }));
      const { id, link, name } = await Promise.resolve(createPlayList(artistList.slice(0, -1).join(', ') + ' and ' + artistList.slice(-1)));
      const playListID = id.substring("spotify:playlist:".length);

      setIsLoading((prevState) => ({ ...prevState, message: 'Adding The Tracks To The Playlist' }));
      addTracksToPlayList(tracks, playListID)
        .then(data => setPlayListData({ link, name }))
        .catch(err => {
          return err;
        });

      setIsLoading((prevState) => ({ ...prevState, message: 'Done' }));
    } catch (err) {
      console.log(err);
      setErrorMessages((prevState) => ({ ...prevState, error: 'Error Occured While Generating A Playlist, Try To Login Again' }));
    } finally {
      setIsLoading({ state: false, message: null })
      timeSignOut();
    }
  };

  const handleButton = () => {
    const artistNameValue = artistName.current.value;
    const spotifyPlayListValue = spotifyPlaylist.current.value;


    setIsLoading((prevState) => ({ ...prevState, state: true }));
    if (!artistNameValue && !spotifyPlayListValue) {
      setIsLoading((prevState) => ({ ...prevState, state: false }));
      return;
    }

    if (!artistNameValue) {
      handleIfItsAPlaylistLink(spotifyPlayListValue);
      return;
    }

    if (!spotifyPlayListValue) {
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
      const trackArtists = playlistTracks.flat().map(item => item.track.artists);
      const artistNames = trackArtists.flat().map(item => item.name);
      const uniqueArtistNames = [...new Set(artistNames)];

      getSimilarArtists(uniqueArtistNames);
    } catch (err) {
      setIsLoading((prevState) => ({ ...prevState, state: false }));
      setErrorMessages((prevState) => ({ ...prevState, error: 'Error Occured While Generating A Playlist, Try To Login Again' }));
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
          isConnected={isConnected}
          errorMessages={errorMessages}
          setIsDifferentTypesOfArtists={setIsDifferentTypesOfArtists}
          setIsNotPopularArtists={setIsNotPopularArtists}
        />

        {isLoading.state ? (
          // loading animation
          <div className="flex flex-col gap-1 items-center">
            <svg aria-hidden="true" className="inline w-8 h-8 mr-2 animate-spin fill-green-500" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span className="text-black text-fmd">{isLoading.message}</span>
          </div>
        ) : isConnected ? (
          <button
            onClick={handleButton}
            className={`bg-brand text-white text-fsm p-2 rounded ${buttonClick ? 'hidden' : ''
              }`}
          >
            Get Fresh Songs
          </button>
        ) : (
          <div className="text-fmd text-center">Please Connect Your Spotify</div>
        )}
      </section>

      <DisplayResult
        isLoading={isLoading}
        isConnected={isConnected}
        playListData={playListData}
        buttonClick={buttonClick}
        errorMessages={errorMessages}
      />
    </div>
  )
}

export default GeneratePlaylist