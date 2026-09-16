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
 *
 * `size` is a ceiling, not a fixed width. At 200px the hero avatar took roughly 40% of the
 * height of a 320px screen and pushed the heading, the lead and the call to action below the
 * fold — the reflow was correct but the proportions were not. `min()` caps it against the
 * viewport so it gives way on a phone and is unchanged from `sm` upwards.
 *
 * The box is still reserved before the image arrives: the width resolves at layout time and
 * `aspect-square` supplies the height, so this costs no layout shift. That matters more than
 * usual here — the avatar sits at the top of the hero and is the site's largest CLS risk.
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
    class="relative inline-block aspect-square shrink-0 rounded-full p-1 ring-2 ring-accent"
    :style="{ width: `min(${size + 8}px, 42vw)` }"
  >
    <!--
      format, explicitly: `image.format` in nuxt.config only steers <NuxtPicture>, so without
      this a JPEG source is resized and re-encoded as JPEG. The 2x variant the hero actually
      loads is 13.6 KB as JPEG and 7.9 KB as WebP — worth having on the element that is the
      likeliest LCP candidate on the page. (AVIF measured *larger* than WebP at these sizes:
      8.9 KB. Small photographic images are where AVIF's fixed overhead stops paying off.)
    -->
    <NuxtImg
      :src="src"
      :alt="alt"
      format="webp"
      :width="size"
      :height="size"
      :preload="priority"
      :loading="priority ? 'eager' : 'lazy'"
      :fetchpriority="priority ? 'high' : undefined"
      :sizes="`${size}px`"
      class="size-full rounded-full bg-raised object-cover"
    />
  </span>
</template>
