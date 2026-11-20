import vocabList from './vocab.json';

const vocab = new Set<string>(vocabList as string[]);

const MAX_CHARS_PER_WORD = 100;

const isWhitespace = (ch: string) =>
	ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || /\p{Zs}/u.test(ch);

const isControl = (ch: string) => /\p{C}/u.test(ch);

const isPunctuation = (ch: string) => {
	const cp = ch.codePointAt(0)!;
	return (
		(cp >= 33 && cp <= 47) ||
		(cp >= 58 && cp <= 64) ||
		(cp >= 91 && cp <= 96) ||
		(cp >= 123 && cp <= 126) ||
		/\p{P}/u.test(ch)
	);
};

const isCjk = (cp: number) =>
	(cp >= 0x4e00 && cp <= 0x9fff) ||
	(cp >= 0x3400 && cp <= 0x4dbf) ||
	(cp >= 0x20000 && cp <= 0x2a6df) ||
	(cp >= 0x2a700 && cp <= 0x2b73f) ||
	(cp >= 0x2b740 && cp <= 0x2b81f) ||
	(cp >= 0x2b820 && cp <= 0x2ceaf) ||
	(cp >= 0xf900 && cp <= 0xfaff) ||
	(cp >= 0x2f800 && cp <= 0x2fa1f);

function basicTokens(text: string): string[] {
	let spaced = '';
	for (const ch of text) {
		const cp = ch.codePointAt(0)!;
		if (isWhitespace(ch)) spaced += ' ';
		else if (cp === 0 || cp === 0xfffd || isControl(ch)) continue;
		else if (isCjk(cp)) spaced += ` ${ch} `;
		else spaced += ch;
	}

	const tokens: string[] = [];
	for (const word of spaced.split(' ')) {
		if (!word) continue;
		const normalized = word
			.toLowerCase()
			.normalize('NFD')
			.replace(/\p{Mn}/gu, '');

		let current = '';
		for (const ch of normalized) {
			if (isPunctuation(ch)) {
				if (current) tokens.push(current);
				tokens.push(ch);
				current = '';
			} else {
				current += ch;
			}
		}
		if (current) tokens.push(current);
	}
	return tokens;
}

function wordPieceCount(word: string): number {
	const chars = Array.from(word);
	if (chars.length > MAX_CHARS_PER_WORD) return 1;

	let count = 0;
	let start = 0;
	while (start < chars.length) {
		let end = chars.length;
		while (end > start) {
			const piece = (start > 0 ? '##' : '') + chars.slice(start, end).join('');
			if (vocab.has(piece)) break;
			end--;
		}
		if (end === start) return 1;
		count++;
		start = end;
	}
	return count;
}

/** Token count under MiniLM's BERT-uncased WordPiece, excluding [CLS]/[SEP]. */
export function countTokens(text: string): number {
	let total = 0;
	for (const token of basicTokens(text)) total += wordPieceCount(token);
	return total;
}
