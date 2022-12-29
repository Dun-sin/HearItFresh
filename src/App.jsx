import React, { useEffect, useState } from 'react'

import SpotifyWebApi from 'spotify-web-api-node'

import Header from './components/Header';
import Footer from './components/Footer';
import GetBetterSongs from './components/GetBetterSongs';
import Login from './components/Login';

export const spotifyApi = new SpotifyWebApi({
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SPOTIFY_CLIENT_SECRET,
  redirectUri: import.meta.env.VITE_REDIRECT_URL,
  refreshToken: import.meta.env.VITE_SPOTIFY_REFRESH_TOKEN
})

const App = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [elaspedTimeForAccessToken, setElaspedTimeForAccessToken] = useState(NaN);

  useEffect(() => {
    const hash = window.location.hash;
    let tokenSet = window.localStorage.getItem('token');

    if (!tokenSet && hash) {
      setElaspedTimeForAccessToken(Date.now() / 1000)
      tokenSet = hash
        .substring(1)
        .split('&')
        .find((elem) => elem.startsWith('access_token'))
        .split('=')[1];

      window.location.hash = '';
      window.localStorage.setItem('token', tokenSet);
    }

    if (tokenSet === undefined || tokenSet === '' || tokenSet === null) return;
    spotifyApi.setAccessToken(tokenSet);
    setIsConnected(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now() / 1000
      const timeLeft = currentTime - elaspedTimeForAccessToken
      if (timeLeft >= 3600) {
        refreshAccessToken();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [elaspedTimeForAccessToken]);

  function refreshAccessToken() {
    spotifyApi.refreshAccessToken()
      .then(data => {
        setElaspedTimeForAccessToken(Date.now() / 1000)
        spotifyApi.setAccessToken(data.body['access_token']);
        window.localStorage.setItem('token', data.body['access_token']);
      })
      .catch(err => {
        console.log('Error refreshing access token:', err);
      });
  };

  function logOut() {
    window.localStorage.removeItem("token")
    setIsConnected(false)
  }

  return (
    <div className='h-screen flex flex-col gap-10'>
      <Header />
      <div className='h-[85%] flex flex-col gap-4 items-center justify-center'>
        {isConnected ? <p className='bg-brand md:min-w-[40vw] md:max-w-[50%] min-w-[300px] flex items-center justify-center rounded text-white h-10' onClick={logOut}>Logout</p> : <Login />}
        <GetBetterSongs isConnected={isConnected} />
      </div>
      <Footer />
    </div>
  );
}

export default App;
