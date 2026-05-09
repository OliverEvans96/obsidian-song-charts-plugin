import type { SlashStaffMeasure } from './smf';

const STAFF_LINE_COUNT = 5;
const LINE_GAP = 9;
const STAFF_TOP = 36;
const CLEF_SLOT = 40;
const TIME_SIG_SLOT = 26;
const BEAT_MIN_W = 40;
const END_MARGIN = 14;
const CHORD_PAD_TOP = 7;
const STAFF_STROKE = 1.15;
const SLASH_STROKE = 3.1;

/** Approximate textual flat/sharp; `Bbm7` → `B♭m7`. */
export function formatSlashChordDisplay(raw: string): string {
	return raw.replace(/([A-Ga-g])b/g, '$1♭').replace(/([A-Ga-g])#/g, '$1♯');
}

/** Stylized treble clef (single stroke path). */
const TREBLE_CLEF_PATH =
	'M 28 6 C 22 8 18 14 18 22 C 18 30 24 36 32 36 C 38 36 42 32 42 26 C 42 18 34 10 26 10 C 24 10 22 10 20 11 M 32 36 L 32 68 C 32 78 26 84 18 84 C 12 84 8 80 8 74 C 8 66 14 60 24 58';

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
	const t = STAFF_TOP + LINE_GAP * 0.35;
	const b = STAFF_TOP + LINE_GAP * (STAFF_LINE_COUNT - 1.35);
	const dx = 8;
	const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', `M ${cx - dx} ${t - 2} L ${cx + dx} ${b + 2}`);
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

export function createSlashStaffSvg(
	measures: SlashStaffMeasure[],
	ariaLabel: string
): SVGSVGElement {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('role', 'img');
	if (ariaLabel.trim()) {
		svg.setAttribute('aria-label', `Slash notation: ${ariaLabel}`);
	}
	svg.classList.add('song-slash-staff');

	const contentLeft = CLEF_SLOT + TIME_SIG_SLOT;
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
	const width = Math.max(140, staffRight + END_MARGIN + 8);
	const height = STAFF_TOP + (STAFF_LINE_COUNT - 1) * LINE_GAP + 20;

	svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
	svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');

	addStaffLines(svg, contentLeft, staffRight);

	const clefPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	clefPath.setAttribute('d', TREBLE_CLEF_PATH);
	clefPath.setAttribute('fill', 'none');
	clefPath.setAttribute('stroke', 'currentColor');
	clefPath.setAttribute('stroke-width', '1.6');
	clefPath.setAttribute('stroke-linecap', 'round');
	clefPath.setAttribute('stroke-linejoin', 'round');
	clefPath.setAttribute('transform', `translate(4, ${STAFF_TOP - 8}) scale(0.68)`);
	clefPath.setAttribute('class', 'song-slash-staff__clef');
	svg.appendChild(clefPath);

	const tsX = CLEF_SLOT + 2;
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

	for (const cx of slashXs) {
		appendSlashGlyph(svg, cx);
	}

	let barX = contentLeft;
	for (const m of measures) {
		barX += m.beats.length * beatW;
		appendBarLine(svg, barX);
	}

	for (let mi = 0; mi < measures.length; mi++) {
		const start = measureStarts[mi];
		const m = measures[mi];
		if (start === undefined || !m) continue;
		for (let bi = 0; bi < m.beats.length; bi++) {
			const beat = m.beats[bi];
			if (!beat?.chord) continue;
			const cx = start + (bi + 0.5) * beatW;
			const chordEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
			chordEl.setAttribute('x', String(cx));
			chordEl.setAttribute('y', String(STAFF_TOP - CHORD_PAD_TOP));
			chordEl.setAttribute('text-anchor', 'middle');
			chordEl.setAttribute('class', 'song-slash-staff__chord');
			chordEl.textContent = formatSlashChordDisplay(beat.chord);
			svg.appendChild(chordEl);
		}
	}

	return svg;
}
