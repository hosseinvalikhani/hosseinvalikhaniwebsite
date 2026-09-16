<script setup lang="ts">
/**
 * The identity mark: an HV monogram, drawn rather than photographed.
 *
 * Inline SVG, not an <img>. The mark has to be ink in the light theme and near-white in the
 * dark one, and an SVG loaded through <img> can see neither — it cannot inherit `currentColor`,
 * and a `prefers-color-scheme` block inside the file would answer to the operating system
 * rather than to the theme toggle, so anyone who overrides their OS setting would get a mark
 * the same colour as the disc behind it. Inlining makes it `text-fg`, which is the one token
 * that already means exactly this.
 *
 * Drawn as stroked centrelines rather than filled outlines, so the whole mark is six paths and
 * one weight, and the serif bars are a second, lighter stroke over the same skeleton.
 *
 * The V's vertex sits at 330 rather than on the 376 baseline. A mitred join runs past the
 * vertex along the bisector by (w/2)/sin(half-angle) — 46px at this angle — so putting the
 * vertex on the baseline is what hangs the V below the H, which is exactly what it did before
 * the number was worked out.
 *
 * It is also the likeliest LCP element on the home page, and being inline means it paints with
 * the document instead of costing a request.
 */
const { size = 160, label } = defineProps<{
  size?: number
  /**
   * Leave unset in the hero: the <h1> beside it already says the name, and a mark that repeats
   * it makes a screen reader read the same words twice. Set it where the mark stands alone.
   */
  label?: string
}>()
</script>

<template>
  <span
    class="relative inline-block aspect-square shrink-0 rounded-full p-1 ring-2 ring-accent"
    :style="{ width: `min(${size + 8}px, 42vw)` }"
  >
    <svg
      viewBox="0 0 512 512"
      class="size-full rounded-full bg-raised text-fg"
      fill="none"
      stroke="currentColor"
      stroke-miterlimit="5"
      :role="label ? 'img' : undefined"
      :aria-label="label"
      :aria-hidden="label ? undefined : true"
      focusable="false"
    >
      <g stroke-width="26">
        <path d="M115 136V376M215 136V376M115 256H215" />
        <path d="M285 136L341 330L397 136" />
      </g>
      <!-- Serifs: the same skeleton, a lighter weight, and the only thing making this formal. -->
      <g stroke-width="16">
        <path d="M85 136H145M185 136H245M85 376H145M185 376H245M255 136H315M367 136H427" />
      </g>
    </svg>
  </span>
</template>
