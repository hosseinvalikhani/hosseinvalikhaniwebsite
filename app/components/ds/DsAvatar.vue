<script setup lang="ts">
/**
 * The profile photo.
 *
 * Width and height are always explicit so the browser reserves the box before the image
 * arrives — this is the single largest CLS risk on the home page, since the avatar sits at the
 * top of the hero.
 *
 * `alt` is required by the type. Pass an empty string deliberately when the name is already
 * next to it, which is the normal case in the hero.
 */
const { src, alt, size = 160, priority = false } = defineProps<{
  src: string
  alt: string
  size?: number
  /** Set on the hero avatar: preloads and marks it high priority as the likely LCP element. */
  priority?: boolean
}>()
</script>

<template>
  <span
    class="relative inline-block shrink-0 rounded-full p-1 ring-2 ring-accent"
    :style="{ width: `${size + 8}px`, height: `${size + 8}px` }"
  >
    <NuxtImg
      :src="src"
      :alt="alt"
      :width="size"
      :height="size"
      :preload="priority"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : undefined"
      sizes="160px"
      class="size-full rounded-full bg-raised object-cover"
    />
  </span>
</template>
