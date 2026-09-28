<script setup lang="ts">
/**
 * The visible author of a post.
 *
 * This exists for the structured data as much as for the reader. `usePostSeo` declares the
 * post's author — `article:author` and the BlogPosting's `author` reference to the site-wide
 * Person — and schema describing someone the reader cannot see is exactly the "spammy
 * structured data" docs/seo.md rules out. The byline is that claim, made visibly.
 *
 * The avatar's alt is empty on purpose: the name is right next to it.
 */
const { profile } = useAppConfig()
</script>

<template>
  <NuxtLink
    to="/#about"
    aria-current-value="false"
    rel="author"
    class="group inline-flex min-h-11 items-center gap-3 rounded-chip"
  >
    <DsAvatar :src="profile.photo" alt="" :size="32" />
    <span class="flex flex-col leading-tight">
      <span class="text-sm font-semibold text-fg transition-colors duration-fast group-hover:text-accent-text">
        {{ profile.name }}
      </span>
      <span class="text-xs text-fg-subtle">{{ profile.title }}</span>
    </span>
  </NuxtLink>
</template>
