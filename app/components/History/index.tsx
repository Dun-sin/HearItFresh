'use client';

import React, { useEffect, useState } from 'react';

import HistoryCard from './HistoryCard';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '@/app/context/authContext';
import { useHistory } from '@/app/context/HistoryContext';
import { useLoading } from '@/app/context/loadingContext';
import { addToUrl } from '@/app/lib/clientUtils';
import { useGeneralState } from '@/app/context/generalStateContext';

const History = () => {
	const { user } = useAuth();
	const { history, setHistory } = useHistory();
	const [isRetrying, setIsRetrying] = useState(false);
	const { setLoading, setLoadingMessage } = useLoading();
	const { setPlayListData } = useGeneralState();

	useEffect(() => {
		getHistory();
	}, [user]);

	async function getHistory() {
		if (!user) {
			return;
		}

		const response = await axios.get(`api/users/${user.user_id}/history`);
		const data = response?.data?.message?.map(
			({
				text,
				lastUsed,
				generatedPlaylists,
			}: {
				text: string;
				lastUsed: string;
				generatedPlaylists?: any[];
			}) => ({
				text,
				lastUsed: new Date(lastUsed),
				generatedPlaylists,
			}),
		);

		setHistory(data);
	}

	const handleRetry = async (generatedPlaylistId: string) => {
		setIsRetrying(true);
		setLoading(true);
		setLoadingMessage('Retrying playlist generation...');

		try {
			const response = await axios.post('/api/playlist/retry', {
				generatedPlaylistId,
			});
			const retryId = response.data.generatedPlaylistId;

			await pollPendingGeneration(retryId);

		} catch (error) {
			console.error('Failed to retry playlist:', error);
			toast.error('Failed to retry playlist generation. Please try again.');
		} finally {
			setIsRetrying(false);
			setLoading(false);
			setLoadingMessage(null);
		}
	};

	const pollPendingGeneration = async (retryId: string) => {
		const userId = user?.user_id;
		if (!userId) return;

		while (true) {
			const response = await fetch('/api/playlist/reconcile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, generatedPlaylistId: retryId }),
			});

			const data = await response.json();
			const currentStatus = data.status ?? data.active?.status;
			const waitCondition = !currentStatus && !data.updated?.length || currentStatus === 'Running' || currentStatus === 'Scheduled' || currentStatus === 'Pending';

			if (waitCondition) {
				await new Promise((resolve) => setTimeout(resolve, 10000));
				continue;
			}

			const completed = data.updated?.find(
				(item: any) =>
					item.status === 'Completed' &&
					item.output?.link &&
					item.output?.name,
			);

			if (completed) {
				addToUrl('link', completed.output.link.split('/').at(-1) as string);
				setPlayListData({
					link: completed.output.link,
					name: completed.output.name,
				});
				await getHistory();
				toast.success('Playlist generated successfully!');
			}

			break;
		}
	};

	return (
		user && (
			<div className={`text-fbase w-full`}>
				<p className='font-bold text-fmd'>Your History</p>
				<div className='flex flex-wrap justify-between items-center gap-5 w-full mt-2'>
					{history && history.length > 0 ? (
						history.map(({ text, lastUsed, generatedPlaylists }) => (
							<HistoryCard
								text={text}
								lastUsed={lastUsed}
								generatedPlaylists={generatedPlaylists}
								onRetry={handleRetry}
								isRetrying={isRetrying}
								key={text}
							/>
						))
					) : (
						<p className='flex items-center font-light text-fsm'>
							You haven't used HearitFresh yet{' '}
							<span className='icon-[fluent-emoji--sad-but-relieved-face]' />
						</p>
					)}
				</div>
			</div>
		)
	);
};

export default History;
// TODO: use axios instead of fetch for consistency and error handling.
// TODO: keep the loading message consistent with all other loading messages in the app.