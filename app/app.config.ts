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

  experience: [
    {
      role: 'PLACEHOLDER Role',
      company: 'PLACEHOLDER Company',
      period: '2023 — present',
      from: '2023-01',
      contribution: 'PLACEHOLDER — one line on what you actually changed here.',
    },
  ] satisfies ExperienceEntry[],

  skills: [
    { label: 'PLACEHOLDER Group', items: ['PLACEHOLDER', 'PLACEHOLDER', 'PLACEHOLDER'] },
  ] satisfies SkillGroup[],

  socials: [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/PLACEHOLDER', isProfile: true },
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://linkedin.com/in/PLACEHOLDER', isProfile: true },
    { label: 'Email', icon: 'mail', href: 'mailto:hello@example.com' },
  ] satisfies SocialLink[],
})
