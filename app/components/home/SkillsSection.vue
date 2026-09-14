<script setup lang="ts">
/**
 * Skills.
 *
 * Real <ul>/<li> inside labelled groups, so a screen reader announces "list, 4 items" and the
 * grouping survives without sight. Each group's label is an h3 tied to its own list.
 *
 * No proficiency bars or percentages: they are unverifiable, they invite comparison between
 * things that are not comparable, and "70%" conveys nothing a reader can act on.
 */
const { skills } = useAppConfig()
</script>

<template>
  <DsSection id="skills" eyebrow="03 — skills" heading="Skills">
    <div class="grid gap-10 sm:grid-cols-2">
      <section v-for="group in skills" :key="group.label" :aria-labelledby="`skill-${group.label}`">
        <h3 :id="`skill-${group.label}`" class="font-mono text-eyebrow text-fg-subtle uppercase">
          {{ group.label }}
        </h3>
        <ul class="mt-4 flex flex-wrap gap-2">
          <li v-for="item in group.items" :key="item">
            <DsBadge>{{ item }}</DsBadge>
          </li>
        </ul>
      </section>
    </div>
  </DsSection>
</template>
