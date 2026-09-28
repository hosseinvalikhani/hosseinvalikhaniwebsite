---
title: "CSS anchor positioning: tooltips and dropdowns without JavaScript"
description: Anchor positioning has been Baseline since January 2026. Build a dropdown and a tooltip with it, flip them at the viewport edge, and keep a fallback.
date: 2026-11-17
tags: [css, accessibility]
draft: true
---

For years, placing a dropdown under its button meant a JavaScript library. You measured the
button, measured the viewport, did the maths and re-did it on every scroll and resize.

CSS anchor positioning does that in the browser. You name an element as an anchor and tell another
element to position itself relative to it. The browser keeps them together, and it can flip the
popup when it runs out of room.

It became Baseline in January 2026, when Firefox 147 turned it on by default. Chrome and Edge have
had it since version 125, and Safari since 26.

## The three properties you need

```css
.trigger {
  anchor-name: --menu-trigger;      /* 1. name the anchor */
}

.menu {
  position: absolute;               /* or fixed */
  position-anchor: --menu-trigger;  /* 2. attach to it */
  position-area: bottom span-right; /* 3. say where */
}
```

- `anchor-name` gives an element a name. It must start with two dashes.
- `position-anchor` attaches a positioned element to that name.
- `position-area` places the element on an imaginary 3×3 grid around the anchor. `bottom
  span-right` means below the anchor, starting at its left edge and extending right.

That is enough for most popups. For pixel control, the `anchor()` function returns an edge of the
anchor, which you can use in `top`, `left` and the other inset properties:

```css
.menu {
  top: calc(anchor(bottom) + 4px);
  left: anchor(left);
}
```

## A dropdown with the Popover API

The Popover API handles showing, hiding, closing on outside click and the Escape key, and it puts
the popup in the top layer so no `z-index` or `overflow: hidden` can clip it. Anchor positioning
handles where it goes. Together they need no JavaScript:

```vue
<template>
  <button type="button" class="trigger" popovertarget="account-menu">
    Account
  </button>

  <div id="account-menu" class="menu" popover>
    <a href="/settings">Settings</a>
    <a href="/billing">Billing</a>
    <a href="/logout">Log out</a>
  </div>
</template>
```

```css
.trigger {
  anchor-name: --account-trigger;
}

.menu {
  position-anchor: --account-trigger;
  position-area: bottom span-right;

  /* Popovers are centred by default (inset: 0; margin: auto). Undo that,
     or the menu stretches over the whole area instead of sitting under the button. */
  inset: auto;
  margin: 0;
  margin-block-start: 4px;
}
```

## Flipping when there is no room

A menu near the bottom of the screen should open upwards. One line does it:

```css
.menu {
  position-try-fallbacks: flip-block;
}
```

The browser tries your `position-area` first. If the menu would overflow the viewport, it tries
the fallback: the same position mirrored across the block axis, so above the button instead of
below it. `flip-inline` mirrors left and right. You can list several fallbacks, and the browser
uses the first one that fits:

```css
.menu {
  position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline;
}
```

## A tooltip that is actually accessible

A tooltip is where most implementations fail accessibility, with or without anchor positioning.
It needs to:

1. Appear on keyboard focus, not only on hover
2. Be announced by screen readers, through `aria-describedby`
3. Stay visible while the pointer moves onto it
4. Close with Escape without moving focus (WCAG 1.4.13)

Here it is as a Vue component. Each instance needs its own anchor name, so it is built from
`useId()`:

```vue
<!-- AppTooltip.vue -->
<script setup lang="ts">
import { computed, ref, useId } from 'vue'

defineProps<{ text: string }>()

const id = useId()
// anchor-name needs a valid dashed identifier, so strip anything useId may add
const anchor = computed(() => `--tip-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`)
const dismissed = ref(false)
</script>

<template>
  <span
    class="tip-wrap"
    @keydown.esc="dismissed = true"
    @focusin="dismissed = false"
    @mouseenter="dismissed = false"
  >
    <span :style="{ anchorName: anchor }" :aria-describedby="`${id}-tip`">
      <slot />
    </span>
    <span
      :id="`${id}-tip`"
      role="tooltip"
      class="tip"
      :class="{ 'tip--dismissed': dismissed }"
      :style="{ positionAnchor: anchor }"
    >
      {{ text }}
    </span>
  </span>
</template>

<style scoped>
.tip {
  position: fixed;
  position-area: top;
  position-try-fallbacks: flip-block;
  margin-block-end: 6px;
  display: none;
}

.tip-wrap:is(:hover, :focus-within) .tip:not(.tip--dismissed) {
  display: block;
}
</style>
```

The slot content has to be focusable, like a button or a link. A tooltip on a plain `<span>`
cannot be reached by keyboard at all.

> **TODO(you):** test this with a screen reader (VoiceOver or NVDA) and write one sentence on what
> it announced. Readers trust accessibility claims that were actually tested.

## A fallback for older browsers

Baseline "newly available" means current browsers only. Visitors on an older Safari or Firefox
still exist. Put the anchor rules inside a feature query:

```css
@supports (anchor-name: --x) {
  .trigger {
    anchor-name: --account-trigger;
  }

  .menu {
    position-anchor: --account-trigger;
    position-area: bottom span-right;
    position-try-fallbacks: flip-block;
    inset: auto;
    margin: 0;
    margin-block-start: 4px;
  }
}
```

Without support, the popover keeps the browser's default: centred in the viewport. That is not
pretty, but it is fully usable, and it still closes on Escape and outside click. An old browser
degrades to a working menu in the wrong place, instead of a menu in the right place that never
opens.

## Can you delete your positioning library?

For dropdowns, tooltips and simple popovers: in most cases, yes. For editors with nested
submenus, virtual lists inside popups or complex collision rules, a library still gives more
control, at least for now.

> **TODO(you):** did you replace a library in a real project? If so, name it and give the bundle
> size you saved. Otherwise, remove this callout.
