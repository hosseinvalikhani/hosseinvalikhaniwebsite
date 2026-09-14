<script setup lang="ts">
import type { IconName } from '~/design/icons'

/**
 * Cycles system → light → dark.
 *
 * Three states, not two: "system" is a real choice, and collapsing it into a binary toggle
 * means a visitor can never hand the decision back to their OS once they have touched it.
 *
 * The label describes the *next* state ("Switch to light theme"), because that is what
 * activating the control will do. Labelling it with the current state is a common bug that
 * makes the button read as a status indicator rather than an action.
 */
const colorMode = useColorMode()

const ORDER = ['system', 'light', 'dark'] as const
type Mode = (typeof ORDER)[number]

const ICONS: Record<Mode, IconName> = {
  system: 'monitor',
  light: 'sun',
  dark: 'moon',
}

const current = computed<Mode>(() => (ORDER.includes(colorMode.preference as Mode) ? colorMode.preference as Mode : 'system'))
const next = computed<Mode>(() => ORDER[(ORDER.indexOf(current.value) + 1) % ORDER.length]!)

/**
 * The server cannot know the visitor's stored preference, so rendering the real icon during SSR
 * would mismatch on hydration. The button keeps its exact dimensions either way, so swapping the
 * icon in after mount costs no layout shift.
 */
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

/** Announced politely so the change is perceivable without sight. */
const announcement = ref('')

function cycle() {
  colorMode.preference = next.value
  announcement.value = current.value === 'system'
    ? 'Theme follows your system setting'
    : `${current.value[0]!.toUpperCase()}${current.value.slice(1)} theme`
}
</script>

<template>
  <div class="flex items-center">
    <button
      type="button"
      class="inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-fast hover:bg-raised hover:text-fg"
      :aria-label="`Switch to ${next} theme`"
      @click="cycle"
    >
      <DsIcon v-if="mounted" :name="ICONS[current]" />
      <span v-else class="size-5" aria-hidden="true" />
    </button>

    <DsVisuallyHidden role="status" aria-live="polite">
      {{ announcement }}
    </DsVisuallyHidden>
  </div>
</template>
