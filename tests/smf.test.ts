import test from 'node:test';
import assert from 'node:assert/strict';
import {
	isShorthandRepeat,
	parseDirectiveLine,
	parseInlineChords,
	parseRepeatLine,
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

test('parseDirectiveLine parses supported inline directives', () => {
	assert.deepEqual(parseDirectiveLine('!strum: D - D U - U D U'), {
		type: 'strum',
		value: 'D - D U - U D U'
	});
	assert.deepEqual(parseDirectiveLine('!slash: | ↓ ↓ ↑ ↑ ↓ ↑ |'), {
		type: 'slash',
		value: '| ↓ ↓ ↑ ↑ ↓ ↑ |'
	});
	assert.deepEqual(parseDirectiveLine('!count: 1 & 2 & 3 & 4 &'), {
		type: 'count',
		value: '1 & 2 & 3 & 4 &'
	});
});

test('parseDirectiveLine ignores escaped directives', () => {
	assert.equal(parseDirectiveLine('\\!strum: D U D U'), null);
	assert.deepEqual(parseDirectiveLine('!count: 1 \\& 2 \\! 3'), {
		type: 'count',
		value: '1 \\& 2 ! 3'
	});
});

test('parseRepeatLine parses nesting levels from leading pipes', () => {
	assert.deepEqual(parseRepeatLine('| | | [C]Inner A'), {
		level: 3,
		content: '[C]Inner A'
	});
	assert.deepEqual(parseRepeatLine('| repeat: 2'), {
		level: 1,
		content: 'repeat: 2'
	});
	assert.deepEqual(parseRepeatLine('|'), {
		level: 1,
		content: ''
	});
	assert.deepEqual(parseRepeatLine('| \\| literal \\! value'), {
		level: 1,
		content: '| literal ! value'
	});
});

test('repeat shorthand is recognized', () => {
	assert.equal(isShorthandRepeat('|: [G]Hello [D]world :|'), true);
	assert.equal(isShorthandRepeat('| [G]Hello [D]world'), false);
});

test('unescapeSmfText handles escaped control characters', () => {
	assert.equal(unescapeSmfText('\\!literal \\|pipe \\[brackets\\]'), '!literal |pipe [brackets]');
});

test('unescapeSmfText handles consecutive escapes', () => {
	assert.equal(unescapeSmfText('\\\\[C]'), '\\[C]');
});
