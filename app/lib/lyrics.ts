import { Song } from '../generated/prisma';
import { LRCLibResult, SpotifyTrack } from '../types';
import { addEmbeddingToSong, addSong, updateSong } from './db';
import { getEmbedding } from './processSong';
import { cleanMusicMetadata, isLRCLibResult } from './utils';

function cleanLyrics(raw: string): string | null {
	if (!raw) return null;

	const cleanedLyrics = raw
		.replace(/\[.*?\]/g, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();

	return cleanedLyrics;
}

function filterBestPlainTrack(
	results: LRCLibResult[] | null,
	targetArtist: string,
	targetTrack: string,
): LRCLibResult | null {
	if (!Array.isArray(results) || results.length === 0) return null;

	const clean = (str: string | undefined) =>
		String(str || '')
			.toLowerCase()
			.replace(/[^a-z0-9]/g, '');
	const cleanArtist = clean(targetArtist);
	const cleanTrack = clean(targetTrack);

	let candidates = results.filter((item) => {
		const itemArtist = clean(item.artistName || '');
		const itemTrack = clean(item.trackName || '');
		return (
			(itemArtist.includes(cleanArtist) || cleanArtist.includes(itemArtist)) &&
			(itemTrack.includes(cleanTrack) || cleanTrack.includes(itemTrack))
		);
	});

	candidates = candidates.filter(
		(item) =>
			item.instrumental !== true &&
			typeof item.plainLyrics === 'string' &&
			item.plainLyrics.trim().length > 0,
	);

	if (candidates.length === 0) return null;

	const score = (item: LRCLibResult) => {
		const itemArtist = clean(item.artistName);
		const itemTrack = clean(item.trackName);

		const exactArtist = itemArtist === cleanArtist ? 2 : 0;
		const exactTrack = itemTrack === cleanTrack ? 2 : 0;
		const artistIncludes =
			itemArtist.includes(cleanArtist) || cleanArtist.includes(itemArtist)
				? 1
				: 0;
		const trackIncludes =
			itemTrack.includes(cleanTrack) || cleanTrack.includes(itemTrack) ? 1 : 0;

		return exactArtist + exactTrack + artistIncludes + trackIncludes;
	};

	return [...candidates].sort((a, b) => score(b) - score(a))[0] ?? null;
}

async function getLyrics(
	artist: string,
	track: string,
	signal?: AbortSignal,
): Promise<LRCLibResult[] | null> {
	try {
		if (signal?.aborted) return null;
		artist = cleanMusicMetadata(artist);
		track = cleanMusicMetadata(track);
		const url = `https://lrclib.net/api/search?q=${encodeURIComponent(artist.toLocaleLowerCase())}+${encodeURIComponent(track.toLocaleLowerCase())}`;
		const response = await fetch(url, {
			headers: { 'User-Agent': 'hearitfresh/1.0' },
			signal,
		});
		if (response.status !== 200) return null;
		const data: unknown = await response.json();

		if (!Array.isArray(data)) return null;
		return data.filter(isLRCLibResult);
	} catch (err: any) {
		if (signal?.aborted) throw new Error('Aborted');
		return null;
	}
}

async function getLyricsOvh(
	artist: string,
	track: string,
	signal?: AbortSignal,
): Promise<string | null> {
	try {
		if (signal?.aborted) return null;

		artist = cleanMusicMetadata(artist);
		track = cleanMusicMetadata(track);

		const response = await fetch(
			`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(track)}`,
			{ signal },
		);

		if (!response.ok) return null;

		const data: unknown = await response.json();
		if (
			!data ||
			typeof data !== 'object' ||
			!('lyrics' in data) ||
			typeof (data as { lyrics?: unknown }).lyrics !== 'string'
		) {
			return null;
		}

		return cleanLyrics((data as { lyrics: string }).lyrics);
	} catch (err: any) {
		if (signal?.aborted) throw new Error('Aborted');
		return null;
	}
}

export async function embedSong(
	spotifyTrack: SpotifyTrack,
	existing?: Song,
	signal?: AbortSignal,
): Promise<(Song & { embeddingData?: number[] | null }) | null> {
	const results = await getLyrics(
		spotifyTrack.artist,
		spotifyTrack.title,
		signal,
	);
	const bestTrack = filterBestPlainTrack(
		results,
		spotifyTrack.artist,
		spotifyTrack.title,
	);

	let lyrics = cleanLyrics(bestTrack?.plainLyrics?.trim() ?? '');
	if (!lyrics) {
		lyrics = await getLyricsOvh(
			spotifyTrack.artist,
			spotifyTrack.title,
			signal,
		);
	}
	if (!lyrics) return null;

	if (signal?.aborted) throw new Error('Aborted');

	const embeddingData = await getEmbedding(lyrics, signal);
	if (signal?.aborted) throw new Error('Aborted');

	let song;

	if (existing) {
		song = await updateSong(existing.id, lyrics);
	} else {
		song = await addSong(spotifyTrack, lyrics);
	}
	await addEmbeddingToSong(song.id, embeddingData);

	return { ...song, embeddingData };
}
