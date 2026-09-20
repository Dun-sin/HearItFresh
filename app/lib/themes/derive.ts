import {
	BINARY_THEME_QUESTIONS,
	LOVE_TYPE_QUESTION_ID,
	LOVE_TYPE_SLUGS,
	NOT_ROMANTIC,
} from './questions';
import type { ThemeSlug } from './slugs';

export const THEME_PROBABILITY_CUTOFF = 0.55;
export const MIN_CHOICE_CONFIDENCE = 0.5;
export const MULTI_LABEL_FLOOR = 0.2;

// bump when the thresholds above or the rules below change; stored themesRaw is
// re-derived locally, so this never costs a Jev call
export const DERIVE_VERSION = 1;

export type JevChoiceAnswer = {
	type?: string;
	choice?: string;
	probabilities?: Record<string, number>;
	confidence?: number;
};

export type JevAnswers = Record<string, JevChoiceAnswer>;

function probabilityOf(answer: JevChoiceAnswer | undefined, option: string) {
	return answer?.probabilities?.[option] ?? 0;
}

function mostLikelyOption(probabilities: Record<string, number>) {
	return Object.entries(probabilities).sort(
		([optionA, a], [optionB, b]) =>
			b - a ||
			Number(optionB === NOT_ROMANTIC) - Number(optionA === NOT_ROMANTIC),
	)[0];
}

function loveSlugFor(option: string): ThemeSlug | undefined {
	return LOVE_TYPE_SLUGS[option as keyof typeof LOVE_TYPE_SLUGS];
}

function deriveBinaryThemes(answers: JevAnswers): ThemeSlug[] {
	return Object.entries(BINARY_THEME_QUESTIONS)
		.filter(
			([questionId]) =>
				probabilityOf(answers[questionId], 'yes') >= THEME_PROBABILITY_CUTOFF,
		)
		.map(([, question]) => question.slug);
}

function deriveLoveThemes(answers: JevAnswers): ThemeSlug[] {
	const answer = answers[LOVE_TYPE_QUESTION_ID];
	const probabilities = answer?.probabilities;
	if (!probabilities) return [];

	const topChoice = mostLikelyOption(probabilities);
	if (!topChoice) return [];

	const [topOption, topProbability] = topChoice;

	const isDecisive =
		topProbability >= THEME_PROBABILITY_CUTOFF &&
		(answer.confidence ?? 0) >= MIN_CHOICE_CONFIDENCE;

	if (isDecisive) {
		const slug = loveSlugFor(topOption);
		return slug ? [slug] : [];
	}

	const leansNotRomantic =
		topOption === NOT_ROMANTIC ||
		probabilityOf(answer, NOT_ROMANTIC) >= THEME_PROBABILITY_CUTOFF;

	if (leansNotRomantic || topProbability >= THEME_PROBABILITY_CUTOFF) return [];

	const contenders = Object.entries(probabilities)
		.filter(
			([option, probability]) =>
				option !== NOT_ROMANTIC && probability >= MULTI_LABEL_FLOOR,
		)
		.map(([option]) => loveSlugFor(option))
		.filter((slug): slug is ThemeSlug => Boolean(slug));

	return contenders.length >= 2 ? contenders : [];
}

export function deriveThemes(answers: JevAnswers | null): ThemeSlug[] {
	if (!answers) return [];
	return [...deriveLoveThemes(answers), ...deriveBinaryThemes(answers)];
}
