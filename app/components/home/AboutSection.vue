<script setup lang="ts">
/**
 * About.
 *
 * One column, capped at the prose measure. The temptation here is a two-column layout to fill
 * the width; at 120 words that produces two short, awkward columns and a reader who has to
 * track back up the page. Width is not something to spend just because it is there.
 */
const { profile } = useAppConfig()

/** Blank-line-separated paragraphs, so the copy in app.config can breathe without markup. */
const paragraphs = computed(() =>
  profile.about.split(/\n{2,}/).map(p => p.trim()).filter(Boolean),
)
</script>

<template>
  <DsSection id="about" eyebrow="01 — about" heading="About">
    <div class="max-w-prose space-y-6 text-lg text-fg-muted text-pretty">
      <p v-for="(paragraph, i) in paragraphs" :key="i">
        {{ paragraph }}
      </p>
    </div>
  </DsSection>
</template>
