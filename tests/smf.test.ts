import test from 'node:test';
import assert from 'node:assert/strict';
import {
	lineToChordproSegments,
	mapRhythmAsciiLine,
	mapRhythmSymbol,
	mapStrumStroke,
	parseInlineChords,
	parseSlashStaffLine,
	tokenizeSlashLine,
	unescapeSmfText
} from '../src/smf.js';

test('parseInlineChords parses chord + lyric fragments', () => {
	assert.deepEqual(parseInlineChords('[G]Hello [D]world'), [
		{ type: 'chord', value: 'G' },
		{ type: 'text', value: 'Hello ' },
		{ type: 'chord', value: 'D' },
		{ type: 'text', value: 'world' }
	]);
});

test('parseInlineChords preserves escaped brackets as literals', () => {
	assert.deepEqual(parseInlineChords('\\[NotAChord\\] text [C]line'), [
		{ type: 'text', value: '[NotAChord] text ' },
		{ type: 'chord', value: 'C' },
		{ type: 'text', value: 'line' }
	]);
});

test('parseInlineChords handles unmatched and empty brackets as plain text', () => {
	assert.deepEqual(parseInlineChords('[G]ok [] bad [missing'), [
		{ type: 'chord', value: 'G' },
		{ type: 'text', value: 'ok [] bad [missing' }
	]);
});

test('lineToChordproSegments attaches chords to following lyric', () => {
	assert.deepEqual(lineToChordproSegments('[G]Hello [D]world'), [
		{ chords: 'G', lyric: 'Hello ' },
		{ chords: 'D', lyric: 'world' }
	]);
});

test('lineToChordproSegments stacks consecutive chords over next lyric', () => {
	assert.deepEqual(lineToChordproSegments('[G] [D] hi'), [{ chords: 'G D', lyric: ' hi' }]);
});

test('lineToChordproSegments trailing chord-only segment', () => {
	assert.deepEqual(lineToChordproSegments('[G] [D]'), [{ chords: 'G D', lyric: '' }]);
});

test('mapRhythmSymbol maps strum letters', () => {
	assert.equal(mapRhythmSymbol('D'), '↓');
	assert.equal(mapRhythmSymbol('u'), '↑');
	assert.equal(mapRhythmSymbol('X'), '✕');
	assert.equal(mapRhythmSymbol('-'), '·');
	assert.equal(mapRhythmSymbol('/'), '/');
});

test('mapStrumStroke uses lowercase for normal-sized strokes and uppercase for large', () => {
	assert.deepEqual(mapStrumStroke('d'), { glyph: '↓', size: 'normal' });
	assert.deepEqual(mapStrumStroke('D'), { glyph: '↓', size: 'large' });
	assert.deepEqual(mapStrumStroke('u'), { glyph: '↑', size: 'normal' });
	assert.deepEqual(mapStrumStroke('U'), { glyph: '↑', size: 'large' });
	assert.deepEqual(mapStrumStroke('x'), { glyph: '✕', size: 'normal' });
	assert.deepEqual(mapStrumStroke('X'), { glyph: '✕', size: 'large' });
	assert.deepEqual(mapStrumStroke('t'), { glyph: '⊤', size: 'normal' });
	assert.deepEqual(mapStrumStroke('T'), { glyph: '⊤', size: 'large' });
	assert.deepEqual(mapStrumStroke('-'), { glyph: '·', size: 'normal' });
	assert.deepEqual(mapStrumStroke(' '), { glyph: ' ', size: 'normal' });
});

test('parseSlashStaffLine splits measures and maps chords to slashes', () => {
	assert.deepEqual(parseSlashStaffLine('| G / G / | Em / Em / |'), [
		{
			beats: [{ chord: 'G' }, { chord: 'G' }, { chord: 'G' }, { chord: 'G' }]
		},
		{
			beats: [{ chord: 'Em' }, { chord: 'Em' }, { chord: 'Em' }, { chord: 'Em' }]
		}
	]);
});

test('parseSlashStaffLine carries chord through slashes until next chord symbol', () => {
	assert.deepEqual(parseSlashStaffLine('| G / / Em / |'), [
		{
			beats: [
				{ chord: 'G' },
				{ chord: 'G' },
				{ chord: 'G' },
				{ chord: 'Em' },
				{ chord: 'Em' }
			]
		}
	]);
});

test('parseSlashStaffLine supports lines without outer bars', () => {
	assert.deepEqual(parseSlashStaffLine('G / / / '), [
		{ beats: [{ chord: 'G' }, { chord: 'G' }, { chord: 'G' }, { chord: 'G' }] }
	]);
});

test('parseSlashStaffLine maps chord-only tokens to beats without slashes', () => {
	assert.deepEqual(parseSlashStaffLine('G Em D'), [
		{ beats: [{ chord: 'G' }, { chord: 'Em' }, { chord: 'D' }] }
	]);
});

test('tokenizeSlashLine classifies bars beats chords and whitespace', () => {
	assert.deepEqual(tokenizeSlashLine('| G / G / |'), [
		{ kind: 'bar', text: '|' },
		{ kind: 'whitespace', text: ' ' },
		{ kind: 'chord', text: 'G' },
		{ kind: 'whitespace', text: ' ' },
		{ kind: 'beat', text: '/' },
		{ kind: 'whitespace', text: ' ' },
		{ kind: 'chord', text: 'G' },
		{ kind: 'whitespace', text: ' ' },
		{ kind: 'beat', text: '/' },
		{ kind: 'whitespace', text: ' ' },
		{ kind: 'bar', text: '|' }
	]);
});

test('tokenizeSlashLine keeps slash chords and double bars as single tokens', () => {
	assert.deepEqual(tokenizeSlashLine('|| G/B '), [
		{ kind: 'bar', text: '||' },
		{ kind: 'whitespace', text: ' ' },
		{ kind: 'chord', text: 'G/B' },
		{ kind: 'whitespace', text: ' ' }
	]);
});

test('mapRhythmAsciiLine converts each stroke character', () => {
	assert.equal(mapRhythmAsciiLine('D - D U'), '↓ · ↓ ↑');
});

test('unescapeSmfText applies escapes in slash chart lines', () => {
	assert.equal(unescapeSmfText('\\| G / G / \\| D / D / \\|'), '| G / G / | D / D / |');
});

test('mapRhythmAsciiLine is for strum patterns only (not slash chord lines)', () => {
	const slashLine = '| G / G / | D / D / |';
	assert.notEqual(mapRhythmAsciiLine(slashLine), slashLine);
});

test('unescapeSmfText handles escaped control characters', () => {
	assert.equal(unescapeSmfText('\\!literal \\|pipe \\[brackets\\]'), '!literal |pipe [brackets]');
});

test('unescapeSmfText handles consecutive escapes', () => {
	assert.equal(unescapeSmfText('\\\\[C]'), '\\[C]');
});
