'use client';

import React, { useEffect } from 'react';

import OpenOnSpotify from './OpenOnSpotify';
import { getFromUrl } from '../lib/utils';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useLoading } from '@/app/context/loadingContext';

const ResultLink = () => {
	const { loading } = useLoading();
	const { playListData, errorMessages, setPlayListData } = useGeneralState();

	useEffect(() => {
		const link = getFromUrl('link');
		link &&
			setPlayListData({
				...playListData,
				link: 'https://open.spotify.com/playlist/' + link,
			});
	}, []);

	return (
		!loading && (
			<section className='w-full max-w-[600px]'>
				{playListData.link.length !== 0 ? (
					<OpenOnSpotify />
				) : (
					<p className='text-fxs text-red-500'>
						{errorMessages.error !== null && errorMessages.error}
					</p>
				)}
			</section>
		)
	);
};

export default ResultLink;
