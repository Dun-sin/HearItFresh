'use client';

import OpenOnSpotify from '../OpenOnSpotify';
import React from 'react';
import { useGeneralState } from '@/app/context/DiscoverTracks/generalStateContext';
import { useLoading } from '@/app/context/DiscoverTracks/loadingContext';

const ResultLink = () => {
	const { loading } = useLoading();
	const { playListData, errorMessages } = useGeneralState();
	return (
		!loading && (
			<section className='w-full max-w-[600px]'>
				{playListData.link.length !== 0 && playListData.name.length !== 0 ? (
					<>
						<OpenOnSpotify link={playListData.link} />
					</>
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
