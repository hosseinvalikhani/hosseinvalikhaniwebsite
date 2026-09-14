# Personal Website — Phased Build Plan

Stack: **Nuxt 4 + Tailwind CSS v4 + a first-party design system + Nuxt Content v3 + Nuxt SEO**,
prerendered as a static site. **No Nuxt UI, no component library.**

Colour, ramps, ratios and contrast results come from `nuxt-tailwind-color-system-source.html` in
this repo (summarised in **Appendix A**). That file is the source of truth; tokens are transcribed
from it, never invented.

---

## How we work through this

Every phase below ends with something you can **open in a browser and judge**. The loop is the
same each time:

1. I build the phase.
2. I stop and hand you a URL plus a short **Review** checklist.
3. You look at it, break it, and tell me what's wrong or what you'd rather see.
4. I fix it inside the same phase — no new work starts.
5. Once you approve, **then** I commit, and only then does the next phase begin.

Rules that make this work:

- **Nothing is committed before you approve it.** The commit message for each phase is written in
  advance, in the phase itself, so history reads as a clean ladder.
- **No phase is a dead phase.** Config and token work is deliberately paired with a visible
  surface (the style guide at `/design-system`) so there is never a "trust me, it's fine" step.
- **Design feedback is cheapest early.** Phases 2–4 are pure design system on a style-guide page,
  before any real content exists. A colour, radius or type change there is a one-line edit; the
  same change after the whole site is built is still one line *because* it's tokenised — that's
  the point of doing it in this order.
- **Structural feedback has a deadline.** Section order, the hero layout and the nav model get
  harder to change after Phase 8. Phases 5–7 exist to surface that while it's still cheap.
- If a phase's gate fails, we fix it in that phase. We do not carry a known failure forward.

---

## Phase map

| # | Phase | What you can see when it's done | Where to look |
|---|---|---|---|
| 0 | Inputs | — (you fill in a table) | — |
| 1 | Running skeleton | Dev server boots, one styled page, theme switches | `/` |
| 2 | Token layer + style guide | Every colour, type size, radius in both themes | `/design-system` |
| 3 | Static primitives | Buttons, links, badges, cards, sections in every state | `/design-system` |
| 4 | Interactive primitives | Dialog, theme toggle, copy button, breadcrumb | `/design-system` |
| 5 | Layout shell | Real header, footer and mobile drawer around a stub page | `/` |
| 6 | Hero | The first screen, fully designed | `/` |
| 7 | Rest of the home page | About, Experience, Skills, Contact | `/` |
| 8 | Blog | Listing, post page, all markdown elements styled | `/blog`, `/blog/hello-world` |
| 9 | Tag pages + error page | Tag landing pages and a real 404 | `/blog/tag/android`, `/nope` |
| 10 | SEO + structured data | View-source: titles, canonicals, OG, JSON-LD | any route |
| 11 | Feeds, sitemap, robots | RSS, JSON feed, sitemap, llms.txt | `/rss.xml` etc. |
| 12 | Accessibility pass | Keyboard + screen reader + axe, both themes | all routes |
| 13 | Performance pass | Lighthouse against the built output | built site |
| 14 | Responsive pass | 320 / 375 / 768 / 1440 px and 400 % zoom | all routes |
| 15 | Automated QA + CI | Checks run on every push | CI |
| 16 | Deploy | The live site | production URL |

---

## Phase 0 — Inputs

**Goal:** collect everything the site needs so no phase stalls waiting on copy.

Fill these in; they land in `app/app.config.ts` in Phase 2 and nothing hardcodes them.

| Input | Notes |
|---|---|
| Full name | used in `<title>`, `Person` schema |
| Professional title | e.g. "Senior Android Engineer" |
| Short intro (1–2 sentences) | hero subheading |
| About copy (~120 words) | About section |
| Experience entries | company, role, period, 1–2 line contribution |
| Skill groups | 3–5 groups, ~5 items each |
| Social links | GitHub, LinkedIn, X, email |
| Canonical site URL | required for sitemap, OG, canonicals, feeds |
| Profile photo | square, ≥ 800 px; a placeholder SVG stands in until supplied |
| Locale | default `en` |

**▶ Review:** none — but placeholder text ships until these arrive, and every screenshot you
review before they land will contain lorem-ish filler. Supplying the real intro and about copy
before Phase 6 makes the hero review meaningful instead of theoretical.

**Gate:** the table is filled, or you've explicitly said "use placeholders for now".

---

## Phase 1 — Running skeleton

**Goal:** a Nuxt 4 app that boots, compiles Tailwind v4, and switches theme — nothing else.

**Build**

```bash
npx nuxi@latest init personal-site      # Nuxt 4.x
cd personal-site
npm i -D tailwindcss @tailwindcss/vite  # Tailwind v4, CSS-first, via the Vite plugin
npx nuxi module add content             # @nuxt/content v3 (brings MDC + Shiki)
npx nuxi module add image               # @nuxt/image
npx nuxi module add fonts               # @nuxt/fonts — self-hosting + fallback metrics
npx nuxi module add color-mode          # @nuxtjs/color-mode — FOUC-free inline script
npx nuxi module add eslint              # @nuxt/eslint
npm i -D @nuxtjs/seo                    # sitemap + robots + schema-org + og-image + link-checker
npm i -D eslint-plugin-vuejs-accessibility
```

Do **not** add: a Tailwind config JS file (v4 is CSS-first), a UI or component library, a variant
library (`tailwind-variants` / `cva` — Phase 3 ships a 15-line equivalent), a class-merge utility,
an icon runtime, a date library (use `Intl.DateTimeFormat`), or an animation library.

`nuxt.config.ts` — the full config, written once now so later phases only switch things on:

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content', '@nuxt/image', '@nuxt/fonts',
    '@nuxtjs/color-mode', '@nuxtjs/seo', '@nuxt/eslint',
  ],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  site: { url: 'https://example.com', name: '<Name>', defaultLocale: 'en' },

  colorMode: { classSuffix: '', preference: 'system', fallback: 'dark', storageKey: 'ds-theme' },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: { default: 'github-light', dark: 'github-dark' },
          langs: ['ts', 'js', 'vue', 'bash', 'json', 'kotlin', 'css'],
        },
      },
    },
  },

  image: { format: ['avif', 'webp'], quality: 72, densities: [1, 2] },
  ogImage: { zeroRuntime: true, fonts: ['Inter:700', 'Inter:800'] },

  experimental: {
    payloadExtraction: true,
    defaults: { nuxtLink: { prefetch: true, prefetchOn: { visibility: false, interaction: true } } },
  },

  nitro: {
    compressPublicAssets: { gzip: true, brotli: true },
    prerender: {
      crawlLinks: true,
      failOnError: true,
      routes: ['/', '/blog', '/rss.xml', '/feed.json', '/llms.txt', '/404.html'],
    },
  },

  routeRules: {
    '/_nuxt/**': { headers: { 'cache-control': 'public,max-age=31536000,immutable' } },
    '/design-system': { robots: false, sitemap: false },
  },

  future: { compatibilityVersion: 4 },
  typescript: { strict: true, typeCheck: false },  // typecheck runs in CI, not in the dev loop
})
```

Why these specifically:

- `prefetchOn.interaction` only — visibility prefetch pulls every in-view route chunk over mobile
  data for no measurable benefit on a site this small.
- `failOnError: true` — a broken prerender must break the build, not ship half a site.
- `classSuffix: ''` puts `.dark` / `.light` on `<html>`, which is what Phase 2's tokens target.
  `preference: 'system'` honours the visitor's OS setting on a first visit; `fallback: 'dark'`
  is what they get when it can't be read, since the brand is designed for ink.
- `devtools: { enabled: false }` — Nuxt DevTools 3.4.2 and Vite 8 disagree over
  `applyToEnvironment` hooks and print a WARN on every dev start. Re-enable when that is fixed.
- `ogImage.zeroRuntime` — OG images are baked at build; no Satori runtime reaches the client.
- Fonts are self-hosted, so there are no third-party origins and no `preconnect`.

Then: `app/assets/css/main.css` with just `@import "tailwindcss";`, and an `app.vue` that renders
one heading and a raw theme-toggle button.

**▶ Review — `npm run dev`, open `/`**

- [ ] Page loads; browser console and terminal are both silent
- [ ] The toggle flips `<html>` between `class="dark"` and `class="light"` (check DevTools)
- [ ] Hard-reload in dark mode: **no white flash** before paint
- [ ] A Tailwind utility (e.g. `text-3xl`) actually applies

**Gate:** `npx nuxi typecheck` clean; `npm run build` emits no Tailwind or Vite warnings.

**Commit:** `chore: scaffold nuxt 4 app with tailwind v4, content and seo modules`

---

## Phase 2 — Token layer + style guide

**Goal:** the entire visual language, on screen, before a single component exists. This is the
most important review in the project — everything downstream inherits these values.

### 2.1 Primitives — `app/assets/css/tokens.css`

```css
@theme {
  /* --- Green: the Nuxt ramp; brand sits at 400 --- */
  --color-brand-50:#EFFDF5;  --color-brand-100:#D9FBE8; --color-brand-200:#B3F5D1;
  --color-brand-300:#75EDAE; --color-brand-400:#00DC82; --color-brand-500:#00C16A;
  --color-brand-600:#00A155; --color-brand-700:#007F45; --color-brand-800:#016538;
  --color-brand-900:#0A5331; --color-brand-950:#052E16;

  /* --- Sky: the Tailwind ramp; echo sits at 400 --- */
  --color-echo-50:#F0F9FF;  --color-echo-100:#E0F2FE; --color-echo-200:#BAE6FD;
  --color-echo-300:#7DD3FC; --color-echo-400:#38BDF8; --color-echo-500:#0EA5E9;
  --color-echo-600:#0284C7; --color-echo-700:#0369A1; --color-echo-800:#075985;
  --color-echo-900:#0C4A6E; --color-echo-950:#082F49;

  /* --- Slate: the neutral backbone --- */
  --color-slate-50:#F8FAFC;  --color-slate-100:#F1F5F9; --color-slate-200:#E2E8F0;
  --color-slate-300:#CBD5E1; --color-slate-400:#94A3B8; --color-slate-500:#64748B;
  --color-slate-600:#475569; --color-slate-700:#334155; --color-slate-800:#1E293B;
  --color-slate-900:#0F172A; --color-slate-950:#020617;

  /* --- Fixed points --- */
  --color-ink:#020420;                      /* Nuxt dark — the base. Never #000 */
  --color-signal-400:#FBBF24; --color-signal-600:#D97706; --color-signal-700:#B45309;
  --color-danger-400:#F87171; --color-danger-600:#DC2626; --color-danger-700:#B91C1C;

  /* --- Type --- */
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  /* fluid scale — clamp() instead of breakpoint jumps */
  --text-eyebrow: 0.8125rem;  --text-eyebrow--letter-spacing: 0.2em;
  --text-sm: 0.875rem;  --text-base: 1rem;  --text-lg: 1.125rem;
  --text-xl:  clamp(1.25rem,  1.10rem + 0.6vw, 1.5rem);
  --text-2xl: clamp(1.5rem,   1.30rem + 1.0vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.50rem + 1.9vw, 2.75rem);
  --text-display: clamp(2.5rem, 1.60rem + 4.4vw, 4.5rem);
  --text-display--line-height: 0.95;
  --text-display--letter-spacing: -0.035em;

  /* --- Shape, taken from the brand source --- */
  --radius-chip: 0.5rem;   --radius-control: 0.75rem;
  --radius-panel: 1.25rem; --radius-card: 1.375rem;

  /* --- Motion --- */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  --duration-fast: 120ms; --duration-base: 220ms; --duration-slow: 420ms;

  /* --- Layout --- */
  --container-prose: 65ch; --container-page: 72rem;
}
```

### 2.2 Semantic layer — roles, theme-switched

`@theme inline` makes the generated utility reference the variable itself, so `bg-canvas`
re-resolves the moment `.dark` flips. This is the only correct v4 pattern for themed tokens; a
plain `@theme` block would freeze one theme's values into the compiled CSS.

```css
@theme inline {
  --color-canvas: var(--ds-canvas);
  --color-surface: var(--ds-surface);
  --color-raised: var(--ds-raised);
  --color-hairline: var(--ds-hairline);
  --color-hairline-strong: var(--ds-hairline-strong);
  --color-fg: var(--ds-fg);
  --color-fg-muted: var(--ds-fg-muted);
  --color-fg-subtle: var(--ds-fg-subtle);
  --color-accent: var(--ds-accent);            /* fills only */
  --color-accent-text: var(--ds-accent-text);  /* type and icons on the canvas */
  --color-accent-hover: var(--ds-accent-hover);
  --color-on-accent: var(--ds-on-accent);
  --color-link: var(--ds-link);
  --color-link-hover: var(--ds-link-hover);
  --color-signal: var(--ds-signal);
  --color-danger: var(--ds-danger);
  --color-focus: var(--ds-focus);
}

/* Dark is the default and the mode the brand is designed for. */
:root, :root.dark {
  --ds-canvas:#020420; --ds-surface:#0F172A; --ds-raised:#131F36;
  --ds-hairline:#1E293B; --ds-hairline-strong:#334155;
  --ds-fg:#F8FAFC; --ds-fg-muted:#94A3B8; --ds-fg-subtle:#64748B;
  --ds-accent:#00DC82; --ds-accent-text:#00DC82; --ds-accent-hover:#00C16A;
  --ds-on-accent:#020420;                       /* ink on green — 11.1:1 */
  --ds-link:#38BDF8; --ds-link-hover:#7DD3FC;
  --ds-signal:#FBBF24; --ds-danger:#F87171; --ds-focus:#00DC82;
}

/* Light: fills keep the brand hue, text steps down to 700. */
:root.light {
  --ds-canvas:#F8FAFC; --ds-surface:#FFFFFF; --ds-raised:#F1F5F9;
  --ds-hairline:#E2E8F0; --ds-hairline-strong:#CBD5E1;
  --ds-fg:#020420; --ds-fg-muted:#475569; --ds-fg-subtle:#64748B;
  --ds-accent:#00DC82; --ds-accent-text:#007F45;   /* 5.1:1 on white */
  --ds-accent-hover:#00A155; --ds-on-accent:#020420;
  --ds-link:#0369A1; --ds-link-hover:#075985;      /* 5.9:1 on white */
  --ds-signal:#B45309; --ds-danger:#B91C1C; --ds-focus:#007F45;
}

/* prefers-contrast: more — widen every separation. */
@media (prefers-contrast: more) {
  :root, :root.dark { --ds-fg-muted:#CBD5E1; --ds-fg-subtle:#94A3B8; --ds-hairline:#475569; }
  :root.light       { --ds-fg-muted:#334155; --ds-fg-subtle:#475569; --ds-hairline:#94A3B8; }
}
```

**Rule:** application code uses semantic utilities only — `bg-canvas`, `text-fg-muted`,
`border-hairline`, `text-accent-text`. A raw ramp step (`bg-brand-400`) anywhere outside
`app/components/ds/` is a bug; Phase 15 adds the lint rule that enforces it.

### 2.3 Base layer — `app/assets/css/base.css`

- `html { scroll-behavior: smooth; scroll-padding-top: var(--header-h); }` — the scroll-padding is
  what keeps a hash-linked heading out from under the sticky header (WCAG 2.2 *Focus Not Obscured*).
- `:focus-visible { outline: 2px solid var(--ds-focus); outline-offset: 2px; }` — declared once,
  removed nowhere. No `outline: none` exists in this codebase.
- `@media (prefers-reduced-motion: reduce)` — `scroll-behavior: auto`, every duration to `1ms`.
- `@media (forced-colors: active)` — restore `1px solid` borders on anything relying on a token
  background for its edge.
- `::selection` in accent.
- `.glow` — the brand glow as a `radial-gradient` background. **Not** `filter: blur()`: the source
  file draws it with `blur(90px)` on a 660 px element, which is a heavy repeated composite on
  scroll. A gradient costs nothing and looks the same at these opacities.
- `body { background: var(--ds-canvas); color: var(--ds-fg); font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased; }` — and no `text-rendering: optimizeLegibility`, which
  measurably delays first paint on long pages.

`main.css` becomes:

```css
@import "tailwindcss";
@import "./tokens.css";
@import "./base.css";
@custom-variant dark (&:where(.dark, .dark *));
```

### 2.4 `app/app.config.ts` and `content.config.ts`

`app.config.ts`: typed `profile`, `experience[]`, `skills[]`, `socials[]`, `nav[]` from Phase 0.

`content.config.ts`:

```ts
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        title: z.string().min(10).max(70),
        description: z.string().min(80).max(160),     // used verbatim as the meta description
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        tags: z.array(z.string()).min(1).max(5).default([]),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
        readingTime: z.number().optional(),
        draft: z.boolean().default(false),
      }).refine(v => !v.image || !!v.imageAlt, {
        message: 'imageAlt is required whenever image is set',
      }),
    }),
  },
})
```

The length bounds and the `refine` are deliberate: they turn a truncated meta description or a
missing `alt` into a **build failure** rather than a regression found six months later.

### 2.5 The style guide — `app/pages/design-system.vue`

Sections, in this order: colour ramps (all three, 11 steps each, with hex labels) → semantic
swatches with their role names → type scale specimen from `--text-eyebrow` to `--text-display` →
the mono eyebrow treatment → radii → the glow → focus ring. Both themes, one toggle at the top.

`definePageMeta` sets `robots: 'noindex, nofollow'`; the route rule from Phase 1 keeps it out of
the sitemap.

**▶ Review — `/design-system`, in both themes**

- [ ] The green reads the way you want it to — this is the site's entire personality
- [ ] Light mode: green and sky **text** are the darker 700 steps and are comfortably readable
- [ ] Dark mode: `#020420` background, not black; cards on `#0F172A` are distinguishable from it
- [ ] Muted text is readable but clearly secondary, in both themes
- [ ] The type scale has enough jump between `--text-lg` and `--text-display` to feel deliberate
- [ ] Display heading tracking (`-0.035em`) looks tight, not cramped
- [ ] The mono eyebrow reads as a signature, not as noise
- [ ] Radii feel consistent; the 22 px card radius from the brand source isn't too soft for you
- [ ] The glow is subtle — atmosphere, not a light show
- [ ] Focus ring is obvious on every background
- [ ] System theme setting is respected on first visit

**This is the cheapest moment in the project to change any of the above.** Say "greener", "less
round", "bigger display", "I hate the glow" — it's one line each.

**Gate:** typecheck passes; no hex literal anywhere outside `tokens.css`; an over-length post
`description` fails the build; contrast spot-checks match Appendix A in both modes.

**Commits:** `feat(ds): add colour, type and shape tokens from the brand system` ·
`feat(ds): add base layer with focus, motion and forced-colors handling` ·
`feat: add typed site config and content collection schema` ·
`docs(ds): add living style guide route`

---

## Phase 3 — Static primitives

**Goal:** the non-interactive half of the design system, every variant and state visible at once.

### 3.1 The variant helper — `app/design/variants.ts`

No `cva`, no `tailwind-variants`, no `tailwind-merge`. Components expose `variant` and `size` props
and do **not** accept colour overrides from outside, so there is nothing to merge:

```ts
type Options = Record<string, Record<string, string>>
type Choice<O extends Options> = { [K in keyof O]?: keyof O[K] }

export function variants<O extends Options>(base: string, options: O, defaults: Required<Choice<O>>) {
  return (choice: Choice<O> = {}, extra = '') =>
    [base, ...(Object.keys(options) as (keyof O)[])
      .map(k => options[k][(choice[k] ?? defaults[k]) as string]), extra]
      .filter(Boolean).join(' ')
}
```

If a component ever needs a genuine class override, that's a signal it needs another variant — not
a merge utility.

### 3.2 Components

| Component | API | Accessibility contract |
|---|---|---|
| `DsIcon` | `name` keyed into `design/icons.ts` | inline `<svg aria-hidden="true" focusable="false">` at `currentColor`; decorative by definition — meaning lives in the parent's label |
| `DsButton` | `variant: primary \| secondary \| ghost \| link`, `size: sm \| md \| lg`, `to?`, `href?`, `loading?` | renders `<button>` or `<NuxtLink>`, never a clickable div; min target 44×44; icon-only requires `aria-label` (enforced by a discriminated union type); `loading` sets `aria-busy` and never removes the label |
| `DsLink` | `to`, `external?` | external gets `rel="noopener noreferrer"`, `target="_blank"` and a visually-hidden "(opens in a new tab)"; underline with `text-underline-offset`, never colour-only |
| `DsBadge` | `variant: neutral \| accent \| echo` | non-interactive `<span>`, used inside real `<ul>/<li>` markup |
| `DsCard` | `as`, `interactive?` | when `interactive`, one stretched-link anchor covers the card (`::after` inset-0) so there is exactly one tab stop and one accessible name |
| `DsContainer` | `width: page \| prose` | max-width from tokens; padding that never lets content touch the edge |
| `DsSection` | `id`, `eyebrow`, `heading`, `level` | `<section :id>` + `aria-labelledby` pointing at its own heading; `scroll-margin-top: var(--header-h)` |
| `DsEyebrow` | `text` | the mono signature label; `aria-hidden` when it duplicates the heading |
| `DsAvatar` | `src`, `alt`, `size` | `NuxtImg` with explicit width/height; empty `alt` only when the name is adjacent |
| `DsVisuallyHidden` | — | the clip-path pattern, not `width: 0` |

Icon set (`app/design/icons.ts`): `github, linkedin, x, mail, rss, menu, close, sun, moon, monitor,
arrow-up-right, copy, check` — 24×24 path data in a plain record, roughly 1.5 KB total, no network
request and no resolver.

Each component is added to `/design-system` as it's built, showing every variant × size × state
(default / hover / focus-visible / disabled / loading).

**▶ Review — `/design-system`, both themes, mouse and keyboard**

- [ ] Primary button: ink text on green, in **both** themes — check it doesn't look wrong in light
- [ ] Secondary and ghost buttons are clearly distinguishable from primary and from each other
- [ ] Hover, focus and active states are all visibly different from rest
- [ ] Tab through every control — the focus ring is never clipped by a parent's `overflow`
- [ ] Button sizes feel right; `sm` is still comfortably tappable
- [ ] Links are underlined, not just coloured
- [ ] Badges/tags read as chips without shouting
- [ ] Card border and surface separate from the canvas without a heavy shadow
- [ ] Icons are optically aligned with adjacent text, not baseline-floating

**Gate:** axe clean on `/design-system`; keyboard walk reaches every control; no raw ramp class
outside `components/ds/`.

**Commits:** `feat(ds): add variant helper and inline icon set` ·
`feat(ds): add button, link, badge, card and layout primitives`

---

## Phase 4 — Interactive primitives

**Goal:** the behavioural components, in isolation, where their edge cases are easy to hit.

| Component | API | Accessibility contract |
|---|---|---|
| `DsDialog` | `open` v-model, `title` | native `<dialog>` + `showModal()` → focus trap, background `inert` and Escape are the browser's job, not ours; `aria-labelledby`; focus returns to the trigger natively; `::backdrop` styled; animated with `@starting-style` + `transition-behavior: allow-discrete`, skipped under reduced motion |
| `DsThemeToggle` | — | cycles system → light → dark; `aria-label` reflects the *next* state; announcement in a polite live region; fixed dimensions so there's no layout shift |
| `DsCopyButton` | `value` | `navigator.clipboard` with a silent no-op fallback; "Copied" both announced politely and shown visually |
| `DsBreadcrumb` | `items[]` | `<nav aria-label="Breadcrumb"><ol>`, last item `aria-current="page"` |
| `DsSkipLink` | `to` | first focusable element in the DOM; visible on focus, never `display: none` |

Using a native `<dialog>` is what lets us skip a focus-trap library, a scroll-lock script and all
the hand-wired `aria-modal` bookkeeping — the browser does all of it.

**▶ Review — `/design-system`, keyboard first**

- [ ] Open the dialog: focus lands inside it, Tab cycles **only** within it
- [ ] Escape closes it and focus returns to the button that opened it
- [ ] Clicking the backdrop closes it; clicking inside does not
- [ ] The page behind the dialog cannot be scrolled or clicked
- [ ] Theme toggle cycles system → light → dark with no layout jump
- [ ] Copy button gives visible confirmation and reverts
- [ ] Skip link appears on the first Tab press and is readable
- [ ] Turn on OS "reduce motion" — dialog appears instantly, nothing animates

**Gate:** axe clean; all of the above pass with the mouse untouched.

**Commit:** `feat(ds): add native dialog, theme toggle and copy button`

---

## Phase 5 — Layout shell

**Goal:** the frame around every page — header, footer, mobile drawer — with stub content inside.

- `layouts/default.vue`: `DsSkipLink` → `<header>` → `<main id="main">` → `<footer>`. The header
  is sticky and publishes its height to `--header-h` so Phase 2's scroll-padding stays true.
- `TheHeader.vue`: `<nav aria-label="Main">` with a `<ul>` on desktop; below `md` a `DsButton`
  toggle opens `TheNavDrawer` (a `DsDialog`). Nav: Home, About, Experience, Skills, Blog, Contact.
- About / Experience / Skills / Contact are **hash links on `/`** (`/#about`); Blog is a real
  route. From `/blog/*` those must resolve to `/#about`, not `#about`.
- Active state: `aria-current="page"` for routes; `useActiveSection.ts` (one `IntersectionObserver`,
  disconnected on unmount) tracks the visible section on the home page. The indicator is a 2 px
  accent underline **plus** a weight change — never colour alone.
- `TheFooter.vue`: socials with `rel="me noopener"`, an RSS link, copyright, no dead links.

**▶ Review — `/`, resize the window across `md`**

- [ ] Desktop nav sits where you'd expect; spacing and weight feel right
- [ ] Below 768 px the nav collapses to the drawer; nothing overflows
- [ ] The drawer's open/close animation feels right (or is too slow/fast — say so)
- [ ] Sticky header behaviour on scroll: does it stay, shrink, or get in the way?
- [ ] Clicking a hash link scrolls the section clear of the header, not under it
- [ ] The active-section indicator tracks scrolling accurately and isn't jumpy
- [ ] Footer feels like an ending, not an afterthought

**Gate:** keyboard-only pass — Tab reaches every nav item; drawer opens, traps, closes on Escape
and returns focus to the toggle; skip link lands focus on `<main>`; `aria-current` reflects both
route and section state.

**Commit:** `feat(layout): add header, footer and accessible mobile drawer`

---

## Phase 6 — Hero

**Goal:** the first screen, on its own, because it carries more design risk than the rest of the
site combined.

`DsAvatar` (explicit width/height, `preload`, `fetchpriority="high"`, real `alt`), name as `h1` at
`--text-display`, title, intro, two `DsButton`s: "View my work" → `#experience`, "Contact me" →
`#contact`. The paired green/sky glow sits behind it as a single gradient layer.

One reveal animation on load, `prefers-reduced-motion` aware. It must not move the LCP element:
animate `opacity` only, never `translate` on the heading — a moving headline is both a CLS risk and
a worse LCP.

**▶ Review — `/`, desktop and phone width**

- [ ] The name is the first thing you read; the eyebrow doesn't compete with it
- [ ] Display size is right at 1440 px **and** at 375 px (it's fluid, check both ends)
- [ ] The glow sits behind the type without reducing its contrast
- [ ] Green appears exactly once here — the primary button. If it appears twice, tell me
- [ ] Avatar size and treatment (ring? crop?) is what you want
- [ ] The two buttons are obviously primary vs secondary
- [ ] The reveal is quick enough not to feel like a delay
- [ ] Nothing shifts as the font loads — watch a hard reload closely
- [ ] With reduce-motion on, it simply appears

**Gate:** axe clean; renders identically with JavaScript disabled; CLS on reload is 0.

**Commit:** `feat(home): add hero section`

---

## Phase 7 — Rest of the home page

**Goal:** the complete home page. Each section is a `DsSection` with a stable `id` and one `<h2>`;
only the hero carries the `<h1>`.

1. **About** — prose from `app.config`, measure capped at `--container-prose`.
2. **Experience** — a vertical journey, not a résumé table: role, company, period, one-line
   contribution, with 01/02/03 markers. A real `<ol>` — the order *is* the information. No bullet
   dumps, no logo grid, no skill bars.
3. **Skills** — grouped `<ul>`/`<li>` of `DsBadge`. No proficiency percentages: unverifiable,
   visually noisy, and meaningless to a screen reader.
4. **Contact** — `mailto:` primary action plus social links. If you want a form later, it's a Nitro
   route; we do not add a third-party form dependency.

**▶ Review — `/`, scroll the whole page**

- [ ] Section rhythm: is the vertical spacing between sections consistent and enough?
- [ ] Eyebrow labels read as a system down the page, not as repetition
- [ ] About measure (~65 characters) is comfortable, not too narrow
- [ ] Experience reads as a story; the numbering earns its place
- [ ] Skills grouping makes sense at a glance
- [ ] Contact gives one obvious action
- [ ] Green still appears roughly once per screen — count it while scrolling
- [ ] Order of sections is the order you want them read

**Section order and the Experience treatment are the last cheap structural changes.** After
Phase 8 they're still possible, just no longer free.

**Gate:** axe clean on `/`; heading outline is h1 → h2 × 5 with no skips; full content present
with JavaScript disabled.

**Commit:** `feat(home): add about, experience, skills and contact sections`

---

## Phase 8 — Blog

**Goal:** listing, post page, and every markdown element styled in both themes.

### 8.1 Reading time

Nuxt Content has no built-in reading time. In `nuxt.config.ts`:

```ts
hooks: {
  'content:file:beforeParse'(file) {
    if (!file.id.endsWith('.md')) return
    const words = file.body.split(/\s+/).filter(Boolean).length
    file.body = file.body.replace(/^---\n/, `---\nreadingTime: ${Math.max(1, Math.ceil(words / 200))}\n`)
  },
}
```

### 8.2 Listing — `pages/blog/index.vue`

```ts
const { data: posts } = await useAsyncData('blog-list', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .select('path', 'title', 'description', 'date', 'tags', 'readingTime')
    .all(),
)
```

`select()` is a performance decision, not a style one: without it the prerendered payload for the
listing carries every post's full body. `PostCard` in a responsive grid — whole-card link, title as
`h2`, description, `<time :datetime>`, reading time, tags. The empty state is a real sentence.

### 8.3 Post — `pages/blog/[slug].vue`

```ts
const route = useRoute()
const { data: post } = await useAsyncData(`blog-${route.params.slug}`, () =>
  queryCollection('blog').path(`/blog/${route.params.slug}`).first(),
)
if (!post.value) throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
```

`DsBreadcrumb` → `<article>` header (h1, `<time>`, reading time, tags) → `<ContentRenderer>`.

### 8.4 Prose components — `app/components/content/`

`ProseH2` `ProseH3` `ProseA` `ProsePre` `ProseCode` `ProseImg` `ProseBlockquote` `ProseTable`
`ProseUl` `ProseOl`, all built from the same tokens. `ProsePre` gets the copy button, a
`tabindex="0"` scroll container and an accessible name; `ProseA` reuses `DsLink`; `ProseImg` wraps
`NuxtImg` with width/height so post images never shift; `ProseTable` scrolls inside its own
`overflow-x:auto` wrapper.

Ship one real post plus one kitchen-sink seed post exercising every markdown element — the seed
post is the render test for this phase.

Adding a post from here on = drop a `.md` in `content/blog/`. Nothing else.

**▶ Review — `/blog` and the seed post, both themes**

- [ ] Card grid: column count at each width, and whether the whole card is clickable
- [ ] Post metadata (date, reading time, tags) is legible but secondary
- [ ] Body measure and line-height are comfortable for a long read
- [ ] Heading hierarchy inside a post is obvious without reading the words
- [ ] Code blocks: theme matches the site in **both** modes; long lines scroll, not overflow
- [ ] Copy button on code blocks works and confirms
- [ ] Blockquote, table, list and image treatments all feel like the same system
- [ ] Inline code is distinguishable from surrounding text without being loud

**Gate:** the seed post renders every element correctly in light and dark; a bad slug 404s;
typecheck passes.

**Commits:** `feat(content): add prose components and reading-time hook` ·
`feat(blog): add listing and post pages`

---

## Phase 9 — Tag pages and error page

**Goal:** the last two real surfaces.

- `pages/blog/tag/[tag].vue` — prerendered from the union of all post tags (linked from every post
  and card, so `crawlLinks` finds them). Unique title and description each. This is the cheapest
  SEO win available on a small blog: it turns N posts into N + T indexable landing pages with
  genuine topical grouping.
- `app/error.vue` — a real 404 with navigation back into the site, `noindex`, and the same shell as
  every other page. Never a dead end.

**▶ Review — `/blog/tag/<something>` and any bad URL**

- [ ] A tag page looks intentional, not like a filtered leftover
- [ ] Tag chips on posts navigate to the right page
- [ ] The 404 is on-brand and offers somewhere to go
- [ ] A 404 hit from a deep URL still has a working header and footer

**Gate:** tag pages prerender and are reachable from posts; a bad slug renders `error.vue` with
the right status code.

**Commit:** `feat(blog): add tag pages and branded error page`

---

## Phase 10 — SEO and structured data

**Goal:** every route correctly described to crawlers and social cards.

- `app.vue`: `useHead` with `titleTemplate: '%s · <Name>'` and `htmlAttrs: { lang: 'en' }`.
- Every page calls `useSeoMeta({ title, description, ogTitle, ogDescription, ogType, ogImage,
  twitterCard: 'summary_large_image' })`. No page ships without a unique title and description —
  Phase 15's test asserts uniqueness across all prerendered routes.
- `usePostSeo.ts` takes a post and returns article meta + OG config, so post SEO is one call and
  cannot drift between pages.
- Canonicals come from `site.url`; verify on `/`, `/blog`, `/blog/[slug]`, `/blog/tag/[tag]`.
- OG images: `defineOgImageComponent('OgTemplate')` — one template built from the design tokens
  (ink base, one green glow, title in Cloud, name in mono green). Baked at build via `zeroRuntime`.
- Slugs: lowercase, hyphenated, no dates, no stop-word filler. The filename **is** the slug.
- Structured data via `nuxt-schema-org` — never hand-written JSON-LD:
  - `app.vue`: `defineWebSite()` + `definePerson({ name, jobTitle, url, image, sameAs })`
  - `/`: `defineWebPage({ '@type': 'ProfilePage' })` — the accurate type for a personal site, and
    the one that lets `Person` carry `knowsAbout` from the skills data
  - `/blog`: `CollectionPage` + `defineBlog()`
  - `/blog/[slug]`: `defineArticle({ '@type': 'BlogPosting', … })` + `defineBreadcrumb()`
  - `/blog/tag/[tag]`: `CollectionPage` + breadcrumb
- Rule: every schema property must correspond to something visible on the page. No invented
  ratings, no fabricated `wordCount`, no author who isn't credited on screen.

**▶ Review — view-source, plus a social debugger**

- [ ] `/`, `/blog`, a post and a tag page each have a unique `<title>` and description
- [ ] Exactly one `<link rel="canonical">` per page, pointing at the right URL
- [ ] The generated OG image looks right — open `/__og-image__/image/blog/<slug>/og.png`
- [ ] Paste a post URL into an Open Graph debugger: correct title, description, image
- [ ] Rich Results Test on all four route types: zero errors

**Gate:** all of the above, plus full content present in the SSR HTML with JavaScript disabled.

**Commits:** `feat(seo): add per-route meta, canonicals and og image template` ·
`feat(seo): add person, article and breadcrumb structured data`

---

## Phase 11 — Feeds, sitemap and robots

**Goal:** the machine-readable surface.

- `@nuxtjs/sitemap` auto-discovers prerendered routes. Confirm `/blog/*` and `/blog/tag/*` are all
  present, that `draft: true` posts are excluded from **both** the collection query and the sitemap
  source, and that `/design-system` is absent. `lastmod` from `updated ?? date`.
- `@nuxtjs/robots`: allow everything, point at `/sitemap.xml`, block only `/design-system`.
- `server/routes/rss.xml.ts` — RSS 2.0 via `queryCollection(event, 'blog')`, full `<description>`,
  `<guid isPermaLink="true">`, correct `lastBuildDate`. Linked from `<head>` with `rel="alternate"`
  and from the footer.
- `server/routes/feed.json.ts` — JSON Feed 1.1, same data.
- `server/routes/llms.txt.ts` — title, one-line summary, and a markdown list of posts with
  descriptions. Cheap, and it's becoming the conventional way for LLM crawlers to read a site
  without guessing at HTML.

**▶ Review — `npm run generate && npx serve .output/public`**

- [ ] `/sitemap.xml` lists every real route, no drafts, no `/design-system`
- [ ] `/robots.txt` points at the sitemap and blocks only the style guide
- [ ] `/rss.xml` opens in a feed reader and shows the right posts
- [ ] `/feed.json` and `/llms.txt` are well-formed
- [ ] Every URL uses the production domain, not `localhost`

**Gate:** the RSS validates; all five files are correct against the real `site.url`.

**Commit:** `feat(seo): add sitemap, robots, rss, json feed and llms.txt`

---

## Phase 12 — Accessibility pass (WCAG 2.2 AA)

**Goal:** a hardening sweep over everything built, not a new feature.

Non-negotiables:

- Semantic landmarks: one `<header>`, `<nav aria-label>`, `<main>`, `<footer>`; `<article>` per post.
- One `<h1>` per page; no skipped levels; `<section>` labelled by its own heading.
- Every interactive element has an accessible name; icon-only buttons carry `aria-label`.
- Visible focus from one `:focus-visible` rule; outlines are never removed.
- **2.2 Focus Not Obscured:** `scroll-padding-top` / `scroll-margin-top` keep the sticky header off
  any focused element. Test by tabbing through a long post.
- **2.2 Target Size:** minimum 24×24 CSS px; we hold to 44×44 for anything tappable.
- **2.2 Dragging Movements / Consistent Help / Redundant Entry:** no drag interactions, no forms —
  satisfied by construction. Record that; don't silently skip it.
- Contrast ≥ 4.5:1 body, ≥ 3:1 large text and UI boundaries, in **both** modes (Appendix A).
- Colour is never the only carrier of meaning.
- `prefers-reduced-motion` disables the hero reveal, smooth scroll and all transitions.
- `forced-colors: active` keeps every boundary visible.
- ARIA only where native HTML can't do it — which, with `<dialog>`, is nearly nowhere.

**▶ Review — you drive**

- [ ] Unplug the mouse. Reach every interactive element on every route and back out again
- [ ] Turn on a screen reader (NVDA/Firefox or VoiceOver/Safari): nav → hero → a post
- [ ] Zoom to 200 %, then reflow at 400 % — no horizontal scroll, nothing clipped
- [ ] Windows High Contrast / forced-colors: every border and button is still visible
- [ ] OS reduce-motion on: nothing animates anywhere

**Gate:** axe clean on `/`, `/blog`, `/blog/[slug]`, `/blog/tag/[tag]`, `/design-system` in **both**
themes.

**Commit:** `fix(a11y): close wcag 2.2 gaps found in the audit pass`

---

## Phase 13 — Performance pass

**Goal:** hit the budgets on the built output. These are pass/fail, not aspirations.

| Metric | Budget |
|---|---|
| Total JS, gzipped, any route | ≤ 90 KB |
| First-party JS, gzipped | ≤ 25 KB |
| CSS, gzipped | ≤ 15 KB |
| LCP (mobile, throttled) | ≤ 1.5 s |
| CLS | ≤ 0.02 |
| INP | ≤ 100 ms |
| TBT | ≤ 100 ms |
| Lighthouse Perf / A11y / Best Practices / SEO | ≥ 99 / 100 / 100 / 100 |

How we get there:

- Fully prerendered. No client-side data fetching on any route, ever.
- Payload discipline: `select()` on every list query; no full bodies in list payloads.
- `@nuxt/fonts` self-hosts, subsets to Latin, sets `font-display: swap` and generates fallback
  metric overrides (`size-adjust`) so the swap costs no layout shift. Preload only the two weights
  used above the fold.
- Images through `NuxtImg`/`NuxtPicture`: AVIF + WebP, explicit `width`/`height`, `sizes`,
  `loading="lazy"` everywhere except the hero avatar (`preload`, `fetchpriority="high"`).
- Space reserved for the avatar and every post image — a 0.02 CLS budget means zero unreserved media.
- The glow is a gradient, not a blur filter. No `backdrop-filter` anywhere.
- Client JS is exactly three things: the nav dialog, the theme toggle, the copy button.
- `prefetchOn: interaction` plus a **Speculation Rules** script for same-origin `prerender` at
  `moderate` eagerness — progressive enhancement, ignored where unsupported.
- Brotli + gzip precompression; immutable year-long cache on `/_nuxt/**`, short cache on HTML.
- `npx nuxi analyze` before release; anything unexpected in the graph gets removed, not explained.

**▶ Review — built output, not dev server**

- [ ] `npm run generate && npx serve .output/public`, then Lighthouse mobile on `/`, `/blog`, a post
- [ ] Every row of the budget table passes
- [ ] Throttle to Slow 4G and reload: does the page feel instant?
- [ ] Watch a cold load for font swap — does any text reflow?

**Gate:** the table above, on mobile and desktop, for all three route types.

**Commit:** `perf: tighten font, image and payload budgets`

---

## Phase 14 — Responsive pass

**Goal:** every route correct at every width.

Mobile-first. Breakpoints: default → `sm` 640 → `md` 768 → `lg` 1024 → `xl` 1280. Page container
72rem, prose measure 65ch. Type scales fluidly via `clamp()`, so nothing jumps between breakpoints.
Nav collapses to the drawer below `md`. No horizontal scroll at any width — including wide code
blocks and tables, which scroll inside their own container.

**▶ Review — 320 / 375 / 768 / 1440 px, both themes**

- [ ] No horizontal scrollbar at any width, on any route
- [ ] 320 px: the display heading still fits and still looks deliberate
- [ ] Grids reflow at sensible points, not just at the breakpoints
- [ ] Code blocks and tables scroll inside themselves
- [ ] Touch targets stay ≥ 44 px on phone widths
- [ ] 400 % zoom reflows to one column and stays usable

**Gate:** manual pass at all four widths in both themes, plus the 400 % reflow check.

**Commit:** `fix(responsive): correct layout at narrow and zoomed widths`

---

## Phase 15 — Automated QA and CI

**Goal:** everything reviewed by hand so far becomes a check that runs on every push.

| Check | Command | Asserts |
|---|---|---|
| Types | `nuxi typecheck` | zero errors |
| Lint | `eslint .` + `eslint-plugin-vuejs-accessibility` | a11y rules and the raw-ramp-class ban |
| Unit | `vitest` | `useFormatDate`, reading-time hook, `usePostSeo` output shape |
| Build | `nuxi generate` | no warnings; every expected route in `.output/public` |
| Metadata | node script over `.output/public/**/*.html` | every route has a title, description and one canonical; titles and descriptions unique |
| A11y | `playwright` + `@axe-core/playwright` | zero violations on 5 routes × 2 themes |
| Perf | `lhci autorun` against `.output/public` | the Phase 13 budget table |
| Links | `nuxt-link-checker` | no broken internal links |

```bash
npm i -D vitest @nuxt/test-utils happy-dom
npm i -D @playwright/test @axe-core/playwright @lhci/cli
```

The raw-ramp-class ban is an ESLint `no-restricted-syntax` rule matching
`/\b(bg|text|border|ring)-(brand|echo|slate|signal|danger)-\d{2,3}\b/` in class attributes, scoped
to everything except `app/components/ds/**`.

Manual, once per release: screen-reader pass, Rich Results Test, an OG debugger on one post, and a
JavaScript-disabled read-through.

**▶ Review**

- [ ] `npm run test` and `npm run test:a11y` pass locally
- [ ] Deliberately break something (remove an `alt`, over-long a description) — CI catches it
- [ ] CI run time is tolerable

**Gate:** all eight checks green on a clean checkout.

**Commits:** `test: add unit, axe and lighthouse ci checks` ·
`ci: run typecheck, lint, tests and budgets on every push`

---

## Phase 16 — Deploy

**Goal:** live, on the real domain, with the numbers still holding.

- Static hosting (Netlify, Cloudflare Pages, Vercel or GitHub Pages) — fully prerendered, no server
  runtime.
- Set `site.url` to the real domain **before** building; OG images, canonicals, feeds and the
  sitemap all derive from it.
- Build `npm run generate`, publish `.output/public`.
- Headers: immutable year-long cache on `/_nuxt/*`, short cache on HTML,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP
  that's realistic for a static site (`default-src 'self'` — there are no third-party origins to
  allow, because there are none).
- `README.md` documents the post frontmatter contract so it never has to be re-derived:

```yaml
---
title: Structuring ViewModel state for Compose
description: One sentence, 80–160 characters, used verbatim as the meta description.
date: 2026-08-19
updated: 2026-09-02          # optional; drives sitemap lastmod and dateModified
tags: [android, compose]
image: /img/blog/compose-state.png      # optional, 1200×630
imageAlt: Diagram of a StateFlow feeding a Composable   # required when image is set
draft: false
---
```

**▶ Review — the live URL**

- [ ] Lighthouse against production still meets Phase 13's budgets
- [ ] HTTPS works and one canonical host redirects to the other (www → apex, or the reverse)
- [ ] Social preview renders on the platform you actually post to
- [ ] Sitemap submitted to Search Console

**Gate:** all of the above.

**Commits:** `docs: document the post frontmatter contract` ·
`chore: configure production headers and deploy target`

---

## Appendix A — Brand reference

**Structure of the system:** one vivid colour, one echo, one accent, on ink.

| Role | Name | Hex | Notes |
|---|---|---|---|
| Primary | Nuxt Green | `#00DC82` | ramp step 400 |
| Primary deep | Pine | `#00A155` | ramp step 600 — hover on dark |
| Secondary | Sky | `#38BDF8` | ramp step 400 |
| Secondary deep | Deep Sky | `#0284C7` | ramp step 600 |
| Accent | Signal Amber | `#FBBF24` | emphasis only, ~2 % of the surface |
| Base | Nuxt Ink | `#020420` | never `#000` |
| Surface | Slate Deep | `#0F172A` | cards, raised panels |
| Border | Hairline | `#1E293B` | 1 px rules |
| Muted text | Mist | `#94A3B8` | captions, metadata |
| Paper | Cloud | `#F8FAFC` | headings on dark, canvas on light |

**Proportion:** ink + surface ≈ 60 %, cloud + mist type ≈ 30 %, green ≈ 8 % (one element per
screen), sky + amber ≈ 2 %.

**Measured contrast** (from the source file):

| Colour | On | Ratio | Verdict |
|---|---|---|---|
| Nuxt Green | Ink | 11.1:1 | PASS |
| Sky | Ink | 9.4:1 | PASS |
| Signal Amber | Ink | 12.1:1 | PASS |
| Mist | Ink | 7.9:1 | PASS |
| Nuxt Green | White | 1.8:1 | **FAIL** |
| Sky | White | 2.1:1 | **FAIL** |
| Green 700 | White | 5.1:1 | PASS |
| Sky 700 | White | 5.9:1 | PASS |

This is why the semantic layer splits `accent` (fills, `#00DC82` in both themes with ink text) from
`accent-text` (steps down to the 700 value in light mode).

**Guardrails.** Never green body text. Never a 50/50 green/sky split. No green→sky gradients.
Amber for emphasis only. Never pure black. Never more than three colours in one composition.

**Signature device.** Mono-set, letter-spaced, uppercase eyebrow labels above every section
heading, plus the paired green/sky glow behind the hero. One device, used consistently; nothing
else decorative. Numbered markers (01/02/03) appear only on Experience, where order is
chronological and therefore means something.

**Type.** Two families: **Inter Variable** (UI, body, and display headings at weight 800 with
`-0.035em` tracking) and **JetBrains Mono** (eyebrows, dates, reading time, code). The personality
comes from the mono eyebrow, the tight display sizing and the glow — not from a third font. A
display face can be swapped in later, but it costs a font file and must re-pass Phase 13's budget.

---

## Appendix B — File map

Built up across phases; this is the end state.

```
app/
  app.vue                          # P1
  error.vue                        # P9
  app.config.ts                    # P2
  assets/css/
    main.css tokens.css base.css   # P2
  components/
    ds/                            # P3–P4 — no app data, no fetching
      DsButton DsLink DsBadge DsCard DsIcon DsContainer DsSection DsEyebrow DsAvatar
      DsVisuallyHidden DsDialog DsThemeToggle DsCopyButton DsBreadcrumb DsSkipLink
    content/                       # P8 — MDC prose overrides
      ProseH2 ProseH3 ProseA ProsePre ProseCode ProseImg ProseBlockquote ProseTable ProseUl ProseOl
    layout/  TheHeader TheFooter TheNavDrawer        # P5
    home/    HeroSection AboutSection ExperienceSection SkillsSection ContactSection  # P6–P7
    blog/    PostCard PostMeta TagList               # P8
    seo/     OgTemplate                              # P10
  composables/
    useActiveSection.ts  useFormatDate.ts            # P5
    usePostSeo.ts  useSiteSchema.ts                  # P10
  design/  variants.ts  icons.ts                     # P3
  layouts/default.vue                                # P5
  pages/
    index.vue                      # P5 stub → P6–P7
    design-system.vue              # P2, grows through P4
    blog/index.vue blog/[slug].vue # P8
    blog/tag/[tag].vue             # P9
content/blog/*.md                  # P8
server/routes/  rss.xml.ts  feed.json.ts  llms.txt.ts   # P11
public/  img/  favicon.ico  site.webmanifest
tests/  unit/*.spec.ts  e2e/a11y.spec.ts             # P15
content.config.ts                  # P2
lighthouserc.json playwright.config.ts eslint.config.mjs  # P15
```

Structural rules:

- `pages/` composes and fetches; `components/home/*` and `components/blog/*` render props;
  `components/ds/*` know nothing about this site's content.
- `app.config.ts` holds data. No fetching in presentational components.
- Nothing in `components/ds/` imports `app.config` or `#content`.

---

## Appendix C — Commit ladder

Conventional Commits, present tense, one logical change per commit, committed only after the
phase's review is approved.

| # | Commit | Phase |
|---|---|---|
| 1 | `chore: initialize repository with nuxt/node ignore rules` | — |
| 2 | `docs: add NUXTWIND brand colour system source` | — |
| 3 | `docs: add initial implementation plan` | — |
| 4 | `docs: rework plan around a first-party design system` | — |
| 5 | `docs: restructure plan into reviewable phases` | — |
| 6 | `chore: scaffold nuxt 4 app with tailwind v4, content and seo modules` | 1 |
| 7 | `feat(ds): add colour, type and shape tokens from the brand system` | 2 |
| 8 | `feat(ds): add base layer with focus, motion and forced-colors handling` | 2 |
| 9 | `feat: add typed site config and content collection schema` | 2 |
| 10 | `docs(ds): add living style guide route` | 2 |
| 11 | `feat(ds): add variant helper and inline icon set` | 3 |
| 12 | `feat(ds): add button, link, badge, card and layout primitives` | 3 |
| 13 | `feat(ds): add native dialog, theme toggle and copy button` | 4 |
| 14 | `feat(layout): add header, footer and accessible mobile drawer` | 5 |
| 15 | `feat(home): add hero section` | 6 |
| 16 | `feat(home): add about, experience, skills and contact sections` | 7 |
| 17 | `feat(content): add prose components and reading-time hook` | 8 |
| 18 | `feat(blog): add listing and post pages` | 8 |
| 19 | `feat(blog): add tag pages and branded error page` | 9 |
| 20 | `feat(seo): add per-route meta, canonicals and og image template` | 10 |
| 21 | `feat(seo): add person, article and breadcrumb structured data` | 10 |
| 22 | `feat(seo): add sitemap, robots, rss, json feed and llms.txt` | 11 |
| 23 | `fix(a11y): close wcag 2.2 gaps found in the audit pass` | 12 |
| 24 | `perf: tighten font, image and payload budgets` | 13 |
| 25 | `fix(responsive): correct layout at narrow and zoomed widths` | 14 |
| 26 | `test: add unit, axe and lighthouse ci checks` | 15 |
| 27 | `ci: run typecheck, lint, tests and budgets on every push` | 15 |
| 28 | `docs: document the post frontmatter contract` | 16 |
| 29 | `chore: configure production headers and deploy target` | 16 |

Review feedback that arrives during a phase is folded into that phase's commits. Feedback that
arrives after a phase is approved gets its own `fix(...)` or `style(...)` commit on top — the
ladder stays readable either way.

---

Bias throughout: use the platform first, then Nuxt, then our own design system. A new dependency
needs a reason that survives being asked "can the browser already do this?" — which is how the nav
drawer became a `<dialog>` and the icon set became a record of path strings.
