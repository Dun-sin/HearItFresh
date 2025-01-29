import { addPlaylistFullLinkFromID, formatDate } from '@/app/lib/utils';

import DeleteButton from './DeleteButton';
import { useAuth } from '@/app/context/authContext';
import { useEffect } from 'react';
import { useInput } from '@/app/context/inputContext';
import { useType } from '@/app/context/DiscoverTracks/typeContext';

type HistoryCardType = {
	text: string;
	lastUsed: Date;
};

const HistoryCard = ({ text, lastUsed }: HistoryCardType) => {
  const { setArtistArray, spotifyPlaylist } = useInput();
  const { setType, type } = useType();
	const { user } = useAuth();
	const artistArray = text.split(', ');

	const isArtists = text.includes(',');

  const handleClick = () => {
    console.log({ type })
    if (isArtists) {
      type === 'playlist' && setType('artist');
		} else {
      type === 'artist' && setType('playlist');
    }
  };

  useEffect(() => {
    if (type === 'playlist') {
      if (spotifyPlaylist.current) {
        spotifyPlaylist.current.value = addPlaylistFullLinkFromID(text);
      }
    }

    if (type === 'artist') {
      setArtistArray(artistArray);
    }
  }, [type])

	return (
		user && (
			<div className='group flex gap-2 flex-col w-80 rounded-lg px-5 py-3 border border-gray border-opacity-50 relative'>
				<div className='flex items-center justify-between gap-3'>
					<div className='flex items-center gap-2 font-medium text-fbase'>
						<span className='icon-[weui--music-outlined] text-fmd' />
						<span>{isArtists ? 'Artists' : 'Playlist'}</span>
					</div>
					<span className='font-light flex items-center'>
						<span className='icon-[uil--calender] text-gray' />
						<span className='text-fxs'>{formatDate(lastUsed)}</span>
					</span>
				</div>
				<div className='flex items-center justify-between'>
					{isArtists ? (
						<div className='flex gap-2 items-center flex-wrap'>
							{artistArray.map((artist) => (
								<TextItem key={artist} text={artist} />
							))}
						</div>
					) : (
						<TextItem text={text} />
					)}
					<button
						className='px-4 py-0.5 hidden group-hover:inline border-brand border rounded-md text-fxs text-dark transition-all'
						onClick={handleClick}>
						Use
					</button>
				</div>

				<DeleteButton id={user.user_id} text={text} />
			</div>
		)
	);
};

export default HistoryCard;

const TextItem = ({ text }: { text: string }) => {
	return (
		<span className='bg-brand bg-opacity-45 text-white px-2 py-1 rounded-lg text-fxs'>
			{text}
		</span>
	);
};
