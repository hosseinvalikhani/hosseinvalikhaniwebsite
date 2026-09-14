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

const classes = variants(
  'relative inline-flex items-center justify-center gap-2 font-medium '
  + 'transition-[background-color,border-color,color,opacity] duration-fast ease-out-quint '
  + 'disabled:pointer-events-none disabled:opacity-55',
  {
    variant: {
      // Ink on green in both themes — 11.1:1, and the brand hue never shifts.
      primary: 'bg-accent text-on-accent hover:bg-accent-hover rounded-control',
      secondary: 'border border-hairline-strong text-fg hover:bg-raised rounded-control',
      ghost: 'text-fg-muted hover:bg-raised hover:text-fg rounded-control',
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
  if (props.variant !== 'link') extra.push('min-h-11 min-w-11')
  if (props.block) extra.push('w-full')
  extra.push(props.iconOnly ? 'p-0 aspect-square' : PADDING[props.size])

  return classes({ variant: props.variant, size: props.size }, extra.join(' '))
})

const isExternal = computed(() => !!props.href)

const component = computed(() => {
  if (props.to) return resolveComponent('NuxtLink')
  if (props.href) return 'a'
  return 'button'
})

const attrs = computed(() => {
  if (props.to) return { to: props.to }
  if (props.href) {
    return { href: props.href, target: '_blank', rel: 'noopener noreferrer' }
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

    <span v-if="!props.iconOnly">
      <slot>{{ props.label }}</slot>
    </span>

    <DsIcon v-if="props.iconEnd && !props.iconOnly" :name="props.iconEnd" :size="props.size === 'sm' ? 18 : 20" />

    <DsVisuallyHidden v-if="isExternal">
      (opens in a new tab)
    </DsVisuallyHidden>
  </component>
</template>
