import React from 'react'
import { Icon } from '@iconify/react'

const Header = () => {
  return (
    <div className='bg-brand flex flex-col p-6 text-white min-h-[5%]'>
      <h1 className='font-bold mb-[-6px] text-fmd flex items-center'>HearItFresh<Icon icon="material-symbols:music-note-rounded" width="20" height="20" inline={true} /></h1>
      <p className='text-fsm'>Discover Fresh Tracks that Fit Your Style</p>
    </div>
  )
}

export default Header