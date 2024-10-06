'use client';

import React, { useEffect, useState } from 'react';

import HistoryCard from './HistoryCard';
import axios from 'axios';
import { useAuth } from '@/app/context/authContext';
import { useHistory } from '@/app/context/HistoryContext';

const History = () => {
	const { user, logOut } = useAuth();
	const { history, setHistory } = useHistory();

	useEffect(() => {
		getHistory();
	}, [user]);

	async function getHistory() {
		if (!user) {
			return logOut();
		}

		const response = await axios.get(`api/users/${user.user_id}/history`);
		const data = response.data.message.map(
			({ text, lastUsed }: { text: string; lastUsed: string }) => ({
				text,
				lastUsed: new Date(lastUsed),
			}),
		);

		setHistory(data);
	}

	return (
		user && (
			<div className={`text-fbase w-full`}>
				<p className='font-bold text-fmd'>Your History</p>
				<div className='flex flex-wrap justify-between items-center gap-5 w-full mt-2'>
					{history && history.length > 0 ? (
						history.map(({ text, lastUsed }) => (
							<HistoryCard text={text} lastUsed={lastUsed} key={text} />
						))
					) : (
						<p className='flex items-center font-light text-fsm'>
							You haven't used HearltFresh yet{' '}
							<span className='icon-[fluent-emoji--sad-but-relieved-face]' />
						</p>
					)}
				</div>
			</div>
		)
	);
};

export default History;
