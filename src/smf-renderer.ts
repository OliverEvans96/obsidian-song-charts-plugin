import { Plugin } from 'obsidian';
import {
	lineToChordproSegments,
	mapRhythmSymbol,
	parseInlineChords,
	parseSlashStaffLine,
	tokenizeSlashLine,
	type ChordproSegment,
	unescapeSmfText
} from './smf';
import { createSlashStaffSvg } from './slash-staff';
import { slashStaffSvgWidth } from './slash-staff-layout';

/** Chord-only lines split into columns (one chord per beat cell). */
function expandChordOnlyBeatColumns(segments: ChordproSegment[]): ChordproSegment[] {
	if (segments.length !== 1) {
		return segments;
	}
	const seg = segments[0];
	if (!seg || seg.lyric !== '' || !seg.chords) {
		return segments;
	}
	const parts = seg.chords
		.trim()
		.split(/\s+/)
		.filter((p) => p.length > 0);
	if (parts.length <= 1) {
		return segments;
	}
	return parts.map((chords) => ({ chords, lyric: '' }));
}

function appendChordproLyricTokens(container: HTMLElement, text: string): void {
	for (const token of parseInlineChords(text)) {
		if (token.type === 'text') {
			container.appendText(token.value);
			continue;
		}
		const chord = container.createSpan({ cls: 'song-chordpro-inline-chord' });
		chord.setText(token.value);
	}
}

function renderChordproLine(row: HTMLElement, rawLine: string): void {
	const line = unescapeSmfText(rawLine);
	const segments = expandChordOnlyBeatColumns(lineToChordproSegments(line));

	row.empty();
	for (const seg of segments) {
		const cell = row.createSpan({ cls: 'song-chordpro-seg' });
		const chordRow = cell.createSpan({ cls: 'song-chordpro-chord-row' });
		if (seg.chords) {
			chordRow.setText(seg.chords);
		} else {
			chordRow.addClass('song-chordpro-chord-row--empty');
			chordRow.setText('\u00a0');
		}
		const lyricRow = cell.createSpan({ cls: 'song-chordpro-lyric-row' });
		appendChordproLyricTokens(lyricRow, seg.lyric);
	}
}

function renderChordproBlock(el: HTMLElement, source: string): void {
	const root = el.createDiv({ cls: 'song-chordpro' });
	for (const rawLine of source.split(/\r?\n/)) {
		if (!rawLine.trim()) {
			root.createDiv({ cls: 'song-chordpro-line song-chordpro-line--empty' });
			continue;
		}
		renderChordproLine(root.createDiv({ cls: 'song-chordpro-line' }), rawLine);
	}
}

const STRUM_PAD = '\u00a0';

function strumArrowSvg(direction: 'down' | 'up'): SVGSVGElement {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', '0 0 16 16');
	svg.setAttribute('width', '1em');
	svg.setAttribute('height', '1em');
	svg.classList.add('song-strum__arrow-svg');
	svg.setAttribute('aria-hidden', 'true');
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('fill', 'none');
	path.setAttribute('stroke', 'currentColor');
	path.setAttribute('stroke-width', '1.75');
	path.setAttribute('stroke-linecap', 'round');
	path.setAttribute('stroke-linejoin', 'round');
	if (direction === 'down') {
		path.setAttribute('d', 'M8 3v9M4.2 9.2L8 13l3.8-3.8');
	} else {
		path.setAttribute('d', 'M8 13V4M4.2 6.8L8 3l3.8 3.8');
	}
	svg.appendChild(path);
	return svg;
}

function appendStrumGlyphCell(cell: HTMLElement, mapped: string): void {
	if (mapped === '↓') {
		cell.addClass('song-strum__cell--glyph');
		cell.appendChild(strumArrowSvg('down'));
		return;
	}
	if (mapped === '↑') {
		cell.addClass('song-strum__cell--glyph');
		cell.appendChild(strumArrowSvg('up'));
		return;
	}
	cell.setText(mapped);
}

/** Pad with NBSP so every row shares the same column count as the count line. */
function padStrumColumns(chars: string[], targetLen: number, padChar: string): string[] {
	const out = chars.slice();
	while (out.length < targetLen) {
		out.push(padChar);
	}
	return out;
}

/** Line 1 = count; remaining lines = ASCII strum pattern (D/U/X/-/T → glyphs). */
function renderStrumBlock(el: HTMLElement, source: string): void {
	const lines = source.split(/\r?\n/);
	const root = el.createDiv({ cls: 'song-strum' });

	if (lines.length === 0 || !lines[0]?.trim()) {
		root.addClass('song-block-invalid');
		root.setText('Strum block needs a first line for the count (e.g. 1 & 2 & 3 & 4 &).');
		return;
	}

	const countLine = unescapeSmfText(lines[0].trim());
	const countChars = [...countLine];

	type PatternRow = { kind: 'blank' } | { kind: 'pattern'; glyphs: string[] };

	const patternRows: PatternRow[] = [];
	for (const raw of lines.slice(1)) {
		if (!raw.trim()) {
			patternRows.push({ kind: 'blank' });
			continue;
		}
		const sourceLine = unescapeSmfText(raw);
		const glyphs: string[] = [];
		for (const ch of sourceLine) {
			glyphs.push(mapRhythmSymbol(ch));
		}
		patternRows.push({ kind: 'pattern', glyphs });
	}

	const longestPattern = patternRows.reduce((max, row) => {
		return row.kind === 'pattern' ? Math.max(max, row.glyphs.length) : max;
	}, 0);
	const numCols = Math.max(countChars.length, longestPattern);

	const grid = root.createDiv({ cls: 'song-strum__grid' });
	grid.style.setProperty('--strum-cols', String(numCols));

	const countCells = padStrumColumns(countChars, numCols, STRUM_PAD);
	const countRow = grid.createDiv({ cls: 'song-strum__row song-strum__row--count' });
	for (let i = 0; i < numCols; i++) {
		const ch = countCells[i] ?? STRUM_PAD;
		const cell = countRow.createSpan({ cls: 'song-strum__cell' });
		if (/^[1-9]$/.test(ch)) {
			cell.addClass('song-strum__cell--pulse');
		}
		if (ch === STRUM_PAD) {
			cell.addClass('song-strum__cell--pad');
		}
		cell.setText(ch === STRUM_PAD ? STRUM_PAD : ch);
	}

	for (const row of patternRows) {
		if (row.kind === 'blank') {
			grid.createDiv({ cls: 'song-strum__gap' });
			continue;
		}
		const patternRow = grid.createDiv({ cls: 'song-strum__row song-strum__row--pattern' });
		const padded = padStrumColumns(row.glyphs, numCols, STRUM_PAD);
		for (let i = 0; i < numCols; i++) {
			const g = padded[i] ?? STRUM_PAD;
			const cell = patternRow.createSpan({ cls: 'song-strum__cell' });
			if (g === STRUM_PAD) {
				cell.addClass('song-strum__cell--pad');
			}
			appendStrumGlyphCell(cell, g);
		}
	}
}

function appendSlashLine(lineEl: HTMLElement, line: string): void {
	for (const { kind, text } of tokenizeSlashLine(line)) {
		if (kind === 'whitespace') {
			lineEl.appendText(text);
			continue;
		}
		const cls =
			kind === 'beat'
				? 'song-slash__tok song-slash__tok--beat'
				: kind === 'bar'
					? 'song-slash__tok song-slash__tok--bar'
					: 'song-slash__tok song-slash__tok--chord';
		lineEl.createSpan({ cls }).setText(text);
	}
}

/** Slash notation: staff + slashes when parsable; else same-line text fallback. */
function renderSlashBlock(el: HTMLElement, source: string): void {
	const root = el.createDiv({ cls: 'song-slash' });
	const body = root.createDiv({ cls: 'song-slash__body' });

	type SlashRow =
		| { kind: 'empty' }
		| { kind: 'staff'; line: string; measures: ReturnType<typeof parseSlashStaffLine> }
		| { kind: 'fallback'; line: string };

	const rows: SlashRow[] = [];
	for (const raw of source.split(/\r?\n/)) {
		if (!raw.trim()) {
			rows.push({ kind: 'empty' });
			continue;
		}
		const line = unescapeSmfText(raw);
		const measures = parseSlashStaffLine(line);
		if (measures.length > 0) {
			rows.push({ kind: 'staff', line, measures });
		} else {
			rows.push({ kind: 'fallback', line });
		}
	}

	let maxStaffSvgWidth = 0;
	for (const row of rows) {
		if (row.kind === 'staff') {
			maxStaffSvgWidth = Math.max(maxStaffSvgWidth, slashStaffSvgWidth(row.measures));
		}
	}
	const staffWidthOpts = maxStaffSvgWidth > 0 ? { minSvgWidth: maxStaffSvgWidth } : undefined;

	for (const row of rows) {
		if (row.kind === 'empty') {
			body.createDiv({ cls: 'song-slash__line song-slash__line--empty' });
			continue;
		}
		if (row.kind === 'staff') {
			const wrap = body.createDiv({ cls: 'song-slash__staff-wrap' });
			wrap.appendChild(createSlashStaffSvg(row.measures, row.line, staffWidthOpts));
			continue;
		}
		const lineEl = body.createDiv({ cls: 'song-slash__line song-slash__line--fallback' });
		appendSlashLine(lineEl, row.line);
	}
}

export function registerSmfProcessors(plugin: Plugin): void {
	plugin.registerMarkdownCodeBlockProcessor('chordpro', (source, el) => {
		renderChordproBlock(el, source);
	});

	plugin.registerMarkdownCodeBlockProcessor('strum', (source, el) => {
		renderStrumBlock(el, source);
	});

	plugin.registerMarkdownCodeBlockProcessor('slash', (source, el) => {
		renderSlashBlock(el, source);
	});
}
