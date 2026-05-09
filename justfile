# Plugin dev tasks (`just build`, `just install`).

default_plugin_dir := env_var('HOME') + '/obsidian/oliver-obsidian/.obsidian/plugins/obsidian-song-charts-plugin'

build:
	npm run build

# Copy manifest.json, dist/main.js, and dist/styles.css into the plugin directory.
install dir=default_plugin_dir:
	mkdir -p "{{ dir }}"
	cp manifest.json dist/main.js dist/styles.css "{{ dir }}/"
