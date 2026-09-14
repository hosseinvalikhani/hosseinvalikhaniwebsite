<script setup lang="ts">
/**
 * Copies text to the clipboard and confirms it.
 *
 * The confirmation is both visible and announced — a purely visual tick tells a screen-reader
 * user nothing, and `navigator.clipboard` gives no feedback of its own.
 *
 * Clipboard access is unavailable on insecure origins and can be denied outright, so failure is
 * handled rather than assumed away: the button reports that copying failed instead of showing a
 * tick for something that never happened.
 */
const { value, label = 'Copy' } = defineProps<{
  value: string
  label?: string
}>()

type State = 'idle' | 'copied' | 'failed'
const state = ref<State>('idle')
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(value)
    state.value = 'copied'
  }
  catch {
    state.value = 'failed'
  }

  clearTimeout(timer)
  timer = setTimeout(() => { state.value = 'idle' }, 2000)
}

onBeforeUnmount(() => clearTimeout(timer))

const announcement = computed(() => {
  if (state.value === 'copied') return 'Copied to clipboard'
  if (state.value === 'failed') return 'Could not copy to clipboard'
  return ''
})
</script>

<template>
  <div class="inline-flex items-center gap-2">
    <button
      type="button"
      class="inline-flex min-h-11 items-center gap-2 rounded-control px-3 text-sm font-medium text-fg-muted transition-colors duration-fast hover:bg-raised hover:text-fg"
      @click="copy"
    >
      <DsIcon :name="state === 'copied' ? 'check' : 'copy'" :size="18" />
      <span>{{ state === 'copied' ? 'Copied' : state === 'failed' ? 'Failed' : label }}</span>
    </button>

    <DsVisuallyHidden role="status" aria-live="polite">
      {{ announcement }}
    </DsVisuallyHidden>
  </div>
</template>
