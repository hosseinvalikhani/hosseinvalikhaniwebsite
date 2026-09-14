<script setup lang="ts">
/**
 * Mobile navigation.
 *
 * This is DsDialog with nav inside it — there is no separate drawer implementation, no focus
 * trap, no scroll lock and no `inert` bookkeeping, because `showModal()` already does all of
 * that. The only thing this component adds is closing on navigation.
 */
const open = defineModel<boolean>('open', { default: false })
const { nav } = useAppConfig()
</script>

<template>
  <DsDialog v-model:open="open" title="Navigation" hide-title>
    <nav aria-label="Mobile">
      <ul class="flex flex-col gap-1">
        <li v-for="item in nav" :key="item.to">
          <NuxtLink
            :to="item.to"
            class="flex min-h-11 items-center rounded-control px-4 text-lg font-medium text-fg-muted transition-colors duration-fast hover:bg-raised hover:text-fg"
            @click="open = false"
          >
            {{ item.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </DsDialog>
</template>
