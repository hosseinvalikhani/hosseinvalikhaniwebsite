---
title: Vue interview questions, answered and explained
description: Fifteen Vue 3 interview questions with the answer an interviewer wants, the follow-up they will ask next, and the code that shows you understand it.
date: 2026-11-10
tags: [vue, career]
draft: true
---

A good Vue interview does not test whether you memorized the docs. It tests whether you understand
why Vue works the way it does. Every question below has three parts: a short answer, a code
example where it helps, and the follow-up question that usually comes next.

All answers are for Vue 3.5 with the Composition API and `<script setup>`.

> **TODO(you):** one sentence on where these come from. For example, questions you were asked,
> questions you ask as a reviewer, or both.

## Reactivity

### 1. What is the difference between `ref` and `reactive`?

`ref` wraps any value, primitives included, and you read it through `.value`. `reactive` makes an
object deeply reactive, and you use it without `.value`.

```ts
const count = ref(0)
count.value++

const form = reactive({ name: '', email: '' })
form.name = 'Ada'
```

**Follow-up: which do you use by default?** `ref`. It works for every type, and it survives
destructuring and being passed around. A `reactive` object loses reactivity if you destructure it
or replace it as a whole.

### 2. Why does destructuring a reactive object break it?

Reactivity lives on the proxy's property access. `const { name } = form` copies the current value
into a plain variable, so later changes are not tracked. Use `toRefs(form)` to get refs for each
property.

**Follow-up: what about props?** Since Vue 3.5, destructuring `defineProps()` in `<script setup>`
stays reactive. The compiler rewrites the variable into `props.name` for you. In a `watch`, you
still pass a getter: `watch(() => name, ...)`.

### 3. `computed` vs `watch` vs `watchEffect`?

- `computed` **derives** a value. It is cached and should have no side effects.
- `watch` **reacts** to a specific source with a side effect, and gives you old and new values.
- `watchEffect` runs a side effect immediately and re-runs it when anything it read changes.

```ts
const fullName = computed(() => `${first.value} ${last.value}`)

watch(userId, async (id) => {
  user.value = await fetchUser(id)
})
```

**Follow-up: when would you pick `watch` over `watchEffect`?** When you need the old value, when
you want to skip the first run, or when you want to control exactly what triggers it.

### 4. When would you use `shallowRef`?

When you hold a large object or list that you replace as a whole, rather than mutate. Only
`.value` itself is reactive, so Vue skips creating a proxy for every nested object. It is also
the right choice for values that should never be reactive, like a chart library instance.

## Components

### 5. How do parent and child components communicate?

Props go down and events go up. For two-way binding, `defineModel()` (Vue 3.4+) wires a prop and
an `update:` event together:

```vue
<!-- SearchInput.vue -->
<script setup lang="ts">
const query = defineModel<string>({ required: true })
</script>

<template>
  <input v-model="query" type="search">
</template>
```

**Follow-up: what about distant components?** Use `provide` and `inject` for a subtree, like a
form and its fields. Use Pinia for truly global state.

### 6. What does the `key` attribute do in `v-for`?

It gives each item an identity, so Vue can move existing DOM nodes instead of re-creating them or
patching the wrong one. Without a stable key, a list of inputs can show the wrong value in the
wrong row after a reorder.

**Follow-up: why not use the index as the key?** The index changes when items are inserted or
removed, so it is not an identity. It is fine only for static lists.

### 7. `v-if` vs `v-show`?

`v-if` adds and removes the element. `v-show` toggles `display: none`. Use `v-show` for things that
toggle often. Use `v-if` for things that rarely appear, or that should not render at all, such as
content that needs permissions.

### 8. How do you access a DOM element?

Since Vue 3.5, use `useTemplateRef`:

```vue
<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'

const input = useTemplateRef<HTMLInputElement>('search')
onMounted(() => input.value?.focus())
</script>

<template>
  <input ref="search">
</template>
```

**Follow-up: why is it `null` in `setup`?** The element does not exist until the component is
mounted.

## Rendering and lifecycle

### 9. What does `nextTick` do?

Vue batches DOM updates and applies them asynchronously. `await nextTick()` waits until the DOM
reflects your latest state changes, for example before you measure an element that just
appeared.

### 10. Which lifecycle hooks run during server-side rendering?

Only `setup` itself (plus `onServerPrefetch`). `onMounted` and `onUpdated` never run on the
server. That is why browser-only code, like `window` or `localStorage`, belongs in `onMounted`.

### 11. What is a hydration mismatch?

The server rendered HTML, and the client's first render produced something different. Vue warns
about it and patches the difference, which costs performance and can briefly show the wrong
content. Common causes are dates, random values and browser-only checks. I cover them in a
separate post on hydration errors in Nuxt.

## Architecture

### 12. What is a composable, and when do you write one?

A function that uses Vue's reactivity to encapsulate stateful logic. By convention it is named
`useSomething`. Write one when the same logic appears in two components, or when a component's
setup is doing two unrelated jobs.

```ts
export function useOnline() {
  const online = ref(true)
  const update = () => (online.value = navigator.onLine)
  onMounted(() => {
    update()
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
  })
  onUnmounted(() => {
    window.removeEventListener('online', update)
    window.removeEventListener('offline', update)
  })
  return { online }
}
```

**Follow-up: what does the cleanup in `onUnmounted` prevent?** Leaked listeners that keep firing
after the component is gone.

### 13. Composable or Pinia store?

A composable creates **new state per call**. A Pinia store is **one shared instance**, with
devtools support and SSR-safe state. Use a store when several unrelated components need the same
state. Use a composable for reusable logic.

**Follow-up: why not a module-level `ref` as a global store?** In SSR, module state is shared
between all requests on the server, so one user's data can leak into another user's page.

### 14. How did you migrate from the Options API to the Composition API?

This is an experience question, so answer it with a real project. I led this migration at Lipak.

> **TODO(you):** your real answer in 4 to 5 sentences. Cover how you sequenced it (leaf
> components first, or by feature?), what you did about mixins, how you kept it reviewable, and
> the documentation you wrote so the team kept the new patterns.

### 15. How would you make a slow Vue page faster?

Measure first: DevTools Performance panel, Lighthouse and the Vue DevTools profiler. Then match the
fix to the cause. Split big bundles with lazy routes and async components. Use `shallowRef` for
big data, virtualize long lists, add `v-memo` on stable rows, and lazy-hydrate below-the-fold
components in Nuxt.

**Follow-up: give a real example with numbers.**

> **TODO(you):** the Lipak one: the build went from 65 MB to 11 MB and LCP from 4.5 s to 2.2 s.
> Add one sentence on the single change that mattered most.

## How to use this list

Do not memorize the answers. For each question, write the code yourself and break it on purpose:
destructure the reactive object, drop the key, call `window` in `setup`. The interviewer's
follow-up is almost always "what happens if…", and having seen it break is the best answer.
