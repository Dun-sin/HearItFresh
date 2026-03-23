import { getArtistsAlbums, getRelatedArtists, getTracks } from './spotify';
import { singleTrack, trackTypes } from '../types';

import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto-js';

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY as string);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const key = process.env.secretKey as string;

export const encrypt = (text: string): string => {
	return crypto.AES.encrypt(text, key).toString();
};

export const decrypt = (encryptedText: string): string => {
	const bytes = crypto.AES.decrypt(encryptedText, key);
	const originalText = bytes.toString(crypto.enc.Utf8);

	return originalText;
};

/**
 * Fetches all albums for a list of artists, shuffles them, and returns unique album IDs.
 * @param artists - Array of artist names
 * @returns Array of unique album IDs
 */
export const getEveryAlbum = async (artists: string[]) => {
  const shuffled = [...artists].sort(() => Math.random() - 0.5)
  const artistAlbums = shuffled.map((item) =>
    getArtistsAlbums(item, shuffled.length),
  )
  const albumArray = await Promise.all(artistAlbums)
  const albums = [...new Set(albumArray.flat())].sort(() => Math.random() - 0.5)
  const stringAlbums = albums.filter((item) => typeof item === 'string')

  return stringAlbums
}

export const getAllTracks = async (
	albums: string[],
	numTracks: number,
	returnObjects = false,
): Promise<string[] | singleTrack[] | null> => {
	if (!albums || albums.length === 0) {
		console.log('getAllTracks called with empty albums list');
		return [];
	}
	const tracks = await getTracks(albums);

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

	// get one random track from each sub array
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
		.filter((item) => !!item);

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

export function cleanLyrics(raw: string): {
	summary: string | null;
	lyrics: string;
} {
	const firstBracket = raw.indexOf('[');
	if (firstBracket === -1) return { summary: null, lyrics: raw };

	const before = raw.slice(0, firstBracket).trim();
	const after = raw
		.slice(firstBracket)
		.replace(/\[.*?\]/g, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	// strip the contributor count from the start e.g. "97 ContributorsTranslations..."
	const summary =
		before.replace(/^\d+\s*Contributors?.*?(?=\w{10})/s, '').trim() || null;

	return { summary, lyrics: after };
}

export async function relatedArists(
	artistNames: string[],
	options: { isNotPopular: boolean; isDifferent: boolean },
) {
	const relatedArtistsPerSeed = [];
	const batches = [];

	for (let i = 0; i < artistNames.length; i += 3) {
		batches.push(artistNames.slice(i, i + 3));
	}

	for (const batch of batches) {
		const results = await Promise.all(
			batch.map(async (name) => {
				const related = await getRelatedArtists(name, options);
				return related.sort(() => Math.random() - 0.5);
			}),
		);
		relatedArtistsPerSeed.push(...results);
		await new Promise((r) => setTimeout(r, 300));
	}

	// Round robin — take one from each artist at a time until we have 20
	const finalList: string[] = [];
	const excluded = new Set(artistNames.map((n) => n.toLowerCase()));
	let round = 0;

	while (finalList.length < 20) {
		let addedThisRound = 0;

		for (const artistRelated of relatedArtistsPerSeed) {
			if (finalList.length >= 40) break;

			// find next unused artist from this seed's related list
			const candidate = artistRelated.find(
				(name) =>
					!excluded.has(name.toLowerCase()) &&
					!finalList.map((n) => n.toLowerCase()).includes(name.toLowerCase()),
			);

			if (candidate) {
				finalList.push(candidate);
				addedThisRound++;
			}
		}

		// if no new artists were added this round, we've exhausted all options
		if (addedThisRound === 0) break;
		round++;
	}

	return finalList;
}
