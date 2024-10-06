'use client';

import Loading from './Loading';
import React from 'react';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useLoading } from '@/app/context/loadingContext';

const SubmitButtionContainer = ({
	handleSubmit,
}: {
	handleSubmit: () => void;
}) => {
	const { loading, loadingMessage } = useLoading();

	const { buttonClick } = useGeneralState();

	return loading ? (
		<Loading loadingMessage={loadingMessage as string} />
	) : (
		!buttonClick && (
			<button
				className={`bg-brand text-lightest rounded p-3 w-full hover:bg-opacity-85 transition-all`}
				onClick={handleSubmit}>
				Generate Playlist
			</button>
		)
	);
};

export default SubmitButtionContainer;
