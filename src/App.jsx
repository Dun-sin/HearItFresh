import React, { useEffect, useState } from 'react'

import SpotifyWebApi from 'spotify-web-api-node'

import Header from './components/Header';
import Footer from './components/Footer';
import GeneratePlaylist from './components/GeneratePlaylist';
import Login from './components/Login';

export const spotifyApi = new SpotifyWebApi({
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
  redirectUri: import.meta.env.VITE_REDIRECT_URL,
  refreshToken: import.meta.env.VITE_SPOTIFY_REFRESH_TOKEN
})

const App = () => {
  const [isConnected, setIsConnected] = useState(false)

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
    setIsConnected(true);
  }, []);

  function logOut() {
    setIsConnected(false)
    window.location.reload()
  }

  return (
    <div className='h-screen flex flex-col gap-10 overflow-hidden'>
      <Header />
      <div className='h-[85%] flex flex-col gap-4 items-center justify-center'>
        {isConnected ? <p className='bg-brand md:min-w-[40vw] md:max-w-[50%] min-w-[300px] flex items-center justify-center rounded text-white h-10 cursor-pointer' onClick={logOut}>Logout</p> : <Login />}
        <GeneratePlaylist isConnected={isConnected} logOut={logOut} />
      </div>
      <Footer />
    </div>
  );
}

export default App;
