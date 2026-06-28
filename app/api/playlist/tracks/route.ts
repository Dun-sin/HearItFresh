import { NextResponse } from 'next/server';
import { getAllTracksInAPlaylist } from '@/app/lib/spotify';
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

		const tracks = await getAllTracksInAPlaylist(playlistId);

		if (!Array.isArray(tracks)) {
			throw tracks;
		}

		return NextResponse.json({ tracks });
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
