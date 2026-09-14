<script setup lang="ts">
/**
 * Links inside prose reuse DsLink, so an external link in a post behaves exactly like one in
 * the interface: underlined, rel-hardened, and announced when it opens a new tab.
 */
const { href = '' } = defineProps<{ href?: string, target?: string }>()
</script>

<template>
  <DsLink :to="href">
    <slot />
  </DsLink>
</template>
