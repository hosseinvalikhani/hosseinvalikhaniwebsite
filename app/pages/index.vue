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
  ogTitle: `${profile.name} — ${profile.title}`,
  ogDescription: profile.intro,
  ogType: 'profile',
  twitterCard: 'summary_large_image',
})

defineOgImageComponent('Default', {
  title: profile.name,
  name: profile.title,
  label: 'Personal site',
})

/**
 * ProfilePage, not WebPage. It is the accurate type for a site that is about a person, and it
 * is what lets the Person entity carry knowsAbout from the skills already on the page.
 */
useSchemaOrg([
  defineWebPage({ '@type': 'ProfilePage' }),
])
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
