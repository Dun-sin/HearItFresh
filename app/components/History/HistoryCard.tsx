import { addPlaylistFullLinkFromID, formatDate } from '@/app/lib/utils';

import DeleteButton from './DeleteButton';
import { useAuth } from '@/app/context/authContext';
import { useEffect, useState } from 'react';
import { useInput } from '@/app/context/inputContext';
import { useType } from '@/app/context/DiscoverTracks/typeContext';
import { GeneratedPlaylistHistory, SourcePlaylist } from '@/app/types';

type HistoryCardType = {
	text: string;
	lastUsed: Date;
	sourcePlaylist?: SourcePlaylist;
	generatedPlaylists?: GeneratedPlaylistHistory[];
	onRetry?: (generatedPlaylistId: string) => void;
	isRetrying?: boolean;
};

const HistoryCard = ({
	text,
	lastUsed,
	sourcePlaylist,
	generatedPlaylists,
	onRetry,
	isRetrying,
}: HistoryCardType) => {
	const { setArtistArray, spotifyPlaylist } = useInput();
	const { setType, type } = useType();
	const { user } = useAuth();
	const [isExpanded, setIsExpanded] = useState(false);
	const artistArray = text.split(', ');
	const playlistId = sourcePlaylist?.id ?? text;
	const playlistName = sourcePlaylist?.name ?? text;

	const isArtists = text.includes(',');

	const handleClick = () => {
		console.log({ type });
		if (isArtists) {
			type === 'playlist' && setType('artist');
		} else {
			type === 'artist' && setType('playlist');
		}
	};

	useEffect(() => {
		if (type === 'playlist') {
			if (spotifyPlaylist.current) {
				spotifyPlaylist.current.value = addPlaylistFullLinkFromID(playlistId);
			}
		}

		if (type === 'artist') {
			setArtistArray(artistArray);
		}
	}, [type, playlistId]);

	const hasGeneratedPlaylists = generatedPlaylists && generatedPlaylists.length > 0;
	const getStatusLabel = (status?: string) => {
		const normalizedStatus = status?.toLowerCase();
		if (normalizedStatus === 'completed') return 'Completed';
		if (normalizedStatus === 'failed') return 'Failed';
		if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled')
			return 'Cancelled';
		return status ?? 'Unknown';
	};

	return (
		user && (
			<div className='group flex gap-3 flex-col w-full rounded-lg px-5 py-4 border border-gray border-opacity-50 relative bg-lightest shadow-sm'>
				<div className='flex items-center justify-between gap-3'>
					<button
						type='button'
						aria-expanded={isExpanded}
						onClick={() => setIsExpanded((current) => !current)}
						className='flex items-center gap-2 font-semibold text-fbase min-w-0 text-left flex-1'>
						<span className='icon-[weui--music-outlined] text-fmd shrink-0' />
						<span className='truncate'>
							{isArtists ? 'Artists' : 'Playlist'}:{' '}
							{isArtists ? artistArray.join(', ') : playlistName}
						</span>
					</button>
					<div className='flex items-center gap-3 shrink-0'>
						<span className='font-light flex items-center'>
							<span className='icon-[uil--calender] text-gray' />
							<span className='text-fxs'>{formatDate(lastUsed)}</span>
						</span>
						<button
							type='button'
							aria-label={isExpanded ? 'Collapse history card' : 'Expand history card'}
							aria-expanded={isExpanded}
							onClick={() => setIsExpanded((current) => !current)}
							className='flex h-7 w-7 items-center justify-center rounded-md border border-gray border-opacity-40 text-dark transition-colors hover:bg-brand hover:text-lightest'>
							<svg
								aria-hidden='true'
								viewBox='0 0 24 24'
								fill='none'
								className={`h-4 w-4 transition-transform ${
									isExpanded ? 'rotate-180' : ''
								}`}
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'>
								<path d='m6 9 6 6 6-6' />
							</svg>
						</button>
					</div>
				</div>

				{isExpanded && (
					<>
						<div className='flex items-center justify-between'>
							{isArtists ? (
								<div className='flex gap-2 items-center flex-wrap'>
									{artistArray.map((artist) => (
										<TextItem key={artist} text={artist} />
									))}
								</div>
							) : (
								<TextItem text={playlistName} />
							)}
							<button
								className='px-4 py-0.5 hidden group-hover:inline border-brand border rounded-md text-fxs text-dark transition-all'
								onClick={handleClick}>
								Use
							</button>
						</div>

						{hasGeneratedPlaylists && (
							<div className='mt-2 pt-2 border-t border-gray border-opacity-30'>
								{generatedPlaylists.map((playlist, index) => {
									const status = playlist.status?.toLowerCase();
									const isCompleted = status === 'completed';
									const statusLabel = getStatusLabel(playlist.status);
									return (
										<div
											key={playlist.id}
											className='flex items-center justify-between text-xs text-dark mb-2 gap-2 border-b border-gray border-opacity-20 pb-2 last:mb-0 last:border-b-0 last:pb-0'>
											<span className='flex items-center gap-2 min-w-0'>
												<span
													className={
														isCompleted
															? 'icon-[uil--check-circle] text-green-500 text-fbase'
															: 'icon-[uil--exclamation-triangle] text-red-400 text-fbase'
													}
												/>
												<span className='truncate'>
													Try {index + 1}: {statusLabel}
													{playlist.errorMessage
														? ` - ${playlist.errorMessage}`
														: ''}
												</span>
											</span>
											{isCompleted && playlist.playlistLink ? (
												<a
													href={playlist.playlistLink}
													target='_blank'
													rel='noreferrer'
													className='px-2 py-0.5 ml-2 bg-brand rounded text-lightest hover:bg-opacity-85 whitespace-nowrap'>
													Open
												</a>
											) : (
												<button
													onClick={() => onRetry?.(playlist.id!)}
													disabled={isRetrying}
													className='px-2 py-0.5 ml-2 bg-brand rounded text-lightest hover:bg-opacity-85 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap'>
													Retry
												</button>
											)}
										</div>
									);
								})}
							</div>
						)}
					</>
				)}

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
