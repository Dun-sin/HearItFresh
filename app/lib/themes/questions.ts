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
		'Is this song centrally about romance between the narrator and another person? If the song uses romantic-sounding language but is not actually about a real interpersonal connection — addressing an abstract concept, a group of people, an institution, or society at large — answer not_romantic. If it is genuinely about romance but none of the specific categories fit (e.g. turning down someone\'s advances, a situationship, a crush that never became anything), answer romance_adjacent rather than forcing the closest category.',
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
		romance_adjacent:
			'About romance or attraction, but none of the categories above describe it',
	},
};

export const LOVE_TYPE_SLUGS = {
	earnest_devotional: 'love_earnest',
	yearning_unresolved: 'love_yearning',
	betrayal_or_breakup: 'love_betrayal',
	playful_flirtatious: 'love_playful',
	obsessive_intense: 'love_obsessive',
	bittersweet_conflicted: 'love_bittersweet',
	romance_adjacent: 'love_other',
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
			'Does this song contain sexually explicit content — graphic or clearly sexual lyrics — anywhere in it, even if it is not the main subject?',
		criteria: {
			yes: 'Contains sexually explicit lyrics, whether in one verse or throughout',
			no: 'No sexually explicit lyrics; at most mild, non-graphic romance or innuendo',
		},
	},
	substance_use: {
		type: 'choice',
		slug: 'substance_use',
		instructions:
			'Does this song depict or reference using drugs or alcohol anywhere in it, even if it is not the main subject?',
		criteria: {
			yes: 'Depicts or references drug or alcohol use, whether in one line or throughout',
			no: 'No reference to anyone using drugs or alcohol',
		},
	},
	self_reflection: {
		type: 'choice',
		slug: 'self_reflection',
		instructions:
			'Is this song primarily about the narrator examining their own identity, growth, or internal state?',
		criteria: {
			yes: "Primarily about the narrator's own identity, growth, or internal state",
			no: "Not primarily about the narrator's own identity, growth, or internal state",
		},
	},
	celebration_hype: {
		type: 'choice',
		slug: 'celebration',
		instructions:
			'Is this song primarily about celebrating and having a good time — partying, enjoying the moment, or hyping up good times? Overcoming adversity or standing up to someone is not celebration.',
		criteria: {
			yes: 'Primarily about partying, enjoying the moment, or celebrating good times',
			no: 'Not primarily about celebrating or having a good time',
		},
	},
	social_political: {
		type: 'choice',
		slug: 'social_political',
		instructions:
			'Does this song primarily address a social, political, or systemic issue?',
		criteria: {
			yes: 'Primarily about a social, political, or systemic issue',
			no: 'Not primarily about a social, political, or systemic issue',
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
	nostalgia_memory: {
		type: 'choice',
		slug: 'nostalgia',
		instructions:
			'Is this song primarily about looking back on the past or memory?',
		criteria: {
			yes: 'Primarily about the past or memory',
			no: 'Not primarily about the past or memory',
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
			'Is this song primarily about overcoming something that held the narrator down — proving doubters wrong, breaking free from control or oppression, or standing up to pressure? Simply turning down someone\'s romantic interest does not count.',
		criteria: {
			yes: 'Primarily about overcoming, breaking free, or standing up to something that held the narrator down',
			no: "Not primarily about overcoming or standing up to something, including songs that just reject someone's advances",
		},
	},
	violence_aggression: {
		type: 'choice',
		slug: 'violence',
		instructions:
			'Does this song depict, threaten, or glorify violence or physical aggression anywhere in it, even if it is not the main subject?',
		criteria: {
			yes: 'Depicts, threatens, or glorifies violence or physical aggression',
			no: 'No violence or physical aggression, or only as a clearly figurative turn of phrase',
		},
	},
	faith_religious: {
		type: 'choice',
		slug: 'faith',
		instructions:
			'Is this song primarily about faith, God, worship, or a religious belief?',
		criteria: {
			yes: 'Primarily about faith, God, worship, or religious belief',
			no: 'Not primarily about faith or religion',
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
