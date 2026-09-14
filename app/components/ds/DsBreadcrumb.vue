<script setup lang="ts">
/**
 * A breadcrumb trail.
 *
 * <nav aria-label="Breadcrumb"> wrapping an ordered list is the shape assistive technology
 * expects — the list conveys the hierarchy, and the label distinguishes this nav from the main
 * one. The current page is present but not a link, marked aria-current="page".
 *
 * Separators are drawn with CSS ::before rather than as text nodes, so they are never read out.
 */
export interface Crumb {
  label: string
  to?: string
}

const { items } = defineProps<{ items: Crumb[] }>()
</script>

<template>
  <nav aria-label="Breadcrumb">
    <ol class="flex flex-wrap items-center gap-x-1 text-sm">
      <li
        v-for="(item, i) in items"
        :key="item.label"
        class="flex items-center gap-x-1"
      >
        <span
          v-if="i > 0"
          aria-hidden="true"
          class="text-fg-subtle select-none"
        >/</span>

        <!--
          aria-current-value="false" is deliberate. Vue Router stamps aria-current="page" onto
          any exact-active link, so a crumb pointing at the page you are on would claim to be
          the current item alongside the final crumb — two "current page" markers in one trail.
          In a breadcrumb only the last item is ever current.
        -->
        <NuxtLink
          v-if="item.to && i < items.length - 1"
          :to="item.to"
          aria-current-value="false"
          class="rounded-chip px-1 py-1 text-fg-muted transition-colors duration-fast hover:text-fg"
        >
          {{ item.label }}
        </NuxtLink>
        <span v-else aria-current="page" class="px-1 py-1 text-fg">
          {{ item.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
