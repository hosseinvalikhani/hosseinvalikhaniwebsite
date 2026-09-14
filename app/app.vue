<script setup lang="ts">
const { profile } = useAppConfig()

useHead({
  titleTemplate: title => (title ? `${title} · ${profile.name}` : profile.name),
  htmlAttrs: { lang: 'en' },
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
