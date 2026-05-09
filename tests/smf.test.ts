import test from 'node:test';
import assert from 'node:assert/strict';
import {
	lineToChordproSegments,
	mapRhythmAsciiLine,
	mapRhythmSymbol,
	parseInlineChords,
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
	assert.deepEqual(lineToChordproSegments('[G] [D] hi'), [
		{ chords: 'G D', lyric: ' hi' }
	]);
});

test('lineToChordproSegments trailing chord-only segment', () => {
	assert.deepEqual(lineToChordproSegments('[G] [D]'), [
		{ chords: 'G D', lyric: '' }
	]);
});

test('mapRhythmSymbol maps strum letters', () => {
	assert.equal(mapRhythmSymbol('D'), '↓');
	assert.equal(mapRhythmSymbol('u'), '↑');
	assert.equal(mapRhythmSymbol('X'), '✕');
	assert.equal(mapRhythmSymbol('-'), '·');
	assert.equal(mapRhythmSymbol('/'), '/');
});

test('mapRhythmAsciiLine converts each stroke character', () => {
	assert.equal(mapRhythmAsciiLine('D - D U'), '↓ · ↓ ↑');
});

test('unescapeSmfText handles escaped control characters', () => {
	assert.equal(unescapeSmfText('\\!literal \\|pipe \\[brackets\\]'), '!literal |pipe [brackets]');
});

test('unescapeSmfText handles consecutive escapes', () => {
	assert.equal(unescapeSmfText('\\\\[C]'), '\\[C]');
});
