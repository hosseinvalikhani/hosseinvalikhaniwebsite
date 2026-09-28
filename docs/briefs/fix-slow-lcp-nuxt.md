# Content plan: "Fix slow LCP in a Nuxt app"

## Context

You asked for a detailed, AdSense-safe SEO content **plan** (not the article) for frontend engineers. The template's
Context fields were blank, so I filled them from this repo and your profile in
[app/app.config.ts](../../app/app.config.ts). You picked **"Fix slow LCP in Nuxt"** as the topic. You haven't chosen an ad
host yet, so the plan covers both options.

### Assumptions (fill-ins for the blank Context fields)

| Field | Assumption | Source |
|---|---|---|
| Topic | Fixing a slow LCP in a Nuxt 3/4 app, plus the CLS and INP problems that tend to come with it | your choice |
| Reader | Junior-to-mid Vue/Nuxt developers (1–3 years). Search Console or PageSpeed Insights has told them LCP is "Poor" or "Needs improvement" | your profile |
| Reader's goal | Get a production page's LCP under 2.5 s at p75 in field data, then keep it there | — |
| Your experience | **Case A (Lipak, production):** LCP 4.5 s → 2.2 s, CLS < 0.01, INP < 200 ms, build 65 MB → 11 MB by reworking third-party imports and code splitting. **Case B (this site):** LCP 1.8–2.1 s → 1.35 s, CLS 0.159 → 0, JS 98–119 KB → 5.9 KB per route | `app.config.ts`, [docs/architecture.md](../architecture.md), [docs/decisions.md](../decisions.md) |
| Versions | Nuxt 4.5, Vue 3.5, @nuxt/image 2.1, @nuxt/fonts 0.14, Lighthouse 13.4, Chrome stable | [package.json](../../package.json) |
| Existing articles | `dark-mode-tokens-that-actually-pass-contrast` is the only real post. `markdown-kitchen-sink` is a test page; `draft-should-not-appear` is a draft | `content/blog/` |
| Language / market | English, global | — |
| Length | 2,400–3,000 words, not counting code | two case studies need the room |
| Host | Undecided. A custom-domain version of this site, or a separate monetized blog | your answer |

---

## 1. Search intent analysis

- **Primary intent: troubleshooting**, with a tutorial built in. The reader has a failing metric and a deadline. They
  aren't browsing to learn.
- **What they already know:** what LCP stands for, how to run Lighthouse, and that `<NuxtImg>` exists. They've probably
  already tried "compress the images" and "add `loading=lazy`". The second one often makes LCP *worse*.
- **Where they're stuck:**
  1. They can't tell which element *is* the LCP element, or why it differs between mobile and desktop.
  2. They don't know which part of LCP is slow: TTFB, load delay, load duration or render delay.
  3. Lab scores and field scores disagree. Lighthouse shows 95 while Search Console says "Poor".
  4. They're unsure what's Nuxt-specific: hydration cost, the payload, fonts, `<NuxtImg>` defaults, SSR vs SSG.
- **What top pages likely cover:** web.dev's "Optimize LCP", generic "10 tips" lists, and Nuxt module READMEs. The
  typical Nuxt post repeats "use @nuxt/image, lazy-load, use a CDN", has no numbers, and targets Nuxt 2 or early
  Nuxt 3.
- **Gaps you can fill:**
  - A **diagnosis-first** order: find the element, find the slow subpart, then fix only that subpart.
  - **Real before/after numbers from two very different apps:** a large SPA-style production app and a prerendered
    static site.
  - **Counter-intuitive, measured findings nobody else has published.** Preloading *both* fonts made LCP worse
    (1.35 s → 1.5–1.7 s). The avatar wasn't the LCP element at phone width, the paragraph was. Inlining 6.8 KB of CSS
    saved 74–151 ms. A 4 ms budget miss turned out to be a TCP congestion-window boundary.
  - **Honest "when not to" guidance.** Don't turn off hydration for one page. Don't preload everything.

## 2. Keyword strategy

**Primary keyword:** `nuxt lcp` (as in "improve LCP in Nuxt")

**Secondary keywords and variations (8):** nuxt core web vitals · nuxt largest contentful paint · nuxt performance
optimization · nuxt image lcp · nuxt 3 lcp · nuxt 4 performance · lcp optimization vue · nuxt page speed

**Long-tail keywords and questions (14):**
1. why is my lcp slow in nuxt
2. how to find the lcp element in chrome devtools
3. nuxtimg preload fetchpriority
4. should the lcp image be lazy loaded
5. lighthouse score good but search console lcp poor
6. how to reduce hydration cost in nuxt
7. nuxt lazy hydration hydrate-on-visible
8. nuxt fonts cls font swap
9. preload fonts hurts lcp
10. nuxt ssr vs ssg for core web vitals
11. how to reduce nuxt bundle size
12. nuxt analyze bundle
13. inline critical css nuxt
14. lcp subparts ttfb load delay render delay

**Where each goes:**

| Location | Keywords |
|---|---|
| Title / H1 | primary keyword, plus "Nuxt" in the first 3 words |
| URL slug | primary keyword |
| First 100 words | primary keyword + "Core Web Vitals", once each |
| H2s | "find the LCP element", "LCP subparts", "Nuxt image", "fonts", "hydration", "bundle size". One natural phrase per H2 |
| H3s / body | long-tail 3, 6, 7, 8, 11, 12, 13 where the matching fix is explained |
| FAQ | long-tail 4, 5, 9, 10 as the literal question wording |

Rule: never repeat the exact primary phrase more than about 4 times in the body. Use the synonyms from the
secondary list, and let readability win every time.

## 3. Title and meta

**Title options (all under 60 characters):**
1. How I Cut LCP From 4.5s to 2.2s in a Nuxt App — *recommended (most first-hand)*
2. Fix Slow LCP in Nuxt: Find the Slow Part, Then Fix It
3. Why Is My Nuxt LCP Slow? A Diagnosis-First Guide
4. Nuxt LCP Optimization With Real Before/After Numbers
5. Nuxt Core Web Vitals: Fixing LCP, CLS and INP

**Meta description options (under 155 characters, and inside the 80–160 range [content.config.ts](../../content.config.ts) enforces):**
1. Find which of LCP's four parts is slow in your Nuxt app and fix only that. Tested Nuxt 4 code and real numbers from 4.5s to 2.2s.
2. Lighthouse says 95, Search Console says Poor. A step-by-step way to diagnose and fix LCP in Nuxt, with measured before/after results.
3. Images, fonts, hydration and bundle size: the Nuxt LCP fixes that moved real metrics, the ones that didn't, and when to skip each.

**Slug:** `/blog/fix-slow-lcp-nuxt`

## 4. Detailed outline

Markers: **[YOU]** = first-hand experience, a real mistake or a measured result only you can supply.
**[CODE]** = a tested snippet. **[VISUAL]** = a diagram, screenshot or table.

**H1: How I Cut LCP From 4.5s to 2.2s in a Nuxt App**

**Intro (~150 words), no H2**
- Purpose: confirm the reader is in the right place within 3 sentences.
- Key points: the symptom (Search Console "Poor"), what the post promises (diagnose, then fix), and the two cases
  with their headline numbers.
- **[YOU]** One sentence on the moment you noticed the problem at Lipak. Who flagged it, and which page.
- A version line: "Tested on Nuxt 4.5, Vue 3.5, Chrome 1xx, September 2026."

**H2: What "good" LCP means, and which number to trust**
- Purpose: stop the reader from optimizing the wrong number.
- Key points:
  - The thresholds: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, all at the 75th percentile.
  - Field data (CrUX, Search Console, PageSpeed Insights "real users") ranks. Lab data (Lighthouse) is for debugging.
- [VISUAL] A table of the three thresholds, and a lab-vs-field comparison table.
- **[YOU]** Did Lipak's lab and field numbers disagree? By how much?

**H2: Step 1 — Find the LCP element (it's often not the one you think)**
- H3: Chrome DevTools Performance panel, "LCP" marker.
  - [VISUAL] An annotated screenshot of the Performance panel with the LCP marker.
- H3: A `PerformanceObserver` snippet you can paste into the console.
  - [CODE] About 10 lines of JS logging `largest-contentful-paint` entries and their `element`.
- H3: Mobile vs desktop pick different elements.
  - **[YOU / Case B]** On this site the hero photo was assumed to be the LCP element. At phone width, the lead
    paragraph wraps to four lines and wins on area. That changed which fixes mattered.

**H2: Step 2 — Split LCP into its four subparts**
- Purpose: the core differentiator. Every later H2 maps to one subpart.
- Key points: TTFB, resource load delay, resource load duration, element render delay. Include rough target shares
  and cite web.dev's guidance.
- [VISUAL] An original stacked-bar diagram of the four subparts. Draw it yourself; don't copy web.dev's figure.
  Also add a table: subpart → typical Nuxt cause → the section below that fixes it.
- **[YOU]** Lipak's before-state breakdown, if you have it. Which subpart dominated?

**H2: Fix TTFB — SSR, SSG and caching in Nuxt**
- Key points:
  - Prerender (`nuxt generate` / `routeRules: { prerender: true }`) where content allows. Use `swr`/`isr` route
    rules otherwise.
  - Check for slow `useFetch` calls blocking SSR.
- [CODE] A `routeRules` example.
- Limitation: SSG isn't an option for personalized pages. Say so.

**H2: Fix load delay and duration — images with `<NuxtImg>`**
- H3: Never lazy-load the LCP image.
  - [CODE] `<NuxtImg preload fetchpriority="high" loading="eager" …>` with `sizes`/`densities`.
- H3: Formats and quality.
  - avif/webp, and a global quality of 72.
  - **[YOU / Case B]** Why the portrait uses 90: skin gradients degrade. 7.9 KB → 17.7 KB was measured and LCP was
    unchanged at 1353 ms.
- H3: Serve the right size.
  - [VISUAL] A table of sizes in KB at each density.
- Limitation: `preload` on a non-LCP image steals bandwidth. Preload one image per page, at most.

**H2: Fix render delay — CSS and fonts**
- H3: Inline small critical CSS.
  - **[YOU / Case B]** 6.8 KB brotli inlined saved 74 ms (home) and 151 ms (post).
  - The trap: relative `url(../_fonts/…)` breaks once the CSS is inlined.
  - When not to: CSS over ~15 KB, or sites with hundreds of pages.
- H3: Fonts — `@nuxt/fonts`, metric-override fallbacks, and preloading.
  - **[YOU / Case B]** The three-way measurement: no preload → CLS 0.159; preload both → LCP 1.5–1.7 s; Inter always
    plus mono only on pages with `<pre` → CLS 0, LCP 1.35 s.
  - [VISUAL] Reproduce the table from [docs/decisions.md](../decisions.md).
  - [CODE] The `@nuxt/fonts` config.
- Key lesson: preloading is a budget, not a free win.

**H2: Fix the JavaScript — hydration and bundle size (where INP comes in)**
- H3: Measure first.
  - `npx nuxi analyze`, and the DevTools Coverage tab.
  - [VISUAL] A treemap screenshot, before and after.
- H3: Third-party imports.
  - **[YOU / Case A]** Name the actual offenders at Lipak (anonymize if needed): full lodash? a date library? an icon
    set? Show one before/after import diff.
  - [CODE] A named/deep import, or a `defineAsyncComponent` split.
  - Be explicit that the 65 → 11 MB figure is *build output*. Also give **JS transferred per route**, because that is
    what users actually download. **[YOU]** supply that number.
- H3: Lazy hydration in Nuxt.
  - `Lazy`-prefixed components with `hydrate-on-visible` / `hydrate-on-idle`.
  - [CODE] One example.
  - **[YOU]** Did this contribute to INP < 200 ms?
- H3: The extreme option — no hydration at all.
  - **[YOU / Case B]** `features.noScripts` plus a 5 KB `enhance.js`: 88 KB framework floor → 5.9 KB.
  - When NOT to: any reactive UI. And don't half-reverse it for one page.
  - Link the future companion post.

**H2: Case study summary — what moved the needle, and what didn't**
- [VISUAL] A before/after table for both cases: LCP, CLS, INP/TBT, JS KB, Lighthouse.
- **[YOU]** A "didn't help" list. Things you tried at Lipak that made no difference. This is the strongest E-E-A-T
  signal in the post.

**H2: Keep it fixed — budgets in CI**
- Key points: a per-route JS budget script and Lighthouse budgets.
- **[YOU / Case B]** The LCP budget moved from 1500 to 1600 ms because the metric quantizes in 150 ms RTT steps. It's
  a great "measure the measurement" anecdote.
- [CODE] A minimal budget-check excerpt, adapted from [scripts/check-budget.mjs](../../scripts/check-budget.mjs).

**H2: FAQ** (see section 9)

**Closing (~80 words, no "In conclusion")**
- The 3-step checklist in one breath.
- One honest caveat.
- A pointer to the companion posts.

## 5. E-E-A-T and helpful-content requirements

- **Show experience:**
  - Every numeric claim names the tool, the throttling profile and the date. For example: "Lighthouse 13.4, mobile,
    simulated throttling, median of 5 runs".
  - Screenshots are your own: DevTools, the PSI field-data panel, a Search Console CWV report.
  - **[YOU] Check your Lipak NDA** before using its name, screenshots or internal URLs. If in doubt, write "a B2B SaaS
    dashboard" and keep only the ratios.
- **Tested code:**
  - Every snippet runs in a minimal Nuxt 4.5 repro.
  - Publish that repro on GitHub (e.g. `nuxt-lcp-demo`) and link it. A runnable repo is the clearest proof that you
    did the work.
- **Author bio (60–80 words):**
  - "Hossein Valikhani, frontend engineer, 3+ years in Vue/Nuxt."
  - The Lipak LCP result in one line, and a link to the home page's experience section.
  - GitHub with `rel="me"` (already modelled in `SocialLink.isProfile`).
  - A real photo, which you already have. The existing `PostByline` component is the place for it.
- **Cite (link, don't copy):**
  - web.dev: "Optimize LCP", "LCP", "Optimize INP", "CLS", "Lab vs field data".
  - MDN: `fetchpriority`, `PerformanceObserver`, `largest-contentful-paint`, `font-display`.
  - nuxt.com: Rendering modes / `routeRules`, lazy hydration, `nuxi analyze`, `features.noScripts`.
  - image.nuxt.com (`preload`, `sizes`), fonts.nuxt.com.
  - W3C LCP spec; the Chrome UX Report docs.
- **More useful than a rewrite:**
  - The diagnosis→subpart→fix mapping table.
  - The "didn't help" list and the measured counter-examples (the font preload that backfired, the wrong LCP element).
  - Two contrasting apps, and the runnable repo.
- **Dates:** `date` plus `updated` in the frontmatter. Show "Last tested with Nuxt 4.x" near the top.

## 6. Humanized writing guidelines

- **Voice:**
  - A colleague at your desk. Use "I tried X, it did nothing", and "you" for the reader.
  - Opinions are allowed, e.g. "I'd skip critical-CSS tools on a site this small".
- **Rhythm:**
  - Mix 5-word sentences with 25-word ones.
  - One idea per paragraph, 2–4 lines.
  - Your existing post (`dark-mode-tokens…`) already has the right voice. Match it.
- **Banned phrases:** "In today's fast-paced digital world", "delve", "it's important to note", "in conclusion",
  "game-changer", "leverage", "seamless", "unlock", "robust", "a myriad of", "navigating the landscape", and any "Let's
  dive in".
- **Honest limits in every fix section:** give each fix a "When not to" line. Examples: preload, inlining, noScripts,
  SSG for personalized pages.
- **Code rules:**
  - Version comment at the top of every file-sized snippet, e.g. `// nuxt 4.5`.
  - Comments explain *why*, not *what*.
  - Only use languages Shiki already loads (`ts, js, vue, bash, json, css` in [nuxt.config.ts](../../nuxt.config.ts)).
    Add `html` if you show raw markup.
- Read the draft out loud once. Rewrite any sentence you wouldn't actually say to a colleague.

## 7. AdSense readiness

**Content check:** the article is original, built on first-hand measured data, over 2,400 words, and useful without
the linked repo. It passes if the [YOU] slots are actually filled. Leaving them generic would make it a
"rewrite of web.dev", and that is the real risk.

**Ad placement zones (at most 3 units in about 2,800 words):**
1. After the intro's last paragraph, before the first H2. Not above the H1, not next to the byline.
2. Between the "Split LCP into subparts" and "Fix TTFB" sections. It sits after a diagram and a table, not after a
   code block.
3. After the case-study summary and before "Keep it fixed". Or after the closing paragraph, **above** the author bio,
   with at least ~150 px of prose separating it from `PostPager`'s prev/next buttons.

Avoid these spots:
- directly above or below any `<pre>` or its copy button
- inside or beside the sticky `PostToc`, which is navigation
- next to the header/drawer or the theme toggle
- inside the FAQ

Reserve each slot's height with `min-height` so ads don't undo the CLS 0 you're writing about. Readers will check.

**Policy flags:**
- No "click an ad to support me" wording, and no arrows or placement that make ads look like download buttons or
  code. Label units "Advertisement".
- No ads on `/404`, the error page or `/design-system` (a noindexed style guide with no content).
- **`markdown-kitchen-sink` is a published, indexed test page.** Set it to `draft: true` or `noindex` before you
  apply. It reads as thin, placeholder content.
- Screenshots from an employer's internal tools may be confidential, so check your NDA.
- Don't reproduce web.dev figures. Draw your own.

**Site-level requirements (none exist yet except About/Contact as home-page sections):**
- A dedicated `/about` page and `/contact` page. The home-page `#about` and a `mailto:` are thin for reviewers.
- A `/privacy` page that discloses Google's use of cookies and third-party vendors, and links Google's "How Google
  uses information from sites that use our services".
- A **Google-certified CMP** for EEA, UK and Swiss visitors. Google requires one for AdSense there.
- `ads.txt` at the **domain root**. The current GitHub Pages *project* URL (`/hosseinvalikhaniwebsite/`) can't serve
  one, so a custom domain is effectively required.
- Enough substance before you apply. A rule of thumb (not an official number) is 10–15 solid posts. Today there is
  one real post.
- Clear navigation to Blog, About, Contact and Privacy in the header or footer.

**If the host is this site:**
- Adding `adsbygoogle.js` reverses two recorded decisions: "No client-side framework / 5.9 KB JS" and "No analytics…
  nothing to disclose" ([docs/decisions.md](../decisions.md)).
- It will also fail `check:budget` and probably `check:perf`.
- Record a new decision, load the script only on `/blog/*` post pages, and re-baseline budgets deliberately.

**If the host is a separate blog:** point the "Case B" links here as the canonical source for the case study.

## 8. On-page technical SEO

- **Schema:**
  - `Article` (or `TechArticle`) + `BreadcrumbList` + `Person` author. `usePostSeo` already emits these; see
    [app/composables/usePostSeo.ts](../../app/composables/usePostSeo.ts).
  - **Skip `HowTo`.** Google dropped HowTo rich results in 2023.
  - `FAQPage` markup is valid but no longer earns rich results for most sites. Add it only if the FAQ is visible on the
    page, per this repo's own rule in [docs/seo.md](../seo.md).
- **Images (6–8 total). Save them as WebP/AVIF, at most 1600 px wide, under 120 KB each after @nuxt/image:**

  | File | Alt text |
  |---|---|
  | `nuxt-lcp-devtools-lcp-marker.png` | "Chrome DevTools Performance panel with the LCP marker on the hero paragraph" |
  | `lcp-subparts-diagram.svg` | "Stacked bar splitting LCP into TTFB, load delay, load duration and render delay" |
  | `nuxt-bundle-treemap-before.png` / `-after.png` | "nuxi analyze treemap before/after removing full lodash import" (adjust to the real offender) |
  | `psi-field-data-before-after.png` | "PageSpeed Insights field data showing LCP moving from 4.5s to 2.2s" |
  | `og-fix-slow-lcp-nuxt.png` (1200×630, set via `image`/`imageAlt` frontmatter) | "Nuxt LCP 4.5s to 2.2s" |

  Rules: give every image `width`/`height`. Lazy-load everything below the fold. Don't preload anything in the article
  body.
- **Internal links:**
  - The dark-mode contrast post, from the CI-budgets section ("I apply the same check-it-in-CI approach to contrast").
  - Your home page's experience section, from the byline.
  - The tag pages `/blog/tag/performance` and `/blog/tag/nuxt`.
  - Plan companion posts to link both ways: "Preloading fonts per route in Nuxt", "Shipping Nuxt without hydration".
- **External links:** the section 5 sources. Open in the same tab, and add no `nofollow` to authoritative docs.
- **Article page speed:**
  - Shiki highlighting runs at build time, with zero runtime JS. Keep it that way; no client highlighter.
  - Images lazy-load below the fold.
  - The ad script loads `async`, only on post pages, with space reserved.
  - Re-run `npm run check:perf` on the post URL after ads go in, and publish that number too.

## 9. FAQ section

1. **Should I lazy-load my LCP image?** No. Explain `loading="eager"` + `fetchpriority="high"`, and why lazy delays
   discovery.
2. **Why is Lighthouse 95 but Search Console says my LCP is poor?** Lab vs field, p75, the 28-day CrUX window, and
   real devices and networks.
3. **Does preloading fonts improve LCP?** Sometimes it hurts. Cite your 1.35 → 1.5–1.7 s result, and preload only the
   above-the-fold face.
4. **Is SSG better than SSR for Core Web Vitals in Nuxt?** Usually for TTFB, but not for personalized pages. Mention
   `swr`/`isr` route rules as the middle ground.
5. **How do I reduce hydration cost without removing Vue?** Lazy hydration, `<ClientOnly>` misuse, and trimming
   the payload.
6. **Does bundle size affect LCP or just INP?** Both, when JS blocks render or competes for bandwidth. Name the
   route-level number that matters.
7. **How long until Search Console shows the improvement?** About 28 days of CrUX data, then "Validate fix".

## 10. Promotion and maintenance

- **Share (one post per venue, adapted, no link-dumping):**
  - dev.to or Hashnode, as a canonical-linked cross-post.
  - Reddit r/vuejs and r/Nuxt. Post the case-study table as the body and put the link in a comment, per each sub's rules.
  - The Nuxt Discord #showcase, only if the repro repo is included.
  - LinkedIn: the Lipak numbers as a short story.
  - Bluesky and X threads.
  - Newsletters: submit to Vue.js Developers and Frontend Focus via their submission forms.
- **Repurpose:**
  - A 6-post thread, one per subpart fix.
  - A 90-second screen recording of finding the LCP element in DevTools.
  - A "the font preload that made LCP worse" short post.
  - The repro repo README as a standalone guide.
- **Maintenance:**
  - Re-test on every Nuxt minor release and on each Lighthouse major.
  - Review when web.dev changes the CWV thresholds or metrics (INP replaced FID in 2024; watch for the next change).
  - Bump `updated` and the "Last tested with" line only when you actually re-test.
  - Check Search Console queries at 30 and 90 days, and add FAQ entries for questions people search but the post
    doesn't answer.

## 11. Pre-publish checklist

**SEO**
- [ ] Title ≤ 60 chars, and the description is 80–160 chars (the build enforces this)
- [ ] Slug `fix-slow-lcp-nuxt`, 1–5 tags (`nuxt`, `performance`, `core-web-vitals`)
- [ ] Primary keyword in the H1, the first 100 words and one H2; no stuffing
- [ ] OG image 1200×630 with `imageAlt` set
- [ ] Internal links and 6+ authoritative external links work (`nuxt-link-checker` passes)

**Readability**
- [ ] No banned phrases; read aloud once
- [ ] Every H2 opens with one sentence saying what the section fixes
- [ ] Paragraphs ≤ 4 lines; tables used instead of long lists of numbers

**Accuracy and code**
- [ ] Every snippet runs in the Nuxt 4.5 repro; versions stated
- [ ] Every number names its tool, device profile and run count
- [ ] Thresholds match web.dev on publish day

**E-E-A-T**
- [ ] Every [YOU] slot filled with specifics; NDA checked
- [ ] Author bio, photo, `rel="me"` links; `date` and `updated` set
- [ ] A "didn't help" list included

**AdSense and site**
- [ ] About, Contact and Privacy pages live and linked; CMP configured; `ads.txt` at the root of a custom domain
- [ ] `markdown-kitchen-sink` drafted or noindexed
- [ ] At most 3 ad slots, none next to code, TOC, pager or nav; heights reserved
- [ ] Post-ads Lighthouse re-run: CLS still ≈ 0 on the article itself

## Before drafting

Confirm these against live docs, because they change:
- Nuxt lazy-hydration syntax
- `<NuxtImg>` `preload` options
- Google's current CMP rules and FAQ rich-result rules
