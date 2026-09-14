<script setup lang="ts">
import type { NuxtError } from '#app'

/**
 * Nuxt's runtime error boundary — what renders when a page throws during navigation.
 *
 * error.vue sits outside the normal page tree and picks up no layout of its own, so NuxtLayout
 * is what keeps the header, footer and skip link present. An error page without navigation is
 * a dead end, which is exactly when someone most needs a way out.
 *
 * The statically served 404 file is pages/404.vue; both render TheErrorState so they agree.
 */
const { error } = defineProps<{ error: NuxtError }>()

useHead({
  title: error.statusCode === 404 ? 'Page not found' : 'Something went wrong',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})
</script>

<template>
  <NuxtLayout>
    <TheErrorState :status-code="error.statusCode" />
  </NuxtLayout>
</template>
