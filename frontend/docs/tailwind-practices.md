# Tailwind CSS Practices

**Baseline** · Tailwind CSS 4.3 documentation. **Examples** · React and Vite.

Tailwind generates ordinary CSS during the build. It finds complete class names in your source files and produces the corresponding rules. React decides which classes and elements appear. The browser applies the generated CSS according to the cascade, the current viewport, and the state of the element.

## Contents

1. [Set up React and Vite](#1-set-up-react-and-vite)
2. [Compose utilities](#2-compose-utilities)
3. [Build responsive layouts](#3-build-responsive-layouts)
4. [Handle states and accessibility](#4-handle-states-and-accessibility)
5. [Create a theme and support dark mode](#5-create-a-theme-and-support-dark-mode)
6. [Reuse styles in React](#6-reuse-styles-in-react)
7. [Keep classes detectable](#7-keep-classes-detectable)
8. [Use custom CSS deliberately](#8-use-custom-css-deliberately)
9. [Debug missing or overridden styles](#9-debug-missing-or-overridden-styles)
10. [Maintain or migrate a project](#10-maintain-or-migrate-a-project)
11. [Review before merging](#11-review-before-merging)

## 1. Set up React and Vite

In an existing Vite project using npm, install Tailwind v4 and its Vite integration.

```bash
npm install -D tailwindcss@4 @tailwindcss/vite@4
```

Add the plugin to the existing Vite configuration. This example assumes your project already uses `@vitejs/plugin-react`. Keep the React plugin your project uses and retain its other settings.

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

Add the import at the top of the app's main stylesheet, for example `src/index.css`. Import that stylesheet in `src/main.jsx` with `import './index.css'`, or keep the equivalent existing entry import.

```css
@import "tailwindcss";
```

Start the dev server with `npm run dev`. Render this heading somewhere visible to check that sizing, weight, and color all take effect.

```jsx
<h1 className="text-3xl font-bold text-emerald-600">Asset register</h1>
```

Run `npm run build` when the project has that script, and check the production preview using the project's preview command. Choose the integration your build uses. For a PostCSS pipeline, v4 provides `@tailwindcss/postcss`. For standalone CSS builds, it provides `@tailwindcss/cli`. Process the main stylesheet through one Tailwind integration.

[Using Vite](https://tailwindcss.com/docs/installation/using-vite) · [Using PostCSS](https://tailwindcss.com/docs/installation/using-postcss) · [Tailwind CLI](https://tailwindcss.com/docs/installation/tailwind-cli) · [Vite production build](https://vite.dev/guide/build)

## 2. Compose utilities

A utility expresses one styling job or a small related group. Read `grid gap-4 rounded-lg border p-4` as a layout, a gap, a corner radius, a border, and padding. Start with the project's spacing, type, and color scales so related screens look consistent.

| Job | Common utilities | What to check |
| --- | --- | --- |
| Page or component layout | `flex`, `grid`, `items-center`, `justify-between`, `gap-4` | Use flex for a row or column and grid when rows and columns need coordinated tracks. |
| Space and size | `p-4`, `px-6`, `w-full`, `max-w-5xl`, `min-w-0` | Use padding for the inside edge and gaps for siblings. Give text room to wrap and flex children room to shrink. |
| Typography | `text-sm`, `font-medium`, `leading-relaxed`, `text-slate-700` | `text-sm` sets type size and a default line height. `text-slate-700` sets text color. Use real headings and labels in markup. |
| Surfaces | `bg-white`, `border`, `border-slate-200`, `rounded-lg`, `shadow-sm` | Give a border a deliberate color. Reserve stronger emphasis for selected or elevated content. |
| Overflow | `overflow-x-auto`, `wrap-break-word`, `truncate` | Scope horizontal scrolling to content that needs it. Make complete values available when truncation hides meaningful text. |

Prefer utilities for the design system's regular values. Use an arbitrary value for a genuine one-off, such as `grid-cols-[16rem_minmax(0,1fr)]` for a specific two-pane layout. An underscore represents a space where the syntax calls for one. If a value recurs across components, give it a named token or extract the repeated pattern.

Keep one clear utility per property within the same state. Both `p-4` and `p-6` set padding. The order of their names in the HTML attribute does not pick the winner. Browser cascade rules and the order of the generated CSS decide that. A base utility plus a variant, such as `p-4 md:p-6`, gives each value a clear condition.

[Styling with utility classes](https://tailwindcss.com/docs/styling-with-utility-classes) · [Padding](https://tailwindcss.com/docs/padding) · [Text overflow](https://tailwindcss.com/docs/text-overflow)

## 3. Build responsive layouts

Style the smallest layout first. Unprefixed utilities apply at every size unless a later rule overrides them. With Tailwind's defaults, `sm:` starts at `40rem` and `md:` starts at `48rem`. Use a breakpoint where the content needs more room. A prefix such as `md:` continues to apply at larger widths. Use `md:max-xl:` when the style belongs only in that range.

```jsx
<section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6">
  <article className="min-w-0 rounded-lg border border-slate-200 p-4">
    <h2 className="font-semibold">Working registers</h2>
  </article>
  <article className="min-w-0 rounded-lg border border-slate-200 p-4">
    <h2 className="font-semibold">Invited registers</h2>
  </article>
</section>
```

Use a container query when a component's layout depends on its own available space. A card can appear in a wide page or in a narrow sidebar on the same screen. Mark its ancestor with `@container`, then use a variant such as `@md:flex-row` on a descendant. `@md:` measures the container, while `md:` measures the viewport. Their default thresholds differ.

Check a narrow screen, a short window, browser zoom, and long labels. For a wide asset table, keep the table semantics and wrap it in an `overflow-x-auto` region when comparison genuinely needs multiple columns. Preserve keyboard access to scrolling and keep the page controls outside that scrolling region. Keep DOM order meaningful when changing visual layout. Use logical utilities such as `ps-4` and `pe-4` when spacing should follow reading direction.

[Responsive design and container queries](https://tailwindcss.com/docs/responsive-design) · [Logical padding utilities](https://tailwindcss.com/docs/padding) · [W3C guidance on reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

## 4. Handle states and accessibility

Variants describe when a utility applies. Several variants can be stacked, as in `dark:md:border-slate-700`. When a stack changes a selector's structure, check the generated selector. The order of those variants can matter.

| Need | Variant or pattern |
| --- | --- |
| Hover and keyboard focus | Pair an enhancement such as `hover:bg-blue-800` with visible keyboard feedback such as `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700`. |
| Pressed or disabled control | Use `active:` for the press and `disabled:` for styling a real disabled control. Use the HTML `disabled` attribute when the control should be disabled. |
| Persistent selection or disclosure | Set the appropriate semantic state in the markup, such as `aria-expanded={isOpen}` on a disclosure button, then style it with `aria-expanded:`. |
| Parent or sibling state | Put `group` on an ancestor for `group-*` variants. Put `peer` on an earlier sibling for `peer-*` variants on a later sibling. Keep markup and focus order meaningful. |
| Reduced motion and system colors | Use `motion-safe:` for optional motion and verify visible focus and status cues in forced colors. |
| Custom attribute state | Use a literal variant such as `data-[state=open]:bg-slate-100` for a state exposed by a component. Supply native semantics or the proper ARIA state separately. |

Use a link for navigation, a button for an action, and a label for a form field. Tailwind classes control appearance. The elements and their behavior supply keyboard interaction and accessibility semantics. Keep important actions available on touch and keyboard, and give a status a text label in addition to its color. Measure contrast in the actual rendered states. If hiding content, choose `hidden` for display removal or `sr-only` for content that should remain available to assistive technology. A keyboard-focusable skip link should become visible on focus.

[Variants and states](https://tailwindcss.com/docs/hover-focus-and-other-states) · [Display and screen-reader utilities](https://tailwindcss.com/docs/display) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## 5. Create a theme and support dark mode

Use top-level `@theme` for values that should create Tailwind utilities or variants. For example, `--color-brand-700` makes `bg-brand-700` and `text-brand-700` available. A `--breakpoint-*` variable defines a viewport variant. Keep breakpoint units consistent with the rest of the scale so the rules sort as expected. Use normal CSS variables for values that do not need their own utility names.

For values that change with appearance, define semantic CSS variables and connect them to utilities through `@theme inline`. This example uses a theme attribute on `<html>` and can replace the minimal stylesheet in section 1.

```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

:root {
  color-scheme: light;
  --surface: #ffffff;
  --ink: #172033;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --surface: #172033;
  --ink: #e8edf5;
}

@theme {
  --color-brand-700: #1d4ed8;
}

@theme inline {
  --color-surface: var(--surface);
  --color-ink: var(--ink);
}
```

Use `bg-surface text-ink` in shared components so those classes work in both appearances. Use `dark:` for changes that need their own dark-mode rule. Tailwind's default `dark:` variant follows the system's `prefers-color-scheme`. For a system-only theme, keep that default and put the dark token values in a matching media query. If you offer Light, Dark, and System choices, set the attribute from the saved user preference and current system preference. Apply the resolved attribute before the first paint where possible to avoid a theme flash. Check text, controls, focus, disabled states, and overlays in each mode.

Extend the palette before considering a replacement. Setting `--color-*: initial` removes the default color namespace. Existing classes such as `text-emerald-600` then need their corresponding colors restored or a different token.

[Theme variables](https://tailwindcss.com/docs/theme) · [Colors](https://tailwindcss.com/docs/colors) · [Dark mode](https://tailwindcss.com/docs/dark-mode)

## 6. Reuse styles in React

Keep utility classes next to the markup when the design is local. Extract a React component when the same structure, semantics, behavior, and appearance need to stay in sync. Give callers a small set of intent-based choices such as `tone="approved"`.

```jsx
const requestTones = {
  pending: 'bg-amber-100 text-amber-950',
  approved: 'bg-emerald-100 text-emerald-950',
  rejected: 'bg-rose-100 text-rose-950',
}

export function RequestStatus({ status, label }) {
  const tone = Object.hasOwn(requestTones, status)
    ? requestTones[status]
    : 'bg-slate-100 text-slate-900'

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tone}`}>
      {label}
    </span>
  )
}
```

Here the caller supplies a visible label such as **Awaiting approval**. The status controls which complete utility strings are selected. Use a shared base string when variants differ in just a few properties. Use conditional expressions or a class-name helper for longer conditions. If a component accepts caller classes, document how callers can customize it. Expose named props for appearance choices that would otherwise create conflicts such as two padding utilities in the same state.

[Managing duplication and class conflicts](https://tailwindcss.com/docs/styling-with-utility-classes) · [Detecting complete class names](https://tailwindcss.com/docs/detecting-classes-in-source-files)

## 7. Keep classes detectable

The scanner reads source as text. It can find `bg-emerald-100` in the status map above. In an expression such as `bg-${color}-100`, the complete class appears only at runtime, after CSS generation. Use a map of allowed variants for a small set of choices. For a continuous value, keep the class static and pass a validated value through a CSS custom property.

```jsx
function AssetThumbnail({ src, alt, size }) {
  const pixels = Number.isFinite(size) ? Math.min(160, Math.max(40, size)) : 64

  return (
    <img
      src={src}
      alt={alt}
      className="size-[var(--thumbnail-size)] rounded object-cover"
      style={{ '--thumbnail-size': `${pixels}px` }}
    />
  )
}
```

Tailwind v4 normally detects source files automatically. It skips files covered by Git ignore rules and directories such as `node_modules`. Start with the defaults. Register an external package or workspace directory explicitly when it contains classes that your stylesheet should compile. For `src/index.css`, a package installed in the app's root could be registered as follows.

```css
@import "tailwindcss";
@source "../node_modules/@acme/ui";
```

The `@source` path is relative to the stylesheet. In a monorepo, `source("...")` on the import can set the scanning base, and `source(none)` lets a stylesheet enumerate its sources. Use `@source inline("...")` for a small, known set of required utilities that do not occur in the scanned files. Keep external data such as API status values mapped to local styles, so the styling choices stay visible in the code.

[Detecting classes in source files](https://tailwindcss.com/docs/detecting-classes-in-source-files) · [Arbitrary values and inline styles](https://tailwindcss.com/docs/styling-with-utility-classes)

## 8. Use custom CSS deliberately

Tailwind's main import includes Preflight, a set of base styles. Default heading sizes, margins, and list markers may change even before you add utilities. Keep semantic headings and lists in the markup and restore the presentation your design needs. If a third-party widget relies on browser defaults, scope any fixes to that widget and check the effect in the browser.

| Tool | When to use it |
| --- | --- |
| `@layer base` | Set intentional defaults for elements such as the page background or body typography. |
| `@layer components` | Define a named style for shared or third-party markup, while allowing ordinary utilities in the utilities layer to override it. |
| `@utility` | Register a reusable CSS utility that should work with Tailwind variants. |
| `@apply` | Inline existing utilities in a stylesheet where that improves a selector you need to maintain. For repeated React UI, a component often keeps style and semantics together. |
| `@reference` | Make Tailwind theme values, utilities, and variants available to `@apply` or `@variant` in a separately processed stylesheet without duplicating the main stylesheet's CSS. |
| Plain CSS | Use it for complex selectors, third-party overrides, or layout that reads more clearly as CSS. |

For example, a CSS module next to `src/index.css` can reference the project's theme and compose the utilities it needs.

```css
@reference "./index.css";

.summary {
  @apply rounded-lg border border-slate-200 p-4;
}
```

For normal declarations from the same origin, unlayered CSS has priority over layered CSS. A legacy selector in an unlayered stylesheet can therefore override a Tailwind utility even when the class is present. Inspect the winning declaration and make the layer or override intentional.

[Preflight](https://tailwindcss.com/docs/preflight) · [Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles) · [Functions and directives](https://tailwindcss.com/docs/functions-and-directives) · [CSS cascade layers](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Cascade_layers)

## 9. Debug missing or overridden styles

Start with the `text-3xl font-bold text-emerald-600` heading from section 1. Open DevTools, inspect the heading, and check the Styles and Computed panels.

| What you see | What to check next |
| --- | --- |
| The expected class is missing from the DOM | Check React's `className`, conditions, and any component that must forward the class. |
| The class is in the DOM, but none of the probe utilities has a rule | Run `npm ls tailwindcss @tailwindcss/vite --depth=0` from the frontend directory. Check the Vite plugin, the stylesheet's Tailwind import, and the entry file's stylesheet import. Reload the dev server after changing the Vite configuration. |
| The sizing and weight work, but the color utility has no rule | Check spelling, the complete source string, and whether your theme clears the default palette or replaces the color token. For classes from another package or folder, check source detection. |
| The rule exists and is crossed out | Inspect the winning declaration for an inline style, a conflicting utility, an unlayered rule, or an important declaration. Fix the source of the conflict. |
| A variant rule exists but is inactive | Check viewport or container width, the theme selector, the actual focus or hover state, and any required `group`, `peer`, ARIA, or data attribute. |
| The style works locally and fails in the deployed build | Build and preview locally. Verify the deployed CSS asset, frontend base path, cached build version, and source paths as resolved in CI. |

If IntelliSense suggests a class, still check that the build emitted a rule and the browser applied it. Use the official editor extension for completion and diagnostics. A formatter can sort classes consistently across a team. For v4, set the official Prettier plugin’s `tailwindStylesheet` option to the CSS entry file, relative to the Prettier configuration.

[Editor setup](https://tailwindcss.com/docs/editor-setup) · [Official Prettier plugin](https://github.com/tailwindlabs/prettier-plugin-tailwindcss) · [Source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files)

## 10. Maintain or migrate a project

Check the installed major version before copying setup instructions. A working v3 project can keep its documented configuration until you deliberately migrate it.

| Area | Tailwind v3 | Tailwind v4 |
| --- | --- | --- |
| CSS entry | `@tailwind base`, `@tailwind components`, `@tailwind utilities` | `@import "tailwindcss";` |
| Theme | Usually `tailwind.config.js` | CSS-first `@theme`. Use `@config` for compatible legacy configuration that still needs to be loaded. |
| Source discovery | Configure `content` paths in the JavaScript config | Automatic detection, with `@source` for explicit additions or generation. |
| Build integration | `tailwindcss` serves as the PostCSS plugin | Use the integration for the build, such as `@tailwindcss/vite` or `@tailwindcss/postcss`. |
| Legacy setup tutorials | Commonly use `npx tailwindcss init -p` | The v4 Vite setup adds the plugin and stylesheet import directly. |

For a migration, check browser support first. The v4 upgrade guide lists Safari 16.4+, Chrome 111+, and Firefox 128+ as the baseline. The official upgrade tool requires Node.js 20 or newer. Run it on a migration branch and review the generated changes. In particular, review default border colors, bare `ring` width and color, renamed utilities, changes in order-sensitive variant stacks, and Preflight changes. Verify important components visually before and after the upgrade.

[Upgrade guide](https://tailwindcss.com/docs/upgrade-guide) · [Compatibility](https://tailwindcss.com/docs/compatibility) · [Tailwind v3 with Vite](https://v3.tailwindcss.com/docs/guides/vite)

## 11. Review before merging

- Build the app with its usual production command and inspect the changed screen in the built preview.
- Check narrow and wide layouts, zoom, long text, overflow, and the light and dark appearances the product supports.
- Test keyboard focus, touch, disabled controls, empty and error states, and any loading or reduced-motion behavior the change affects.
- Confirm that conditional classes appear as complete strings in scanned source and that new external sources are scoped to the needed paths.
- Reuse existing tokens and component variants. Give a new token a name when it represents a recurring design decision.
- Inspect the diff for styling conflicts, unintended global overrides, and unrelated formatting changes.
