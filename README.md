# Song Charts for Obsidian

An Obsidian community plugin that renders **Song Markdown Format (SMF) v2.0** inside three fenced code blocks — **`chordpro`**, **`strum`**, and **`slash`** — in Reading view. Normal Markdown is unchanged.

## What this plugin renders

| Block tag    | Purpose |
| ------------ | ------- |
| **`chordpro`** | ChordPro-style `[G]` lines with **chords above lyrics**, aligned per syllable or chord-only beats |
| **`strum`**    | **Line 1** is always the **count**; following lines are ASCII strum strokes rendered as **arrows** |
| **`slash`**    | Slash rhythm (ASCII); stroke letters `D`/`U`/`X`/`-`/`T` become glyphs like strum; `/` and `\|` stay as written |

Escape sequences inside block bodies: `\[`, `\|`, `\!`

YAML frontmatter stays normal Markdown and is not parsed by this plugin.

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

````md
---
title: Example Song
artist: Demo
tempo: 100
---

```strum
1 & 2 & 3 & 4 &
D - D U - U D U
```

```chordpro
[G]Hello [D]world
[C]This is simple
```

```slash
| / / / / |
```

> Performance notes in normal Markdown
````

---

## Song Markdown Format (SMF) v2.0 — Specification

SMF is ordinary Markdown plus optional fenced islands using exactly these language tags.

### 1. File structure

```text
---
(YAML frontmatter)
---

(markdown body)
```

### 2. Frontmatter

Optional YAML (`title`, `artist`, `tempo`, `key`, etc.). Valid YAML only.

### 3. `chordpro` blocks

Body = one lyric line per row (newline-separated). Chords use `[Name]` immediately before the lyric fragment they sit above.

- Several chords in a row with only spaces between them stack over the **next** lyric token (`[G] [D] hello`).
- A **chord-only** line (only chords and spaces, e.g. an intro figure) is split into **one column per chord** so beats line up horizontally.
- Nested `[brackets]` inside lyrics must be escaped: `\[`.

### 4. `strum` blocks

- **First line (required):** count string, e.g. `1 & 2 & 3 & 4 &`. Shown as the subdivision guide.
- **Following lines:** ASCII pattern. Characters are mapped when rendered:

| ASCII | Shown as |
| ----- | -------- |
| `D`   | ↓ (down) |
| `U`   | ↑ (up)   |
| `X`   | ✕        |
| `-`   | · (rest) |
| `T`   | ⊤ (tap)  |

Spaces are preserved for alignment. Extra blank lines become vertical spacing.

### 5. `slash` blocks

Slash charts: use `/`, bar lines `|`, and optional stroke letters. The same **`D`/`U`/`X`/`-`/`T` → glyph** mapping applies so you can type ASCII and read arrows.

### 6. Escapes (inside fenced bodies)

| Sequence | Meaning |
| -------- | ------- |
| `\[ ]`   | Literal brackets |
| `\|`     | Literal pipe |
| `\!`     | Literal `!` |

### 7. Processing

Obsidian renders Markdown; this plugin registers markdown **code block processors** for `chordpro`, `strum`, and `slash` so those fences render as song-chart UI instead of plain code.

### 8. Non-goals

- No chord or rhythm syntax interpreted **outside** these three fences.
- No audio playback in this plugin.
