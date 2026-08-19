import { NextResponse } from 'next/server';
import { getDummyAccessToken } from '@/app/lib/spotify-dummy-auth';
import spotifyApi, { setAccessToken } from '@/app/lib/spotifyApi';

const getSpotifyStatusCode = (err: any) =>
	err?.statusCode ?? err?.status ?? err?.response?.status ?? 500;

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const query = searchParams.get('q')?.trim();

		if (!query) {
			return NextResponse.json(
				{ error: 'Query parameter "q" is required' },
				{ status: 400 },
			);
		}

		const token = await getDummyAccessToken();
		setAccessToken(token);

		const data = await spotifyApi.searchArtists(query, { limit: 5 });

		const artists = (data.body.artists?.items ?? []).map((artist: any) => ({
			id: artist.id,
			name: artist.name,
			images: artist.images ?? [],
			followers: artist.followers?.total ?? 0,
			genres: artist.genres ?? [],
		}));

		return NextResponse.json({ artists });
	} catch (err: any) {
		const status = getSpotifyStatusCode(err);

		console.error('Error searching Spotify artists:', err);

		return NextResponse.json(
			{
				error: 'Failed to search Spotify artists',
				statusCode: status,
			},
			{ status },
		);
	}
}
