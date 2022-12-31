import React from 'react'
import { Icon } from '@iconify/react';

const Footer = () => {
  return (
    <div className='h-[5%] p-4 bg-brand text-white text-center flex items-center justify-between'>
      <a href="https://developer.spotify.com/documentation/web-api/" target='_blank' className='font-bold flex items-center underline text-f2xs'>
        Powered By
        <Icon icon="logos:spotify" width="50" height="50" inline={true} className='ml-1' /></a>
      <a href="https://github.com/Dun-sin/HearItFresh" className='font-bold underline text-f2xs'>Contribute to the Project</a>
      <p className='text-f2xs'>Made By With 😃 By <a href='https://twitter.com/dunsinWebDev' target='_blank' className='underline font-bold'>Dunsin</a></p>
    </div>
  )
}

export default Footer