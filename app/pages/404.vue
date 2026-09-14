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
</script>

<template>
  <TheErrorState :status-code="404" />
</template>
