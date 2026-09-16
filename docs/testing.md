# Testing and CI

Nine checks. `npm run verify` runs all of them in the order CI does — fastest failure first, so a
typo isn't reported after a build and a browser download.

---

## The governing idea

> **A check that cannot fail is worse than no check, because it reads as coverage.**

This is not abstract. Three checks in this project silently passed while measuring nothing:

- The **raw-ramp lint rule** was written as a core `no-restricted-syntax` rule. Core ESLint rules
  never traverse Vue template AST — it matched nothing and reported clean forever.
- The **budget script** counted only `/_nuxt/` paths, stepping straight over `/enhance.js`, the
  one script the site has, and reporting 0 KB.
- An **image-dimensions check** used a `\b` word boundary that collapsed to a literal backspace
  character. It matched no `<img>` at all, and `.every()` over an empty array returns `true`.

Hence the habit: **when you add a check, prove it fails.** `tests/lint-rules.spec.ts` feeds the
lint rules a violation and asserts they catch it.

---

## The nine checks

| # | Command | Asserts |
|---|---|---|
| 1 | `npm run typecheck` | `vue-tsc`, zero errors |
| 2 | `npm run lint` | ESLint + `vuejs-accessibility` + the raw-ramp ban |
| 3 | `npm test` | 28 unit tests |
| 4 | `npm run generate` | The build succeeds (and `nuxt-link-checker` reports no broken internal links) |
| 5 | `npm run check` | The output rendered, and its metadata is sound |
| 6 | `npm run check:contrast` | Every token pair, both themes |
| 7 | `npm run check:budget` | Per-route JS and CSS transfer |
| 8 | `npm run test:e2e` | 60 browser tests — axe, interactions, navigation, responsive, assets |
| 9 | `npm run check:perf` | The Lighthouse budget table |

Checks 5–9 read `.output/public`, so `generate` must have run.

---

## Unit tests — `tests/unit/`

`vitest`, happy-dom. **Only pure logic lives here.** Anything needing a rendered page is an e2e
test against the *built* output, because this site ships no client framework: mounting a component
in a test renderer would exercise a code path production doesn't have.

- `format-date.spec.ts` — including the timezone case. `formatDate` appends `T00:00:00Z` so a
  published date doesn't shift by a day for readers west of Greenwich.
- `tags.spec.ts` — slugging, idempotence, URL safety.
- `reading-time.spec.ts` — both line endings, and idempotence.

---

## Lint rule tests — `tests/lint-rules.spec.ts`

Runs ESLint programmatically over synthetic components:

```ts
const messages = await lint(component('text-slate-400'), 'app/components/home/Probe.vue')
expect(messages.map(m => m.ruleId)).toContain('vue/no-restricted-syntax')
```

Also asserts the exemptions work (`app/components/ds/**` and the style guide may use ramp steps)
and that the accessibility plugin is live.

---

## End-to-end — `tests/e2e/`

Playwright, Chromium, against `.output/public` served by `scripts/serve-output.mjs`.

**Never the dev server.** `features.noScripts` is production-only, so in dev the page still
hydrates and the test would exercise the one code path these tests exist to rule out.

| File | Covers |
|---|---|
| `a11y.spec.ts` | axe on 5 routes × 2 themes; skip link; heading order |
| `interactions.spec.ts` | Theme toggle, drawer, copy button — everything Phase 13 rewrote |
| `navigation.spec.ts` | The section indicator and hash-target offsets |
| `responsive.spec.ts` | Overflow, clipping, target size at 4 widths |
| `assets.spec.ts` | Every route loads everything it asks for |

### Why both themes

Nearly every rule axe can fail is a colour rule, and a colour rule only fails in the theme whose
values are wrong. Phase 12 found a contrast failure that existed **only in the default theme**, on
every page.

### `navigation.spec.ts` waits for events, not for durations

Every wait in that file used to be a `waitForTimeout`, and CI eventually failed on one: the hash
landing test read `#contact` at 147px against a 129px limit, then 158px on the retry, for a
position that settles at 89px. Nothing was wrong with the page. `scroll-behavior: smooth` animates
the landing, the jump to `#contact` is ~2700px and takes **~900ms** to settle, and the test waited
600. It had only ever passed because the machines it ran on were fast enough to make a 600ms guess
look like a fact.

Two habits came out of it:

- **Wait for the condition, not for a duration.** `settleScroll()` polls the scroll position until
  it stops moving; the indicator assertions use `expect.poll`. Both fail the same way they used to
  when the behaviour is actually wrong — reintroducing the stacked-offset bug gives a *settled*
  177px, which no amount of waiting turns into a pass.
- **Run a flaky-looking spec on its own.** A second race in the same file failed 5 times out of 5
  in isolation and had never failed in the suite: the other tests were slowing the page down past
  the moment `enhance.js` starts listening. Parallel load is not a fixture, and CI's scheduling is
  not yours.

### `assets.spec.ts` earns its place

Inlining the stylesheet moved `url(../_fonts/x.woff2)` into the page, where a relative URL
resolves against the *page* — correct at `/`, and 404 on `/blog/tag/css`. The page still rendered,
in Arial, with two console 404s and nothing thrown. It was caught by a Lighthouse best-practices
score of 96 on one nested route.

The lesson generalises: **test nested routes**, because the root path is the one depth at which
relative paths accidentally work.

---

## The script checks — `scripts/`

| Script | Catches |
|---|---|
| `check-output.mjs` | A component that didn't resolve; metadata; draft leaks |
| `check-contrast.mjs` | Token pairs below AA, in either theme |
| `check-budget.mjs` | Per-route transfer size |
| `check-lighthouse.mjs` | The Phase 13 budget table |
| `serve-output.mjs` | (not a check — serves the build the way a host would) |
| `static-404.mjs` | (not a check — replaces the SPA shell) |

### Why `serve-output.mjs` serves brotli

Not a nicety. Measuring uncompressed transfer under Lighthouse's throttling inflated LCP from
1.5 s to 2.0 s and made the site look like it was failing its budget. **The rig was wrong, not the
site.** Any performance number measured without compression is fiction.

### Why `check-lighthouse.mjs` isn't Lighthouse CI

The plan specified `lhci autorun`. It cannot complete on Windows: chrome-launcher throws `EPERM`
removing its temp profile, on the third run, every time. A check that only runs on one operating
system is a check people learn to skip.

The replacement asserts the same table, and does two things deliberately:

- **Treats the exit code as a hint, not a verdict.** That EPERM fires *after* the report is
  written. Trusting the code throws away a perfectly good measurement. The report file is the
  source of truth; a non-zero exit with no readable report still raises.
- **Takes a median of several runs.** A single run swings ±0.2 s on a busy machine.

### The LCP budget is 1600 ms, not 1500 ms

Deliberate and approved. Three routes measure a stable **1353 ms**; the home page measures
**1503.9 ms** — reproducible across five runs, because it needs one more simulated round trip
(150 ms at Lighthouse's RTT, a congestion-window boundary between an 11 KB and a 12 KB document).

A budget sitting 4 ms inside a metric that quantises in 150 ms steps measures which side of a TCP
window the HTML landed on, not the site. **Revisit this when real content replaces the
placeholders** — document size is exactly what moves it.

---

## CI

`.github/workflows/ci.yml`, on push to `main` and every PR. One job, `npm ci`, then the nine
checks in `verify` order.

The build is its own step rather than being left to Playwright's `webServer`, so a build failure
is reported as a build failure and not as a web server that timed out. Traces upload only on
failure. Concurrency cancels a superseded run.

---

## Adding a check

1. Write it.
2. **Break the thing it checks and watch it fail.** If it doesn't, the check is wrong — that has
   happened three times here.
3. Fix the thing.
4. Add it to `verify` in `package.json`, positioned by how fast it fails.
5. Add a CI step.

---

## Still manual, every release

axe finds roughly a third of WCAG issues and none of the ones about meaning:

- Screen-reader pass (NVDA/Firefox, VoiceOver/Safari): nav → hero → a post
- Windows High Contrast
- 200% zoom and 400% reflow
- Whether the alt text is *right*, which no tool can tell you
- Rich Results Test, an OG debugger, a JavaScript-disabled read-through
