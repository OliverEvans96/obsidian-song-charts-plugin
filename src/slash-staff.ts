import type { SlashStaffMeasure } from './smf';
import { layoutSlashStaff } from './slash-staff-layout';

const STAFF_LINE_COUNT = 5;
const LINE_GAP = 9;
const STAFF_TOP = 36;
const CHORD_PAD_TOP = 7;
const STAFF_STROKE = 1.15;
const SLASH_STROKE = 2.8;

/** Approximate textual flat/sharp; `Bbm7` → `B♭m7`. */
export function formatSlashChordDisplay(raw: string): string {
	return raw.replace(/([A-Ga-g])b/g, '$1♭').replace(/([A-Ga-g])#/g, '$1♯');
}

function addStaffLines(svg: SVGSVGElement, x0: number, x1: number): void {
	for (let i = 0; i < STAFF_LINE_COUNT; i++) {
		const y = STAFF_TOP + i * LINE_GAP;
		const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		line.setAttribute('x1', String(x0));
		line.setAttribute('y1', String(y));
		line.setAttribute('x2', String(x1));
		line.setAttribute('y2', String(y));
		line.setAttribute('stroke', 'currentColor');
		line.setAttribute('stroke-width', String(STAFF_STROKE));
		line.setAttribute('class', 'song-slash-staff__line');
		svg.appendChild(line);
	}
}

function appendSlashGlyph(svg: SVGSVGElement, cx: number): void {
	// Span middle 3 lines: line 1 (second from top) to line 3 (second from bottom)
	const t = STAFF_TOP + LINE_GAP * 1; // Second line from top
	const b = STAFF_TOP + LINE_GAP * 3; // Second line from bottom
	const dx = 10; // Horizontal spread for forward slash angle
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', `M ${cx - dx} ${b} L ${cx + dx} ${t}`);
	path.setAttribute('stroke', 'currentColor');
	path.setAttribute('stroke-width', String(SLASH_STROKE));
	path.setAttribute('stroke-linecap', 'round');
	path.setAttribute('fill', 'none');
	path.setAttribute('class', 'song-slash-staff__slash');
	svg.appendChild(path);
}

function appendBarLine(svg: SVGSVGElement, x: number): void {
	const y0 = STAFF_TOP - 2;
	const y1 = STAFF_TOP + (STAFF_LINE_COUNT - 1) * LINE_GAP + 2;
	const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
	line.setAttribute('x1', String(x));
	line.setAttribute('y1', String(y0));
	line.setAttribute('x2', String(x));
	line.setAttribute('y2', String(y1));
	line.setAttribute('stroke', 'currentColor');
	line.setAttribute('stroke-width', '1.35');
	line.setAttribute('class', 'song-slash-staff__bar');
	svg.appendChild(line);
}

export type CreateSlashStaffSvgOptions = {
	/** When set, viewBox width is at least this value so CSS width:100% scales all rows uniformly. */
	minSvgWidth?: number;
};

export function createSlashStaffSvg(
	measures: SlashStaffMeasure[],
	ariaLabel: string,
	options?: CreateSlashStaffSvgOptions
): SVGSVGElement {
	const layout = layoutSlashStaff(measures);
	const width = Math.max(layout.svgWidth, options?.minSvgWidth ?? layout.svgWidth);
	const { contentLeft, staffRight, beatW, height, measureStarts, slashXs } = layout;

	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('role', 'img');
	if (ariaLabel.trim()) {
		svg.setAttribute('aria-label', `Slash notation: ${ariaLabel}`);
	}
	svg.classList.add('song-slash-staff');

	svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
	svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');

	addStaffLines(svg, contentLeft, staffRight);

	// Time signature 4/4
	const tsX = 8;
	const upper = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	upper.setAttribute('x', String(tsX));
	upper.setAttribute('y', String(STAFF_TOP + LINE_GAP * 1.65));
	upper.setAttribute('class', 'song-slash-staff__timesig');
	upper.textContent = '4';
	svg.appendChild(upper);
	const lower = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	lower.setAttribute('x', String(tsX));
	lower.setAttribute('y', String(STAFF_TOP + LINE_GAP * 3.2));
	lower.setAttribute('class', 'song-slash-staff__timesig');
	lower.textContent = '4';
	svg.appendChild(lower);

	// Draw all slashes
	for (const cx of slashXs) {
		appendSlashGlyph(svg, cx);
	}

	// Draw bar lines at measure ends
	let barX = contentLeft;
	for (const m of measures) {
		barX += m.beats.length * beatW;
		appendBarLine(svg, barX);
	}

	// Draw chord labels - only on first occurrence or when chord changes
	for (let mi = 0; mi < measures.length; mi++) {
		const start = measureStarts[mi];
		const m = measures[mi];
		if (start === undefined || !m) continue;

		let prevChord: string | null = null;
		for (let bi = 0; bi < m.beats.length; bi++) {
			const beat = m.beats[bi];
			if (!beat?.chord) continue;

			// Only show chord if it's different from the previous beat
			if (beat.chord !== prevChord) {
				const cx = start + (bi + 0.5) * beatW;
				const chordEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
				chordEl.setAttribute('x', String(cx));
				chordEl.setAttribute('y', String(STAFF_TOP - CHORD_PAD_TOP));
				chordEl.setAttribute('text-anchor', 'middle');
				chordEl.setAttribute('class', 'song-slash-staff__chord');
				chordEl.textContent = formatSlashChordDisplay(beat.chord);
				svg.appendChild(chordEl);
			}

			prevChord = beat.chord;
		}
	}

	return svg;
}
