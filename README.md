# Personal site

A prerendered personal site and blog: **Nuxt 4 + Tailwind CSS v4 + a first-party design system +
Nuxt Content v3 + Nuxt SEO**. No component library, and — after Phase 13 — **no client-side
JavaScript framework at all**.

Every page is HTML built at deploy time. The only script a visitor runs is
[`public/enhance.js`](public/enhance.js) — 5.0 KB gzipped, 4.1 KB brotli — which wires up three
controls.

---

## Start here

```bash
npm install          # also runs `nuxt prepare`, which generates types
npm run dev          # http://localhost:3000, with hot reload
```

Then read, in this order:

| # | Document | What it answers |
|---|---|---|
| 1 | [docs/architecture.md](docs/architecture.md) | How the site is put together, and why there is no client framework |
| 2 | [docs/design-system.md](docs/design-system.md) | Tokens, icons, components — how to build UI here |
| 3 | [docs/content.md](docs/content.md) | Writing posts, frontmatter, tags, prose styling |
| 4 | [docs/seo.md](docs/seo.md) | Meta, structured data, OG images, feeds, sitemap |
| 5 | [docs/testing.md](docs/testing.md) | The nine checks, and how to add to them |
| 6 | [docs/accessibility.md](docs/accessibility.md) | The WCAG 2.2 AA conformance record |
| 7 | [docs/decisions.md](docs/decisions.md) | Why things are the way they are, and what would change them |

If you only read one, read **architecture**. Most of the surprising things about this codebase
follow from the single decision described there.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server. Hot reload. **Still hydrates Vue** — see the warning below. |
| `npm run generate` | Build the static site into `.output/public`, then fix `404.html` |
| `npm run serve` | Serve `.output/public` the way a host would, including brotli. Mounts the site at its base path, at <http://localhost:3000/hosseinvalikhaniwebsite/>; bare paths redirect there |
| `npm run verify` | **All nine checks.** What CI runs. Do this before you push. |
| `npm run typecheck` | `vue-tsc`, zero errors expected |
| `npm run lint` | ESLint, including the accessibility plugin and the raw-ramp ban |
| `npm test` | Unit tests (`vitest`) |
| `npm run test:e2e` | End-to-end tests (`playwright`) — needs `generate` first |
| `npm run check` | Asserts the built output rendered, and its metadata is sound |
| `npm run check:contrast` | Every colour token against WCAG AA, both themes |
| `npm run check:budget` | Per-route JS and CSS transfer size |
| `npm run check:perf` | Lighthouse budgets — needs `generate` first |

> **Dev and production differ in one way that matters.** `features.noScripts` is production-only,
> so `npm run dev` still ships and hydrates the Vue client bundle. No component has a client-side
> handler any more, so behaviour is identical either way — but **anything about bundle size,
> script behaviour or performance must be judged on `npm run generate && npm run serve`**, never
> on the dev server.

---

## Where to change things

| You want to change… | Edit |
|---|---|
| Your name, role, bio, jobs, skills, social links | [`app/app.config.ts`](app/app.config.ts) |
| Colours, type scale, radii, motion | [`app/assets/css/tokens.css`](app/assets/css/tokens.css) |
| Global element styles, focus ring, reduced motion | [`app/assets/css/base.css`](app/assets/css/base.css) |
| A blog post | `content/blog/*.md` |
| Which sections appear on the home page | [`app/pages/index.vue`](app/pages/index.vue) |
| The site URL, modules, build hooks | [`nuxt.config.ts`](nuxt.config.ts) |
| Client-side behaviour | [`public/enhance.js`](public/enhance.js) |

**`app.config.ts` holds the real copy**, including the portrait at
`public/img/hossein-valikhani.jpg` (800×800 — @nuxt/image derives the webp variants from it, at
quality 90 rather than the global 72; see [`DsAvatar`](app/components/ds/DsAvatar.vue)). Swap
that file and the `photoAlt` beside it together, and remember the OG images bake this content
into a PNG at build time, so stale copy there ships as an image.

---

## The post frontmatter contract

Enforced by a Zod schema in [`content.config.ts`](content.config.ts). Breaking it **fails the
build**, which is the point — a truncated description is an SEO regression you would otherwise
find six months later.

```yaml
---
title: Structuring ViewModel state for Compose   # 10–70 characters
description: One sentence, 80–160 characters, used verbatim as the meta description.
date: 2026-08-19                                  # ISO, YYYY-MM-DD
updated: 2026-09-02                               # optional; drives sitemap lastmod
tags: [android, compose]                          # 1–5 tags
image: /img/blog/compose-state.png                # optional, 1200×630
imageAlt: Diagram of a StateFlow feeding a Composable   # REQUIRED when image is set
draft: false                                      # true keeps it out of every listing and feed
---
```

`readingTime` is injected automatically at build time — don't write it yourself unless you want
to override the calculation, in which case yours is respected.

---

## Project layout

```
app/
  app.config.ts          Your data. The only file with personal content in it.
  app.vue                Head, feed autodiscovery, site-wide JSON-LD, enhance.js
  assets/css/            tokens.css (the palette), base.css (global rules), main.css
  components/
    ds/                  Design system. Knows nothing about whose site this is.
    content/             Prose overrides — how markdown elements render
    layout/              Header, footer, drawer, error state
    home/                The five home-page sections
    blog/                Post card, post meta, tag list
  composables/           useFormatDate, usePostSeo
  design/                icons.ts (13 icons as path data), variants.ts (the cva stand-in)
  pages/                 Routes
content/blog/            Posts
lib/                     Build-time logic that needs testing (reading-time)
public/enhance.js        The entire client-side runtime
scripts/                 Build and verification scripts
server/routes/           rss.xml, feed.json, llms.txt
tests/                   unit/, e2e/, lint-rules
docs/                    This documentation
```

---

## Deployment

The site deploys to GitHub Pages from `.github/workflows/deploy.yml` on every push to `main`,
and can be run by hand from the Actions tab. The workflow installs, runs `npm run generate`,
re-runs `npm run check` against the bytes it is about to publish, and uploads `.output/public`
as a Pages artifact. `ci.yml` runs the full verification suite separately, so a flaky
Lighthouse run cannot block a deploy and a deploy cannot skip the checks that matter.

One setting has to be made in the GitHub UI, once: **Settings → Pages → Build and deployment →
Source → GitHub Actions**. Until that is set the workflow fails at the deploy step.

### The base path

Pages serves a project repository from `/<repo>/`, so `app.baseURL` is
`/hosseinvalikhaniwebsite/` and `site.url` is the origin alone — the SEO modules join the two.
Live at <https://hosseinvalikhani.github.io/hosseinvalikhaniwebsite/>.

Anything that does not go through the router keeps whatever path it was written with, and a
bare `/enhance.js` resolves to the domain root — a different site. That failure is silent,
so `scripts/check-output.mjs` asserts that every root-relative `href`, `src` and `url()` in
the built HTML starts with the base path. Three URLs were wrong in the first build made
against it.

Moving to a custom domain or to a `<user>.github.io` repository means serving from the root.
Four constants change together, all commented where they are defined: `BASE_URL` in
`nuxt.config.ts`, `BASE_PATH` in `scripts/check-output.mjs` and in `scripts/check-budget.mjs`,
and `BASE` in `scripts/check-lighthouse.mjs`. A custom domain also wants `public/CNAME`.

### What Pages cannot do

- **No response headers.** The `routeRules` cache-control on `/_nuxt/**` is inert here, as any
  CSP, `X-Content-Type-Options` or `Referrer-Policy` would be. Pages sends its own headers and
  offers no hook. Getting them needs a host that has one — Cloudflare Pages or Netlify — or a
  proxy in front. Nothing in the build has to change for that; the output is the same.
- **No `robots.txt`.** Crawlers read it only from the origin root, which belongs to the
  `hosseinvalikhani.github.io` repository, not this one. `@nuxtjs/robots` refuses to emit one
  under a base path rather than ship a file nothing will fetch, so `robotsTxt: false` is set to
  match. Per-page `noindex` still works and still covers `/design-system`; the sitemap has to
  be submitted to Search Console by hand.

### Still outstanding

1. **Prune the deploy.** About 6 MB of the 7.9 MB output is unreachable — see
   [docs/decisions.md](docs/decisions.md#the-deploy-still-carries-6-mb-nothing-can-fetch).
2. **Submit the sitemap** to Search Console.
