/**
 * Every line of client-side behaviour on this site.
 *
 * Phase 13 measured the framework floor at 88 KB gzipped — 98% of the JS budget before any of
 * this site's own code. Nothing in that 88 KB was doing work: the pages are prerendered, the
 * markup is final at build time, and hydration existed only so that three controls could
 * respond to a click. So the Vue client bundle is gone (`features.noScripts`) and those three
 * controls are wired up here instead.
 *
 * Rules this file lives by:
 *
 * - **No build step.** It is served verbatim from /public, so what you read is what ships. That
 *   is only affordable because it is small; if it ever needs bundling, it has outgrown its brief.
 * - **Delegated listeners only.** One listener per event type on the document, dispatching on
 *   `data-*` hooks. Components render markup and nothing else, which is why they behave
 *   identically in dev (where Vue still hydrates an inert template) and in production (where it
 *   is not there at all).
 * - **Progressive enhancement.** Every control is a real <button> or <dialog> that degrades to
 *   something sensible. With this file blocked, navigation and reading are untouched.
 */
(() => {
  'use strict'

  const root = document.documentElement

  /* ------------------------------------------------------------------ *
   * Theme
   *
   * @nuxtjs/color-mode's inline no-flash script still runs — it is inline,
   * so noScripts does not remove it — and it has already resolved and
   * applied the class before first paint. It leaves its helpers on
   * window.__NUXT_COLOR_MODE__, so rather than reimplementing the storage
   * key and the system-preference query (and risking disagreeing with it),
   * this drives that.
   * ------------------------------------------------------------------ */
  const ORDER = ['system', 'light', 'dark']
  const STORAGE_KEY = 'ds-theme'

  const readPreference = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return ORDER.includes(stored) ? stored : 'system'
    }
    catch {
      // Private mode, or storage blocked outright. "system" is the honest answer.
      return 'system'
    }
  }

  const systemScheme = () =>
    (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

  /**
   * Reflect the preference on the button so CSS can show the right icon and the label can name
   * the *next* state — the label describes what pressing it does, not what is currently true.
   */
  function paintToggles(preference) {
    const next = ORDER[(ORDER.indexOf(preference) + 1) % ORDER.length]
    for (const el of document.querySelectorAll('[data-ds-theme-toggle]')) {
      el.dataset.dsThemePref = preference
      el.setAttribute('aria-label', `Switch to ${next} theme`)
    }
    // The style guide's three-way switcher, where each button sets one mode outright.
    for (const el of document.querySelectorAll('[data-ds-theme-set]'))
      el.setAttribute('aria-pressed', String(el.dataset.dsThemeSet === preference))
  }

  /**
   * The style guide prints what each semantic token resolves to in the current theme. Reading it
   * back off the document rather than hardcoding a table is the point: a copy of the values can
   * drift out of date, and a style guide that lies is worse than one that is missing.
   */
  function paintTokenReadouts() {
    const readouts = document.querySelectorAll('[data-ds-token]')
    if (!readouts.length) return
    const style = getComputedStyle(root)
    for (const el of readouts)
      el.textContent = style.getPropertyValue(`--ds-${el.dataset.dsToken}`).trim() || '—'
  }

  function applyTheme(preference) {
    const resolved = preference === 'system' ? systemScheme() : preference
    root.classList.remove('dark', 'light')
    root.classList.add(resolved)

    try { localStorage.setItem(STORAGE_KEY, preference) }
    catch { /* nothing to do; the class is applied either way, it just will not persist */ }

    const mode = window.__NUXT_COLOR_MODE__
    if (mode) { mode.preference = preference; mode.value = resolved }

    paintToggles(preference)
    // The class flip has landed by now, but the custom properties it cascades into are read on
    // the next frame — reading in this one returns the theme that is on its way out.
    window.requestAnimationFrame(paintTokenReadouts)
    announce(preference === 'system' ? 'Theme follows your system setting' : `${resolved[0].toUpperCase()}${resolved.slice(1)} theme`)
  }

  // Following the OS while the preference is "system" means reacting when the OS changes.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (readPreference() === 'system') applyTheme('system')
    })
  }

  /* ------------------------------------------------------------------ *
   * Announcements
   *
   * One shared live region rather than one per control. A region has to be
   * in the DOM and empty before the text lands in it, or the change is not
   * announced — which is why this is created once, up front, and only ever
   * has its text replaced.
   * ------------------------------------------------------------------ */
  let liveRegion

  function announce(message) {
    if (!liveRegion) return
    // Clearing first makes a repeated message announce again rather than being seen as no change.
    liveRegion.textContent = ''
    window.setTimeout(() => { liveRegion.textContent = message }, 50)
  }

  /* ------------------------------------------------------------------ *
   * Dialogs
   *
   * showModal() supplies the focus trap, the inert background, Escape to
   * dismiss, focus restored to the opener, and the top layer. None of that
   * is reimplemented here — the only things missing from the platform are
   * the open trigger and light-dismiss.
   * ------------------------------------------------------------------ */
  function openDialog(id) {
    const dialog = document.getElementById(id)
    if (dialog && typeof dialog.showModal === 'function' && !dialog.open) dialog.showModal()
  }

  document.addEventListener('click', (event) => {
    const target = event.target

    const opener = target.closest('[data-ds-dialog-open]')
    if (opener) { openDialog(opener.dataset.dsDialogOpen); return }

    const closer = target.closest('[data-ds-dialog-close]')
    if (closer) { closer.closest('dialog')?.close(); return }

    // Navigating from inside the drawer should not leave it open behind the new page. Without
    // client-side routing the page is replaced anyway, but the dialog would otherwise stay up
    // during the load, which reads as a stuck menu.
    const link = target.closest('dialog a[href]')
    if (link) { link.closest('dialog')?.close(); return }

    /*
      Light dismiss. A click on the backdrop reports the <dialog> itself as the target, because
      the backdrop is its pseudo-element; anything inside the panel targets that instead.
    */
    if (target instanceof HTMLDialogElement) target.close()

    const toggle = target.closest('[data-ds-theme-toggle]')
    if (toggle) {
      const current = readPreference()
      applyTheme(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length])
      return
    }

    const setter = target.closest('[data-ds-theme-set]')
    if (setter) applyTheme(setter.dataset.dsThemeSet)
  })

  /* ------------------------------------------------------------------ *
   * Copy to clipboard
   *
   * The confirmation is announced as well as shown — a purely visual tick
   * tells a screen-reader user nothing, and navigator.clipboard reports
   * nothing of its own. Failure is handled rather than assumed away: the
   * API is unavailable on insecure origins and can be denied outright, and
   * showing a tick for something that did not happen is worse than saying so.
   * ------------------------------------------------------------------ */
  const copyTimers = new WeakMap()

  function setCopyState(button, state) {
    button.dataset.dsCopyState = state
    const label = button.querySelector('[data-ds-copy-label]')
    if (label) {
      label.textContent = state === 'copied'
        ? 'Copied'
        : state === 'failed' ? 'Failed' : (button.dataset.dsCopyIdleLabel || 'Copy')
    }

    window.clearTimeout(copyTimers.get(button))
    if (state === 'idle') return
    copyTimers.set(button, window.setTimeout(() => setCopyState(button, 'idle'), 2000))
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-ds-copy]')
    if (!button) return

    try {
      await navigator.clipboard.writeText(button.dataset.dsCopy)
      setCopyState(button, 'copied')
      announce('Copied to clipboard')
    }
    catch {
      setCopyState(button, 'failed')
      announce('Could not copy to clipboard')
    }
  })

  /* ------------------------------------------------------------------ *
   * Sticky header height
   *
   * base.css derives scroll-padding from --header-h, which is what keeps a
   * hash-linked heading out from under the header (2.4.11 Focus Not
   * Obscured). Hardcoding it works right up until the header wraps at a
   * narrow width, so it is measured and republished whenever it changes.
   * ------------------------------------------------------------------ */
  function trackHeaderHeight() {
    const header = document.querySelector('[data-ds-header]')
    if (!header) return

    const publish = () => root.style.setProperty('--header-h', `${header.offsetHeight}px`)
    publish()
    if (window.ResizeObserver) new ResizeObserver(publish).observe(header)
  }

  /* ------------------------------------------------------------------ *
   * Which section am I in
   *
   * One IntersectionObserver for all of them, not a scroll handler: a
   * scroll handler runs on every frame and has to measure each section
   * itself, forcing layout on the main thread.
   *
   * The nav marks the current item with aria-current, and base.css draws
   * the indicator from that — so the attribute is the state, and there is
   * no second source of truth to keep in step.
   * ------------------------------------------------------------------ */
  function trackActiveSection() {
    const links = [...document.querySelectorAll('[data-ds-section-link]')]
    if (!links.length) return

    const sections = links
      .map(link => ({ link, el: document.getElementById(link.dataset.dsSectionLink) }))
      .filter(entry => entry.el)
    if (!sections.length) return

    /*
      The band has to start exactly where a hash jump parks the target, not at the header.

      base.css sets `scroll-padding-top: calc(var(--header-h) + 1.5rem)`, so clicking "Skills"
      leaves the skills section 24px below the header — and the 24px above it still belongs to
      Experience. With the band starting at the header, Experience was still intersecting by
      those 24px, and because the topmost visible section wins, the underline stayed on
      Experience while the reader was looking at Skills.

      Reading `scroll-padding-top` back off the document rather than recomputing it keeps the two
      from ever disagreeing: it is the same value the browser itself uses to place the jump. The
      extra pixel absorbs sub-pixel scroll positions, which would otherwise leave a hairline of
      the previous section inside the band and bring the bug back intermittently.
    */
    const scrollPadding = Number.parseFloat(getComputedStyle(root).scrollPaddingTop)
    const headerHeight = Number.parseFloat(getComputedStyle(root).getPropertyValue('--header-h')) || 64
    const bandTop = (Number.isFinite(scrollPadding) ? scrollPadding : headerHeight) + 1
    const visible = new Set()

    const mark = () => {
      // Several sections can be in view at once; the topmost in document order is the one being
      // read. Picking "most visible" makes the indicator jump backwards when a long section
      // scrolls past a short one.
      //
      // A post's outline targets headings, not whole sections, so between two headings nothing
      // is in the band at all — and the marker would vanish mid-section. The heading being read
      // is then the last one scrolled past. On the home page the sections are contiguous, so this
      // only applies above the first one, where nothing has been scrolled past and nothing is
      // marked, as before. It reads layout, but only in the observer callback, not per frame.
      const current = sections.find(entry => visible.has(entry.el.id))
        ?? sections.findLast(entry => entry.el.getBoundingClientRect().top < bandTop)
      // Compared by target, not by entry: a post renders its outline twice (a collapsible one
      // below lg, a sticky one above it), so one heading can own more than one link.
      for (const entry of sections)
        entry.link.setAttribute('aria-current', current && entry.el === current.el ? 'true' : 'false')
    }

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id)
        else visible.delete(entry.target.id)
      }
      mark()
    }, { rootMargin: `-${bandTop}px 0px -55% 0px`, threshold: 0 })

    for (const entry of sections) observer.observe(entry.el)
  }

  /* ------------------------------------------------------------------ *
   * Start
   * ------------------------------------------------------------------ */
  function start() {
    liveRegion = document.createElement('div')
    liveRegion.setAttribute('role', 'status')
    liveRegion.setAttribute('aria-live', 'polite')
    // The same clip-path pattern DsVisuallyHidden uses: present for assistive technology,
    // absent from sight. display:none or visibility:hidden would remove it from the
    // accessibility tree too, and nothing would ever be announced.
    // Pinned to the top-left rather than left where it happens to land, and with no negative
    // margin: appended at the end of <body>, `margin:-1px` put it one pixel outside the page.
    liveRegion.style.cssText
      = 'position:absolute;top:0;left:0;width:1px;height:1px;padding:0;border:0;overflow:hidden;white-space:nowrap;clip-path:inset(50%)'
    document.body.appendChild(liveRegion)

    paintToggles(readPreference())
    paintTokenReadouts()
    trackHeaderHeight()
    trackActiveSection()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start)
  else start()
})()
