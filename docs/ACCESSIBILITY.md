# Accessibility requirements

Domino UI aims to support readable, keyboard-operable interfaces across Hybrid, Light, and Dark themes. This document is an implementation and review contract. It does not assert that the library or any consuming application conforms to an accessibility standard.

The baseline target is [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/). Native HTML behavior is preferred because it gives controls established semantics and input support. The notebook's visual details must preserve those behaviors.

## Structure and names

- Provide a main landmark, a descriptive page title, a working skip link, and a logical heading hierarchy in the documentation website.
- Navigation belongs in a labeled navigation landmark. Mark the current destination with `aria-current`; the mint location dot is a supplementary visual cue.
- Use buttons for actions and anchors with real destinations for navigation. A decorated card must not nest buttons inside an anchor or create several competing actions across one hit area.
- Every icon button needs a descriptive accessible name. Name replay controls by what they replay. Do not rely on an SVG title or tooltip as the only button label.
- Associate every form input with a real label. Placeholders are examples, not labels. Connect help and error text through stable identifiers; invalid state must be programmatically available.
- An illustrated banner retains a real heading or text label. Decorative SVGs, arrows, fold shapes, and duplicate animated letter spans stay out of the accessibility tree.

## Keyboard and focus

All interactive components must work with a keyboard. Preserve native Enter/Space button activation, Space for checkboxes, and arrow keys within actual radio groups. Focus order follows the visible reading order. Do not give decorative marks a tab stop.

The visual focus language is a subdued ink or region-appropriate accent outline, normally **2px dashed with 4px offset**, derived from the portfolio. It must remain visible on light paper, charcoal navigation, selected states, and colored notes. Never remove an outline without providing an equally visible replacement. Ensure overflow clipping, a banner shape, or a sticky header does not hide the focus indicator.

For a modal dialog, move focus inside on opening, contain it while modal, provide an accessible close control, close on Escape, and restore focus to the invoking control when possible. Native dialog is suitable when its behavior is used correctly. For an ordinary disclosure, keep the user in the document flow and expose its expanded state; do not add a dialog focus trap.

Tabs need associated tab panels, a selected state, and documented arrow-key behavior. A plain row of navigation links should keep link semantics. A menu should use menu roles only if it implements the corresponding interaction model.

## Readability, contrast, and reflow

The [WCAG contrast requirements](https://www.w3.org/TR/WCAG22/#contrast-minimum) call for at least 4.5:1 for normal text and 3:1 for large text, with stated exceptions. [Non-text contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast) addresses essential control and graphic details at 3:1. Assess the final foreground/background pair, including transparency, state, texture, and nested Hybrid surface.

Color is supplemented with wording and shape. Error text says what failed; a status has a readable label; a journal mark has its meaning available. Pastel paper colors, sage/mint decoration, and disabled opacity are not status explanations.

Lexend carries body copy and essential instructions. Caveat is reserved for short annotations and captions; Kalam is reserved for deliberate lettered headings. Essential copy must remain readable when font loading fails. Allow text resizing, user text-spacing overrides, and natural wrapping without fixed-height clipping.

The [reflow requirement](https://www.w3.org/TR/WCAG22/#reflow) generally expects content to fit a 320 CSS pixel width without two-dimensional scrolling, with exceptions for content that requires it. Keep code and data-table scrolling inside their own labeled region. At zoom, reduce columns before shrinking labels. Paper folds and rotated art must not widen the page.

The library's comfortable target is **44×44 CSS pixels** for primary controls, matching the source toolbar. The [WCAG 2.2 AA minimum target criterion](https://www.w3.org/TR/WCAG22/#target-size-minimum) is 24×24 CSS pixels or qualifying spacing, with exceptions; 44px here is a stronger design choice. Preserve spacing between adjacent compact targets.

## Motion and drawing

- Respect `prefers-reduced-motion` and the showcase's quiet-motion setting independently of theme.
- Reduced or quiet motion shows finished letters, banners, checks, plants, cranes, and petals immediately. Do not leave an initial opacity, clip, or dash state hiding the drawing.
- Keep meaningful text available while decorative glyph spans animate. Ordinary paragraphs, links, form feedback, and search results remain immediately readable.
- Use a real button for replay. Enter/Space and pointer activation produce the same outcome. Repeated activation must not queue competing sequences.
- Stop ambient movement and long automatic sequences in quiet mode. Avoid flashing, unnecessary looping, and motion that is required to understand a state.
- An in-progress action communicates its status with text or accessible state; decorative animation is supplementary.

Printing must retain the text and completed illustrations needed to understand the content. Collapsed editorial annotation bodies should be available in print. Hide purely interactive decoration when it has no print meaning.

## Component behavior

| Pattern                | Required behavior                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Theme control          | Clearly named Hybrid/Light/Dark choices; selected state exposed; no reset of focused controls when changing theme |
| Motion control         | Name expresses its action/state; reduced-motion preference remains respected                                      |
| Text input/select      | Native input behavior, associated label, visible focus, disabled/required/invalid state, connected help           |
| Checkbox/radio         | Native checked semantics and keyboard handling; drawn mark cannot be the only state representation                |
| Switch                 | Accessible name and checked state; keyboard operation; label describes the setting                                |
| Accordion/disclosure   | Toggle associated with content; expanded state; collapsed content removed from focus order                        |
| Tabs                   | Linked tabs/panels, selected state, predictable keyboard navigation and focus management                          |
| Dialog                 | Accessible title, appropriate modality, opening/closing focus behavior, close control, Escape                     |
| Tooltip                | Available through focus as well as hover; dismissible when it obscures content; supplementary content only        |
| Toast/status           | Appropriate polite announcement; avoid repeated announcements or moving focus for ordinary updates                |
| Progress               | Name and current value or understandable indeterminate state; text equivalent when useful                         |
| Table                  | Table semantics, meaningful headers, caption/context, contained overflow when necessary                           |
| Code block             | Selectable text, keyboard-reachable overflow if needed, named copy action and reported result                     |
| Breadcrumbs/pagination | Real links, labeled navigation, current item/page available programmatically                                      |
| Graph                  | Readable explanation or alternate relationships; node color and animated position cannot be the only information  |
| Brand/illustration     | Decorative by default when adjacent text supplies meaning; meaningful standalone art needs a text alternative     |

These expectations describe intended native behavior, not an API guarantee. Review the actual implementation and its examples for supported interactions.

## Verification checklist

Use the following checks before describing a release as accessible. Record actual results separately; an unchecked requirement is not a passed test.

1. Operate every example using Tab, Shift+Tab, Enter, Space, Escape, and applicable arrow keys. Inspect focus visibility, focus return, and collapsed content.
2. Review accessible names, roles, states, headings, landmarks, errors, and announcements with a screen reader and browser accessibility tree.
3. Inspect every component in all three themes, including overlays, invalid/disabled/selected states, and mixed Hybrid regions.
4. Check actual contrast pairs rather than judging swatches in isolation. Treat decorative colors and semantic colors differently.
5. Enlarge text to 200%, check 320px reflow/400% zoom behavior, and apply text-spacing overrides. Try long labels, wrapped errors, and unbroken strings.
6. Inspect reduced motion, quiet mode, interruption/replay, font loading failure, and print. Essential text and controls must remain usable.
7. Check high-contrast/forced-color mode. Native controls and explicit borders should remain recognizable without texture, fill, shadows, or animation.
8. Test touch targets and narrow layouts in the destination browser. Verify that fixed or sticky content never covers focused elements or final actions.

Automated tests can catch regressions in structure and behavior. Manual keyboard, assistive-technology, contrast, zoom, and visual reviews remain necessary, especially for custom paper shapes and drawing effects.
