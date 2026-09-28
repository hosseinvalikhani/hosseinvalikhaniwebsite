---
title: Fixing Nuxt hydration mismatch errors
description: A hydration mismatch means the server and the browser rendered different HTML. The seven usual causes in Nuxt, how to find yours, and each fix.
date: 2026-09-29
tags: [nuxt, vue, debugging]
draft: false
---

You open the console and see it:

```bash
[Vue warn]: Hydration text mismatch in <span>
  - rendered on server: "10:42"
  - expected on client: "10:43"
Hydration completed but contains mismatches.
```

It means the HTML the server sent does not match what Vue rendered in the browser for the same
component. Vue patches the difference, so the page usually still works. But the patch costs time,
and the user can see content jump or flash. In the worst case, event listeners end up attached to
the wrong elements.

> **TODO(you):** one or two sentences on a hydration mismatch you hit in production: what the
> symptom was, and how long it took to find.

## Why it happens

In Nuxt, a page renders twice. The server renders it to HTML. Then the browser runs the same
components again to attach interactivity, which is called hydration. Vue expects both renders to
produce the same result.

So every mismatch has the same root: **something in your render depends on where or when it
runs.**

## Step 1: find the component

In development, Vue names the element and shows both values, as in the example above. Start
there.

In a production build the details are stripped to save bytes. You can turn them back on for a
debugging build:

```ts
// nuxt.config.ts: for a debugging build only, not for production traffic
export default defineNuxtConfig({
  vite: {
    define: {
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
    },
  },
})
```

If the warning points at a large component, delete half of its template and check again. Keep
halving until you find it.

## The seven usual causes

### 1. Dates and times

The server renders at one moment in one time zone. The browser renders a little later, in the
user's time zone.

```vue
<!-- Mismatches: the server's clock and time zone are not the user's -->
<span>{{ new Date().toLocaleTimeString() }}</span>
```

**Fix:** render times on the client only, or render a stable value on the server and format it
after mount. Nuxt's `<NuxtTime>` component handles this for you:

```vue
<NuxtTime :datetime="post.date" date-style="medium" />
```

### 2. Random values

`Math.random()` or a random ID gives a different result on each render.

**Fix:** for IDs, use `useId()`. It produces the same value on the server and the client. For
anything else that is random, generate it once on the server and pass it through `useState`:

```ts
const seed = useState('banner-seed', () => Math.random())
```

`useState` serializes the value into the page payload, so the client reuses the server's value
instead of making a new one.

### 3. Browser-only APIs in `setup`

`window`, `localStorage`, `matchMedia` and `navigator` do not exist on the server. Code that
branches on them renders one thing on the server and another in the browser.

```ts
// Mismatch: the server always takes the first branch
const isMobile = import.meta.client && window.innerWidth < 768
```

**Fix:** start with the server-safe value, and update it in `onMounted`:

```ts
const isMobile = ref(false)
onMounted(() => {
  isMobile.value = window.matchMedia('(max-width: 767px)').matches
})
```

For layout differences, prefer CSS media queries. They cannot mismatch.

### 4. User preferences stored in `localStorage`

A theme or language saved in `localStorage` is invisible to the server. The server renders the
default, and the client renders the saved value.

**Fix:** store it in a cookie instead. `useCookie` reads the same value on both sides:

```ts
const theme = useCookie<'light' | 'dark'>('theme', { default: () => 'dark' })
```

### 5. Invalid HTML nesting

The browser's parser silently fixes invalid HTML before Vue sees it. A `<div>` inside a `<p>`
closes the paragraph early, so the DOM no longer matches the server's structure.

```vue
<!-- The parser closes the <p> before the <div> -->
<p>Intro <div class="note">Note</div></p>
```

**Fix:** use valid nesting. Common offenders: block elements inside `<p>`, a `<tr>` without a
`<tbody>`, and a link inside a link.

### 6. Browser extensions

Translation, password manager and ad-blocking extensions edit the DOM before hydration. If a
mismatch only happens for some users, or disappears in a private window, suspect an extension.

**Fix:** there is usually nothing to fix in your code. Confirm by reproducing it in a clean profile.

### 7. Content that is genuinely different

Sometimes the difference is correct, for example a "last updated 3 minutes ago" label. Vue 3.5
lets you mark an element as allowed to differ:

```vue
<span data-allow-mismatch="text">{{ relativeTime }}</span>
```

Use this only when you are sure the difference is intended. It silences the warning and does not
fix anything else.

## `<ClientOnly>`: the last resort

Wrapping a component in `<ClientOnly>` skips it on the server, so it cannot mismatch. It also
removes that content from the server HTML. Search engines do not see it, and users see it appear
late, which can cause layout shift.

```vue
<ClientOnly>
  <UserMenu />
  <template #fallback>
    <div class="user-menu-placeholder" aria-hidden="true" />
  </template>
</ClientOnly>
```

If you use it, give the fallback the same size as the real component, so nothing jumps when it
arrives.

## A checklist to keep them out

- No `Date`, `Math.random()` or `window` directly in templates or at the top level of `setup`
- Preferences in cookies, not in `localStorage`
- `useId()` for every generated ID
- Valid HTML nesting (an HTML validator on your built pages catches it)
- Zero hydration warnings in the console as a condition for merging

> **TODO(you):** do you check for hydration warnings in CI (for example, a Playwright test that
> fails on any `Hydration` console message)? If yes, add the snippet. If not, remove this line.
