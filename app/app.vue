<script setup lang="ts">
import { withBase } from 'ufo'

const { profile, socials } = useAppConfig()

/*
  Everything below is emitted into <head> as a literal string, so none of it passes through
  the router and nothing applies app.baseURL to it. On a GitHub Pages project site that
  prefix is not cosmetic: '/enhance.js' resolves to the domain root, which belongs to a
  different repository, and 404s — taking the theme toggle, the copy buttons and the dialog
  with it, silently, because progressive enhancement degrades rather than errors.

  withBase is idempotent, so this stays correct if the base ever becomes '/'.
*/
const base = useRuntimeConfig().app.baseURL

useHead({
  titleTemplate: title => (title ? `${title} · ${profile.name}` : profile.name),
  htmlAttrs: { lang: 'en' },
  link: [
    // Feed autodiscovery. Readers and browser extensions look for this in <head>; a feed that
    // exists but is not announced here is one that has to be guessed at by URL.
    { rel: 'alternate', type: 'application/rss+xml', title: `${profile.name} — RSS`, href: withBase('/rss.xml', base) },
    { rel: 'alternate', type: 'application/feed+json', title: `${profile.name} — JSON Feed`, href: withBase('/feed.json', base) },
  ],
  script: [
    /*
      The site's entire client-side runtime.

      `features.noScripts` removes Nuxt's own bundle, so this is the only script the browser
      executes. `defer` rather than `async` because it touches the DOM and there is no reason to
      race the parser for it — nothing above the fold depends on it having run.

      It is served from /public rather than bundled: it has no imports and no syntax that needs
      compiling, so keeping it out of the build means what ships is what is in the repo.
    */
    { src: withBase('/enhance.js', base), defer: true },
    {
      /*
        Speculation Rules. With no client router every navigation is a real one, so the browser
        is asked to prerender same-origin links it thinks you are about to follow. `moderate` is
        hover / pointer-down rather than "everything in view", which keeps this from pulling the
        whole site over a mobile connection.

        Pure progressive enhancement: a browser that does not know the type ignores it.
      */
      type: 'speculationrules',
      innerHTML: JSON.stringify({
        prerender: [{ where: { href_matches: '/*' }, eagerness: 'moderate' }],
      }),
    },
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
