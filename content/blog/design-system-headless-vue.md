---
title: A small design system with tokens and headless Vue components
description: Tokens for decisions, a headless library for behaviour and your own components on top. A small Vue design system that stays accessible.
date: 2026-12-01
tags: [design-systems, vue, accessibility, css]
draft: true
---

A design system does not need to start as a big project. It needs three layers, each with one job:

1. **Tokens** hold design decisions: colours, spacing, radii and type.
2. **A headless library** handles behaviour: focus, keyboard, ARIA and dismissal.
3. **Your components** combine the two into the API your team actually uses.

At Lipak I built more than ten Vue and TypeScript design system components. This post shows the
three-layer structure with two examples: a button and a popover.

## Layer 1: tokens

Tokens are CSS custom properties with names that describe **purpose**, not appearance.
`--ds-accent-text` survives a rebrand. `--green-600` does not.

```css
:root {
  /* Raw palette: only the token layer below reads these */
  --palette-green-500: #00dc82;
  --palette-green-700: #007f45;
  --palette-ink: #020420;

  /* Semantic tokens: what components use */
  --ds-accent: var(--palette-green-500);
  --ds-accent-text: var(--palette-green-500);
  --ds-on-accent: var(--palette-ink);
  --ds-radius: 8px;
  --ds-space-2: 8px;
  --ds-space-3: 12px;
  --ds-focus-ring: 0 0 0 3px color-mix(in srgb, var(--ds-accent) 45%, transparent);
}

:root.light {
  --ds-accent-text: var(--palette-green-700);
}
```

The rule that keeps this maintainable: **components never read the raw palette.** When the light
theme needs a darker green for text, one line changes, and every component follows.

Why fill and text need separate tokens is a whole post by itself:
[Dark mode tokens that actually pass contrast](/blog/dark-mode-tokens-that-actually-pass-contrast).

## Layer 2: a headless library

A popover looks simple until you write one. It has to move focus into the panel and back to the
trigger, close on Escape and on outside click, and wire up the ARIA attributes. It also needs to
avoid trapping screen reader users.

A headless library gives you all of that behaviour with **no styles at all**. For Vue, a good
choice is [Reka UI](https://reka-ui.com), which was previously called Radix Vue. You own every
pixel, and the library owns the behaviour.

> **TODO(you):** which headless library, if any, did you use at Lipak? If it was not Reka UI, say
> so here and explain why.

```bash
npm install reka-ui
```

## Layer 3: your components

### A button: tokens only

A button needs no headless library. The native `<button>` element already has the behaviour. The
design system's job is variants and a consistent focus style:

```vue
<!-- DsButton.vue -->
<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'ghost'
  type?: 'button' | 'submit'
}>(), { variant: 'primary', type: 'button' })
</script>

<template>
  <button :type="type" class="ds-button" :class="`ds-button--${variant}`">
    <slot />
  </button>
</template>

<style scoped>
.ds-button {
  padding: var(--ds-space-2) var(--ds-space-3);
  border-radius: var(--ds-radius);
  border: 1px solid transparent;
  font: inherit;
  cursor: pointer;
}

.ds-button:focus-visible {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.ds-button--primary {
  background: var(--ds-accent);
  color: var(--ds-on-accent);
}

.ds-button--ghost {
  background: transparent;
  color: var(--ds-accent-text);
  border-color: currentColor;
}
</style>
```

Two details matter more than they look:

- `type` defaults to `button`. A bare `<button>` inside a form defaults to `submit`, which is a
  surprisingly common bug.
- The focus style uses `:focus-visible`. Keyboard users get a clear ring, and mouse clicks do not
  leave one behind.

### A popover: headless behaviour, your styles

Here the library earns its place. Your component wraps its parts and exposes a small API:

```vue
<!-- DsPopover.vue -->
<script setup lang="ts">
import {
  PopoverArrow,
  PopoverContent,
  PopoverPortal,
  PopoverRoot,
  PopoverTrigger,
} from 'reka-ui'

defineProps<{ label: string }>()
</script>

<template>
  <PopoverRoot>
    <PopoverTrigger as-child>
      <slot name="trigger" />
    </PopoverTrigger>

    <PopoverPortal>
      <PopoverContent class="ds-popover" :side-offset="6" :aria-label="label">
        <slot />
        <PopoverArrow class="ds-popover__arrow" />
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<style>
/* Not scoped: the content is portalled to <body>, outside this component's DOM */
.ds-popover {
  padding: var(--ds-space-3);
  border-radius: var(--ds-radius);
  background: var(--ds-surface, #fff);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.16);
}

.ds-popover__arrow {
  fill: var(--ds-surface, #fff);
}
</style>
```

Using it reads like plain HTML:

```vue
<DsPopover label="Share options">
  <template #trigger>
    <DsButton variant="ghost">Share</DsButton>
  </template>
  <p>Copy link, or send by email.</p>
</DsPopover>
```

`as-child` makes the trigger merge its behaviour into your `DsButton`, instead of wrapping it in
a second button. Two nested buttons is invalid HTML, and it is confusing for screen readers.

## Decisions to write down early

Decide these before the third component, or every component will decide them differently:

| Decision | What I chose | Why |
| --- | --- | --- |
| Prop naming | `variant`, `size`, and no boolean props like `isPrimary` | Booleans multiply: `primary` + `danger` + `ghost` cannot all be true |
| Styling | Scoped CSS reading tokens | No runtime cost, and it works without a CSS framework |
| Behaviour | Headless library for anything with focus management | Focus traps and ARIA are where hand-written components fail |
| Documentation | One page per component, with the props table generated from types | Docs written by hand drift from the code |

> **TODO(you):** add one row from your Lipak experience, meaning a decision you got wrong at first
> and changed. That is the row readers will remember.

## When not to build one

If one team maintains one app, a folder of shared components with tokens is enough. A versioned
package with its own release process pays off when several apps or teams consume it.

> **TODO(you):** did you ship the Lipak components as a package, or as a folder in the app? One
> sentence on why.
