import test from 'node:test';
import assert from 'node:assert/strict';

import { findSmfFenceRegions } from '../src/smf-editor-fence-scan.js';

test('findSmfFenceRegions locates slash block with multiple lines', () => {
	const src = "```slash\n| Am / / / | C / / / |\n| E7 / | Am / |\n```\nafter";
	const regions = findSmfFenceRegions(src);
	assert.equal(regions.length, 1);
	const r = regions[0];
	assert.strictEqual(r?.lang, 'slash');
	assert.ok(r && r.bodyFrom < r.bodyTo);
	assert.strictEqual(src.slice(r!.bodyFrom, r!.bodyTo), '| Am / / / | C / / / |\n| E7 / | Am / |');
	assert.ok(src.slice(r!.bodyTo).startsWith('```'));
});

test('findSmfFenceRegions skips python fences', () => {
	const regions = findSmfFenceRegions("```python\nx=1\n```\n```slash\n/\n```");
	assert.strictEqual(regions.length, 1);
	assert.strictEqual(regions[0]?.lang, 'slash');
});

test('findSmfFenceRegions supports CRLF openings', () => {
	const nl = '\r\n';
	const src = `\`\`\`slash${nl}| hi |${nl}\`\`\`${nl}`;
	const regions = findSmfFenceRegions(src);
	assert.strictEqual(regions.length, 1);
	assert.strictEqual(src.slice(regions[0]!.bodyFrom, regions[0]!.bodyTo), '| hi |');
});

test('findSmfFenceRegions supports UTF-16 positions with leading text', () => {
	const prefix = 'intro\n';
	const inner = "```slash\n/\n```";
	const regions = findSmfFenceRegions(prefix + inner);
	assert.strictEqual(regions.length, 1);
	assert.strictEqual(regions[0]!.lang, 'slash');
	assert.strictEqual(prefix.length + "```slash\n".length, regions[0]!.bodyFrom);
	assert.strictEqual(regions[0]!.bodyTo, regions[0]!.bodyFrom + 2);
});
