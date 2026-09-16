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

/**
 * A raster source is re-encoded as WebP; a vector one is left alone.
 *
 * `image.format` in nuxt.config only steers <NuxtPicture>, so without an explicit format a
 * JPEG here is resized and re-encoded as JPEG — the 2x variant measured 13.6 KB that way
 * against 7.9 KB as WebP, on the element that is the likeliest LCP candidate on the page.
 * (AVIF measured *larger* at these sizes, 8.9 KB: small photographic images are where its
 * fixed overhead stops paying off.)
 *
 * Handing an SVG the same treatment would be strictly worse. It rasterises a mark that is
 * already smaller than any variant IPX could produce, and freezes it at one pixel size, so it
 * softens on exactly the high-density screens the 2x variant exists for.
 */
const format = computed(() => (src.endsWith('.svg') ? undefined : 'webp'))
</script>

<template>
  <span
    class="relative inline-block aspect-square shrink-0 rounded-full p-1 ring-2 ring-accent"
    :style="{ width: `min(${size + 8}px, 42vw)` }"
  >
    <NuxtImg
      :src="src"
      :alt="alt"
      :format="format"
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
