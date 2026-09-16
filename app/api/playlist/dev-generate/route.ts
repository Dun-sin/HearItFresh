import { NextResponse } from 'next/server';
import {
	generateArtistPlaylist,
	generateSeedPlaylist,
} from '@/app/lib/generateSeedPlaylist';
import { isProviderName } from '@/app/lib/providers';

export async function POST(req: Request) {
  const {
    seeds,
    artistNames,
    options,
    userId,
    artistId,
    artistName,
    provider,
    youtubeGuestCredentials,
  } = await req.json();

  const resolvedProvider = isProviderName(provider) ? provider : 'spotify';

  const result = artistId
		? await generateArtistPlaylist(
				{ id: artistId, name: artistName },
				seeds,
				userId,
				resolvedProvider,
				req.signal,
				youtubeGuestCredentials,
			)
		: await generateSeedPlaylist(
				seeds,
				artistNames,
				options,
				userId,
				resolvedProvider,
				req.signal,
				youtubeGuestCredentials,
			);

  return NextResponse.json(result);
}
