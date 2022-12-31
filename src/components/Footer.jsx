import React from 'react'
import { Icon } from '@iconify/react';

const Footer = () => {
  return (
    <div className='h-[5%] p-4 bg-brand text-white text-center flex items-center justify-between'>
      <a href="https://developer.spotify.com/documentation/web-api/" target='_blank' className='font-bold flex items-center underline text-f2xs'>
        Powered By
        <Icon icon="logos:spotify" width="50" height="50" inline={true} className='ml-1' /></a>
      <a href="https://github.com/Dun-sin/HearItFresh" className='font-bold underline text-f2xs flex items-center'><Icon icon="typcn:social-github" width="25" height="25" inline={true} />Contribute to the Project</a>
      <p className='text-f2xs flex gap-1 items-center'>Made By With <Icon icon="ri:bear-smile-line" width="20" height="20" inline={true} /> By <a href='https://twitter.com/dunsinWebDev' target='_blank' className='underline font-bold'>Dunsin</a></p>
    </div>
  )
}

export default Footer