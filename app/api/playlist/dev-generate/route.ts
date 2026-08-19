import { NextResponse } from 'next/server';
import {
	generateArtistPlaylist,
	generateSeedPlaylist,
} from '@/app/lib/generateSeedPlaylist';

export async function POST(req: Request) {
  const { seeds, artistNames, options, userId, artistId, artistName } =
    await req.json();

  const result = artistId
    ? await generateArtistPlaylist(
        { id: artistId, name: artistName },
        seeds,
        userId,
        req.signal,
      )
    : await generateSeedPlaylist(
        seeds,
        artistNames,
        options,
        userId,
        req.signal,
      );

  return NextResponse.json(result);
}
