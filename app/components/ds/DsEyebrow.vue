<script setup lang="ts">
/**
 * The signature device: a mono, letter-spaced, uppercase label above a heading.
 *
 * When the eyebrow only restates its heading it is decoration, and announcing it to a screen
 * reader is noise — pass `decorative` there. When it carries real information (a section
 * number, a date) leave it exposed.
 */
const { decorative = false } = defineProps<{ decorative?: boolean }>()
</script>

<template>
  <p
    class="font-mono text-eyebrow text-accent-text uppercase"
    :aria-hidden="decorative ? 'true' : undefined"
  >
    <slot />
  </p>
</template>
