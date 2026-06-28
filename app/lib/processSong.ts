import { addEmbeddingToSong, addSong, getSong } from './db';

import { Client } from 'genius-lyrics';
import { Song } from '../generated/prisma';
import { SpotifyTrack } from '../types';
import { cleanLyrics } from './utils';
import prisma from './prisma';

const genius = new Client(process.env.GENIUS_ACCESS_TOKEN);

let extractor: any = null;

async function getExtractor() {
	if (!extractor) {
		const transformers = (await import('@huggingface/transformers')) as any;
		const pipeline = transformers.default?.pipeline ?? transformers.pipeline;
		extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
	}
	return extractor;
}

async function getEmbedding(text: string, signal?: AbortSignal): Promise<number[]> {
	return process.env.NODE_ENV === 'production'
		? getEmbeddingProd(text, signal)
		: getEmbeddingDev(text, signal);
}

async function getEmbeddingDev(text: string, signal?: AbortSignal): Promise<number[]> {
	if (signal?.aborted) throw new Error('Aborted');
	const ext = await getExtractor();
	if (signal?.aborted) throw new Error('Aborted');
	const output = await ext(text, { pooling: 'mean', normalize: true });
	if (signal?.aborted) throw new Error('Aborted');
	return Array.from(output.data) as number[];
}

async function getEmbeddingProd(text: string, signal?: AbortSignal): Promise<number[]> {
	const response = await fetch(
		'https://api.deepinfra.com/v1/openai/embeddings',
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${process.env.DEEPINFRA_TOKEN}`,
			},
			body: JSON.stringify({
				model: 'sentence-transformers/all-MiniLM-L6-v2',
				input: text,
				encoding_format: 'float',
			}),
			signal,
		},
	);
	const data = await response.json();
	return data.data[0].embedding;
}

async function getLyrics(title: string, artist: string, signal?: AbortSignal): Promise<string | null> {
  try {
    if (signal?.aborted) return null;
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
      { signal },
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.lyrics ?? null
  } catch (err: any) {
    if (signal?.aborted) throw new Error('Aborted');
    return null
  }
}

export async function processSong(
	spotifyTrack: SpotifyTrack,
	signal?: AbortSignal,
): Promise<(Song & { embeddingData?: number[] | null }) | null> {
	if (signal?.aborted) throw new Error('Aborted');
	const existing = await getSong(spotifyTrack.id);

	if (existing) {
		// check if embedding is missing
		const hasEmbedding = await prisma.$queryRaw<{ has_embedding: boolean }[]>`
      SELECT embedding IS NOT NULL as has_embedding 
      FROM "Song" WHERE id = ${existing.id}
    `;

		if (!hasEmbedding[0]?.has_embedding && existing.lyrics) {
			if (signal?.aborted) throw new Error('Aborted');
			console.log(`Backfilling embedding for ${existing.title}`);
			const embedding = await getEmbedding(existing.lyrics, signal);
			if (signal?.aborted) throw new Error('Aborted');
			await addEmbeddingToSong(existing.id, embedding);
		}
		return existing;
	}
	// fetch lyrics
	const getLyricsResult = await getLyrics(
		spotifyTrack.title,
		spotifyTrack.artist,
		signal,
	);
	const lyrics = getLyricsResult?.split('\n').slice(0, 60).join('\n').trim() ?? '';

	if (!lyrics) {
		return null;
	}

	// save song first
	const song = await addSong(spotifyTrack, lyrics);

	if (signal?.aborted) throw new Error('Aborted');

	const embeddingData = await getEmbedding(lyrics, signal);
	if (signal?.aborted) throw new Error('Aborted');
	await addEmbeddingToSong(song.id, embeddingData);

	return { ...song, embeddingData };
}
