import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  // Off because Nuxt DevTools 3.4.2 and Vite 8 disagree over `applyToEnvironment` hooks, which
  // prints a WARN on every dev start. Re-enable once that upstream mismatch is resolved.
  devtools: { enabled: false },

  modules: [
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxtjs/color-mode',
    '@nuxtjs/seo',
    '@nuxt/eslint',
  ],

  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  // Files in these directories already carry their own prefix (DsButton, TheHeader), so turn
  // off the directory prefix that would otherwise make them DsDsButton and LayoutTheHeader.
  //
  // Getting this wrong fails *silently* in a production build: Vue's "failed to resolve
  // component" warning is dev-only, so an unregistered <TheHeader /> renders as an empty
  // comment node and the build still reports success.
  components: [
    { path: '~/components/ds', pathPrefix: false },
    { path: '~/components/layout', pathPrefix: false },
    { path: '~/components/home', pathPrefix: false },
    { path: '~/components/blog', pathPrefix: false },
    // MDC resolves prose overrides by their bare name (ProseH2, ProsePre) at render time, so
    // these must be registered globally and without a prefix or Content silently falls back
    // to its own defaults.
    { path: '~/components/content', pathPrefix: false, global: true },
    '~/components',
  ],

  // TODO(phase 16): replace with the real domain before the production build —
  // OG images, canonicals, feeds and the sitemap all derive from this.
  site: { url: 'https://example.com', name: 'Personal Site', defaultLocale: 'en' },

  // classSuffix: '' puts `.dark` / `.light` on <html>, which is what the token layer targets.
  // preference 'system' honours the visitor's OS setting on a first visit; fallback 'dark' is
  // what they get when that setting can't be read, since the brand is designed for ink.
  colorMode: { classSuffix: '', preference: 'system', fallback: 'dark', storageKey: 'ds-theme' },

  hooks: {
    /**
     * Reading time. Nuxt Content has no built-in support, and a client-side word count would
     * mean shipping the post body to the listing page just to count it.
     *
     * The line ending has to be tolerated rather than assumed: authoring happens on Windows,
     * so a `\r\n` after the opening `---` is normal and a `/^---\n/` pattern would silently
     * match nothing, leaving readingTime undefined on every post with no error anywhere.
     */
    'content:file:beforeParse'(ctx) {
      // Content v3 passes a context object, not the file itself — v2 passed the file, and the
      // difference shows up as "cannot read properties of undefined" rather than a type error.
      const file = ctx.file
      if (!file?.id?.endsWith('.md') || typeof file.body !== 'string') return

      const words = file.body.split(/\s+/).filter(Boolean).length
      const minutes = Math.max(1, Math.ceil(words / 200))

      file.body = file.body.replace(/^---\r?\n/, match => `${match}readingTime: ${minutes}\n`)
    },
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: { default: 'github-light', dark: 'github-dark' },
          langs: ['ts', 'js', 'vue', 'bash', 'json', 'kotlin', 'css'],
        },
      },
    },
  },

  image: { format: ['avif', 'webp'], quality: 72, densities: [1, 2] },

  // Self-hosted, Latin-subset, with fallback metric overrides generated automatically so the
  // swap costs no layout shift. Two families is the budget — a third has to earn its request.
  fonts: {
    defaults: { subsets: ['latin'], styles: ['normal'], fallbacks: { 'sans-serif': ['Arial'] } },
    families: [
      { name: 'Inter', provider: 'google', weights: [400, 500, 600, 700, 800] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 700] },
    ],
  },

  // zeroRuntime: images are baked during prerender, so none of the rendering machinery reaches
  // the client. The fonts have to be declared explicitly — Satori has no access to the CSS or
  // to the self-hosted @nuxt/fonts files, and silently falls back to a default face otherwise.
  ogImage: {
    zeroRuntime: true,
    defaults: { width: 1200, height: 630 },
  },

  experimental: {
    payloadExtraction: true,
    // Visibility prefetch pulls every in-view route chunk over mobile data for no
    // measurable benefit on a site this small. Interaction-only is the cheaper default.
    defaults: { nuxtLink: { prefetch: true, prefetchOn: { visibility: false, interaction: true } } },
  },

  nitro: {
    compressPublicAssets: { gzip: true, brotli: true },
    prerender: {
      crawlLinks: true,
      // A broken prerender must break the build, not ship half a site.
      failOnError: true,
      // Routes are added as the phases that create them land: /blog (P8),
      // /rss.xml + /feed.json + /llms.txt (P11), /404.html (P9).
      // /404 is not linked from anywhere, so the crawler cannot discover it.
      routes: ['/', '/404'],
    },
  },

  routeRules: {
    '/_nuxt/**': { headers: { 'cache-control': 'public,max-age=31536000,immutable' } },
    '/design-system': { robots: false, sitemap: false },
  },

  typescript: { strict: true, typeCheck: false }, // typecheck runs in CI, not in the dev loop
})
