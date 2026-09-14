<script setup lang="ts">
/**
 * The Open Graph image template.
 *
 * Rendered by Satori at build time, not in a browser — it supports a subset of CSS built around
 * flexbox, so everything here is inline styles with explicit `display: flex`. Tailwind classes
 * and CSS variables do not resolve, which is why the brand values are literal here and this is
 * the one component outside the style guide allowed to hardcode them.
 *
 * Composition follows the brand source's banner: ink base, one green glow, headline in Cloud,
 * name beside a green dot. One accent, nothing else.
 *
 * Weights are 400 and 700 only. Satori cannot read the woff2 files @nuxt/fonts self-hosts, so
 * it falls back to the two Inter TTFs the module bundles — it is the right face, but a
 * `font-weight: 800` here would silently render as 700. Declaring what actually renders keeps
 * the template honest; matching the site's 800 display weight would mean committing an Inter
 * TTF and wiring it through satoriOptions.
 */
const { title, name, label } = defineProps<{
  title?: string
  name?: string
  label?: string
}>()
</script>

<template>
  <div
    style="width: 100%; height: 100%; display: flex; flex-direction: column; justify-content: space-between;
           background-color: #020420; padding: 80px; font-family: 'Inter';"
  >
    <!-- The glow, as a gradient rather than a blur: Satori has no filter support. -->
    <div
      style="position: absolute; top: -220px; left: -160px; width: 680px; height: 680px; display: flex;
             background-image: radial-gradient(circle, rgba(0,220,130,0.30), rgba(2,4,32,0) 70%);"
    />
    <div
      style="position: absolute; bottom: -200px; right: -140px; width: 560px; height: 560px; display: flex;
             background-image: radial-gradient(circle, rgba(56,189,248,0.22), rgba(2,4,32,0) 70%);"
    />

    <div style="display: flex; align-items: center;">
      <span
        style="font-size: 22px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: #00DC82;"
      >{{ label ?? 'Writing' }}</span>
    </div>

    <div style="display: flex; flex-direction: column;">
      <span
        style="font-size: 68px; font-weight: 700; letter-spacing: -2px; line-height: 1.05; color: #F8FAFC;"
      >{{ title ?? 'Untitled' }}</span>
    </div>

    <div style="display: flex; align-items: center;">
      <div style="display: flex; width: 14px; height: 14px; border-radius: 7px; background-color: #00DC82;" />
      <span style="margin-left: 16px; font-size: 26px; font-weight: 400; color: #94A3B8;">{{ name }}</span>
    </div>
  </div>
</template>
