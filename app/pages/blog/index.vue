<script setup lang="ts">
/**
 * Phase 5 stub, kept until Phase 8 builds the real listing.
 *
 * It carries its own <h1> rather than a DsSection: every page needs exactly one top-level
 * heading, and a page whose highest heading is an <h2> has a broken outline.
 */
useSeoMeta({
  title: 'Blog',
  description: 'Writing about building for the web — the real listing arrives in Phase 8.',
})
</script>

<template>
  <section class="py-16 sm:py-24">
    <DsContainer>
      <DsEyebrow>Blog</DsEyebrow>
      <h1 class="mt-4 text-3xl">
        Writing
      </h1>
      <p class="mt-6 max-w-prose text-lg text-fg-muted">
        The listing, post pages and prose components arrive in Phase 8. This stub exists so the
        header's Blog link resolves and the shell can be reviewed as a whole.
      </p>
    </DsContainer>
  </section>
</template>
