<script setup lang="ts">
/**
 * The home page composes sections; it does not render them. Phase 7 replaces the remaining
 * stubs with AboutSection, ExperienceSection, SkillsSection and ContactSection.
 */
const { profile } = useAppConfig()

useSeoMeta({
  title: profile.title,
  description: profile.intro,
})
</script>

<template>
  <div>
    <HeroSection />

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
