<script setup lang="ts">
/**
 * Post images.
 *
 * Dimensions are deliberately NOT defaulted. A fallback like 1200×630 reserves a box of the
 * wrong shape for anything that is not a cover image — the browser holds space at the invented
 * ratio, then reflows to the real one, which is worse than reserving nothing because the shift
 * is guaranteed rather than merely likely.
 *
 * Markdown has no syntax for dimensions, so authors supply them with MDC attributes:
 *
 *     ![Alt text](/img/thing.png){width="800" height="450"}
 *
 * scripts/check-output.mjs fails the build if a post ships an image without them.
 *
 * Two things about `sizes` that both fail silently rather than warning:
 *
 * 1. The units must be ones @nuxt/image can resolve to pixels. `md:65ch` reads naturally next
 *    to the prose measure but is unparseable, and it poisoned the whole calculation — the
 *    generated srcset was "1w, 2w" and the src pointed at a 2×2-pixel rendering of the image.
 *    704px is that same 65ch measure at the base font size.
 * 2. Every breakpoint needs naming. With an unprefixed `100vw` there is no screen width to
 *    resolve against, and the candidate widths came out as 1 and 2 again.
 *
 * Neither produced a build warning, so the only way to catch it is to read the generated
 * srcset. Current output: 640w, 704w, 1280w, 1408w.
 */
const { src = '', alt = '', width, height } = defineProps<{
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
}>()
</script>

<template>
  <NuxtImg
    :src="src"
    :alt="alt"
    :width="width"
    :height="height"
    loading="lazy"
    decoding="async"
    sizes="xs:100vw sm:100vw md:704px"
    class="mt-6 h-auto w-full rounded-panel border border-hairline bg-surface"
  />
</template>
