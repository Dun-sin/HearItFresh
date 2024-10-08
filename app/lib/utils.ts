import { getArtistsAlbums, getTracks } from './spotify';

import crypto from 'crypto-js';
import { trackTypes } from '../types';

const key = process.env.secretKey as string;

export const encrypt = (text: string): string => {
	return crypto.AES.encrypt(text, key).toString();
};

export const decrypt = (encryptedText: string): string => {
	const bytes = crypto.AES.decrypt(encryptedText, key);
	const originalText = bytes.toString(crypto.enc.Utf8);

	return originalText;
};
export const getEveryAlbum = async (artists: string[]) => {
	const artistAlbums = artists.map((item) =>
		getArtistsAlbums(item, artists.length),
	);
	const albumArray = await Promise.all(artistAlbums);
	const albums = [...new Set(albumArray.flat())];
	const stringAlbums = albums.filter((item) => typeof item === 'string');

	return stringAlbums;
};

export const getAllTracks = async (albums: string[], numTracks: number) => {
	const tracks = await getTracks(albums);

	if ('isError' in tracks) return null;

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

	const allTracksID = result
		.map((item) => item && item.uri)
		.filter((item) => !!item);

	return allTracksID;
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




export const formatDate = (date: Date) => {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();

	return `${month}/${day}/${year}`;
};
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
