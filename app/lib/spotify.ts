import { playlistDetails, singleTrack, trackTypes } from '../types';
import spotifyApi, { setAccessToken } from './spotifyApi';
import { getDummyAccessToken } from './spotify-dummy-auth';

import pLimit from 'p-limit';

import {
	shuffle,
	convertToSubArray,
	sleep,
	cleanMusicMetadata,
	NON_CANONICAL_RELEASE_KEYWORDS,
} from './utils';

const EDITION_KEYWORDS = [
	'deluxe',
	'edition',
	'bonus',
	'expanded',
	'anniversary',
	'remastered',
	'special',
];

const SPOTIFY_PLAYLIST_TRACK_PAGE_SIZE = 100;
const MAX_PLAYLIST_TRACKS_TO_FETCH = 500;
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
const SPOTIFY_ARTIST_CACHE_LIMIT = 5000;

/**
 * A Last.fm name that has been matched to a real Spotify artist. The `id` makes
 * the later album fetch free of a second search, while `followers` is what the
 * popularity filter is applied to.
 */
export type ResolvedSpotifyArtist = {
	id: string;
	name: string;
	followers: number;
};

/**
 * searched name (lowercased) -> resolved artist, or null when Spotify has no
 * such artist. Shared across seeds and retry attempts within a process so the
 * same name is never looked up twice.
 */
export const spotifyArtistCache = new Map<
	string,
	ResolvedSpotifyArtist | null
>();

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
		return !NON_CANONICAL_RELEASE_KEYWORDS.some((word) => name.includes(word));
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

export function cacheSpotifyArtist(
	cacheKey: string,
	artist: ResolvedSpotifyArtist | null,
) {
	if (spotifyArtistCache.size >= SPOTIFY_ARTIST_CACHE_LIMIT) {
		spotifyArtistCache.clear();
	}
	spotifyArtistCache.set(cacheKey, artist);
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
		const firstPage = await spotifyApi.getPlaylistTracks(link, {
			limit: SPOTIFY_PLAYLIST_TRACK_PAGE_SIZE,
			offset: 0,
		});

		const totalToFetch = Math.min(
			firstPage.body.total ?? firstPage.body.items.length,
			MAX_PLAYLIST_TRACKS_TO_FETCH,
		);

		const tracks = [...firstPage.body.items];

		for (
			let offset = SPOTIFY_PLAYLIST_TRACK_PAGE_SIZE;
			offset < totalToFetch;
			offset += SPOTIFY_PLAYLIST_TRACK_PAGE_SIZE
		) {
			const limit = Math.min(
				SPOTIFY_PLAYLIST_TRACK_PAGE_SIZE,
				totalToFetch - offset,
			);

			const page = await spotifyApi.getPlaylistTracks(link, {
				limit,
				offset,
			});

			tracks.push(...page.body.items);
		}

		return tracks;
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
 *   Fetches the top albums for an already-resolved Spotify artist id, drops
 *   remixes/live records and edition duplicates, and returns up to a
 *   batch-size-dependent number of randomly selected album IDs.
 *
 *   Callers that already searched Spotify (e.g. the non-popular filtering pass,
 *   which needs follower counts anyway) reuse the id they got back instead of
 *   searching for the same artist a second time.
 *
 *   Handles one artist only: 429 responses are retried in place (honouring
 *   `retry-after`) up to MAX_ARTIST_ATTEMPTS times, and the function always
 *   resolves to a stable `string[]` so callers never have to special-case error
 *   objects.
 **/
const MAX_ARTIST_ATTEMPTS = 3;

export async function getArtistAlbumsById(
	artistId: string,
	artistName: string,
	artistsLength: number,
	signal?: AbortSignal,
): Promise<string[]> {
	const maxAlbums =
		artistsLength >= 20
			? 5
			: Math.max(1, Math.floor(100 / (artistsLength * 2)));

	for (let attempt = 0; attempt < MAX_ARTIST_ATTEMPTS; attempt++) {
		try {
			const data = await spotifyApi.getArtistAlbums(artistId, {
				limit: 10,
				include_groups: 'album',
			});

			const deduplicated = deduplicateAlbums(data.body.items);

			return shuffle(deduplicated)
				.slice(0, Math.min(maxAlbums, deduplicated.length))
				.map((item) => item.id);
		} catch (err: any) {
			const status = err?.statusCode ?? err?.status ?? err?.response?.status;
			const retryAfter = Number(
				err?.headers?.['retry-after'] ??
					err?.response?.headers?.['retry-after'],
			);

			if (status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
				console.log(
					`Rate limited (429) for ${artistName}, retrying after ${retryAfter}s (attempt ${attempt + 1}/${MAX_ARTIST_ATTEMPTS})`,
				);
				// Let an abort propagate so the caller can stop the whole batch.
				await sleep(retryAfter * 1000, signal);
				continue;
			}

			console.error(
				`Error in getArtistAlbumsById for ${artistName}:`,
				err?.message || err,
			);
			if (err?.response?.body)
				console.error('Spotify API Error Body:', err.response.body);
			return [];
		}
	}

	console.error(
		`getArtistAlbumsById exhausted ${MAX_ARTIST_ATTEMPTS} retries for ${artistName}`,
	);
	return [];
}

/**
 *   Name-only entry point for album fetching: resolves the name to a Spotify
 *   artist first, then defers to {@link getArtistAlbumsById}. Used by paths that
 *   never needed follower counts (the popular/default path), so they still only
 *   pay for one search per artist.
 **/
export async function getArtistsAlbums(
	artist: string,
	artistsLength: number,
	signal?: AbortSignal,
): Promise<string[]> {
	const resolved = await resolveSpotifyArtist(artist, signal);
	if (!resolved) {
		console.log(`Artist not found: ${artist}`);
		return [];
	}

	return getArtistAlbumsById(
		resolved.id,
		resolved.name,
		artistsLength,
		signal,
	);
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
				if (
					NON_CANONICAL_RELEASE_KEYWORDS.some((word) =>
						trackName.includes(word),
					)
				) {
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
 * Resolves one artist name to the Spotify artist behind it, keeping both the id
 * and the follower count from the same `searchArtists(name, { limit: 1 })`
 * match. Follower filtering and album fetching therefore always talk about the
 * exact same artist, and the id lets the album fetch skip a second search.
 *
 * Returns null when the artist can't be resolved (unknown to Spotify, or the
 * lookup kept failing), and 429s are retried in place honouring `retry-after`.
 */
async function resolveSpotifyArtist(
	artistName: string,
	signal?: AbortSignal,
): Promise<ResolvedSpotifyArtist | null> {
	const cacheKey = artistName.trim().toLowerCase();
	const cached = spotifyArtistCache.get(cacheKey);
	if (cached !== undefined) return cached;

	for (let attempt = 0; attempt < MAX_FOLLOWER_LOOKUP_ATTEMPTS; attempt++) {
		try {
			const data = await spotifyApi.searchArtists(artistName, {
				limit: 1,
				offset: 0,
			});
			const match = data.body.artists?.items?.[0];
			const resolved: ResolvedSpotifyArtist | null = match
				? {
						id: match.id,
						name: match.name,
						followers: match.followers?.total ?? 0,
					}
				: null;

			cacheSpotifyArtist(cacheKey, resolved);
			return resolved;
		} catch (err: any) {
			const status = err?.statusCode ?? err?.status ?? err?.response?.status;
			const retryAfter = Number(
				err?.headers?.['retry-after'] ??
					err?.response?.headers?.['retry-after'],
			);

			if (status === 429 && Number.isFinite(retryAfter) && retryAfter > 0) {
				console.log(
					`Rate limited (429) resolving ${artistName}, retrying after ${retryAfter}s (attempt ${attempt + 1}/${MAX_FOLLOWER_LOOKUP_ATTEMPTS})`,
				);
				// Let an abort propagate so the caller can stop the whole batch.
				await sleep(retryAfter * 1000, signal);
				continue;
			}

			console.error(`Error resolving ${artistName}:`, err?.message || err);
			return null;
		}
	}

	console.error(
		`resolveSpotifyArtist exhausted ${MAX_FOLLOWER_LOOKUP_ATTEMPTS} retries for ${artistName}`,
	);
	return null;
}

/**
 * Resolves candidate artist names to real Spotify artists, returning only the
 * ones that pass the caller's popularity predicate. Each returned artist carries
 * its Spotify id, so the album fetch downstream never has to search again.
 *
 * Names that can't be resolved to a Spotify artist are dropped rather than
 * defaulted to 0 followers: without a Spotify artist there are no albums to pull
 * later, so keeping them would only waste a slot in the pool (and would silently
 * classify every unknown name as "non-popular").
 *
 * @param matchesPopularity - Predicate enforced on every resolved artist before
 * it is returned. The caller's popularity rule is authoritative at this
 * filtering boundary, so resolved artists can never slip through just because
 * they were looked up before the early-stop fired. The predicate is also used
 * to stop early once enough candidates already satisfy it; that is purely an
 * optimization and never replaces enforcement.
 */
export async function resolveArtistsWithFollowers(
	artistNames: string[],
	matchesPopularity: (followers: number) => boolean,
	signal?: AbortSignal,
): Promise<ResolvedSpotifyArtist[]> {
	const limit = pLimit(FOLLOWER_LOOKUP_CONCURRENCY);
	const resolved: ResolvedSpotifyArtist[] = [];
	let matching = 0;

	for (let i = 0; i < artistNames.length; i += FOLLOWER_LOOKUP_CHUNK_SIZE) {
		if (signal?.aborted) throw new Error('Aborted');

		const chunk = artistNames.slice(i, i + FOLLOWER_LOOKUP_CHUNK_SIZE);
		const resolvedArtists = await Promise.all(
			chunk.map((name) => {
				const result = limit(() => resolveSpotifyArtist(name, signal));
				setTimeout(() => {
					if (signal?.aborted) {
						console.log(`Aborted lookup for ${name}`);
					}
				}, 2 * 1000); // 2 seconds timeout for each lookup
				return result;
			}),
		);

		for (const artist of resolvedArtists) {
			if (artist === null) continue;

			// Enforcement: only keep artists that actually match the caller's
			// popularity predicate. The early-stop below is an optimization.
			if (!matchesPopularity(artist.followers)) continue;

			resolved.push(artist);
			matching++;
		}

		if (matching >= MAX_MATCHING_ARTISTS_PER_SEED) break;
	}

	return resolved;
}
