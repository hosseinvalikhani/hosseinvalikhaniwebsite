# Personal Website — Implementation Plan

Stack: **Nuxt 4 + Nuxt UI 4 (Tailwind v4) + Nuxt Content v3 + Nuxt SEO**, prerendered as a static site.

This document is the build spec. Work through the phases in order. Each phase ends with a
**Gate** — do not start the next phase until the gate passes.

---

## 0. Inputs required before coding

Fill these in `app/app.config.ts` (see Phase 3). Do not hardcode them into components.

| Input | Notes |
|---|---|
| Full name | used in `<title>`, `Person` schema |
| Professional title | e.g. "Senior Android Engineer" |
| Short intro (1–2 sentences) | hero subheading |
| About copy (~120 words) | About section |
| Experience entries | company, role, period, 1–2 line contribution |
| Skill groups | 3–5 groups, ~5 items each |
| Social links | GitHub, LinkedIn, X, email |
| Canonical site URL | required for sitemap, OG, canonicals |
| Profile photo | placeholder `public/img/avatar-placeholder.svg` until supplied |

---

## 1. Project setup and dependencies

```bash
npx nuxi@latest init personal-site   # Nuxt 4.x
cd personal-site
npx nuxi module add ui                # @nuxt/ui v4 — pulls in Tailwind v4, @nuxt/icon,
                                      # @nuxt/fonts, @nuxtjs/color-mode, @nuxtjs/mdc
npx nuxi module add content           # @nuxt/content v3
npx nuxi module add image             # @nuxt/image
npm i -D @nuxtjs/seo                  # sitemap + robots + schema-org + og-image + seo-utils
```

Pinned expectations: `nuxt` ^4.5, `@nuxt/ui` ^4.10, `@nuxt/content` ^3, Nuxt UI requires Nuxt ≥ 4.1.
Do **not** add: a Tailwind config JS file (v4 is CSS-first), a separate typography plugin
(Nuxt UI ships prose components), a date library (use `Intl.DateTimeFormat`), or any animation library.

`nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/content', '@nuxt/image', '@nuxtjs/seo'],
  css: ['~/assets/css/main.css'],
  site: { url: 'https://example.com', name: '<Name>', defaultLocale: 'en' },
  content: { build: { markdown: { highlight: { theme: { default: 'github-light', dark: 'github-dark' } } } } },
  nitro: { prerender: { crawlLinks: true, routes: ['/', '/blog', '/sitemap.xml'] } },
  future: { compatibilityVersion: 4 },
  typescript: { strict: true },
})
```

**Gate:** `npm run dev` serves a blank page with no console warnings; `npx nuxi typecheck` passes.

---

## 2. Folder structure

```
app/
  app.vue
  app.config.ts            # all personal data + UI theme tokens
  assets/css/main.css      # Tailwind v4 @theme tokens
  layouts/default.vue
  pages/
    index.vue
    blog/index.vue
    blog/[slug].vue
  components/
    layout/TheHeader.vue
    layout/TheFooter.vue
    home/HeroSection.vue
    home/AboutSection.vue
    home/ExperienceSection.vue
    home/SkillsSection.vue
    home/ContactSection.vue
    ui/SectionShell.vue     # <section>, id, heading level, spacing
    blog/PostCard.vue
    blog/PostMeta.vue
  composables/
    useSiteSchema.ts
    usePostSeo.ts
content/
  blog/hello-world.md
public/
  img/avatar-placeholder.svg
  favicon.ico
content.config.ts
```

Rule: `pages/` composes, `components/home/*` renders, `app.config.ts` holds data. No fetching in
presentational components.

**Gate:** structure exists, all files empty-but-valid, dev server still clean.

---

## 3. Design system and content config

### 3.1 Tokens (`app/assets/css/main.css`)

```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme {
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  /* declare the palette explicitly; do not rely on Nuxt UI defaults */
}
:root { --ui-primary: var(--color-<chosen>-600); --ui-radius: 0.5rem; }
```

Design direction — make these **deliberate choices**, not defaults:

- **Type is the personality.** One characterful display face for the hero and section headings,
  a quiet body face, mono for code and metadata. Avoid the cream-background + serif-display +
  terracotta-accent combination; it's the current AI-design cliché.
- **Signature element:** pick exactly one memorable device (e.g. mono-set eyebrow labels on each
  section, or a terminal-ish hero) and keep everything else disciplined.
- Structural devices must encode real information. Numbered markers (01/02/03) are only allowed on
  Experience, where order is chronological and meaningful.
- Motion: one page-load reveal on the hero and hover states. Nothing else. Respect
  `prefers-reduced-motion`.
- Dark mode via `@nuxtjs/color-mode` (bundled). Verify contrast in both themes.

### 3.2 `app/app.config.ts`

Single source of truth: `profile` (name, title, intro, about, photo), `experience[]`, `skills[]`,
`socials[]`, `nav[]`. Typed with an interface. Every home section reads from here.

### 3.3 `content.config.ts`

```ts
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/*.md',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.string(),          // ISO YYYY-MM-DD
        tags: z.array(z.string()).default([]),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
        draft: z.boolean().default(false),
      }),
    }),
  },
})
```

**Gate:** typecheck passes; `queryCollection('blog')` autocompletes the schema fields.

---

## 4. Layout and navigation

- `layouts/default.vue`: skip link → `<header>` → `<main id="main">` → `<footer>`.
- `TheHeader.vue`: `UNavigationMenu` desktop; `USlideover`/`UDrawer` + `UButton` toggle on mobile.
  Nav items: Home, About, Experience, Skills, Blog, Contact.
- About/Experience/Skills/Contact are **hash links on `/`** (`/#about`). Blog is a real route.
  From `/blog/*`, hash links must resolve to `/#about`, not `#about`.
- Active state: `NuxtLink` `aria-current="page"` for routes; `IntersectionObserver` composable sets
  the active section on the home page. Style with a visible non-color-only indicator.
- Mobile drawer: focus trap, `Escape` closes, focus returns to the toggle, body scroll locked.
- Footer: socials with `rel="me noopener"`, copyright, no dead links.

**Gate:** keyboard-only pass — Tab reaches every nav item, drawer opens/closes/traps correctly,
skip link works, `aria-current` reflects state.

---

## 5. Home page sections

`pages/index.vue` renders the sections in order; each is wrapped in `SectionShell` with a stable
`id` and a single `<h2>`. Only the hero has the `<h1>`.

1. **Hero** — `NuxtImg` avatar placeholder (fixed width/height, `priority`, real `alt`), name as `h1`,
   title, intro, two `UButton`s: "View my work" → `/blog` (or `#experience`), "Contact me" → `#contact`.
2. **About** — prose paragraphs from `app.config`, max ~65ch measure.
3. **Experience** — a vertical journey, *not* a résumé table. Per entry: role, company, period,
   one-line contribution. No bullet dumps, no logos grid, no skill bars.
4. **Skills** — grouped; each group a labelled list of `UBadge`s. Real `<ul>`/`<li>` markup.
   No proficiency percentages (unverifiable and visually noisy).
5. **Contact** — `mailto:` primary action plus social links. If a form is wanted later, add a Nitro
   route; do **not** add a third-party form dependency now.

**Gate:** Lighthouse a11y = 100 on `/`; heading outline is h1 → h2 × 5 with no skips.

---

## 6. Blog / Markdown architecture

### 6.1 Reading time

Nuxt Content has no built-in reading time. Add to `nuxt.config.ts`:

```ts
hooks: {
  'content:file:beforeParse'(file) {
    if (!file.id.endsWith('.md')) return
    const words = file.body.split(/\s+/).filter(Boolean).length
    file.body = file.body.replace(/^---\n/, `---\nreadingTime: ${Math.max(1, Math.ceil(words / 200))}\n`)
  }
}
```

Add `readingTime: z.number().optional()` to the schema.

### 6.2 Listing — `pages/blog/index.vue`

```ts
const { data: posts } = await useAsyncData('blog-list', () =>
  queryCollection('blog')
    .where('draft', '=', false)
    .order('date', 'DESC')
    .select('path', 'title', 'description', 'date', 'tags', 'readingTime')
    .all()
)
```

Render `PostCard` in a responsive grid. Each card: whole-card link, title as `h2`, description,
`<time :datetime>`, reading time, tags. Empty state: a real sentence, not a shrug.

### 6.3 Post — `pages/blog/[slug].vue`

```ts
const route = useRoute()
const { data: post } = await useAsyncData(`blog-${route.params.slug}`, () =>
  queryCollection('blog').path(`/blog/${route.params.slug}`).first()
)
if (!post.value) throw createError({ statusCode: 404, statusMessage: 'Post not found', fatal: true })
```

Template: `UBreadcrumb` → header (h1, date, reading time, tags) → `<ContentRenderer :value="post" />`.
Wrap the renderer so Nuxt UI prose components style headings, links, images, lists, blockquotes,
tables, inline code and fenced code (Shiki, dual-theme). Code blocks get a copy button and a
`tabindex="0"` scroll container.

Add one seed post exercising **every** markdown element listed in the brief — it doubles as the
render test.

Adding a post = drop a `.md` in `content/blog/`. Nothing else.

**Gate:** seed post renders all elements correctly in light and dark; a bad slug 404s; typecheck passes.

---

## 7. SEO architecture

- `app.vue`: `useHead` with `titleTemplate: '%s · <Name>'`, `htmlAttrs: { lang: 'en' }`.
- Every page calls `useSeoMeta({ title, description, ogTitle, ogDescription, ogType, ogImage,
  twitterCard: 'summary_large_image' })`. No page ships without a unique title + description.
- Canonicals: `@nuxtjs/seo` emits them from `site.url`; verify on `/`, `/blog`, `/blog/[slug]`.
- `usePostSeo.ts` composable: takes a post, returns article meta + OG image config, so post SEO is
  one call and stays consistent.
- OG images: `defineOgImage()` from `nuxt-og-image` with one shared template component (title +
  name + accent). Generated at build, not runtime.
- Slugs: lowercase, hyphenated, no dates, no stop-word filler. Filename **is** the slug.
- External links: `rel="noopener noreferrer"`, `target="_blank"` only where warranted.
- No duplicate content: hash sections must not also exist as standalone routes.

**Gate:** view-source each route type — unique title, unique description, one canonical, complete
OG + Twitter tags, content present in SSR HTML with JS disabled.

---

## 8. Schema.org / JSON-LD

Use `nuxt-schema-org` (bundled with `@nuxtjs/seo`) — it handles escaping, `@id` linking and graph
merging, so never hand-write `<script type="application/ld+json">`.

- `app.vue`: `useSchemaOrg([defineWebSite(), definePerson({ name, jobTitle, url, image, sameAs: socials })])`
- `pages/blog/index.vue`: `defineWebPage({ '@type': 'CollectionPage' })` + `defineBlog()`
- `pages/blog/[slug].vue`: `defineArticle({ '@type': 'BlogPosting', headline, description,
  datePublished, image, keywords })` + `defineBreadcrumb([Home, Blog, <title>])`
- Rule: every property must correspond to something visible on the page. No invented ratings,
  no fake `wordCount`, no `author` that isn't credited on screen.

**Gate:** paste each route into the Rich Results Test / Schema Markup Validator — zero errors,
zero warnings that matter.

---

## 9. Sitemap and robots

- `@nuxtjs/sitemap` auto-discovers prerendered routes; confirm `/blog/*` are all present and that
  `draft: true` posts are excluded (filter them out of the collection query *and* the sitemap source).
- `lastmod` from post `date`.
- `@nuxtjs/robots`: allow all, point at `/sitemap.xml`. Block nothing except any preview routes.

**Gate:** `npm run generate && npx serve .output/public` — `/sitemap.xml` and `/robots.txt` are
correct and reference the production domain.

---

## 10. Accessibility

Non-negotiables, checked at each gate:

- Semantic landmarks: one `<header>`, `<nav>`, `<main>`, `<footer>`; `<article>` per post.
- One `<h1>` per page; no skipped levels.
- Every interactive element has an accessible name. Icon-only buttons get `aria-label`.
- Visible focus everywhere — style `:focus-visible`, never remove outlines.
- Contrast ≥ 4.5:1 body / 3:1 large text, in **both** color modes.
- Meaningful `alt` on content images; `alt=""` on decorative ones.
- Touch targets ≥ 44×44 px.
- ARIA only where Nuxt UI/Reka doesn't already provide it.
- `prefers-reduced-motion: reduce` disables the hero reveal and transitions.

**Gate:** axe DevTools clean on `/`, `/blog`, `/blog/[slug]`; one full screen-reader pass
(VoiceOver or NVDA) through nav → hero → a post.

---

## 11. Performance

- Fully prerendered (`nuxi generate`). No client-side data fetching on any page.
- `@nuxt/fonts` (bundled) self-hosts and preloads; subset to Latin; `font-display: swap`.
  Max two families plus mono.
- `NuxtImg`/`NuxtPicture` with explicit `width`/`height`, `format="webp"`, `sizes`, `loading="lazy"`
  everywhere except the hero avatar (`priority`, eager).
- Reserve space for the avatar and post images to keep CLS at 0.
- No global client-side JS beyond the nav drawer and color mode. Do not import chart/animation libs.
- Audit the bundle before shipping: `npx nuxi analyze`. Anything unexpected gets removed.

**Gate:** Lighthouse mobile on the built output — Performance ≥ 95, Accessibility 100,
Best Practices 100, SEO 100. LCP < 2.0s, CLS < 0.05, INP < 100ms.

---

## 12. Responsive design

Mobile-first. Breakpoints: default → `sm` 640 → `md` 768 → `lg` 1024 → `xl` 1280.
Container max-width ~72rem, prose measure ~65ch. Test 320px, 375px, 768px, 1440px.
Nav collapses to drawer below `md`. No horizontal scroll at any width — including wide code blocks
and tables, which scroll inside their own container.

**Gate:** manual pass at all four widths, light and dark.

---

## 13. Content structure

Post frontmatter contract:

```yaml
---
title: Structuring ViewModel state for Compose
description: One sentence, 120–155 chars, used verbatim as the meta description.
date: 2026-08-19
tags: [android, compose]
image: /img/blog/compose-state.png   # optional, 1200×630
imageAlt: Diagram of a StateFlow feeding a Composable   # required if image is set
draft: false
---
```

Zod rejects anything malformed at build time — that's intentional. Ship 1 real post + 1 kitchen-sink
seed post. Document the contract in a top-level `README.md` so future-you doesn't re-derive it.

---

## 14. Testing and validation

Run all of these against the **built** output before deploying:

1. `npx nuxi typecheck` — clean.
2. `npm run generate` — no build warnings; inspect `.output/public` for every expected route.
3. Lighthouse (mobile + desktop) on `/`, `/blog`, `/blog/[slug]`.
4. axe DevTools on the same three routes.
5. Rich Results Test + Schema Markup Validator on the same three routes.
6. `/sitemap.xml`, `/robots.txt` correctness.
7. JS disabled: all content readable, all links navigable.
8. Social preview: Open Graph debugger for a post URL.
9. Keyboard-only and screen-reader pass.
10. `@nuxtjs/link-checker` (bundled with `@nuxtjs/seo`) for broken internal links.

---

## 15. Production build and deployment

- Target static hosting (Netlify, Cloudflare Pages, Vercel, or GitHub Pages) — the site is fully
  prerendered, so no server runtime is needed.
- Set `site.url` to the real domain before building; OG images, canonicals and the sitemap all
  depend on it.
- Build command `npm run generate`, publish directory `.output/public`.
- Headers: long-lived immutable cache on `/_nuxt/*`, short cache on HTML.
- Post-deploy: re-run Lighthouse against the live URL, submit the sitemap to Google Search Console,
  confirm HTTPS + canonical host redirect (www → apex or vice versa, pick one).

---

## Execution order summary

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9, then 10–12 as a hardening pass over everything built,
then 13 → 14 → 15. Do not defer SEO, schema, or accessibility to the end — phases 7, 8 and 10
are written into each earlier gate on purpose.

Bias throughout: use what Nuxt and Nuxt UI already ship. Every new dependency needs a reason
that survives being asked "can Nuxt do this already?"