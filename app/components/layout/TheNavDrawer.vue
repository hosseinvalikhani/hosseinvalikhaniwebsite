<script setup lang="ts">
/**
 * Mobile navigation.
 *
 * This is DsDialog with nav inside it — there is no separate drawer implementation, no focus
 * trap, no scroll lock and no `inert` bookkeeping, because `showModal()` already does all of
 * that.
 *
 * It is rendered on every page rather than mounted on demand. Deferring it used to buy a
 * JavaScript chunk that was not downloaded until the menu was opened; with no client bundle
 * left to defer, that trade is gone and all it would cost now is a dialog that is not in the
 * DOM when the button asking to open it is pressed.
 */
const { nav } = useAppConfig()
</script>

<template>
  <DsDialog id="nav-drawer" title="Navigation" hide-title>
    <nav aria-label="Mobile">
      <ul class="flex flex-col gap-1">
        <li v-for="item in nav" :key="item.to">
          <NuxtLink
            :to="item.to"
            aria-current-value="false"
            class="flex min-h-11 items-center rounded-control px-4 text-lg font-medium text-fg-muted transition-colors duration-fast hover:bg-raised hover:text-fg"
          >
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </DsDialog>
</template>
