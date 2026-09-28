---
title: Where AI helps and where it fails in frontend work
description: The frontend tasks where an AI assistant saves real time, the ones where it quietly makes things worse, and the review habits that catch the difference.
date: 2026-09-29
tags: [ai, career]
draft: false
---

An AI coding assistant can save you hours on one task and cost you hours on the next, because the
output looked right and was not.

The pattern is consistent enough to write down. AI is strong where the right answer is **common
and checkable**. It is weak where the right answer depends on **your context, your measurements or
a version newer than its training**.

> **TODO(you):** name the tool(s) you use and roughly since when. One sentence is enough.

## Where it helps

### Boilerplate with an obvious shape

Typed props for a component, a Pinia store skeleton, a Zod schema from a JSON sample, or an API
client from an OpenAPI spec. There is one right shape, it has been written thousands of times, and
you can check the result at a glance.

### Types

Turning an API response into TypeScript types, or tightening a loose `any` into a union. Mistakes
show up immediately as compiler errors, so bad output fails fast.

### Tests for code that already works

Given a composable and a description of its edge cases, an assistant writes a solid first draft of
unit tests. You still decide *which* cases matter, and that decision is the valuable part.

### Explaining unfamiliar code

"What does this regex do?" or "Why does this watcher run twice?" Reading is where it is most
reliable, because you can check the explanation against the code in front of you.

### Mechanical refactors with a clear rule

"Convert these Options API components to `<script setup>`" is a good fit. The rule is clear and the
result is easy to review. I led this kind of migration at Lipak. The part that took judgment was
deciding the patterns. Converting each file to follow them is the part an assistant can draft.

> **TODO(you):** your best concrete example of time saved. Name the task, how long it would have
> taken and how long it took. One real number beats this whole section.

## Where it fails

### Anything that depends on measurement

Ask for "a faster version of this page" and you get a plausible list: lazy-load the images,
memoize the component, preload the fonts. Some of that is right for your page, and some makes it
slower.

On this site, preloading both fonts made LCP *worse*: it went from 1.35 s to 1.5–1.7 s. The fix
that worked was the opposite of the generic advice. An assistant cannot know that, because the
answer came from a measurement, not from a pattern.

### Accessibility semantics

Assistants add ARIA generously: `role="button"` on a `<div>`, `aria-label` on elements that already
have text, `aria-hidden` on content people need. The result often passes a quick glance and fails
a screen reader. The best accessibility fix is usually *less* ARIA and more native HTML, which is
the opposite of what gets generated.

### New APIs and release candidates

Anything newer than the model's training data comes out as a confident mix of old and new API.
Vue 3.6 Vapor Mode, released as an RC in 2026, is a good test. Always check version-specific code
against the current docs.

### Architecture

Where state lives, where a component boundary goes and what belongs on the server: these depend
on your team, your product and your future plans. An assistant gives you a reasonable default.
Defaults are fine for small things, and expensive for decisions you will live with for years.

> **TODO(you):** your worst concrete example: something that looked right, passed review, and was
> wrong. What caught it?

## The habits that catch the difference

1. **Review it like a pull request from a new colleague.** Read every line. "It compiles" is not
   a review.
2. **Ask for the reason, not only the code.** If the explanation is wrong, the code probably is
   too.
3. **Measure performance claims.** Lighthouse, the Performance panel or bundle analysis, before
   and after.
4. **Check anything version-specific against the docs.** This applies especially to anything
   released in the last year.
5. **Keep tests and checks in CI.** An assistant can make a change at the speed of typing, and CI
   is what keeps that speed from reaching production.

## Is it worth using?

Yes, for me clearly. But the time it saves goes to the parts it cannot do: deciding, measuring and
reviewing. If you use it to skip those parts, you ship faster at first, and you pay for it later.
