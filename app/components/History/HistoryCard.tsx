import { addPlaylistFullLinkFromID, formatRelativeTime } from '@/app/lib/utils';

import DeleteButton from './DeleteButton';
import { useAuth } from '@/app/context/authContext';
import { useEffect, useMemo, useState } from 'react';
import { useInput } from '@/app/context/inputContext';
import {
	GeneratedPlaylistHistory,
	SeedTrackHistory,
	SourcePlaylist,
} from '@/app/types';

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
	const { spotifyPlaylist } = useInput();
	const { user } = useAuth();
	const [isExpanded, setIsExpanded] = useState(false);
	const playlistId = sourcePlaylist?.id ?? text;
	const playlistName = sourcePlaylist?.name ?? text;
	const playlistArt =
		sourcePlaylist?.imageUrl ??
		`https://placehold.co/224x224/f4f4f5/64748b?text=${encodeURIComponent(
			playlistName.slice(0, 18),
		)}`;
	const playlistTrackCount = sourcePlaylist?.totalTracks;
	useEffect(() => {
		if (spotifyPlaylist.current) {
			spotifyPlaylist.current.value = addPlaylistFullLinkFromID(playlistId);
		}
	}, [playlistId, spotifyPlaylist]);

	const sortedGeneratedPlaylists = useMemo(() => {
		const items = [...(generatedPlaylists ?? [])];
		return items.sort((a, b) => {
			const statusRank = (status?: string) => {
				const normalized = status?.toLowerCase();
				if (normalized === 'completed') return 0;
				if (normalized === 'pending' || normalized === 'running') return 1;
				if (normalized === 'failed' || normalized === 'cancelled') return 2;
				return 3;
			};

			const rankDelta = statusRank(a.status) - statusRank(b.status);
			if (rankDelta !== 0) return rankDelta;

			const aDate = new Date(a.completedAt ?? a.createdAt).getTime();
			const bDate = new Date(b.completedAt ?? b.createdAt).getTime();
			return bDate - aDate;
		});
	}, [generatedPlaylists]);

	const hasGeneratedPlaylists = sortedGeneratedPlaylists.length > 0;

	return (
		user && (
			<div className='group mx-auto flex w-full max-w-4xl flex-col gap-4 overflow-x-hidden rounded-2xl border border-gray/40 bg-lightest px-5 py-4 shadow-sm'>
				<div className='flex items-start justify-between gap-4'>
					<button
						type='button'
						aria-expanded={isExpanded}
						onClick={() => setIsExpanded((current) => !current)}
						className='flex min-w-0 flex-1 items-start gap-4 text-left'>
						<div className='flex shrink-0 flex-col items-center gap-2'>
							<img
								src={playlistArt}
								alt={playlistName}
								className='h-20 w-20 rounded-xl object-cover shadow-sm'
							/>
						</div>
						<div className='min-w-0 flex-1 pt-1'>
							<h3 className='truncate text-2xl font-semibold text-fbase'>
								{playlistName}
							</h3>
							<div className='mt-2 flex items-center gap-2 text-sm text-slate-500'>
								<span>Last used: {formatRelativeTime(lastUsed)}</span>
								{typeof playlistTrackCount === 'number' ? (
									<span>• {playlistTrackCount} tracks</span>
								) : null}
							</div>
						</div>
					</button>
					<div className='flex shrink-0 flex-col items-center gap-2 pt-1'>
						<button
							type='button'
							aria-label={
								isExpanded ? 'Collapse history card' : 'Expand history card'
							}
							aria-expanded={isExpanded}
							onClick={() => setIsExpanded((current) => !current)}
							className='flex h-8 w-8 items-center justify-center rounded-md border border-gray/40 text-dark transition-colors hover:bg-brand hover:text-lightest'>
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
						<span className='rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'>
							Playlist
						</span>
					</div>
				</div>

				{isExpanded && (
					<div className='space-y-4'>
						{hasGeneratedPlaylists && (
							<div className='divide-y divide-gray/30 overflow-hidden rounded-2xl border border-gray/20'>
								{sortedGeneratedPlaylists.map((playlist) => (
									<GeneratedPlaylistBlock
										key={playlist.id}
										playlist={playlist}
									/>
								))}
							</div>
						)}
					</div>
				)}

				<DeleteButton id={user.user_id} text={text} />
			</div>
		)
	);
};

export default HistoryCard;

const GeneratedPlaylistBlock = ({
	playlist,
}: {
	playlist: GeneratedPlaylistHistory;
}) => {
	const status = playlist.status?.toLowerCase();
	const isCompleted = status === 'completed';
	const seedItems = (playlist.seeds ?? []).slice(0, 4);
	const extraSeedCount = Math.max((playlist.seeds?.length ?? 0) - 4, 0);
	const seedCount = playlist.seeds?.length ?? 0;
	const statusLabel = getStatusLabel(playlist.status);
	const statusStyles = getStatusStyles(playlist.status);
	const dateLabel = formatRelativeTime(playlist.completedAt ?? playlist.createdAt);

	return (
			<div className='bg-lightest px-4 py-4'>
			<div className='flex items-center gap-3'>
				<h4 className='text-lg font-semibold text-fbase'>Seed Tracks</h4>
				<span
					className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${statusStyles.wrapper}`}>
					<span className={`${statusStyles.icon} text-sm`} />
					{statusLabel}
				</span>
			</div>

			<div className='mt-4 flex gap-4 overflow-x-auto pb-2'>
				{seedItems.map((seed, index) => {
					const { title, artist } = getSeedLabel(seed);
					const isFaded = !isCompleted && index > 0;
					return (
						<div
							key={`${playlist.id}-${seed.id ?? title}-${index}`}
							className='min-w-[112px] max-w-[112px]'>
							<div
								className={`aspect-square overflow-hidden rounded-md border border-gray/15 bg-gradient-to-br from-slate-200 to-slate-100 ${isFaded ? 'opacity-70 grayscale' : ''}`}>
								<img
									src={
										seed.image ||
										`https://placehold.co/224x224/f4f4f5/64748b?text=${encodeURIComponent(
											title.slice(0, 18),
										)}`
									}
									alt={title}
									className='h-full w-full object-cover'
								/>
							</div>
							<p className='mt-2 truncate text-sm font-semibold text-dark'>
								{title}
							</p>
							<p className='truncate text-xs text-gray-500'>{artist}</p>
						</div>
					);
				})}

				{extraSeedCount > 0 && (
					<div className='flex min-w-[112px] max-w-[112px] flex-col items-center justify-center rounded-md border border-dashed border-gray/30 bg-gray-50 text-gray-500'>
						<div className='flex h-11 w-11 items-center justify-center rounded-full border border-gray/25 bg-white text-xl'>
							+
						</div>
						<p className='mt-3 text-sm'>+{extraSeedCount} more</p>
					</div>
				)}
			</div>

			<div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
				<div className='flex min-w-0 flex-wrap items-center gap-2'>
					<p className='text-sm text-dark/80'>
						Generated {dateLabel} • {seedCount} seeds
					</p>
					{isCompleted ? (
						<>
							<Tag text='Non-popular artists' />
							<Tag text='Different genre' />
						</>
					) : (
						<Tag text='Seed tracks queued' />
					)}
				</div>
				{isCompleted && playlist.playlistLink ? (
					<a
						href={playlist.playlistLink}
						target='_blank'
						rel='noreferrer'
						className='inline-flex items-center rounded-lg bg-brand px-5 py-3 font-semibold text-lightest transition-opacity hover:opacity-90'>
						Open in Spotify
					</a>
				) : (
					<button
						disabled
						className='inline-flex items-center rounded-lg bg-gray-300 px-5 py-3 font-semibold text-gray-600'>
						Open in Spotify
					</button>
				)}
			</div>
		</div>
	);
};

const getStatusLabel = (status?: string) => {
	const normalizedStatus = status?.toLowerCase();
	if (normalizedStatus === 'completed') return 'Completed';
	if (normalizedStatus === 'failed') return 'Failed';
	if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled')
		return 'Cancelled';
	if (normalizedStatus === 'pending') return 'Processing';
	if (normalizedStatus === 'running') return 'Processing';
	return status ?? 'Unknown';
};

const getStatusStyles = (status?: string) => {
	const normalizedStatus = status?.toLowerCase();
	if (normalizedStatus === 'completed')
		return {
			wrapper: 'border-emerald-200 bg-emerald-100 text-emerald-800',
			icon: 'icon-[uil--check-circle] text-emerald-700',
		};
	if (normalizedStatus === 'pending' || normalizedStatus === 'running')
		return {
			wrapper: 'border-blue-200 bg-blue-100 text-blue-800',
			icon: 'icon-[uil--spinner-alt] text-blue-700',
		};
	return {
		wrapper: 'border-rose-200 bg-rose-100 text-rose-800',
		icon: 'icon-[uil--times-circle] text-rose-700',
	};
};

const getSeedLabel = (seed: SeedTrackHistory) => {
	const artist = Array.isArray(seed.artist)
		? seed.artist[0]
		: (seed.artist ?? 'Unknown Artist');
	return {
		title: seed.name ?? 'Unknown track',
		artist,
	};
};


const Tag = ({ text }: { text: string }) => {
	return (
		<span className='rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs text-cyan-800'>
			{text}
		</span>
	);
};
