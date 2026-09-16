import { NextResponse } from 'next/server';
import { getProvider, isProviderName } from '@/app/lib/providers';
import type { ProviderAuthCtx } from '@/app/lib/providers/types';

const getSpotifyStatusCode = (err: any) =>
	err?.statusCode ?? err?.status ?? err?.response?.status ?? 500;

export async function POST(req: Request) {
	try {
		const { playlistId, provider, userId, youtubeGuestCredentials } =
			await req.json();

		if (!playlistId) {
			return NextResponse.json(
				{ error: 'Playlist ID is required' },
				{ status: 400 },
			);
		}

		const resolvedProvider = isProviderName(provider) ? provider : 'spotify';
		const musicProvider = getProvider(resolvedProvider);
		const authCtx: ProviderAuthCtx = { userId, youtubeGuestCredentials };

		const [tracks, playlist] = await Promise.all([
			musicProvider.getAllTracksInPlaylist(playlistId, authCtx),
			musicProvider.getPlaylistDetails(playlistId, authCtx),
		]);

		if (!Array.isArray(tracks)) {
			throw tracks;
		}

		return NextResponse.json({
			tracks,
			provider: resolvedProvider,
			playlist:
				playlist && typeof playlist === 'object' && 'id' in playlist
					? playlist
					: { id: playlistId, name: playlistId },
		});
	} catch (err: any) {
		const status = getSpotifyStatusCode(err);

		console.error('Error extracting playlist tracks:', err);

		return NextResponse.json(
			{
				error: 'Failed to extract playlist tracks',
				statusCode: status,
			},
			{ status },
		);
	}
}
