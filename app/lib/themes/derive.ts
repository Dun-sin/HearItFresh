import {
	BINARY_THEME_QUESTIONS,
	LOVE_TYPE_QUESTIONS,
	ROMANCE_QUESTION_ID,
} from './questions';
import { LOVE_CATCH_ALL_SLUG, type ThemeSlug } from './slugs';

export const THEME_PROBABILITY_CUTOFF = 0.55;

// bump when the thresholds above or the rules below change; stored themesRaw is
// re-derived locally, so this never costs a Jev call
export const DERIVE_VERSION = 5;

export type JevChoiceAnswer = {
	type?: string;
	choice?: string;
	probabilities?: Record<string, number>;
	confidence?: number;
};

export type JevAnswers = Record<string, JevChoiceAnswer>;

const saysYes = (answers: JevAnswers, questionId: string, cutoff: number) =>
	(answers[questionId]?.probabilities?.yes ?? 0) >= cutoff;

function deriveBinaryThemes(answers: JevAnswers): ThemeSlug[] {
	return Object.entries(BINARY_THEME_QUESTIONS)
		.filter(([questionId]) =>
			saysYes(answers, questionId, THEME_PROBABILITY_CUTOFF),
		)
		.map(([, question]) => question.slug);
}

function deriveLoveThemes(answers: JevAnswers): ThemeSlug[] {
	if (!saysYes(answers, ROMANCE_QUESTION_ID, THEME_PROBABILITY_CUTOFF))
		return [];

	const types = Object.entries(LOVE_TYPE_QUESTIONS)
		.filter(([questionId]) =>
			saysYes(answers, questionId, THEME_PROBABILITY_CUTOFF),
		)
		.map(([, question]) => question.slug);

	return types.length > 0 ? types : [LOVE_CATCH_ALL_SLUG];
}

export function deriveThemes(answers: JevAnswers | null): ThemeSlug[] {
	if (!answers) return [];
	return [...deriveLoveThemes(answers), ...deriveBinaryThemes(answers)];
}
