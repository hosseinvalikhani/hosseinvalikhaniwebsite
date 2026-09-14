# Personal Website — Implementation Plan

Stack: **Nuxt 4 + Tailwind CSS v4 + a first-party design system + Nuxt Content v3 + Nuxt SEO**,
prerendered as a static site. **No Nuxt UI, no component library.**

This document is the build spec. Work through the phases in order. Each phase ends with a
**Gate** — do not start the next phase until the gate passes. Each phase also names the commits it
should produce (the full ladder is in §18).

Colour, ramps, ratios and contrast results come from `nuxt-tailwind-color-system-source.html` in
this repo. That file is the source of truth; tokens are transcribed from it, never invented.

---

## What changed in this revision

| Area | Before | Now |
|---|---|---|
| UI layer | `@nuxt/ui` v4 | Own design system: token layer + ~15 primitives, zero component deps |
| Icons | `@nuxt/icon` runtime | Compile-time inline SVG set (no runtime resolver, no network) |
| Prose | Nuxt UI prose components | Own `Prose*` components wired into MDC |
| Overlay | `USlideover` / Reka UI | Native `<dialog>.showModal()` — free focus trap, inert, Escape |
| Colour | "pick a palette" | NUXTWIND tokens, dark-first, with light-mode contrast remapping |
| Perf target | Lighthouse ≥ 95 | Hard budgets: ≤ 90 KB JS gz, LCP ≤ 1.5 s, CLS ≤ 0.02, INP ≤ 100 ms |
| SEO surface | home + blog | + tag pages, RSS/JSON feed, `llms.txt`, ProfilePage schema, real 404 |
| A11y target | WCAG 2.1 AA, manual axe | WCAG 2.2 AA, axe in CI, forced-colors + `prefers-contrast` support |
| QA | manual checklist | typecheck + lint (a11y rules) + vitest + Playwright/axe + Lighthouse CI |

Dropping Nuxt UI removes `@nuxt/ui`, `reka-ui`, `tailwind-variants`, `tailwind-merge` and
`@iconify/vue` from the graph — roughly 120–160 KB of JavaScript we never ship, on a site whose
entire interactive surface is a nav drawer, a theme toggle and a copy button. The cost is that we
own ~15 components; every one of them is specified in §5.

---

## 0. Inputs required before coding

Fill these in `app/app.config.ts` (see §4.4). Do not hardcode them into components.

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
| Profile photo | square, ≥ 800 px; `public/img/avatar-placeholder.svg` until supplied |
| Locale | default `en`; set `lang` once in `app.vue` |

---

## 1. Brand foundation

Transcribed from the colour system source. Read this before writing any CSS.

**The structure of the system:** one vivid colour, one echo, one accent, on ink.

| Role | Name | Hex | Notes |
|---|---|---|---|
| Primary | Nuxt Green | `#00DC82` | ramp step 400 |
| Primary deep | Pine | `#00A155` | ramp step 600 — hover on dark |
| Secondary | Sky | `#38BDF8` | ramp step 400 |
| Secondary deep | Deep Sky | `#0284C7` | ramp step 600 |
| Accent | Signal Amber | `#FBBF24` | emphasis only, ~2% of the surface |
| Base | Nuxt Ink | `#020420` | never `#000` |
| Surface | Slate Deep | `#0F172A` | cards, raised panels |
| Border | Hairline | `#1E293B` | 1 px rules |
| Muted text | Mist | `#94A3B8` | captions, metadata |
| Paper | Cloud | `#F8FAFC` | headings on dark, canvas on light |

**Proportion — enforce it; this is what stops a palette looking amateur:**
ink + surface ≈ 60 %, cloud + mist type ≈ 30 %, green ≈ 8 % (one element per screen),
sky + amber ≈ 2 %.

**The legibility rule (non-negotiable).** Both brand colours are bright: excellent on ink,
failing on white. Measured in the source: green on ink 11.1:1 **PASS**, sky on ink 9.4:1 **PASS**,
amber on ink 12.1:1 **PASS**, mist on ink 7.9:1 **PASS**, green on white 1.8:1 **FAIL**,
sky on white 2.1:1 **FAIL**, green-700 on white 5.1:1 **PASS**, sky-700 on white 5.9:1 **PASS**.

Therefore the semantic layer (§4.2) **must** remap accent *text* to the 700 step in light mode.
Solid accent *fills* keep `#00DC82` in both modes with **ink text on green** (11.1:1), which also
keeps the brand colour identical across themes. Two tokens, not one: `accent` (fills) and
`accent-text` (type and icons on the canvas).

**Guardrails.** Never green body text. Never a 50/50 green/sky split. No green→sky gradients.
Amber for emphasis only. Never pure black — `#020420`. Never more than three colours in one
composition.

**Signature device.** Mono-set, letter-spaced, uppercase **eyebrow labels** above every section
heading — lifted straight from the brand source — plus the paired green/sky **glow** behind the
hero. One device, used consistently; nothing else decorative. Numbered markers (01/02/03) appear
only on Experience, where the order is chronological and therefore means something.

> Performance note: the source renders glows as blurred divs (`filter: blur(90px)` on a 660 px
> element). Do **not** copy that — a blur that size is a heavy, repeated composite on scroll.
> Reproduce it as a static `radial-gradient` background on one `::before`, which costs nothing.

**Type.** Two families only: **Inter Variable** (UI, body, and display headings at weight 800 with
`-0.035em` tracking) and **JetBrains Mono** (eyebrows, dates, reading time, code). The personality
comes from the mono eyebrow, the tight display sizing and the glow — not from a third font. A
display face can be swapped in later, but it costs a font file and must re-pass §13's budget.

**Gate:** none — this phase is reading. It produces no commit.

---

## 2. Project setup and dependencies

```bash
npx nuxi@latest init personal-site      # Nuxt 4.x
cd personal-site
npm i -D tailwindcss @tailwindcss/vite  # Tailwind v4, CSS-first, through the Vite plugin
npx nuxi module add content             # @nuxt/content v3 (brings MDC + Shiki)
npx nuxi module add image               # @nuxt/image
npx nuxi module add fonts               # @nuxt/fonts — self-hosting + fallback metrics
npx nuxi module add color-mode          # @nuxtjs/color-mode — FOUC-free inline script
npx nuxi module add eslint              # @nuxt/eslint
npm i -D @nuxtjs/seo                    # sitemap + robots + schema-org + og-image + link-checker
npm i -D eslint-plugin-vuejs-accessibility
npm i -D vitest @nuxt/test-utils happy-dom
npm i -D @playwright/test @axe-core/playwright
npm i -D @lhci/cli
```

Pinned expectations: `nuxt` ^4.5, `@nuxt/content` ^3, `tailwindcss` ^4.

Do **not** add: a Tailwind config JS file (v4 is CSS-first), a UI or component library, a variant
library (`tailwind-variants` / `cva` — §5.1 ships a 15-line equivalent), a class-merge utility, an
icon runtime, a date library (use `Intl.DateTimeFormat`), or an animation library.

`nuxt.config.ts`:

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

  colorMode: { classSuffix: '', preference: 'dark', fallback: 'dark', storageKey: 'ds-theme' },

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

Why these settings specifically:

- `prefetchOn.interaction` only — visibility prefetch pulls every in-view route chunk over mobile
  data for no measurable benefit on a site this small.
- `failOnError: true` — a broken prerender must break the build, not ship half a site.
- `classSuffix: ''` puts `.dark` / `.light` on `<html>`, which is what §4.2's tokens target.
- `ogImage.zeroRuntime` — OG images are baked at build; no Satori runtime reaches the client.
- Fonts are self-hosted by `@nuxt/fonts`, so there are no third-party origins and no `preconnect`.

**Gate:** `npm run dev` serves a blank page with zero console warnings; `npx nuxi typecheck`
passes; `npm run build` emits no Tailwind or Vite warnings.

---

## 3. Folder structure

```
app/
  app.vue
  error.vue                        # 404 / 500 — same shell, never a dead end
  app.config.ts                    # all personal data
  assets/css/
    main.css                       # entry: tailwind + layers
    tokens.css                     # @theme primitives + semantic vars
    base.css                       # reset, focus, motion, forced-colors
  components/
    ds/                            # the design system — no app data, no fetching
      DsButton.vue   DsLink.vue      DsBadge.vue      DsCard.vue
      DsIcon.vue     DsContainer.vue DsSection.vue    DsEyebrow.vue
      DsAvatar.vue   DsDialog.vue    DsThemeToggle.vue
      DsBreadcrumb.vue DsCopyButton.vue DsSkipLink.vue DsVisuallyHidden.vue
    content/                       # MDC prose overrides
      ProseH2.vue ProseH3.vue ProseA.vue ProsePre.vue ProseCode.vue
      ProseImg.vue ProseBlockquote.vue ProseTable.vue ProseUl.vue ProseOl.vue
    layout/  TheHeader.vue TheFooter.vue TheNavDrawer.vue
    home/    HeroSection.vue AboutSection.vue ExperienceSection.vue
             SkillsSection.vue ContactSection.vue
    blog/    PostCard.vue PostMeta.vue TagList.vue
    seo/     OgTemplate.vue
  composables/
    useSiteSchema.ts  usePostSeo.ts  useActiveSection.ts  useFormatDate.ts
  design/
    variants.ts                    # the 15-line variant helper (§5.1)
    icons.ts                       # icon path data
  layouts/default.vue
  pages/
    index.vue
    design-system.vue              # living style guide — noindex, not in the sitemap
    blog/index.vue
    blog/[slug].vue
    blog/tag/[tag].vue
content/blog/*.md
server/routes/  rss.xml.ts  feed.json.ts  llms.txt.ts
public/  img/  favicon.ico  site.webmanifest
tests/  unit/*.spec.ts  e2e/a11y.spec.ts
content.config.ts  lighthouserc.json  playwright.config.ts  eslint.config.mjs
```

Rules:

- `pages/` composes and fetches; `components/home/*` and `components/blog/*` render props;
  `components/ds/*` know nothing about this site's content.
- `app.config.ts` holds data. No fetching in presentational components.
- Nothing in `components/ds/` imports `app.config` or `#content`.

**Gate:** the structure exists, every file is empty-but-valid, the dev server is still clean.

---

## 4. Token layer

Three tiers in this order: **primitives** (raw ramps) → **semantic** (roles, theme-switched) →
**component** (per-component vars, only where a component genuinely varies).

### 4.1 Primitives — `app/assets/css/tokens.css`

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

### 4.2 Semantic layer — roles, theme-switched

`@theme inline` makes the generated utility reference the variable itself, so `bg-canvas`
re-resolves the moment `.dark` flips. This is the only correct v4 pattern for themed tokens; a
plain `@theme` block would freeze the light values into the compiled CSS.

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
`components/ds/` is a bug. Add an ESLint `no-restricted-syntax` rule matching
`/\b(bg|text|border|ring)-(brand|echo|slate|signal|danger)-\d{2,3}\b/` in class attributes, scoped
to everything but `app/components/ds/**`.

### 4.3 Base layer — `app/assets/css/base.css`

- `html { scroll-behavior: smooth; scroll-padding-top: var(--header-h); }` — the scroll-padding is
  what keeps a hash-linked heading out from under the sticky header (WCAG 2.2 *Focus Not Obscured*).
- `:focus-visible { outline: 2px solid var(--ds-focus); outline-offset: 2px; }` — declared once,
  removed nowhere. No `outline: none` exists in this codebase.
- `@media (prefers-reduced-motion: reduce)` — `scroll-behavior: auto`, every duration to `1ms`,
  hero reveal off, view transitions off.
- `@media (forced-colors: active)` — restore `1px solid` borders on anything that relies on a token
  background for its edge (buttons, cards, badges); never `forced-color-adjust: none` except on the
  brand chip in the style guide.
- `::selection` in accent.
- `.glow` utility — the `radial-gradient` implementation of the brand glow (no `filter: blur`).
- `body { background: var(--ds-canvas); color: var(--ds-fg); font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased; }` — and no `text-rendering: optimizeLegibility`, which
  measurably delays first paint on long pages.

`main.css` is only:

```css
@import "tailwindcss";
@import "./tokens.css";
@import "./base.css";
@custom-variant dark (&:where(.dark, .dark *));
```

### 4.4 `app/app.config.ts`

Single source of truth: `profile` (name, title, intro, about, photo, location), `experience[]`,
`skills[]`, `socials[]`, `nav[]`. Typed with an exported interface so `useAppConfig()`
autocompletes. Every home section reads from here.

### 4.5 `content.config.ts`

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
missing `alt` into a **build failure** rather than an SEO/a11y regression found six months later.

**Gate:** typecheck passes; `queryCollection('blog')` autocompletes; toggling the theme changes
every colour with no hex literal anywhere outside `tokens.css`; an over-length `description` fails
the build; contrast spot-checks match §1's table in both modes.

---

## 5. The design system

### 5.1 The variant helper — `app/design/variants.ts`

No `cva`, no `tailwind-variants`, no `tailwind-merge`. Components expose `variant` and `size`
props and do **not** accept colour overrides from outside, so there is nothing to merge:

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

Typed, tree-shaken, and zero runtime dependency. If a component ever needs a genuine class
override, that is a signal the component needs another variant — not a merge utility.

### 5.2 The roster

| Component | API | Accessibility contract |
|---|---|---|
| `DsButton` | `variant: primary \| secondary \| ghost \| link`, `size: sm \| md \| lg`, `to?`, `href?`, `loading?` | renders `<button>` or `<NuxtLink>`, never a clickable div; min target 44×44; icon-only requires `aria-label` (enforced by a discriminated union type); `loading` sets `aria-busy`, never removes the label |
| `DsLink` | `to`, `external?` | external gets `rel="noopener noreferrer"`, `target="_blank"` and a visually-hidden "(opens in a new tab)"; underline with `text-underline-offset`, never colour-only |
| `DsIcon` | `name` keyed into `design/icons.ts` | inline `<svg aria-hidden="true" focusable="false">` at `currentColor`; decorative by definition — meaning lives in the parent's label |
| `DsBadge` | `variant: neutral \| accent \| echo` | non-interactive `<span>`; used inside real `<ul>/<li>` markup |
| `DsCard` | `as`, `interactive?` | when `interactive`, one stretched-link anchor covers the card (`::after` inset-0) so there is exactly one tab stop and one accessible name |
| `DsSection` | `id`, `eyebrow`, `heading`, `level` | `<section :id>` + `aria-labelledby` pointing at its own heading; `scroll-margin-top: var(--header-h)` |
| `DsEyebrow` | `text` | the mono signature label; `aria-hidden` when it duplicates the heading |
| `DsContainer` | `width: page \| prose` | max-width from tokens; horizontal padding that never lets content touch the edge |
| `DsAvatar` | `src`, `alt`, `size` | `NuxtImg` with explicit width/height; empty `alt` only when the name is adjacent |
| `DsDialog` | `open` v-model, `title` | native `<dialog>` + `showModal()` → focus trap, background `inert` and Escape are the browser's job, not ours; `aria-labelledby`; focus returns to the trigger natively; `::backdrop` styled; animated with `@starting-style` + `transition-behavior: allow-discrete`, skipped under reduced motion |
| `DsThemeToggle` | — | cycles system → light → dark; `aria-label` reflects the *next* state; the announcement goes to a polite live region; fixed dimensions so no layout shift |
| `DsCopyButton` | `value` | `navigator.clipboard` with a silent no-op fallback; "Copied" announced in a polite live region and shown visually |
| `DsBreadcrumb` | `items[]` | `<nav aria-label="Breadcrumb"><ol>`, last item `aria-current="page"` |
| `DsSkipLink` | `to` | first focusable element in the DOM; visible on focus, never `display: none` |
| `DsVisuallyHidden` | — | the clip-path pattern, not `width: 0` |

Icon set (`design/icons.ts`): `github, linkedin, x, mail, rss, menu, close, sun, moon, monitor,
arrow-up-right, copy, check` — 24×24 path data as a plain record, roughly 1.5 KB total, no
network request and no resolver.

Prose components (`components/content/`) restyle MDC output with the same tokens:
`ProsePre` gets the copy button, a `tabindex="0"` scroll container and an accessible name;
`ProseA` reuses `DsLink`; `ProseImg` wraps `NuxtImg` with width/height so post images never shift;
`ProseTable` scrolls inside its own `overflow-x:auto` wrapper.

### 5.3 Living style guide — `pages/design-system.vue`

Every token swatch, every component, every state (default / hover / focus-visible / disabled /
loading), both themes, on one page. It is the review surface for each gate and the fastest way to
catch a token that only works in dark mode. `definePageMeta` sets `robots: 'noindex, nofollow'`;
the route rule in §2 keeps it out of the sitemap and `robots.txt`.

**Gate:** the style guide renders every component in every state in both themes; axe is clean on
`/design-system`; a keyboard walk reaches and escapes every control; no raw ramp class exists
outside `components/ds/`.

---

## 6. Layout and navigation

- `layouts/default.vue`: `DsSkipLink` → `<header>` → `<main id="main">` → `<footer>`.
  The header is sticky and publishes its height to `--header-h` so §4.3's scroll-padding stays true.
- `TheHeader.vue`: a plain `<nav aria-label="Main">` with a `<ul>` on desktop; below `md` a
  `DsButton` toggle opens `TheNavDrawer` (a `DsDialog`). Nav: Home, About, Experience, Skills,
  Blog, Contact.
- About / Experience / Skills / Contact are **hash links on `/`** (`/#about`). Blog is a real
  route. From `/blog/*` the hash links must resolve to `/#about`, not `#about`.
- Active state: `aria-current="page"` for routes; `useActiveSection.ts` (one
  `IntersectionObserver`, disconnected on unmount) sets the active section on the home page and
  mirrors it with `aria-current="true"`. The indicator is a 2 px accent underline **plus** a weight
  change — never colour alone.
- The drawer is a native modal dialog: no focus-trap library, no scroll-lock script (the browser
  makes the page inert), no `aria-modal` hand-wiring.
- Footer: socials with `rel="me noopener"`, an RSS link, copyright, no dead links.

**Gate:** keyboard-only pass — Tab reaches every nav item, the drawer opens, traps, closes on
Escape and returns focus to the toggle, the skip link works and lands focus on `<main>`,
`aria-current` reflects both route and section state.

---

## 7. Home page sections

`pages/index.vue` renders the sections in order; each is a `DsSection` with a stable `id` and a
single `<h2>`. Only the hero carries the `<h1>`.

1. **Hero** — `DsAvatar` (explicit width/height, `preload`, `fetchpriority="high"`, real `alt`),
   name as `h1` at `--text-display`, title, intro, two `DsButton`s: "View my work" → `#experience`,
   "Contact me" → `#contact`. The paired green/sky glow sits behind it as a single gradient layer.
   One reveal animation on load, `prefers-reduced-motion` aware, and it must not move the LCP
   element (animate `opacity` only, never `translate` on the heading).
2. **About** — prose from `app.config`, measure capped at `--container-prose`.
3. **Experience** — a vertical journey, not a résumé table: role, company, period, one-line
   contribution, with the 01/02/03 markers. Real `<ol>` — the order is the information. No bullet
   dumps, no logo grid, no skill bars.
4. **Skills** — grouped `<ul>`/`<li>` of `DsBadge`. No proficiency percentages: unverifiable,
   visually noisy, and meaningless to a screen reader.
5. **Contact** — `mailto:` primary action plus social links. If a form is wanted later, add a Nitro
   route; do **not** add a third-party form dependency now.

**Gate:** axe clean on `/`; heading outline is h1 → h2 × 5 with no skips; the hero renders
identically with JavaScript disabled; CLS on reload is 0.

---

## 8. Content and blog architecture

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
listing carries every post's full body. Render `PostCard` in a responsive grid — whole-card link,
title as `h2`, description, `<time :datetime>`, reading time, tags. The empty state is a real
sentence.

### 8.3 Post — `pages/blog/[slug].vue`

```ts
const route = useRoute()
const { data: post } = await useAsyncData(`blog-${route.params.slug}`, () =>
  queryCollection('blog').path(`/blog/${route.params.slug}`).first(),
)
if (!post.value) throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
```

`DsBreadcrumb` → `<article>` header (h1, `<time>`, reading time, tags) → `<ContentRenderer>`.
Code blocks use dual-theme Shiki, a copy button and a focusable scroll container. Add one seed post
exercising every markdown element — it doubles as the render test for §5's prose components.

### 8.4 Tag pages — `pages/blog/tag/[tag].vue`

Prerendered from the union of all post tags (linked from every post and card, so `crawlLinks`
finds them). Each has a unique title and description, a `CollectionPage` schema, and is a real
indexable surface. This is the cheapest SEO win available on a small blog: it turns N posts into
N + T internal landing pages with genuine topical grouping.

Adding a post = drop a `.md` in `content/blog/`. Nothing else.

**Gate:** the seed post renders every element correctly in light and dark; a bad slug 404s through
`error.vue`; tag pages prerender and are reachable from posts; typecheck passes.

---

## 9. SEO architecture

- `app.vue`: `useHead` with `titleTemplate: '%s · <Name>'` and `htmlAttrs: { lang: 'en' }`.
- Every page calls `useSeoMeta({ title, description, ogTitle, ogDescription, ogType, ogImage,
  twitterCard: 'summary_large_image' })`. No page ships without a unique title and description —
  §16's test asserts uniqueness across all prerendered routes.
- `usePostSeo.ts` takes a post and returns article meta + OG config, so post SEO is one call and
  cannot drift between pages.
- Canonicals come from `site.url` via `nuxt-seo-utils`; verify on `/`, `/blog`, `/blog/[slug]`,
  `/blog/tag/[tag]`.
- OG images: `defineOgImageComponent('OgTemplate')` — one template built from the design tokens
  (ink base, one green glow, title in Cloud, name in mono green). Baked at build with
  `zeroRuntime`, so nothing ships to the client.
- Slugs: lowercase, hyphenated, no dates, no stop-word filler. The filename **is** the slug.
- `/blog/tag/[tag]` pages get `description` generated from the tag and post count — never an empty
  or duplicated description.
- No duplicate content: hash sections must never also exist as standalone routes.
- `error.vue` returns a real 404 page with navigation back into the site and `noindex`.

**Gate:** view-source every route type — unique title, unique description, exactly one canonical,
complete OG + Twitter tags, and full content present in the SSR HTML with JavaScript disabled.

---

## 10. Structured data

Use `nuxt-schema-org` (bundled with `@nuxtjs/seo`) — it handles escaping, `@id` linking and graph
merging. Never hand-write `<script type="application/ld+json">`.

- `app.vue`: `useSchemaOrg([defineWebSite(), definePerson({ name, jobTitle, url, image, sameAs })])`
- `pages/index.vue`: `defineWebPage({ '@type': 'ProfilePage' })` — the accurate type for a personal
  site, and the one that lets `Person` carry `knowsAbout` from the skills data.
- `pages/blog/index.vue`: `defineWebPage({ '@type': 'CollectionPage' })` + `defineBlog()`
- `pages/blog/[slug].vue`: `defineArticle({ '@type': 'BlogPosting', headline, description,
  datePublished, dateModified, image, keywords })` + `defineBreadcrumb([Home, Blog, <title>])`
- `pages/blog/tag/[tag].vue`: `defineWebPage({ '@type': 'CollectionPage' })` + breadcrumb.
- Rule: every property must correspond to something visible on the page. No invented ratings, no
  fabricated `wordCount`, no `author` that is not credited on screen.

**Gate:** each route type passes the Rich Results Test and the Schema Markup Validator with zero
errors and zero warnings that matter.

---

## 11. Sitemap, robots and feeds

- `@nuxtjs/sitemap` auto-discovers prerendered routes. Confirm `/blog/*` and `/blog/tag/*` are all
  present, that `draft: true` posts are excluded from **both** the collection query and the sitemap
  source, and that `/design-system` is absent.
- `lastmod` from `updated ?? date`.
- `@nuxtjs/robots`: allow everything, point at `/sitemap.xml`, block nothing but `/design-system`.
- `server/routes/rss.xml.ts` — RSS 2.0 built with `queryCollection(event, 'blog')`, full
  `<description>`, `<guid isPermaLink="true">`, correct `lastBuildDate`. Linked from `<head>` with
  `rel="alternate"` and from the footer.
- `server/routes/feed.json.ts` — JSON Feed 1.1, same data.
- `server/routes/llms.txt.ts` — the site's title, one-line summary, and a markdown list of posts
  with descriptions. Cheap to generate, and it is becoming the conventional way for LLM crawlers
  to read a site without guessing at HTML.

**Gate:** `npm run generate && npx serve .output/public` — `/sitemap.xml`, `/robots.txt`,
`/rss.xml`, `/feed.json` and `/llms.txt` are all correct and reference the production domain;
the RSS validates.

---

## 12. Accessibility — WCAG 2.2 AA

Non-negotiables, checked at every gate:

- Semantic landmarks: one `<header>`, `<nav aria-label>`, `<main>`, `<footer>`; `<article>` per post.
- One `<h1>` per page; no skipped levels; `<section>` labelled by its own heading.
- Every interactive element has an accessible name. Icon-only buttons carry `aria-label`.
- Visible focus everywhere from one `:focus-visible` rule; outlines are never removed.
- **2.2 — Focus Not Obscured:** `scroll-padding-top`/`scroll-margin-top` must keep the sticky
  header off any focused element. Test by tabbing through a long post.
- **2.2 — Target Size:** minimum 24×24 CSS px; we hold ourselves to 44×44 for anything tappable.
- **2.2 — Dragging Movements / Consistent Help / Redundant Entry:** no drag interactions, no forms
  — satisfied by construction. Record that, do not silently skip it.
- Contrast ≥ 4.5:1 body, ≥ 3:1 large text and UI boundaries, in **both** modes — §1's table is the
  reference, and §4.2's light-mode remapping is what makes it pass.
- Colour is never the only carrier of meaning (nav active state, link underlines, tag chips).
- Meaningful `alt` on content images; `alt=""` on decorative ones; `imageAlt` enforced by Zod.
- `prefers-reduced-motion: reduce` disables the hero reveal, smooth scroll and all transitions.
- `forced-colors: active` keeps every boundary visible.
- ARIA only where native HTML cannot do it — which, with `<dialog>`, is almost nowhere.

**Gate:** axe (automated, §16) clean on `/`, `/blog`, `/blog/[slug]`, `/blog/tag/[tag]`,
`/design-system` in **both** themes; one full screen-reader pass (NVDA/Firefox or VoiceOver/Safari)
through nav → hero → a post; a 200 % zoom and a 400 % reflow pass with no horizontal scroll.

---

## 13. Performance

Budgets — these are pass/fail in CI, not aspirations:

| Metric | Budget |
|---|---|
| Total JS, gzipped, any route | ≤ 90 KB |
| First-party JS, gzipped | ≤ 25 KB |
| CSS, gzipped | ≤ 15 KB |
| LCP (mobile, throttled) | ≤ 1.5 s |
| CLS | ≤ 0.02 |
| INP | ≤ 100 ms |
| TBT | ≤ 100 ms |
| Lighthouse Performance / A11y / Best Practices / SEO | ≥ 99 / 100 / 100 / 100 |

How we get there:

- Fully prerendered (`nuxi generate`). No client-side data fetching on any route, ever.
- Payload discipline: `select()` on every list query (§8.2); no full bodies in list payloads.
- `@nuxt/fonts` self-hosts, subsets to Latin, sets `font-display: swap` and generates fallback
  metric overrides (`size-adjust`) so the swap costs no layout shift. Preload only the two weights
  actually used above the fold.
- Images through `NuxtImg`/`NuxtPicture`: AVIF + WebP, explicit `width`/`height`, `sizes`,
  `loading="lazy"` everywhere except the hero avatar (`preload`, `fetchpriority="high"`).
- Reserve space for the avatar and every post image — CLS target is 0.02, which means zero
  unreserved media.
- The glow is a gradient, not a blur filter (§1). No `backdrop-filter` anywhere.
- Client JS is exactly three things: the nav dialog, the theme toggle and the copy button. Nothing
  else hydrates behaviour. No chart, animation, carousel or icon-runtime library.
- `prefetchOn: interaction` (§2) plus a **Speculation Rules** script for same-origin
  `prerender` on `moderate` eagerness — progressive enhancement, ignored by browsers that lack it.
- Brotli + gzip precompression of every public asset (`compressPublicAssets`).
- Immutable, year-long cache headers on `/_nuxt/**`; short cache on HTML.
- `npx nuxi analyze` before every release; anything unexpected in the graph gets removed, not
  explained away.

**Gate:** Lighthouse CI on the built output meets every row of the table above, on mobile and
desktop, for `/`, `/blog` and a post.

---

## 14. Responsive design

Mobile-first. Breakpoints: default → `sm` 640 → `md` 768 → `lg` 1024 → `xl` 1280. Page container
`--container-page` (72rem), prose measure `--container-prose` (65ch). Type scales fluidly via
`clamp()` (§4.1), so between breakpoints nothing jumps. Test 320, 375, 768 and 1440 px, plus 400 %
zoom for reflow. Nav collapses to the drawer below `md`. No horizontal scroll at any width —
including wide code blocks and tables, which scroll inside their own container.

**Gate:** manual pass at all four widths in both themes, plus the 400 % reflow check.

---

## 15. Content contract

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

Zod rejects anything malformed at build time — that is the point. Ship one real post plus one
kitchen-sink seed post. Document this contract in `README.md` so it never has to be re-derived.

---

## 16. Automated QA

Everything here runs in CI on every push; nothing on this list is a "remember to check".

| Check | Command | Asserts |
|---|---|---|
| Types | `nuxi typecheck` | zero errors |
| Lint | `eslint .` with `eslint-plugin-vuejs-accessibility` | a11y rules + the ramp-class ban (§4.2) |
| Unit | `vitest` | `useFormatDate`, reading-time hook, `usePostSeo` output shape |
| Build | `nuxi generate` | no warnings; every expected route exists in `.output/public` |
| Metadata | node script over `.output/public/**/*.html` | every route has a title, a description, one canonical; titles and descriptions are unique |
| A11y | `playwright` + `@axe-core/playwright` | zero violations on 5 routes × 2 themes |
| Perf | `lhci autorun` against `.output/public` | the §13 budget table |
| Links | `nuxt-link-checker` | no broken internal links |

Manual, once per release: screen-reader pass, Rich Results Test, an Open Graph debugger on one
post URL, and a JavaScript-disabled read-through.

`lighthouserc.json` encodes the budgets as assertions so a regression fails the build rather than
being noticed later.

---

## 17. Production build and deployment

- Target static hosting (Netlify, Cloudflare Pages, Vercel or GitHub Pages) — the site is fully
  prerendered, so there is no server runtime.
- Set `site.url` to the real domain **before** building; OG images, canonicals, feeds and the
  sitemap all derive from it.
- Build `npm run generate`, publish `.output/public`.
- Headers: immutable year-long cache on `/_nuxt/*`, short cache on HTML, `X-Content-Type-Options`,
  `Referrer-Policy: strict-origin-when-cross-origin`, and a CSP that is realistic for a static site
  (`default-src 'self'`, no third-party origins to allow, because there are none).
- Post-deploy: re-run Lighthouse against the live URL, submit the sitemap to Search Console,
  confirm HTTPS plus a single canonical host (www → apex or the reverse — pick one).

---

## 18. Git workflow and commit ladder

Conventional Commits, present tense, one logical change per commit. The subject says what changed;
the body says why, when why is not obvious. Feature work happens on a branch off `main`.

| # | Commit | Phase |
|---|---|---|
| 1 | `chore: initialize repository with nuxt/node ignore rules` | — |
| 2 | `docs: add NUXTWIND brand colour system source` | §1 |
| 3 | `docs: add initial implementation plan` | — |
| 4 | `docs: rework plan around a first-party design system` | §1–18 |
| 5 | `chore: scaffold nuxt 4 app with tailwind v4, content and seo modules` | §2 |
| 6 | `chore: lay out app, design-system and content directories` | §3 |
| 7 | `feat(ds): add colour, type and shape tokens from the brand system` | §4.1–4.2 |
| 8 | `feat(ds): add base layer with focus, motion and forced-colors handling` | §4.3 |
| 9 | `feat: add typed site config and content collection schema` | §4.4–4.5 |
| 10 | `feat(ds): add variant helper and inline icon set` | §5.1 |
| 11 | `feat(ds): add button, link, badge, card and layout primitives` | §5.2 |
| 12 | `feat(ds): add native dialog, theme toggle and copy button` | §5.2 |
| 13 | `docs(ds): add living style guide route` | §5.3 |
| 14 | `feat(layout): add header, footer and accessible mobile drawer` | §6 |
| 15 | `feat(home): add hero, about, experience, skills and contact sections` | §7 |
| 16 | `feat(content): add prose components and reading-time hook` | §8.1 |
| 17 | `feat(blog): add listing, post and tag pages` | §8.2–8.4 |
| 18 | `feat(seo): add per-route meta, canonicals and og image template` | §9 |
| 19 | `feat(seo): add person, article and breadcrumb structured data` | §10 |
| 20 | `feat(seo): add sitemap, robots, rss, json feed and llms.txt` | §11 |
| 21 | `fix(a11y): close wcag 2.2 gaps found in the audit pass` | §12 |
| 22 | `perf: tighten font, image and payload budgets` | §13 |
| 23 | `test: add unit, axe and lighthouse ci checks` | §16 |
| 24 | `ci: run typecheck, lint, tests and budgets on every push` | §16 |
| 25 | `docs: document the post frontmatter contract` | §15 |
| 26 | `chore: configure production headers and deploy target` | §17 |

---

## Execution order summary

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11, then 12–14 as a hardening pass over everything built,
then 15 → 16 → 17. Do not defer SEO, structured data, accessibility or performance to the end —
phases 9, 10, 12 and 13 are written into each earlier gate on purpose.

Bias throughout: use the platform first, then Nuxt, then our own design system. A new dependency
needs a reason that survives being asked "can the browser already do this?" — which is how the nav
drawer became a `<dialog>` and the icon set became a record of path strings.
