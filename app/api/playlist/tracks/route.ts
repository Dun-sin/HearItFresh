import { NextResponse } from 'next/server';
import { getAllTracksInAPlaylist, getPlaylistDetails } from '@/app/lib/spotify';
import { getDummyAccessToken } from '@/app/lib/spotify-dummy-auth';
import { setAccessToken } from '@/app/lib/spotifyApi';

const getSpotifyStatusCode = (err: any) =>
	err?.statusCode ?? err?.status ?? err?.response?.status ?? 500;

export async function POST(req: Request) {
	try {
		const { playlistId } = await req.json();

		if (!playlistId) {
			return NextResponse.json(
				{ error: 'Playlist ID is required' },
				{ status: 400 },
			);
		}

		const token = await getDummyAccessToken();
		setAccessToken(token);

		const [tracks, playlist] = await Promise.all([
			getAllTracksInAPlaylist(playlistId),
			getPlaylistDetails(playlistId),
		]);

		if (!Array.isArray(tracks)) {
			throw tracks;
		}

		return NextResponse.json({
			tracks,
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
