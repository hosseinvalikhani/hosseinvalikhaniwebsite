<script setup lang="ts">
import type { IconName } from '~/design/icons'
import { variants } from '~/design/variants'

/**
 * Renders a real `<button>`, a `<NuxtLink>` or an `<a>` — never a clickable `<div>`.
 *
 * The `iconOnly` branch of the props type requires a `label`. An icon is always `aria-hidden`
 * (see DsIcon), so without that the control would have no accessible name at all, and the type
 * system is a better place to catch that than an audit three phases later.
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'link'
type Size = 'sm' | 'md' | 'lg'

type Shared = {
  variant?: Variant
  size?: Size
  /** Internal route — renders NuxtLink. */
  to?: string
  /** External URL — renders <a> with the right rel/target. */
  href?: string
  /** Only meaningful on a <button>; links are removed rather than disabled. */
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
}

type Props = Shared & (
  | { iconOnly?: false, icon?: IconName, iconEnd?: IconName, label?: string }
  /** Icon-only controls must name themselves. */
  | { iconOnly: true, icon: IconName, label: string, iconEnd?: never }
)

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

/**
 * `max-w-full` is load-bearing, not tidiness: a button is an inline-flex box sized by its
 * content, so a label longer than the viewport — the contact email at 320px is 305px wide
 * before padding — pushes the whole document sideways and breaks WCAG 1.4.10 Reflow. Capping
 * the box makes the label wrap instead; see the span below for the other half of that.
 */
const classes = variants(
  'relative inline-flex max-w-full items-center justify-center gap-2 font-medium '
  + 'transition-[background-color,border-color,color,opacity] duration-fast ease-out-quint '
  + 'disabled:pointer-events-none disabled:opacity-55',
  {
    variant: {
      // Ink on green in both themes — 11.1:1, and the brand hue never shifts. The border is
      // not decoration: on light, the green fill is 1.74:1 against the canvas, so without an
      // edge the control has no visible boundary (1.4.11). In dark the token equals the fill
      // and the border draws nothing.
      primary: 'bg-accent text-on-accent border border-accent-edge hover:bg-accent-hover rounded-control',
      secondary: 'border border-hairline-strong text-fg hover:bg-raised rounded-control',
      // Transparent rather than absent, so all three variants are the same height in a row.
      ghost: 'border border-transparent text-fg-muted hover:bg-raised hover:text-fg rounded-control',
      link: 'text-link hover:text-link-hover underline underline-offset-4 decoration-1 rounded-chip',
    },
    // Padding is deliberately NOT here — see PADDING below.
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-base',
    },
  },
  { variant: 'primary', size: 'md' },
)

/**
 * Padding lives outside the variant axes so that exactly one padding class is ever emitted.
 *
 * Emitting `px-5` for the size and `px-0` for the icon-only shape puts both in the class
 * attribute, and Tailwind resolves that by stylesheet order, not attribute order — `px-5` is
 * generated later, so it silently won and icon-only buttons rendered full width. That class of
 * bug is what `tailwind-merge` exists to paper over; not creating the conflict is cheaper.
 */
const PADDING = {
  sm: 'px-3.5 py-2',
  md: 'px-5 py-2.5',
  lg: 'px-6 py-3',
} as const

const rootClass = computed(() => {
  const extra: string[] = []
  // 44×44 is our own bar; WCAG 2.2 AA only asks for 24×24. The `link` variant is inline text,
  // where a 44px box would break the line it sits in.
  //
  // `ds-button` is the hook base.css uses to give this a border under forced colours, where
  // every background collapses to Canvas. A <button> keeps a UA border there and survives, but
  // these render as <a> just as often — and an anchor styled as a filled button flattens into
  // bare text with no edge at all, which is how the hero's two actions stopped looking like
  // actions. The `link` variant is excluded for the same reason it skips the 44px box: it is
  // meant to read as a word in a sentence, and a border would box it mid-paragraph.
  if (props.variant !== 'link') extra.push('ds-button min-h-11 min-w-11')
  if (props.block) extra.push('w-full')
  extra.push(props.iconOnly ? 'p-0 aspect-square' : PADDING[props.size])

  return classes({ variant: props.variant, size: props.size }, extra.join(' '))
})

/**
 * Only http(s) targets actually open a tab. A mailto: or tel: href hands off to a mail client
 * or dialler, so giving it target="_blank" is meaningless and announcing "opens in a new tab"
 * is simply untrue — the kind of wrong label that teaches people to distrust the ones that
 * are right.
 */
const opensNewTab = computed(() => !!props.href && /^https?:/.test(props.href))

const component = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'button'
})

const attrs = computed(() => {
  // aria-current marks the current item *within a set of related items* — a nav list, a
  // breadcrumb, a paginated series. A standalone call to action is not such a set, but Vue
  // Router stamps aria-current="page" on any exact-active link regardless, and on the home
  // page a "/#contact" button counts as exact-active because matching ignores the hash.
  // Left alone, the hero alone contributed two more elements claiming to be the current page.
  if (props.to) return { to: props.to, ariaCurrentValue: 'false' }
  if (props.href) {
    return opensNewTab.value
      ? { href: props.href, target: '_blank', rel: 'noopener noreferrer' }
      : { href: props.href }
  }
  return {
    type: props.type,
    disabled: props.disabled || props.loading,
    'aria-busy': props.loading ? 'true' : undefined,
  }
})
</script>

<template>
  <component
    :is="component"
    v-bind="attrs"
    :class="rootClass"
    :aria-label="props.iconOnly ? props.label : undefined"
  >
    <!--
      The spinner replaces the icon, never the label: removing the text mid-action changes the
      accessible name while a screen reader may be reading it.
    -->
    <svg
      v-if="props.loading"
      class="size-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity=".25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
    <DsIcon v-else-if="props.icon" :name="props.icon" :size="props.size === 'sm' ? 18 : 20" />

    <!--
      Both classes are needed and neither is enough alone. A flex item defaults to
      `min-width: auto`, which floors it at the label's min-content width, so the box refuses
      to shrink no matter what `max-w-full` says; `break-words` is what then lets an
      unbreakable run — an email address, a long URL — split rather than overflow.
    -->
    <span v-if="!props.iconOnly" class="min-w-0 break-words">
      <slot>{{ props.label }}</slot>
    </span>

    <DsIcon v-if="props.iconEnd && !props.iconOnly" :name="props.iconEnd" :size="props.size === 'sm' ? 18 : 20" />

    <DsVisuallyHidden v-if="opensNewTab">
      (opens in a new tab)
    </DsVisuallyHidden>
  </component>
</template>
