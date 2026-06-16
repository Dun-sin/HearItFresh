import { NextResponse } from 'next/server';
import { generateSeedPlaylist } from '@/app/lib/generateSeedPlaylist';

export async function POST(req: Request) {
  const { seeds, artistNames, options, accessToken, userId } = await req.json();

  const result = await generateSeedPlaylist(
    seeds,
    artistNames,
    options,
    accessToken,
    userId,
    req.signal,
  );

  return NextResponse.json(result);
}
