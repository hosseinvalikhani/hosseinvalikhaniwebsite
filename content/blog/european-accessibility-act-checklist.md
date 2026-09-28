---
title: "The European Accessibility Act: a checklist for frontend developers"
description: The EAA has been enforceable since 28 June 2025. What it means for the code you write, a checklist mapped to WCAG 2.1 AA, and an accessible Vue form to copy.
date: 2026-12-08
tags: [accessibility, vue]
draft: true
---

The European Accessibility Act (EAA) has applied since **28 June 2025**. If your product sells
to consumers in the EU, whether through e-commerce, banking, e-books, transport tickets or
communication services, accessibility is now a legal requirement, not a nice-to-have.

Many frontend teams still treat it as a lawyer's problem. It is not. Almost every requirement ends
up as a change to HTML, CSS or a component.

> This post explains the EAA from a developer's point of view. It is not legal advice. Whether and
> how the Act applies to your company is a question for your legal team and your country's
> national law.

## What the law actually points to

The EAA is an EU directive (2019/882), and each member state writes it into national law. For
websites and apps, compliance is assessed against the harmonised standard **EN 301 549**, which
includes **WCAG 2.1 Level AA** in full.

So in practice: **if your site meets WCAG 2.1 AA, you have covered the technical core.** A new
version of EN 301 549 based on WCAG 2.2 is expected, so building to WCAG 2.2 today is the safer
choice.

Some facts that come up in every discussion:

- **Microenterprises are exempt for services.** That means fewer than 10 employees *and* an
  annual turnover or balance sheet of no more than €2 million. Both conditions must be met.
- **There are transition periods.** Service contracts agreed before 28 June 2025 can continue
  unchanged until they end, for at most five years. Services may keep using products they already
  used before that date until 28 June 2030.
- **Service providers must publish information** on how their service meets the accessibility
  requirements. This usually takes the form of an accessibility statement.
- **Penalties are set nationally,** so they differ by country.

## The checklist

Each item is mapped to its WCAG success criterion, so you can look up the details and the tests.

### Structure and semantics

- [ ] Every page has a `lang` attribute on `<html>` (3.1.1)
- [ ] One `<h1>`, and headings in a logical order with no skipped levels used for styling (1.3.1)
- [ ] Landmarks: `<header>`, `<nav>`, `<main>` and `<footer>` (1.3.1)
- [ ] Lists are `<ul>` or `<ol>`, and tables have `<th>` with a scope (1.3.1)
- [ ] A unique, descriptive `<title>` per page, which in a Nuxt app means `useHead` or `useSeoMeta` on every route (2.4.2)

### Keyboard

- [ ] Everything clickable works with the keyboard alone (2.1.1)
- [ ] No keyboard traps: focus can always move away (2.1.2)
- [ ] Focus is always visible, and your CSS does not remove the outline without a replacement (2.4.7)
- [ ] Focus order follows the visual order (2.4.3)
- [ ] A "Skip to content" link as the first focusable element (2.4.1)
- [ ] After a client-side route change, focus moves somewhere sensible and the new page is announced

### Visuals

- [ ] Text contrast of at least 4.5:1, or 3:1 for large text (1.4.3)
- [ ] Borders of inputs, icons and focus indicators at least 3:1 (1.4.11)
- [ ] Colour is never the only signal, for example an error shown in red only (1.4.1)
- [ ] The page works at 320 px wide without horizontal scrolling (1.4.10)
- [ ] Text can be zoomed to 200% without breaking (1.4.4)
- [ ] Animations respect `prefers-reduced-motion`

### Images and media

- [ ] Informative images have `alt` text; decorative ones have `alt=""` (1.1.1)
- [ ] Icon-only buttons have an accessible name (4.1.2)
- [ ] Videos have captions (1.2.2)

### Forms

- [ ] Every input has a visible `<label>` (1.3.1, 3.3.2)
- [ ] Errors are described in text and tied to their field (3.3.1)
- [ ] Error messages suggest how to fix the problem (3.3.3)
- [ ] `autocomplete` on personal data fields like name, email and address (1.3.5)
- [ ] Status messages, like "Saved" or "3 results", are announced without moving focus (4.1.3)

## An accessible Vue form field

Most form failures come from the same missing wiring between the input, its label and its error.
This component does the wiring once:

```vue
<!-- FormField.vue -->
<script setup lang="ts">
import { useId } from 'vue'

defineProps<{
  label: string
  error?: string
  hint?: string
  type?: string
  autocomplete?: string
}>()

const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="field">
    <label :for="id">{{ label }}</label>

    <p v-if="hint" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>

    <input
      :id="id"
      v-model="model"
      :type="type ?? 'text'"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined"
    >

    <p v-if="error" :id="`${id}-error`" class="field__error">
      <span aria-hidden="true">⚠</span> {{ error }}
    </p>
  </div>
</template>
```

What each piece does:

- `for` and `id` connect the label, so clicking the label focuses the input and screen readers
  read it.
- `aria-describedby` makes screen readers read the hint and the error after the label.
- `aria-invalid` announces the field as invalid.
- The error has an icon **and** text, so it does not rely on colour.
- `useId()` gives stable IDs that match between the server and the client.

Using it:

```vue
<FormField
  v-model="email"
  label="Email address"
  type="email"
  autocomplete="email"
  :error="emailError"
  hint="We only use it for order updates."
/>
```

On submit with errors, move focus to the first invalid field, or to an error summary at the top
of the form. Otherwise keyboard and screen reader users do not know the submit failed.

## How to test it

Automated tools only find the problems a machine can detect. They cannot tell whether your alt text
makes sense or whether your focus order is logical. Use them, but do not stop there:

1. **Automated:** axe DevTools or Lighthouse on every page type, and `@axe-core/playwright` in CI.
2. **Keyboard:** unplug the mouse and complete your main user journey.
3. **Screen reader:** VoiceOver on macOS, or NVDA on Windows, for the same journey.
4. **Zoom:** 200% zoom, and a 320 px wide window.

> **TODO(you):** run the checklist on a real project, this site or a work app if you are allowed,
> and report what failed. "I checked my own site and found 4 issues" is far more convincing than
> a checklist alone.

## Where to start if you are behind

Fix in this order, because each step fixes the most with the least work:

1. Your shared components: buttons, form fields, modals and menus. One fix repairs every page.
2. Your main user journey, from start to purchase or sign-up.
3. Everything else, page by page.

Then publish your accessibility statement, and keep it honest: list what does not work yet and
when it will.
