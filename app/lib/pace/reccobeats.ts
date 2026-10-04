import axios from 'axios';
import { axiosErrors, withRetry } from '../retry';
import { formatApiError } from '../utils';
import { parseAudioFeatures, type AudioFeatures } from './mix';

const AUDIO_FEATURES_ENDPOINT = 'https://api.reccobeats.com/v1/audio-features';
const MAX_IDS_PER_REQUEST = 40;
const REQUEST_TIMEOUT_MS = 15_000;
const LOOKUP_BUDGET_MS = 20_000;
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];
const SPOTIFY_TRACK_HREF = /open\.spotify\.com\/track\/([A-Za-z0-9]+)/;

/** Lookup time left for one generation run, shared by every fetch in it. */
export type PaceBudget = { remainingMs: number };

export const createPaceBudget = (): PaceBudget => ({
	remainingMs: LOOKUP_BUDGET_MS,
});

export async function fetchAudioFeatures(
	spotifyIds: string[],
	budget: PaceBudget,
	signal?: AbortSignal,
): Promise<Map<string, AudioFeatures>> {
	const found = new Map<string, AudioFeatures>();
	const unique = [...new Set(spotifyIds)];

	if (budget.remainingMs <= 0) {
		console.warn(
			`ReccoBeats lookup budget used up, skipping ${unique.length} tracks`,
		);
		return found;
	}

	const startedAt = Date.now();
	const budgetSignal = AbortSignal.timeout(budget.remainingMs);
	const requestSignal = signal
		? AbortSignal.any([signal, budgetSignal])
		: budgetSignal;

	try {
		for (let i = 0; i < unique.length; i += MAX_IDS_PER_REQUEST) {
			const chunk = unique.slice(i, i + MAX_IDS_PER_REQUEST);

			try {
				const { data } = await withRetry(
					() =>
						axios.get(AUDIO_FEATURES_ENDPOINT, {
							params: { ids: chunk.join(',') },
							headers: { Accept: 'application/json' },
							timeout: REQUEST_TIMEOUT_MS,
							signal: requestSignal,
						}),
					{
						errors: axiosErrors,
						label: 'ReccoBeats audio-features',
						retryOn: RETRYABLE_STATUSES,
						signal: requestSignal,
					},
				);

				for (const item of data?.content ?? []) {
					const spotifyId = item?.href?.match(SPOTIFY_TRACK_HREF)?.[1];
					const features = parseAudioFeatures(item);
					if (spotifyId && features) found.set(spotifyId, features);
				}
			} catch (err) {
				if (signal?.aborted) throw new Error('Aborted');

				if (budgetSignal.aborted) {
					console.warn(
						`ReccoBeats lookup budget used up, skipping ${unique.length - i} tracks`,
					);
					break;
				}

				console.warn(
					`ReccoBeats lookup failed for ${chunk.length} tracks: ${formatApiError(err)}`,
				);
			}
		}
	} finally {
		budget.remainingMs -= Date.now() - startedAt;
	}

	return found;
}
