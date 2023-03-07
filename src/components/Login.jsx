import React from 'react'
import { BiRightArrow,BiLeftArrow } from "react-icons/bi";

const Login = () => {
  return (
    <>
    
    <h1 className='flex items-center'><BiRightArrow className='mr-4' />Connect Your Spotify <BiLeftArrow className='ml-4'/></h1>
   
    <a
      href={`https://accounts.spotify.com/authorize?response_type=token&client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&scope=playlist-modify-public%20playlist-read-private%20user-read-private&redirect_uri=${import.meta.env.VITE_REDIRECT_URL}`}
      className='bg-brand w-32 hover:bg-[#1DB954] flex items-center py-3 justify-center rounded text-white h-10 text-fmd'>Connect</a>
  </>
  )
}

export default Login
