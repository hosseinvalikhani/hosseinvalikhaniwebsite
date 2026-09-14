<script setup lang="ts">
/**
 * A titled page section.
 *
 * `aria-labelledby` points at the section's own heading, which is what turns a bare <section>
 * into a real landmark a screen reader can list and jump between. Without it the element is
 * announced as an unnamed region, which is worse than not using <section> at all.
 *
 * scroll-margin-top keeps the heading clear of the sticky header when arrived at by hash link.
 */
const { id, heading, eyebrow, level = 2 } = defineProps<{
  id: string
  heading: string
  eyebrow?: string
  /** Heading level. Only the hero owns h1, so this defaults to 2. */
  level?: 2 | 3
}>()

const headingId = computed(() => `${id}-heading`)
const headingTag = computed(() => `h${level}`)
</script>

<template>
  <section
    :id="id"
    :aria-labelledby="headingId"
    class="scroll-mt-[calc(var(--header-h)+1.5rem)] border-t border-hairline py-16 sm:py-24"
  >
    <DsContainer>
      <DsEyebrow v-if="eyebrow" decorative>
        {{ eyebrow }}
      </DsEyebrow>

      <component
        :is="headingTag"
        :id="headingId"
        class="mt-4 text-3xl"
        :class="level === 3 ? 'text-2xl' : 'text-3xl'"
      >
        {{ heading }}
      </component>

      <div class="mt-8">
        <slot />
      </div>
    </DsContainer>
  </section>
</template>
