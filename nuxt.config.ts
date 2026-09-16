import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { withReadingTime } from './lib/reading-time'

/**
 * Where the site is served from.
 *
 * GitHub Pages serves a project repository under /<repo>/. Nitro does *not* fold this into
 * `publicAssets[].baseURL` - those stay /_nuxt, /_fonts and so on - so anything that builds
 * a browser-facing URL out of them has to add this itself. The `nitro:init` hook below is
 * the only such place, and it reads this constant rather than repeating the literal.
 *
 * Trailing slash required: Nuxt concatenates rather than joins.
 */
const BASE_URL = '/hosseinvalikhaniwebsite/'

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

  // OG images, canonicals, feeds and the sitemap all derive from this. It is the *origin*
  // only — the project-pages subpath lives in app.baseURL below, and the SEO modules join
  // the two themselves. Repeating the subpath here produces doubled canonicals.
  site: { url: 'https://hosseinvalikhani.github.io', name: 'Personal Site', defaultLocale: 'en' },

  app: {
    /**
     * GitHub Pages serves a project repository from /<repo>/, not from the domain root, so
     * every asset URL, router path and prerendered link has to carry that prefix or it
     * resolves one level too high and 404s. Both slashes are required: Nuxt joins this with
     * asset paths by concatenation, so '/hosseinvalikhaniwebsite' would emit
     * '/hosseinvalikhaniwebsite_nuxt/…'.
     *
     * This is the only value that changes if the site moves to a custom domain or to a
     * <user>.github.io repository — both serve from the root, so it becomes '/'.
     */
    baseURL: BASE_URL,
  },

  // classSuffix: '' puts `.dark` / `.light` on <html>, which is what the token layer targets.
  // preference 'system' honours the visitor's OS setting on a first visit; fallback 'dark' is
  // what they get when that setting can't be read, since the brand is designed for ink.
  colorMode: { classSuffix: '', preference: 'system', fallback: 'dark', storageKey: 'ds-theme' },

  hooks: {
    /**
     * Put the font preloads back.
     *
     * @nuxt/fonts emits them through the Vite client manifest, and `features.noScripts` turns
     * that whole pipeline off — it is documented as removing "Nuxt scripts and JS resource
     * hints", and the font hints go with them. Measured, not assumed: building with noScripts
     * off produces two <link rel="preload" as="font"> tags, and building with it on produces
     * none.
     *
     * This cannot be done through `app.head`, which is serialised into the build before the
     * content hashes in the font filenames exist. `prerender:generate` is the first point where
     * both the HTML and the emitted files are available, so the links are injected there.
     *
     * Without them, `font-display: swap` paints the article in Arial and reflows it when Inter
     * arrives: CLS 0.159 on a long post against a 0.02 budget. The metric-override fallbacks
     * @nuxt/fonts generates correct ascent and descent but carry `size-adjust: 100%`, so advance
     * widths still change and a page of prose re-wraps. The fix is for the font to arrive before
     * the text is first painted, which is what a preload buys.
     */
    'nitro:init'(nitro) {
      /**
       * Which font each route preloads.
       *
       * Both families resolve to a single variable file, so this is a choice between families
       * rather than between weights — 48 KB of Inter and 31 KB of JetBrains Mono. All three
       * combinations were measured on a throttled mobile profile, and each one trades:
       *
       * - Neither: CLS 0.159 on a long post. `font-display: swap` repaints the article in Arial
       *   and reflows it when the real face lands.
       * - Both: every route CLS 0, but the home page's LCP sits at 1.5–1.7 s against a 1.5 s
       *   budget. 79 KB of fonts at high priority contend with the 6.8 KB stylesheet, and the
       *   stylesheet is what unblocks paint.
       * - Inter always, mono only where it earns it: every route CLS 0 and LCP a stable 1.5 s.
       *
       * The rule that fell out of the third: mono shifts a page in proportion to how much of the
       * page is set in it. Eyebrows and dates are a few short strings, and the metric-override
       * fallback absorbs them — blog and tag pages measure CLS 0 without the preload. A post full
       * of code blocks is a different question, and `<pre` is the honest test for that, because
       * it asks what the page actually contains rather than what its route is called.
       */
      const ALWAYS = ['Inter']
      const WHEN_CODE = ['JetBrains Mono']

      /** family -> the URLs it will be served from, read off the @font-face rules that use it. */
      let byFamily: Map<string, Set<string>> | undefined

      async function resolveFamilies() {
        const map = new Map<string, Set<string>>()

        /*
          The files are not in the output directory yet — public assets are copied there after
          prerendering. Nitro already knows where they are: `publicAssets` pairs every source
          directory it will serve with the base URL it will serve it under. @nuxt/fonts registers
          its cache directory against `/_fonts`, so that directory *is* the font directory rather
          than a parent of one — nothing below assumes either layout.
        */
        const urlFor = new Map<string, string>()
        for (const asset of nitro.options.publicAssets) {
          if (!existsSync(asset.dir)) continue
          // BASE_URL, not asset.baseURL alone: these become href attributes, and Nitro's
          // asset base stays /_fonts no matter where the app is mounted. Without the app
          // base the preload 404s while the stylesheet still works, because a relative
          // url() resolves correctly - so the font just arrives late and the layout shifts,
          // which is the exact regression the preload exists to prevent.
          const base = BASE_URL.replace(/\/$/, '') + (asset.baseURL ?? '/').replace(/\/$/, '')
          for (const file of await readdir(asset.dir)) {
            if (file.endsWith('.woff2')) urlFor.set(file, `${base}/${file}`)
          }
        }

        for (const asset of nitro.options.publicAssets) {
          if (!existsSync(asset.dir)) continue
          for (const name of await readdir(asset.dir)) {
            if (!name.endsWith('.css')) continue
            const css = await readFile(join(asset.dir, name), 'utf8')
            for (const block of css.match(/@font-face\s*\{[^}]*\}/g) ?? []) {
              const family = block.match(/font-family:\s*["']?([^"';}]+)/)?.[1]?.trim()
              if (!family) continue
              for (const file of block.match(/[\w-]+\.woff2/g) ?? []) {
                const url = urlFor.get(file)
                if (!url) continue
                if (!map.has(family)) map.set(family, new Set())
                map.get(family)!.add(url)
              }
            }
          }
        }

        if (!map.size) console.warn('[fonts] no @font-face rules found, so nothing will preload')
        return map
      }

      /**
       * Make every url() in a stylesheet absolute before inlining it.
       *
       * @nuxt/fonts writes `url(../_fonts/x.woff2)`, which is relative to the stylesheet at
       * `/_nuxt/entry.css` and therefore resolves to `/_fonts/x.woff2`. Inlined into a page, the
       * same text resolves against the *page* instead: correct at `/`, and 404 on `/blog/tag/css`,
       * where it becomes `/blog/_fonts/x.woff2`.
       *
       * That failure is close to invisible. The page still renders — in the fallback font — and
       * nothing errors except two console 404s. It was caught by Lighthouse's best-practices
       * score dropping to 96 on a nested route, which is the only reason this is not shipped.
       */
      function absolutise(css: string, stylesheetHref: string) {
        const base = new URL(stylesheetHref, 'http://localhost')
        return css.replace(/url\(\s*(['"]?)([^'")]+)['"]?\s*\)/g, (whole, quote, ref) => {
          if (/^(data:|https?:|\/\/|#|\/)/.test(ref)) return whole
          return `url(${quote}${new URL(ref, base).pathname}${quote})`
        })
      }

      nitro.hooks.hook('prerender:generate', async (route) => {
        if (!route.fileName?.endsWith('.html') || typeof route.contents !== 'string') return

        byFamily ??= await resolveFamilies()

        const families = [...ALWAYS, ...(route.contents.includes('<pre') ? WHEN_CODE : [])]
        const tags = families
          .flatMap(family => [...(byFamily!.get(family) ?? [])])
          .map(href => `<link rel="preload" as="font" type="font/woff2" crossorigin href="${href}">`)
          .join('')

        if (tags) route.contents = route.contents.replace('</head>', `${tags}</head>`)

        /*
          Inline the stylesheet rather than linking it.

          The whole site's CSS is 6.8 KB brotli — one render-blocking request whose only job is
          to unblock paint. Removing that round trip is worth 74ms of LCP on the home page and
          151ms on a post, measured as the median of three runs: it took the two worst routes
          from 1504ms, four milliseconds over the budget, to 1430 and 1353 with real headroom.

          The cost is that CSS is no longer a separately cached file shared between pages. At
          this size, on a thirteen-page site that prerenders the next navigation through
          speculation rules, that trade is clearly worth it — and LCP is measured on the visit
          where nothing is cached anyway.

          scripts/check-budget.mjs counts inline <style> as CSS for exactly this reason, so the
          bytes do not disappear from the budget by moving.
        */
        /*
          The href now carries the app base (/<repo>/_nuxt/entry.css), so this pattern must
          not anchor /_nuxt at the start of the path. While it did, the match failed, the
          replacement never ran, and every page shipped a linked stylesheet instead of an
          inlined one - no error, no warning, just the 74-151ms of LCP this block buys
          quietly handed back.
        */
        const cssHref = route.contents.match(/<link rel="stylesheet"[^>]*href="([^"]*\/_nuxt\/[^"]+\.css)"[^>]*>/)
        if (cssHref) {
          // asset.dir is registered against the bare /_nuxt, so the app base has to come
          // off before the remainder can be resolved against it.
          const assetPath = cssHref[1].startsWith(BASE_URL) ? `/${cssHref[1].slice(BASE_URL.length)}` : cssHref[1]

          for (const asset of nitro.options.publicAssets) {
            const file = join(asset.dir, assetPath.replace((asset.baseURL ?? '/').replace(/\/$/, ''), ''))
            if (!existsSync(file)) continue
            const css = await readFile(file, 'utf8')
            route.contents = route.contents.replace(cssHref[0], `<style>${absolutise(css, cssHref[1])}</style>`)
            break
          }
        }
      })
    },

    /** Reading time. The logic lives in lib/reading-time.ts so it can be unit tested. */
    'content:file:beforeParse'(ctx) {
      // Content v3 passes a context object, not the file itself — v2 passed the file, and the
      // difference shows up as "cannot read properties of undefined" rather than a type error.
      const file = ctx.file
      if (!file?.id?.endsWith('.md') || typeof file.body !== 'string') return

      file.body = withReadingTime(file.body)
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
    /*
      `preload` is opt-in here, and the default is a trap.
      @nuxt/fonts only preloads a face automatically when it has no `unicode-range` — and every
      face it generates from a Google family has one, so nothing was preloaded at all. The first
      Lighthouse run measured the result: CLS 0.159 on a long post, attributed to "Web font
      loaded", because `font-display: swap` reflowed the whole article when Inter arrived.

      The metric-override fallbacks @nuxt/fonts generates ("Inter Fallback: sans-serif") correct
      ascent and descent, which is why short pages barely shift — but `size-adjust` is 100%, so
      character advance widths still change and a page of prose re-wraps. Overrides alone cannot
      fix that; the font has to arrive before the text is painted.
    */
    defaults: {
      subsets: ['latin'],
      styles: ['normal'],
      fallbacks: { 'sans-serif': ['Arial'] },
      preload: true,
    },
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

  /*
    No client-side JavaScript.

    Phase 13 measured the framework floor at 88 KB gzipped — 98% of the JS budget before any of
    this site's own code — and none of it was doing work: every route is prerendered, the markup
    is final at build time, and hydration existed so that three controls could respond to a
    click. Those three now live in public/enhance.js, which is about 3 KB and is not compiled.

    `true` means production only, so dev keeps hot reload. That is safe because no component has
    a client-side handler any more: behaviour comes from enhance.js in both, so what is tested in
    dev is what ships.
  */
  features: { noScripts: true },

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
      // Nothing links to these, so the crawler cannot discover them on its own.
      routes: ['/', '/404', '/rss.xml', '/feed.json', '/llms.txt'],
    },
  },

  // Nothing but the style guide is disallowed; it is a development surface with no reason to
  // be indexed, and it is the only route excluded from the sitemap.
  //
  // robotsTxt is off because this deploys to a GitHub Pages *project* path. A crawler only
  // ever reads https://<host>/robots.txt — the origin root, which on github.io belongs to a
  // different repository — so a robots.txt emitted under /hosseinvalikhaniwebsite/ would
  // never be fetched by anything. @nuxtjs/robots hard-errors on the combination rather than
  // shipping a file that cannot work. The per-page `noindex` meta tags are unaffected and
  // still do the actual work; the sitemap has to be submitted to Search Console by hand.
  robots: { disallow: ['/design-system'], robotsTxt: false },

  // Two adjustments, both caused by serving from a base path rather than by bad markup.
  //
  // trailing-slash: every in-page anchor is now /hosseinvalikhaniwebsite/#section, and the
  // inspection reads that required base-path slash as a stray one — 116 warnings describing
  // correct markup. Real broken-link detection is a different inspection and stays on.
  linkChecker: {
    skipInspections: ['trailing-slash'],

    /*
      Both feeds are files written to the output root, not Nitro routes, so the link checker
      probes them against the prerender server — where server routes are mounted without the
      base prefix — and reports /<base>/rss.xml as a 404. The file is at .output/public/rss.xml
      and is served at /<base>/rss.xml, so the link is right and the probe is wrong. This is the
      same class of exclusion the module already ships for /llms.txt and /_* paths.

      Scoped to these two names rather than disabling no-error-response, which is the
      inspection that catches genuinely broken links.
    */
    excludeLinks: [/\/(rss\.xml|feed\.json)$/],
  },

  routeRules: {
    '/_nuxt/**': { headers: { 'cache-control': 'public,max-age=31536000,immutable' } },
    '/design-system': { robots: false, sitemap: false },
  },

  typescript: { strict: true, typeCheck: false }, // typecheck runs in CI, not in the dev loop
})
