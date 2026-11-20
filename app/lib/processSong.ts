import axios from 'axios';
import { addEmbeddingToSong, clearSongEmbedding, getSong } from './db';
import { Song } from '../generated/prisma';
import { SpotifyTrack } from '../types';
import { getWeightedCentroid } from './utils';
import { embedSong } from './lyrics';
import { syncSongThemes } from './themes/persist';
import { describeSync, planSync } from './themes/versions';
import {
	chunkForEmbedding,
	EMBEDDING_VERSION,
	prepareLyricsForEmbedding,
} from './embedding/prepare';


export type EmbeddableRow = {
	id: string;
	title: string;
	lyrics: string | null;
	embedding: unknown;
	embeddingVersion: number | null;
};

let extractor: any = null;

const parseStoredEmbedding = (value: unknown): number[] | null =>
	typeof value === 'string'
		? JSON.parse(value)
		: Array.isArray(value)
			? value
			: null;

async function getExtractor() {
	if (!extractor) {
		const transformers = (await import('@huggingface/transformers')) as any;
		const pipeline = transformers.default?.pipeline ?? transformers.pipeline;
		extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
	}
	return extractor;
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
	const { data } = await axios.post(
		'https://api.deepinfra.com/v1/openai/embeddings',
		{
			model: 'sentence-transformers/all-MiniLM-L6-v2',
			input: text,
			encoding_format: 'float',
		},
		{
			headers: {
				Authorization: `Bearer ${process.env.DEEPINFRA_TOKEN}`,
			},
			signal,
		},
	);
	return data.data[0].embedding;
}

export async function processSong(
	spotifyTrack: SpotifyTrack,
	signal?: AbortSignal,
	{ classifyThemes = true }: { classifyThemes?: boolean } = {},
): Promise<(Song & { embeddingData?: number[] | null }) | null> {
	if (signal?.aborted) throw new Error('Aborted');
	const existing = await getSong(
		spotifyTrack.id,
		spotifyTrack.provider ?? 'spotify',
	);

	if (existing) {
		const embeddingData = await syncSongEmbedding(existing, signal);

		let themes: string[] = existing.themes ?? [];

		const pendingSync = classifyThemes
			? describeSync(planSync(existing))
			: null;
		if (pendingSync) {
			if (signal?.aborted) throw new Error('Aborted');
			console.log(`Themes for ${existing.title}: ${pendingSync}`);
			const synced = await syncSongThemes(existing, signal);
			if (synced) themes = synced;
		}

		if (!existing.isComplete) {
			try {
				const refreshed = await embedSong(
					spotifyTrack,
					existing,
					signal,
					classifyThemes,
				);
				if (refreshed) return refreshed;
			} catch (err: any) {
				if (signal?.aborted) throw new Error('Aborted');
				console.error(
					`Failed to upgrade incomplete song ${existing.title}, returning as-is:`,
					err,
				);
			}
		}

		if (!existing.lyrics?.trim()) return null;

		return { ...existing, themes, embeddingData };
	}

	const song = await embedSong(
		spotifyTrack,
		undefined,
		signal,
		classifyThemes,
	);

	return song;
}

export async function getEmbedding(
	lyrics: string,
	signal?: AbortSignal,
): Promise<number[] | null> {
	const chunks = chunkForEmbedding(prepareLyricsForEmbedding(lyrics));
	if (chunks.length === 0) return null;

	const embeddings = await Promise.all(
		chunks.map(({ text }) =>
			process.env.NODE_ENV === 'production'
				? getEmbeddingProd(text, signal)
				: getEmbeddingDev(text, signal),
		),
	);
	return getWeightedCentroid(
		embeddings,
		chunks.map(({ tokens }) => tokens),
	);
}

export async function syncSongEmbedding(
	row: EmbeddableRow,
	signal?: AbortSignal,
): Promise<number[] | null> {
	const stored = parseStoredEmbedding(row.embedding);
	if (stored && row.embeddingVersion === EMBEDDING_VERSION) return stored;
	if (!row.lyrics) return stored;

	if (signal?.aborted) throw new Error('Aborted');
	console.log(`Re-embedding ${row.title}`);
	const embedding = await getEmbedding(row.lyrics, signal);
	if (signal?.aborted) throw new Error('Aborted');
	if (!embedding) {
		if (stored) await clearSongEmbedding(row.id);
		return null;
	}

	await addEmbeddingToSong(row.id, embedding, EMBEDDING_VERSION);
	return embedding;
}
