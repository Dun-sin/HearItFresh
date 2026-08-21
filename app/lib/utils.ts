import crypto from 'crypto-js';

import { LRCLibResult } from '../types';

const key = process.env.SECRET_KEY as string;

export function shuffle<T>(array: T[]): T[] {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export const convertToSubArray = (albums: string[]): string[][] => {
	const subArrays: string[][] = [];

	for (let i = 0; i < albums.length; i += 20) {
		subArrays.push(albums.slice(i, i + 20));
	}
	return subArrays;
};

export const formatDate = (date: Date) => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();

	return `${month}/${day}/${year}`;
};

export function formatRelativeTime(value: Date | string) {
	const date = value instanceof Date ? value : new Date(value);
	const diffMs = Date.now() - date.getTime();
	const absSeconds = Math.max(Math.floor(Math.abs(diffMs) / 1000), 0);
	const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

	if (absSeconds < 60) return rtf.format(-absSeconds, 'second');
	const minutes = Math.floor(absSeconds / 60);
	if (minutes < 60) return rtf.format(-minutes, 'minute');
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return rtf.format(-hours, 'hour');
	const days = Math.floor(hours / 24);
	if (days < 7) return rtf.format(-days, 'day');
	const weeks = Math.floor(days / 7);
	if (weeks < 5) return rtf.format(-weeks, 'week');
	const months = Math.floor(days / 30);
	if (months < 12) return rtf.format(-months, 'month');
	const years = Math.floor(days / 365);
	return rtf.format(-Math.max(years, 1), 'year');
}

/**
 * Waits for `ms` milliseconds, rejecting early with an `Aborted` error if the
 * provided signal aborts. Shared by every retry/backoff path so the delay logic
 * (and its abort handling) lives in exactly one place.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		if (signal?.aborted) {
			reject(new Error('Aborted'));
			return;
		}

		const timer = setTimeout(resolve, ms);
		signal?.addEventListener(
			'abort',
			() => {
				clearTimeout(timer);
				reject(new Error('Aborted'));
			},
			{ once: true },
		);
	});
}

/**
 * Formats a Spotify follower count for display (e.g. `1.2M`), returning null
 * when the count is unknown so callers can hide the label entirely.
 */
export function formatFollowerCount(followers?: number | null): string | null {
	if (typeof followers !== 'number' || !Number.isFinite(followers)) return null;

	return new Intl.NumberFormat('en', {
		notation: 'compact',
		maximumFractionDigits: 1,
	}).format(followers);
}

export function normalizeStatus(status?: string) {
	if (!status) return status;
	const lowerStatus = status.toLowerCase();

	if (lowerStatus === 'completed') return 'Completed';
	if (lowerStatus === 'failed') return 'Failed';
	if (lowerStatus === 'cancelled' || lowerStatus === 'canceled')
		return 'Cancelled';
	if (lowerStatus === 'running') return 'Running';
	if (lowerStatus === 'scheduled') return 'Scheduled';

	return status;
}

export function normalizeOutput(
	output: unknown,
): { link: string; name: string } | null {
	if (!output) return null;

	const parsedOutput =
		typeof output === 'string' ? safeParseJson(output) : output;

	if (
		parsedOutput &&
		typeof parsedOutput === 'object' &&
		'link' in parsedOutput &&
		'name' in parsedOutput
	) {
		return {
			link: String(parsedOutput.link),
			name: String(parsedOutput.name),
		};
	}

	return null;
}

function safeParseJson(value: string) {
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

export const encrypt = (text: string): string => {
	return crypto.AES.encrypt(text, key).toString();
};

export const decrypt = (encryptedText: string): string => {
	const bytes = crypto.AES.decrypt(encryptedText, key);
	const originalText = bytes.toString(crypto.enc.Utf8);

	return originalText;
};

/**
 * Calculates the cosine similarity between two vectors (embeddings) to measure how closely they match.
 * Returns a score from -1 (completely opposite) to 1 (exact match).
 * In our context, this compares an AI-generated track's lyrical embedding to the seeds' average embedding.
 *
 * @param embA The first embedding vector
 * @param embB The second embedding vector
 * @returns {number} The cosine similarity score
 */
export function calculateCosineSimilarity(
	embA: number[],
	embB: number[],
): number {
	if (embA.length !== embB.length || embA.length === 0) return 0;
	let dotProduct = 0;
	let magA = 0;
	let magB = 0;
	for (let i = 0; i < embA.length; i++) {
		dotProduct += embA[i] * embB[i];
		magA += embA[i] * embA[i];
		magB += embB[i] * embB[i];
	}
	if (magA === 0 || magB === 0) return 0;
	return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Calculates the "center of mass" (centroid) for a group of embeddings.
 * It adds up all dimensions across the provided embeddings and divides by the total number of embeddings.
 * In our context, this creates a single embedding that represents the "average musical traits" of the user's selected seed songs.
 *
 * @param embeddings An array of numerical embedding arrays
 * @returns {number[]} A single embedding array representing the average
 */
export function getCentroid(embeddings: number[][]): number[] {
	if (embeddings.length === 0) return [];
	const dim = embeddings[0].length;
	const centroid = new Array(dim).fill(0);
	for (const emb of embeddings) {
		for (let i = 0; i < dim; i++) centroid[i] += emb[i];
	}
	for (let i = 0; i < dim; i++) centroid[i] /= embeddings.length;
	return centroid;
}

export function isLRCLibResult(value: unknown): value is LRCLibResult {
	return (
		typeof value === 'object' &&
		value !== null &&
		('plainLyrics' in value || 'artistName' in value || 'trackName' in value)
	);
}

export function cleanMusicMetadata(text: string): string {
	return (
		text
			// 1. Remove everything after common trailing dividers
			.split(/ - (?:19|20)\d{2}\b| - Remaster| - Live| - Radio Edit/i)[0]
			// 2. Strip brackets and parentheses containing features, remasters, or audio types
			.replace(
				/\s*[\(\[][^]*?(?:feat|ft|remaster|live|official|version|explicit|mono|stereo|bonus|audio|video)[^]*?[\)\]]/gi,
				'',
			)
			// 3. Remove clean remnants that might be missed
			.replace(
				/\s*-\s*(?:remastered|live|radio edit|studio version|mono|stereo)\b/gi,
				'',
			)
			// 4. Remove clean accidental double spaces or trailing whitespace
			.replace(/\s+/g, ' ')
			.trim()
	);
}
