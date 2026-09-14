<script setup lang="ts">
/**
 * A table wider than the measure has to scroll inside its own box — otherwise it pushes the
 * whole page sideways, which breaks reflow at 400% zoom and on narrow phones.
 *
 * As with ProsePre, a scroll container that a pointer can reach but a keyboard cannot is a
 * failure: tabindex makes it focusable and the role plus label stop it being announced as an
 * anonymous group.
 */
</script>

<template>
  <div
    tabindex="0"
    role="region"
    aria-label="Table"
    class="mt-6 overflow-x-auto rounded-panel border border-hairline"
  >
    <table class="w-full border-collapse text-left text-base">
      <slot />
    </table>
  </div>
</template>
