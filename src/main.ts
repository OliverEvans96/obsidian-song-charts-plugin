import { Plugin } from 'obsidian';
import { smfEditorFenceHighlight } from './smf-editor-highlight';
import { registerSmfProcessors } from './smf-renderer';

export default class SongChartsPlugin extends Plugin {
	async onload() {
		this.registerEditorExtension(smfEditorFenceHighlight());
		registerSmfProcessors(this);
	}
}
