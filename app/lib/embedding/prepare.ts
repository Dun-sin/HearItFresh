import { countTokens } from './tokenizer';

export const EMBEDDING_VERSION = 1;

// MiniLM truncates at 256 tokens including [CLS] and [SEP]
const CHUNK_TOKEN_BUDGET = 254;
const MAX_REPEATED_PHRASE_WORDS = 4;
const CHUNK_SEPARATORS = ['\n\n', '\n', ' '];

const FILLER_WORD =
	/^(?:o+h*|a+h+|u+h+|h?m+|ye+a*h*|ya+|la+|na+|da+|doo+|he+y+|wo+(?:a+h*)?|who+a+h*|ha+|hu+h|eh+|ay+e*)$/;

const REPEAT_MARKER =
	/\s*(?:\(\s*\**\s*(?:x\s?\d+|\d+\s?x|repeat\b[^)]*)\s*\)|\b(?:x\s?\d+|\d+\s?x))\s*$/i;

const SECTION_LABEL =
	/^((?:(?:\d+(?:st|nd|rd|th)|first|second|third|fourth|last)\s+)?(?:repeat\s+(?:the\s+)?)?(?:pre-?chorus|post-?chorus|chorus|refrain|hook|verse|bridge|intro|outro|interlude|breakdown|instrumental(?:\s+break)?|(?:guitar|keyboard|piano|sax|drum)\s+solo|solo)(?:\s*\d+)?(?:\s*(?:x\s?\d+|\d+\s?x))?)\s*(.*)$/i;

const BARE_REPEAT = /^repeat(?:\s+(?:till|until)\s+(?:fade|end))?$/i;
const LABEL_DECORATION = /^[\s\-*#~_♪]+|[\s\-*#~_♪!.]+$/g;

export type EmbeddingChunk = { text: string; tokens: number };

const normalizeKey = (text: string) =>
	text
		.toLowerCase()
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.replace(/['’`]/g, '')
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();

/** Removes "(x2)"-style repeat markers and "Chorus:"-style labels; null when the whole line is a label. */
function stripSectionMarkup(line: string): string | null {
	const text = line.replace(REPEAT_MARKER, '').trim();
	if (!text) return null;

	const bare = text.replace(LABEL_DECORATION, '').replace(/^\((.*)\)$/, '$1').trim();
	if (BARE_REPEAT.test(bare)) return null;

	const label = bare.match(SECTION_LABEL);
	if (!label) return text;

	const rest = label[2].trim();
	if (!rest || /^\([^)]*\)\s*:?$/.test(rest)) return null;
	if (!rest.startsWith(':')) return text;

	const after = rest.slice(1).trim();
	return !after || /^\(.*\)$/.test(after) ? null : after;
}

const lineKey = (line: string) =>
	normalizeKey(line)
		.split(' ')
		.filter((word) => word && !FILLER_WORD.test(word))
		.join(' ');

function collapseRepeatedPhrases(line: string): string {
	const words: { word: string; key: string }[] = [];

	for (const word of line.split(/\s+/)) {
		if (!word) continue;
		words.push({ word, key: normalizeKey(word) || word });

		let collapsed = true;
		while (collapsed) {
			collapsed = false;
			for (
				let n = 1;
				n <= MAX_REPEATED_PHRASE_WORDS && 2 * n <= words.length;
				n++
			) {
				const tail = words.length - n;
				let repeated = true;
				for (let i = 0; i < n; i++) {
					if (words[tail - n + i].key !== words[tail + i].key) {
						repeated = false;
						break;
					}
				}
				if (repeated) {
					words.length = tail;
					collapsed = true;
					break;
				}
			}
		}
	}

	return words.map(({ word }) => word).join(' ');
}

/**
 * Derives the text to embed from stored lyrics: strips section tags, labels and
 * repeat markers, drops filler-only lines and any line already seen earlier in
 * the song (ignoring filler words), and collapses back-to-back repeated phrases
 * within a line.
 */
export function prepareLyricsForEmbedding(raw: string): string {
	const seen = new Set<string>();
	const blocks: string[][] = [[]];

	const lines = raw
		.replace(/\r\n?/g, '\n')
		.replace(/\[[^\]\n]*\]/g, '')
		.split('\n');

	for (const rawLine of lines) {
		const markupFree = stripSectionMarkup(rawLine.trim());
		const line = markupFree ? collapseRepeatedPhrases(markupFree) : '';
		if (!line) {
			if (blocks[blocks.length - 1].length > 0) blocks.push([]);
			continue;
		}

		const key = lineKey(line);
		if (!key || seen.has(key)) continue;

		seen.add(key);
		blocks[blocks.length - 1].push(line);
	}

	return blocks
		.filter((block) => block.length > 0)
		.map((block) => block.join('\n'))
		.join('\n\n');
}

function splitToBudget(text: string, level: number): EmbeddingChunk[] {
	const tokens = countTokens(text);
	if (tokens <= CHUNK_TOKEN_BUDGET || level >= CHUNK_SEPARATORS.length) {
		return [{ text, tokens }];
	}

	const separator = CHUNK_SEPARATORS[level];
	const chunks: EmbeddingChunk[] = [];
	let current: EmbeddingChunk | null = null;

	for (const part of text.split(separator)) {
		if (!part.trim()) continue;
		for (const piece of splitToBudget(part, level + 1)) {
			if (current && current.tokens + piece.tokens <= CHUNK_TOKEN_BUDGET) {
				current = {
					text: current.text + separator + piece.text,
					tokens: current.tokens + piece.tokens,
				};
			} else {
				if (current) chunks.push(current);
				current = piece;
			}
		}
	}
	if (current) chunks.push(current);

	return chunks;
}

/** Splits prepared text into chunks that each fit MiniLM's window, preferring block, then line, then word boundaries. */
export function chunkForEmbedding(text: string): EmbeddingChunk[] {
	if (!text.trim()) return [];
	return splitToBudget(text, 0);
}
