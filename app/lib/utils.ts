import { getArtistsAlbums, getRelatedArtists, getTracks } from './spotify';
import { LRCLibResult, singleTrack, trackTypes } from '../types';

import pLimit from 'p-limit';

import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto-js';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY as string);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const key = process.env.SECRET_KEY as string;
export const SPOTIFY_PUBLIC_PLAYLIST_ERROR =
	'Spotify could not access this playlist. Please make the playlist public, then try again.';

export const encrypt = (text: string): string => {
	return crypto.AES.encrypt(text, key).toString();
};

export const decrypt = (encryptedText: string): string => {
	const bytes = crypto.AES.decrypt(encryptedText, key);
	const originalText = bytes.toString(crypto.enc.Utf8);

	return originalText;
};

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

/** Maximum number of concurrent Spotify album lookups. */
const ALBUM_LOOKUP_CONCURRENCY = 50;
/** Below this many albums the batch is considered too sparse to be useful. */
const MIN_USEFUL_ALBUMS = 30;
/** Cool-off before retrying a batch that came back too sparse. */
const BATCH_RETRY_DELAY_MS = 5000;

/**
 * Fetches all albums for a list of artists, shuffles them, and returns unique album IDs.
 *
 * Lookups are capped at {@link ALBUM_LOOKUP_CONCURRENCY} concurrent requests and
 * settled individually, so a handful of rate-limited artists can no longer blank
 * out the albums returned by the artists that did succeed. If the batch still
 * comes back too sparse to be useful, it is retried once after a short cool-off.
 *
 * @param artists - Array of artist names
 * @param signal - Optional abort signal
 * @param attempt - Internal batch retry counter; callers should not pass this
 * @returns Array of unique album IDs
 */
export const getEveryAlbum = async (
	artists: string[],
	signal?: AbortSignal,
	attempt = 0,
): Promise<string[]> => {
	if (signal?.aborted) throw new Error('Aborted');

	const limit = pLimit(ALBUM_LOOKUP_CONCURRENCY);
	const shuffled = shuffle(artists);

	const results = await Promise.allSettled(
		shuffled.map((artist) =>
			limit(() => getArtistsAlbums(artist, shuffled.length, signal)),
		),
	);

	if (signal?.aborted) throw new Error('Aborted');

	const failed = results.filter((result) => result.status === 'rejected');
	if (failed.length > 0) {
		console.warn(
			`getEveryAlbum: ${failed.length}/${results.length} artist lookups failed, keeping the rest`,
		);
	}

	const albums = shuffle([
		...new Set(
			results.flatMap((result) =>
				result.status === 'fulfilled' ? result.value : [],
			),
		),
	]).filter((item): item is string => typeof item === 'string');

	if (albums.length < MIN_USEFUL_ALBUMS && artists.length > 0 && attempt === 0) {
		console.log(
			`getEveryAlbum: only ${albums.length} album(s) from ${artists.length} artist(s), retrying batch in ${BATCH_RETRY_DELAY_MS}ms`,
		);
		await sleep(BATCH_RETRY_DELAY_MS, signal);
		return getEveryAlbum(artists, signal, attempt + 1);
	}

	return albums;
};

export const getAllTracks = async (
	albums: string[],
	numTracks: number,
	returnObjects = false,
	signal?: AbortSignal,
): Promise<string[] | singleTrack[] | null> => {
	if (signal?.aborted) throw new Error('Aborted');
	if (!albums || albums.length === 0) {
		console.log('getAllTracks called with empty albums list');
		return [];
	}
	const tracks = await getTracks(albums);

	if (signal?.aborted) throw new Error('Aborted');
	if (!tracks || 'isError' in tracks) {
		console.log('getTracks returned error or nothing:', tracks);
		return null;
	}
	console.log(
		`getTracks returned total ${tracks.length} tracks across all albums`,
	);

	// arrange the tracks into sub arrays based on albums
	const subTracks = tracks.reduce((acc: trackTypes[], item) => {
		const found = acc.find((arr) => arr[0].albumName === item.albumName);
		if (found) {
			found.push(item);
		} else {
			acc.push([item]);
		}
		return acc;
	}, []);

	const removeEmptyObjects = subTracks.map((subArr) =>
		subArr.filter((obj) => Object.keys(obj).length !== 0),
	);

	// get two random track from each sub array
	const result: trackTypes = [];
	removeEmptyObjects.forEach((subarray) => {
		for (let i = 0; i < numTracks; i++) {
			const randomIndex = Math.floor(Math.random() * subarray.length);
			const randomTrack = subarray.splice(randomIndex, 1)[0];
			result.push(randomTrack);
		}
	});

	const filteredResult = result.filter((item) => !!item);

	if (returnObjects) {
		return filteredResult as singleTrack[];
	}

	const allTracksID = filteredResult
		.map((item) => item.uri)
		.filter((item) => !!item)
		.flat();

	return allTracksID as string[];
};

// handle logic for if the link is correct
export function isValidPlaylistLink(link: string) {
	return link.trim().startsWith('https://open.spotify.com/playlist/');
}

export function addPlaylistFullLinkFromID(id: string) {
	return 'https://open.spotify.com/playlist/' + id;
}

// handle logic for if getting the playlist id from the link
export function extractPlaylistId(link: string) {
	const playlistIdStartIndex = link.lastIndexOf('/') + 1;
	const playlistIdEndIndex = link.includes('?')
		? link.indexOf('?')
		: link.length;
	return link.substring(playlistIdStartIndex, playlistIdEndIndex);
}

export const convertToSubArray = (albums: string[]) => {
	const subArrays = [];

	for (let i = 0; i < albums.length; i += 20) {
		subArrays.push(albums.slice(i, i + 20));
	}
	return subArrays;
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

export const logToken = (token?: string) => {
	if (!token) {
		console.log('SPOTIFY TOKEN STATUS: MISSING');
		return;
	}
	console.log(
		`SPOTIFY TOKEN STATUS: PRESENT (Starts with: ${token.substring(0, 10)}...)`,
	);
};

export const formatDate = (date: Date) => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();

	return `${month}/${day}/${year}`;
};

export async function fetchSimilarArtistsFromAI(
	artistNames: string[],
	options: { isNotPopular: boolean; isDifferent: boolean },
	seeds?: { name: string; artist: string; summary?: string | null }[],
): Promise<string[]> {
	const seedContext = seeds?.length
		? `\nMy selected songs for lyrical inspiration are:\n${seeds
				.map(
					(s) =>
						`- "${s.name}" by ${s.artist}${s.summary ? `: ${s.summary}` : ''}`,
				)
				.join('\n')}\n`
		: '';
	const type = options.isDifferent ? 'completely different from' : 'similar to';
	const popularity = options.isNotPopular ? 'not popular' : 'popular';
	const prompt = `analyze the following list of musicians: '${artistNames.join(
		', ',
	)}', and identify the sub-genre that is associated with 70 - 90% of them.${seedContext}Based on this analysis${
		seeds?.length ? ' AND the lyrical themes of my selected songs' : ''
	}, please provide a list of 20 musicians who are ${popularity} and are ${type} the sub-genres. Please ensure that the resulting list does not include any of the musicians from the original list provided. Only provide the list of recommended musicians separated by commas and nothing else.`;

	const result = await model.generateContent(prompt);
	const response = await result.response;
	const text = response.text();
	console.log('RAW AI TEXT RESPONSE:', text);

	const artistList = text.replace(/:\n/g, '').trimStart().split(':');
	const lastPart = artistList.length > 0 ? artistList.at(-1) : undefined;
	let finalList = lastPart ? lastPart.split(', ') : [];

	// Try comma split directly if the colon logic failed to extract them
	if (finalList.length <= 1 && text.includes(',')) {
		finalList = text.split(',').map((s) => s.trim());
	}

	if (finalList.length > 20) finalList.length = 20;

	// Remove original artists from the final list
	const filteredList = finalList.filter(
		(artist) =>
			!artistNames.some(
				(originalArtist) =>
					originalArtist.toLowerCase() === artist.toLowerCase(),
			),
	);

	console.log('PARSED FINAL LIST:', filteredList);
	return filteredList;
}

// export const getAllTracks = async (albums) => {
//   const getAlbumTracks = albums.map(getOneAlbumTrack)
//   const tracks = await Promise.all(getAlbumTracks);
//   const flattenedTracks = tracks.flat();

//   const nonEmptyTracks = flattenedTracks.filter((track) => {
//     if (track.toLowerCase().includes('spotify:track:')) return true

//     return false
//   });

//   return nonEmptyTracks;
// }

export async function relatedArists(
	artistNames: string[],
	options: { isNotPopular: boolean; isDifferent: boolean },
	signal?: AbortSignal,
	extraExcludedArtists?: string[],
) {
	const relatedArtistsPerSeed = [];
	const batches = [];

	for (let i = 0; i < artistNames.length; i += 3) {
		batches.push(artistNames.slice(i, i + 3));
	}

	for (const batch of batches) {
		if (signal?.aborted) throw new Error('Aborted');
		const results = await Promise.all(
			batch.map(async (name) => {
				const related = await getRelatedArtists(name, options, signal);
				return shuffle(related);
			}),
		);
		relatedArtistsPerSeed.push(...results);
		if (signal?.aborted) throw new Error('Aborted');
		await new Promise((r) => setTimeout(r, 300));
	}

	// Round robin — take one from each artist at a time until we have 65
	shuffle(relatedArtistsPerSeed);
	// Mutable working copies — we splice from these
	const workingLists: string[][] = relatedArtistsPerSeed.map((arr) => [...arr]);

	const finalList: string[] = [];
	// Use a Set for O(1) duplicate checks instead of .map().includes() (O(n) per lookup)
	const finalSet = new Set<string>();
	const excluded = new Set([
		...artistNames.map((n) => n.toLowerCase()),
		...(extraExcludedArtists || []).map((n) => n.toLowerCase()),
	]);

	while (finalList.length < 65 && workingLists.length > 0) {
		// Iterate in reverse so we can safely splice exhausted lists out
		for (let i = workingLists.length - 1; i >= 0; i--) {
			if (finalList.length >= 65) break;

			const pool = workingLists[i];
			// Find a valid candidate at a random position within this seed's remaining list
			// Shuffle the pool indices so we don't always start from index 0
			let picked = false;
			const startIdx = Math.floor(Math.random() * pool.length);
			for (let offset = 0; offset < pool.length; offset++) {
				const idx = (startIdx + offset) % pool.length;
				const name = pool[idx];
				if (!excluded.has(name.toLowerCase()) && !finalSet.has(name.toLowerCase())) {
					finalList.push(name);
					finalSet.add(name.toLowerCase());
					pool.splice(idx, 1); // remove so it can't be re-picked
					picked = true;
					break;
				}
			}
			// Prune this seed's list from the rotation if it's now empty
			if (pool.length === 0) {
				workingLists.splice(i, 1);
			}
		}
	}

	return finalList;
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

export function formatPlaylistOutput(
	playlist: {
		playlistLink: string | null;
		playlistName: string | null;
		completedAt: Date | null;
	} | null,
) {
	return playlist
		? {
				link: playlist.playlistLink ?? '',
				name: playlist.playlistName ?? '',
				completedAt: playlist.completedAt,
			}
		: null;
}

export const isSpotifyPlaylistPermissionError = (err: any) => {
	const statusCode = err?.statusCode ?? err?.status ?? err?.response?.status;
	const errorStatus =
		err?.body?.error?.status ?? err?.response?.body?.error?.status;
	const message = [
		err?.message,
		err?.body?.error?.message,
		err?.body?.error,
		err?.response?.body?.error?.message,
		err?.response?.body?.error,
	]
		.filter(Boolean)
		.join(' ')
		.toLowerCase();

	return (
		statusCode === 403 || errorStatus === 403 || message.includes('forbidden')
	);
};

export const getPlaylistTracks = async (
	playlistId: string,
	includeDetails = false,
) => {
	const response = await fetch('/api/playlist/tracks', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ playlistId }),
	});
	const data = await response.json();

	if (!response.ok) {
		throw data;
	}

	return includeDetails ? data : data.tracks;
};

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

export function shuffle<T>(array: T[]): T[] {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}
