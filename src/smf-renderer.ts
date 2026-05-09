import { Plugin } from 'obsidian';
import {
	lineToChordproSegments,
	mapRhythmAsciiLine,
	parseInlineChords,
	type ChordproSegment,
	unescapeSmfText
} from './smf';

/** Chord-only lines split into columns (one chord per beat cell). */
function expandChordOnlyBeatColumns(segments: ChordproSegment[]): ChordproSegment[] {
	if (segments.length !== 1) {
		return segments;
	}
	const seg = segments[0];
	if (!seg || seg.lyric !== '' || !seg.chords) {
		return segments;
	}
	const parts = seg.chords.trim().split(/\s+/).filter((p) => p.length > 0);
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

/** Line 1 = count; remaining lines = ASCII strum pattern (D/U/X/-/T → glyphs). */
function renderStrumBlock(el: HTMLElement, source: string): void {
	const lines = source.split(/\r?\n/);
	const root = el.createDiv({ cls: 'song-strum' });

	if (lines.length === 0 || !lines[0]?.trim()) {
		root.addClass('song-block-invalid');
		root.setText('Strum block needs a first line for the count (e.g. 1 & 2 & 3 & 4 &).');
		return;
	}

	const countEl = root.createDiv({ cls: 'song-strum__count' });
	countEl.setText(lines[0].trim());

	for (const raw of lines.slice(1)) {
		if (!raw.trim()) {
			root.createDiv({ cls: 'song-strum__pattern song-strum__pattern--empty' });
			continue;
		}
		const patternEl = root.createDiv({ cls: 'song-strum__pattern' });
		patternEl.setText(mapRhythmAsciiLine(raw));
	}
}

/** Slash rhythm: ASCII stroke letters become arrows; slashes and bars preserved. */
function renderSlashBlock(el: HTMLElement, source: string): void {
	const root = el.createDiv({ cls: 'song-slash' });
	const body = root.createDiv({ cls: 'song-slash__body' });

	for (const raw of source.split(/\r?\n/)) {
		if (!raw.trim()) {
			body.createDiv({ cls: 'song-slash__line song-slash__line--empty' });
			continue;
		}
		const lineEl = body.createDiv({ cls: 'song-slash__line' });
		lineEl.setText(mapRhythmAsciiLine(raw));
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
