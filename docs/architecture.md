# Architecture

> The one page that explains why the rest of the codebase looks the way it does.

## The shape of the thing

Every route is **rendered once, at build time, into a complete HTML file**. There is no server at
runtime. There is no client-side router. There is no Vue in the browser.

```
content/*.md ──┐
app.config.ts ─┼──▶ nuxt generate ──▶ .output/public/**/*.html  ──▶ static host
components/ ───┘         │
                         └─▶ also: rss.xml, feed.json, sitemap.xml, llms.txt, og images
```

Nuxt and Vue are **build tools here, not runtime dependencies**. They compose the markup; then
they are gone.

## Why there is no client framework

This is the decision everything else follows from, so it is worth the space.

Phase 13 set a budget of ≤ 90 KB of JavaScript per route. Measuring the SPA shell — `200.html`,
which has no page component at all, just the framework — gave **88 KB gzipped**:

| | gzipped |
|---|---|
| Vue runtime | 28.4 KB |
| Nuxt entry (unhead, router, payload) | 34.8 KB |
| nuxt-link, image, misc | ~25 KB |
| **Framework floor** | **88 KB** |
| Budget | 90 KB |

98% of the budget, before a single line of this site's own code. Real routes shipped 98–119 KB.

The important part is not the number, it is **what that JavaScript was doing**: nothing. Every
page is prerendered, the markup is final at build time, and hydration existed so that three
controls — a theme toggle, a mobile drawer, a copy button — could respond to a click.

So `features.noScripts` removes the client bundle entirely, and those three controls are wired up
by hand in `public/enhance.js`.

| | before | after |
|---|---|---|
| JS per route | 98–119 KB | **5.9 KB** |
| LCP (mobile, throttled) | 1.8–2.1 s | **1.35 s** |
| CLS | 0.159 on posts | **0** |
| TBT | 0–100 ms | **0 ms** |
| Lighthouse | 92–99 | **100 / 100 / 100 / 100** |

### What you give up

Be clear-eyed about this:

- **No client-side route transitions.** Every navigation is a real page load. On a prerendered
  static site with Speculation Rules prerendering the next page on hover, this is generally
  *faster* than a client router — but it is a full document swap, so nothing survives navigation.
- **No reactive state in components.** A component's `<script setup>` runs at build time only.
  You cannot `ref()` something and expect it to update in the browser.
- **Interactivity is opt-in and hand-written.** Adding a new interactive control means adding a
  `data-` attribute and a listener in `enhance.js`, not writing a `@click`.

If you ever genuinely need reactive UI — a search box that filters as you type, say — the honest
options are to write it in `enhance.js`, or to reverse this decision deliberately and pay the
88 KB back. Do not half-reverse it by re-enabling hydration for one page.

## How client behaviour works now

`public/enhance.js` is the entire runtime. It lives by three rules:

**No build step.** It is served verbatim from `/public`, so what you read is what ships. That is
only affordable because it is small. If it ever needs bundling, it has outgrown its brief.

**Delegated listeners only.** One listener per event type on `document`, dispatching on `data-*`
attributes. Components render markup and nothing else.

**Progressive enhancement.** Every control is a real `<button>` or `<dialog>`. With the script
blocked, reading and navigating are untouched.

### The markup contract

Components render these hooks; `enhance.js` looks for them. A typo on either side fails silently,
which is why `tests/e2e/interactions.spec.ts` exists.

| Attribute | Meaning |
|---|---|
| `data-ds-theme-toggle` | Cycles system → light → dark |
| `data-ds-theme-pref` | Current preference, set by script, read by CSS to pick the icon |
| `data-ds-theme-set="light"` | Sets one theme outright (the style guide's switcher) |
| `data-ds-dialog-open="<id>"` | Opens the `<dialog>` with that id |
| `data-ds-dialog-close` | Closes the nearest enclosing dialog |
| `data-ds-copy="<text>"` | Copies that exact text to the clipboard |
| `data-ds-copy-state` | `idle` / `copied` / `failed`, drives the icon in CSS |
| `data-ds-header` | The element measured into `--header-h` |
| `data-ds-section-link="<id>"` | A nav link that tracks that section |
| `data-ds-token="<name>"` | Style-guide readout, filled with the resolved token value |

### Why icons are chosen in CSS

The theme toggle renders **all three** of its icons and the copy button both of its own; an
attribute picks which is visible. Two reasons: there is no render pass to swap them in, and an
icon that appears only after script runs is a layout shift.

## The rendering pipeline

Four things happen at build time that are worth knowing about, all in `nuxt.config.ts`:

1. **`content:file:beforeParse`** — injects `readingTime` into each post's frontmatter. Logic in
   `lib/reading-time.ts` so it can be tested.
2. **`nitro:init` → `prerender:generate`** — per route, injects font preload links and inlines
   the stylesheet. See below.
3. **`nuxt generate`** — renders every route the crawler can reach from `/`, plus the explicit
   `nitro.prerender.routes` list for things nothing links to (feeds, `llms.txt`, `404`).
4. **`scripts/static-404.mjs`** — overwrites Nuxt's empty SPA shell at `404.html` with the real
   prerendered 404 page.

### The two prerender-time rewrites

Both live in the `prerender:generate` hook, and both exist because `features.noScripts` disables
the pipeline Nuxt would normally use.

**Font preloads.** `@nuxt/fonts` emits preload links through the Vite client manifest, which
`noScripts` turns off. They also cannot go in `app.head`, which is serialised before the content
hashes in font filenames exist. So they are injected into the HTML directly — and **per route**:
Inter always, JetBrains Mono only on pages containing `<pre`. That split is measured, not
guessed; see [decisions.md](decisions.md#fonts-are-preloaded-per-route).

**Inlined CSS.** The whole site's CSS is 6.8 KB brotli — one render-blocking request. Inlining it
removes a round trip worth 74 ms of LCP on the home page and 151 ms on a post. Every `url()` is
rewritten to an absolute path first, because `url(../_fonts/x.woff2)` is relative to the
stylesheet and would otherwise resolve against the *page*.

## Layers, and what may depend on what

```
app.config.ts          your data
      │
      ▼
pages/ ──────────────▶ compose and fetch
      │
      ▼
components/home/, blog/, layout/ ──▶ render props; may read app.config
      │
      ▼
components/ds/ ──────▶ knows nothing about whose site this is.
                       NEVER imports app.config or #content.
```

The rule that matters: **`components/ds/*` must stay ignorant of this site's content.** It is the
part that would survive being lifted into another project, and the moment a `Ds*` component reads
`useAppConfig()` it stops being a design system and becomes this site's markup.

## Conventions that will bite you if you don't know them

**Component auto-import has no directory prefix.** `nuxt.config.ts` sets `pathPrefix: false` for
`ds/`, `layout/`, `home/` and `blog/`, because the files already carry their prefix. So
`components/ds/DsButton.vue` is `<DsButton>`, not `<DsDsButton>`.

This fails **silently in production**: Vue's "failed to resolve component" warning is dev-only, so
an unregistered component renders as an empty comment node and the build reports success. That is
what `scripts/check-output.mjs` exists to catch.

**Prose components are global and unprefixed.** MDC resolves `ProseH2` by bare name at render
time, so `components/content/` is registered `global: true`. Get this wrong and Nuxt Content
silently falls back to its own unstyled defaults.

**Tailwind's `dark:` variant is re-pointed.** `main.css` redefines it to target the `.dark` class
rather than `prefers-color-scheme`, because the theme toggle stamps a class. You should rarely
need `dark:` anyway — semantic tokens already switch.
