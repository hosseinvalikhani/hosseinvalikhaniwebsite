<script setup lang="ts">
/**
 * The 404 page as a real, prerendered route.
 *
 * Nuxt writes an empty SPA shell to `404.html` for static hosts, so the error content only
 * appears once JavaScript has booted — a blank page for anyone without it, and for any crawler
 * that does not execute scripts. Rendering it as an ordinary route produces real HTML, which
 * scripts/static-404.mjs then copies over that shell after the build.
 */
definePageMeta({ robots: 'noindex, nofollow' })

useHead({
  title: 'Page not found',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

/*
  A description on a noindex page still earns its place: it is what a chat client or a link
  unfurler shows when someone pastes a dead link, and "no description" there reads as a broken
  site rather than a missing page.
*/
useSeoMeta({
  description: 'That page does not exist. The link may be out of date, or the page may have moved.',
})
</script>

<template>
  <TheErrorState :status-code="404" />
</template>
