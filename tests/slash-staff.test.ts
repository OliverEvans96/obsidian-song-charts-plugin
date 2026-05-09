import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSlashStaffLine } from '../src/smf.js';
import { layoutSlashStaff, slashStaffSvgWidth } from '../src/slash-staff-layout.js';

test('layoutSlashStaff uses minimum width when there are no beats', () => {
	assert.equal(layoutSlashStaff([]).svgWidth, 140);
});

test('slashStaffSvgWidth grows with total beat count', () => {
	const threeBars = parseSlashStaffLine('| Am / / / | C / / / | / / / / |');
	const twoBars = parseSlashStaffLine('| E7 / | Am / / / / |');
	assert.ok(slashStaffSvgWidth(threeBars) > slashStaffSvgWidth(twoBars));
});

test('slashStaffSvgWidth matches longest line in a multi-bar example', () => {
	const a = parseSlashStaffLine('| Am / / / | C / / / | / / / / |');
	const b = parseSlashStaffLine('| Dm / / / | / / / / | F / / / |');
	const c = parseSlashStaffLine('| E7 / | Am / / / / |');
	const widths = [slashStaffSvgWidth(a), slashStaffSvgWidth(b), slashStaffSvgWidth(c)];
	const max = Math.max(...widths);
	assert.equal(max, slashStaffSvgWidth(a));
	assert.equal(max, slashStaffSvgWidth(b));
	assert.ok(slashStaffSvgWidth(c) < max);
});
