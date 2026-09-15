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

/**
 * The id has to be slugified, not interpolated.
 *
 * aria-labelledby takes a *space-separated list* of ids, so `skill-Jetpack Compose` is read as
 * two references, neither of which resolves — and the region ends up with no accessible name at
 * all. It fails silently: the markup looks right, the heading is visibly there, and only a
 * screen reader or an accessibility tree inspector shows the group announced as unlabelled.
 */
const groupId = (label: string) =>
  `skill-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
</script>

<template>
  <DsSection id="skills" eyebrow="03 — skills" heading="Skills">
    <div class="grid gap-10 sm:grid-cols-2">
      <section v-for="group in skills" :key="group.label" :aria-labelledby="groupId(group.label)">
        <h3 :id="groupId(group.label)" class="font-mono text-eyebrow text-fg-subtle uppercase">
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
