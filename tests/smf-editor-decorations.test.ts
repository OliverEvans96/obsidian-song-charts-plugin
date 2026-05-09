import test from 'node:test';
import assert from 'node:assert/strict';
import {
	chordproFenceSpans,
	spansForFenceLanguage,
	slashFenceSpans,
	strumFenceSpans,
	type SmfFenceSpan
} from '../src/smf-editor-decorations.js';

function onlyClasses(spans: SmfFenceSpan[]): string[] {
	return spans.map((s) => s.className);
}

test('chordproFenceSpans marks chord brackets', () => {
	const spans = chordproFenceSpans('[G]Hello [D]world');
	assert.deepEqual(onlyClasses(spans), ['song-cm-chordpro-chord', 'song-cm-chordpro-chord']);
	assert.deepEqual(
		spans.map((s) => [s.from, s.to]),
		[
			[0, 3],
			[9, 12]
		]
	);
});

test('chordproFenceSpans marks escapes for SMF escapable characters', () => {
	const spans = chordproFenceSpans(String.raw`\[not a chord\] [C]ok`);
	assert.deepEqual(onlyClasses(spans), [
		'song-cm-chordpro-escape',
		'song-cm-chordpro-escape',
		'song-cm-chordpro-chord'
	]);
	assert.deepEqual(
		spans.map((s) => [s.from, s.to]),
		[
			[0, 2],
			[13, 15],
			[16, 19]
		]
	);
});

test('strumFenceSpans highlights count pulses and strokes', () => {
	const spans = strumFenceSpans('1 & 2 & 3\nD-DU');
	assert.ok(spans.some((s) => s.className === 'song-cm-strum-count'));
	assert.ok(spans.some((s) => s.className === 'song-cm-strum-stroke'));
	assert.ok(spans.some((s) => s.className === 'song-cm-strum-beat'));
});

test('slashFenceSpans distinguishes bars, beats, and chords', () => {
	const spans = slashFenceSpans('| G / / | D |');
	assert.ok(spans.some((s) => s.className === 'song-cm-slash-bar'));
	assert.ok(spans.some((s) => s.className === 'song-cm-slash-beat'));
	assert.ok(spans.some((s) => s.className === 'song-cm-slash-chord'));
});

test('spansForFenceLanguage returns null for unknown fences', () => {
	assert.strictEqual(spansForFenceLanguage('javascript', 'x'), null);
});

test('spansForFenceLanguage accepts first fence info token', () => {
	const spans = spansForFenceLanguage('chordpro foo', '[A]Hi');
	assert.ok(spans && spans.some((s) => s.className === 'song-cm-chordpro-chord'));
});
