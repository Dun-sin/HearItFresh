'use client';

import React, { useEffect } from 'react';

import OpenOnSpotify from './OpenOnSpotify';
import { addPlaylistFullLinkFromID } from '../lib/utils';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useLoading } from '@/app/context/loadingContext';
import { getFromUrl } from '../lib/clientUtils';

const ResultLink = () => {
	const { loading } = useLoading();
	const { playListData, errorMessages, setPlayListData } = useGeneralState();

	useEffect(() => {
		const link = getFromUrl('link');
		link &&
			setPlayListData({
				...playListData,
				link: addPlaylistFullLinkFromID(link),
			});
	}, []);

	return (
		!loading && (
			<section className='w-full'>
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
