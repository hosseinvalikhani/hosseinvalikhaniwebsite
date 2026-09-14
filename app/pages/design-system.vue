<script setup lang="ts">
/**
 * Living style guide.
 *
 * This is the review surface for Phases 2–4: every token and, later, every component in every
 * state, on one page, in both themes. It is the fastest way to catch a value that only works
 * in dark mode.
 *
 * It is the one documented place allowed to reference raw ramp values — it exists to display
 * them. Everywhere else, semantic utilities only.
 */
import { icons, type IconName } from '~/design/icons'

definePageMeta({ robots: 'noindex, nofollow' })

useHead({ title: 'Design system' })

const { profile } = useAppConfig()
const iconNames = Object.keys(icons) as IconName[]
const dialogOpen = ref(false)

const colorMode = useColorMode()
const modes = ['system', 'light', 'dark'] as const
type Mode = (typeof modes)[number]

function setTheme(mode: Mode) {
  colorMode.preference = mode
}

/* ---------------------------------------------------------------- *
 * Tier 1 — the ramps, transcribed from the brand source.
 * ---------------------------------------------------------------- */
interface Ramp {
  name: string
  note: string
  prefix: string
  steps: { step: string, hex: string }[]
}

const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

/**
 * Pick ink or white for a step label by actual contrast rather than by a guessed step
 * threshold — the three ramps cross the readable line at different steps, so a fixed
 * cut-off ("white from 500 up") fails on at least one of them.
 */
function readableOn(hex: string): string {
  const channel = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  const [r, g, b] = [1, 3, 5].map(i => channel(Number.parseInt(hex.slice(i, i + 2), 16) / 255)) as [number, number, number]
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const against = (other: number) => (Math.max(luminance, other) + 0.05) / (Math.min(luminance, other) + 0.05)
  // #020420 has a luminance of ~0.0033; white is 1.
  return against(0.0033) >= against(1) ? '#020420' : '#FFFFFF'
}

function ramp(name: string, note: string, prefix: string, hexes: string[]): Ramp {
  return { name, note, prefix, steps: STEPS.map((step, i) => ({ step, hex: hexes[i]! })) }
}

const ramps: Ramp[] = [
  ramp('Green', 'the Nuxt ramp — brand sits at 400', 'brand', [
    '#EFFDF5', '#D9FBE8', '#B3F5D1', '#75EDAE', '#00DC82', '#00C16A',
    '#00A155', '#007F45', '#016538', '#0A5331', '#052E16',
  ]),
  ramp('Sky', 'the Tailwind ramp — echo sits at 400', 'echo', [
    '#F0F9FF', '#E0F2FE', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0EA5E9',
    '#0284C7', '#0369A1', '#075985', '#0C4A6E', '#082F49',
  ]),
  ramp('Slate', 'the neutral backbone — text, surfaces, borders', 'slate', [
    '#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B',
    '#475569', '#334155', '#1E293B', '#0F172A', '#020617',
  ]),
]

/* ---------------------------------------------------------------- *
 * Tier 2 — semantic roles. Values are read live from the document so
 * this table always shows what the *current* theme actually resolves to,
 * rather than a hardcoded copy that can drift out of date.
 * ---------------------------------------------------------------- */
interface Role {
  token: string
  role: string
}

const roleGroups: { group: string, roles: Role[] }[] = [
  {
    group: 'Surfaces',
    roles: [
      { token: 'canvas', role: 'The page itself. 60% of what you see.' },
      { token: 'surface', role: 'Cards and raised panels.' },
      { token: 'raised', role: 'A panel on top of a card.' },
      { token: 'hairline', role: '1px rules and card edges.' },
      { token: 'hairline-strong', role: 'Borders that need to be seen, not sensed.' },
    ],
  },
  {
    group: 'Type',
    roles: [
      { token: 'fg', role: 'Headings and body. 30% of what you see.' },
      { token: 'fg-muted', role: 'Secondary copy and captions.' },
      { token: 'fg-subtle', role: 'Metadata and de-emphasised labels.' },
    ],
  },
  {
    group: 'Accent',
    roles: [
      { token: 'accent', role: 'Fills. Same hue in both themes. ~8%, one element per screen.' },
      { token: 'accent-text', role: 'Green as type — steps to 700 in light mode.' },
      { token: 'accent-hover', role: 'The fill under the pointer.' },
      { token: 'on-accent', role: 'Text sitting on an accent fill. Ink, not white.' },
    ],
  },
  {
    group: 'Support',
    roles: [
      { token: 'link', role: 'Links. The echo colour. ~2%.' },
      { token: 'link-hover', role: 'Link under the pointer.' },
      { token: 'signal', role: 'Emphasis only. The exclamation mark you almost never use.' },
      { token: 'danger', role: 'Errors and destructive actions.' },
      { token: 'focus', role: 'The focus ring. Never removed.' },
    ],
  },
]

const resolved = ref<Record<string, string>>({})

function readTokens() {
  if (!import.meta.client) return
  const style = getComputedStyle(document.documentElement)
  const next: Record<string, string> = {}
  for (const { roles } of roleGroups) {
    for (const { token } of roles) next[token] = style.getPropertyValue(`--ds-${token}`).trim()
  }
  resolved.value = next
}

onMounted(() => {
  readTokens()
  // The class flip happens after the preference change, so read on the next frame.
  watch(() => colorMode.value, () => requestAnimationFrame(readTokens))
})

/* ---------------------------------------------------------------- *
 * Measured contrast, straight from the brand source. This table is why
 * `accent` and `accent-text` are two separate tokens.
 * ---------------------------------------------------------------- */
const contrast = [
  { colour: 'Nuxt Green #00DC82', on: 'Ink #020420', ratio: '11.1:1', pass: true, use: 'Headlines, buttons, icons' },
  { colour: 'Sky #38BDF8', on: 'Ink #020420', ratio: '9.4:1', pass: true, use: 'Links, tags' },
  { colour: 'Signal Amber #FBBF24', on: 'Ink #020420', ratio: '12.1:1', pass: true, use: 'Emphasis, pull quotes' },
  { colour: 'Mist #94A3B8', on: 'Ink #020420', ratio: '7.9:1', pass: true, use: 'Captions, metadata' },
  { colour: 'Nuxt Green #00DC82', on: 'White #FFFFFF', ratio: '1.8:1', pass: false, use: 'Never as text on light' },
  { colour: 'Sky #38BDF8', on: 'White #FFFFFF', ratio: '2.1:1', pass: false, use: 'Never as text on light' },
  { colour: 'Green 700 #007F45', on: 'White #FFFFFF', ratio: '5.1:1', pass: true, use: 'Green text on light' },
  { colour: 'Sky 700 #0369A1', on: 'White #FFFFFF', ratio: '5.9:1', pass: true, use: 'Sky text on light' },
]

/* ---------------------------------------------------------------- *
 * Scales
 * ---------------------------------------------------------------- */
const typeScale = [
  { token: 'text-display', sample: 'Building on the web', note: 'Hero h1. Inter 800, -0.035em, 0.95 line-height.' },
  { token: 'text-3xl', sample: 'Section heading', note: 'h2' },
  { token: 'text-2xl', sample: 'Sub heading', note: 'h3, post card titles' },
  { token: 'text-xl', sample: 'Lead paragraph', note: 'Hero intro, section lead' },
  { token: 'text-lg', sample: 'Body large', note: 'Long-form body copy' },
  { token: 'text-base', sample: 'Body', note: 'Default UI text' },
  { token: 'text-sm', sample: 'Small', note: 'Metadata, captions' },
]

const radii = [
  { token: 'radius-chip', label: 'chip', note: 'Badges, tags' },
  { token: 'radius-control', label: 'control', note: 'Buttons, inputs' },
  { token: 'radius-panel', label: 'panel', note: 'Code blocks, dialogs' },
  { token: 'radius-card', label: 'card', note: 'Cards — the brand source value' },
]

const proportion = [
  { label: 'Ink & Surface — canvas', pct: '60%', width: '100%', swatch: 'var(--ds-surface)', note: 'Backgrounds, cards. Almost everything.' },
  { label: 'Cloud & Mist — type', pct: '30%', width: '76%', swatch: 'linear-gradient(90deg, var(--ds-fg), var(--ds-fg-muted))', note: 'Headings in fg, secondary in muted. Never green body text.' },
  { label: 'Accent — one thing per screen', pct: '8%', width: '34%', swatch: 'var(--ds-accent)', note: 'The single element you want clicked or read first.' },
  { label: 'Link & Signal — seasoning', pct: '2%', width: '14%', swatch: 'linear-gradient(90deg, var(--ds-link), var(--ds-signal))', note: 'Links, tags, emphasis. Amber only for emphasis.' },
]
</script>

<template>
  <div>
    <DsSkipLink to="#main" />

    <!-- tabindex="-1" is what lets focus actually land here when the skip link is followed. -->
    <main id="main" tabindex="-1" class="min-h-dvh bg-canvas text-fg focus-visible:outline-none">
      <div class="mx-auto max-w-page px-6 py-16">
      <!-- ── Header ─────────────────────────────────────────────── -->
      <header class="ds-glow pb-12">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          Phase 2 · token layer
        </p>
        <h1 class="mt-5 text-3xl">
          Design system
        </h1>
        <p class="mt-4 max-w-prose text-lg text-fg-muted">
          Every colour, type size and radius the site is allowed to use. Check this page in
          <strong class="font-semibold text-fg">both themes</strong> — a value that only works in one
          of them is the single most common design-system bug, and it is cheapest to catch here.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <span class="font-mono text-sm text-fg-subtle">theme</span>
          <div class="flex gap-1 rounded-control border border-hairline p-1">
            <button
              v-for="mode in modes"
              :key="mode"
              type="button"
              class="rounded-chip px-3 py-1.5 text-sm font-medium transition-colors duration-fast"
              :class="colorMode.preference === mode
                ? 'bg-accent text-on-accent'
                : 'text-fg-muted hover:bg-raised hover:text-fg'"
              :aria-pressed="colorMode.preference === mode"
              @click="setTheme(mode)"
            >
              {{ mode }}
            </button>
          </div>
          <span class="font-mono text-sm text-fg-subtle">resolved: {{ colorMode.value }}</span>
        </div>
      </header>

      <!-- ── Ramps ──────────────────────────────────────────────── -->
      <section aria-labelledby="ramps" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          01 — primitives
        </p>
        <h2 id="ramps" class="mt-4 text-2xl">
          Three ramps, eleven steps each
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          Tier 1. Application code never touches these directly — they exist so the semantic
          tokens below have somewhere to point.
        </p>

        <div class="mt-10 space-y-10">
          <div v-for="r in ramps" :key="r.prefix">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <h3 class="text-lg font-bold">
                {{ r.name }}
              </h3>
              <p class="text-sm text-fg-subtle">
                {{ r.note }}
              </p>
            </div>

            <div class="mt-3 overflow-hidden rounded-panel border border-hairline">
              <div class="flex">
                <div
                  v-for="s in r.steps"
                  :key="s.step"
                  class="flex h-24 flex-1 items-end justify-center pb-2 font-mono text-xs font-bold"
                  :style="{ background: s.hex, color: readableOn(s.hex) }"
                >
                  {{ s.step }}
                </div>
              </div>
            </div>
            <div class="mt-2 flex">
              <span
                v-for="s in r.steps"
                :key="s.step"
                class="flex-1 text-center font-mono text-[0.65rem] text-fg-subtle"
              >{{ s.hex.replace('#', '') }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Semantic roles ─────────────────────────────────────── -->
      <section aria-labelledby="roles" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          02 — semantic
        </p>
        <h2 id="roles" class="mt-4 text-2xl">
          The tokens components actually use
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          Tier 2. Each one names a <em>role</em>, not a colour, which is why flipping the theme
          changes everything at once. Hex values below are read live from the document, so they
          show what this theme resolves to right now.
        </p>

        <div class="mt-10 space-y-10">
          <div v-for="g in roleGroups" :key="g.group">
            <h3 class="font-mono text-eyebrow text-fg-subtle uppercase">
              {{ g.group }}
            </h3>
            <ul class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <li
                v-for="role in g.roles"
                :key="role.token"
                class="overflow-hidden rounded-card border border-hairline bg-surface"
              >
                <div
                  class="h-16 border-b border-hairline"
                  :style="{ background: `var(--ds-${role.token})` }"
                />
                <div class="p-4">
                  <p class="font-mono text-sm font-bold">
                    {{ role.token }}
                  </p>
                  <p class="mt-1 font-mono text-xs text-fg-subtle uppercase">
                    {{ resolved[role.token] || '—' }}
                  </p>
                  <p class="mt-2 text-sm text-fg-muted">
                    {{ role.role }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ── Contrast ───────────────────────────────────────────── -->
      <section aria-labelledby="contrast" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          03 — legibility
        </p>
        <h2 id="contrast" class="mt-4 text-2xl">
          The one rule that actually matters
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          Both brand colours are bright: excellent on ink, failing on white. That is the whole
          reason <code class="font-mono text-accent-text">accent</code> and
          <code class="font-mono text-accent-text">accent-text</code> are two different tokens.
        </p>

        <div class="mt-8 overflow-x-auto">
          <table class="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr class="border-b border-hairline">
                <th scope="col" class="py-3 pr-4 font-mono text-eyebrow text-fg-subtle uppercase">
                  Colour
                </th>
                <th scope="col" class="py-3 pr-4 font-mono text-eyebrow text-fg-subtle uppercase">
                  On
                </th>
                <th scope="col" class="py-3 pr-4 font-mono text-eyebrow text-fg-subtle uppercase">
                  Ratio
                </th>
                <th scope="col" class="py-3 pr-4 font-mono text-eyebrow text-fg-subtle uppercase">
                  WCAG
                </th>
                <th scope="col" class="py-3 font-mono text-eyebrow text-fg-subtle uppercase">
                  Use for
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in contrast" :key="row.colour + row.on" class="border-b border-hairline">
                <td class="py-3 pr-4 text-sm font-medium">
                  {{ row.colour }}
                </td>
                <td class="py-3 pr-4 text-sm text-fg-muted">
                  {{ row.on }}
                </td>
                <td class="py-3 pr-4 font-mono text-sm font-bold">
                  {{ row.ratio }}
                </td>
                <td class="py-3 pr-4 text-sm font-bold" :class="row.pass ? 'text-accent-text' : 'text-danger'">
                  {{ row.pass ? 'PASS AA' : 'FAIL' }}
                </td>
                <td class="py-3 text-sm text-fg-muted">
                  {{ row.use }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ── Proportion ─────────────────────────────────────────── -->
      <section aria-labelledby="proportion" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          04 — proportion
        </p>
        <h2 id="proportion" class="mt-4 text-2xl">
          Use them in this ratio
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          The fastest way to make a palette look amateur is to use all of it equally. Keep the
          loud colours rare — if you can see green twice on one screen, something is wrong.
        </p>

        <ul class="mt-8 space-y-6">
          <li v-for="p in proportion" :key="p.label">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span class="font-medium">{{ p.label }}</span>
              <span class="font-mono text-sm font-bold text-fg-muted">{{ p.pct }}</span>
            </div>
            <div
              class="mt-2 h-6 rounded-chip border border-hairline"
              :style="{ background: p.swatch, width: p.width }"
            />
            <p class="mt-2 text-sm text-fg-subtle">
              {{ p.note }}
            </p>
          </li>
        </ul>
      </section>

      <!-- ── Type ───────────────────────────────────────────────── -->
      <section aria-labelledby="type" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          05 — type
        </p>
        <h2 id="type" class="mt-4 text-2xl">
          Two families, one fluid scale
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          Inter for everything readable, JetBrains Mono for eyebrows, dates and code. The scale
          uses <code class="font-mono text-accent-text">clamp()</code>, so
          <strong class="font-semibold text-fg">resize the window</strong> — sizes should glide,
          never snap.
        </p>

        <ul class="mt-10 space-y-8">
          <li v-for="t in typeScale" :key="t.token" class="border-b border-hairline pb-8 last:border-0">
            <div class="flex flex-wrap items-baseline justify-between gap-3">
              <span class="font-mono text-sm text-accent-text">{{ t.token }}</span>
              <span class="text-sm text-fg-subtle">{{ t.note }}</span>
            </div>
            <p class="mt-3" :class="t.token">
              {{ t.sample }}
            </p>
          </li>
        </ul>

        <div class="mt-10 rounded-card border border-hairline bg-surface p-6">
          <p class="font-mono text-eyebrow text-accent-text uppercase">
            The signature device
          </p>
          <h3 class="mt-4 text-2xl">
            A mono eyebrow above every heading
          </h3>
          <p class="mt-3 max-w-prose text-fg-muted">
            One device, used consistently, is what makes a site feel designed rather than
            decorated. Everything above this line uses it — scroll back and check it reads as a
            system rather than as repetition.
          </p>
        </div>
      </section>

      <!-- ── Shape & motion ─────────────────────────────────────── -->
      <section aria-labelledby="shape" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          06 — shape & motion
        </p>
        <h2 id="shape" class="mt-4 text-2xl">
          Four radii, three durations
        </h2>

        <ul class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li v-for="r in radii" :key="r.token" class="rounded-card border border-hairline bg-surface p-5">
            <div
              class="h-20 border border-hairline-strong bg-raised"
              :style="{ borderRadius: `var(--${r.token})` }"
            />
            <p class="mt-4 font-mono text-sm font-bold">
              {{ r.label }}
            </p>
            <p class="mt-1 text-sm text-fg-muted">
              {{ r.note }}
            </p>
          </li>
        </ul>

        <div class="mt-8 rounded-card border border-hairline bg-surface p-6">
          <p class="text-sm text-fg-muted">
            Hover the swatch: <code class="font-mono text-accent-text">duration-base</code> with
            <code class="font-mono text-accent-text">ease-out-quint</code>. With OS reduce-motion
            on it should change instantly, with no easing at all.
          </p>
          <div
            class="mt-4 h-16 w-16 rounded-control bg-accent transition-all duration-base ease-out-quint hover:w-48"
          />
        </div>
      </section>

      <!-- ── Focus ──────────────────────────────────────────────── -->
      <section aria-labelledby="focus" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          07 — focus
        </p>
        <h2 id="focus" class="mt-4 text-2xl">
          One focus ring, everywhere
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          Declared once in the base layer and never removed. <strong class="font-semibold text-fg">Tab
            through the row below</strong> — on every background, the ring has to be unmissable.
        </p>

        <div class="mt-8 flex flex-wrap gap-4">
          <button type="button" class="rounded-control bg-accent px-5 py-3 font-medium text-on-accent">
            On accent
          </button>
          <button type="button" class="rounded-control border border-hairline-strong px-5 py-3 font-medium">
            On canvas
          </button>
          <button type="button" class="rounded-control bg-surface px-5 py-3 font-medium">
            On surface
          </button>
          <button type="button" class="rounded-control bg-raised px-5 py-3 font-medium">
            On raised
          </button>
          <a href="#focus" class="rounded-control px-5 py-3 font-medium text-link underline underline-offset-4 hover:text-link-hover">
            A link
          </a>
        </div>
      </section>

      <!-- ── Glow ───────────────────────────────────────────────── -->
      <section aria-labelledby="glow" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          08 — glow
        </p>
        <h2 id="glow" class="mt-4 text-2xl">
          The atmosphere, not a light show
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          Two radial gradients, one green and one sky, painted behind content. The brand source
          draws this with a 90px blur filter; gradients look the same at these opacities and cost
          nothing to composite on scroll.
        </p>

        <div class="ds-glow mt-8 overflow-hidden rounded-card border border-hairline bg-surface p-10">
          <p class="font-mono text-eyebrow text-accent-text uppercase">
            Sample
          </p>
          <p class="mt-4 text-3xl">
            Type has to stay readable on top of it.
          </p>
          <p class="mt-3 max-w-prose text-fg-muted">
            If the glow is fighting this paragraph for attention, it is too strong — that is a
            one-line change to <code class="font-mono">--ds-glow-brand</code>.
          </p>
        </div>
      </section>

      <!-- ── Buttons ────────────────────────────────────────────── -->
      <section aria-labelledby="buttons" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          09 — buttons
        </p>
        <h2 id="buttons" class="mt-4 text-2xl">
          Four variants, three sizes
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          Always a real <code class="font-mono text-accent-text">&lt;button&gt;</code> or link,
          never a clickable div. Everything except the inline <em>link</em> variant holds a
          44×44 minimum target — WCAG 2.2 asks for 24×24, this is our own stricter bar.
        </p>

        <div class="mt-8 space-y-8">
          <div v-for="v in (['primary', 'secondary', 'ghost', 'link'] as const)" :key="v">
            <h3 class="font-mono text-eyebrow text-fg-subtle uppercase">
              {{ v }}
            </h3>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <DsButton :variant="v" size="sm">
                Small
              </DsButton>
              <DsButton :variant="v" size="md">
                Medium
              </DsButton>
              <DsButton :variant="v" size="lg">
                Large
              </DsButton>
              <DsButton :variant="v" icon="mail">
                With icon
              </DsButton>
              <DsButton :variant="v" icon-end="arrow-up-right">
                Icon end
              </DsButton>
              <DsButton :variant="v" disabled>
                Disabled
              </DsButton>
              <DsButton :variant="v" loading>
                Loading
              </DsButton>
            </div>
          </div>

          <div>
            <h3 class="font-mono text-eyebrow text-fg-subtle uppercase">
              Icon only — the type requires a label
            </h3>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <DsButton icon-only icon="github" label="GitHub profile" variant="secondary" />
              <DsButton icon-only icon="copy" label="Copy to clipboard" variant="ghost" />
              <DsButton icon-only icon="close" label="Close" variant="secondary" size="sm" />
            </div>
            <p class="mt-3 text-sm text-fg-subtle">
              Inspect one: the icon is <code class="font-mono">aria-hidden</code> and the name
              comes from <code class="font-mono">aria-label</code>. Omitting the label is a
              TypeScript error, not a review finding.
            </p>
          </div>

          <div>
            <h3 class="font-mono text-eyebrow text-fg-subtle uppercase">
              As links
            </h3>
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <DsButton to="/" variant="secondary" icon-end="arrow-up-right">
                Internal route
              </DsButton>
              <DsButton href="https://nuxt.com" variant="ghost">
                External
              </DsButton>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Links & badges ─────────────────────────────────────── -->
      <section aria-labelledby="links" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          10 — links & badges
        </p>
        <h2 id="links" class="mt-4 text-2xl">
          Underlined, not just coloured
        </h2>

        <p class="mt-6 max-w-prose text-lg text-fg-muted">
          A paragraph containing <DsLink to="/">an internal link</DsLink>, an
          <DsLink to="https://nuxt.com" show-external-icon>external one</DsLink>, and
          <DsLink to="mailto:hello@example.com">an email address</DsLink> — which opens a handler
          rather than a tab, so it is not announced as one.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-2">
          <DsBadge>neutral</DsBadge>
          <DsBadge variant="accent">accent</DsBadge>
          <DsBadge variant="echo">echo</DsBadge>
          <DsBadge size="sm">small</DsBadge>
          <DsBadge variant="accent" size="sm">small accent</DsBadge>
        </div>
      </section>

      <!-- ── Cards ──────────────────────────────────────────────── -->
      <section aria-labelledby="cards" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          11 — cards
        </p>
        <h2 id="cards" class="mt-4 text-2xl">
          One tab stop per card
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          <strong class="font-semibold text-fg">Tab into the second card.</strong> The focus ring
          should trace the whole card, not just the title — the title link owns the card through
          a stretched <code class="font-mono">::after</code>, so there is exactly one stop and
          the accessible name is the title rather than every word inside.
        </p>

        <div class="mt-8 grid gap-5 sm:grid-cols-2">
          <DsCard>
            <h3 class="text-xl font-bold">
              Static card
            </h3>
            <p class="mt-2 text-fg-muted">
              A plain surface. Nothing here is focusable, so nothing pretends to be.
            </p>
          </DsCard>

          <DsCard interactive>
            <h3 class="text-xl font-bold">
              <NuxtLink to="/" class="ds-card-link">
                Linked card
              </NuxtLink>
            </h3>
            <p class="mt-2 text-fg-muted">
              The whole surface is clickable, and the hover state says so.
            </p>
            <div class="mt-4 flex gap-2">
              <DsBadge size="sm">tag</DsBadge>
              <DsBadge size="sm">another</DsBadge>
            </div>
          </DsCard>
        </div>
      </section>

      <!-- ── Avatar ─────────────────────────────────────────────── -->
      <section aria-labelledby="avatar" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          12 — avatar & icons
        </p>
        <h2 id="avatar" class="mt-4 text-2xl">
          Reserved space, thirteen icons
        </h2>

        <div class="mt-8 flex flex-wrap items-center gap-8">
          <DsAvatar :src="profile.photo" alt="" :size="120" />
          <div>
            <p class="max-w-prose text-fg-muted">
              Width and height are always explicit, so the box is reserved before the image
              arrives. The avatar sits at the top of the hero, which makes it the largest CLS
              risk on the site.
            </p>
          </div>
        </div>

        <ul class="mt-8 flex flex-wrap gap-3">
          <li
            v-for="name in iconNames"
            :key="name"
            class="flex min-w-24 flex-col items-center gap-2 rounded-panel border border-hairline bg-surface p-3"
          >
            <DsIcon :name="name" :size="22" />
            <span class="font-mono text-[0.65rem] text-fg-subtle">{{ name }}</span>
          </li>
        </ul>
      </section>

      <!-- ── Dialog ─────────────────────────────────────────────── -->
      <section aria-labelledby="dialog" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          13 — dialog
        </p>
        <h2 id="dialog" class="mt-4 text-2xl">
          The browser does the hard part
        </h2>
        <p class="mt-3 max-w-prose text-fg-muted">
          A native <code class="font-mono text-accent-text">&lt;dialog&gt;</code> opened with
          <code class="font-mono text-accent-text">showModal()</code>. The focus trap, the
          background going <code class="font-mono">inert</code>, Escape to dismiss, returning
          focus to the trigger and the top layer are all the browser's — which is why there is no
          focus-trap library in this project.
        </p>

        <ul class="mt-6 max-w-prose list-disc space-y-1 pl-5 text-sm text-fg-muted">
          <li>Open it, then press <kbd class="font-mono text-fg">Tab</kbd> repeatedly — focus must never leave the dialog</li>
          <li>Press <kbd class="font-mono text-fg">Escape</kbd> — it closes and focus returns to the button below</li>
          <li>Click the dark backdrop — it closes; click inside — it does not</li>
          <li>Try to scroll or click the page behind it — you cannot</li>
          <li>With OS reduce-motion on, it appears instantly</li>
        </ul>

        <div class="mt-8">
          <DsButton variant="secondary" @click="dialogOpen = true">
            Open dialog
          </DsButton>
        </div>

        <DsDialog v-model:open="dialogOpen" title="A native dialog">
          <p class="text-fg-muted">
            Everything that makes this accessible is behaviour the platform already has. The
            component is about forty lines, and most of them are comments explaining why there
            is nothing else here.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <DsButton size="sm" @click="dialogOpen = false">
              Confirm
            </DsButton>
            <DsButton size="sm" variant="ghost" @click="dialogOpen = false">
              Cancel
            </DsButton>
            <DsLink to="https://nuxt.com">
              A focusable link
            </DsLink>
          </div>
        </DsDialog>
      </section>

      <!-- ── Theme toggle & copy ────────────────────────────────── -->
      <section aria-labelledby="controls" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          14 — stateful controls
        </p>
        <h2 id="controls" class="mt-4 text-2xl">
          Theme toggle and copy button
        </h2>

        <div class="mt-8 grid gap-5 sm:grid-cols-2">
          <DsCard>
            <h3 class="text-xl font-bold">
              Theme toggle
            </h3>
            <p class="mt-2 text-sm text-fg-muted">
              Cycles system → light → dark. The label names the <em>next</em> state, because
              that is what pressing it does. Three states, not two — collapsing "system" into a
              binary means you can never hand the choice back to your OS.
            </p>
            <div class="mt-4">
              <DsThemeToggle />
            </div>
          </DsCard>

          <DsCard>
            <h3 class="text-xl font-bold">
              Copy button
            </h3>
            <p class="mt-2 text-sm text-fg-muted">
              Confirms both visibly and in a polite live region. Clipboard access can be denied
              or unavailable, so failure is reported rather than assumed away.
            </p>
            <div class="mt-4">
              <DsCopyButton value="npx nuxi@latest init" label="Copy command" />
            </div>
          </DsCard>
        </div>
      </section>

      <!-- ── Breadcrumb & skip link ─────────────────────────────── -->
      <section aria-labelledby="navigation" class="border-t border-hairline py-14">
        <p class="font-mono text-eyebrow text-accent-text uppercase">
          15 — navigation aids
        </p>
        <h2 id="navigation" class="mt-4 text-2xl">
          Breadcrumb and skip link
        </h2>

        <div class="mt-8 rounded-card border border-hairline bg-surface p-6">
          <DsBreadcrumb
            :items="[
              { label: 'Home', to: '/' },
              { label: 'Design system', to: '/design-system' },
              { label: 'Navigation aids' },
            ]"
          />
          <p class="mt-4 text-sm text-fg-muted">
            The last crumb is text, not a link, and carries
            <code class="font-mono">aria-current="page"</code>. Separators are CSS-adjacent
            text marked <code class="font-mono">aria-hidden</code> so they are never read aloud.
          </p>
        </div>

        <p class="mt-8 max-w-prose text-fg-muted">
          The skip link is the very first focusable element on this page. <strong class="font-semibold text-fg">Press
            Tab once from the top</strong> — it should slide into view at the top-left, and
          activating it should move focus to the main content.
        </p>
      </section>

      <footer class="border-t border-hairline py-10">
        <p class="text-sm text-fg-subtle">
          The design system is complete. Phase 5 assembles it into the real page shell — header,
          footer and the mobile nav drawer built on the dialog above.
        </p>
        </footer>
      </div>
    </main>
  </div>
</template>
