'use client';

import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/app/context/authContext';
import { consumeYoutubeConnectRedirect } from '@/app/lib/clientUtils';

type YTStatus = {
	connected: boolean;
	scope?: string | null;
	expiresAt?: string | null;
};

const ConnectYoutube = () => {
	const { user } = useAuth();
	const userId = user?.user_id;

	const [status, setStatus] = useState<YTStatus | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const refreshStatus = useCallback(async () => {
		if (!userId) {
			setStatus({ connected: false });
			return;
		}
		try {
			const res = await fetch(`/api/youtube/status?userId=${encodeURIComponent(userId)}`);
			const data = await res.json();
			setStatus({ connected: Boolean(data.connected), scope: data.scope, expiresAt: data.expiresAt });
		} catch {
			setStatus({ connected: false });
		}
	}, [userId]);

	useEffect(() => {
		refreshStatus();
	}, [refreshStatus]);

	useEffect(() => {
		const result = consumeYoutubeConnectRedirect();
		if (!result) return;

		if (result.status !== 'connected') {
			console.error('[YouTube connect] failed:', result.reason);
			setError(
				`YouTube connection failed${result.reason ? `: ${result.reason}` : ''}. Please try again.`,
			);
			return;
		}

		refreshStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleConnect = () => {
		if (!userId) return;
		setError(null);
		window.location.href = `/api/youtube/connect?userId=${encodeURIComponent(userId)}`;
	};

	const handleDisconnect = async () => {
		if (!userId) return;
		setLoading(true);
		setError(null);
		try {
			await fetch('/api/youtube/disconnect', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId }),
			});
			setStatus({ connected: false });
		} catch {
			setError('Failed to disconnect YouTube account.');
		} finally {
			setLoading(false);
		}
	};

	if (!userId) return null;

	return (
		<div className='flex flex-col gap-2 rounded-2xl border border-gray/40 bg-lightest px-5 py-4 shadow-sm min-w-80 max-w-2xl'>
			<h3 className='text-lg font-semibold text-fbase'>
				YouTube Music connection
			</h3>
			<p className='text-sm text-slate-500'>
				{status?.connected
					? 'Your YouTube account is connected. Generated playlists will be created in your YouTube Music library.'
					: 'Connect your YouTube account to generate playlists directly in your YouTube Music library.'}
			</p>

			{error && <p className='text-fsm text-red-500'>{error}</p>}

			{status?.connected ? (
				<button
					type='button'
					onClick={handleDisconnect}
					disabled={loading}
					className='self-start rounded-lg border-2 border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50'>
					{loading ? 'Disconnecting…' : 'Disconnect YouTube'}
				</button>
			) : (
				<button
					type='button'
					onClick={handleConnect}
					disabled={loading}
					className='self-start rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-lightest transition-opacity hover:opacity-90 disabled:opacity-50'>
					Connect YouTube Music
				</button>
			)}
		</div>
	);
};

export default ConnectYoutube;
