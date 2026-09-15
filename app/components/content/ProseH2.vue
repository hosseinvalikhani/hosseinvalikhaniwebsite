<script setup lang="ts">
/**
 * MDC gives every heading an `id`. Turning that into a self-link is the cheapest way to make
 * a long post shareable at the section level.
 *
 * The anchor is hidden until the heading is hovered or the link itself is focused — never
 * `display: none`, which would take it out of the tab order and hide the feature from exactly
 * the people who most benefit from a keyboard-reachable section link.
 */
const { id } = defineProps<{ id?: string }>()
</script>

<template>
  <h2 :id="id" class="group mt-14 text-2xl font-bold text-balance first:mt-0">
    <a v-if="id" :href="`#${id}`" class="no-underline">
      <slot />
      <span
        aria-hidden="true"
        class="ml-2 inline-block text-accent-text opacity-0 transition-opacity duration-fast group-hover:opacity-100 group-focus-within:opacity-100"
      >#</span>
      <DsVisuallyHidden>(link to this section)</DsVisuallyHidden>
    </a>
    <slot v-else />
  </h2>
</template>
