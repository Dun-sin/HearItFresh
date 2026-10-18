import {
	BINARY_THEME_QUESTIONS,
	LOVE_TYPE_QUESTIONS,
	ROMANCE_GATED_BINARY_IDS,
	ROMANCE_QUESTION_ID,
} from './questions';
import { type ThemeSlug } from './slugs';

// Jev's own decision boundary. `confidence` is just |yes - no|, so any higher
// floor overrides the model's answer rather than gating on certainty. Inclusive
// because stored probabilities are rounded to 2dp, so 0.50 spans 0.495-0.505.
export const THEME_PROBABILITY_CUTOFF = 0.5;

// bump when the thresholds above or the rules below change; stored themesRaw is
// re-derived locally, so this never costs a Jev call
export const DERIVE_VERSION = 9;

export type JevChoiceAnswer = {
	type?: string;
	choice?: string;
	probabilities?: Record<string, number>;
	confidence?: number;
};

export type JevAnswers = Record<string, JevChoiceAnswer>;

const saysYes = (answers: JevAnswers, questionId: string, cutoff: number) =>
	(answers[questionId]?.probabilities?.yes ?? 0) >= cutoff;

function deriveBinaryThemes(answers: JevAnswers, cutoff: number): ThemeSlug[] {
	return Object.entries(BINARY_THEME_QUESTIONS)
		.filter(
			([questionId]) =>
				!ROMANCE_GATED_BINARY_IDS.includes(questionId) &&
				saysYes(answers, questionId, cutoff),
		)
		.map(([, question]) => question.slug);
}

function deriveLoveThemes(answers: JevAnswers, cutoff: number): ThemeSlug[] {
	if (!saysYes(answers, ROMANCE_QUESTION_ID, cutoff)) return [];

	const types = Object.entries(LOVE_TYPE_QUESTIONS)
		.filter(([questionId]) => saysYes(answers, questionId, cutoff))
		.map(([, question]) => question.slug);

	// a confident gate with no subtype behind it is a bad gate, not a 7th love type
	if (types.length === 0) return [];

	const attributes: ThemeSlug[] = ROMANCE_GATED_BINARY_IDS.filter(
		(questionId) => saysYes(answers, questionId, cutoff),
	).map((questionId) => BINARY_THEME_QUESTIONS[questionId].slug);

	return [...types, ...attributes];
}

export function deriveThemes(
	answers: JevAnswers | null,
	cutoff: number = THEME_PROBABILITY_CUTOFF,
): ThemeSlug[] {
	if (!answers) return [];
	return [
		...deriveLoveThemes(answers, cutoff),
		...deriveBinaryThemes(answers, cutoff),
	];
}
