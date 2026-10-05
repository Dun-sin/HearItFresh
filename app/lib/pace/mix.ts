export type Pace = 'fast' | 'slow';

export type PaceMix = { fast: number };

export type AudioFeatures = {
	tempo: number;
	energy: number;
	danceability: number;
	valence: number;
	acousticness: number;
	instrumentalness: number;
	liveness: number;
	loudness: number;
	speechiness: number;
	key: number;
	mode: number;
};

export type Paced = { pace?: Pace | null };

export const DEFAULT_PACE_MIX: PaceMix = { fast: 50 };

const FEATURE_KEYS = [
	'tempo',
	'energy',
	'danceability',
	'valence',
	'acousticness',
	'instrumentalness',
	'liveness',
	'loudness',
	'speechiness',
	'key',
	'mode',
] as const satisfies readonly (keyof AudioFeatures)[];

const TEMPO_FLOOR = 80;
const TEMPO_CEIL = 140;
const TEMPO_WEIGHT = 0.4;
const DANCEABILITY_WEIGHT = 0.3;
const VALENCE_WEIGHT = 0.3;
const MIN_FAST_ENERGY = 0.45;
const FAST_THRESHOLD = 0.55;
const MIN_INSTRUMENTALNESS = 0.8;
const INSTRUMENTAL_TITLE = /\binstrumental\b/i;

const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

export function parseAudioFeatures(value: unknown): AudioFeatures | null {
	if (!value || typeof value !== 'object') return null;

	const source = value as Record<string, unknown>;
	const features = {} as AudioFeatures;

	for (const key of FEATURE_KEYS) {
		const n = source[key];
		if (typeof n !== 'number' || !Number.isFinite(n)) return null;
		features[key] = n;
	}

	return features;
}

// energy gates rather than scores: it tracks loudness, and quiet songs often get double-time BPM
export function paceOf(features: AudioFeatures | null | undefined): Pace | null {
	if (!features) return null;
	if (features.energy < MIN_FAST_ENERGY) return 'slow';

	const tempo = clamp01((features.tempo - TEMPO_FLOOR) / (TEMPO_CEIL - TEMPO_FLOOR));
	const score =
		TEMPO_WEIGHT * tempo +
		DANCEABILITY_WEIGHT * features.danceability +
		VALENCE_WEIGHT * features.valence;

	return score >= FAST_THRESHOLD ? 'fast' : 'slow';
}

export function isInstrumental(
	title: string,
	features?: AudioFeatures | null,
): boolean {
	return (
		INSTRUMENTAL_TITLE.test(title) ||
		(features?.instrumentalness ?? 0) >= MIN_INSTRUMENTALNESS
	);
}

export function hasPaceMix(mix?: PaceMix | null): mix is PaceMix {
	const fast = mix?.fast;
	return (
		typeof fast === 'number' && Number.isFinite(fast) && fast >= 0 && fast <= 100
	);
}

export function paceTargets(total: number, mix: PaceMix): Record<Pace, number> {
	const fast = Math.round((total * mix.fast) / 100);
	return { fast, slow: total - fast };
}

/** Largest rank-ordered subset (up to `max`) that holds the requested split. */
export function pickPaceMix<T extends Paced>(
	ranked: T[],
	mix: PaceMix,
	max: number,
): T[] {
	const fast = ranked.filter((t) => t.pace === 'fast');
	const slow = ranked.filter((t) => t.pace === 'slow');

	const total = Math.min(
		max,
		mix.fast > 0 ? Math.floor((fast.length * 100) / mix.fast) : Infinity,
		mix.fast < 100 ? Math.floor((slow.length * 100) / (100 - mix.fast)) : Infinity,
	);

	const target = paceTargets(total, mix);
	if (
		(mix.fast > 0 && target.fast === 0) ||
		(mix.fast < 100 && target.slow === 0)
	) {
		return [];
	}

	const chosen = new Set<T>([
		...fast.slice(0, target.fast),
		...slow.slice(0, target.slow),
	]);
	return ranked.filter((t) => chosen.has(t));
}

/** Spreads each pace evenly through the list, keeping rank order within a pace. */
export function interleaveByPace<T extends Paced>(tracks: T[]): T[] {
	const fast = tracks.filter((t) => t.pace === 'fast');
	const slow = tracks.filter((t) => t.pace !== 'fast');
	const ordered: T[] = [];
	let f = 0;
	let s = 0;

	for (let i = 1; i <= tracks.length; i++) {
		const fastBehind = (i * fast.length) / tracks.length - f;
		const slowBehind = (i * slow.length) / tracks.length - s;

		if (f < fast.length && (s >= slow.length || fastBehind >= slowBehind)) {
			ordered.push(fast[f++]);
		} else {
			ordered.push(slow[s++]);
		}
	}

	return ordered;
}
