<script setup lang="ts">
/**
 * Cycles system → light → dark.
 *
 * Three states, not two: "system" is a real choice, and collapsing it into a binary toggle
 * means a visitor can never hand the decision back to their OS once they have touched it.
 *
 * There is no script behind this component any more — see public/enhance.js. What it leaves
 * behind is the reason the icon is chosen in CSS rather than in a render: the server cannot
 * know the visitor's stored preference, so it renders all three and lets an attribute pick.
 * That attribute is set before the toggle is ever pressed, so there is no frame where the
 * button shows the wrong state and no layout shift when the right one arrives.
 *
 * The label describes the *next* state ("Switch to light theme"), because that is what pressing
 * it will do. Labelling it with the current state is a common bug that makes the button read as
 * a status indicator rather than an action. The rendered default matches system → light; the
 * script corrects it to match the stored preference on load.
 */
</script>

<template>
  <button
    type="button"
    data-ds-theme-toggle
    data-ds-theme-pref="system"
    aria-label="Switch to light theme"
    class="ds-theme-toggle inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-fast hover:bg-raised hover:text-fg"
  >
    <DsIcon name="monitor" data-ds-theme-icon="system" />
    <DsIcon name="sun" data-ds-theme-icon="light" />
    <DsIcon name="moon" data-ds-theme-icon="dark" />
  </button>
</template>
