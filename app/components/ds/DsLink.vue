<script setup lang="ts">
/**
 * A text link.
 *
 * Underlined by default and permanently — colour alone is not an accessible way to mark a link
 * inside a paragraph, and the echo blue against muted body text is exactly the case where that
 * matters. `underline` is opt-out only for links that are already unmistakable in context
 * (a nav item, a card title), never for one sitting in a sentence.
 */
const {
  to,
  external = false,
  underline = true,
  showExternalIcon = false,
} = defineProps<{
  to: string
  /** Forces the new-tab treatment. Inferred for http(s) and mailto targets. */
  external?: boolean
  underline?: boolean
  showExternalIcon?: boolean
}>()

const isExternal = computed(() => external || /^(https?:|mailto:|tel:)/.test(to))
// mailto: and tel: open a handler, not a tab — announcing "opens in a new tab" would be a lie.
const opensNewTab = computed(() => isExternal.value && /^https?:/.test(to))
</script>

<template>
  <NuxtLink
    :to="to"
    :target="opensNewTab ? '_blank' : undefined"
    :rel="opensNewTab ? 'noopener noreferrer' : undefined"
    class="inline-flex items-center gap-1 text-link transition-colors duration-fast hover:text-link-hover"
    :class="underline ? 'underline decoration-1 underline-offset-4' : ''"
  >
    <slot />
    <DsIcon v-if="showExternalIcon && opensNewTab" name="arrow-up-right" :size="16" />
    <DsVisuallyHidden v-if="opensNewTab">
      (opens in a new tab)
    </DsVisuallyHidden>
  </NuxtLink>
</template>
