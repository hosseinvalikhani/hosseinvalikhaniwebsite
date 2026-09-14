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

  // TODO(phase 16): replace with the real domain before the production build —
  // OG images, canonicals, feeds and the sitemap all derive from this.
  site: { url: 'https://example.com', name: 'Personal Site', defaultLocale: 'en' },

  // classSuffix: '' puts `.dark` / `.light` on <html>, which is what the token layer targets.
  // preference 'system' honours the visitor's OS setting on a first visit; fallback 'dark' is
  // what they get when that setting can't be read, since the brand is designed for ink.
  colorMode: { classSuffix: '', preference: 'system', fallback: 'dark', storageKey: 'ds-theme' },

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

  // Off until Phase 10 builds the OG template. Enabling it early only emits renderer and
  // font-resolution warnings for images nothing links to yet. Phase 10 turns this into
  // `{ zeroRuntime: true, fonts: ['Inter:700', 'Inter:800'] }` — baked at build, no client runtime.
  ogImage: { enabled: false },

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
      routes: ['/'],
    },
  },

  routeRules: {
    '/_nuxt/**': { headers: { 'cache-control': 'public,max-age=31536000,immutable' } },
    '/design-system': { robots: false, sitemap: false },
  },

  typescript: { strict: true, typeCheck: false }, // typecheck runs in CI, not in the dev loop
})
