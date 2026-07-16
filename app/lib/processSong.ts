import { addEmbeddingToSong, addSong, getSong, updateSong } from './db';
import { Song } from '../generated/prisma';
import { SpotifyTrack } from '../types';
import prisma from './prisma';
import { getCentroid } from './utils';
import { embedSong } from './lyrics';

const MAX_TOKENS = 256;

let extractor: any = null;

async function getExtractor() {
	if (!extractor) {
		const transformers = (await import('@huggingface/transformers')) as any;
		const pipeline = transformers.default?.pipeline ?? transformers.pipeline;
		extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
	}
	return extractor;
}

/**
 * Splits lyrics into embedding chunks so that no single chunk exceeds the
 * model's 256-token truncation limit. If the token count is <= 256 a single
 * chunk is returned; otherwise the lyrics are split into exactly 2 halves
 * along the nearest line break to the midpoint.
 */
function getChunks(lyrics: string): string[] {
	// word-piece-ish token estimate: ~4 chars/token is a safe over-estimate
	const estimatedTokens = Math.ceil(lyrics.length / 4);

	if (estimatedTokens <= MAX_TOKENS) return [lyrics];

	const lines = lyrics.split('\n');
	const totalChars = lyrics.length;
	const mid = totalChars / 2;

	let bestIndex = 0;
	let bestDistance = Infinity;
	let running = 0;
	for (let i = 0; i < lines.length - 1; i++) {
		running += lines[i].length + 1; // +1 for the newline
		const distance = Math.abs(running - mid);
		if (distance < bestDistance) {
			bestDistance = distance;
			bestIndex = i + 1;
		}
	}

	const firstHalf = lines.slice(0, bestIndex).join('\n').trim();
	const secondHalf = lines.slice(bestIndex).join('\n').trim();
	return [firstHalf, secondHalf];
}

async function getEmbeddingDev(
	text: string,
	signal?: AbortSignal,
): Promise<number[]> {
	if (signal?.aborted) throw new Error('Aborted');
	const ext = await getExtractor();
	if (signal?.aborted) throw new Error('Aborted');
	const output = await ext(text, { pooling: 'mean', normalize: true });
	if (signal?.aborted) throw new Error('Aborted');
	return Array.from(output.data) as number[];
}

async function getEmbeddingProd(
	text: string,
	signal?: AbortSignal,
): Promise<number[]> {
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

export async function processSong(
	spotifyTrack: SpotifyTrack,
	signal?: AbortSignal,
): Promise<(Song & { embeddingData?: number[] | null }) | null> {
	if (signal?.aborted) throw new Error('Aborted');
	const existing = await getSong(spotifyTrack.id);

	if (existing) {
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

		if (!existing.isComplete) {
			try {
				const refreshed = await embedSong(spotifyTrack, existing, signal);
				if (refreshed) return refreshed;
			} catch (err: any) {
				if (signal?.aborted) throw new Error('Aborted');
				console.error(
					`Failed to upgrade incomplete song ${existing.title}, returning as-is:`,
					err,
				);
			}
		}
		return existing;
	}

	const song = await embedSong(spotifyTrack, undefined, signal);

	return song;
}

export async function getEmbedding(
	text: string,
	signal?: AbortSignal,
): Promise<number[]> {
	const chunks = getChunks(text);
	const embeddings = await Promise.all(
		chunks.map((chunk) =>
			process.env.NODE_ENV === 'production'
				? getEmbeddingProd(chunk, signal)
				: getEmbeddingDev(chunk, signal),
		),
	);
	return getCentroid(embeddings);
}
