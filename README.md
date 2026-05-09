# Song Charts for Obsidian

An Obsidian community plugin that renders **Song Markdown Format (SMF) v2.0** inside three fenced code blocks — **`chordpro`**, **`strum`**, and **`slash`** — in Reading view. Normal Markdown is unchanged.

## What this plugin renders

| Block tag    | Purpose |
| ------------ | ------- |
| **`chordpro`** | ChordPro-style `[G]` lines with **chords above lyrics**, aligned per syllable or chord-only beats |
| **`strum`**    | **Line 1** is always the **count**; following lines are ASCII strum strokes rendered as **arrows** |
| **`slash`**    | **Slash charts** as an SVG **five-line staff** with slash marks and chords above; measures between `\|`, one `/` per stroke. **`D` stays a chord** (not an arrow). Lines without `/` fall back to plain text. Use **`strum`** for `D`/`U`/… → arrow glyphs |

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
| G / G / | Em / Em / | D / D / | G / G / |
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

Slash charts ([slash notation](https://en.wikipedia.org/wiki/Chord_chart#Slash_notation)):

- **Measures** are separated by `|` (optional at the ends). Example: `| G / G / | Em / Em / |`.
- Each **`/`** is one rhythmic slash on the staff. A **chord token** (e.g. `G`, `Em`, `Bb`, `F#m7`) applies to the **next** slash until another chord appears (`G / G /` → two slashes, both labeled `G`).
- The block is drawn as **SVG**: staff lines, treble clef, **4/4** time signature (layout constant for now), bar lines at measure ends, `b`/`#` shown as **♭** / **♯** when they follow a letter (`Bb` → B♭).
- After escapes (`\|`, `\[`, `\!`), lines that contain **no `/`** are shown as **styled text** (fallback).

For **strum arrows** from ASCII **`D` / `U` / …**, use a **`strum`** block instead.

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
