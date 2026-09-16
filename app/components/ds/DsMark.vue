<script setup lang="ts">
/**
 * The identity mark: an editor window with `</>` and a gear, drawn rather than licensed.
 *
 * It is original artwork on the same 512 grid as the rest of the marks, not the stock icon it
 * is modelled on. Two reasons, and either alone would be enough: the free tier of that library
 * requires a visible attribution line wherever the icon appears, and the icon is filled and
 * multicoloured, so it could not take `currentColor` and would sit alone against the thirteen
 * stroked icons in `app/design/icons.ts`.
 *
 * Inline SVG, not an <img>. The mark has to be ink in the light theme and near-white in the
 * dark one, and an SVG loaded through <img> can see neither — it cannot inherit `currentColor`,
 * and a `prefers-color-scheme` block inside the file would answer to the operating system
 * rather than to the theme toggle, so anyone who overrides their OS setting would get a mark
 * the same colour as the disc behind it. Inlining makes it `text-fg`, which is the one token
 * that already means exactly this.
 *
 * The window outline stops short at both ends rather than closing behind the gear. Two stroked
 * shapes crossing at a shallow angle read as a smudge at avatar sizes, and the gap costs
 * nothing: the eye closes a rectangle from five sides.
 *
 * Every point stays within ~216 of the centre, inside the 256 radius the circular mask cuts —
 * the gear's corner teeth are the closest to that edge, so they are what to re-check if any of
 * this is ever rescaled.
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
      stroke-linecap="round"
      stroke-linejoin="round"
      :role="label ? 'img' : undefined"
      :aria-label="label"
      :aria-hidden="label ? undefined : true"
      focusable="false"
    >
      <!-- Window: open at the bottom right, where the gear sits. -->
      <g stroke-width="26">
        <path d="M290 360H142A32 32 0 0 1 110 328V172A32 32 0 0 1 142 140H348A32 32 0 0 1 380 172V300" />
        <path d="M110 200H380" />
      </g>

      <!-- Title bar: two dots and the address pill. Filled, because at 10px a ring is a blur. -->
      <g fill="currentColor" stroke="none">
        <circle cx="152" cy="170" r="10" />
        <circle cx="196" cy="170" r="10" />
      </g>
      <path d="M240 170H340" stroke-width="20" />

      <!-- The glyph, centred in what the title bar and the gear leave behind. -->
      <g stroke-width="22">
        <path d="M196 248L166 282L196 316" />
        <path d="M268 238L216 326" />
        <path d="M290 248L320 282L290 316" />
      </g>

      <!-- Gear: a ring plus eight teeth on the diagonals and the axes. -->
      <circle cx="368" cy="368" r="40" stroke-width="22" />
      <path
        d="M412 368H426M399 399L409 409M368 412V426M337 399L327 409M324 368H310M337 337L327 327M368 324V310M399 337L409 327"
        stroke-width="16"
      />
    </svg>
  </span>
</template>
