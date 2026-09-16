<script setup lang="ts">
/**
 * The identity mark: an angle-bracket glyph, drawn rather than photographed.
 *
 * Inline SVG, not an <img>. The mark has to be ink in the light theme and near-white in the
 * dark one, and an SVG loaded through <img> can see neither — it cannot inherit `currentColor`,
 * and a `prefers-color-scheme` block inside the file would answer to the operating system
 * rather than to the theme toggle, so anyone who overrides their OS setting would get a mark
 * the same colour as the disc behind it. Inlining makes it `text-fg`, which is the one token
 * that already means exactly this.
 *
 * Three stroked paths on the same 512 grid the rest of the artwork uses, with round caps and
 * joins so the chevrons read as drawn rather than as clipped triangles. The slash is centred on
 * 256 and the chevron tips sit at equal distances from it, because the glyph is symmetrical and
 * anything less makes it look like a typo.
 *
 * It is also the likeliest LCP element on the home page, and being inline means it paints with
 * the document instead of costing a request.
 */
const { size = 160, label } = defineProps<{
  size?: number
  /**
   * Leave unset in the hero: the <h1> beside it already says the name, and a decorative glyph
   * that announces itself adds noise to a screen reader. Set it where the mark stands alone.
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
      stroke-width="34"
      stroke-linecap="round"
      stroke-linejoin="round"
      :role="label ? 'img' : undefined"
      :aria-label="label"
      :aria-hidden="label ? undefined : true"
      focusable="false"
    >
      <path d="M200 176L120 256L200 336" />
      <path d="M312 176L392 256L312 336" />
      <path d="M290 150L222 362" />
    </svg>
  </span>
</template>
