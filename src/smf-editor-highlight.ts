import { Prec, Range } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

import { findSmfFenceRegions } from './smf-editor-fence-scan.js';
import { spansForFenceLanguage } from './smf-editor-decorations.js';

function decorationsFromFenceScan(docText: string): DecorationSet {
	const ranges: Range<Decoration>[] = [];

	for (const region of findSmfFenceRegions(docText)) {
		const body = docText.slice(region.bodyFrom, region.bodyTo);
		const spans = spansForFenceLanguage(region.lang, body);
		if (!spans || spans.length === 0) {
			continue;
		}
		for (const s of spans) {
			const from = region.bodyFrom + s.from;
			const to = region.bodyFrom + s.to;
			if (from < to && to <= docText.length && from >= 0) {
				ranges.push(Decoration.mark({ class: s.className }).range(from, to));
			}
		}
	}

	return ranges.length > 0 ? Decoration.set(ranges, true) : Decoration.none;
}

const smFenceViewPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet = Decoration.none;

		constructor(view: EditorView) {
			this.decorations = decorationsFromFenceScan(view.state.doc.toString());
		}

		update(update: ViewUpdate): void {
			if (!update.docChanged) {
				return;
			}
			this.decorations = decorationsFromFenceScan(update.state.doc.toString());
		}
	},
	{
		decorations: (v) => v.decorations
	}
);

/** Highlights chordpro/strum/slash fenced bodies in the editor buffer (parallel to nested languages like Python). */
export function smfEditorFenceHighlight(): Extension {
	return Prec.highest(smFenceViewPlugin);
}
