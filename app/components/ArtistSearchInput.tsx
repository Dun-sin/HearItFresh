'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useOptions } from '@/app/context/optionsContext';

type ArtistResult = {
	id: string;
	name: string;
	images: { url: string; height: number | null; width: number | null }[];
	followers: number;
	genres: string[];
};

const ArtistSearchInput = () => {
	const { setSelectedArtist } = useOptions();
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<ArtistResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		const handler = setTimeout(async () => {
			try {
				const res = await fetch(
					`/api/artists/search?q=${encodeURIComponent(query)}`,
				);
				const data = await res.json();
				setResults(data.artists ?? []);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 600);

		return () => clearTimeout(handler);
	}, [query]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSelect = (artist: ArtistResult) => {
		setSelectedArtist({
			id: artist.id,
			name: artist.name,
			image: artist.images?.[0]?.url,
			followers: artist.followers,
			genres: artist.genres,
		});
		setQuery('');
		setResults([]);
		setOpen(false);
	};

	return (
		<div className='relative w-full' ref={containerRef}>
			<div className='relative flex items-center'>
				<input
					type='text'
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					onFocus={() => setOpen(true)}
					placeholder='Search for an artist...'
					className='h-8 rounded p-2 pr-8 outline-none border-2 focus:border-brand w-full text-darkest'
					aria-label='Search for an artist'
				/>
				{loading && (
					<svg
						aria-hidden='true'
						className='absolute right-2 w-5 h-5 animate-spin fill-green-500 text-gray'
						viewBox='0 0 100 101'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'>
						<path
							d='M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z'
							fill='currentColor'
						/>
						<path
							d='M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z'
							fill='currentFill'
						/>
					</svg>
				)}
			</div>

			{open && !loading && results.length > 0 && (
				<ul className='absolute z-20 mt-1 w-full bg-white border border-gray border-opacity-40 rounded shadow-lg max-h-60 overflow-y-auto custom-scrollbar'>
					{results.map((artist) => (
						<li key={artist.id}>
							<button
								type='button'
								onClick={() => handleSelect(artist)}
								className='flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-brand hover:bg-opacity-10 transition-colors'>
								{artist.images?.[0]?.url ? (
									<img
										src={artist.images[0].url}
										alt={artist.name}
										className='w-8 h-8 rounded-full object-cover shrink-0'
									/>
								) : (
									<span className='w-8 h-8 rounded-full bg-gray bg-opacity-30 shrink-0 flex items-center justify-center text-fxs text-gray'>
										{artist.name.charAt(0).toUpperCase()}
									</span>
								)}
								<span className='truncate text-darkest text-fsm'>
									{artist.name}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}

			{open && !loading && query.trim() && results.length === 0 && (
				<div className='absolute z-20 mt-1 w-full bg-white border border-gray border-opacity-40 rounded shadow-lg px-3 py-2 text-fsm text-gray'>
					No artists found
				</div>
			)}
		</div>
	);
};

export default ArtistSearchInput;
