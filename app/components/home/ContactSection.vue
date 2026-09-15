<script setup lang="ts">
/**
 * Contact.
 *
 * One obvious action — a mailto link — plus the profiles. No form: a form on a static site
 * needs a third-party endpoint or a server route, and neither earns its place before anyone
 * has asked to be contacted through one. If that changes it becomes a Nitro route, not a
 * dependency.
 *
 * The email address is shown as text rather than hidden behind "Get in touch", so it can be
 * copied, read aloud, or used from a device with no mail client configured.
 */
const { profile, socials } = useAppConfig()

/** The mail entry is already the primary action; the profiles are the secondary row. */
const profiles = computed(() => socials.filter(s => !s.href.startsWith('mailto:')))
</script>

<template>
  <DsSection id="contact" eyebrow="04 — contact" heading="Contact">
    <div class="max-w-prose">
      <p class="text-lg text-fg-muted text-pretty">
        The fastest way to reach me is email. I read everything, and I reply to anything that
        isn't a recruiter template.
      </p>

      <div class="mt-8">
        <DsButton :href="`mailto:${profile.email}`" size="lg" icon="mail">
          {{ profile.email }}
        </DsButton>
      </div>

      <div class="mt-10">
        <h3 class="font-mono text-eyebrow text-fg-subtle uppercase">
          Elsewhere
        </h3>
        <ul class="mt-4 flex flex-wrap gap-2">
          <li v-for="social in profiles" :key="social.href">
            <!--
              hairline-strong, not hairline. That border is the only thing that says these are
              controls — there is no fill behind them — so WCAG 1.4.11 applies to it and it has
              to clear 3:1 against the canvas. `hairline` is for rules and card edges, where
              nothing is being identified as interactive; it measures 1.4:1.
            -->
            <NuxtLink
              :to="social.href"
              target="_blank"
              :rel="social.isProfile ? 'me noopener noreferrer' : 'noopener noreferrer'"
              class="inline-flex min-h-11 items-center gap-2 rounded-control border border-hairline-strong px-4 text-sm font-medium text-fg-muted transition-colors duration-fast hover:bg-raised hover:text-fg"
            >
              <DsIcon :name="social.icon as never" :size="18" />
              {{ social.label }}
              <DsVisuallyHidden>(opens in a new tab)</DsVisuallyHidden>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </DsSection>
</template>
