<script setup lang="ts">
/**
 * The sticky site header.
 *
 * It measures itself and publishes the result to `--header-h`, which base.css uses for
 * scroll-padding. Hardcoding that value works right up until the nav wraps to two lines on a
 * narrow screen, at which point every hash link lands with its heading hidden behind the
 * header — the WCAG 2.2 Focus Not Obscured failure the token exists to prevent.
 *
 * No backdrop-filter: it is a per-frame composite on a element that is on screen during every
 * scroll, and an opaque background reads better against the glow anyway.
 */
const { nav, profile } = useAppConfig()
const route = useRoute()

const header = useTemplateRef<HTMLElement>('header')
const drawerOpen = ref(false)

/**
 * The drawer only exists below `md`, but a statically imported one ships its JavaScript to
 * every visitor on every page. `Lazy` plus this flag defers the chunk until the menu is first
 * opened — and keeps it mounted afterwards, so the close animation still has something to run
 * on. (`v-if="drawerOpen"` alone would unmount it mid-exit.)
 */
const drawerMounted = ref(false)
watch(drawerOpen, (isOpen) => { if (isOpen) drawerMounted.value = true })

/** Hash targets on the home page, in document order. */
const sectionIds = nav
  .filter(item => item.to.includes('#'))
  .map(item => item.to.split('#')[1]!)

const isHome = computed(() => route.path === '/')
const activeSection = useActiveSection(sectionIds)

/**
 * Vue Router treats every `/#section` link as exact-active while you are on `/`, because it
 * ignores the hash when matching — so all five nav items were rendering aria-current="page"
 * at once, each claiming to be the current location.
 *
 * Rather than fight that, we supply the *value* the router should stamp: "true" for the
 * section actually in view and "false" for the rest. Both are valid ARIA, and off the home
 * page these links are not exact-active so no attribute is rendered at all.
 *
 * Route links (Blog) keep the default "page", which is correct for a real navigation target.
 */
function currentValue(to: string) {
  if (!to.includes('#')) return 'page'
  if (!isHome.value) return 'page'
  return to.split('#')[1] === activeSection.value ? 'true' : 'false'
}

onMounted(() => {
  const el = header.value
  if (!el) return

  const publish = () => {
    document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
  }

  publish()
  const observer = new ResizeObserver(publish)
  observer.observe(el)
  onBeforeUnmount(() => observer.disconnect())
})

// Navigating within the page should not leave the drawer sitting open behind the content.
watch(() => route.fullPath, () => { drawerOpen.value = false })
</script>

<template>
  <header
    ref="header"
    class="sticky top-0 z-40 border-b border-hairline bg-canvas"
  >
    <DsContainer>
      <div class="flex h-16 items-center justify-between gap-4">
        <NuxtLink
          to="/"
          class="rounded-chip font-bold tracking-tight transition-colors duration-fast hover:text-accent-text"
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
                  :aria-current-value="currentValue(item.to)"
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
            @click="drawerOpen = true"
          />
        </div>
      </div>
    </DsContainer>

    <LazyTheNavDrawer v-if="drawerMounted" v-model:open="drawerOpen" />
  </header>
</template>
