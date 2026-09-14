<script setup lang="ts">
/**
 * The home page composes sections; it does not render them.
 *
 * Only the hero carries the <h1>; every section below owns exactly one <h2> through DsSection.
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
    <AboutSection />
    <ExperienceSection />
    <SkillsSection />
    <ContactSection />
  </div>
</template>
