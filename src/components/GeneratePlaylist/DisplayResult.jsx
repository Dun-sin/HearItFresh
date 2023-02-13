import { copyToClipboard } from "../../../lib/utils"
import { Icon } from '@iconify/react';


const DisplayResult = ({ isLoading, isConnected, playListData, buttonClick, errorMessages }) => {
  return (
    <>
      {!isLoading.state &&
        <section className='bg-gray-200 md:min-w-[40vw] md:max-w-[50%] min-w-[300px] p-4 rounded'>
          {(playListData.link.length !== 0 && playListData.name.length !== 0)
            ?
            <>
              <div className='text-fmd flex justify-between items-center mb-1'>
                <p className='text-fsm'>Check Your Spotify For The Playlist Or</p>
                <Icon icon="pajamas:copy-to-clipboard" height='18' width='18' color="teal" inline={true} className='cursor-pointer' onClick={() => copyToClipboard(playListData.link)} />
              </div>
              <a href={playListData.link} target="_blank" rel='norefferer' className='flex gap-1 items-center'>
                <Icon icon="logos:spotify-icon" width="20" height="20" />
                <div className='flex flex-col'>
                  <span className='text-fxs font-medium'>Open on Spotify</span>
                  <span className='underline text-brand whitespace-normal text-fxs mt-[-5px]'>{playListData.name}</span>
                </div>
              </a>
            </>
            :
            <p className='text-fsm text-red-500'>{
              isConnected ? buttonClick && errorMessages.error !== null && errorMessages.error : ''}</p>
          }

        </section>
      }
    </>
  )
}

export default DisplayResult