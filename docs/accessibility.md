# Accessibility conformance record

Target: **WCAG 2.2 Level AA**. This file records what the Phase 12 audit found, what it changed,
and — for the criteria that are satisfied by the shape of the site rather than by any code — why
they are satisfied. The plan's instruction was to record those rather than silently skip them,
because "there is no form on this site" is a conclusion someone has to be able to check, not an
assumption to inherit.

## What the audit changed

| # | Criterion | What was wrong | Fix |
|---|---|---|---|
| 1 | 1.4.3 Contrast (Minimum) | `--ds-fg-subtle` was slate-500: 4.24:1 on canvas, **3.46:1 on raised**. It carries post dates, reading time, `<th>` cells, code-block filenames and the footer line — all ordinary 13–14px text. Failing in the default theme, on every page. | The three text tiers each moved a ramp step. `fg-subtle` now holds Mist `#94A3B8`, which is the colour Appendix A names for captions and metadata; `fg-muted` moves to slate-300 so the tiers stay distinct. Light moved to slate-700 / slate-600. |
| 2 | 1.4.11 Non-text Contrast | `--ds-hairline-strong` measured 1.95:1 (dark) and 1.42:1 (light). It is the *only* boundary on secondary buttons and the contact chips, which have no fill. | Both themes now use slate-500 `#64748B` — 4.2:1 and 4.6:1. `hairline` is unchanged and stays decorative: card edges and section rules identify nothing. |
| 3 | 1.4.11 Non-text Contrast | The primary button's green fill is **1.74:1** against the light canvas. The label was readable; the control's boundary was not there at all. | New `--ds-accent-edge` token: the fill itself on dark (drawing nothing), Pine `#00A155` on light (3.2:1). |
| 4 | 1.4.1 Use of Colour / 4.1.2 | `.ds-nav-link[aria-current]` is an attribute-*presence* selector, and the header stamps `aria-current="false"` on every home-page section link not in view. All five nav items rendered bold, underlined and lit at once, so the indicator said "you are here" about everything. | `:not([aria-current="false"])` on both rules. |
| 5 | 2.3.3 Animation from Interactions | The global reduced-motion rule collapsed `animation-duration` but not `animation-delay`. `.ds-reveal` uses `backwards` fill, so the hero's lead and actions still sat at opacity 0 for up to 180 ms and then snapped in — a stagger, shown to the visitor who asked for no motion. | `animation-delay` and `transition-delay` collapse too. |
| 6 | 2.4.11 Focus Not Obscured | The skip link was `absolute`, whose containing block is the initial one — `top-4` meant four units from the top of the *document*. Reached from part-way down a long post, it focused something already scrolled off screen. | `fixed`. |
| 7 | 1.3.1 Info and Relationships | `aria-labelledby="skill-PLACEHOLDER Languages"` — the space makes it a *list* of two ids, neither of which resolves, so every skill group was an unlabelled region. Invisible in the markup and in the rendering; only the accessibility tree shows it. | Ids are slugified. |
| 8 | 1.3.1 Info and Relationships | `PostCard` used `<h3>` directly under each listing's `<h1>`, implying an `<h2>` section that does not exist. | `<h2>`. |
| 9 | 1.3.1 / 2.4.1 | The hero, blog listing, tag pages and error page used a bare `<section>`. Without an accessible name it is not a region — it is announced as a generic container and never reaches the landmark list. | Each is named from its own `<h1>`. |
| 10 | 2.5.8 Target Size (Minimum) | Linked tag chips were 22 px tall. The spacing exception does not apply: at `gap-2` the 24 px circles it measures overlap. | `DsBadge` `sm` padding raised; the chips are now 26 px. |
| 11 | 1.4.1 / 1.4.11 in forced colours | Anchors styled as buttons (the hero's two actions, "All posts", both error-page actions) lost their fill to `Canvas` and had no UA border to fall back on — they flattened into bare text. The nav's current-item underline is drawn with a background colour, which flattened the same way. | `.ds-button` gets a `ButtonText` border, the nav underline a `Highlight` background, and the stretched card link its own `CanvasText` focus ring. |

`npm run check:contrast` re-measures every token pair in `tokens.css` against both thresholds in
both themes, so 1–3 fail a command rather than an audit if a value ever drifts back.

## Satisfied by construction

These need no code, but they need a reason on the record.

- **2.5.7 Dragging Movements** — there is no drag interaction anywhere on the site. No sliders, no
  reorderable lists, no carousels, no swipe-only gestures. Every control is a click or a keypress.
- **3.2.6 Consistent Help** — no help mechanism is offered on any page, so there is no ordering to
  be inconsistent about. The contact route (an email address, shown as text) appears in exactly one
  place in the footer and one in the contact section, in the same relative order on every page,
  because both live in the shared layout or a fixed section sequence.
- **3.3.7 Redundant Entry** — there are no forms and no multi-step processes, so no information is
  ever asked for twice. The contact section is deliberately a `mailto:` link rather than a form;
  see the note in `ContactSection.vue` for why.
- **3.3.8 Accessible Authentication** — there is no authentication.
- **2.4.11 Focus Not Obscured (Minimum)** — the sticky header is the only thing that can cover a
  focused element. `TheHeader` measures itself into `--header-h` with a `ResizeObserver`, and
  `scroll-padding-top` / `scroll-margin-top` are derived from it, so the clearance stays correct
  when the header wraps at narrow widths rather than being right only at the width it was written.

## Still manual, every release

Automation does not cover these, and Phase 15's axe run will not either — axe finds roughly a third
of WCAG issues and none of the ones that are about meaning:

- A screen-reader pass (NVDA/Firefox, VoiceOver/Safari): nav → hero → a post.
- A keyboard-only pass over all five routes, in both themes.
- Windows High Contrast.
- 200 % zoom and 400 % reflow (Phase 14 owns the responsive work; this is the a11y half of it).
- Whether the alt text is *right*, which no tool can tell you.
