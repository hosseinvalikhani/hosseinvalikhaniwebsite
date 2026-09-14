<script setup lang="ts">
/**
 * Phase 5 stub.
 *
 * The nav links here, and crawlLinks + failOnError mean a missing route fails the build — which
 * is exactly the behaviour we want, so this exists rather than the link being removed.
 * Phase 8 replaces it with the real listing.
 */
useSeoMeta({
  title: 'Blog',
  description: 'Writing about building for the web — the real listing arrives in Phase 8.',
})
</script>

<template>
  <DsSection id="blog" eyebrow="Blog" heading="Writing" :level="2">
    <p class="max-w-prose text-lg text-fg-muted">
      The listing, post pages and prose components arrive in Phase 8. This stub exists so the
      header's Blog link resolves and the shell can be reviewed as a whole.
    </p>
  </DsSection>
</template>
