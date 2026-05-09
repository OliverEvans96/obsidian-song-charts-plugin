export type SmfInlineToken =
	| { type: 'text'; value: string }
	| { type: 'chord'; value: string };

export type SmfDirectiveType = 'strum' | 'slash' | 'count';

export interface SmfDirective {
	type: SmfDirectiveType;
	value: string;
}

const ESCAPABLE = new Set(['[', ']', '|', '!', '\\']);

export function unescapeSmfText(value: string): string {
	let output = '';

	for (let i = 0; i < value.length; i++) {
		const current = value[i];
		const next = value[i + 1];

		if (current === '\\' && next && ESCAPABLE.has(next)) {
			output += next;
			i++;
			continue;
		}

		output += current;
	}

	return output;
}

export function parseInlineChords(input: string): SmfInlineToken[] {
	const tokens: SmfInlineToken[] = [];
	let currentText = '';

	const flushText = () => {
		if (currentText.length > 0) {
			tokens.push({ type: 'text', value: currentText });
			currentText = '';
		}
	};

	for (let i = 0; i < input.length; i++) {
		const current = input[i];
		const next = input[i + 1];

		if (current === '\\' && next && ESCAPABLE.has(next)) {
			currentText += next;
			i++;
			continue;
		}

		if (current !== '[') {
			currentText += current;
			continue;
		}

		const end = input.indexOf(']', i + 1);
		if (end <= i + 1) {
			currentText += current;
			continue;
		}

		const chord = input.slice(i + 1, end).trim();
		if (!chord) {
			currentText += current;
			continue;
		}

		flushText();
		tokens.push({ type: 'chord', value: chord });
		i = end;
	}

	flushText();
	return tokens;
}

export function parseDirectiveLine(line: string): SmfDirective | null {
	const trimmed = line.trim();
	if (!trimmed.startsWith('!') || trimmed.startsWith('\\!')) {
		return null;
	}

	const match = /^!(strum|slash|count):\s*(.*)$/i.exec(trimmed);
	if (!match) {
		return null;
	}

	const rawType = match[1] ?? '';
	const rawValue = match[2] ?? '';
	return {
		type: rawType.toLowerCase() as SmfDirectiveType,
		value: unescapeSmfText(rawValue),
	};
}

export interface SmfRepeatLine {
	level: number;
	content: string;
}

export function parseRepeatLine(line: string): SmfRepeatLine | null {
	let index = 0;

	while (index < line.length && /\s/.test(line.charAt(index))) {
		index++;
	}

	if (line[index] !== '|') {
		return null;
	}

	let level = 0;
	while (index < line.length && line[index] === '|') {
		level++;
		index++;
		while (index < line.length && /\s/.test(line.charAt(index))) {
			index++;
		}
	}

	return {
		level,
		content: unescapeSmfText(line.slice(index)),
	};
}

export function isShorthandRepeat(line: string): boolean {
	return /^\s*\|:.*:\|\s*$/.test(line);
}
