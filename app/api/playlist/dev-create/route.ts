import { NextResponse } from 'next/server';
import { getProvider, isProviderName } from '@/app/lib/providers';

export async function POST(req: Request) {
	try {
		const { provider, tracks, playlistName, description, userId } =
			await req.json();

		const resolvedProvider = isProviderName(provider) ? provider : 'spotify';
		const musicProvider = getProvider(resolvedProvider);

		const playlistInfo = await musicProvider.createPlaylist(
			playlistName,
			description,
			{ userId },
		);

		if ('isError' in playlistInfo) {
			return NextResponse.json(
				{ error: String(playlistInfo.err) },
				{ status: 500 },
			);
		}

		await musicProvider.addTracksToPlaylist(tracks, playlistInfo.externalId, {
			userId,
		});

		return NextResponse.json({
			link: playlistInfo.link,
			name: playlistInfo.name,
			provider: resolvedProvider,
		});
	} catch (error: any) {
		console.error('dev-create playlist failed:', error);
		return NextResponse.json(
			{ error: error?.message || 'Failed to create playlist' },
			{ status: 500 },
		);
	}
}
