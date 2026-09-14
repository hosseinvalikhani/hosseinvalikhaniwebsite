/**
 * A 15-line stand-in for `cva` / `tailwind-variants`.
 *
 * Those libraries exist mainly to *merge* conflicting classes, which is only a problem when
 * components accept arbitrary class overrides from callers. Ours don't: a component exposes
 * `variant` and `size` props and owns its own colours, so there is nothing to merge and
 * nothing to install.
 *
 * If a component ever genuinely needs an override, that is a signal it needs another variant.
 */

type Options = Record<string, Record<string, string>>

type Choice<O extends Options> = {
  [K in keyof O]?: keyof O[K] | undefined
}

/**
 * Build a class-string function from a base and a set of variant axes.
 *
 * ```ts
 * const button = variants(
 *   'inline-flex items-center rounded-control',
 *   { tone: { solid: 'bg-accent', ghost: 'bg-transparent' } },
 *   { tone: 'solid' },
 * )
 * button({ tone: 'ghost' }, 'w-full')
 * ```
 */
export function variants<const O extends Options>(
  base: string,
  options: O,
  defaults: { [K in keyof O]: keyof O[K] },
) {
  const axes = Object.keys(options) as (keyof O)[]

  return (choice: Choice<O> = {}, extra?: string): string =>
    [
      base,
      ...axes.map(axis => options[axis]![(choice[axis] ?? defaults[axis]) as string]),
      extra,
    ]
      .filter(Boolean)
      .join(' ')
}

/** The choice object a `variants()` function accepts, for typing component props. */
export type VariantProps<F> = F extends (choice?: infer C, extra?: string) => string ? C : never
