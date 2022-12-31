import React from 'react'

const Login = () => {
  return (
    <a
      href={`https://accounts.spotify.com/authorize?response_type=token&client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&scope=user-top-read%20playlist-modify-public%20playlist-modify-private%20playlist-read-private%20playlist-read-collaborative%20user-follow-modify%20user-library-modify%20user-library-read%20user-read-private&redirect_uri=${import.meta.env.VITE_REDIRECT_URL}`}
      className='bg-brand md:min-w-[40vw] md:max-w-[50%] min-w-[300px] flex items-center justify-center rounded text-white h-10 text-fmd'>Connect Your Spotify</a>
  )
}

export default Login