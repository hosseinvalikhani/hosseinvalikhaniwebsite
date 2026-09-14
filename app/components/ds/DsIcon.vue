<script setup lang="ts">
import { type IconDefinition, icons, type IconName } from '~/design/icons'

/**
 * An icon is always decorative.
 *
 * It is `aria-hidden` with no exceptions: meaning lives in the label of whatever contains it.
 * That rule is what makes `DsButton`'s icon-only variant require an `aria-label` — there is no
 * way for an icon to carry the name itself, so the API forces the caller to supply one.
 */
const { name, size = 20 } = defineProps<{
  name: IconName
  /** Rendered size in px. The grid is 24×24, so 20 and 24 stay crisp. */
  size?: number
}>()

// `as const satisfies` keeps IconName a literal union, but narrows each entry to its own
// shape — so widen back to the common interface for use here.
const icon = computed<IconDefinition>(() => icons[name])
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :width="size"
    :height="size"
    aria-hidden="true"
    focusable="false"
    :fill="icon.filled ? 'currentColor' : 'none'"
    :stroke="icon.filled ? undefined : 'currentColor'"
    :stroke-width="icon.filled ? undefined : 2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0"
  >
    <path :d="icon.d" />
  </svg>
</template>
