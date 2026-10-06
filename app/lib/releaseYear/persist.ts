import { getReleaseYearsByArtists, recordReleaseYears } from '../db';
import { getTrackReleaseYears } from '../spotify';
import { titleKey } from '../songKey';
import { formatApiError } from '../utils';

export type YearRow = {
	id: string;
	spotifyId: string | null;
	title: string;
	artist: string;
	releaseYear?: number | null;
};

async function saveYears(entries: { songId: string; year: number }[]) {
	try {
		await recordReleaseYears(entries);
	} catch (err) {
		console.error(
			`Failed to store release years for ${entries.length} songs: ${formatApiError(err)}`,
		);
	}
}

export async function recordCandidateYears(
	entries: { songId: string; year?: number }[],
) {
	await saveYears(
		entries.flatMap(({ songId, year }) => (year ? [{ songId, year }] : [])),
	);
}

/** Earliest known year per song id across every release sharing its title and artist. */
export async function earliestReleaseYears(
	rows: YearRow[],
	signal?: AbortSignal,
): Promise<Map<string, number | null>> {
	const years = new Map(rows.map((row) => [row.id, row.releaseYear ?? null]));

	const missing = rows.filter(
		(row): row is YearRow & { spotifyId: string } =>
			years.get(row.id) === null && Boolean(row.spotifyId),
	);

	if (missing.length > 0) {
		const fetched = await getTrackReleaseYears(
			missing.map((row) => row.spotifyId),
			signal,
		);
		const found = missing.flatMap((row) => {
			const year = fetched.get(row.spotifyId);
			return year ? [{ songId: row.id, year }] : [];
		});

		for (const { songId, year } of found) years.set(songId, year);
		await saveYears(found);
	}

	const earliestByKey = new Map<string, number>();
	try {
		const releases = await getReleaseYearsByArtists([
			...new Set(rows.map((row) => row.artist)),
		]);
		for (const { title, artist, releaseYear } of releases) {
			const key = titleKey(title, artist);
			earliestByKey.set(key, Math.min(earliestByKey.get(key) ?? releaseYear, releaseYear));
		}
	} catch (err) {
		console.error(`Failed to load sibling release years: ${formatApiError(err)}`);
	}

	return new Map(
		rows.map((row) => {
			const own = years.get(row.id) ?? null;
			const sibling = earliestByKey.get(titleKey(row.title, row.artist));
			const earliest =
				own === null ? (sibling ?? null) : Math.min(own, sibling ?? own);
			return [row.id, earliest];
		}),
	);
}
