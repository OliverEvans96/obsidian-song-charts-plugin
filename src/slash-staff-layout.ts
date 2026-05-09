import type { SlashStaffMeasure } from './smf';

const TIME_SIG_SLOT = 32;
const BEAT_MIN_W = 40;
const END_MARGIN = 14;
const STAFF_LINE_COUNT = 5;
const LINE_GAP = 9;
const STAFF_TOP = 36;

export type SlashStaffLayout = {
	contentLeft: number;
	staffRight: number;
	beatW: number;
	svgWidth: number;
	height: number;
	measureStarts: number[];
	slashXs: number[];
};

/** Geometry for one slash-staff row (user units); shared by SVG renderer and width alignment. */
export function layoutSlashStaff(measures: SlashStaffMeasure[]): SlashStaffLayout {
	const contentLeft = TIME_SIG_SLOT;
	const beatW = BEAT_MIN_W;
	let cursor = contentLeft;
	const measureStarts: number[] = [];
	const slashXs: number[] = [];

	for (const m of measures) {
		measureStarts.push(cursor);
		for (let i = 0; i < m.beats.length; i++) {
			slashXs.push(cursor + (i + 0.5) * beatW);
		}
		cursor += m.beats.length * beatW;
	}

	const staffRight = cursor;
	const svgWidth = Math.max(140, staffRight + END_MARGIN + 8);
	const height = STAFF_TOP + (STAFF_LINE_COUNT - 1) * LINE_GAP + 20;

	return {
		contentLeft,
		staffRight,
		beatW,
		svgWidth,
		height,
		measureStarts,
		slashXs
	};
}

/** SVG user-unit width for a slash staff row (used to align beat width across rows in one block). */
export function slashStaffSvgWidth(measures: SlashStaffMeasure[]): number {
	return layoutSlashStaff(measures).svgWidth;
}
