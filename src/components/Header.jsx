import React from 'react'
import { Icon } from '@iconify/react'

import { useTheme } from '../context/themeContext'
import { useAuth } from '../context/authContext'

const Header = () => {
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { isLoggedIn, toggleLoginStatus } = useAuth();

  function logOut() {
    toggleLoginStatus()
    window.location.reload()
  }
  return (
    <div className={`flex items-center justify-between px-6 top-6 relative ${isDarkMode ? 'text-lightest' : 'text-darkest'}`}>
      <div className='flex flex-col'>
        <h1 className={`font-bold mb-[-6px] text-fmd flex items-center`}>HearItFresh<Icon icon="material-symbols:music-note-rounded" width="20" height="20" inline={true} /></h1>
        <p className={`text-fsm ${isDarkMode ? 'text-gray' : 'text-dark'}`}>Discover Fresh Tracks that Fit Your Style</p>
      </div>
      <div className="flex items-center gap-5">
        {isLoggedIn && <button className={`text-brand underline underline-offset-1`} onClick={logOut}>Logout</button>}
        <div className='text-xl cursor-pointer rounded-full bg-brand p-1 text-lightest' onClick={toggleDarkMode}>
          {isDarkMode ? <Icon icon="ic:round-dark-mode" /> : <Icon icon="ic:round-light-mode" />}
        </div>
        <a href='https://www.buymeacoffee.com/dunsinCodes' target='_blank' className={` border-brand border-2 h-8 w-28 text-fxs rounded-lg flex items-center justify-center cursor-pointer sm:w-40 font-semibold `}>
        Buy Me A Coffee
        </a>
        {!isLoggedIn && <a
          href={`https://accounts.spotify.com/authorize?response_type=token&client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}&scope=playlist-modify-public%20playlist-read-private%20user-read-private&redirect_uri=${import.meta.env.VITE_REDIRECT_URL}`}
          className='bg-brand text-lightest px-4 py-1 rounded'>Login</a>}
      </div>
    </div>
  )
}

export default Header