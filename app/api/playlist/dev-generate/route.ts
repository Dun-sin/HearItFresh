import { NextResponse } from 'next/server';
import {
	generateArtistPlaylist,
	generateSeedPlaylist,
} from '@/app/lib/generatePlaylist';
import { isProviderName } from '@/app/lib/providers';

export async function POST(req: Request) {
  const {
    seeds,
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
				options,
			)
		: await generateSeedPlaylist(
				seeds,
				options,
				userId,
				resolvedProvider,
				req.signal,
				youtubeGuestCredentials,
			);

  return NextResponse.json(result);
}
