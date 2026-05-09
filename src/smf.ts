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

/** Maps strum ASCII stroke letters to arrows; spacing and bar characters pass through. */
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

/** Used for strum pattern rows only; slash blocks render chord lines literally. */
export function mapRhythmAsciiLine(line: string): string {
	let out = '';
	for (const ch of line) {
		out += mapRhythmSymbol(ch);
	}
	return out;
}

export type SlashLineTokenKind = 'whitespace' | 'beat' | 'bar' | 'chord';

export type SlashLineToken = { kind: SlashLineTokenKind; text: string };

/** Split a slash-chart line into runs (whitespace preserved) for styled rendering. */
export function tokenizeSlashLine(line: string): SlashLineToken[] {
	const parts = line.split(/(\s+)/);
	const out: SlashLineToken[] = [];
	for (const part of parts) {
		if (!part) {
			continue;
		}
		if (/^\s+$/.test(part)) {
			out.push({ kind: 'whitespace', text: part });
			continue;
		}
		if (part === '/') {
			out.push({ kind: 'beat', text: part });
			continue;
		}
		if (/^\|+$/.test(part)) {
			out.push({ kind: 'bar', text: part });
			continue;
		}
		out.push({ kind: 'chord', text: part });
	}
	return out;
}

/** One slash stroke on the staff; optional chord written above it. */
export interface SlashStaffBeat {
	chord: string | null;
}

export interface SlashStaffMeasure {
	beats: SlashStaffBeat[];
}

/**
 * Parse a slash-chart line into measures (split by `|`) and beats (each `/`).
 * Chord tokens apply to following slashes until the next chord (e.g. `G / G /`).
 */
export function parseSlashStaffLine(line: string): SlashStaffMeasure[] {
	const measures: SlashStaffMeasure[] = [];
	const chunks = line
		.split('|')
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	for (const chunk of chunks) {
		const tokens = chunk.split(/\s+/).filter((t) => t.length > 0);
		let currentChord: string | null = null;
		const beats: SlashStaffBeat[] = [];
		for (const t of tokens) {
			if (t === '/') {
				beats.push({ chord: currentChord });
				continue;
			}
			currentChord = t;
		}
		if (beats.length > 0) {
			measures.push({ beats });
		}
	}
	return measures;
}
