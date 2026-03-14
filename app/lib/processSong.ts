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

async function getEmbedding(text: string): Promise<number[]> {
	return process.env.NODE_ENV === 'production'
		? getEmbeddingProd(text)
		: getEmbeddingDev(text);
}

async function getEmbeddingDev(text: string): Promise<number[]> {
	const ext = await getExtractor();
	const output = await ext(text, { pooling: 'mean', normalize: true });
	return Array.from(output.data) as number[];
}

async function getEmbeddingProd(text: string): Promise<number[]> {
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
		},
	);
	const data = await response.json();
	return data.data[0].embedding;
}

async function getLyrics(
	title: string,
	artist: string,
): Promise<string | null> {
	try {
		const searches = await genius.songs.search(`${title} ${artist}`);
		if (!searches.length) return null;
		return await searches[0].lyrics();
	} catch {
		return null;
	}
}

export async function processSong(
	spotifyTrack: SpotifyTrack,
): Promise<Song & { embeddingData?: number[] | null }> {
	const existing = await getSong(spotifyTrack.id);

	if (existing) {
		// check if embedding is missing
		const hasEmbedding = await prisma.$queryRaw<{ has_embedding: boolean }[]>`
      SELECT embedding IS NOT NULL as has_embedding 
      FROM "Song" WHERE id = ${existing.id}
    `;

		if (!hasEmbedding[0]?.has_embedding && existing.lyrics) {
			console.log(`Backfilling embedding for ${existing.title}`);
			const embedding = await getEmbedding(existing.lyrics);
			await addEmbeddingToSong(existing.id, embedding);
		}
		return existing;
	}
	// fetch lyrics
	const getLyricsResult = await getLyrics(
		spotifyTrack.title,
		spotifyTrack.artist,
	);
	const { lyrics, summary } = cleanLyrics(
		getLyricsResult?.split('\n').slice(0, 25).join('\n') ?? '',
	);

	// save song first
	const song = await addSong(spotifyTrack, lyrics ?? '', summary);

	let embeddingData = null;
  if (lyrics) {
    console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('calling getEmbedding for:', spotifyTrack.title)

embeddingData = await getEmbedding(lyrics);
console.log('embedding length:', embeddingData?.length)
		await addEmbeddingToSong(song.id, embeddingData);
	}

	return { ...song, embeddingData };
}
