/** Fence languages handled by Song Charts SMF highlighting. */
export type SmfFenceKind = 'chordpro' | 'strum' | 'slash';

const SMF_LANGS = new Set<string>(['chordpro', 'strum', 'slash']);

export interface SmfFenceRegion {
	readonly lang: SmfFenceKind;
	/** First code unit inside the fenced body (after the opening fence line terminator). */
	readonly bodyFrom: number;
	/** Exclusive end: code unit index of start of closing ``` line. */
	readonly bodyTo: number;
}

function isLineStart(source: string, index: number): boolean {
	if (index === 0) {
		return true;
	}
	const prev = source.charCodeAt(index - 1);
	return prev === 10 || prev === 13;
}

/**
 * Bounds of one logical line beginning at lineStart through its newline terminator.
 * If there is no trailing newline before EOF, `lineBreakStart`/`lineEndExclusive` are `documentEnd`.
 */
function lineSliceBounds(
	source: string,
	lineStart: number,
	documentEnd: number
): { readonly lineBreakStart: number; readonly lineEndExclusive: number } {
	for (let p = lineStart; p < documentEnd; p++) {
		const c = source.charCodeAt(p);
		if (c === 10) {
			return { lineBreakStart: p, lineEndExclusive: Math.min(documentEnd, p + 1) };
		}
		if (c === 13) {
			const lineBreakStart = p;
			if (p + 1 < documentEnd && source.charCodeAt(p + 1) === 10) {
				return { lineBreakStart, lineEndExclusive: Math.min(documentEnd, p + 2) };
			}
			return { lineBreakStart, lineEndExclusive: Math.min(documentEnd, p + 1) };
		}
	}
	return { lineBreakStart: documentEnd, lineEndExclusive: documentEnd };
}

/** Close of ``` line at bol; bodyTo is line start index of fence line (exclusive slice end). */
function findClosingFenceAtLineStarts(
	source: string,
	bodyStart: number,
	documentEnd: number
): { bodyTo: number; resume: number } | null {
	let lineStart = bodyStart;

	while (lineStart < documentEnd) {
		const { lineBreakStart, lineEndExclusive } = lineSliceBounds(
			source,
			lineStart,
			documentEnd
		);
		const content = source.slice(lineStart, lineBreakStart).trimEnd();
		if (/^`{3,}\s*$/.test(content.trim())) {
			return { bodyTo: lineStart, resume: lineEndExclusive };
		}
		if (lineEndExclusive <= lineStart) {
			break;
		}
		lineStart = lineEndExclusive;
	}
	return null;
}

/**
 * Scan raw markdown for ```chordpro / ```strum / ```slash bodies.
 * Mirrors what you see as plain text — does not rely on CM’s Lezer tree (Python uses nested parsers from app).
 */
export function findSmfFenceRegions(source: string): SmfFenceRegion[] {
	const out: SmfFenceRegion[] = [];
	let i = 0;
	const n = source.length;

	while (i < n) {
		if (!source.startsWith('```', i) || !isLineStart(source, i)) {
			i++;
			continue;
		}

		const { lineBreakStart: openBreak, lineEndExclusive: afterOpenLine } = lineSliceBounds(
			source,
			i,
			n
		);
		const infoRaw = source.slice(i + 3, openBreak).trim();
		const firstToken =
			infoRaw
				.split(/\s+/u)
				.filter((t) => t.length > 0)[0]
				?.toLowerCase() ?? '';
		const bodyStart = Math.min(afterOpenLine, n);

		const close = findClosingFenceAtLineStarts(source, bodyStart, n);
		const resumeAfterFence = close ? close.resume : n;

		if (firstToken && SMF_LANGS.has(firstToken) && close && close.bodyTo >= bodyStart) {
			out.push({
				lang: firstToken as SmfFenceKind,
				bodyFrom: bodyStart,
				bodyTo: close.bodyTo
			});
		}

		i = resumeAfterFence;
	}

	return out;
}
