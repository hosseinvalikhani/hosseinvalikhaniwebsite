/**
 * The complete icon set, as path data.
 *
 * This replaces an icon runtime (`@nuxt/icon` + `@iconify/vue`), which resolves names at
 * runtime and, for anything not bundled, fetches over the network. For thirteen icons that is
 * a lot of machinery: this file is around 2 KB, ships inside the component that uses it, and
 * makes zero requests.
 *
 * Every icon is drawn on a 24×24 grid. Stroke icons use `currentColor` with a 2px stroke;
 * brand glyphs are filled paths, because their shapes are not strokeable.
 */

export interface IconDefinition {
  /** Path data, drawn on a 24×24 viewBox. */
  d: string
  /** Filled glyphs (brand marks) rather than stroked outlines. */
  filled?: boolean
}

export const icons = {
  /* ── Brand marks — filled, single path ─────────────────────────── */
  github: {
    filled: true,
    d: 'M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.24-.02-2.25-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.49 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58C20.56 22.29 24 17.8 24 12.5 24 5.87 18.63.5 12 .5Z',
  },
  linkedin: {
    filled: true,
    d: 'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z',
  },
  x: {
    filled: true,
    d: 'M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.11l11.97 15.64Z',
  },
  rss: {
    filled: true,
    d: 'M4 11a9 9 0 0 1 9 9h-2.5A6.5 6.5 0 0 0 4 13.5V11Zm0-7a16 16 0 0 1 16 16h-2.5A13.5 13.5 0 0 0 4 6.5V4Zm1.75 12.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5Z',
  },

  /* ── Interface — stroked outlines ──────────────────────────────── */
  mail: {
    d: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 .5 9 6 9-6',
  },
  menu: {
    d: 'M4 7h16M4 12h16M4 17h16',
  },
  close: {
    d: 'M6 6l12 12M18 6 6 18',
  },
  sun: {
    d: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m11.32 0 1.41 1.41M4.93 4.93l1.41 1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  },
  moon: {
    d: 'M20 14.35A8.5 8.5 0 0 1 9.65 4a8.5 8.5 0 1 0 10.35 10.35Z',
  },
  monitor: {
    d: 'M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm4 15h8m-4-5v5',
  },
  'arrow-up-right': {
    d: 'M8 16 16 8m0 0H9m7 0v7',
  },
  copy: {
    d: 'M9 9V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-4M4 10a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9Z',
  },
  check: {
    d: 'm5 13 4.5 4.5L19 7',
  },
} as const satisfies Record<string, IconDefinition>

export type IconName = keyof typeof icons
