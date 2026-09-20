import axios from 'axios';
import { axiosErrors, withRetry } from '../retry';
import { formatApiError } from '../utils';
import { buildJevQuestions } from './questions';
import type { JevAnswers } from './derive';

const JEV_ENDPOINT = 'https://api.typesafe.ai/v1/systemone';
const JEV_MODEL = 'jev-latest';
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504, 529];

export type ClassifiableSong = {
	title: string;
	artist: string;
	lyrics: string | null;
};

function buildState({ title, artist, lyrics }: ClassifiableSong) {
	return `Title: ${title}\nArtist: ${artist}\n\n${lyrics}`;
}

export async function classifySongThemes(
	song: ClassifiableSong,
	signal?: AbortSignal,
	questionIds?: readonly string[],
): Promise<JevAnswers | null> {
	if (questionIds && questionIds.length === 0) return null;

	if (!song.lyrics?.trim()) return null;

	const apiKey = process.env.TYPESAFE_API_KEY;
	if (!apiKey) {
		console.warn('TYPESAFE_API_KEY is not set, skipping theme classification');
		return null;
	}

	try {
		const { data } = await withRetry(
			() =>
				axios.post(
					JEV_ENDPOINT,
					{
						model: JEV_MODEL,
						state: buildState(song),
						questions: buildJevQuestions(questionIds),
					},
					{ headers: { Authorization: `Bearer ${apiKey}` }, signal },
				),
			{
				errors: axiosErrors,
				label: 'Jev classify',
				retryOn: RETRYABLE_STATUSES,
				signal,
			},
		);

		return (data?.answers as JevAnswers) ?? null;
	} catch (err) {
		if (signal?.aborted) throw new Error('Aborted');
		console.warn(
			`Theme classification failed for "${song.title}": ${formatApiError(err)}`,
		);
		return null;
	}
}
