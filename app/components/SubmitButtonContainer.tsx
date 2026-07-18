'use client';

import Loading from './Loading';
import React from 'react';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useLoading } from '@/app/context/loadingContext';

const SubmitButtionContainer = ({
	handleSubmit,
	onCancel,
	failed,
	errorMessage,
	btnText,
	btnClass,
}: {
	handleSubmit: () => void;
	onCancel?: () => void;
	failed?: boolean;
	errorMessage?: string | null;
	btnText?: string;
	btnClass?: string;
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
						className='text-sm text-gray-400 hover:text-red-400 transition-colors underline underline-offset-2'>
						Cancel
					</button>
				)}
			</div>
		);
	}

	if (failed) {
		return (
			<div className='flex flex-col items-center gap-3 w-full'>
				<p className='text-sm text-red-400 text-center'>
					Generation failed: {errorMessage}
				</p>
				<button
					className='bg-brand text-lightest rounded p-3 w-full hover:bg-opacity-85 transition-all'
					onClick={handleSubmit}>
					Try Again
				</button>
			</div>
		);
	}

	return (
		!buttonClick && (
			<button
				className={`${btnClass ?? 'bg-brand text-lightest'} rounded p-3 w-full hover:bg-opacity-85 transition-all`}
				onClick={handleSubmit}>
				{btnText ?? 'Generate Playlist'}
			</button>
		)
	);
};

export default SubmitButtionContainer;
