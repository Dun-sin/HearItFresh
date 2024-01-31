import React, { useEffect, useState } from 'react'

import SpotifyWebApi from 'spotify-web-api-node'
import { Icon } from '@iconify/react'

import Header from './components/Header';
import Footer from './components/Footer';

import CombineFavouriteArtistsSongs from './components/GeneratePlaylist/CombineFavouriteArtistsSongs';
import DiscoverNewSongs from './components/GeneratePlaylist/DiscoverNewSongs';

import { useTheme } from './context/themeContext';
import { useAuth } from './context/authContext'

export const spotifyApi = new SpotifyWebApi({
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
  redirectUri: import.meta.env.VITE_REDIRECT_URL,
  refreshToken: import.meta.env.VITE_SPOTIFY_REFRESH_TOKEN
})

const App = () => {
  const { toggleLoginStatus } = useAuth();
  const { isDarkMode } = useTheme()

  const [newSongs, setNewSongs] = useState(true)
  const [hideNav, setHideNav] = useState(true)

  useEffect(() => {
    const hash = window.location.hash;
    let tokenSet;
    if (hash) {
      tokenSet = hash
        .substring(1)
        .split('&')
        .find((elem) => elem.startsWith('access_token'))
        .split('=')[1];
      window.location.hash = ''
    }

    if (tokenSet === undefined || tokenSet === '' || tokenSet === null) return;
    spotifyApi.setAccessToken(tokenSet);
    toggleLoginStatus()
  }, []);

  const handleHideNav = () => {
    setHideNav(!hideNav)
  }

  return (
    <div className={`h-screen relative flex flex-col overflow-hidden ${isDarkMode ? 'bg-darkest' : 'bg-lightest'}`}>
      <Header />
      <div className='flex flex-grow gap-4 items-center justify-center w-full'>
        <nav
          className={`text-fxs pt-6 border-r-2 px-3 ${isDarkMode ? 'border-gray bg-darkest text-lightest' : 'border-medium bg-lightest text-darkest'} h-screen absolute left-0 max-w-fit gap-11 flex flex-col z-50 ${hideNav ? 'hidden' : 'block'}`}
        >
          <h3
            className={`${isDarkMode ? 'text-gray' : 'text-brand'}`}>
            Choose an Alternative Spotify Tool
          </h3>
          <ul className='text-fsm'>
            <li
              onClick={() => setNewSongs(true)}
              className={`underline underline-offset-1 cursor-pointer`}>Discover New Songs</li>
            <li
              onClick={() => setNewSongs(false)}
              className={`underline underline-offset-1 cursor-pointer`}>Create Playlist with Top Artists' Tracks</li>
          </ul>

          <span
            className={`absolute top-1/2 transform -translate-y-1/2 right-0 p-1 rounded-l-full ${isDarkMode ? 'bg-lightest' : 'bg-darkest'}`}
            onClick={handleHideNav}
          >
            <Icon icon="mingcute:left-fill" style={{ color: isDarkMode ? '#000A07' : '#FAFFFD' }} width={20} height={20} />
          </span>
        </nav>
        <span
          className={`absolute top-1/2 transform -translate-y-1/2 left-0 p-1 rounded-r-full ${isDarkMode ? 'bg-lightest' : 'bg-darkest'} ${hideNav ? 'block' : 'hidden'}`}
          onClick={handleHideNav}
        >
          <Icon icon="mingcute:right-fill" style={{ color: isDarkMode ? '#000A07' : '#FAFFFD' }} width={20} height={20} />
        </span>
        <main className='w-full flex items-center justify-center'>
          {newSongs ? <DiscoverNewSongs /> : <CombineFavouriteArtistsSongs />}
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;
