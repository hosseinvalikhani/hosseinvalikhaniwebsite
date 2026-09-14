<script setup lang="ts">
const { id } = defineProps<{ id?: string }>()
</script>

<template>
  <h3 :id="id" class="mt-10 scroll-mt-[calc(var(--header-h)+1.5rem)] text-xl font-bold text-balance">
    <slot />
  </h3>
</template>
