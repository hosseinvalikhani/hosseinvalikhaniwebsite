<script setup lang="ts">
/**
 * The first screen.
 *
 * Structure follows the brand source exactly: mono eyebrow → display heading → lead → one
 * green action. The job title is the eyebrow rather than a separate line, which keeps the
 * signature device carrying real information instead of decorating a heading it repeats.
 *
 * Green appears exactly once here — the primary button. If a second green element ever lands
 * in this section, the 8% proportion rule has been broken and the page loses its focal point.
 *
 * The <section> is named from its own h1. An unnamed <section> is not a region at all — it is
 * announced as a generic container and never appears in the landmark list a screen-reader user
 * navigates by, which is the one thing using the element was supposed to buy. The same applies
 * to the blog listing, the tag pages and the error page; DsSection does it for everything else.
 */
const { profile } = useAppConfig()
</script>

<template>
  <section aria-labelledby="hero-heading" class="ds-glow py-20 sm:py-28 lg:py-32">
    <DsContainer>
      <div class="flex flex-col-reverse gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <div class="max-w-2xl">
          <DsEyebrow class="ds-reveal">
            {{ profile.title }}
          </DsEyebrow>

          <!--
            Deliberately *not* revealed. This is the likely LCP element, and Largest Contentful
            Paint is recorded when an element is first painted at a visible opacity — fading it
            in would push LCP out by the whole animation duration. The same reasoning excludes
            the avatar, the other LCP candidate.
          -->
          <h1 id="hero-heading" class="mt-6 text-display text-balance">
            {{ profile.name }}
          </h1>

          <p class="ds-reveal mt-6 max-w-prose text-xl text-fg-muted text-pretty" style="--ds-reveal-delay: 60ms">
            {{ profile.intro }}
          </p>

          <div class="ds-reveal mt-10 flex flex-wrap gap-3" style="--ds-reveal-delay: 120ms">
            <DsButton to="/#experience" size="lg">
              View my work
            </DsButton>
            <DsButton to="/#contact" variant="secondary" size="lg">
              Contact me
            </DsButton>
          </div>

          <p v-if="profile.location" class="ds-reveal mt-8 font-mono text-sm text-fg-subtle" style="--ds-reveal-delay: 180ms">
            {{ profile.location }}
          </p>
        </div>

        <DsAvatar
          :src="profile.photo"
          :alt="profile.photoAlt"
          :size="200"
          priority
          class="shrink-0 self-start lg:self-auto"
        />
      </div>
    </DsContainer>
  </section>
</template>
