/**
 * Tracks which section is currently in view, for the home page nav.
 *
 * One IntersectionObserver for all sections, disconnected on unmount — not a scroll listener.
 * A scroll handler fires on every frame and has to measure each section itself, which forces
 * layout on the main thread and is the classic way to make a page feel sticky while scrolling.
 *
 * The rootMargin is what makes the result feel right rather than technically correct: the top
 * is inset by the header height so a heading hidden behind it does not count as visible, and
 * the bottom is pulled up so a section only becomes "active" once it has actually arrived,
 * instead of the moment one pixel of it appears.
 */
export function useActiveSection(ids: string[]) {
  const active = ref<string>('')

  if (import.meta.server) return active

  let observer: IntersectionObserver | undefined
  const visible = new Set<string>()

  onMounted(() => {
    const elements = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (!elements.length) return

    const headerHeight = Number.parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
    ) || 64

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }

        // Several sections can be in view at once; the topmost one in document order is the
        // one the reader is actually on. Picking "most visible" instead makes the indicator
        // jump backwards when a long section scrolls past a short one.
        active.value = ids.find(id => visible.has(id)) ?? active.value
      },
      { rootMargin: `-${headerHeight}px 0px -55% 0px`, threshold: 0 },
    )

    for (const el of elements) observer.observe(el)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = undefined
  })

  return active
}
