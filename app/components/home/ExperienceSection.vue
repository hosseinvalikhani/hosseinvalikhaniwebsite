<script setup lang="ts">
/**
 * Experience as a journey, not a résumé table.
 *
 * An <ol> because the order *is* the information — these are chronological, and a screen
 * reader announcing "list item 1 of 3" conveys that, where a stack of <div>s conveys nothing.
 * This is also the only section allowed numbered markers: elsewhere 01/02/03 would be
 * decoration dressed up as structure.
 *
 * `period` is the human string; `from`/`to` supply machine-readable dates on <time>, which is
 * what a parser reads and what Phase 10's Person schema will align with.
 */
const { experience } = useAppConfig()

const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <DsSection id="experience" eyebrow="02 — experience" heading="Experience">
    <!--
      role="list" is not redundant: `list-style: none` strips list semantics from an <ol> in
      Safari/VoiceOver, which would lose the "3 items, item 1 of 3" that makes the order
      audible — and the order is the whole point of this section.
    -->
    <ol role="list" class="ds-timeline">
      <li v-for="(entry, i) in experience" :key="`${entry.company}-${entry.from}`" class="ds-timeline__item">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="font-mono text-sm font-bold text-accent-text" aria-hidden="true">
            {{ pad(i + 1) }}
          </span>
          <h3 class="text-xl font-bold">
            {{ entry.role }}
          </h3>
        </div>

        <p class="mt-1 flex flex-wrap items-baseline gap-x-2 text-fg-muted">
          <span>{{ entry.company }}</span>
          <span aria-hidden="true" class="text-fg-subtle">·</span>
          <time class="font-mono text-sm text-fg-subtle" :datetime="entry.from">
            {{ entry.period }}
          </time>
        </p>

        <p class="mt-3 max-w-prose text-fg-muted text-pretty">
          {{ entry.contribution }}
        </p>
      </li>
    </ol>
  </DsSection>
</template>
