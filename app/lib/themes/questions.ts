import { createHash } from 'crypto';
import type { ThemeSlug } from './slugs';

export type JevQuestion = {
	type: 'choice';
	instructions: string;
	criteria: Record<string, string>;
};

export type BinaryThemeQuestion = JevQuestion & {
	slug: ThemeSlug;
	criteria: { yes: string; no: string };
};

export const ROMANCE_QUESTION_ID = 'romance_any';

// attributes of a romance rather than kinds of one: they describe how a love
// interest is referred to, so they only mean anything once romance_any passes
export const ROMANCE_GATED_BINARY_IDS = ['love_person_gendered'];

export const ROMANCE_QUESTION: JevQuestion = {
	type: 'choice',
	instructions:
		'Is romance, attraction, or a love interest between the narrator and another person a significant part of this song — including relationships, crushes, flirting, situationships, longing, breakups, or turning someone down? Love, devotion, or grief directed at a person who is not a romantic interest does not count: a parent, child, sibling, friend, bandmate, hero, or someone who is ill, dying, or being mourned. Disillusionment with a person, admiring them, or being hurt by them is not romance unless they are a romantic interest. Romantic-sounding language aimed at an abstract concept, a place, a group of people, or society at large does not count. A passing line or a single mention does not count, even one that names a partner — the romance has to be a significant part of what the song is about.',
	criteria: {
		yes: 'Romance, attraction, or a love interest between the narrator and another person is a significant part of the song',
		no: 'Romance is absent or only a passing mention; devotion to a friend or relative, grief for someone dying, or being hurt by a non-romantic person do not count, however loving the language',
	},
};

export const LOVE_TYPE_QUESTIONS: Record<string, BinaryThemeQuestion> = {
	love_earnest_devotional: {
		type: 'choice',
		slug: 'love_earnest',
		instructions:
			'Is the romance in this song mainly sincere, tender devotion to or contentment with a partner? If the song is not about romance, answer no.',
		criteria: {
			yes: 'The romance is mainly sincere, tender devotion or contentment with a partner',
			no: 'The romance is mainly something else, or the song is not about romance',
		},
	},
	love_yearning_unresolved: {
		type: 'choice',
		slug: 'love_yearning',
		instructions:
			'Is the romance in this song mainly longing for a partner or love interest who is out of reach or absent? If the song is not about romance, answer no.',
		criteria: {
			yes: 'The romance is mainly longing for a partner or love interest who is out of reach or absent',
			no: 'The romance is mainly something else, or the song is not about romance',
		},
	},
	love_betrayal_or_breakup: {
		type: 'choice',
		slug: 'love_betrayal',
		instructions:
			'Is the romance in this song mainly about being wronged or betrayed by a partner, or a relationship ending — whether still raw or already healing? If the song is not about romance, answer no.',
		criteria: {
			yes: 'The romance is mainly about betrayal by a partner or a relationship ending',
			no: 'The romance is mainly something else, or the song is not about romance',
		},
	},
	love_playful_flirtatious: {
		type: 'choice',
		slug: 'love_playful',
		instructions:
			'Is the romance in this song mainly light, teasing flirtation or playful attraction? If the song is not about romance, answer no.',
		criteria: {
			yes: 'The romance is mainly light, teasing flirtation or playful attraction',
			no: 'The romance is mainly something else, or the song is not about romance',
		},
	},
	love_obsessive_intense: {
		type: 'choice',
		slug: 'love_obsessive',
		instructions:
			'Does the romance in this song mainly turn possessive, controlling, or unhealthily fixated — jealousy that controls a partner, being unable to function without them, or stalking-like behaviour? Strong desire, lust, intense attraction, or devotion on its own is not obsessive. If the song is not about romance, answer no.',
		criteria: {
			yes: 'The romance is mainly possessive, controlling, or an unhealthy fixation',
			no: 'The romance is not possessive or unhealthily fixated (desire, lust, or devotion alone does not count), or the song is not about romance',
		},
	},
	love_bittersweet_conflicted: {
		type: 'choice',
		slug: 'love_bittersweet',
		instructions:
			'Is the couple in this song still together, with the song mainly about doubt, unhappiness, or mixed feelings within that relationship? Breakups, longing for someone absent, and pure lust are not bittersweet. If the song is not about romance, answer no.',
		criteria: {
			yes: 'The couple is still together and the song is mainly about doubt, unhappiness, or mixed feelings in the relationship',
			no: 'Not an ongoing relationship with mixed feelings (breakups, longing, and lust do not count), or the song is not about romance',
		},
	},
};

export const BINARY_THEME_QUESTIONS: Record<string, BinaryThemeQuestion> = {
	love_person_gendered: {
		type: 'choice',
		slug: 'love_gendered',
		instructions:
			"Does this song reveal the gender of a romantic partner or love interest who is a separate person from the narrator — through gendered pronouns (he/she/him/her), gendered words such as man, woman, boy, girl, guy or lady, or by naming them? Do not answer yes if the gendered word or name refers to the narrator's own self, an alter-ego, or is used in self-address (e.g. an artist singing to themselves by name), or if it refers to someone who is not a love interest, such as a rival, a friend, or a family member.",
		criteria: {
			yes: "Reveals a separate love interest's gender, by pronoun, gendered word, or name",
			no: "Never reveals the love interest's gender — only ungendered address like 'you' — or the gendered word refers to the narrator themselves or to someone who is not a love interest",
		},
	},
	grief_nonromantic: {
		type: 'choice',
		slug: 'grief',
		instructions:
			'Is this song about mourning someone who has died, or a comparable bereavement, outside of a romantic breakup? Figurative loss does not count: losing youth, innocence, a job, a home, or a former version of yourself is not grief unless someone is actually being mourned as dead or gone for good.',
		criteria: {
			yes: 'About mourning someone who has died or is gone for good, outside a romantic breakup',
			no: 'Not about mourning a person; figurative loss such as lost youth, innocence, or opportunity does not count',
		},
	},
	sexual_explicit: {
		type: 'choice',
		slug: 'sexual_explicit',
		instructions:
			'Does this song describe sex — sex acts, bodies, or arousal in graphic or clearly sexual terms — anywhere in it, even if it is not the main subject? Judge what is described, not how crude the language is. Profanity is never sexual content on its own. The word "fuck" is only sexual when it names a sex act; used as an insult, an intensifier, or to mean beat, ruin, destroy or defeat someone — "I\'m about to fuck that", "they\'re gonna fuck you up", "fucked it up" — it is not sexual and must not count. A song can swear constantly and still describe no sex at all.',
		criteria: {
			yes: 'Describes sex acts, bodies, or arousal in graphic or clearly sexual terms, whether in one line or throughout',
			no: 'Describes no sex, even if the song is profane, crude, aggressive or violent; at most mild romance or innuendo',
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
			'Is this song primarily the narrator examining themselves — questioning who they are, taking stock of how they have changed, or working out what they believe? Expressing an emotion is not self-examination: being sad, angry, lonely, or in love is a feeling, not an inspection of the self.',
		criteria: {
			yes: 'Primarily the narrator questioning or taking stock of who they are or who they are becoming',
			no: 'Not primarily self-examination, even if the song is emotional, introspective in tone, or written in first person',
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
			'Is a specific non-romantic bond — a friendship, a family relationship, or belonging to a community — the actual subject of this song? Mentioning friends or family in passing does not count, nor does addressing a crowd, nor does "we" used to mean people in general.',
		criteria: {
			yes: 'The friendship, family relationship, or sense of belonging is what the song is about',
			no: 'Not about a non-romantic bond, even if friends, family, or "we" are mentioned along the way',
		},
	},
	nostalgia_memory: {
		type: 'choice',
		slug: 'nostalgia',
		instructions:
			'Is this song primarily about the past itself — remembering an earlier time, person, or version of life, and feeling its pull? Telling a story in past tense is not nostalgia: the past has to be the subject, not just the timeframe. Recounting a recent breakup, argument, or event does not count.',
		criteria: {
			yes: 'Primarily about remembering an earlier time and feeling its pull',
			no: 'Not primarily about the past, even if the song narrates past events or is written in past tense',
		},
	},
	mental_health_struggle: {
		type: 'choice',
		slug: 'mental_health',
		instructions:
			'Does this song deal with the narrator or someone in it living with a mental-health condition or crisis — anxiety, depression, trauma, self-harm, suicidal thoughts, an eating disorder, or addiction and recovery? Ordinary painful emotion is not a mental-health struggle: sadness, heartbreak, loneliness, longing, jealousy, insecurity, or feeling low after a breakup do not count, however intensely they are expressed. Words like crazy, insane, mad, sick, or dying used as insult, hyperbole, or metaphor do not count either.',
		criteria: {
			yes: 'Deals with an actual mental-health condition or crisis — depression, anxiety, trauma, self-harm, suicidal thoughts, disordered eating, or addiction',
			no: 'Only ordinary emotional pain such as sadness, heartbreak, loneliness or insecurity, or mental-health words used as metaphor, hyperbole or insult',
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
	const binaries = Object.entries({
		...LOVE_TYPE_QUESTIONS,
		...BINARY_THEME_QUESTIONS,
	}).map(([id, { slug, ...question }]) => [id, question] as const);

	const all: Record<string, JevQuestion> = {
		[ROMANCE_QUESTION_ID]: ROMANCE_QUESTION,
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
