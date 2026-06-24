'use client';

import React, { useEffect, useState } from 'react';

import HistoryCard from './HistoryCard';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '@/app/context/authContext';
import { useHistory } from '@/app/context/HistoryContext';

const History = () => {
	const { user } = useAuth();
	const { history, setHistory } = useHistory();
	const [isRetrying, setIsRetrying] = useState(false);

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

	const handleRetry = async (playlistDbId: string) => {
		setIsRetrying(true);
		const toastId = toast.loading('Re-queuing playlist generation...');
		try {
			const response = await axios.post('/api/playlist/retry', {
				playlistDbId,
			});
			const { eventId } = response.data;
			console.log('Retry initiated, eventId:', eventId);
			toast.update(toastId, {
				render: 'Retry started! The history will refresh automatically.',
				type: 'success',
				isLoading: false,
				autoClose: 4000,
			});
			setTimeout(() => getHistory(), 2000);
		} catch (error) {
			console.error('Failed to retry playlist:', error);
			toast.update(toastId, {
				render: 'Failed to retry playlist generation. Please try again.',
				type: 'error',
				isLoading: false,
				autoClose: 4000,
			});
		} finally {
			setIsRetrying(false);
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
