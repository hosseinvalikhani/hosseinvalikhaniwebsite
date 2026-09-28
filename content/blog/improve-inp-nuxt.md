---
title: How I improved INP in a Nuxt app, with measured results
description: INP measures how long your page ignores a click. How to find the slow interaction in a Nuxt app, which of its three parts is slow, and the fixes that moved it.
date: 2026-09-29
tags: [nuxt, performance, core-web-vitals]
draft: false
---

Interaction to Next Paint (INP) measures one thing: after someone clicks, taps or types, how long
until the page visibly responds. Google counts it as good at **200 ms or less** and poor above
**500 ms**, measured at the 75th percentile of real visits.

On the production Nuxt app I work on at Lipak, INP is now under 200 ms. This post covers how to
find the slow interactions, how to tell which part of each one is slow, and the fixes that apply
in Nuxt.

> **TODO(you):** the starting INP at Lipak, and where you saw it: Search Console, PageSpeed
> Insights field data or your own RUM. One sentence on which page was worst.

## Lab tools will not find your INP problem

Lighthouse does not measure INP, because nobody clicks anything during a Lighthouse run. Its
closest proxy is Total Blocking Time, which tells you the main thread is busy during load. It does
not tell you which button feels slow ten minutes later.

INP comes from real users on real devices. So the first job is to collect it from them, with the
element that caused it attached.

## Step 1: log the slow interaction and its target

The `web-vitals` library has an attribution build that tells you *which* element was involved and
*where* the time went:

```ts
// app/plugins/inp.client.ts
import { onINP } from 'web-vitals/attribution'

export default defineNuxtPlugin(() => {
  onINP(({ value, rating, attribution }) => {
    // Send this to your analytics endpoint. console.log is fine while you investigate.
    console.log({
      inp: Math.round(value),
      rating,
      target: attribution.interactionTarget,
      inputDelay: Math.round(attribution.inputDelay),
      processing: Math.round(attribution.processingDuration),
      presentation: Math.round(attribution.presentationDelay),
    })
  })
})
```

The `.client.ts` suffix matters: the plugin runs only in the browser, never during SSR.

## Step 2: find which of the three parts is slow

Every interaction splits into three parts, and each part has different fixes:

| Part | What it is | Typical Nuxt cause |
| --- | --- | --- |
| Input delay | The click waits for the main thread to be free | Hydration still running, third-party scripts, a long timer callback |
| Processing duration | Your event handlers run | A handler that filters a large array, or updates a large reactive object |
| Presentation delay | The browser recalculates style, lays out and paints | Re-rendering a big component tree, or layout thrashing |

Fixing the wrong part is the most common waste of time with INP. If input delay dominates, making
your handler faster changes nothing.

> **TODO(you):** which part dominated at Lipak? A small table of the worst interaction's three
> numbers, before and after, is the most useful thing in this post.

## Fix: input delay from hydration

A Nuxt page is not interactive until Vue has hydrated it. A click that lands during hydration
waits for all of it. The fix is to hydrate less, and later.

Nuxt supports lazy hydration on any component with the `Lazy` prefix:

```vue
<template>
  <!-- Hydrates only when scrolled into view -->
  <LazyProductReviews hydrate-on-visible />

  <!-- Hydrates when the browser is idle -->
  <LazyNewsletterForm hydrate-on-idle />
</template>
```

The component still renders on the server, so the content and SEO are unchanged. Only its
JavaScript waits.

**When not to:** do not lazy-hydrate something users click right away, like the main navigation.
The first click would then pay for the hydration.

## Fix: input delay from third-party scripts

Chat widgets, tag managers and A/B testing scripts all run on your main thread. Load them after
the page is interactive, not in the `<head>`:

```ts
// Loads the script once the browser is idle instead of during hydration
useScript('https://example.com/widget.js', {
  trigger: 'onNuxtReady',
})
```

`useScript` comes from `@nuxt/scripts`. A plain `onNuxtReady` callback that injects the script
works too.

## Fix: processing duration in your handlers

Two patterns are behind many slow handlers in Vue apps.

**Deep reactivity on big data.** A `ref` holding 5,000 objects makes every object deeply reactive.
If you replace the list rather than mutating items, use `shallowRef`:

```ts
// Before: 5,000 deeply reactive proxies
const rows = ref<Row[]>([])

// After: only `.value` is reactive, which is all a replace-the-list pattern needs
const rows = shallowRef<Row[]>([])
rows.value = await fetchRows()
```

**Doing everything before the paint.** When a handler updates the UI *and* does something
expensive, update the UI first, then yield to the browser so it can paint before the rest runs:

```ts
function yieldToMain() {
  // scheduler.yield() where available, a macrotask everywhere else
  if ('scheduler' in globalThis && 'yield' in (globalThis as any).scheduler) {
    return (globalThis as any).scheduler.yield()
  }
  return new Promise(resolve => setTimeout(resolve, 0))
}

async function onFilterChange(value: string) {
  filter.value = value       // the input updates immediately
  await yieldToMain()        // let the browser paint that
  results.value = expensiveFilter(allRows.value, value)
}
```

> **TODO(you):** name the handler at Lipak that was slowest, and what it was doing.

## Fix: presentation delay from big re-renders

If a click re-renders a large tree, the browser pays for the style and layout of all of it.

- **Virtualize long lists.** Render only the rows on screen. TanStack Virtual has a Vue adapter.
- **Split big components.** A change in one field of a 60-field form should not re-render all 60.
- **Use `v-memo` on rows that rarely change.** It skips re-rendering a subtree unless the values you
  list change.

This is also the part Vue 3.6 Vapor Mode targets. My [hands-on Vapor Mode post](/blog/vue-vapor-mode-hands-on)
has a benchmark harness for exactly this kind of list.

## The results

| Metric (field data, p75) | Before | After |
| --- | --- | --- |
| INP | TODO ms | under 200 ms |
| LCP | 4.5 s | 2.2 s |
| CLS | TODO | under 0.01 |

> **TODO(you):** fill the INP before value, the CLS before value and the date range of the field
> data. Add a "didn't help" list of anything you tried that changed nothing. It is the most
> convincing part of a performance post.

## Keep it fixed

INP regresses quietly, because every new feature adds a little main-thread work. Keep the
`web-vitals` plugin running in production, alert on the p75, and look at the attribution before
you guess.
