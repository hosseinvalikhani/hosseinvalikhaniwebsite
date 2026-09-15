<script setup lang="ts">
const { profile, socials } = useAppConfig()

useHead({
  titleTemplate: title => (title ? `${title} · ${profile.name}` : profile.name),
  htmlAttrs: { lang: 'en' },
  link: [
    // Feed autodiscovery. Readers and browser extensions look for this in <head>; a feed that
    // exists but is not announced here is one that has to be guessed at by URL.
    { rel: 'alternate', type: 'application/rss+xml', title: `${profile.name} — RSS`, href: '/rss.xml' },
    { rel: 'alternate', type: 'application/feed+json', title: `${profile.name} — JSON Feed`, href: '/feed.json' },
  ],
})

/**
 * Site-wide structured data.
 *
 * Written through nuxt-schema-org rather than a hand-rolled <script type="application/ld+json">:
 * the module handles escaping, assigns stable @ids and merges every page's additions into one
 * graph. Hand-written JSON-LD on a per-page basis produces several disconnected graphs that
 * each re-declare the same person, which is exactly what confuses a parser.
 *
 * The @id here is what usePostSeo points an article's author at, so a post is attributed to
 * this person rather than repeating their details inline.
 */
useSchemaOrg([
  defineWebSite({ name: profile.name, description: profile.intro }),
  definePerson({
    '@id': `${useSiteConfig().url}/#identity`,
    'name': profile.name,
    'jobTitle': profile.title,
    'description': profile.intro,
    'image': profile.photo,
    // sameAs must agree with the rel="me" links in the footer — they are two statements of the
    // same claim, and a verifier that finds only one of them treats the profile as unconfirmed.
    'sameAs': socials.filter(s => s.isProfile).map(s => s.href),
  }),
])
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
