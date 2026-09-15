# Content

How posts are written, validated, styled and turned into routes.

---

## Writing a post

Create `content/blog/my-post.md`. The filename becomes the URL: `/blog/my-post`.

```markdown
---
title: Dark mode tokens that actually pass contrast
description: A semantic token layer only earns its keep if both themes are measured rather than assumed.
date: 2026-09-02
tags: [design-systems, accessibility]
draft: false
---

Opening paragraph. No `# heading` — the page title comes from frontmatter, and
the page already has exactly one `<h1>`.

## A section

Prose, `inline code`, [links](https://example.com).

```ts
export function contrast(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
```
```

Then `npm run dev` and open `/blog/my-post`.

> **Never start a post with `# Heading`.** The `<h1>` is rendered by the page from `title`.
> A second one fails `npm run check`.

---

## The frontmatter contract

Validated by a Zod schema in [`content.config.ts`](../content.config.ts). **Breaking it fails the
build.** That is deliberate: a missing or truncated description is an SEO regression you discover
six months later, and a build error is cheaper.

| Field | Rule | Why that rule |
|---|---|---|
| `title` | 10–70 chars | Under 70 so search results don't truncate it |
| `description` | **80–160 chars** | Used *verbatim* as the meta description |
| `date` | `YYYY-MM-DD` | Parsed as UTC; drives ordering, feeds, schema |
| `updated` | `YYYY-MM-DD`, optional | Sitemap `lastmod` and `dateModified` |
| `tags` | 1–5 strings | Each generates a tag page |
| `image` | optional | 1200×630 for social |
| `imageAlt` | **required when `image` is set** | Enforced by a `.refine()` |
| `draft` | defaults `false` | `true` excludes it everywhere |
| `readingTime` | optional | Injected automatically — see below |

### The failure mode to expect

If the build stops with a Zod error naming a file, read the message: it tells you which field and
which bound. The most common is a description at 60 or 200 characters.

---

## Reading time

Injected at build time by the `content:file:beforeParse` hook in `nuxt.config.ts`, using
[`lib/reading-time.ts`](../lib/reading-time.ts). 200 words per minute, minimum one.

Two things it handles that are easy to get wrong:

**Line endings.** Authoring happens on Windows, so `\r\n` after the opening `---` is normal. A
`/^---\n/` pattern matches nothing there — and fails *silently*, leaving `readingTime` undefined
on every post with no error anywhere in the build.

**Your override wins.** If you write `readingTime: 12` yourself, it is left alone. Duplicate YAML
keys are ambiguous, and an author who sets it by hand has made a decision about their own post.

---

## Draft posts

`draft: true` must hold in **five separate places**: the listing query, tag pages, the sitemap,
both feeds, and `llms.txt`. A leak in any one is silent — the post simply appears where it should
not.

`content/blog/draft-should-not-appear.md` is a **permanent fixture**, not a stray file. It carries
a marker string that `npm run check` asserts is absent from all five outputs. Don't delete it.

---

## Tags

Authored freely, slugged by [`app/utils/tags.ts`](../app/utils/tags.ts):

```
"Design Systems"  →  design-systems  →  /blog/tag/design-systems
```

Three things must agree exactly: the links on cards and posts, the route the prerenderer discovers
by crawling those links, and the lookup on the tag page resolving a slug back to posts. A
disagreement doesn't fail loudly — it produces a link that 404s, or a prerendered page nothing
points at. Hence `tests/unit/tags.spec.ts`.

**Tag pages are discovered by crawling.** `nitro.prerender.crawlLinks` follows links that exist in
the markup. A tag nobody links to is never built — and a tag nobody used throws a real 404 rather
than rendering an empty listing.

One known edge: a tag with no Latin characters slugs to an empty string. Recorded in the tests as
known behaviour rather than asserted as correct; the fix is a content decision.

---

## How markdown gets styled

Nuxt Content renders markdown through **MDC**, which resolves each element to a `Prose*`
component. `app/components/content/` overrides them:

| File | Element | Notable |
|---|---|---|
| `ProseH2` | `##` | Wraps content in a self-link. Anchor hidden until hover/focus — never `display:none`, which would take it out of the tab order |
| `ProseH3` | `###` | |
| `ProseA` | links | Delegates to `DsLink`, so a link in a post behaves like one in the UI |
| `ProsePre` | code fences | `tabindex="0"` + `role="region"` + a label |
| `ProseCode` | `` `inline` `` | |
| `ProseImg` | images | Dimensions **not** defaulted — see below |
| `ProseTable` | tables | Scrolls inside its own container |
| `ProseBlockquote`, `ProseUl/Ol/Li`, `ProseTd/Th`, `ProseHr`, `ProseP` | | |

These are registered **globally and without a path prefix**. MDC resolves them by bare name at
render time; get the registration wrong and Content silently falls back to its own unstyled
defaults.

### Two accessibility requirements inside prose

A `<pre>` with `overflow-x: auto` can only be scrolled with a pointer unless it is focusable, so
`tabindex="0"` is **not optional** — it is the only way to read a long line without a mouse. And a
focusable region needs a name, or a screen reader announces an unlabelled group. Same for tables.

### Images need explicit dimensions

Markdown has no syntax for dimensions, so use MDC attributes:

```markdown
![A diagram of the token layers](/img/blog/tokens.png){width="800" height="450"}
```

`npm run check` **fails the build** if a post ships an image without them.

Dimensions are deliberately *not* defaulted. A fallback like 1200×630 reserves a box of the wrong
shape for anything that isn't a cover image — the browser holds space at the invented ratio, then
reflows. That is worse than reserving nothing, because the shift is guaranteed rather than merely
likely.

### The kitchen sink

`content/blog/markdown-kitchen-sink.md` renders every element the prose components style, so a
styling regression in any one of them is visible on a single page, in both themes, at every width.
Keep it current when you add a prose override.

---

## Syntax highlighting

Shiki, configured in `nuxt.config.ts` with `github-light` / `github-dark` and an explicit language
list. **A language not in that list renders unhighlighted** — add it there.

There is one subtlety in `base.css`. Nuxt Content emits light as its no-class default; ours is the
opposite, because bare `:root` is dark and that is what a visitor with JavaScript disabled gets.
The rule matches `html:not(.light)` rather than `.dark` so both defaults agree.
