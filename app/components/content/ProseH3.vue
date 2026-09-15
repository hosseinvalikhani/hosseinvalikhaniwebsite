<script setup lang="ts">
const { id } = defineProps<{ id?: string }>()
</script>

<template>
  <h3 :id="id" class="mt-10 text-xl font-bold text-balance">
    <slot />
  </h3>
</template>
