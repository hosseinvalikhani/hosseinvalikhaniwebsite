/**
 * The single source of truth for everything personal on this site.
 *
 * Components read this through `useAppConfig()`. Nothing in `app/components/ds/` may import it —
 * design-system primitives know nothing about whose site this is.
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
  /**
   * Optional. The hero draws DsMonogram rather than an image, so this feeds only the `image`
   * property of the Person entity — set it if a photograph is ever added back.
   */
  photo?: string
  location?: string
  email: string
}

export default defineAppConfig({
  profile: {
    name: 'Hossein Valikhani',
    title: 'Frontend Engineer',
    intro:
      'I build fast, accessible web applications with Vue and Nuxt — server rendering, Core Web '
      + 'Vitals and design systems that stay consistent as the product grows.',
    about:
      'I am a frontend engineer with more than three years building production web applications, '
      + 'most of them in Vue and Nuxt. My work sits where architecture meets measurement: server '
      + 'rendering that does not break on hydration, bundles that stay small, and Core Web Vitals '
      + 'that hold up under real traffic rather than on a lab run.\n\n'
      + 'Lately that has meant design system components in Vue and TypeScript, a codebase-wide move '
      + 'from the Options API to the Composition API, and the documentation that made both stick. I '
      + 'treat accessibility as a default rather than an audit item, and I like leaving a codebase '
      + 'easier to work in than I found it. I studied Computer Engineering at Semnan University.',
    email: 'Hosseinvalikhani1@gmail.com',
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
      role: 'Software Engineer',
      company: 'Lipak',
      period: 'Sep 2025 — present',
      from: '2025-09',
      contribution:
        'Cut the production build from 65 MB to 11 MB by reworking third-party imports and the '
        + 'code-splitting strategy, and took LCP from 4.5s to 2.2s with CLS under 0.01 and INP under '
        + '200 ms. Architected 10+ Vue and TypeScript design system components and led the migration '
        + 'from the Options API to the Composition API, documentation included.',
    },
    {
      role: 'Software Engineer',
      company: 'Upolo',
      period: 'Apr 2025 — Sep 2025',
      from: '2025-04',
      to: '2025-09',
      contribution:
        'Shipped seven features for a CRM product and built a customer-facing ticketing and support '
        + 'tool with Alpine.js and Tailwind CSS, then covered the critical flows with Playwright '
        + 'end-to-end tests.',
    },
    {
      role: 'Software Engineer',
      company: 'Abalon Cloud Solutions',
      period: 'Feb 2024 — Apr 2025',
      from: '2024-02',
      to: '2025-04',
      contribution:
        'Built and improved the frontend of Abalon\'s CDN product, and delivered 15 content-focused '
        + 'Vue pages for marketing campaigns — working with the design team to keep what shipped both '
        + 'faithful to the design and feasible to build.',
    },
  ] satisfies ExperienceEntry[],

  skills: [
    {
      label: 'Core',
      items: ['Nuxt.js', 'Vue.js (Composition API)', 'TypeScript', 'JavaScript (ES6+)', 'SSR / SSG', 'Pinia', 'TanStack Query'],
    },
    {
      label: 'SEO and performance',
      items: ['Technical SEO', 'Core Web Vitals', 'Code splitting', 'Rendering strategy', 'Lighthouse'],
    },
    {
      label: 'UI and styling',
      items: ['HTML', 'Tailwind CSS', 'CSS', 'Sass', 'Vuetify', 'PrimeVue', 'shadcn', 'Flowbite', 'Accessibility (WCAG)'],
    },
    {
      label: 'Architecture and practice',
      items: ['SOLID', 'Clean code', 'Onion architecture', 'Monorepos', 'Design systems', 'Refactoring', 'Agile / Scrum'],
    },
    {
      label: 'Tooling and collaboration',
      items: ['Git', 'GitHub', 'GitLab', 'CI/CD', 'Figma', 'Jira', 'Confluence', 'ClickUp', 'Code review', 'Technical writing'],
    },
    {
      label: 'Familiar with',
      items: ['React', 'Alpine.js', 'Pug'],
    },
  ] satisfies SkillGroup[],

  socials: [
    { label: 'GitHub', icon: 'github', href: 'https://github.com/hosseinvalikhani', isProfile: true },
    { label: 'LinkedIn', icon: 'linkedin', href: 'https://www.linkedin.com/in/hosseinvalikhani', isProfile: true },
    { label: 'Email', icon: 'mail', href: 'mailto:Hosseinvalikhani1@gmail.com' },
  ] satisfies SocialLink[],
})
