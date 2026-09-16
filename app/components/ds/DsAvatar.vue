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
const { src, alt, size = 160, priority = false, quality = 90 } = defineProps<{
  src: string
  alt: string
  size?: number
  /** Set on the hero avatar: preloads and marks it high priority as the likely LCP element. */
  priority?: boolean
  /**
   * Overrides `image.quality` in nuxt.config, which is 72 — a setting chosen for blog imagery,
   * where the subject is usually flat UI. A face is the harder case: skin is a slow gradient
   * and an eye is fine detail, which are the first things a WebP encoder trades away. This is
   * also the one image on the site that is rendered large and looked at directly.
   *
   * The 2x (400px) variant measures 7.9 KB at 72, 11.1 KB at 82, 17.7 KB at 90 and 26.9 KB at
   * 95. 90 is the last step that is worth its bytes; above it the file grows faster than the
   * picture improves.
   */
  quality?: number
}>()

/**
 * A raster source is re-encoded as WebP; a vector one is left alone.
 *
 * `image.format` in nuxt.config only steers <NuxtPicture>, so without an explicit format a
 * JPEG here is resized and re-encoded as JPEG — at the same quality the 2x variant measured
 * 25.2 KB that way against 17.7 KB as WebP, on the element that is the likeliest LCP candidate
 * on the page. (AVIF measured *larger* still, 26.2 KB: small photographic images are where its
 * fixed overhead stops paying off.)
 *
 * Handing an SVG the same treatment would be strictly worse. It rasterises a mark that is
 * already smaller than any variant IPX could produce, and freezes it at one pixel size, so it
 * softens on exactly the high-density screens the 2x variant exists for. `quality` drops with
 * `format` for the same reason: either one in the URL is what sends the file through the
 * encoder at all.
 */
const isVector = computed(() => src.endsWith('.svg'))
const format = computed(() => (isVector.value ? undefined : 'webp'))
const renderQuality = computed(() => (isVector.value ? undefined : quality))
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
      :quality="renderQuality"
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
