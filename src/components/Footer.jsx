import React from 'react'
import { Icon } from '@iconify/react';

const Footer = () => {
  return (
    <div className='h-[5%] p-4 bg-brand text-white text-center flex items-center justify-between'>
      <a href="https://developer.spotify.com/documentation/web-api/" target='_blank' className='font-bold flex items-center underline'>
        Powered By
        <Icon icon="logos:spotify" width="50" height="50" inline={true} className='ml-1' /></a>
      <p>Made By With 😃 By <a href='https://twitter.com/dunsinWebDev' target='_blank' className='underline font-bold'>Dunsin</a></p>
    </div>
  )
}

export default Footer