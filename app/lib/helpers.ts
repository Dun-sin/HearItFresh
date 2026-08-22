import {
	getArtistsAlbums,
	getArtistAlbumsById,
	getTracks,
	resolveArtistsWithFollowers,
	ResolvedSpotifyArtist,
	isPopularArtistByFollowers,
} from './spotify';
import { singleTrack, trackTypes } from '../types';

import pLimit from 'p-limit';

import { GoogleGenerativeAI } from '@google/generative-ai';

import { shuffle, sleep } from './utils';

/**
 * A single artist to fetch albums for: either a raw Last.fm name (popular
 * path, which never needed a Spotify lookup) or a Spotify-resolved artist
 * (non-popular path, which carried the id back from the follower filter so the
 * album fetch skips a second search).
 */
export type AlbumLookupArtist = string | ResolvedSpotifyArtist;

export const SPOTIFY_PUBLIC_PLAYLIST_ERROR =
	'Spotify could not access this playlist. Please make the playlist public, then try again.';

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

/**
 * Builds the artist-only playlist title, e.g.
 * `Songs from {artist} we thought you might like from @hearitfresh.fav...`.
 * If the full name exceeds Spotify's 100-character playlist-name limit, the
 * artist portion is trimmed so the source and intent stay clear.
 */
export function buildArtistPlaylistName(artistName: string): string {
	const SUFFIX = ' you might like from @hearitfresh.favour.dev';
	const PREFIX = 'Songs from ';
	const MAX_NAME_LENGTH = 100;

	const full = `${PREFIX}${artistName}${SUFFIX}`;
	if (full.length <= MAX_NAME_LENGTH) return full;

	const available = MAX_NAME_LENGTH - PREFIX.length - SUFFIX.length - 1;
	const trimmedArtist =
		artistName.length > available
			? artistName.slice(0, Math.max(available, 0)).trimEnd() + '…'
			: artistName;

	return `${PREFIX}${trimmedArtist}${SUFFIX}`;
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

export const logToken = (token?: string) => {
	if (!token) {
		console.log('SPOTIFY TOKEN STATUS: MISSING');
		return;
	}
	console.log(
		`SPOTIFY TOKEN STATUS: PRESENT (Starts with: ${token.substring(0, 10)}...)`,
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

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY as string);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
 * @param artists - Array of artist names or resolved Spotify artists. Resolved
 * artists reuse their cached id for the album lookup; plain names search once.
 * @param signal - Optional abort signal
 * @param attempt - Internal batch retry counter; callers should not pass this
 * @returns Array of unique album IDs
 */
export const getEveryAlbum = async (
	artists: AlbumLookupArtist[],
	signal?: AbortSignal,
	attempt = 0,
): Promise<string[]> => {
	if (signal?.aborted) throw new Error('Aborted');

	const limit = pLimit(ALBUM_LOOKUP_CONCURRENCY);
	const shuffled = shuffle(artists);

	const results = await Promise.allSettled(
		shuffled.map((artist) =>
			limit(() =>
				typeof artist === 'string'
					? getArtistsAlbums(artist, shuffled.length, signal)
					: getArtistAlbumsById(
							artist.id,
							artist.name,
							shuffled.length,
							signal,
						),
			),
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

	if (
		albums.length < MIN_USEFUL_ALBUMS &&
		artists.length > 0 &&
		attempt === 0
	) {
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

/**
 * A candidate returned by `getRelatedArtists`: either a raw Last.fm name (the
 * popular/default path, which never touched Spotify) or a Spotify-resolved
 * artist (the non-popular path, which carries the id back from the follower
 * filter). The behavioral identity for dedup/exclusion is always the name.
 */
export type RelatedArtistCandidate = string | ResolvedSpotifyArtist;

/** Extracts the dedup/exclusion identity (the artist name) from a candidate. */
export const artistNameOf = (artist: RelatedArtistCandidate) =>
	typeof artist === 'string' ? artist : artist.name;

/**
 * `relatedArists` only round-robins ~65 artists across every seed, so resolving
 * more than this per seed just burns Spotify quota.
 */
export async function relatedArists(
	artistNames: string[],
	options: { isNotPopular: boolean; isDifferent: boolean },
	signal?: AbortSignal,
	extraExcludedArtists?: string[],
) {
	const relatedArtistsPerSeed: RelatedArtistCandidate[][] = [];
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
	const workingLists: RelatedArtistCandidate[][] = relatedArtistsPerSeed.map(
		(arr) => [...arr],
	);

	const finalList: RelatedArtistCandidate[] = [];
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
				const candidate = pool[idx];
				const candidateName = artistNameOf(candidate);
				if (
					!excluded.has(candidateName.toLowerCase()) &&
					!finalSet.has(candidateName.toLowerCase())
				) {
					finalList.push(candidate);
					finalSet.add(candidateName.toLowerCase());
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

export async function getRelatedArtists(
	artistName: string,
	options: { isNotPopular: boolean; isDifferent: boolean },
	signal?: AbortSignal,
): Promise<RelatedArtistCandidate[]> {
	try {
		const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=60`;

		const res = await fetch(url, { signal });
		const data = await res.json();

		if (!data.similarartists?.artist) return [];

		const similarArtists = data.similarartists.artist as { name: string }[];

		const candidates = shuffle([
			...new Map(
				similarArtists
					.map((artist) => artist.name?.trim())
					.filter((name): name is string => !!name)
					.map((name) => [name.toLowerCase(), name] as const),
			).values(),
		]);

		if (!options.isNotPopular) return shuffle(candidates);

		const shouldKeepArtist = (followers: number) =>
			!isPopularArtistByFollowers(followers);

		const artists = await resolveArtistsWithFollowers(
			candidates,
			shouldKeepArtist,
			signal,
		);

		return shuffle(
			artists.filter(({ followers }) => shouldKeepArtist(followers)),
		);
	} catch (err: any) {
		if (signal?.aborted) throw new Error('Aborted');
		console.error(`Error getting related artists for ${artistName}:`, err);
		return [];
	}
}
