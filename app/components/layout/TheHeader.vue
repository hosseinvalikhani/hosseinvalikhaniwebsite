<script setup lang="ts">
/**
 * The sticky site header.
 *
 * Two things that used to be this component's script now live in public/enhance.js, because
 * Phase 13 removed the Vue client bundle: measuring the header into `--header-h` (which
 * base.css derives scroll-padding from, and which WCAG 2.4.11 depends on), and marking which
 * section is in view.
 *
 * What is left here is the markup contract those two rely on:
 *
 * - `data-ds-header` is what gets measured.
 * - `data-ds-section-link` names the id each nav item points at, so the observer can pair them
 *   up without parsing hrefs.
 * - `aria-current-value="false"` makes Vue Router render `aria-current="false"` rather than
 *   `"page"`. Router ignores the hash when matching, so on `/` every one of these counts as
 *   exact-active and all five would otherwise claim to be the current page. Rendering "false"
 *   also gives the script an attribute to update rather than one to invent, and base.css only
 *   draws the indicator for a value that is not "false".
 *
 * No backdrop-filter: it is a per-frame composite on an element that is on screen during every
 * scroll, and an opaque background reads better against the glow anyway.
 */
const { nav, profile } = useAppConfig()

/** The hash target each nav item owns, or undefined for a real route. */
const sectionId = (to: string) => (to.includes('#') ? to.split('#')[1] : undefined)
</script>

<template>
  <header
    data-ds-header
    class="sticky top-0 z-40 border-b border-hairline bg-canvas"
  >
    <DsContainer>
      <div class="flex h-16 items-center justify-between gap-4">
        <!--
          inline-flex and min-h-11 give this the same 44px target every other standalone control
          holds. As bare text it was 24px tall: enough for WCAG 2.2 AA, which asks for 24, but
          under our own bar — and it is the control someone reaches for to get home. The row is
          64px tall, so nothing moves.
        -->
        <NuxtLink
          to="/"
          class="inline-flex min-h-11 items-center rounded-chip font-bold tracking-tight transition-colors duration-fast hover:text-accent-text"
        >
          {{ profile.name }}
        </NuxtLink>

        <div class="flex items-center gap-1">
          <!-- Desktop navigation -->
          <nav aria-label="Main" class="hidden md:block">
            <ul class="flex items-center gap-1">
              <li v-for="item in nav" :key="item.to">
                <NuxtLink
                  :to="item.to"
                  :data-ds-section-link="sectionId(item.to)"
                  :aria-current-value="sectionId(item.to) ? 'false' : 'page'"
                  class="ds-nav-link rounded-chip px-3 py-2 text-sm transition-colors duration-fast"
                >
                  {{ item.label }}
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <DsThemeToggle />

          <DsButton
            icon-only
            icon="menu"
            label="Open navigation menu"
            variant="ghost"
            class="md:hidden"
            data-ds-dialog-open="nav-drawer"
          />
        </div>
      </div>
    </DsContainer>

    <TheNavDrawer />
  </header>
</template>
