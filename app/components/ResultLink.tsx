'use client';

import React, { useEffect } from 'react';

import OpenOnSpotify from './OpenOnSpotify';
import {
	addPlaylistFullLinkFromID,
	addYoutubePlaylistFullLinkFromID,
} from '../lib/helpers';
import { useGeneralState } from '@/app/context/generalStateContext';
import { useLoading } from '@/app/context/loadingContext';
import { getFromUrl } from '../lib/clientUtils';

const ResultLink = () => {
	const { loading } = useLoading();
	const { playListData, errorMessages, setPlayListData } = useGeneralState();

	useEffect(() => {
		const link = getFromUrl('link');
		if (!link) return;

		// youtube ids land here as "playlist?list=<id>"; spotify ids are bare
		const listId = new URLSearchParams(link.split('?')[1] ?? '').get('list');

		setPlayListData({
			...playListData,
			link: listId
				? addYoutubePlaylistFullLinkFromID(listId)
				: addPlaylistFullLinkFromID(link),
			provider: listId ? 'youtube' : 'spotify',
		});
	}, []);

	return (
		!loading && (
			<section className='w-full'>
				{playListData.link.length !== 0 ? (
					<OpenOnSpotify provider={playListData.provider ?? 'spotify'} />
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
