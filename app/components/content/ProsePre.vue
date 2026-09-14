<script setup lang="ts">
/**
 * Fenced code block.
 *
 * Two accessibility requirements that are easy to miss:
 *
 * 1. A scrollable region must be reachable by keyboard. A `<pre>` with `overflow-x: auto` can
 *    only be scrolled with a pointer unless it is focusable, so `tabindex="0"` is not optional
 *    here — it is the only way to read a long line without a mouse.
 * 2. A focusable region needs an accessible name, or a screen reader announces it as an
 *    unlabelled group. `role="region"` plus a label naming the language does that.
 *
 * The copy button takes the raw `code` prop rather than scraping textContent, which would pick
 * up the syntax-highlighting markup and any line numbers along with it.
 */
const { code = '', language, filename } = defineProps<{
  code?: string
  language?: string
  filename?: string
  highlights?: number[]
  meta?: string
}>()

const label = computed(() =>
  filename ?? (language ? `${language} code` : 'Code'),
)
</script>

<template>
  <div class="mt-6 overflow-hidden rounded-panel border border-hairline bg-surface">
    <div class="flex items-center justify-between gap-2 border-b border-hairline ps-4 pe-2 py-1.5">
      <span class="font-mono text-xs text-fg-subtle">
        {{ filename ?? language ?? 'text' }}
      </span>
      <DsCopyButton :value="code" label="Copy" />
    </div>

    <pre
      tabindex="0"
      role="region"
      :aria-label="label"
      class="overflow-x-auto p-4 font-mono text-sm leading-relaxed"
    ><slot /></pre>
  </div>
</template>
