# Web UI Design with Apple’s Human Interface Guidelines

**Scope** · Applying Apple's Human Interface Guidelines (HIG) to responsive browser interfaces. **Reviewed** · November 2026.

Apple writes the HIG for its platforms. This guide draws on that guidance for decisions about hierarchy, interaction, feedback, and visual design. It uses web standards for implementation and WCAG 2.2 for the stated accessibility criteria. Examples use an inventory register like Invory and apply to many form-heavy and data-heavy web apps.

Three labels identify the origin of a recommendation.

| Label | How to use it |
| --- | --- |
| **Apple HIG** | Use it to understand a design principle or native platform convention. |
| **Web practice** | Adapt the principle to browser capabilities, input methods, and user expectations. |
| **WCAG** | Use the named success criterion and its exceptions when assessing accessibility conformance. |

Primary references · [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) · [Apple design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles/) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [HTML Living Standard](https://html.spec.whatwg.org/)

## Contents

- [1. Design principles and how they apply to the web](#1-design-principles-and-how-they-apply-to-the-web)
- [2. User tasks, information architecture, and navigation](#2-user-tasks-information-architecture-and-navigation)
- [3. Layout, responsive behavior, and safe areas](#3-layout-responsive-behavior-and-safe-areas)
- [4. Typography, interface writing, and localization](#4-typography-interface-writing-and-localization)
- [5. Color, light and dark appearance, and contrast](#5-color-light-and-dark-appearance-and-contrast)
- [6. Icons, imagery, and brand assets](#6-icons-imagery-and-brand-assets)
- [7. Motion, depth, and materials](#7-motion-depth-and-materials)
- [8. Navigation, controls, search, and data views](#8-navigation-controls-search-and-data-views)
- [9. Forms, onboarding, and authentication](#9-forms-onboarding-and-authentication)
- [10. Feedback, loading, and recovery](#10-feedback-loading-and-recovery)
- [11. Dialogs, sheets, and destructive actions](#11-dialogs-sheets-and-destructive-actions)
- [12. Input, focus, and accessibility](#12-input-focus-and-accessibility)
- [13. Privacy, permission, and trust](#13-privacy-permission-and-trust)
- [14. Web implementation and Safari testing](#14-web-implementation-and-safari-testing)
- [15. Collaboration and supporting workflows](#15-collaboration-and-supporting-workflows)
- [16. Design review for an inventory register](#16-design-review-for-an-inventory-register)

## 1. Design principles and how they apply to the web

Apple’s Human Interface Guidelines (HIG) describe how to design for Apple platforms. Their guidance on purpose, clarity, interaction, and accessibility also informs cross-platform web apps. Use web standards to implement the experience in a browser. An HTML control, a CSS pixel, and a Safari viewport each have their own behavior.

| Apple principle | What to do in a web app |
| --- | --- |
| Purpose | Name the job each screen helps someone finish. Give the most important information and action enough space to be found quickly. |
| Agency | Make the current state and available choices visible. Preserve work when people go back, dismiss an optional flow, or recover from an error. Offer Undo when an action can be reliably reversed. |
| Responsibility | Explain who can see shared information and what happens after a consequential action. Ask for access when the person has a reason to grant it. Collect only the information the workflow needs. |
| Familiarity | Use browser conventions for links, forms, and scrolling. Give the same action the same name and interaction wherever it appears. |
| Flexibility | Let the interface adapt to small windows, zoom, touch, keyboards, assistive technology, and other languages. Offer a visible control for tasks available through gestures or shortcuts. |
| Simplicity | Keep frequent actions visible and reveal optional details when requested. Remove controls that duplicate the same decision. |
| Craft | Refine spacing, alignment, readable copy, and the transitions between empty, loading, success, error, and permission states. Review real data at realistic lengths. |
| Delight | Add moments of care that help people finish or understand a task, such as a clear completion summary they can act on immediately. |

Apple also uses **hierarchy, harmony, and consistency** when describing its platform design. Hierarchy directs attention through order, size, contrast, and grouping. Harmony aligns the visual language with the content, device, and input method. Consistency makes repeated controls and behavior predictable. A register page can use a prominent register title and one emphasized action, plain surfaces behind dense data, and the same Save and Cancel conventions as the rest of the application. [Apple HIG — Design principles](https://developer.apple.com/design/human-interface-guidelines/design-principles/) · [Apple Developer — Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass) · [Apple HIG — Privacy](https://developer.apple.com/design/human-interface-guidelines/privacy/)

## 2. User tasks, information architecture, and navigation

Start with the tasks people do and the permissions they have. Sketch the entry point, decisions, feedback, and recovery for each task. Group pages by where people expect to find them. Keep location and role visible when either changes the actions available.

| Need | Web pattern | Invory example |
| --- | --- | --- |
| Move between main destinations | Use a navigation landmark and ordinary links to durable URLs. Keep names, order, and current-page indication consistent as the layout adapts. | Working registers, Invited registers, and Requests. |
| Move from a collection to a record | Give each record a link. Use a clear title and a contextual return path, or a breadcrumb when the hierarchy is deep enough to be useful. | Working registers → Faculty equipment → Asset INV-042. |
| Switch views of one page | Use a tabs pattern for panels in the same interface. If views act like independent pages, use navigation links with the appropriate current-page state. | Details, Activity, and Attachments within an asset. |
| Act on the current content | Put the primary action near the title or the relevant item. Keep infrequent secondary actions in a clearly named overflow control when space is tight. | Add asset in the register toolbar and Open asset history in the row’s actions. |
| Find a known item | Show search scope, preserve the query, distinguish an empty collection from zero matches, and give people a clear way to remove filters. | Search this register by asset name or inventory number. |
| Navigate with limited width | Keep a small set of important destinations easy to reach. Use a labelled disclosure when a full sidebar no longer fits. | Collapse the sidebar into a Navigation button while preserving routes and labels. |

Treat Back, Forward, refresh, and direct links as part of the interface. A deep link should open the intended view, subject to access checks. Consider keeping shareable and non-sensitive filters or sort choices in the URL. On a meaningful single-page-app navigation, update the document title and consider moving focus to the new main heading with `tabindex="-1"` so keyboard and screen-reader users can orient themselves. Preserve focus for in-place updates when the focused control still makes sense. Match the visual sequence to the DOM order so reading and keyboard navigation follow the same structure. [HTML Standard — Navigation and session history](https://html.spec.whatwg.org/multipage/browsing-the-web.html) · [W3C — WCAG 2.2, Focus Order](https://www.w3.org/TR/WCAG22/#focus-order) · [W3C — WCAG 2.2, Page Titled](https://www.w3.org/TR/WCAG22/#page-titled)

## 3. Layout, responsive behavior, and safe areas

Apple’s layout guidance emphasizes visual order, alignment, related groups, and adaptation to available space. On the web, define layout changes around where the content stops fitting comfortably. Use CSS Grid for page regions or table-like alignment and Flexbox for rows of controls that can wrap. Start with a logical one-column reading order and add columns when the available width supports them. Use component container queries where adaptation depends on the component’s own space. [Apple HIG — Layout](https://developer.apple.com/design/human-interface-guidelines/layout) · [MDN — CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)

- Place the page title and key context first, then the actions and content they govern. Use smaller gaps within a group and larger gaps between unrelated groups. Align headings, cards, rows, and controls to common edges.
- On wider screens, a register list and details pane can share space. On narrower screens, open details as a full view with a clear way back. Keep controls and information available as the presentation changes.
- Let toolbars wrap and text expand vertically. Apply `min-inline-size: 0` where a grid or flex child needs to shrink, and allow long IDs, filenames, or URLs to wrap if doing so preserves the information.
- Keep a comparison-heavy table semantic. If its relationships genuinely require two dimensions, constrain horizontal scrolling to the table area and preserve the nearby heading, filters, and actions in the normal flow. Verify that keyboard users can reach and scroll that area.
- Make sticky bars earn the space they occupy. Verify that focused controls, validation messages, and final form actions can be reached and seen at high zoom and with the mobile keyboard open. Test short viewports, landscape, long translations, and narrow windows even on a desktop display.
- For WCAG 2.2 AA, check 1.4.10 Reflow. Vertically scrolling pages should keep information and actions available without side-to-side scrolling at the equivalent of 320 CSS pixels wide. For content designed to scroll horizontally, check the corresponding height of 256 CSS pixels. The criterion allows exceptions for parts that require two-dimensional layout. Check 1.4.4 Resize Text up to 200% without losing content or functionality, subject to that criterion’s exceptions. These are separate checks. [W3C — WCAG 2.2, Reflow](https://www.w3.org/TR/WCAG22/#reflow) · [W3C — WCAG 2.2, Resize Text](https://www.w3.org/TR/WCAG22/#resize-text) · [W3C — WCAG 2.2, Focus Not Obscured](https://www.w3.org/TR/WCAG22/#focus-not-obscured-minimum)

For an intentionally edge-to-edge experience, set `viewport-fit=cover` in the viewport meta tag, then keep controls and text clear of unsafe screen edges. Apply safe-area padding to the region that touches the edge. Let backgrounds extend when useful, and leave browser zoom enabled. This example applies a normal gutter even when the safe inset is zero and retains a fallback if the later declarations are unsupported.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
.edge-toolbar {
  padding: 1rem;
  padding-left: max(1rem, env(safe-area-inset-left, 0px));
  padding-right: max(1rem, env(safe-area-inset-right, 0px));
  padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px));
}
```

Use these insets for physical screen edges. Elsewhere, logical properties such as `padding-inline` and `margin-block` let the layout follow reading direction. Test edge-to-edge layouts in Safari and in the installed web app if you support both modes. [WebKit — Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) · [Apple HIG — Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left)

## 4. Typography, interface writing, and localization

Define text roles before choosing sizes. A page title establishes location, section headings separate topics, body text carries the work, labels identify controls, and metadata supports decisions. Use differences in weight, size, spacing, and contrast that are apparent at a glance. Choose a readable body weight, limit the number of typefaces, and use actual headings and labels in HTML so the same hierarchy exists for assistive technology. [Apple HIG — Typography](https://developer.apple.com/design/human-interface-guidelines/typography) · [Apple HIG — Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) · [W3C WAI — Page structure](https://www.w3.org/WAI/tutorials/page-structure/)

A browser-friendly starting stack is `system-ui, sans-serif`. It uses the device’s UI typeface where available and gives the browser a fallback. Set font sizes with relative units where appropriate, use a unitless line height, let labels wrap, and make forms and rows grow with their contents. Give multi-line prose a readable measure while allowing data views to use the width they need. On the web, verify browser zoom, text-only resizing where available, and user overrides for text spacing. Apple’s Dynamic Type and native point sizes are guidance for Apple application frameworks. [WebKit — Using the System Font in Web Content](https://webkit.org/blog/3709/using-the-system-font-in-web-content/) · [W3C — WCAG 2.2, Text Spacing](https://www.w3.org/TR/WCAG22/#text-spacing)

Use language that describes what will happen. Prefer **Send transfer request** when the next step is a review and **Transfer asset** when the action moves the asset immediately. Use the same term for the same object throughout the product. Keep labels visible and use helper text for constraints or consequences. Tell people what happened and what they can do next. “This inventory number is already used. Enter a different number.” gives more direction than “Invalid value.” [Apple HIG — Writing](https://developer.apple.com/design/human-interface-guidelines/writing)

Design for translation from the start. Put human-facing copy in messages with enough context for translators. Use complete messages with placeholders and plural forms. Format dates, numbers, units, and currencies for the chosen locale, and show the time zone when the distinction matters. Set the HTML `lang` attribute and the appropriate document or region direction. Use `dir="auto"` or isolation such as `<bdi>` when displaying unknown-direction user content inside a sentence. Mirror directions that depend on reading order, such as a forward chevron, and preserve the meaning of symbols with an established physical or media convention. Test expansion, line breaks, Cyrillic, and mixed RTL and LTR content with actual examples. [Apple Developer — Localization](https://developer.apple.com/localization/) · [Apple HIG — Right to left](https://developer.apple.com/design/human-interface-guidelines/right-to-left) · [MDN — JavaScript internationalization](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Internationalization)

## 5. Color, light and dark appearance, and contrast

Assign colors by role. Define separate tokens for page background, raised surfaces, text, secondary text, borders, action, focus, and each status. Use a limited accent palette so emphasized actions and selections stay recognizable. Give status a readable label and, when helpful, an icon or another visual cue. In Invory, **Awaiting approval**, **Approved**, and **Rejected** should be understandable even in a grayscale view. [Apple HIG — Color](https://developer.apple.com/design/human-interface-guidelines/color) · [W3C — WCAG 2.2, Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color)

| WCAG 2.2 criterion | What to check |
| --- | --- |
| 1.4.1 Use of Color, Level A | Information, actions, and required distinctions have a cue beyond hue. Underline inline links or provide another cue that meets the criterion. |
| 1.4.3 Contrast (Minimum), Level AA | Text and images of text reach 4.5:1 against the background, or 3:1 for large-scale text, with the criterion’s exceptions. Large-scale is at least 18 pt regular or 14 pt bold, or an equivalent size for CJK text. |
| 1.4.11 Non-text Contrast, Level AA | Visual information needed to identify an active control or state and meaningful parts of graphics reach 3:1 against adjacent colors, subject to the criterion’s exceptions. |

Measure actual foreground and background pairs in each theme and state, especially placeholders, focus indicators, badges, icons, overlays, and text drawn over imagery. A border used purely as decoration has a different purpose from the only visible edge that identifies a text field. When the latter conveys necessary information, measure its contrast against the adjacent colors. Apple’s native appearance guidance and WCAG web success criteria can inform the same review. [Apple HIG — Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) · [W3C — WCAG 2.2, Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) · [W3C — WCAG 2.2, Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast)

Use `prefers-color-scheme` to select a supported default and `color-scheme` to tell the browser which schemes its built-in controls can use. Design surfaces and foregrounds together in both themes. If you offer Light, Dark, and System controls, persist the choice and keep browser-rendered controls aligned with it. Test forced colors on a supported platform and provide a visible outline or border when shadows and fills lose their meaning. [WebKit — Dark Mode Support](https://webkit.org/blog/8840/dark-mode-support-in-webkit/) · [MDN — Forced colors](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/forced-colors)

In this example web palette, the link colors against the listed surfaces have contrast of about 6.64:1 in light mode and 8.57:1 in dark mode. Add and verify colors for the remaining component states as you implement them.

```css
:root {
  color-scheme: light;
  --surface: #ffffff;
  --text: #172033;
  --secondary-text: #4e5b70;
  --link: #005bb5;
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --surface: #202937;
    --text: #e8edf5;
    --secondary-text: #b6c0cf;
    --link: #9bcaff;
  }
}

body {
  color: var(--text);
  background: var(--surface);
}

a {
  color: var(--link);
  text-decoration: underline;
}
```

## 6. Icons, imagery, and brand assets

Use simple shapes for familiar concepts, and keep optical size, stroke, alignment, and silhouette consistent. Pair icons with visible text for important or unfamiliar actions. For an icon-only button, give the control a meaningful accessible name such as **Close filters**, and hide a redundant inline SVG from assistive technology with `aria-hidden="true"`. Size the interactive area independently from the drawn symbol so a small graphic can still have a generous target. [Apple HIG — Icons](https://developer.apple.com/design/human-interface-guidelines/icons) · [W3C WAI — Functional images](https://www.w3.org/WAI/tutorials/images/functional/)

Use an icon set or custom artwork with terms that cover browser delivery. Apple documents SF Symbols for its platforms and calls out restrictions on particular symbols and uses. Check the applicable asset terms before embedding, exporting, or distributing Apple artwork or font files. A system font stack gives a platform-appropriate result without bundling a font file. Design a distinct favicon and install icon that is recognizable at small sizes. [Apple HIG — SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols) · [Apple Developer — Fonts](https://developer.apple.com/fonts/) · [Apple HIG — App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons/) · [Apple — Copyright and trademark guidelines](https://www.apple.com/legal/intellectual-property/guidelinesfor3rdparties.html)

Choose imagery that explains, identifies, or supports the task. In an asset register, a photo can help someone identify a specific laptop while an icon can indicate its equipment category. Give an informative image a text alternative that conveys its purpose in context, use `alt=""` for a decorative HTML image, and give charts a textual summary or equivalent data. Use intrinsic dimensions to reserve space for images, offer responsive sizes with `srcset` and `sizes` where useful, and check that cropping preserves the relevant part. Reserve lazy loading for suitable off-screen images. [Apple HIG — Image views](https://developer.apple.com/design/human-interface-guidelines/image-views) · [W3C WAI — Images tutorial](https://www.w3.org/WAI/tutorials/images/) · [HTML Standard — Images](https://html.spec.whatwg.org/multipage/embedded-content.html#the-img-element)

## 7. Motion, depth, and materials

Use movement to explain a relationship or acknowledge a change. A compact disclosure may animate open to show where the additional details belong. The expanded state should also be clear from the control, label, and content. Keep animation brief enough to preserve responsiveness and interruptible where appropriate. Give state changes a stable text, shape, or visual outcome that remains useful when motion is reduced. [Apple HIG — Motion](https://developer.apple.com/design/human-interface-guidelines/motion) · [WebKit — Responsive Design for Motion](https://webkit.org/blog/7551/responsive-design-for-motion/)

Honor `prefers-reduced-motion`. Keep the basic experience static, and enhance it with motion where the user has expressed no reduction preference. Replace large travel, zoom, parallax, and decorative looping with a stable change or a brief fade when appropriate. Test programmatic scrolling and scripted animation as well as CSS. WCAG 2.2 separates the Level A rule for some automatically moving or updating content from the Level AAA criterion about disabling interaction-triggered motion. Flashing has separate rules. [W3C — WCAG 2.2, Pause, Stop, Hide](https://www.w3.org/TR/WCAG22/#pause-stop-hide) · [W3C — WCAG 2.2, Animation from Interactions](https://www.w3.org/TR/WCAG22/#animation-from-interactions) · [W3C — WCAG 2.2, Three Flashes or Below Threshold](https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold)

Apple’s Liquid Glass distinguishes a layer for navigation and controls from the underlying content. Apple uses standard materials within the content layer and reserves the clearest glass treatment for controls over rich media where legibility is protected. Translate the hierarchy to the web with a solid surface, clear borders, or restrained elevation. If a translucent toolbar adds context, begin with an opaque surface and enhance it where `backdrop-filter` is supported. Measure contrast over the brightest and darkest expected backgrounds, check forced colors, and test scrolling performance on modest devices. For important controls, keep a solid option available even when the browser cannot detect a system transparency preference. Dense tables and forms benefit from stable backgrounds that make rows and text easier to scan. [Apple HIG — Materials](https://developer.apple.com/design/human-interface-guidelines/materials) · [Apple Developer — Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass) · [MDN — Reduced transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-transparency)

## 8. Navigation, controls, search, and data views

**Apple HIG.** Apple groups destinations in patterns such as sidebars and tab bars and gives commands recognizable controls and short labels. It recommends keeping a search entry point discoverable and placing it where people expect to search. Apply that distinction to a web app by deciding which controls take people somewhere, which change the current view, and which perform work.

| User intent | Web pattern | Interaction detail |
| --- | --- | --- |
| Open a destination or another record | Link with a real `href` in a named `<nav>` or in content | Preserve opening in a new tab, browser Back and Forward, and direct links. Mark the current destination with `aria-current="page"` where appropriate. |
| Switch between related panels in one view | In-page tabs if the panels form one widget | Implement the APG tablist, arrow-key navigation, selected state, and panel relationships. Use automatic activation only when panels display without noticeable delay. Separate routes can keep ordinary links styled like tabs. |
| Run a command | Native `<button>`, with `type="button"` for non-submit buttons in forms | Label the result, such as **Add asset** or **Export register**. Use a visible text label for consequential or unfamiliar commands. |
| Reveal supporting content or a short list of navigation links | `<details>` and `<summary>` for a straightforward disclosure, or a disclosure button with `aria-expanded` | Keep links and controls in normal keyboard order. Use visible headings or labels to identify what expands. |
| Open a group of contextual commands | Menu button for a genuine application-style action menu | Implement the menu keyboard and focus behavior, including arrow navigation, Escape, and focus returning to the button. A simple disclosure with ordinary buttons is an option when that behavior adds little value. |
| Pick from options | Radio buttons for one of a short set, checkboxes for multiple choices, or native `<select>` for a compact single choice | Use a switch only for an on/off setting. Give a toggle an accessible name that stays stable as its pressed state changes. For text entry with suggestions, implement the combobox pattern with its separate keyboard rules. |

- Keep the main task visible. In Invory, put **Add asset** in the register header and **Export** and other infrequent actions in the toolbar or overflow menu. Repeat a row action name with its context for assistive technology, such as **More actions for Projector 204**.
- Give search a visible label or an accessible name and an understandable scope. Show which filters are applied, make them easy to remove, and explain what matched. Use `<input type="search">` in a form with a search landmark. Offer an explicit search or update after a pause in typing, preserve input focus, and prevent an older response from replacing a newer query. An explicit **Clear filters** action makes zero-results states recoverable.
- Preserve shareable filters, sort order, and pagination in the URL where values are safe to share. When navigation changes the view in a client-rendered app, update the page title and put focus where the new content begins if the user would otherwise lose their place. An in-place sort or filter can keep focus on its triggering control and announce the result.
- Use a semantic HTML table for comparative data. Add a caption or clear associated heading, `<th scope="col">` and appropriate row headers, and a button inside sortable headers. Use `aria-sort` on the active sorted header for a single-column sort. Give selection checkboxes accessible names tied to their row. Put links in the key cells so opening a record works with a keyboard and standard browser actions.
- On narrow screens, prioritize the fields needed to recognize and compare records. A truly two-dimensional data table can scroll inside its own region with an apparent scrollbar or other cue. If rows become cards, retain each value's field label and provide access to the details. Use an ARIA grid only when spreadsheet-style interaction warrants its cell navigation and focus management.

[Apple HIG on buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) · [Menus](https://developer.apple.com/design/human-interface-guidelines/menus) · [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) · [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars) · [Searching](https://developer.apple.com/design/human-interface-guidelines/searching) · [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) · [W3C APG widget patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) · [W3C disclosure navigation example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/) · [W3C tables tutorial](https://www.w3.org/WAI/tutorials/tables/)

## 9. Forms, onboarding, and authentication

**Apple HIG.** Reduce how much people must enter, clarify the purpose of fields, and let people become productive quickly. Use reasonable defaults when the user can inspect and change them. Explain a new feature where people first need it.

**Web adaptation.**

1. Use the smallest form that completes the task. Group related fields with `<fieldset>` and `<legend>` where they provide meaningful context. In a longer flow, show progress and allow people to return to an earlier step without re-entering their work.
2. Provide persistent labels and put format hints and restrictions before the input. Use an explicit `for` and matching `id`, `aria-describedby` for related help, and `required` on required fields. Use placeholders for short examples when helpful.
3. Match the input to the data. Use `type="email"` for an email address and `inputmode="numeric"` on a text field for a digit-only identifier that can start with zero. Use `type="number"` when the field represents a numeric quantity and number controls make sense. Add appropriate `autocomplete` tokens for recognized personal details and authentication fields.
4. Let people finish entering a value before calling it invalid. On submit, preserve entered values and explain errors at their fields, mark invalid fields with `aria-invalid` when custom validation reports an error, and connect the error via `aria-describedby`. For several errors, provide a focusable summary with links to affected fields. Give a correction such as **Enter a purchase date on or before today**. Apply business rules and validation again on the server and use its response to show actionable feedback.
5. During submission, indicate progress and guard against duplicate requests. Keep a clear recovery path if submission fails. If the server accepted a change but the connection dropped before the response, resolve the outcome before silently submitting the same action again. For consequential steps, provide review or recovery as applicable.
6. Make sign-in compatible with password managers, browser AutoFill, and copy and paste. Use tokens such as `username`, `current-password`, `new-password`, or `one-time-code` for their respective fields. Where supported and appropriate, offer passkeys using WebAuthn and a tested recovery path. A **Show password** button can help people check input. For verification codes, prefer a single field that accepts a pasted code.
7. Explain what people can do before asking them to personalize anything. For a new empty register, present **Add your first asset** and an optional link to import guidance. Keep introductory tours short and dismissible when the task can proceed without them.

WCAG 2.2 addresses re-entry in the same process under 3.3.7 (A), with exceptions for essential re-entry, information security, or information that is no longer valid. It addresses accessible authentication under 3.3.8 (AA). When sign-in requires recall, transcription, or another cognitive test, check that each authentication step provides an allowed assistance mechanism, alternative, or other qualifying exception.

[Apple HIG on entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data) · [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding) · [Apple's Meet passkeys session](https://developer.apple.com/videos/play/wwdc2022/10092/) · [WHATWG HTML autofill](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill) · [W3C forms tutorial](https://www.w3.org/WAI/tutorials/forms/) · [WCAG 2.2 input assistance](https://www.w3.org/TR/WCAG22/#input-assistance) · [W3C accessible authentication guidance](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html)

## 10. Feedback, loading, and recovery

**Apple HIG.** Match how noticeable the feedback is to how important it is. Make it clear whether an action worked, is still running, or needs attention. Show measured progress when the app can estimate it reliably and use an indeterminate indicator otherwise.

| State | Interface response | Example |
| --- | --- | --- |
| First load | Render the available shell and structure promptly. Reserve space for content and show a quiet labeled indicator if waiting is noticeable. | **Loading register…** above a placeholder table body. |
| Background refresh | Retain usable content when it is safe to display. Show refresh activity where it matters. | **Updating register…** next to a visible last-updated value. |
| Long operation | Show known progress, or give the operation a short label if the amount of remaining work is unknown. Offer cancellation when the operation can actually be stopped. | **Checking 42 of 150 assets**. Report the completed import separately. |
| Empty | Explain why there is no content and show a relevant next action. Distinguish first use, zero matches, and no access. | **No assets match these filters.** Offer **Clear filters**. |
| Success | Confirm at the point of action. Persist an important result in the relevant record or history. Offer undo when the change is reversible and a recovery action can be provided. | **Asset moved to Room 204.** The new location also appears in the register. |
| Error | Explain the problem in terms the user can act on. Retain their work and provide a realistic next step. | **We couldn’t upload the file. Your entries are still here. Try again.** |
| Offline or stale | Say whether the person is seeing older data, has unsaved changes, or has a confirmed save. | **Offline. Showing the register from 09:42.** If edits are queued, show their pending status. |
| Access change or conflict | Explain the visible impact and provide a safe path to refresh, reconcile, or request access. | **This asset changed while you were editing it. Review the current record before saving.** |

- Keep routine feedback near its source. Inline messages work for field and task feedback, a persistent banner can explain a page-wide issue, and a brief toast can acknowledge an action. Give important messages a persistent place and allow time to use any action such as **Undo**.
- For changes that should be announced without moving focus, keep a `role="status"` region in the document before updating its text. Use `role="alert"` sparingly for urgent updates. Avoid announcing every percentage or keystroke. Use a labeled `<progress>` for work with a measurable value and omit `value` when progress is indeterminate. Test what the browser and screen reader actually announce.
- Make optimistic updates reversible. If the UI shows a change before the server confirms it, indicate its pending state and restore or reconcile the view if the change fails. Show a retry that matches the operation's behavior and preserve whatever the user would otherwise have to re-enter.

[Apple HIG on feedback](https://developer.apple.com/design/human-interface-guidelines/feedback) · [Loading](https://developer.apple.com/design/human-interface-guidelines/loading) · [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators) · [W3C understanding status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) · [WHATWG HTML progress element](https://html.spec.whatwg.org/multipage/form-elements.html#the-progress-element)

## 11. Dialogs, sheets, and destructive actions

**Apple HIG.** Reserve interruption for decisions or information important enough to block the current task. Native sheets, popovers, and alerts vary by platform and purpose. On the web, select the behavior first and use placement and styling to communicate it.

- Use a new page for a longer task with navigation or several decisions, a disclosure or nonmodal popover for related information, and a modal dialog for a brief task that genuinely needs exclusive attention. An overlay that looks like a mobile sheet still needs a defined focus, dismissal, and background interaction model.
- Prefer a native `<dialog>` opened with `showModal()` when suitable. Give it a visible title and connect that title to its accessible name. Provide a visible close or cancel control. Escape should dismiss an ordinary dialog. Keep keyboard focus within the modal while it is open and return focus to its trigger, or to a sensible next element if the trigger disappeared.
- Choose initial focus based on the task. For a short irreversible confirmation, focus the safe choice. In a long dialog with structured text, focusing a heading with `tabindex="-1"` can help users start reading from the beginning. Use `aria-describedby` for a short explanation when it improves the announcement. Test that long content, zoom, and the on-screen keyboard keep controls reachable.
- Prefer making common actions reversible. Confirm consequential permanent actions with the item name, the consequence, and a specific verb. Keep **Cancel** explicit and use a semantic destructive treatment supported by wording, shape, and focus behavior. Never let tapping outside a modal trigger a destructive action.
- For actions covered by WCAG 2.2 criterion 3.3.4 (AA), such as deleting user-controllable stored data, provide at least one applicable safeguard such as reversal, checking input with a chance to fix errors, or review and confirmation. Design dismissal and pending outcomes explicitly. Cancelling a confirmation closes it before submitting the action. Closing an already-submitted progress dialog needs a truthful explanation if the operation continues.

This standalone example captures a choice. The product's separate action handler can inspect `dialog.returnValue` and perform the change only after **Delete register** was chosen.

```html
<button type="button" id="open-delete">Delete register</button>

<dialog id="delete-register" aria-labelledby="delete-title"
        aria-describedby="delete-consequence">
  <h2 id="delete-title">Delete “Room 204”?</h2>
  <p id="delete-consequence">This permanently removes the register and its records.</p>
  <form method="dialog">
    <button type="submit" value="cancel" autofocus>Cancel</button>
    <button type="submit" value="delete">Delete register</button>
  </form>
</dialog>

<script>
  const trigger = document.getElementById("open-delete");
  const dialog = document.getElementById("delete-register");

  trigger.addEventListener("click", () => {
    dialog.returnValue = "cancel";
    dialog.showModal();
  });

  dialog.addEventListener("close", () => {
    trigger.focus();
  });
</script>
```

[Apple HIG on modality](https://developer.apple.com/design/human-interface-guidelines/modality) · [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts) · [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) · [W3C APG modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · [WHATWG dialog element](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element) · [WCAG 2.2 error prevention](https://www.w3.org/TR/WCAG22/#error-prevention-legal-financial-data)

## 12. Input, focus, and accessibility

**Apple HIG.** Support the input methods people use and respect accessibility settings. On the web, this means building equivalent paths for touch, mouse, keyboard, screen readers, and other assistive input. A person may switch between them on the same device.

- Start with document structure. Give pages meaningful titles, one clear main region, headings that describe content, a skip link when needed, descriptive links, and an accurate page language. Use native controls and meaningful names. Give informative images purpose-specific text alternatives and decorative images an empty alternative or exclude them from the accessibility tree when appropriate.
- Keep the DOM, reading, and keyboard order meaningful. Use Tab between controls, and arrow keys inside composite widgets when the relevant APG pattern specifies them. Retain a clear `:focus-visible` style. Check sticky headers, banners, drawers, and mobile keyboards for focus that scrolls behind a layer. Avoid positive `tabindex` values.
- Make commands available without hover, swipe, drag, long press, right-click, or a shortcut. Use a visible row menu to complement a swipe action, or **Move up** and **Move down** controls alongside drag reordering. Keep browser gestures and zoom available. Activate ordinary commands on click or release so users can cancel a mistaken press before it takes effect.
- Offer shortcuts as a secondary route. Preserve platform and assistive technology commands, avoid taking over typing in fields, and support disabling or remapping global single-character shortcuts, or make them active only when the relevant component has focus, per the WCAG criterion.
- Support text enlargement, reflow, and user preferences. Test text spacing overrides, reduced motion, light and dark appearance, and forced colors where supported. Give status a text label or recognizable shape as well as color. Provide accessible media controls and captions for prerecorded synchronized media where applicable.
- For hover or focus content such as tooltips, keep essential instructions visible elsewhere or make the popup dismissible, hoverable, and persistent as WCAG 1.4.13 specifies, subject to its conditions. Test using touch and keyboard as well as a precise pointer.

### WCAG 2.2 checks for typical web app interfaces

| Check | Criterion and level | What to verify |
| --- | --- | --- |
| Text contrast | 1.4.3 AA | At least 4.5:1 for typical text and 3:1 for large text, 18 pt regular or 14 pt bold, approximately 24 or 18.67 CSS px respectively. Check the standard's exceptions, such as logotypes and inactive controls. |
| Controls and meaningful graphics | 1.4.11 AA | At least 3:1 against adjacent colors for visual information needed to identify UI components and states and for required graphical parts, with the specified exceptions. |
| Text resize and reflow | 1.4.4 AA, 1.4.10 AA | Support 200% text enlargement with no loss of content or function, excluding captions and images of text for 1.4.4. Check reflow at a width equivalent to 320 CSS px for vertically scrolling content and height equivalent to 256 CSS px for horizontally scrolling content. Parts that genuinely need a two-dimensional layout have a reflow exception. |
| Keyboard focus | 2.1.1 A, 2.1.2 A, 2.4.7 AA, 2.4.11 AA | Operate the interface with a keyboard, subject to the path-dependent input exception. Provide a way out of keyboard focus areas, a visible focus indicator, and ensure author-created content never entirely hides the focused component. Aim for the whole target to remain visible. |
| Pointer gestures and dragging | 2.5.1 A, 2.5.7 AA | Provide a single-pointer option without a path-based or multipoint gesture, and a single-pointer option without dragging, when the respective criterion applies. See the essential behavior and user-agent exceptions. Include the pointer alternative alongside the keyboard route. |
| Pointer targets | 2.5.8 AA, 2.5.5 AAA | AA uses at least 24 × 24 CSS px or an applicable exception such as sufficient spacing. AAA enhanced uses at least 44 × 44 CSS px with its own exceptions. Apple also recommends 44 × 44 **points** for finger targets in its native UI design tips. A 44 × 44 **CSS px** touch target is a practical web design choice. |
| Names and status | 2.5.3 A, 4.1.2 A, 4.1.3 AA | Include the visible text in the accessible name when a label is present. Expose control name, role, and state. Make qualifying status messages available to assistive technology without moving focus. |

Check the complete applicable WCAG criteria for an assessment. A passing component helps only if the complete workflow, including its dialogs, errors, and authentication, is usable.

[Apple HIG on accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) · [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures) · [Apple UI design tips](https://developer.apple.com/design/tips/) · [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) · [W3C APG keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)

## 13. Privacy, permission, and trust

**Apple HIG.** Ask for data or device access at the point where its purpose is clear. Explain what it enables, limit what you collect, and preserve user control. The browser or operating system owns the actual permission prompt.

- Use a clear intent action such as **Scan barcode** or **Enable approval notifications**, then request the matching permission when the feature requires it. Keep the explanation specific and truthful. For APIs that require user activation, initiate the browser request from the intended user action in the way that API requires.
- Design the denied, dismissed, unavailable, and later revoked states. When Invory cannot use the camera, keep **Enter inventory number** available. When location permission fails, provide manual entry. Explain how to change a browser setting when the user deliberately tries again and the browser will no longer prompt.
- Separate optional permissions and data collection. Keep organizational records, access tokens, and personal details out of shareable URLs, analytics payloads, public error messages, and lock-screen notifications unless a deliberate, appropriate policy and feature require disclosure. For example, **A request needs review** can lead to the signed-in app without exposing the record in a push message.
- Show role restrictions honestly and enforce them on the server for every protected read and write. In Invory, an invited guest can use search while an authorized participant may create an inventory report. A changed role or expired session should produce a safe recovery path, including preserving permitted draft work where possible.
- Treat web storage and permission state as fallible. Test blocked third-party cookies or storage, session expiration, private browsing, and user-cleared site data. Tell users what is saved on the server versus what exists only as an unsynced draft. Keep cached data scoped to the account and remove sensitive caches at sign-out where applicable.

[Apple HIG on privacy](https://developer.apple.com/design/human-interface-guidelines/privacy/) · [WebKit Tracking Prevention Policy](https://webkit.org/tracking-prevention-policy/) · [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/) · [OWASP authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)

## 14. Web implementation and Safari testing

Build the critical workflow with widely supported HTML and CSS first. Layer on capabilities such as suggestions, dialogs, offline use, and notifications as the product needs them. Use feature detection and verify behavior on supported devices. Preserve native input behavior and readable layout if an enhancement is unavailable.

- Define semantic design tokens such as `--text`, `--surface`, `--accent`, `--focus`, and `--danger`. Map them to tested light and dark values. Keep focused, disabled, pending, error, and selected states in the same component definitions as defaults. Enable `color-scheme` for the appearance modes the product actually supports so browser controls fit the page.
- Prefer flexible sizing with Grid or Flexbox and logical properties such as `padding-inline`. Use relative text sizes, allow controls and labels to wrap, and keep a fallback for optional CSS features. Allow the page to zoom. Test how full-width layouts adapt as the browser chrome and software keyboard change the available height.
- If the layout opts into edge-to-edge rendering, keep fixed controls and hit targets inside applicable safe-area insets. Use the baseline design spacing as well as the device inset. Apply `scroll-padding` to the actual scrolling region when fixed or sticky controls cover it.
- Use visible interaction styles on all input devices. This example uses a 44 CSS px design target for labeled actions. It keeps a ring outside the control and provides a system color for forced colors mode. Supply an appropriate `--focus` color for each tested surface.

```css
.action {
  min-block-size: 44px;
  min-inline-size: 44px;
  min-block-size: max(44px, 2.75rem);
  padding-inline: 1rem;
}

:where(a, button, input, select, textarea, summary):focus-visible {
  outline: 2px solid var(--focus, #005fcc);
  outline-offset: 3px;
}

@media (forced-colors: active) {
  :where(a, button, input, select, textarea, summary):focus-visible {
    outline-color: Highlight;
  }
}
```

### Installed web apps and browser capabilities

- Support the browser-tab experience on its own. If installed mode offers value, provide a manifest with a useful name, icons, `start_url`, scope, and display mode. Verify the installation entry points, deep links, handling of external links, and navigation in standalone mode. Test Safari tabs and installed apps separately. macOS uses **Add to Dock** and iOS and iPadOS provide a Home Screen installation path.
- Plan offline support separately. If adding a service worker, define exactly which pages and records can load offline, how stale data is labeled, how updates activate, and what happens when storage is evicted or the user signs out. Test cold start, update from an older app version, loss of network during a save, and reconnection.
- If using Web Push, detect capabilities and request it in context. On supported iOS and iPadOS versions, Home Screen web apps can request push permission in response to direct user interaction. Keep an in-app record of important notifications so the workflow can proceed when permission is declined or unavailable. Verify the targeted Safari/WebKit versions when choosing between classic and declarative push.

### Test matrix before release

| Environment | What to check |
| --- | --- |
| Safari on macOS with keyboard and VoiceOver | Logical Tab order, visible focus, landmarks and heading navigation, table headers, dialogs, and status announcements. |
| Safari on a physical iPhone with touch and VoiceOver | Target spacing, portrait and landscape, safe areas, software keyboard, zoom, form AutoFill, taps, and swipe alternatives. |
| Safari on iPad with keyboard and pointer | Sidebar and main view at several widths, modal focus, touch and trackpad switching, and controls that rely on hover. |
| Chromium and Firefox on target desktop platforms, plus target Android browsers | Semantics and core interactions, layout fallback, browser navigation, forms, file input, and password managers. Add Windows forced colors and a screen reader such as NVDA when relevant. |
| Installed web app when supported | Install and relaunch, links within and outside the app, session continuity, offline and updates, and notification permission handling. |
| Stress and recovery | 200% text resize and reflow checks, long translations and right-to-left layout if supported, slow and failed requests, rapid filter changes, duplicate submission, and role changes. |

Start responsive layout work in Safari's Responsive Design Mode. Confirm viewport and input behavior on real devices. Use the Mac's Web Inspector and an iOS or iPadOS device with Web Inspector enabled to debug real layout, network, and storage behavior. Track supported browser versions and check Safari release notes when relying on a newer feature. Combine automated regression and accessibility checks with manual keyboard and assistive technology walkthroughs of complete tasks.

[Apple Safari Responsive Design Mode](https://developer.apple.com/documentation/safari-developer-tools/responsive-design-mode) · [Inspecting iOS and iPadOS](https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios) · [Safari release notes](https://developer.apple.com/documentation/safari-release-notes) · [Apple Support on Safari web apps on Mac](https://support.apple.com/en-nz/104996) · [WebKit safe-area guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) · [WebKit push for Home Screen web apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) · [WebKit declarative push](https://webkit.org/blog/16535/) · [W3C Web Application Manifest](https://www.w3.org/TR/appmanifest/) · [W3C technique for scroll padding](https://www.w3.org/WAI/WCAG22/Techniques/css/C43)

## 15. Collaboration and supporting workflows

Apple's patterns also cover the work that happens around a product's main screens. Adapt these when they help a real browser workflow.

| Pattern | Web practice | Apple HIG |
| --- | --- | --- |
| Help | Put brief help beside an unfamiliar step and provide a place to revisit it. For a file import, link to a sample CSV and explain which columns are required before people choose a file. | [Offering help](https://developer.apple.com/design/human-interface-guidelines/offering-help) |
| Settings | Keep general preferences in a predictable place. Put controls that apply only to the current task near that task. If you offer a theme override, include a system setting alongside light and dark choices. | [Settings](https://developer.apple.com/design/human-interface-guidelines/settings) |
| Collaboration and sharing | Show the item being shared, the intended audience, and the access each role grants. Give the owner a place to review and revoke access. Distinguish sending an invitation from copying a URL. The server applies the role on every request. | [Collaboration and sharing](https://developer.apple.com/design/human-interface-guidelines/collaboration-and-sharing) |
| Notifications | Send useful, timely updates and avoid multiple messages about the same event. Keep sensitive details out of previews that may appear on a locked device. Use in-app feedback for errors that arise in the current workflow. | [Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications) |
| Charts | Put the main finding in a short summary and label the axes and units. Make series distinguishable through labels or patterns as well as color. Provide equivalent data in text or a table when people need to inspect exact values. | [Charts](https://developer.apple.com/design/human-interface-guidelines/charts) |
| Printing | Show the scope of the report, including active filters and the relevant dates. Provide a print layout that keeps the report legible after application controls are hidden. | [Printing](https://developer.apple.com/design/human-interface-guidelines/printing) |

## 16. Design review for an inventory register

Start with one task users need to complete. For example, ask a register participant to find a projector by inventory number, verify its location, and report a discrepancy. Observe what they can complete and recover from without coaching.

| Check | Evidence to look for |
| --- | --- |
| Purpose and hierarchy | The register title and search field make it clear where to start. Scanning the result shows which projector it is and where it should be. |
| Navigation and permissions | The current register is clear in both compact and wide layouts. Links support Back and direct entry. The action to report a discrepancy appears where eligible participants can find it, with authorization enforced by the server. |
| Action and recovery | The form explains which location was expected and what information to submit. Errors leave the entered information available. Success confirms that the report was sent and shows where to track it. |
| Interaction and accessibility | The search, asset details, and report work with a keyboard, touch, and VoiceOver. Focus stays visible, headings describe the current view, and feedback is available without relying on color. |
| Appearance and layout | Light and dark appearances preserve contrast. Zoom, long Bulgarian labels, and a narrow display keep the important controls and content reachable. Motion settings leave state changes understandable. |
| Platform and degraded states | Test in Safari on iPhone and macOS as well as representative browsers outside Apple's platforms. Include a slow connection, a failed save, an expired session, and a device without optional features. |

Record whether people complete the task, where they hesitate, which errors they can fix on their own, and which device or input method exposed each issue. Fix obstacles that block the task, then repeat it with the same starting conditions.
