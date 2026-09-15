<script setup lang="ts">
/**
 * The visual content of an error page.
 *
 * Shared by error.vue (Nuxt's runtime error boundary) and pages/404.vue (the statically
 * rendered file the host serves for unknown URLs) so the two can never drift apart.
 */
const { statusCode = 404 } = defineProps<{ statusCode?: number }>()

const isNotFound = computed(() => statusCode === 404)
</script>

<template>
  <section aria-labelledby="error-heading" class="ds-glow py-24 sm:py-32">
    <DsContainer>
      <DsEyebrow>Error {{ statusCode }}</DsEyebrow>

      <h1 id="error-heading" class="mt-6 text-display text-balance">
        {{ isNotFound ? 'This page does not exist.' : 'Something went wrong.' }}
      </h1>

      <p class="mt-6 max-w-prose text-xl text-fg-muted text-pretty">
        {{ isNotFound
          ? 'The link may be out of date, or the page may have moved. Nothing is broken on your end.'
          : 'An unexpected error stopped this page from loading. Trying again often works.' }}
      </p>

      <div class="mt-10 flex flex-wrap gap-3">
        <DsButton to="/" size="lg">
          Back to the home page
        </DsButton>
        <DsButton to="/blog" variant="secondary" size="lg">
          Read the blog
        </DsButton>
      </div>
    </DsContainer>
  </section>
</template>
