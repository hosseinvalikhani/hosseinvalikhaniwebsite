<script setup lang="ts">
/**
 * Site footer.
 *
 * `rel="me"` on profile links is what lets those profiles verify this site back — it is the
 * same relationship `sameAs` will declare in the Person schema in Phase 10, so the two must
 * agree. Only links that genuinely represent this person get it; a mailto does not.
 */
const { socials, profile } = useAppConfig()

const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-hairline py-12">
    <DsContainer>
      <div class="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p class="font-bold tracking-tight">
            {{ profile.name }}
          </p>
          <p class="mt-1 text-sm text-fg-muted">
            {{ profile.title }}
          </p>
        </div>

        <nav aria-label="Social and contact">
          <ul class="flex flex-wrap items-center gap-1">
            <li v-for="social in socials" :key="social.href">
              <NuxtLink
                :to="social.href"
                :external="social.href.startsWith('http')"
                :target="social.href.startsWith('http') ? '_blank' : undefined"
                :rel="social.isProfile ? 'me noopener noreferrer' : 'noopener noreferrer'"
                class="inline-flex size-11 items-center justify-center rounded-control text-fg-muted transition-colors duration-fast hover:bg-raised hover:text-fg"
              >
                <DsIcon :name="social.icon as never" />
                <!--
                  The icon is aria-hidden, so this label *is* the link's accessible name — and
                  the new-tab notice has to be part of it, or these links announce identically
                  to the in-page ones while behaving differently.
                -->
                <DsVisuallyHidden>
                  {{ social.label }}{{ social.href.startsWith('http') ? ' (opens in a new tab)' : '' }}
                </DsVisuallyHidden>
              </NuxtLink>
            </li>
          </ul>
        </nav>
      </div>

      <p class="mt-10 text-sm text-fg-subtle">
        © {{ year }} {{ profile.name }}. Built with Nuxt.
      </p>
    </DsContainer>
  </footer>
</template>
