import { addEmbeddingToSong, addSong, getSong } from './db';

import { Client } from 'genius-lyrics';
import { SpotifyTrack } from '../types';
import { cleanLyrics } from './utils';
import { pipeline } from '@huggingface/transformers';

const genius = new Client(process.env.GENIUS_ACCESS_TOKEN);

let extractor: any = null;

async function getExtractor() {
	if (!extractor) {
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

export async function processSong(spotifyTrack: SpotifyTrack) {
	const startTime = performance.now();
	// already in DB, skip
	const existing = await getSong(spotifyTrack.id);
	if (existing) return existing;

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

	// generate and store embedding if we got lyrics
	if (lyrics) {
		const embedding = await getEmbedding(lyrics);
		await addEmbeddingToSong(song.id, embedding);
	}

	return song;
}
