export type SmfInlineToken =
	| { type: 'text'; value: string }
	| { type: 'chord'; value: string };

const ESCAPABLE = new Set(['[', ']', '|', '!', '\\']);

export function unescapeSmfText(value: string): string {
	let output = '';

	for (let i = 0; i < value.length; i++) {
		const current = value.charAt(i);
		const next = value.charAt(i + 1);

		if (current === '\\' && next && ESCAPABLE.has(next)) {
			output += next;
			i++;
			continue;
		}

		output += current;
	}

	return output;
}

export function parseInlineChords(input: string): SmfInlineToken[] {
	const tokens: SmfInlineToken[] = [];
	let currentText = '';

	const flushText = () => {
		if (currentText.length > 0) {
			tokens.push({ type: 'text', value: currentText });
			currentText = '';
		}
	};

	for (let i = 0; i < input.length; i++) {
		const current = input.charAt(i);
		const next = input.charAt(i + 1);

		if (current === '\\' && next && ESCAPABLE.has(next)) {
			currentText += next;
			i++;
			continue;
		}

		if (current !== '[') {
			currentText += current;
			continue;
		}

		const end = input.indexOf(']', i + 1);
		if (end === -1 || end === i + 1) {
			currentText += current;
			continue;
		}

		const chord = input.slice(i + 1, end).trim();
		if (!chord) {
			currentText += current;
			continue;
		}

		flushText();
		tokens.push({ type: 'chord', value: chord });
		i = end;
	}

	flushText();
	return tokens;
}

/** One lyric fragment with the chord(s) placed above its start (ChordPro-style). */
export interface ChordproSegment {
	chords: string | null;
	lyric: string;
}

export function lineToChordproSegments(line: string): ChordproSegment[] {
	const tokens = parseInlineChords(line);
	const segments: ChordproSegment[] = [];
	const chordStack: string[] = [];
	let pendingWs = '';

	const flushChordsIntoNextText = (lyric: string) => {
		const chords = chordStack.length > 0 ? chordStack.join(' ') : null;
		chordStack.length = 0;
		segments.push({ chords, lyric });
	};

	for (const token of tokens) {
		if (token.type === 'chord') {
			chordStack.push(token.value);
			continue;
		}

		const lyric = token.value;

		if (/^\s*$/.test(lyric) && chordStack.length > 0) {
			pendingWs += lyric;
			continue;
		}

		pendingWs = '';
		flushChordsIntoNextText(lyric);
	}

	if (chordStack.length > 0) {
		const lyric = /^\s*$/.test(pendingWs) ? '' : pendingWs;
		flushChordsIntoNextText(lyric);
	}

	return segments;
}

/** Maps strum/slash ASCII stroke letters to arrows; spacing and bar characters pass through. */
export function mapRhythmSymbol(ch: string): string {
	const u = ch.toUpperCase();
	switch (u) {
		case 'D':
			return '↓';
		case 'U':
			return '↑';
		case 'X':
			return '✕';
		case '-':
			return '·';
		case 'T':
			return '⊤';
		default:
			return ch;
	}
}

export function mapRhythmAsciiLine(line: string): string {
	let out = '';
	for (const ch of line) {
		out += mapRhythmSymbol(ch);
	}
	return out;
}
