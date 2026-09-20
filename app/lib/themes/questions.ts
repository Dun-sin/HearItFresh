import { createHash } from 'crypto';
import type { ThemeSlug } from './slugs';

export type JevQuestion = {
	type: 'choice';
	instructions: string;
	criteria: Record<string, string>;
};

type BinaryThemeQuestion = JevQuestion & {
	slug: ThemeSlug;
	criteria: { yes: string; no: string };
};

export const LOVE_TYPE_QUESTION_ID = 'love_type';

export const NOT_ROMANTIC = 'not_romantic';

export const LOVE_TYPE_QUESTION: JevQuestion = {
	type: 'choice',
	instructions:
		'Is this song centrally about a romantic relationship between the narrator and another person? If the song uses romantic-sounding language but is not actually about a real interpersonal relationship — addressing an abstract concept, a group of people, an institution, or society at large — answer not_romantic. Only choose a romantic category if there is an actual relationship being described.',
	criteria: {
		not_romantic:
			'Not centrally about a romantic relationship between two people, even if romantic-sounding vocabulary appears',
		earnest_devotional:
			'A real relationship, expressed with sincere, tender devotion or contentment',
		yearning_unresolved:
			'Longing for a real partner not fully attained or present',
		betrayal_or_breakup:
			'Being wronged, hurt, or betrayed by a partner, or a relationship ending — whether still raw or already healing',
		playful_flirtatious: 'Light, teasing flirtation or attraction',
		obsessive_intense: 'Possessive or all-consuming romantic intensity',
		bittersweet_conflicted:
			"Doubt, pain, or ambivalence within a relationship that's still ongoing",
	},
};

export const LOVE_TYPE_SLUGS = {
	earnest_devotional: 'love_earnest',
	yearning_unresolved: 'love_yearning',
	betrayal_or_breakup: 'love_betrayal',
	playful_flirtatious: 'love_playful',
	obsessive_intense: 'love_obsessive',
	bittersweet_conflicted: 'love_bittersweet',
} as const satisfies Record<string, ThemeSlug>;

export const BINARY_THEME_QUESTIONS: Record<string, BinaryThemeQuestion> = {
	love_person_gendered: {
		type: 'choice',
		slug: 'love_gendered',
		instructions:
			"Does this song use gendered pronouns (he/she/him/her) or a name to refer to a romantic partner or love interest who is a separate person from the narrator? Do not answer yes if the name/pronoun refers to the narrator's own self, an alter-ego, or is used in self-address (e.g. an artist singing to themselves by name).",
		criteria: {
			yes: 'Uses gendered pronouns or a name to refer to a separate romantic partner or love interest, distinct from the narrator',
			no: "Uses only ungendered address like 'you', refers to the narrator's own self/alter-ego by name, or doesn't reference a specific romantic partner's identity at all",
		},
	},
	grief_nonromantic: {
		type: 'choice',
		slug: 'grief',
		instructions:
			'Is this song about loss, death, or grief unrelated to a romantic relationship?',
		criteria: {
			yes: 'About non-romantic loss, death, or grief',
			no: 'Not about non-romantic loss or grief',
		},
	},
	sexual_explicit: {
		type: 'choice',
		slug: 'sexual_explicit',
		instructions:
			'Does this song contain sexually explicit content as a central focus?',
		criteria: {
			yes: 'Sexually explicit content is a central focus',
			no: 'No sexually explicit content, or only incidental',
		},
	},
	substance_use: {
		type: 'choice',
		slug: 'substance_use',
		instructions:
			'Does this song reference drug or alcohol use as a central theme?',
		criteria: {
			yes: 'Drug or alcohol use is a central theme',
			no: 'No substance use, or only incidental mention',
		},
	},
	self_reflection: {
		type: 'choice',
		slug: 'self_reflection',
		instructions:
			'Is this song primarily about the narrator examining their own identity, growth, or internal state?',
		criteria: {
			yes: "Primarily about the narrator's own identity, growth, or internal state",
			no: 'Primarily about an external event or another person',
		},
	},
	celebration_hype: {
		type: 'choice',
		slug: 'celebration',
		instructions:
			'Is this song primarily about celebration, triumph, confidence, or high-energy enjoyment?',
		criteria: {
			yes: 'Primarily about celebration, triumph, confidence, or hype',
			no: 'Not primarily about celebration or hype',
		},
	},
	social_political: {
		type: 'choice',
		slug: 'social_political',
		instructions:
			'Does this song primarily address a social, political, or systemic issue?',
		criteria: {
			yes: 'Primarily about a social, political, or systemic issue',
			no: 'Primarily about a personal experience instead',
		},
	},
	platonic_connection: {
		type: 'choice',
		slug: 'platonic',
		instructions:
			'Is this song primarily about a platonic relationship — friendship, family, or community?',
		criteria: {
			yes: 'Primarily about friendship, family, or community bond',
			no: 'Not primarily about a platonic relationship',
		},
	},
	metaphoric_expression: {
		type: 'choice',
		slug: 'metaphoric',
		instructions:
			"If this song expresses romantic or emotional feeling, is that feeling conveyed primarily through metaphor, symbolism, or imagery (e.g. nature, ritual gestures, extended comparison) rather than being stated plainly and directly (e.g. 'I love you', 'I don't want to live without you')? Consider symbolic use of ordinary objects or actions (like a shared ritual or gesture) as metaphoric, not just poetic or cosmic imagery.",
		criteria: {
			yes: 'The feeling is primarily conveyed through metaphor, symbolism, or imagery, not stated directly',
			no: 'The feeling is stated plainly and directly, with little metaphor or imagery carrying the emotional weight',
		},
	},
	nostalgia_memory: {
		type: 'choice',
		slug: 'nostalgia',
		instructions:
			'Is this song primarily about looking back on the past or memory?',
		criteria: {
			yes: 'Primarily about the past or memory',
			no: 'Primarily about the present or future',
		},
	},
	mental_health_struggle: {
		type: 'choice',
		slug: 'mental_health',
		instructions:
			'Does this song center on anxiety, depression, trauma, or emotional struggle as its primary theme?',
		criteria: {
			yes: 'Centers on anxiety, depression, trauma, or emotional struggle',
			no: 'Does not center on these',
		},
	},
	defiant_empowered: {
		type: 'choice',
		slug: 'defiant',
		instructions:
			'Is this song primarily about defiance, reclaiming power, or empowerment — proving doubters wrong, refusing to be controlled, or asserting strength — regardless of whether it involves a romantic relationship?',
		criteria: {
			yes: 'Primarily about defiance, empowerment, or reclaiming power/strength',
			no: 'Not primarily about defiance or empowerment',
		},
	},
};

export function buildJevQuestions(
	questionIds?: readonly string[],
): Record<string, JevQuestion> {
	const binaries = Object.entries(BINARY_THEME_QUESTIONS).map(
		([id, { slug, ...question }]) => [id, question] as const,
	);

	const all: Record<string, JevQuestion> = {
		[LOVE_TYPE_QUESTION_ID]: LOVE_TYPE_QUESTION,
		...Object.fromEntries(binaries),
	};

	if (!questionIds) return all;

	return Object.fromEntries(
		questionIds.filter((id) => all[id]).map((id) => [id, all[id]]),
	);
}

function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);

	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value as Record<string, unknown>)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([key, nested]) => [key, canonicalize(nested)]),
		);
	}

	return value;
}

function hashOf(value: unknown): string {
	return createHash('sha256')
		.update(JSON.stringify(canonicalize(value)))
		.digest('hex')
		.slice(0, 12);
}

export type QuestionVersions = Record<string, string>;

export const QUESTION_VERSIONS: QuestionVersions = Object.fromEntries(
	Object.entries(buildJevQuestions()).map(([id, question]) => [
		id,
		hashOf(question),
	]),
);
