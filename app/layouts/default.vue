<script setup lang="ts">
/**
 * The page shell.
 *
 * Landmark order matters as much as the landmarks themselves: the skip link has to be the
 * first focusable element in the DOM, before the header, or it cannot do its job of letting
 * someone past the navigation.
 */
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <DsSkipLink to="#main" />
    <TheHeader />

    <!--
      tabindex="-1" is required for focus to actually land here when the skip link is followed;
      without it several browsers move the viewport but leave focus where it was, so the next
      Tab goes back into the nav.
    -->
    <main id="main" tabindex="-1" class="flex-1 focus-visible:outline-none">
      <slot />
    </main>

    <TheFooter />
  </div>
</template>
