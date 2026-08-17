import { playlistDetails, singleTrack, trackTypes } from "../types";
import spotifyApi, { setAccessToken } from './spotifyApi';
import { getDummyAccessToken } from './spotify-dummy-auth';

import { convertToSubArray, shuffle, sleep } from './utils';

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
			fields: 'id,name',
		});

		return {
			id: data.body.id,
			name: data.body.name,
		};
	} catch (err) {
		return err;
	}
}

/**
  Creates a new playlist on Spotify with a specific name and description based on the provided artists.
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

  Adds an array of track URIs to a Spotify playlist with the specified ID.
  @async
  @function addTracksToPlayList
  @param {string[]} tracks - An array of track URIs to add to the playlist.
  @param {string} playListID - The ID of the playlist to add the tracks to.
  @returns {Promise<Object>} A promise that resolves with the data returned by the Spotify API if successful
  @throws {Error} - If there is an error fetching data from the Spotify Web API.
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
  This asynchronous function takes an artist name as its input, searches for the artist using the Spotify Web API's searchArtists method,
  retrieves their top 10 albums using the getArtistAlbums method, removes any remixes or duplicate tracks, and returns up to five randomly
  selected album IDs. If the artist has fewer than five albums, it returns all of the available album IDs.

  Handles one artist only: 429 responses are retried in place (honouring `retry-after`) up to
  MAX_ARTIST_ATTEMPTS times, and the function always resolves to a stable `string[]` so callers
  never have to special-case error objects.
**/
const MAX_ARTIST_ATTEMPTS = 3;

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
 * Strips a parenthetical/bracketed edition suffix from an album title and
 * lowercases/trims the result, so variants like "Love Is Like" and
 * "Love Is Like (Deluxe)" collapse to the same base title.
 */
function normalizeAlbumTitle(name: string): string {
	const trimmed = name.trim();
	const withoutSuffix = trimmed.replace(/[([{][^()[\]{}]*[)\]}]?$/i, (suffix) => {
		const inner = suffix.replace(/^[([{]+|[)\]}]+$/g, '').trim().toLowerCase();
		if (
			EDITION_KEYWORDS.some((kw) => {
				const words = inner.split(/[\s/&-]+/);
				return words.includes(kw) || inner.includes(kw);
			})
		) {
			return '';
		}
		return suffix;
	});
	return withoutSuffix.trim().toLowerCase();
}

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

			const result = data.body.items.filter((album: { name: string }) => {
				const trackName = album.name.toLowerCase();

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

				return true;
			});

			const seenBaseTitles = new Map<string, (typeof result)[number]>();
			const deduplicated: (typeof result)[number][] = [];
			for (const album of result) {
				const baseTitle = normalizeAlbumTitle(album.name);
				const existing = seenBaseTitles.get(baseTitle);
				if (!existing) {
					seenBaseTitles.set(baseTitle, album);
					deduplicated.push(album);
					continue;
				}
				const existingIsStandard =
					normalizeAlbumTitle(existing.name) ===
					existing.name.trim().toLowerCase();
				const currentIsStandard =
					normalizeAlbumTitle(album.name) ===
					album.name.trim().toLowerCase();
				if (!existingIsStandard && currentIsStandard) {
					seenBaseTitles.set(baseTitle, album);
					deduplicated[deduplicated.indexOf(existing)] = album;
				}
			}

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
			const status =
				err?.statusCode ?? err?.status ?? err?.response?.status;
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

export async function getTracks(
	albums: string[],
): Promise<trackTypes | { isError: boolean; err: any }> {
	const tracks: trackTypes[] = [];
	const subArrays = convertToSubArray(albums);

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
				const trackName = track.name.toLowerCase();

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

				// Check if the track is a repetition
				for (let i = 0; i < index; i++) {
					if (self[i].name === track.name) {
						return false;
					}
				}

				return true;
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

export async function getRelatedArtists(
	artistName: string,
	options: { isNotPopular: boolean; isDifferent: boolean },
	signal?: AbortSignal,
): Promise<string[]> {
	try {
		const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=60`;

		const res = await fetch(url, { signal });
		const data = await res.json();

		if (!data.similarartists?.artist) return [];

		let artists = data.similarartists.artist as {
			name: string;
			listeners: string;
		}[];

		if (options.isNotPopular) {
			artists = artists.filter((a) => parseInt(a.listeners) < 500000);
		}

		// Last.fm doesn't have a "different genre" concept easily
		// so just return all for isDifferent and let lyrical similarity handle it
		const finalArtist = artists.map((a) => a.name);
		return shuffle(finalArtist);
	} catch (err: any) {
		if (signal?.aborted) throw new Error('Aborted');
		console.error(`Error getting related artists for ${artistName}:`, err);
		return [];
	}
}
