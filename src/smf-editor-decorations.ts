import { tokenizeSlashLine } from './smf.js';

const ESCAPABLE = new Set(['[', ']', '|', '!', '\\']);

export type SmfFenceHighlightClass =
	| 'song-cm-chordpro-chord'
	| 'song-cm-chordpro-escape'
	| 'song-cm-strum-count'
	| 'song-cm-strum-beat'
	| 'song-cm-strum-stroke'
	| 'song-cm-slash-bar'
	| 'song-cm-slash-beat'
	| 'song-cm-slash-chord';

export interface SmfFenceSpan {
	readonly from: number;
	readonly to: number;
	readonly className: SmfFenceHighlightClass;
}

function cmpSpan(a: SmfFenceSpan, b: SmfFenceSpan): number {
	const d = a.from - b.from;
	return d !== 0 ? d : a.to - b.to;
}

function sortDedupe(spans: SmfFenceSpan[]): SmfFenceSpan[] {
	spans.sort(cmpSpan);
	const out: SmfFenceSpan[] = [];
	let prev: SmfFenceSpan | undefined;
	for (const s of spans) {
		if (prev && prev.from === s.from && prev.to === s.to && prev.className === s.className) {
			continue;
		}
		out.push(s);
		prev = s;
	}
	return out;
}

/**
 * Iterate logical lines inside a fenced body, preserving absolute offsets into `body`.
 */
function forEachLineWithStart(
	body: string,
	fn: (line: string, lineStartInBody: number, lineIndex: number) => void
): void {
	const re = /\r\n|\r|\n/g;
	let m: RegExpExecArray | null;
	let prev = 0;
	let lineIndex = 0;
	while ((m = re.exec(body))) {
		fn(body.slice(prev, m.index), prev, lineIndex);
		lineIndex++;
		prev = m.index + m[0].length;
	}
	fn(body.slice(prev), prev, lineIndex);
}

/** ChordPro-ish body highlighting (matches SMF escaping + inline chord spans). */
export function chordproFenceSpans(body: string): SmfFenceSpan[] {
	const spans: SmfFenceSpan[] = [];

	for (let i = 0; i < body.length; ) {
		const cur = body.charAt(i);
		const next = body.charAt(i + 1);

		if (cur === '\\' && next && ESCAPABLE.has(next)) {
			spans.push({
				from: i,
				to: i + 2,
				className: 'song-cm-chordpro-escape'
			});
			i += 2;
			continue;
		}

		if (cur !== '[') {
			i++;
			continue;
		}

		const end = body.indexOf(']', i + 1);
		if (end === -1 || end === i + 1) {
			i++;
			continue;
		}

		const chord = body.slice(i + 1, end).trim();
		if (!chord) {
			i++;
			continue;
		}

		spans.push({
			from: i,
			to: end + 1,
			className: 'song-cm-chordpro-chord'
		});
		i = end + 1;
	}

	return sortDedupe(spans);
}

const STRUM_STROKE = new Set(['D', 'U', 'X', 'd', 'u', 'x', 't', 'T']);

export function strumFenceSpans(body: string): SmfFenceSpan[] {
	const spans: SmfFenceSpan[] = [];

	forEachLineWithStart(body, (line, start, lineIndex) => {
		if (lineIndex === 0) {
			for (let j = 0; j < line.length; j++) {
				const ch = line.charAt(j);
				const abs = start + j;
				if (/^[0-9]$/.test(ch)) {
					spans.push({ from: abs, to: abs + 1, className: 'song-cm-strum-count' });
				} else if (ch === '&') {
					spans.push({ from: abs, to: abs + 1, className: 'song-cm-strum-beat' });
				}
			}
			return;
		}

		for (let j = 0; j < line.length; j++) {
			const ch = line.charAt(j);
			const abs = start + j;
			if (ch === '-') {
				spans.push({ from: abs, to: abs + 1, className: 'song-cm-strum-beat' });
			} else if (STRUM_STROKE.has(ch)) {
				spans.push({ from: abs, to: abs + 1, className: 'song-cm-strum-stroke' });
			}
		}
	});

	return sortDedupe(spans);
}

export function slashFenceSpans(body: string): SmfFenceSpan[] {
	const spans: SmfFenceSpan[] = [];

	forEachLineWithStart(body, (line, start) => {
		let col = 0;
		for (const tok of tokenizeSlashLine(line)) {
			const from = start + col;
			const to = from + tok.text.length;
			col += tok.text.length;

			let className: SmfFenceHighlightClass | null = null;
			if (tok.kind === 'bar') {
				className = 'song-cm-slash-bar';
			} else if (tok.kind === 'beat') {
				className = 'song-cm-slash-beat';
			} else if (tok.kind === 'chord') {
				className = 'song-cm-slash-chord';
			}
			if (className) {
				spans.push({ from, to, className });
			}
		}
	});

	return sortDedupe(spans);
}

const KNOWN = new Map<string, (body: string) => SmfFenceSpan[]>([
	['chordpro', chordproFenceSpans],
	['strum', strumFenceSpans],
	['slash', slashFenceSpans]
]);

export function spansForFenceLanguage(info: string, body: string): SmfFenceSpan[] | null {
	const firstToken = info
		.trim()
		.split(/\s+/u)
		.filter((x) => x.length > 0)[0];
	if (!firstToken) {
		return null;
	}
	const lang = firstToken.toLowerCase();
	const fn = KNOWN.get(lang);
	return fn ? fn(body) : null;
}
