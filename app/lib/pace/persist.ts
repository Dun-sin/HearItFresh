import { setAudioFeatures } from '../db';
import { formatApiError } from '../utils';
import {
	paceOf,
	parseAudioFeatures,
	type AudioFeatures,
	type Pace,
} from './mix';
import { fetchAudioFeatures, type PaceBudget } from './reccobeats';

export type PaceRow = {
	id: string;
	spotifyId: string | null;
	audioFeatures: unknown;
};

/** Pace per song id, backfilling audio features for rows that lack them. */
export async function syncSongPaces(
	rows: PaceRow[],
	budget: PaceBudget,
	signal?: AbortSignal,
): Promise<Map<string, Pace | null>> {
	const features = new Map<string, AudioFeatures | null>(
		rows.map((row) => [row.id, parseAudioFeatures(row.audioFeatures)]),
	);

	const missing = rows.filter(
		(row): row is PaceRow & { spotifyId: string } =>
			Boolean(row.spotifyId) && !features.get(row.id),
	);

	if (missing.length > 0) {
		const found = await fetchAudioFeatures(
			missing.map((row) => row.spotifyId),
			budget,
			signal,
		);

		const fetched = missing.flatMap((row) => {
			const songFeatures = found.get(row.spotifyId);
			return songFeatures ? [{ songId: row.id, features: songFeatures }] : [];
		});

		for (const { songId, features: songFeatures } of fetched) {
			features.set(songId, songFeatures);
		}

		if (fetched.length > 0) {
			try {
				await setAudioFeatures(fetched);
			} catch (err) {
				console.error(
					`Failed to store audio features for ${fetched.length} songs: ${formatApiError(err)}`,
				);
			}
		}
	}

	return new Map(
		[...features].map(([id, songFeatures]) => [id, paceOf(songFeatures)]),
	);
}
