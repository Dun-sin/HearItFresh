import { NextResponse } from 'next/server';
import {
	generateArtistPlaylist,
	generateSeedPlaylist,
} from '@/app/lib/generatePlaylist';
import { validateGenerationRequest } from '@/app/lib/generatePlaylist/validate';
import { isProviderName } from '@/app/lib/providers';

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const request = validateGenerationRequest(body);
  if (!request.ok) {
    return NextResponse.json({ error: request.error }, { status: 400 });
  }

  const { seeds, options, artist } = request.value;
  const { userId, provider, youtubeGuestCredentials } = body;

  const resolvedProvider = isProviderName(provider) ? provider : 'spotify';

  const result = artist
		? await generateArtistPlaylist(
				artist,
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
