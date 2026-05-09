# Song Charts for Obsidian

An Obsidian community plugin that renders **Song Markdown Format (SMF) v2.0** syntax in Reading view.

## What this plugin renders

- Inline chords: `[G]Hello [D]world`
- Inline directives:
  - `!strum: D - D U - U D U`
  - `!slash: | / / / / |`
  - `!count: 1 & 2 & 3 & 4 &`
- Repeat regions with pipe prefixes:
  - `| ...`
  - nested `| | ...`
  - shorthand `|: ... :|`
- Fenced blocks:
  - ```` ```strum ``` ````
  - ```` ```slash ``` ````
  - ```` ```count ``` ````
- Escape sequences:
  - `\[`, `\|`, `\!`

The source file remains valid Markdown with YAML frontmatter support unchanged.

## Development

```bash
npm install
npm run lint
npm run test
npm run build
```

## Manual testing in Obsidian

1. Build the plugin: `npm run build`
2. Copy `main.js`, `manifest.json`, and `styles.css` into:
   - `<Vault>/.obsidian/plugins/obsidian-song-charts-plugin/`
3. Reload Obsidian and enable **Song Charts** in **Settings → Community plugins**.

## Example

```md
---
title: Example Song
artist: Demo
tempo: 100
---

# Verse

| # Verse 1
| [G]Hello [D]world
| [C]This is simple
|

!strum: D D U U D U

[C]Sing it loud
[G]Sing it proud

> Let it ring
```
