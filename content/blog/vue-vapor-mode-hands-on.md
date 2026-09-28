---
title: "Vue 3.6 Vapor Mode: a hands-on guide with real benchmarks"
description: Vapor Mode compiles Vue components without the Virtual DOM. What it is, how to turn it on, what it refuses to compile, and how to measure it yourself.
date: 2026-10-06
tags: [vue, performance]
draft: true
---

Vue 3.6 adds a second way to compile a component. Vapor Mode skips the Virtual DOM entirely and
turns your template into direct DOM operations. You opt in one component at a time, with one
attribute.

That sounds like a free speed-up. It is not free, and whether it is a speed-up depends on what
your components actually do. This post covers what changes, how to turn it on, and how to
measure it on your own code instead of trusting anyone's chart, including mine.

> **Status on 29 September 2026:** Vue 3.6 is still a release candidate (`3.6.0-rc.9`, published
> 18 September). The latest stable is 3.5.43. Treat everything below as pre-release.

## What the Virtual DOM was doing for you

A normal Vue component renders a tree of plain JavaScript objects, the virtual nodes. When state
changes, Vue renders a new tree, compares it with the old one, and patches the real DOM where they
differ.

Vue's compiler already makes that diff cheap. It marks static parts of the template so they are
never compared, and it flags which attributes of a node can change. Even so, every update still
allocates a new tree and walks it.

Vapor Mode removes that step. The compiler knows at build time exactly which DOM node depends on
which piece of state, so it emits code that updates that node directly when the state changes.
Nothing is allocated and nothing is compared.

## Turning it on

It is a single attribute on `<script setup>`:

```vue
<script setup vapor lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <button type="button" @click="count++">
    Clicked {{ count }} times
  </button>
</template>
```

Everything you write inside stays the same: `ref`, `computed`, `watch`, props, emits and slots.
The component only compiles differently.

To mount a Vapor component, there are two options:

```ts
// An app made only of Vapor components
import { createVaporApp } from 'vue'
import App from './App.vue'

createVaporApp(App).mount('#app')
```

```ts
// An existing app: Virtual DOM at the root, Vapor components mixed in
import { createApp, vaporInteropPlugin } from 'vue'
import App from './App.vue'

createApp(App).use(vaporInteropPlugin).mount('#app')
```

The second option is the realistic one for existing code. It is also the only mode Nuxt supports
today, which the follow-up post on Nuxt covers.

## What it will not compile

Vapor is not a drop-in switch for every component. Before you add the attribute, check these:

- **Composition API only.** A component written with the Options API cannot be a Vapor component.
  It has to use `<script setup>`.
- **Template refs are different.** A ref to a Vapor child does not expose `$el`. Code that reaches
  into a child's root element needs rewriting.
- **Some built-in components do not work with Vapor children yet.** Check the release notes for
  your exact RC before you wrap a Vapor component in one of them.
- **Libraries are still Virtual DOM.** A component library keeps working through the interop
  plugin, but it gets none of the benefit. Only the components you mark are compiled differently.

> **TODO(you):** list the first thing that broke when you converted a real component, with the
> error message. That is the paragraph readers will search for.

## Benchmark it yourself

Published Vapor benchmarks usually mount tens of thousands of components in a synthetic loop.
That tells you how fast the runtime can be. It does not tell you whether *your* page gets faster.

Here is a harness for that. It mounts the same list twice, once as a normal component and once as
a Vapor component, and times mount and update:

```vue
<!-- RowsVapor.vue. RowsVdom.vue is identical, without the `vapor` attribute -->
<script setup vapor lang="ts">
defineProps<{ rows: { id: number; label: string; done: boolean }[] }>()
</script>

<template>
  <ul>
    <li v-for="row in rows" :key="row.id" :class="{ done: row.done }">
      {{ row.label }}
    </li>
  </ul>
</template>
```

```ts
// bench.ts: run in a production build (`vite build && vite preview`), never in dev mode
import { nextTick, ref } from 'vue'

export const rows = ref(
  Array.from({ length: 5000 }, (_, id) => ({ id, label: `Row ${id}`, done: false })),
)

export async function timeUpdate(label: string) {
  const start = performance.now()
  // Touch every 10th row: a realistic partial update, not a full re-render
  for (let i = 0; i < rows.value.length; i += 10) rows.value[i].done = !rows.value[i].done
  await nextTick()
  console.log(`${label} update: ${(performance.now() - start).toFixed(1)} ms`)
}
```

Three rules make the numbers worth publishing:

1. **Production build only.** Dev mode adds warnings and devtools hooks that swamp the difference.
2. **Throttle the CPU.** Use DevTools, Performance panel, CPU 4× slowdown. A fast laptop hides
   everything.
3. **Median of several runs.** The first run includes JIT warm-up. Report the median of 10.

| Scenario (5,000 rows, CPU 4× slowdown) | Virtual DOM | Vapor | Change |
| --- | --- | --- | --- |
| Initial mount | TODO ms | TODO ms | TODO |
| Update every 10th row | TODO ms | TODO ms | TODO |
| JS heap after mount | TODO MB | TODO MB | TODO |

> **TODO(you):** run the harness on `vue@3.6.0-rc.9` (or newer) and fill the table. State the
> machine, the browser version and the run count under it.

> **TODO(you):** one paragraph on what surprised you. Was the update gain larger than the mount
> gain? Was the heap difference visible at all at 5,000 rows?

## Where it is worth it, and where it is not

Vapor pays off where a component updates often or renders many instances: long lists, data
tables, dashboards that tick every second, and editors. That is where Virtual DOM allocation and
diffing are a real share of the work.

It pays off very little on a page that renders once and then sits there. A marketing page, a
blog post or a settings form spends its time on network, fonts and images, not on diffing. On this
site, for example, the posts ship almost no JavaScript at all, so Vapor has nothing to speed up.

My rule for now: convert the one component your profiler already blames, measure it, and stop
there until 3.6 is stable.

## Before you ship it

- Pin the exact RC version. Release candidates can still change behaviour between builds.
- Keep conversions small and reversible. Removing the `vapor` attribute should be the whole
  rollback.
- Re-run your benchmark on every RC bump and on the stable release.

When 3.6 goes stable, I will update this post with the stable version's numbers.
