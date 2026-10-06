import {
	decodeGeneratedSongId,
	getSongTitles,
	getUserGeneratedSongIds,
} from '../db';
import type { ProviderName } from '../providers/types';
import { titleKey } from './shared';

export type PlaylistHistory = { ids: Set<string>; titles: Set<string> };

export async function loadPlaylistHistory(
	userId: string | undefined,
	provider: ProviderName,
): Promise<PlaylistHistory> {
	if (!userId) return { ids: new Set(), titles: new Set() };

	const ids = (await getUserGeneratedSongIds(userId))
		.map(decodeGeneratedSongId)
		.filter((d) => d?.provider === provider)
		.map((d) => d!.externalId);

	const songs = await getSongTitles(ids, provider);

	return {
		ids: new Set(ids),
		titles: new Set(songs.map((s) => titleKey(s.title, s.artist))),
	};
}

export const isInHistory = (
	history: PlaylistHistory,
	id: string,
	title: string,
	artist: string,
) => history.ids.has(id) || history.titles.has(titleKey(title, artist));
