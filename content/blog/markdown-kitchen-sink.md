---
title: Every markdown element, rendered
description: A deliberate kitchen-sink post that exercises every element the prose components style. It doubles as the render test for light and dark mode.
date: 2026-09-01
tags: [meta, testing]
draft: false
---

This post exists to be looked at rather than read. It uses every element the prose components
style, so that a styling regression in any one of them is visible on a single page — in both
themes, at every width.

## Headings

The page title above is the only `h1`. Everything below starts at `h2`.

### A third-level heading

Nesting stops here. A personal blog post that needs an `h4` usually needs to be two posts.

## Text-level formatting

Body copy with **bold emphasis**, *italic emphasis*, ***both at once***, ~~struck-through
text~~, `inline code`, a [link to another post](/blog/dark-mode-tokens-that-actually-pass-contrast),
an [external link](https://nuxt.com), and a footnote-ish aside in parentheses (like this one).

Inline code inside a sentence — `const ratio = 4.5` — should be distinguishable from the
surrounding text without shouting, and must not break the line rhythm.

## Lists

An unordered list:

- A first item
- A second item, long enough to wrap onto a second line so the hanging indent and the gap
  between the marker and the text can both be judged properly
- A third item
  - A nested item
  - Another nested item

An ordered list, where the numbers carry meaning:

1. Measure the contrast
2. Split the token
3. Check it in the build

## Blockquote

> A quotation that runs long enough to wrap, so the left rule and the indent can be judged
> against the body text beside it.
>
> — with a second paragraph and an attribution line

## Code

A fenced block with a language, which should syntax-highlight in both themes:

```ts
export function contrast(a: number, b: number): number {
  const lighter = Math.max(a, b)
  const darker = Math.min(a, b)
  return (lighter + 0.05) / (darker + 0.05)
}
```

A block with no language, which should still be readable and still scroll:

```
plain preformatted text
  with meaningful    whitespace
```

A deliberately long line, to prove the block scrolls inside itself rather than pushing the page
sideways:

```bash
npx nuxi generate && npx serve .output/public --listen 4173 --single --cors --no-clipboard --no-port-switching
```

## Table

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `canvas` | `#F8FAFC` | `#020420` | The page |
| `surface` | `#FFFFFF` | `#0F172A` | Cards |
| `accent-text` | `#007F45` | `#00DC82` | Green as type |
| `link` | `#0369A1` | `#38BDF8` | Links |

Tables wider than the measure should scroll inside their own container.

## Horizontal rule

---

## Image

![A placeholder avatar on a dark panel](/img/avatar-placeholder.svg){width="400" height="400"}

An image needs reserved space, or the text below it jumps as it loads. Markdown has no
syntax for dimensions, so they are supplied as MDC attributes — and the build fails without them.
