import { Plugin } from 'obsidian';
import { registerSmfProcessors } from './smf-renderer';

export default class SongChartsPlugin extends Plugin {
	async onload() {
		registerSmfProcessors(this);
	}
}
