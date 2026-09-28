---
title: Frontend portfolio project ideas, by difficulty
description: Twelve frontend portfolio projects sorted by difficulty, what each one proves to a hiring manager, and the detail that makes it stand out.
date: 2026-12-15
tags: [career]
draft: true
---

A to-do app does not hurt your portfolio. A to-do app that looks like every other one does not
help it either.

The project matters less than what it proves. A hiring manager does not spend long on your
portfolio, and in that time they look for evidence that you can do the job. So every project
below comes with **what it proves**, plus **the detail that makes it stand out**. The standout
detail is the part most people skip.

## Beginner: proves you know the platform

### 1. A responsive landing page, without a framework

**Proves:** semantic HTML, CSS layout and responsive design.
**Stands out if:** it scores 100 for accessibility in Lighthouse, works at 320 px wide, and has a
visible focus style on every link.

### 2. A form with real validation

A sign-up or checkout form with inline errors.
**Proves:** forms, the part of frontend that breaks most often in real products.
**Stands out if:** errors are tied to fields with `aria-describedby`, focus moves to the first error
on submit, and it works with the keyboard alone.

### 3. A small app that fetches from a public API

Weather, movies, books or anything with a free API.
**Proves:** `fetch`, async code and rendering data.
**Stands out if:** it handles all four states properly: loading, empty, error and success. Most
projects only design the success state.

### 4. A component you would actually reuse

An accessible tabs, accordion or dialog component.
**Proves:** you understand behaviour, not just looks.
**Stands out if:** it follows the WAI-ARIA Authoring Practices keyboard pattern, and the README
explains which keys do what.

## Intermediate: proves you can build an app

### 5. A dashboard with filters in the URL

**Proves:** state management and routing.
**Stands out if:** filters live in the query string, so a filtered view can be bookmarked and
shared, and the back button works as expected.

### 6. A Nuxt blog with good SEO

**Proves:** server rendering, content and meta tags.
**Stands out if:** it has per-page meta and Open Graph tags, a sitemap and structured data, and
the build fails on missing descriptions.

### 7. A real-time app

A chat, a live poll or a collaborative list, using WebSockets or a hosted real-time service.
**Proves:** you can handle state that changes without the user doing anything.
**Stands out if:** it handles reconnection and shows the user when they are offline.

### 8. A data table that stays fast

Sorting, filtering and pagination over 10,000 rows.
**Proves:** performance thinking.
**Stands out if:** the README shows measured numbers: render time before and after virtualizing
the list.

## Advanced: proves you think like a senior

### 9. A small design system

Tokens, five components and a documentation page.
**Proves:** API design, consistency and accessibility at scale.
**Stands out if:** there is dark mode with contrast actually measured, and typed props.

### 10. A performance case study

Take a slow site, one you built or a public open-source one, and make it fast.
**Proves:** the skill most job listings ask for and fewest portfolios show.
**Stands out if:** it has before-and-after numbers from the same tool under the same conditions,
and a list of things you tried that did *not* help.

### 11. An app with end-to-end tests in CI

Any app from above, with Playwright tests running on every push.
**Proves:** you ship things that stay working.
**Stands out if:** the tests cover the critical path and run on mobile and desktop viewports.

### 12. Your portfolio itself

Your portfolio is a project. Treat it like one.

This site is mine. It is a Nuxt site that ships almost no JavaScript: **5.9 KB per route**, down
from 98–119 KB, with an LCP of **1.35 s** on a throttled mobile run. The build fails if a post's
description is the wrong length, and a script checks the JavaScript budget of every route.

None of that is visible at a glance, which is the point. A hiring manager who opens the repo sees
the decisions and the checks behind them, not just the page.

> **TODO(you):** link the repo here, and name the one decision in `docs/decisions.md` you would
> most want a reviewer to read.

## How to present a project

The same project can look junior or senior depending on its README. Include:

1. **One sentence on what it does**, and a live link
2. **A screenshot**, or a short GIF of the main interaction
3. **The decisions:** what you chose, what you rejected and why
4. **The numbers:** a Lighthouse score, bundle size, test count or whatever you measured
5. **What you would do next** with more time

The third item is what separates a portfolio from a tutorial you finished. Anyone can follow a
tutorial. Explaining a trade-off shows you can make one.

## Three good projects beat ten average ones

Pick one project from each level, finish them properly and write good READMEs. That is more
convincing than a grid of twelve half-finished repos.

> **TODO(you):** which project got you the most interview questions, and what did interviewers
> ask about it?
