---
title: "Frontend developer roadmap 2026: what I would learn again"
description: A frontend roadmap from someone who took it recently. What paid off in three jobs, what I would skip, and the order I would learn it in if I started today.
date: 2026-09-29
tags: [career]
draft: false
---

Most frontend roadmaps list everything. A diagram with 120 boxes tells you nothing about which
five mattered.

This one is shorter. It comes from my own path through three jobs: an agency-style CDN product,
a CRM startup and a production Nuxt app. For each stage it says what paid off and what I would
skip.

> **TODO(you):** two sentences on how you started, whether through university, a course or self-teaching,
> and the first thing you ever built for the web.

## Stage 1: the platform, before any framework

**Learn:** semantic HTML, CSS layout (flexbox and grid), and JavaScript without a framework: the
DOM, events, `fetch`, promises and modules.

**Why it paid off:** at Upolo I built a customer-facing ticketing tool with Alpine.js and
Tailwind, not Vue. Framework knowledge only partly carries over between tools. Knowledge of the DOM
and CSS carries over completely.

**Skip:** memorizing every CSS property. Learn layout deeply and look the rest up.

**You are done when** you can build a responsive page with a working form, keyboard access
included, and no framework.

## Stage 2: one framework, properly

**Learn:** one framework in depth. For me that was Vue with the Composition API. Understand
reactivity, component communication, and how rendering works, not just the syntax.

**Why it paid off:** at Lipak I led a codebase-wide migration from the Options API to the
Composition API. That job needed an understanding of *why* each pattern exists. Knowing the
syntax was not enough.

**Skip:** learning two frameworks at once. React versus Vue matters less than people think; depth
in either transfers. I compare them in a later post.

> **TODO(you):** the moment Vue's reactivity "clicked" for you, or the bug that taught you.

## Stage 3: TypeScript

**Learn:** types for props, emits and API responses. Generics when you need them. `strict: true`
from day one.

**Why it paid off:** design system components with typed props are self-documenting. When I built
more than ten of them at Lipak, the types meant the editor told every user which values each prop
accepted.

**Skip:** type gymnastics. If a type needs a comment to explain it, a simpler type is usually
better.

## Stage 4: a meta-framework and how rendering works

**Learn:** Nuxt (or Next.js), and more importantly the concepts under it: server-side rendering,
static generation, hydration, and when each one fits.

**Why it paid off:** many hard frontend bugs live here. Examples include hydration mismatches,
data fetched twice, and pages that are fast in the lab and slow for users.

**Skip:** deploying to five hosting providers. Pick one and learn it.

## Stage 5: performance, measured

**Learn:** Core Web Vitals (LCP, INP and CLS), how to read a Lighthouse report, the difference
between lab and field data, and bundle analysis.

**Why it paid off:** this is where I have had the most visible impact. At Lipak, reworking
third-party imports and code splitting cut the production build from 65 MB to 11 MB. LCP dropped
from 4.5 s to 2.2 s, with CLS under 0.01 and INP under 200 ms.

**Skip:** performance advice without numbers. If a tip does not say what it measured, measure it
yourself before applying it.

## Stage 6: accessibility as a default

**Learn:** keyboard navigation, focus management, labels, contrast and ARIA only where HTML falls
short. WCAG 2.1 AA is the baseline, and in the EU it is now a legal requirement for many products.

**Why it paid off:** accessibility bugs are cheap to prevent and expensive to retrofit. When a
design system is accessible from the start, every screen built with it inherits that.

**Skip:** installing an accessibility overlay widget. It does not fix the markup.

## Stage 7: testing and the boring professional skills

**Learn:** end-to-end tests for critical flows (I use Playwright), a few unit tests for tricky
logic, Git beyond `add` and `commit`, code review, and writing things down.

**Why it paid off:** at Upolo I shipped seven features for a CRM product and covered the
critical flows with Playwright tests. At Lipak, the documentation was what made the Composition
API migration stick after I finished it.

## What I would do differently

> **TODO(you):** three honest items, each with a sentence of why. For example, something you
> learned too late, something you over-invested in, and something you would start earlier.

## The short version

1. HTML, CSS and JavaScript without a framework
2. One framework, in depth
3. TypeScript, strict
4. A meta-framework and rendering modes
5. Performance, measured
6. Accessibility, by default
7. Testing, Git, review and writing

Build one real project at every stage. A roadmap you only read is a list. A project you ship
shows you what you actually learned.
