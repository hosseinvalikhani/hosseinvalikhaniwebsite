# SEO

Every route ships a title, a description, one canonical, Open Graph tags, a generated OG image and
a single merged JSON-LD graph. All of it at build time.

---

## The governing idea

> **Structured data must describe something a reader can actually see.**

That is not style advice. Structured data describing invisible content is what "spammy structured
data" means, and it is a manual-action category in Search Console — not merely ineffective. Every
property in this site's schema corresponds to something rendered on the page.

The second idea: **the build should fail rather than regress.** A missing description, a duplicate
title, two canonicals — these are caught by `npm run check`, not by noticing traffic drop.

---

## Where it comes from

| Layer | File | Provides |
|---|---|---|
| Site-wide | `app/app.vue` | Title template, `lang`, feed autodiscovery, `WebSite` + `Person` |
| Per page | `pages/*.vue` | `useSeoMeta`, `defineOgImage`, page-type schema |
| Per post | `composables/usePostSeo.ts` | Everything a post needs, in one call |
| Config | `nuxt.config.ts` | `site.url`, robots, route rules |

### `site.url` is load-bearing

```ts
site: { url: 'https://example.com', name: 'Personal Site', defaultLocale: 'en' }
```

Canonicals, OG image URLs, feed item links and the sitemap all derive from it. **Set it to the
real domain before building for production.** `npm run check` asserts no `localhost` leaked into
the feeds, but it cannot know your domain.

---

## Per-page metadata

```ts
useSeoMeta({
  title: 'Blog',
  description,
  ogTitle: 'Blog',
  ogDescription: description,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})
```

The title template lives in `app.vue`: `` title => title ? `${title} · ${profile.name}` : profile.name ``
— so pages set a bare title and the site name is appended once.

### `usePostSeo` — one call per post

`app/pages/blog/[slug].vue` calls `usePostSeo(post)` and gets article meta, the OG image, the
`BlogPosting` schema and the breadcrumb together. One function so post SEO **cannot drift** between
the post page and anything else that renders a post later.

Two details worth knowing:

- `articleModifiedTime` falls back to `date`, but `updated` is only set when the post declares it.
  An empty `article:modified_time` is worse than none.
- The article's `author` is `{ '@id': '…/#identity' }` — a **reference** to the site-wide `Person`,
  not a repeated inline copy. That is what makes it one graph instead of several disconnected ones.
- `timeRequired` (`PT3M`) is added from the reading time, and `image` only when the post has a cover.

### What the post page shows, and why

Each of these exists partly because the schema above claims it — the governing idea, applied:

| On the page | Backs |
|---|---|
| Byline (`PostByline`, links `rel="author"` to `/#about`) | `author`, `article:author` |
| "Updated …" in `PostMeta`, only when `updated` is set | `dateModified` |
| "N min read" | `timeRequired` |
| Cover image, when `image` is set | `image` |
| The description, as the standfirst under the title | the meta description |

Two more are for crawl paths rather than schema: the **outline** (`PostToc`) links every h2/h3 by
its id, which is what search engines use for "jump to" section links, and the **pager**
(`PostPager`) links each post to its neighbours so no post is reachable only through the listing.

---

## Structured data

Written through `nuxt-schema-org` (`useSchemaOrg`), never as a hand-rolled
`<script type="application/ld+json">`. The module handles escaping, assigns stable `@id`s, and
**merges every page's additions into one graph**. Hand-written JSON-LD produces several
disconnected graphs each re-declaring the same person, which is exactly what confuses a parser.

| Route | Type |
|---|---|
| `/` | `ProfilePage` — accurate for a site *about a person*, and what lets `Person` carry `knowsAbout` |
| `/blog`, `/blog/tag/*` | `CollectionPage` + breadcrumb |
| `/blog/[slug]` | `BlogPosting` + breadcrumb |
| every page | `WebSite` + `Person` from `app.vue` |

`npm run check` asserts **exactly one** JSON-LD block per page and that it parses.

### `rel="me"` and `sameAs` must agree

The footer's profile links carry `rel="me"`; the `Person` schema's `sameAs` is built from the same
`socials.filter(s => s.isProfile)`. They are two statements of the same claim — a verifier that
finds only one treats the profile as unconfirmed. Set `isProfile: true` in `app.config.ts` for
links that genuinely represent you; a `mailto:` does not.

---

## OG images

Generated at build time by `nuxt-og-image` with Satori, from
`app/components/OgImage/Default.satori.vue`.

```ts
defineOgImage('Default', { title, name: profile.name, label: post.tags?.[0] ?? 'Writing' })
```

- **`zeroRuntime: true`** — images are baked during prerender, so none of the rendering machinery
  reaches the client.
- Fonts must be declared explicitly in `ogImage` config: Satori has no access to the CSS or the
  self-hosted `@nuxt/fonts` files, and **silently falls back to a default face** otherwise.
- Use `defineOgImage`, not `defineOgImageComponent` — the latter is deprecated and drags `consola`
  into the browser bundle.

Because the name is rendered *into a PNG*, stale content in `app.config.ts` ships as an image.
Replace the placeholders before the deploy build.

---

## Feeds, sitemap, robots

| Route | Source |
|---|---|
| `/rss.xml` | `server/routes/rss.xml.ts` |
| `/feed.json` | `server/routes/feed.json.ts` (JSON Feed 1.1) |
| `/llms.txt` | `server/routes/llms.txt.ts` |
| `/sitemap.xml` | `@nuxtjs/sitemap` |
| `/robots.txt` | `@nuxtjs/robots` |

Shared logic is in `server/utils/feed.ts`. Feeds are announced in `<head>` — a feed that exists but
isn't announced has to be guessed at by URL.

**These are prerendered explicitly**, in `nitro.prerender.routes`, because nothing links to them
and `crawlLinks` can't discover them.

RSS carries `atom:self`. Without it some aggregators can't identify a feed after a domain change
and re-deliver every item as new.

### The style guide is the one excluded route

```ts
robots: { disallow: ['/design-system'] },
routeRules: { '/design-system': { robots: false, sitemap: false } },
```

A development surface with no reason to be indexed. It scores SEO 61 in Lighthouse *because* it is
`noindex` — that is the rule working, not a failure.

---

## The 404 is a real route

`pages/404.vue` + `scripts/static-404.mjs`.

Nuxt writes an **empty SPA shell** to `404.html` for static hosts, so the error content only
appears once JavaScript boots — a blank page for anyone without it, and for any crawler that
doesn't execute scripts. Since this site has no JavaScript framework at all, that shell would
be permanently blank.

So `404` is rendered as an ordinary route and the post-build script copies it over the shell.
`npm run check` asserts the file contains real rendered content, because a build error would never
reveal this.

---

## What `npm run check` enforces

Across **every** built HTML file, not a hand-written list:

- a non-empty `<title>`
- a meta description
- exactly one canonical
- exactly one JSON-LD block, and it parses
- exactly one `<h1>`
- at most one `aria-current="page"`
- **titles and descriptions unique** across indexable routes
- no degenerate `srcset` candidates
- every `<img>` declares `width` and `height`
- the draft post absent from all five outputs

`noindex` pages are excluded from the *uniqueness* comparison but still need a title and
description — `/404.html` is a byte-for-byte copy of `/404/index.html`, so requiring them to differ
would be asserting a bug.

---

## Once per release, by hand

Automation doesn't cover these:

- **Rich Results Test** on one post
- An **OG debugger** on the platform you actually post to
- A **JavaScript-disabled** read-through
- **Search Console**: submit the sitemap, then watch coverage
