import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { MdLightMode } from "react-icons/md";
import { MdDarkMode } from "react-icons/md";
//  bg-[#092635] text-gray-300

const Header = ({theme, setTheme}) => {
  return (
    <div className='bg-brand flex items-center justify-between p-6 text-white min-h-[5%]'>
      <div className='flex flex-col'>
        <h1 className='font-bold mb-[-6px] text-fmd flex items-center'>HearItFresh<Icon icon="material-symbols:music-note-rounded" width="20" height="20" inline={true} /></h1>
        <p className='text-fsm'>Discover Fresh Tracks that Fit Your Style</p>
      </div>
      <div className="flex items-center gap-5">
      <a href='https://www.buymeacoffee.com/dunsinCodes' target='_blank' className='bg-yellow-500 h-8 w-28 text-fxs rounded-lg flex items-center justify-center cursor-pointer sm:w-40 font-semibold'>
        Buy Me A Coffee
      </a>
      <div className='text-xl cursor-pointer' onClick={() => setTheme(prev => !prev)}>
      {theme ? (
        <MdLightMode />
        ) : (
        <MdDarkMode />
      )}
      </div>
      </div>
    </div>
  )
}

export default Header