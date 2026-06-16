'use client';

import Loading from './Loading';
import React from 'react';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useLoading } from '@/app/context/loadingContext';

const SubmitButtionContainer = ({
	handleSubmit,
	onCancel,
	onRetry,
}: {
	handleSubmit: () => void;
	onCancel?: () => void;
	onRetry?: () => void;
}) => {
	const { loading, loadingMessage } = useLoading();
	const { buttonClick } = useGeneralState();

	if (loading) {
		return (
			<div className='flex flex-col items-center gap-3 w-full'>
				<Loading loadingMessage={loadingMessage as string} />
				{onCancel && (
					<button
						onClick={onCancel}
						className='text-sm text-gray-400 hover:text-red-400 transition-colors underline underline-offset-2'
					>
						Cancel
					</button>
				)}
			</div>
		);
	}

	if (onRetry) {
		return (
			<div className='flex flex-col items-center gap-3 w-full'>
				<p className='text-sm text-gray-400 text-center'>
					The generation was cancelled by the server.
				</p>
				<button
					className='bg-brand text-lightest rounded p-3 w-full hover:bg-opacity-85 transition-all'
					onClick={onRetry}
				>
					Retry
				</button>
				<button
					className='text-sm text-gray-400 hover:text-white transition-colors underline underline-offset-2'
					onClick={handleSubmit}
				>
					Start fresh instead
				</button>
			</div>
		);
	}

	return (
		!buttonClick && (
			<button
				className={`bg-brand text-lightest rounded p-3 w-full hover:bg-opacity-85 transition-all`}
				onClick={handleSubmit}
			>
				Generate Playlist
			</button>
		)
	);
};

export default SubmitButtionContainer;
