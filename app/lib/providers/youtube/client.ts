import axios from 'axios';
import { NON_CANONICAL_RELEASE_KEYWORDS } from '../../utils';
import { axiosErrors, withRetry } from '../../retry';

const YOUTUBE_API = 'https://www.googleapis.com/youtube/v3';

const authHeader = (accessToken: string) => ({
	Authorization: `Bearer ${accessToken}`,
});

// 409: concurrent writes to one playlist. 429: rate limit.
const retryYoutube = <T>(label: string, fn: () => Promise<T>) =>
	withRetry(fn, {
		errors: axiosErrors,
		label: `YouTube ${label}`,
		retryOn: [409, 429, 500, 502, 503, 504],
	});

const buildQuery = (params: Record<string, string>) => {
	const usp = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) usp.set(k, v);
	return usp.toString();
};

export type YoutubePlaylistCreated = {
	id: string;
	name: string;
	link: string;
};

export async function createPlaylist(
	accessToken: string,
	title: string,
	description: string,
): Promise<YoutubePlaylistCreated> {
	const res = await axios.post(
		`${YOUTUBE_API}/playlists?part=snippet,status`,
		{
			snippet: { title, description },
			status: { privacyStatus: 'public' },
		},
		{
			headers: {
				...authHeader(accessToken),
				'Content-Type': 'application/json',
			},
		},
	);

	const id = res.data?.id as string;
	if (!id) throw new Error('YouTube did not return a playlist id');
	return {
		id,
		name: res.data?.snippet?.title ?? title,
		link: `https://www.youtube.com/playlist?list=${id}`,
	};
}

export async function addVideoToPlaylist(
	accessToken: string,
	playlistId: string,
	videoId: string,
): Promise<void> {
	await retryYoutube(`add video ${videoId}`, () =>
		axios.post(
			`${YOUTUBE_API}/playlistItems?part=snippet`,
			{
				snippet: {
					playlistId,
					resourceId: { kind: 'youtube#video', videoId },
				},
			},
			{
				headers: {
					...authHeader(accessToken),
					'Content-Type': 'application/json',
				},
			},
		),
	);
}

const NON_CANONICAL_TITLE_KEYWORDS = [
	...NON_CANONICAL_RELEASE_KEYWORDS,
	'cover',
	'reaction',
	'lyric',
	'lyrics',
	'karaoke',
	'8d audio',
	'slowed',
	'sped up',
	'nightcore',
	'instrumental',
];

const isNonCanonicalTitle = (title: string) => {
	const lower = title.toLowerCase();
	return NON_CANONICAL_TITLE_KEYWORDS.some((kw) => lower.includes(kw));
};

const isTopicChannel = (channelTitle?: string) =>
	Boolean(channelTitle?.trim().toLowerCase().endsWith('- topic'));

export async function searchVideo(
	accessToken: string,
	query: string,
): Promise<string | null> {
	const qs = buildQuery({
		part: 'snippet',
		type: 'video',
		videoCategoryId: '10',
		maxResults: '10',
		q: query,
	});
	const res = await retryYoutube(`search "${query}"`, () =>
		axios.get(`${YOUTUBE_API}/search?${qs}`, {
			headers: authHeader(accessToken),
		}),
	);
	const items = (res.data?.items ?? []) as any[];
	if (items.length === 0) return null;

	const topicMatch = items.find(
		(item) =>
			isTopicChannel(item.snippet?.channelTitle) &&
			!isNonCanonicalTitle(item.snippet?.title ?? ''),
	);
	if (topicMatch?.id?.videoId) return topicMatch.id.videoId;

	const cleanMatch = items.find(
		(item) => !isNonCanonicalTitle(item.snippet?.title ?? ''),
	);
	if (cleanMatch?.id?.videoId) return cleanMatch.id.videoId;

	return items[0]?.id?.videoId ?? null;
}

export async function searchChannel(
	accessToken: string,
	query: string,
): Promise<{ id: string; name: string } | null> {
	const qs = buildQuery({
		part: 'snippet',
		type: 'channel',
		maxResults: '1',
		q: query,
	});
	const res = await axios.get(`${YOUTUBE_API}/search?${qs}`, {
		headers: authHeader(accessToken),
	});
	const items = (res.data?.items ?? []) as any[];
	const item = items[0];
	if (!item?.id?.channelId) return null;
	return {
		id: item.id.channelId,
		name: item.snippet?.title ?? query,
	};
}

export type YoutubeVideo = {
	videoId: string;
	title: string;
	channelTitle: string;
	thumbnailUrl?: string | null;
	itemId?: string;
};

const bestThumbnail = (thumbnails: any): string | null =>
	thumbnails?.high?.url ??
	thumbnails?.medium?.url ??
	thumbnails?.default?.url ??
	null;

export async function listChannelVideos(
	accessToken: string,
	channelId: string,
	pageToken?: string,
): Promise<{ videos: YoutubeVideo[]; nextPageToken?: string }> {
	const params: Record<string, string> = {
		part: 'snippet',
		type: 'video',
		channelId,
		maxResults: '50',
	};
	if (pageToken) params.pageToken = pageToken;
	const qs = buildQuery(params);
	const res = await axios.get(`${YOUTUBE_API}/search?${qs}`, {
		headers: authHeader(accessToken),
	});
	const videos: YoutubeVideo[] = ((res.data?.items ?? []) as any[]).map(
		(item: any) => ({
			videoId: item.id?.videoId,
			title: item.snippet?.title ?? 'Unknown',
			channelTitle:
				item.snippet?.videoOwnerChannelTitle ??
				item.snippet?.channelTitle ??
				'Unknown Artist',
			thumbnailUrl: bestThumbnail(item.snippet?.thumbnails),
		}),
	);
	return { videos, nextPageToken: res.data?.nextPageToken };
}

export type YoutubePlaylistDetails = {
	id: string;
	name: string;
	imageUrl?: string | null;
	totalTracks?: number | null;
};

export async function getPlaylistDetails(
	accessToken: string,
	playlistId: string,
): Promise<YoutubePlaylistDetails | null> {
	const qs = buildQuery({ part: 'snippet,contentDetails', id: playlistId });
	const res = await axios.get(`${YOUTUBE_API}/playlists?${qs}`, {
		headers: authHeader(accessToken),
	});
	const item = (res.data?.items ?? [])[0];
	if (!item) return null;
	const thumbnails = item.snippet?.thumbnails ?? {};
	const imageUrl =
		thumbnails?.maxres?.url ??
		thumbnails?.standard?.url ??
		thumbnails?.high?.url ??
		thumbnails?.medium?.url ??
		null;
	return {
		id: item.id,
		name: item.snippet?.title ?? playlistId,
		imageUrl,
		totalTracks: item.contentDetails?.itemCount ?? null,
	};
}

export async function getPlaylistItems(
	accessToken: string,
	playlistId: string,
	pageToken?: string,
): Promise<{ items: YoutubeVideo[]; nextPageToken?: string }> {
	const params: Record<string, string> = {
		part: 'snippet',
		playlistId,
		maxResults: '50',
	};
	if (pageToken) params.pageToken = pageToken;
	const qs = buildQuery(params);
	const res = await axios.get(`${YOUTUBE_API}/playlistItems?${qs}`, {
		headers: authHeader(accessToken),
	});
	const items: YoutubeVideo[] = ((res.data?.items ?? []) as any[]).map(
		(item: any) => ({
			videoId: item.snippet?.resourceId?.videoId,
			title: item.snippet?.title ?? 'Unknown',
			channelTitle:
				item.snippet?.videoOwnerChannelTitle ??
				item.snippet?.channelTitle ??
				'Unknown Artist',
			thumbnailUrl: bestThumbnail(item.snippet?.thumbnails),
			itemId: item.id,
		}),
	);
	return { items, nextPageToken: res.data?.nextPageToken };
}

export async function deletePlaylistItem(
	accessToken: string,
	playlistItemId: string,
): Promise<void> {
	await retryYoutube(`remove item ${playlistItemId}`, () =>
		axios.delete(
			`${YOUTUBE_API}/playlistItems?${buildQuery({ id: playlistItemId })}`,
			{ headers: authHeader(accessToken) },
		),
	);
}
