'use client';

import React from 'react';
import Loading from './Loading';
import useGenerationCountdown, {
	CYCLE_MS,
} from '@/app/hooks/useGenerationCountdown';

const formatTime = (ms: number) => {
	const total = Math.max(0, Math.ceil(ms / 1000));
	const minutes = Math.floor(total / 60);
	const seconds = total % 60;
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const GenerationCountdown = ({
	startedAt,
	artistName,
}: {
	startedAt: number;
	artistName?: string | null;
}) => {
	const { cycle, remainingMs } = useGenerationCountdown(startedAt);

	const headline =
		cycle === 0
			? artistName
				? `Digging through ${artistName}'s catalog for your playlist`
				: 'Listening to your picks and building your playlist'
			: 'Turns out this one needs a little more time than we guessed';

	const progress = ((CYCLE_MS - remainingMs) / CYCLE_MS) * 100;

	return (
		<div className='flex flex-col items-center gap-3 w-full'>
			<Loading loadingMessage={headline} />

			<span className='text-f2xl font-semibold tabular-nums'>
				{formatTime(remainingMs)}
			</span>

			<div className='w-full max-w-sm h-1 rounded-full bg-gray bg-opacity-30 overflow-hidden'>
				<div
					className='h-full bg-brand transition-all duration-1000 ease-linear'
					style={{ width: `${progress}%` }}
				/>
			</div>

			<p className='text-fsm text-gray dark:text-gray text-center max-w-sm'>
				Feel free to close this page and come back — we&apos;ll pick up right
				where we left off.
			</p>
		</div>
	);
};

export default GenerationCountdown;
