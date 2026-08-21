import { playlistDetails, singleTrack, trackTypes } from '../types';
import spotifyApi, { setAccessToken } from './spotifyApi';
import { getDummyAccessToken } from './spotify-dummy-auth';

import pLimit from 'p-limit';

import { shuffle, convertToSubArray, sleep, cleanMusicMetadata } from './utils';

const ALBUM_BLACKLIST_WORDS = [
	'remix',
	'mix',
	'edit',
	'radio',
	'- live',
	' ver.',
	'live-',
	'version',
	'tour',
	'live',
	'event',
	'concert',
	'tour',
	'extended',
	'special edition',
	'bonus track',
];
const EDITION_KEYWORDS = [
	'deluxe',
	'edition',
	'bonus',
	'expanded',
	'anniversary',
	'remastered',
	'special',
];

/**
 * Popularity is classified by Spotify follower count (see
 * `isPopularArtistByFollowers`), but Last.fm's similar-artist endpoint only
 * returns names. Every candidate therefore costs one Spotify artist lookup, so
 * lookups are concurrency-capped, cached per process, and resolved in chunks
 * that stop early once enough candidates land on the requested side of the
 * threshold.
 */
export const MAX_FOLLOWER_LOOKUP_ATTEMPTS = 3;
export const FOLLOWER_LOOKUP_CONCURRENCY = 10;
export const FOLLOWER_LOOKUP_CHUNK_SIZE = 20;
/**
 * `relatedArists` only round-robins ~65 artists across every seed, so resolving
 * more than this per seed just burns Spotify quota.
 */
export const MAX_MATCHING_ARTISTS_PER_SEED = 40;
const ARTIST_FOLLOWER_CACHE_LIMIT = 5000;

export type ArtistWithFollowers = { name: string; followers: number };

/**
 * name (lowercased) -> follower count, or null when Spotify has no such artist.
 * Shared across seeds and retry attempts within a process so the same name is
 * never looked up twice.
 */
export const artistFollowerCache = new Map<string, number | null>();

/**
 * Spotify follower count that separates "popular" from "non-popular" artists.
 * Declared once here so the search route, the options UI, and the playlist
 * generation pipeline can never drift apart on what "popular" means.
 */
export const SPOTIFY_POPULAR_ARTIST_FOLLOWER_THRESHOLD = 500_000;

/**
 * Single source of truth for the popularity split: an artist is popular once
 * their Spotify follower count reaches
 * {@link SPOTIFY_POPULAR_ARTIST_FOLLOWER_THRESHOLD}. A missing count is treated
 * as 0 followers (i.e. not popular).
 */
export function isPopularArtistByFollowers(followers?: number) {
	return (followers ?? 0) >= SPOTIFY_POPULAR_ARTIST_FOLLOWER_THRESHOLD;
}

/**
 * Strips a parenthetical/bracketed edition suffix from an album title and
 * lowercases/trims the result, so variants like "Love Is Like" and
 * "Love Is Like (Deluxe)" collapse to the same base title.
 */
function normalizeAlbumTitle(name: string): string {
	const trimmed = name.trim();
	const withoutSuffix = trimmed.replace(
		/[([{][^()[\]{}]*[)\]}]?$/i,
		(suffix) => {
			const inner = suffix
				.replace(/^[([{]+|[)\]}]+$/g, '')
				.trim()
				.toLowerCase();
			if (
				EDITION_KEYWORDS.some((kw) => {
					const words = inner.split(/[\s/&-]+/);
					return words.includes(kw) || inner.includes(kw);
				})
			) {
				return '';
			}
			return suffix;
		},
	);
	return withoutSuffix.trim().toLowerCase();
}

/**
 * Drops blacklisted albums (remix/live/etc.) and collapses edition variants
 * (Deluxe/Remastered) so "Album" and "Album (Deluxe)" map to one base title.
 * Shared by both the seed-artist path and the single-artist discography path.
 */
export function deduplicateAlbums<T extends { name: string; id: string }>(
	albums: T[],
): T[] {
	const filtered = albums.filter((album) => {
		const name = album.name.toLowerCase();
		return !ALBUM_BLACKLIST_WORDS.some((word) => name.includes(word));
	});

	const seenBaseTitles = new Map<string, T>();
	const deduplicated: T[] = [];
	for (const album of filtered) {
		const baseTitle = normalizeAlbumTitle(album.name);
		const existing = seenBaseTitles.get(baseTitle);
		if (!existing) {
			seenBaseTitles.set(baseTitle, album);
			deduplicated.push(album);
			continue;
		}
		const existingIsStandard =
			normalizeAlbumTitle(existing.name) === existing.name.trim().toLowerCase();
		const currentIsStandard =
			normalizeAlbumTitle(album.name) === album.name.trim().toLowerCase();
		if (!existingIsStandard && currentIsStandard) {
			seenBaseTitles.set(baseTitle, album);
			deduplicated[deduplicated.indexOf(existing)] = album;
		}
	}
	return deduplicated;
}

export function cacheArtistFollowers(
	cacheKey: string,
	followers: number | null,
) {
	if (artistFollowerCache.size >= ARTIST_FOLLOWER_CACHE_LIMIT) {
		artistFollowerCache.clear();
	}
	artistFollowerCache.set(cacheKey, followers);
}

/**
 * Retrieves all tracks in a Spotify playlist using the provided link.
 * @async
 * @function getAllTracksInAPlaylist
 * @param {string} link - The link to the Spotify playlist.
 * @returns {Array} An array of track objects, each containing information about a track in the playlist.
 * @throws {Error} An error object with details of the error, if an error occurs while retrieving the playlist tracks.
 */
export async function getAllTracksInAPlaylist(link: string): Promise<any> {
	try {
		const data = await spotifyApi.getPlaylistTracks(link);
		return data.body.items;
	} catch (err) {
		return err;
	}
}

export async function getPlaylistDetails(playlistId: string) {
	try {
		const data = await spotifyApi.getPlaylist(playlistId, {
			fields: 'id,name,images,tracks.total',
		});

		return {
			id: data.body.id,
			name: data.body.name,
			imageUrl: data.body.images?.[0]?.url ?? null,
			totalTracks: data.body.tracks?.total ?? null,
		};
	} catch (err) {
		return err;
	}
}

/**
 *   Creates a new playlist on Spotify with a specific name and description based on the provided artists.
 **/
export async function createPlayList(
	name: string,
	artists: string,
	type?: 'new' | 'old',
): Promise<playlistDetails | { isError: boolean; err: any }> {
	let description = '';
	if (type === 'new') {
		description = `Listen To Something New From ${artists}`;
	} else if (type === 'old') {
		description = `Listen to songs from your favourite artists ${artists}`;
	}
	try {
		const data = await spotifyApi.createPlaylist(name, {
			description: description,
			public: true,
		});
		return {
			id: data.body.uri,
			link: data.body.external_urls.spotify,
			name: data.body.name,
		};
	} catch (err) {
		console.log(err);
		return { isError: true, err };
	}
}

/**
 *   Adds an array of track URIs to a Spotify playlist with the specified ID.
 *   @async
 *   @function addTracksToPlayList
 *   @param {string[]} tracks - An array of track URIs to add to the playlist.
 *   @param {string} playListID - The ID of the playlist to add the tracks to.
 *   @returns {Promise<Object>} A promise that resolves with the data returned by the Spotify API if successful
 *   @throws {Error} - If there is an error fetching data from the Spotify Web API.
 **/
export async function addTracksToPlayList(
	tracks: string[],
	playListID: string,
) {
	try {
		const _data = await spotifyApi.addTracksToPlaylist(playListID, tracks);
		return _data;
	} catch (err) {
		return err;
	}
}

/**
 *   This asynchronous function takes an artist name as its input, searches for the artist using the Spotify Web API's searchArtists method,
 *   retrieves their top 10 albums using the getArtistAlbums method, removes any remixes or duplicate tracks, and returns up to five randomly
 *   selected album IDs. If the artist has fewer than five albums, it returns all of the available album IDs.
 *
 *   Handles one artist only: 429 responses are retried in place (honouring `retry-after`) up to
 *   MAX_ARTIST_ATTEMPTS times, and the function always resolves to a stable `string[]` so callers
 *   never have to special-case error objects.
 **/
const MAX_ARTIST_ATTEMPTS = 3;

export async function getArtistsAlbums(
	artist: string,
	artistsLength: number,
	signal?: AbortSignal,
): Promise<string[]> {
	const maxAlbums =
		artistsLength >= 20
			? 5
			: Math.max(1, Math.floor(100 / (artistsLength * 2)));

	for (let attempt = 0; attempt < MAX_ARTIST_ATTEMPTS; attempt++) {
		try {
			const _data = await spotifyApi.searchArtists(artist, {
				limit: 1,
				offset: 0,
			});
			if (!_data.body.artists?.items[0]) {
				console.log(`Artist not found: ${artist}`);
				return [];
			}
			const artistId = _data.body.artists?.items[0].id as string;
			const options = {
				limit: 10,
				album_type: 'album',
				include_groups: 'album',
			};
			const data = await spotifyApi.getArtistAlbums(artistId, options);

			const deduplicated = deduplicateAlbums(data.body.items);

			if (maxAlbums >= deduplicated.length) {
				return deduplicated.map((item: { id: any }) => item.id);
			} else {
				const sortedAlbum = shuffle(deduplicated);
				const randomlySelectedAlbum = sortedAlbum
					.slice(0, maxAlbums)
					.map((item: { id: any }) => item.id);
				return randomlySelectedAlbum;
			}
		} catch (err: any) {
			const status = err?.statusCode ?? err?.status ?? err?.response?.status;
			const retryAfter = Number(
				err?.headers?.['retry-after'] ??
					err?.response?.headers?.['retry-after'],
			);

			if (status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
				console.log(
					`Rate limited (429) for ${artist}, retrying after ${retryAfter}s (attempt ${attempt + 1}/${MAX_ARTIST_ATTEMPTS})`,
				);
				// Let an abort propagate so the caller can stop the whole batch.
				await sleep(retryAfter * 1000, signal);
				continue;
			}

			console.error(
				`Error in getArtistsAlbums for ${artist}:`,
				err?.message || err,
			);
			if (err?.response?.body)
				console.error('Spotify API Error Body:', err.response.body);
			return [];
		}
	}

	console.error(
		`getArtistsAlbums exhausted ${MAX_ARTIST_ATTEMPTS} retries for ${artist}`,
	);
	return [];
}

/**
 * Fetches the full discography (albums + singles) for a given Spotify artist
 * id and returns a stable `singleTrack[]` suitable for the scoring pipeline.
 *
 * Unlike `getArtistsAlbums`, this path already has the canonical `artistId`
 * from search, so it does not re-search by name (avoiding ambiguity and
 * duplicate artist matches). 429s are retried in place honouring `retry-after`.
 */
const MAX_DISCOGRAPHY_ATTEMPTS = 3;

export async function getArtistDiscographyTracks(
	artistId: string,
	signal?: AbortSignal,
): Promise<singleTrack[]> {
	for (let attempt = 0; attempt < MAX_DISCOGRAPHY_ATTEMPTS; attempt++) {
		try {
			const albums = await spotifyApi.getArtistAlbums(artistId, {
				limit: 50,
				include_groups: 'album,single',
			});

			const deduplicatedAlbums = deduplicateAlbums(albums.body.items);

			const albumIds = [...new Set(deduplicatedAlbums.map((item) => item.id))];
			const tracks = await getTracks(albumIds as string[]);
			return Array.isArray(tracks) ? tracks : [];
		} catch (err: any) {
			const status = err?.statusCode ?? err?.status ?? err?.response?.status;
			const retryAfter = Number(
				err?.headers?.['retry-after'] ??
					err?.response?.headers?.['retry-after'],
			);

			if (status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
				console.log(
					`Rate limited (429) fetching discography for ${artistId}, retrying after ${retryAfter}s (attempt ${attempt + 1}/${MAX_DISCOGRAPHY_ATTEMPTS})`,
				);
				await sleep(retryAfter * 1000, signal);
				continue;
			}

			console.error(
				`Error fetching discography for artist ${artistId}:`,
				err?.message || err,
			);
			if (err?.response?.body)
				console.error('Spotify API Error Body:', err.response.body);
			return [];
		}
	}

	console.error(
		`getArtistDiscographyTracks exhausted ${MAX_DISCOGRAPHY_ATTEMPTS} retries for ${artistId}`,
	);
	return [];
}

export async function getTracks(
	albums: string[],
): Promise<trackTypes | { isError: boolean; err: any }> {
	const tracks: trackTypes[] = [];
	const subArrays = convertToSubArray(albums);
	const normalizeTrackKey = (name: string, artistName: string) =>
		`${cleanMusicMetadata(name).toLowerCase().trim()}|${cleanMusicMetadata(artistName).toLowerCase().trim()}`;

	try {
		// Loop through each subarray of album IDs
		for (const subArray of subArrays) {
			let subTracks: singleTrack[] = [];
			// Call the Spotify Web API's getAlbums method with the subarray of IDs
			const data = await spotifyApi.getAlbums(subArray);

			data.body.albums.forEach((item) =>
				item.tracks.items.forEach((track) => {
					subTracks.push({
						name: track.name,
						albumName: item.name,
						uri: track.uri,
						id: track.id,
						artistName:
							track.artists?.[0]?.name ||
							item.artists?.[0]?.name ||
							'Unknown Artist',
					});
				}),
			);
			subTracks = subTracks.filter((track, index, self) => {
				const trackName = cleanMusicMetadata(track.name).toLowerCase();
				const trackKey = normalizeTrackKey(track.name, track.artistName);

				// Check if the track is a remix or a mix or an edit or a radio mix
				const blacklistedWords = [
					'remix',
					'mix',
					'edit',
					'radio',
					'- live',
					' ver.',
					'live-',
					'version',
					'tour',
					'live',
					'event',
					'concert',
					'tour',
				];
				if (blacklistedWords.some((word) => trackName.includes(word))) {
					return false;
				}

				// Collapse duplicate versioned releases by normalized title + artist.
				return !self.some(
					(existing, existingIndex) =>
						existingIndex < index &&
						normalizeTrackKey(existing.name, existing.artistName) === trackKey,
				);
			});

			tracks.push(subTracks.flat());
		}

		return tracks.flat();
	} catch (err: any) {
		return { isError: true, err };
	}
}

export async function getUserTopArtists() {
	try {
		const data = await spotifyApi.getMyTopArtists({ limit: 10 });

		return data.body.items;
	} catch (err) {
		return err;
	}
}

export async function removeTracksFromPlaylists(
	playlistId: string,
	tracks: { uri: string }[],
): Promise<boolean> {
	try {
		await spotifyApi.removeTracksFromPlaylist(playlistId, tracks);
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}

export async function getUser() {
	const token = await getDummyAccessToken();
	setAccessToken(token);

	const res = await spotifyApi.getMe();

	const { display_name, id, images } = res.body;
	const user = {
		display_name,
		user_id: id,
		profile_image_url: images && images[0].url,
	};

	return user;
}

/**
 * Resolves one artist name to its Spotify follower count. Uses the same
 * `searchArtists(name, { limit: 1 })` match as `getArtistsAlbums`, so the
 * followers we classify on belong to the exact artist whose albums are pulled
 * later. Returns null when the artist can't be resolved (unknown to Spotify, or
 * the lookup kept failing), and 429s are retried in place honouring
 * `retry-after`.
 */
async function getArtistFollowers(
	artistName: string,
	signal?: AbortSignal,
): Promise<number | null> {
	const cacheKey = artistName.trim().toLowerCase();
	const cached = artistFollowerCache.get(cacheKey);
	if (cached !== undefined) return cached;

	for (let attempt = 0; attempt < MAX_FOLLOWER_LOOKUP_ATTEMPTS; attempt++) {
		try {
			const data = await spotifyApi.searchArtists(artistName, {
				limit: 1,
				offset: 0,
			});
			const match = data.body.artists?.items?.[0];
			const followers = match ? (match.followers?.total ?? 0) : null;

			cacheArtistFollowers(cacheKey, followers);
			return followers;
		} catch (err: any) {
			const status = err?.statusCode ?? err?.status ?? err?.response?.status;
			const retryAfter = Number(
				err?.headers?.['retry-after'] ??
					err?.response?.headers?.['retry-after'],
			);

			if (status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
				console.log(
					`Rate limited (429) resolving followers for ${artistName}, retrying after ${retryAfter}s (attempt ${attempt + 1}/${MAX_FOLLOWER_LOOKUP_ATTEMPTS})`,
				);
				// Let an abort propagate so the caller can stop the whole batch.
				await sleep(retryAfter * 1000, signal);
				continue;
			}

			console.error(
				`Error resolving followers for ${artistName}:`,
				err?.message || err,
			);
			return null;
		}
	}

	console.error(
		`getArtistFollowers exhausted ${MAX_FOLLOWER_LOOKUP_ATTEMPTS} retries for ${artistName}`,
	);
	return null;
}

/**
 * Attaches Spotify follower counts to candidate artist names.
 *
 * Names that can't be resolved to a Spotify artist are dropped rather than
 * defaulted to 0 followers: without a Spotify artist there are no albums to pull
 * later, so keeping them would only waste a slot in the pool (and would silently
 * classify every unknown name as "non-popular").
 *
 * @param matchesPopularity - Predicate used purely to stop early once enough
 * candidates already satisfy the caller's popularity filter.
 */
export async function resolveArtistsWithFollowers(
	artistNames: string[],
	matchesPopularity: (followers: number) => boolean,
	signal?: AbortSignal,
): Promise<ArtistWithFollowers[]> {
	const limit = pLimit(FOLLOWER_LOOKUP_CONCURRENCY);
	const resolved: ArtistWithFollowers[] = [];
	let matching = 0;

	for (let i = 0; i < artistNames.length; i += FOLLOWER_LOOKUP_CHUNK_SIZE) {
		if (signal?.aborted) throw new Error('Aborted');

		const chunk = artistNames.slice(i, i + FOLLOWER_LOOKUP_CHUNK_SIZE);
		const followerCounts = await Promise.all(
			chunk.map((name) => limit(() => getArtistFollowers(name, signal))),
		);

		chunk.forEach((name, index) => {
			const followers = followerCounts[index];
			if (followers === null) return;

			resolved.push({ name, followers });
			if (matchesPopularity(followers)) matching++;
		});

		if (matching >= MAX_MATCHING_ARTISTS_PER_SEED) break;
	}

	return resolved;
}
