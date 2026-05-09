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

## Song Markdown Format (SMF) v2.0 — Full specification

A Markdown-compatible format for song sheets with:

- YAML frontmatter metadata
- inline chords (ChordPro-style)
- strumming notation (DUX-style, unnamed externally)
- slash rhythm notation
- repeatable sections via Markdown-native markers
- notes + hints
- optional fenced music blocks for structured rhythm data

It is a **strict subset of Markdown** with a few defined extensions.

---

### 1. File Structure

A valid SMF file is standard Markdown:

```text
---
(frontmatter YAML)
---

(markdown body)
```

Everything outside frontmatter is Markdown text.

---

### 2. Frontmatter (YAML only)

Standard YAML block.

```yaml
---
title: Fast Car
artist: Tracy Chapman
tempo: 104
time: 4/4
key: C
capo: 2
tuning: standard
---
```

Rules:

- valid YAML only
- no custom syntax allowed
- all metadata is optional

---

### 3. Markdown Base Layer

SMF is fully valid Markdown:

- headings
- paragraphs
- blockquotes
- lists

Example:

```md
# Verse 1

This is a normal paragraph.
```

---

### 4. Chords (Inline Only)

ChordPro-style inline chords:

```md
[G]Hello darkness my old [D]friend
```

Rules:

- chords appear in `[...]`
- attach to next lyric fragment
- multiple chords per line allowed

Chord-only lines allowed:

```md
[G]   [D]   [Em]   [C]
```

---

### 5. Strumming Notation (Inline Convention)

Strumming is represented as **inline monospaced text or fenced line starting with `!strum:`**.

#### 5.1 Inline form (preferred for simplicity)

```md
!strum: D - D U - U D U
```

#### 5.2 Meaning

| Symbol | Meaning    |
| ------ | ---------- |
| D      | downstroke |
| U      | upstroke   |
| X      | muted hit  |
| -      | rest       |
| T      | tap / percussion |

Rules:

- spacing is visual only
- timing is implied by alignment or context

---

### 6. Slash Rhythm Notation

Used for traditional chart feel.

Inline directive form:

```md
!slash: | / / / / |
```

Or directional:

```md
!slash: | ↓ ↓ ↑ ↑ ↓ ↑ |
```

Rules:

- must be inside a `!slash:` line
- bar symbols optional but recommended

---

### 7. Count Guide (Optional)

```md
!count: 1 & 2 & 3 & 4 &
```

Used for alignment reference only.

---

### 8. Notes

Standard Markdown blockquote:

```md
> Play softly here
> Build into chorus
```

Rules:

- purely informational
- ignored by playback engines unless explicitly interpreted

---

### 9. Sections

Standard Markdown headings:

```md
# Intro
# Verse 1
## Pre-Chorus
# Chorus
```

No custom section syntax.

---

### 10. Repeat System (Markdown-native)

Repeats are expressed using **blockquote-style structural bars (`|`)**.

This is the only structural extension to Markdown.

#### 10.1 Basic Repeat Block

```md
| # Verse 1
| [G]Hello [D]world
| [C]Another line
|
```

Meaning:

- `|` prefixes define a repeatable region
- blank `|` ends region
- region is repeated based on optional directive or default behavior

#### 10.2 Repeat Count

Placed immediately after header or inside block:

```md
| # Chorus
| repeat: 2
| [C]Sing it loud
| [G]Sing it proud
|
```

#### 10.3 Nested Repeats

Indentation determines nesting:

```md
| # Section
| | [G]Outer line
| | [D]Outer line
| |
| | # Inner repeat
| | | [C]Inner A
| | | [D]Inner B
| | |
```

Rules:

- each leading `|` = one nesting level
- inner blocks repeat independently

#### 10.4 Alternative shorthand repeat

```md
|: [G]Hello [D]world :|
```

Equivalent to a repeat block.

---

### 11. Fenced Music Blocks (Optional, structured data)

Only used when structure is needed.

#### 11.1 Strumming block

````text
```strum
D - D U - U D U
```
````

#### 11.2 Slash block

````text
```slash
| ↓ ↓ ↑ ↑ ↓ ↑ |
```
````

#### 11.3 Count block

````text
```count
1 & 2 & 3 & 4 &
```
````

Rules:

- fenced blocks are optional
- inline forms are preferred
- blocks are for tooling / UI rendering

---

### 12. Line Processing Rules

Order of interpretation:

1. YAML frontmatter
2. Markdown structure
3. repeat regions (`|`)
4. inline chords
5. inline directives (`!strum`, `!slash`, `!count`)
6. notes (`>`)
7. fenced blocks

---

### 13. Semantics of Repeat Regions

A repeat region:

- begins with `|`
- ends with blank `|`
- may contain nested `|`
- expands logically before rendering

No required runtime behavior; expansion is UI-defined.

---

### 14. Escape Rules

Inside lyric text:

| Sequence | Meaning |
| -------- | ------- |
| `\[ ]`   | literal chord brackets |
| `\|`     | literal pipe |
| `\!`     | literal directive |

---

### 15. Minimal Example

```yaml
---
title: Example Song
artist: Demo
tempo: 100
---
```

```md
# Verse

| # Verse 1
| [G]Hello [D]world
| [C]This is simple
|
```

```md
# Chorus

!strum: D D U U D U

[C]Sing it loud
[G]Sing it proud

> Let it ring
```

---

### 16. Design Principles

- Markdown is the base language (no fork)
- YAML only for metadata
- no hidden syntax layers
- repetition uses visual structure, not new grammar
- inline-first design (blocks are optional)
- readable without parser
- parseable without ambiguity

---

### 17. Non-Goals

This format explicitly avoids:

- separate DSLs
- non-Markdown files
- required AST tooling
- binary or encoded structures
- hidden state machines
