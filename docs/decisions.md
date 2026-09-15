# Decisions

Why things are the way they are — and, for each, **what would change them**. A decision whose
reasoning is lost gets re-litigated by whoever inherits it, usually badly.

---

## No client-side JavaScript framework

**Decision.** `features.noScripts` removes Nuxt's client bundle. Three controls are wired by hand
in `public/enhance.js`.

**Why.** The framework floor measured **88 KB gzipped** against a 90 KB budget — 98% before any of
this site's own code — and none of it was doing work. Every page is prerendered; hydration existed
so three controls could respond to a click. JS per route went 98–119 KB → **5.9 KB**.

**What it costs.** No client-side routing, no reactive state in components, interactivity is
hand-written.

**What would change it.** Genuinely reactive UI — a search box filtering as you type, a comment
form. Then either write it in `enhance.js`, or reverse this deliberately and pay the 88 KB back.
**Do not half-reverse it** by re-enabling hydration for one page; you would pay the full framework
cost for one feature.

---

## No component library

**Decision.** No Nuxt UI, no reka-ui, no headless library.

**Why.** The interactive surface is a dialog, a theme toggle and a copy button. `<dialog>` +
`showModal()` gives a focus trap, `inert` background, Escape, focus restoration and the top layer
— correctly, for free. A library would ship thousands of lines to approximate what the platform
already does.

**What would change it.** A combobox, a date picker, or anything with a genuinely hard interaction
model. Those are worth a dependency; a dialog is not.

---

## No `cva` / `tailwind-variants`

**Decision.** `app/design/variants.ts`, 15 lines.

**Why.** Those libraries exist mainly to *merge* conflicting classes, which is only a problem when
components accept arbitrary class overrides from callers. Ours don't.

**What would change it.** Components needing to accept overrides. But treat that as the signal:
a component that needs an override usually needs another variant.

---

## No icon runtime

**Decision.** 13 icons as path data in `app/design/icons.ts`.

**Why.** `@nuxt/icon` + `@iconify/vue` resolve names at runtime and fetch anything unbundled over
the network. For 13 icons: ~2 KB, zero requests.

**What would change it.** Needing dozens more, or user-selectable icons.

---

## Three colour tiers, and a lint rule enforcing them

**Decision.** Ramps → semantic roles → utilities. `text-slate-400` is an error outside
`components/ds/**`.

**Why.** A ramp step names a *colour*; a semantic token names a *role*. The ramp step is correct
today and wrong the moment the theme flips.

**What would change it.** Nothing. This is the spine of the design system.

---

## `accent` and `accent-text` are separate tokens

**Decision.** Two tokens for one brand colour.

**Why.** Nuxt green is 11.1:1 on ink and **1.8:1 on white** — a superb fill and an unreadable
typeface. On light, type steps down to the 700 value.

**What would change it.** A brand colour that passes on both grounds.

---

## Text tiers moved a ramp step (Phase 12)

**Decision.** `fg-subtle` holds Mist `#94A3B8`; `fg-muted` moved to slate-300 (dark) / slate-700
(light).

**Why.** `fg-subtle` was slate-500 — **3.46:1 on raised**. It carries post dates, reading time,
table headers and the footer line: all ordinary 13–14px text, all needing 4.5:1. A real 1.4.3
failure in the default theme, on every page. The name invites the wrong assumption; "de-emphasised"
does not mean "exempt".

**What would change it.** Nothing, and `npm run check:contrast` now fails if it drifts back.

---

## Fonts are preloaded per route

**Decision.** Inter always; JetBrains Mono only on pages containing `<pre`.

**Why.** All three combinations were measured:

| | Result |
|---|---|
| Neither | CLS 0.159 on a long post — `swap` reflows the article when the real face lands |
| Both | CLS 0 everywhere, but home-page LCP 1.5–1.7 s: 79 KB of high-priority fonts contend with the stylesheet that unblocks paint |
| **Inter always, mono where earned** | **CLS 0, LCP a stable 1.35 s** |

Mono shifts a page in proportion to how much of it is set in mono. Eyebrows and dates are a few
short strings the metric-override fallback absorbs; a post full of code blocks is different.
`<pre` asks what the page *contains* rather than what its route is called.

**What would change it.** A third family, or mono becoming load-bearing above the fold.

---

## CSS is inlined into every page

**Decision.** The stylesheet is inlined at prerender time.

**Why.** 6.8 KB brotli, one render-blocking request. Removing the round trip is worth **74 ms** of
LCP on the home page and **151 ms** on a post.

**What it costs.** CSS is no longer separately cached across pages. At this size, on a 13-page site
that prerenders the next navigation, that trade is clearly worth it — and LCP is measured on the
visit where nothing is cached anyway.

**What would change it.** CSS growing past ~15 KB, or the site growing to hundreds of pages.

**The trap it set.** `url(../_fonts/…)` is relative to the stylesheet. Inlined, it resolves against
the *page* — correct at `/`, 404 on `/blog/tag/css`. Every `url()` is now absolutised first.

---

## One offset for hash targets, on the scrolling box

**Decision.** `scroll-padding-top` on `html` only. No `scroll-margin-top` on targets.

**Why.** They **add**, they don't reinforce. Sections were landing 176px down instead of 88. It
also broke the nav indicator, which reasonably assumed a target lands where scroll-padding says.

**What would change it.** Needing a *different* offset for one element — then scroll-margin on
that element, knowingly.

---

## `overflow-x: clip`, never `hidden`

**Decision.** `.ds-glow` uses `clip`.

**Why.** `hidden` forces the other axis to `auto`, making it a scroll container — which breaks
`position: sticky` for descendants. `clip` does neither and leaves `overflow-y` genuinely visible.

**The trap it set.** Clipping hides overflow rather than revealing it as a scrollbar: the display
heading was silently *cut off* at 320px. `tests/e2e/responsive.spec.ts` checks for clipped content
separately from page overflow.

---

## Lighthouse CLI, not Lighthouse CI

**Decision.** `scripts/check-lighthouse.mjs`.

**Why.** `lhci autorun` cannot complete on Windows — chrome-launcher `EPERM`, third run, every
time. A check that runs on one OS is a check people skip.

**What would change it.** The upstream bug being fixed. The budget table is data in one object; the
runner is swappable.

---

## LCP budget is 1600 ms, not the plan's 1500 ms

**Decision.** Approved relaxation.

**Why.** Three routes measure a stable 1353 ms. The home page measures 1503.9 ms — reproducible,
because it needs one more simulated round trip: 150 ms at Lighthouse's RTT, a congestion-window
boundary between an 11 KB and a 12 KB document. A budget 4 ms inside a metric that quantises in
150 ms steps measures which side of a TCP window the HTML landed on.

**What would change it.** Real content replacing the placeholders — document size is exactly what
moves this. **Re-measure then.**

---

## `vuejs-accessibility/aria-props` is off

**Decision.** Disabled globally.

**Why.** `aria-current-value` is NuxtLink's **prop**, not a DOM attribute. A template linter can't
tell the difference and flags every one. The rule has no option to teach it otherwise.

**Nothing is lost.** axe's `aria-valid-attr` is the same check, run against rendered DOM in
`tests/e2e/a11y.spec.ts`, where NuxtLink has consumed the prop and only real attributes remain.
That is the more truthful place to ask.

---

## `aria-current="false"` is deliberate

**Decision.** Home-page section links render `aria-current="false"` rather than nothing.

**Why.** Vue Router treats every `/#section` link as exact-active while you're on `/` — it ignores
the hash when matching — so all five claimed to be the current page. Supplying the *value* fixes
it, and gives `enhance.js` an attribute to update rather than invent.

**The trap it set.** `[aria-current]` is an attribute-**presence** selector: it matches `"false"`
too. Every nav item rendered as current. Always `:not([aria-current="false"])`.

---

## `role="list"` on a styled `<ol>` is not redundant

**Decision.** Kept, with a targeted lint suppression.

**Why.** `list-style: none` strips list semantics from an `<ol>` in Safari/VoiceOver, losing the
"3 items, item 1 of 3" that makes chronology audible — the whole point of the Experience section.

---

## The deploy still carries ~6 MB nothing can fetch

**Status: open. Not yet fixed.**

Of 7.9 MB output, roughly 6 MB is unreachable:

- **`_og-static-fonts` (4.4 MB)** — Satori's fonts. Every OG image is already prerendered to PNG.
- **`sqlite3.wasm` (1.6 MB)** — Nuxt Content's client database. Nothing can load it; there is no
  client JavaScript.

No visitor transfers any of it, so it never touched the byte budgets. It is deploy and CDN storage
waste. Pruning means deleting build output, which belongs with the Phase 16 host decision — and
needs care, because a future change that reintroduces client JS or runtime OG generation would
need those files back.

---

## Things deliberately *not* done

- **No analytics.** Nothing to configure, nothing to disclose, no third-party origin in the CSP.
- **No contact form.** A `mailto:` link, shown as text so it can be copied or read aloud. A form
  needs a third-party endpoint or a server route; neither earns its place before anyone has asked
  to be contacted through one.
- **No proficiency bars on skills.** Unverifiable, and "70%" conveys nothing actionable.
- **No `text-rendering: optimizeLegibility`.** Delays first paint for kerning nobody notices at
  these sizes.
- **Tag chips and breadcrumb links stay at 27–30px.** Above the WCAG 24px minimum, below the
  project's own 44px bar. Raising them would visibly bloat a chip row; the alternative is
  expanding the hit area with a pseudo-element. Recorded rather than silently accepted.
