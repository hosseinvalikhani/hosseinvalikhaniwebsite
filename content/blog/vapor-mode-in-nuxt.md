---
title: "Vapor Mode in Nuxt: setup and what breaks in interop mode"
description: Nuxt runs Vue Vapor Mode in interop mode only. How to enable it on a Vue 3.6 release candidate, and the five limits to check before converting.
date: 2026-10-27
tags: [nuxt, vue, performance]
draft: true
---

Nuxt can run Vue 3.6's Vapor Mode, but only one way. Your app stays a Virtual DOM app, and you opt
individual components or pages into Vapor. Nuxt calls this **interop mode**, and it labels the
whole feature experimental.

If you have not met Vapor Mode yet, start with my [hands-on Vapor Mode post](/blog/vue-vapor-mode-hands-on).
This one is only about the Nuxt side: the setup, and what breaks.

> **Status on 29 September 2026:** Vue 3.6 is a release candidate (`3.6.0-rc.9`). Nuxt's docs ask
> for `3.6.0-rc.2` or newer. Both the Vue API and the Nuxt integration may still change.

## Step 1: start from a fresh project

Nuxt's own recommendation is to try Vapor in a new project first, not an existing app. I agree.
When something breaks, you want to know whether Vapor caused it or your app did.

```bash
npm create nuxt@latest vapor-playground
cd vapor-playground
```

## Step 2: install a Vue 3.6 release candidate

Nuxt depends on Vue itself, so pin the version at the top level and force it for every
dependency:

```json
{
  "dependencies": {
    "vue": "3.6.0-rc.9"
  },
  "overrides": {
    "vue": "3.6.0-rc.9"
  }
}
```

That is the npm syntax. pnpm uses `pnpm.overrides` and Yarn uses `resolutions`. Check that only
one Vue is installed:

```bash
npm ls vue
```

Two versions of Vue in one app give you some of the strangest errors you will ever debug. Check
this before anything else.

## Step 3: enable Vapor in the config

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  vue: {
    vapor: true,
  },
})
```

This installs Vue's `vaporInteropPlugin`, which lets Vapor and Virtual DOM components render side
by side. It does not convert anything by itself.

## Step 4: opt a component in

Add `vapor` to `<script setup>`:

```vue
<!-- app/components/PriceTable.vue -->
<script setup vapor lang="ts">
const props = defineProps<{ rows: { id: number; name: string; price: number }[] }>()
const total = computed(() => props.rows.reduce((sum, r) => sum + r.price, 0))
</script>

<template>
  <table>
    <tbody>
      <tr v-for="row in rows" :key="row.id">
        <td>{{ row.name }}</td>
        <td>{{ row.price }}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr><td>Total</td><td>{{ total }}</td></tr>
    </tfoot>
  </table>
</template>
```

Auto-imports like `computed` keep working. A page component can take the attribute too.

## What interop mode actually means

The root of your app is always a Virtual DOM component. Nuxt's own components, like `<NuxtPage>`,
`<NuxtLayout>` and `<NuxtLink>`, are Virtual DOM components. So is every component from a UI
library.

So "Nuxt with Vapor" means islands of Vapor inside a Virtual DOM app. The speed-up is limited to
what happens *inside* those islands. Converting one heavy table can matter. Converting a page made
of library components will not.

## The five limits to check before you convert

Nuxt's docs list these. Each one comes with the symptom you would actually see:

| Limit | What you will see |
| --- | --- |
| The app root stays Virtual DOM; full Vapor apps are not supported | Only the components you mark get faster |
| Template refs to a Vapor component do not expose `$el` | Code like `childRef.value.$el.focus()` fails |
| Some built-in components cannot read Vapor slot children | A built-in wrapping Vapor content may not see it. Test each wrapper you use |
| The Options API is not supported | Components need `<script setup>` first |
| Nuxt composables called after an `await` may lose their context | An error that a composable ran outside the Nuxt context |

The last one is the easiest to hit. In Nuxt, a composable like `useRoute()` or `useState()`
needs to know which app it belongs to. After an `await`, that context can be gone:

```ts
// Risky inside a Vapor component
const data = await $fetch('/api/prices')
const route = useRoute() // may run without the Nuxt context

// Safe: call composables first, then await
const route = useRoute()
const data = await $fetch('/api/prices')
```

Calling composables before the first `await` is good practice in any Nuxt component. In a Vapor
component it is required.

## What broke in my own test

> **TODO(you):** convert two or three components in the playground, including one that uses a
> template ref and one that wraps slot content. Record each error message and its fix. That is
> the section people will land on from search.

> **TODO(you):** did SSR and hydration of the Vapor component work without warnings? Paste the
> console output, or say that it was clean.

## Should you use it in production yet?

Not on a release candidate, and not in an app you cannot roll back easily. The good news is that
rollback is one attribute. Removing `vapor` from `<script setup>` turns the component back into a
normal one.

What I would do today is benchmark one heavy component in a branch, keep the numbers, and wait for
Vue 3.6 stable plus a Nuxt release that drops the experimental label. I will update this post when
that happens.
