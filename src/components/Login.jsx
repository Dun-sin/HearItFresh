import React from 'react'

const Login = () => {
  return (
    <a
      href={`https://accounts.spotify.com/authorize?response_type=token&client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&scope=playlist-modify-public%20playlist-read-private%20user-read-private&redirect_uri=${import.meta.env.VITE_REDIRECT_URL}`}
      className='bg-brand sm:min-w-[40vw] max-w-[500px] min-w-[300px] flex items-center justify-center rounded text-white h-10 text-fmd'>Connect Your Spotify</a>
  )
}

export default Login
