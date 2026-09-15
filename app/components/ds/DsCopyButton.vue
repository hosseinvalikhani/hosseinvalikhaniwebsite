<script setup lang="ts">
/**
 * Copies text to the clipboard and confirms it.
 *
 * The behaviour is in public/enhance.js; what stays here is the markup contract it depends on.
 * Both icons are rendered and swapped in CSS on `data-ds-copy-state`, for the same reason the
 * theme toggle renders all three of its own: the server cannot know the state, and an icon that
 * appears only after script runs is a layout shift waiting to happen.
 *
 * The confirmation is both visible and announced — a purely visual tick tells a screen-reader
 * user nothing, and `navigator.clipboard` gives no feedback of its own. Failure is reported
 * rather than assumed away: clipboard access is unavailable on insecure origins and can be
 * denied outright, and showing a tick for something that never happened is worse than silence.
 */
const { value, label = 'Copy' } = defineProps<{
  value: string
  label?: string
}>()
</script>

<template>
  <button
    type="button"
    :data-ds-copy="value"
    :data-ds-copy-idle-label="label"
    data-ds-copy-state="idle"
    class="ds-copy-button inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-fg-muted transition-colors duration-fast hover:bg-raised hover:text-fg"
  >
    <DsIcon name="copy" :size="18" data-ds-copy-icon="idle" />
    <DsIcon name="check" :size="18" data-ds-copy-icon="copied" />
    <span data-ds-copy-label>{{ label }}</span>
  </button>
</template>
