<script setup lang="ts">
/**
 * Phase 5 shell test.
 *
 * The sections are stubs with the right ids and headings so the header's active-section
 * tracking, the hash-link scroll offset and the overall vertical rhythm are all reviewable
 * now. Phase 6 replaces the hero; Phase 7 fills the rest with real content.
 */
const { profile } = useAppConfig()

useSeoMeta({
  title: profile.title,
  description: profile.intro,
})
</script>

<template>
  <div>
    <!-- Hero — rebuilt properly in Phase 6. -->
    <section class="ds-glow py-20 sm:py-28">
      <DsContainer>
        <DsEyebrow>Phase 5 · layout shell</DsEyebrow>
        <h1 class="mt-6 text-display">
          {{ profile.name }}
        </h1>
        <p class="mt-6 max-w-prose text-xl text-fg-muted">
          {{ profile.intro }}
        </p>
        <div class="mt-10 flex flex-wrap gap-3">
          <DsButton to="/#experience">
            View my work
          </DsButton>
          <DsButton to="/#contact" variant="secondary">
            Contact me
          </DsButton>
        </div>
      </DsContainer>
    </section>

    <DsSection id="about" eyebrow="01 — about" heading="About">
      <p class="max-w-prose text-lg text-fg-muted">
        {{ profile.about }}
      </p>
      <p class="mt-6 max-w-prose text-fg-subtle">
        Scroll slowly and watch the header: the underline should move to “About” as this section
        arrives, and the heading above should never be hidden behind the header when you jump
        here from the nav.
      </p>
    </DsSection>

    <DsSection id="experience" eyebrow="02 — experience" heading="Experience">
      <p class="max-w-prose text-lg text-fg-muted">
        A placeholder for the vertical journey. Phase 7 builds this as an ordered list, because
        the order is the information.
      </p>
      <div class="mt-8 h-64 rounded-card border border-dashed border-hairline-strong" />
    </DsSection>

    <DsSection id="skills" eyebrow="03 — skills" heading="Skills">
      <p class="max-w-prose text-lg text-fg-muted">
        A placeholder for the grouped skill lists.
      </p>
      <div class="mt-8 h-64 rounded-card border border-dashed border-hairline-strong" />
    </DsSection>

    <DsSection id="contact" eyebrow="04 — contact" heading="Contact">
      <p class="max-w-prose text-lg text-fg-muted">
        A placeholder for the one obvious action.
      </p>
      <div class="mt-8 h-64 rounded-card border border-dashed border-hairline-strong" />
    </DsSection>
  </div>
</template>
