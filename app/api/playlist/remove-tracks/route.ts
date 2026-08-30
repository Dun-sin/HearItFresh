import { NextResponse } from 'next/server';
import { getProvider, isProviderName } from '@/app/lib/providers';
import type { ProviderTrackRef } from '@/app/lib/providers/types';

export async function POST(req: Request) {
	try {
		const { provider, playlistId, trackIds, userId } = await req.json();

		if (!playlistId || !Array.isArray(trackIds) || trackIds.length === 0) {
			return NextResponse.json(
				{ error: 'playlistId and a non-empty trackIds array are required' },
				{ status: 400 },
			);
		}

		const resolvedProvider = isProviderName(provider) ? provider : 'spotify';
		const musicProvider = getProvider(resolvedProvider);
		const tracks: ProviderTrackRef[] = trackIds.map((id: string) => ({
			provider: resolvedProvider,
			externalId: id,
		}));

		await musicProvider.removeTracksFromPlaylist(tracks, playlistId, {
			userId,
		});

		return NextResponse.json({ ok: true });
	} catch (error: any) {
		console.error('Failed to remove tracks from playlist:', error);
		return NextResponse.json(
			{ error: error?.message || 'Failed to remove tracks' },
			{ status: 500 },
		);
	}
}
