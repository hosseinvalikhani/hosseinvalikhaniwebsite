# Design system

Everything visual, and the rules that keep it coherent. Open
[`/design-system`](http://localhost:3000/design-system) while reading this — it renders every
token and component in both themes, and it is the fastest way to catch a value that only works in
one of them.

---

## Colour: three tiers

The whole palette is three layers, and **which layer you reach for is the single most important
habit in this codebase.**

### Tier 1 — the ramps (`tokens.css`, `@theme`)

Three ramps of eleven steps: `brand` (Nuxt green), `echo` (sky), `slate`, plus fixed points
(`ink`, `signal`, `danger`). Transcribed from the brand source, never invented.

**Application code must never use these.** `text-slate-400` is banned by lint — see below.

### Tier 2 — semantic roles (`tokens.css`, `@theme inline` + `:root`)

What components actually use. Each names a **role**, not a colour:

| Token | Role |
|---|---|
| `canvas` | The page. ~60% of what you see. |
| `surface` / `raised` | Cards; panels on top of cards. |
| `hairline` | 1px rules and card edges — decoration. |
| `hairline-strong` | Borders that *identify a control*. Held to 3:1. |
| `fg` / `fg-muted` / `fg-subtle` | Headings & body / secondary / metadata. All three are real text and all three meet 4.5:1. |
| `accent` | Fills. Same hue in both themes. ~8%, one element per screen. |
| `accent-edge` | The boundary of that fill. Equals the fill on dark; Pine on light. |
| `accent-text` | Green as *type* — steps to the 700 value on light. |
| `on-accent` | Text on an accent fill. Ink, never white. |
| `link` / `link-hover` | The echo colour. ~2%. |
| `signal` / `danger` | Emphasis; errors. |
| `focus` | The focus ring. Never removed. |

`@theme inline` matters: it makes the generated utility reference the *variable*, so `bg-canvas`
re-resolves the instant the theme class flips. A plain `@theme` would bake one theme's colours
into the compiled utility and the toggle would do nothing.

### Tier 3 — utilities

`bg-surface`, `text-fg-muted`, `border-hairline`. This is what you write.

### The rule, enforced by lint

```
✗ class="text-slate-400"     ← a ramp step names a colour
✓ class="text-fg-subtle"     ← a semantic token names a role
```

`eslint.config.mjs` fails the build on the first form anywhere outside `app/components/ds/**` and
the style guide. A ramp step is correct today and wrong the moment the theme flips.

### Why `accent` and `accent-text` are two tokens

Nuxt green is 11.1:1 on ink and **1.8:1 on white**. It is a superb fill and an unreadable
typeface. The split is the whole reason the light theme is legible.

### Contrast is a command, not a claim

```bash
npm run check:contrast
```

Reads `tokens.css`, computes every text pair against 4.5:1 and every component boundary against
3:1, in both themes. The Phase 12 audit found three failures this way that reading the CSS never
would have — including a third text tier at 3.46:1 carrying every post date on the site.

---

## Type

Two families, one fluid scale. `--font-sans` is Inter; `--font-mono` is JetBrains Mono, used for
eyebrows, dates, reading time and code.

Sizes use `clamp()` so nothing snaps between breakpoints. **The trap** — worth internalising,
because it cost a round of debugging:

```css
--text-display: clamp(2rem, 1.3rem + 3.55vw, 4.5rem);
/*                    ^min   ^preferred        ^max  */
```

At 320px the *preferred* term resolves to 32px. Lowering the **minimum** does nothing, because the
minimum was never the binding constraint. To change what a narrow screen gets, **change the
slope**, and fit the curve to its two ends rather than picking numbers and patching them.

`base.css` puts `overflow-wrap: break-word` on `h1`–`h4` as a backstop for a name longer than any
type scale can anticipate.

---

## Icons

Thirteen icons, as raw path data, in [`app/design/icons.ts`](../app/design/icons.ts):

`github` `linkedin` `x` `rss` `mail` `menu` `close` `sun` `moon` `monitor` `arrow-up-right`
`copy` `check`

This replaces an icon runtime (`@nuxt/icon` + `@iconify/vue`), which resolves names at runtime and
fetches anything unbundled over the network. For thirteen icons that is a lot of machinery: this
file is ~2 KB, ships inside the component that uses it, and makes zero requests.

```vue
<DsIcon name="github" />
<DsIcon name="mail" :size="18" />
```

**An icon is always decorative.** `DsIcon` is `aria-hidden="true"` with no exceptions and no prop
to change it. Meaning lives in the label of whatever contains it.

### Adding one

1. Draw or find it on a **24×24 grid**.
2. Add one entry to `icons.ts`. Stroke icons are a single path using `currentColor` at 2px; brand
   marks set `filled: true` because their shapes are not strokeable.
3. That's it — `IconName` is inferred from the object, so the new name is immediately type-safe
   and appears on the style guide.

```ts
export const icons = {
  download: { d: 'M12 3v12m0 0 4-4m-4 4-4-4M4 19h16' },
  someBrand: { filled: true, d: 'M…' },
} as const satisfies Record<string, IconDefinition>
```

---

## The `variants` helper

[`app/design/variants.ts`](../app/design/variants.ts) is a 15-line stand-in for `cva` /
`tailwind-variants`:

```ts
const classes = variants(
  'inline-flex items-center rounded-control',   // base
  { variant: { primary: 'bg-accent …', ghost: '…' },
    size:    { sm: 'text-sm', md: 'text-base' } },
  { variant: 'primary', size: 'md' },           // defaults
)

classes({ variant: 'ghost' }, 'w-full')
```

Those libraries exist mainly to **merge conflicting classes**, which is only a problem when
components accept arbitrary class overrides. Ours don't — a component exposes `variant` and `size`
and owns its colours, so there is nothing to merge and nothing to install.

> If a component ever genuinely needs a class override, that is a signal it needs another
> variant, not that it needs `tailwind-merge`.

### The padding lesson

`DsButton` keeps padding **outside** the variant axes, deliberately. Emitting `px-5` for the size
and `px-0` for the icon-only shape puts both in the class attribute, and Tailwind resolves that by
**stylesheet order, not attribute order** — so `px-5` silently won and icon-only buttons rendered
full width. Not creating the conflict is cheaper than papering over it.

---

## Components

### `ds/` — the design system

| Component | Notes |
|---|---|
| `DsButton` | Renders a real `<button>`, `NuxtLink` or `<a>` — never a clickable div. `iconOnly` **requires** `label` at the type level. |
| `DsLink` | Underlined permanently. Colour alone is not an accessible link indicator. |
| `DsBadge` | Non-interactive chip. `sm` padding is set by WCAG target size, not taste. |
| `DsCard` | Draws an edge and a background. Nothing else. |
| `DsIcon` | Always `aria-hidden`. |
| `DsContainer` | `page` (72rem) or `prose` (65ch). |
| `DsSection` | Titled section, labelled by its own heading. |
| `DsEyebrow` | The signature mono label. `decorative` hides it from screen readers. |
| `DsAvatar` | `size` is a **ceiling** — `min(size, 42vw)`. Explicit dimensions, zero CLS. |
| `DsDialog` | Native `<dialog>`. Addressed by `id`. |
| `DsThemeToggle`, `DsCopyButton` | Markup only; behaviour in `enhance.js`. |
| `DsBreadcrumb`, `DsSkipLink`, `DsVisuallyHidden` | — |

### Two patterns worth copying

**The stretched card link.** To make a whole card clickable, put `class="ds-card-link"` on the
link that should own it — normally the title. Its `::after` covers the card.

```vue
<DsCard as="article" interactive>
  <h2><NuxtLink :to="post.path" class="ds-card-link">{{ post.title }}</NuxtLink></h2>
  <p>{{ post.description }}</p>
  <div class="relative z-10"><TagList :tags="post.tags" linked /></div>
</DsCard>
```

One tab stop, and the accessible name is the title rather than every word in the card. The
alternatives are both worse: a click handler on the container leaves keyboard users nothing to
focus, and wrapping the card in an `<a>` makes its name the card's entire text content. Anything
that must stay separately clickable needs `relative z-10` to sit above the stretched area.

**The dialog.** `showModal()` gives you, correctly and for free, a focus trap, the rest of the
page made `inert`, Escape to dismiss, focus returned to the opener, and the top layer. That is why
there is no focus-trap dependency — and why dropping Vue cost this component almost nothing.

```vue
<DsButton data-ds-dialog-open="my-dialog">Open</DsButton>
<DsDialog id="my-dialog" title="A dialog">…</DsDialog>
```

---

## Shape, motion, and the glow

Four radii (`chip`, `control`, `panel`, `card`), three durations, one easing curve
(`--ease-out-quint`).

**Reduced motion is handled globally** in `base.css`, so a component can never forget. Durations
*and delays* collapse — the delays matter: `.ds-reveal` uses `backwards` fill, so without
collapsing `animation-delay` the hero still staggered for someone who asked for no motion.

**The glow** (`.ds-glow`) is two radial gradients, not a `filter: blur(90px)`, because a large
repeatedly-composited blur is expensive on scroll. It carries `overflow-x: clip` — `clip`, not
`hidden`, because `hidden` forces the other axis to `auto` and would break `position: sticky` for
descendants.

---

## Rules of thumb

1. **Semantic token, never a ramp step** — enforced by lint.
2. **Green once per screen.** If you can see the accent twice, something is wrong.
3. **Never green body text.** Never a 50/50 green/sky split. No green→sky gradients.
4. **A control is a `<button>` or an `<a>`.** Never a div with a handler.
5. **Icon-only means `label`.** The type system enforces it; don't fight it.
6. **44×44 for standalone controls**, 24×24 absolute minimum for inline chips.
7. **Check both themes.** Every colour bug in this project's history has been a
   one-theme-only bug.
