<script setup lang="ts">
// Phase 2 stub. The hero lands in Phase 6 and the rest of the home page in Phase 7.
// It exists now only so the token layer has somewhere to be seen outside the style guide.
const { profile } = useAppConfig()
</script>

<template>
  <main class="ds-glow min-h-dvh">
    <div class="mx-auto flex min-h-dvh max-w-page flex-col justify-center gap-6 px-6">
      <p class="font-mono text-eyebrow text-accent-text uppercase">
        Phase 2 · token layer
      </p>

      <h1 class="text-display">
        {{ profile.name }}
      </h1>

      <p class="max-w-prose text-lg text-fg-muted">
        {{ profile.intro }}
      </p>

      <p class="text-base text-fg-subtle">
        The designed home page arrives in Phases 6 and 7. For now, the thing worth reviewing is
        <NuxtLink to="/design-system" class="text-link underline underline-offset-4 hover:text-link-hover">
          the design system
        </NuxtLink>.
      </p>
    </div>
  </main>
</template>
