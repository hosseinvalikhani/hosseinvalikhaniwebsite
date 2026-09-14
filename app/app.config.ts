/**
 * The single source of truth for everything personal on this site.
 *
 * Components read this through `useAppConfig()`. Nothing in `app/components/ds/` may import it —
 * design-system primitives know nothing about whose site this is.
 *
 * TODO(phase 0): every PLACEHOLDER below is waiting on real copy.
 */

export interface SocialLink {
  /** Visible label, also the accessible name. */
  label: string
  /** Icon key from `app/design/icons.ts` (Phase 3). */
  icon: string
  href: string
  /** Set for profiles that represent this person, so `rel="me"` is correct. */
  isProfile?: boolean
}

export interface ExperienceEntry {
  role: string
  company: string
  /** Human-readable, e.g. "2023 — present". Machine dates live in `from`/`to`. */
  period: string
  from: string
  to?: string
  /** One or two lines. Not a bullet dump — the section is a journey, not a résumé table. */
  contribution: string
}

export interface SkillGroup {
  label: string
  items: string[]
}

export interface NavItem {
  label: string
  /** A hash target on `/` or a real route. */
  to: string
}

export interface Profile {
  name: string
  title: string
  intro: string
  about: string
  photo: string
  photoAlt: string
  location?: string
  email: string
}

export default defineAppConfig({
  profile: {
    name: 'PLACEHOLDER Name',
    title: 'PLACEHOLDER Professional Title',
    intro:
      'PLACEHOLDER — one or two sentences that say what you build and who for. This is the '
      + 'hero subheading, so it carries more weight than any other sentence on the site.',
    about:
      'PLACEHOLDER — around 120 words of about copy. Written in the first person, concrete '
      + 'rather than aspirational: what you work on, how you approach it, and what you are '
      + 'looking for next. Replace before the Phase 6 hero review, because placeholder copy '
      + 'makes a layout impossible to judge honestly.',
    photo: '/img/avatar-placeholder.svg',
    photoAlt: 'PLACEHOLDER — a description of the profile photo',
    location: 'PLACEHOLDER City, Country',
    email: 'hello@example.com',
  } satisfies Profile,

  nav: [
    { label: 'About', to: '/#about' },
    { label: 'Experience', to: '/#experience' },
    { label: 'Skills', to: '/#skills' },
    { label: 'Blog', to: '/blog' },
    { label: 'Contact', to: '/#contact' },
  ] satisfies NavItem[],

  // Newest first — the section renders them in this order and numbers them accordingly.
  experience: [
    {
      role: 'PLACEHOLDER Senior Role',
      company: 'PLACEHOLDER Company',
      period: '2023 — present',
      from: '2023-01',
      contribution:
        'PLACEHOLDER — one or two lines on what you actually changed here. Concrete beats '
        + 'impressive: what shipped, what got faster, what stopped breaking.',
    },
    {
      role: 'PLACEHOLDER Mid Role',
      company: 'PLACEHOLDER Previous Company',
      period: '2020 — 2023',
      from: '2020-04',
      to: '2023-01',
      contribution:
        'PLACEHOLDER — the second entry exists so the vertical rhythm and the connecting rule '
        + 'can be judged with more than one item on screen.',
    },
    {
      role: 'PLACEHOLDER First Role',
      company: 'PLACEHOLDER First Company',
      period: '2018 — 2020',
      from: '2018-09',
      to: '2020-04',
      contribution: 'PLACEHOLDER — where it started.',
    },
  ] satisfies ExperienceEntry[],

  skills: [
    { label: 'PLACEHOLDER Languages', items: ['Kotlin', 'TypeScript', 'Swift', 'SQL'] },
    { label: 'PLACEHOLDER Platform', items: ['Android', 'Jetpack Compose', 'Coroutines', 'Room'] },
    { label: 'PLACEHOLDER Web', items: ['Vue', 'Nuxt', 'Tailwind CSS'] },
    { label: 'PLACEHOLDER Practice', items: ['Testing', 'CI/CD', 'Accessibility', 'Code review'] },
  ] satisfies SkillGroup[],

  socials: [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/PLACEHOLDER', isProfile: true },
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://linkedin.com/in/PLACEHOLDER', isProfile: true },
    { label: 'Email', icon: 'mail', href: 'mailto:hello@example.com' },
  ] satisfies SocialLink[],
})
