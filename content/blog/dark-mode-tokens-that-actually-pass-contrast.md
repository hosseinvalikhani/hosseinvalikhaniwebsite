---
title: Dark mode tokens that actually pass contrast
description: A brand colour that reads beautifully on near-black usually fails on white. Splitting fills from text is the fix, and it costs one extra token.
date: 2026-09-02
tags: [design-systems, accessibility, css]
draft: false
---

Most design systems get dark mode wrong in the same place. They pick a vivid brand colour,
check it against the dark background, see a comfortable ratio, and ship. Then light mode
arrives and the same colour becomes unreadable.

## The measurement that changes the design

Take a bright green — `#00DC82`, the Nuxt brand colour. Against a near-black `#020420` it
measures **11.1:1**. That is not merely passing; it is nearly triple what WCAG AA asks for.

Against white it measures **1.8:1**. WCAG AA for body text is 4.5:1.

That is not a small miss. It is a colour that cannot be used as text on a light background at
any size, and no amount of font-weight will rescue it.

## One token is doing two jobs

The mistake is structural, not aesthetic. A single `--accent` token gets used for two
fundamentally different things:

- **Fills** — a button background, a chip, a progress bar. Here the brand colour sits *behind*
  text, and the contrast that matters is between the colour and the label on top of it.
- **Text** — a link, an icon, a heading accent. Here the brand colour *is* the text, and the
  contrast that matters is against the page background.

Those two jobs have opposite requirements as the theme flips. A fill wants to stay recognisably
the brand colour in both themes. Text has to move.

## Splitting them

```css
:root, :root.dark {
  --ds-accent: #00dc82;      /* fill  */
  --ds-accent-text: #00dc82; /* text — 11.1:1 on ink */
  --ds-on-accent: #020420;   /* ink on green, also 11.1:1 */
}

:root.light {
  --ds-accent: #00dc82;      /* unchanged: the brand stays the brand */
  --ds-accent-text: #007f45; /* the 700 step — 5.1:1 on white */
  --ds-on-accent: #020420;   /* still ink, never white */
}
```

Three things fall out of this, and the third is the one people miss:

1. `accent-text` steps down to the 700 value in light mode, where it measures 5.1:1.
2. `accent` never changes, so a primary button is the same green on both themes.
3. The text *on* that button is ink in both themes — not white. White on `#00DC82` is 1.8:1,
   which is exactly the failure we started with, wearing a different hat.

> Brand consistency and contrast are usually framed as a trade-off. They are not. The fill
> stays constant precisely *because* the text token is free to move.

## Checking it rather than trusting it

Ratios are cheap to compute, so compute them instead of eyeballing:

| Colour | On | Ratio | Verdict |
| --- | --- | --- | --- |
| `#00DC82` | `#020420` | 11.1:1 | Pass |
| `#00DC82` | `#FFFFFF` | 1.8:1 | Fail |
| `#007F45` | `#FFFFFF` | 5.1:1 | Pass |

The useful habit is to make the check part of the build rather than part of a review. A ratio
that is only verified when somebody remembers to look is a ratio that regresses.
