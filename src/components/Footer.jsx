import React from 'react'
import { Icon } from '@iconify/react';
import { useTheme } from '../context/themeContext';

const Footer = () => {
  const { isDarkMode } = useTheme()

  return (
    <div className='px-6 pb-4 text-brand text-center flex items-center justify-between inset-x-0 bottom-0'>
      <a href="https://developer.spotify.com/documentation/web-api/" target='_blank' className='font-bold flex flex-wrap items-center underline text-f2xs'>
        Powered By
        <Icon icon="logos:spotify" width="40" height="40" inline={true} className='ml-1' /></a>
      <a href="https://github.com/Dun-sin/HearItFresh" className='font-bold underline text-f2xs flex items-center flex-wrap'>
        <Icon icon="typcn:social-github" width="20" height="20" inline={true} />
        <span>Contribute to the Project</span>
      </a>
      <p className='text-f2xs flex items-center justify-center flex-wrap gap-2'>
        <span className={`${isDarkMode ? 'text-lightest' : 'text-darkness'}`}>Made with a</span>
        <Icon icon="ri:ghost-smile-fill" style={{ color: isDarkMode ? '#FAFFFD' : '#000A07' }} inline={true} width="15" height="15" />
        <span className={`${isDarkMode ? 'text-lightest' : 'text-darkest'}`}>by</span>
        <a href='https://twitter.com/dunsincodes' target='_blank' className='underline font-bold'>
          Dunsin
        </a>
      </p>
    </div>
  )
}

export default Footer