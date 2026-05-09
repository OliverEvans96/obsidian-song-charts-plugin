import { Plugin } from 'obsidian';
import {
	isShorthandRepeat,
	parseDirectiveLine,
	parseInlineChords,
	parseRepeatLine,
	type SmfDirective
} from './smf';

function appendInlineContent(container: HTMLElement, text: string): void {
	for (const token of parseInlineChords(text)) {
		if (token.type === 'text') {
			container.appendText(token.value);
			continue;
		}

		const chord = container.createSpan({ cls: 'song-chord' });
		chord.setText(token.value);
	}
}

function renderDirective(container: HTMLElement, directive: SmfDirective): void {
	container.empty();
	container.addClass('song-directive');
	container.addClass(`song-directive--${directive.type}`);

	const label = container.createSpan({ cls: 'song-directive__label' });
	label.setText(directive.type);

	const value = container.createSpan({ cls: 'song-directive__value' });
	value.setText(directive.value);
}

function renderRepeatBlock(container: HTMLElement): boolean {
	const lines = container.innerText.split('\n');
	if (lines.length === 0) {
		return false;
	}

	const parsedLines = lines.map((line) => parseRepeatLine(line));
	if (parsedLines.some((line) => line === null)) {
		if (!lines.every((line) => isShorthandRepeat(line))) {
			return false;
		}
	}

	container.empty();
	container.addClass('song-repeat');

	for (const [index, line] of lines.entries()) {
		const shorthand = isShorthandRepeat(line);
		const parsed = parsedLines[index];
		const row = container.createDiv({ cls: 'song-repeat__line' });

		if (shorthand) {
			row.addClass('song-repeat__line--shorthand');
			appendInlineContent(row, line.trim().slice(2, -2).trim());
			continue;
		}

		if (!parsed) {
			continue;
		}

		if (parsed.content.trim().length === 0) {
			row.addClass('song-repeat__line--empty');
			continue;
		}

		row.style.paddingInlineStart = `${Math.max(parsed.level - 1, 0) * 1.25}rem`;

		const directive = parseDirectiveLine(parsed.content);
		if (directive) {
			renderDirective(row, directive);
			continue;
		}

		appendInlineContent(row, parsed.content);
	}

	return true;
}

function shouldSkipTextNode(node: Text): boolean {
	const parent = node.parentElement;
	if (!parent) {
		return true;
	}

	if (
		parent.closest('.song-directive, .song-repeat, .song-chord') ||
		parent.closest('code, pre, a')
	) {
		return true;
	}

	return false;
}

function renderInlineChords(container: HTMLElement): void {
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
	const nodes: Text[] = [];

	while (walker.nextNode()) {
		const current = walker.currentNode as Text;
		if (shouldSkipTextNode(current)) {
			continue;
		}

		const text = current.nodeValue ?? '';
		if (!text.includes('[') && !text.includes('\\')) {
			continue;
		}

		nodes.push(current);
	}

	for (const node of nodes) {
		const text = node.nodeValue ?? '';
		const tokens = parseInlineChords(text);
		if (!tokens.some((token) => token.type === 'chord')) {
			continue;
		}

		const fragment = document.createDocumentFragment();
		for (const token of tokens) {
			if (token.type === 'text') {
				fragment.append(token.value);
				continue;
			}

			const chord = document.createElement('span');
			chord.addClass('song-chord');
			chord.setText(token.value);
			fragment.append(chord);
		}

		node.replaceWith(fragment);
	}
}

function processParagraphs(container: HTMLElement): void {
	const blocks = Array.from(container.querySelectorAll('p, li, blockquote p'));
	for (const block of blocks) {
		if (!(block instanceof HTMLElement)) {
			continue;
		}

		if (renderRepeatBlock(block)) {
			continue;
		}

		const directive = parseDirectiveLine(block.innerText);
		if (!directive) {
			continue;
		}

		renderDirective(block, directive);
	}
}

function registerFencedProcessor(plugin: Plugin, type: SmfDirective['type']): void {
	plugin.registerMarkdownCodeBlockProcessor(type, (source, el) => {
		const wrapper = el.createDiv({ cls: `song-directive song-directive--${type}` });
		const label = wrapper.createSpan({ cls: 'song-directive__label' });
		label.setText(type);

		const value = wrapper.createSpan({ cls: 'song-directive__value' });
		value.setText(source.trim());
	});
}

export function registerSmfProcessors(plugin: Plugin): void {
	registerFencedProcessor(plugin, 'strum');
	registerFencedProcessor(plugin, 'slash');
	registerFencedProcessor(plugin, 'count');

	plugin.registerMarkdownPostProcessor((el) => {
		processParagraphs(el);
		renderInlineChords(el);
	});
}
