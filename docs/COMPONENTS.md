# Component scope and review inventory

This inventory defines the scope of Domino UI and the states its visual website should make inspectable. It is not a list of verified release guarantees. The actual exports and TypeScript declarations are the API authority; do not infer prop names from the pattern names below.

## Source map

| Location                        | Responsibility                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `src/lib/index.ts`              | Public React exports                                                                 |
| `src/lib/components.tsx`        | Reusable controls, content, feedback, and navigation patterns                        |
| `src/lib/theme.tsx`             | Theme context, persisted preference state, and theme controls                        |
| `src/lib/brand.tsx`             | Exact name/brand drawings and reusable illustration patterns                         |
| `src/lib/journal-art.tsx`       | Original three-face ribbon and notched/pointed bookmark drawings                    |
| `src/lib/patterns.tsx`          | Annotations, timeline, and flower progress; compatibility re-export for PolaroidStack                           |
| `src/lib/popover.tsx`           | Anchored nonmodal dialog, native top layer, viewport positioning, focus/dismissal    |
| `src/lib/notification-card.tsx` | Single-sheet notification surface with accessible queue badge         |
| `src/styles/tokens.css`         | Shared semantic themes, type roles, spacing, radii, and durations                    |
| `src/styles/fonts.css`          | Self-hosted font definitions                                                         |
| `public/fonts/`                 | Font files and their individual license notices                                      |
| `src/App.tsx`                   | Visual documentation website composition                                             |
| `src/catalog/`                  | Live component catalog, examples, and reference content                              |
| `DESIGN.md`                     | Visual principles, source provenance, exact reference values, and library extensions |
| `docs/ACCESSIBILITY.md`         | Interaction and accessibility requirements                                           |

The package root is `@domlee/ui`. Its shared CSS and fonts are separate assets; applications must serve the `/fonts/` paths used by the bundled font stylesheet. Consult `package.json` and the generated API reference for the implemented import surface.

Each component implementation imports the CSS required to render it; `components.tsx` also imports its switch motion. Do not put required component CSS only in the `index.ts` re-export barrel: production tree-shaking can discard the barrel’s side effects while preserving its named component exports. Verify both development and built-site previews with `npm test` and `npm run test:production`.

The implemented public catalogue has **56 components**. The inventory below also records source patterns and composition goals; a table entry does not imply an additional exported component. For example, reading mode, a table of contents, quote composition, and graph panels remain source-pattern references. They are not documented as public React exports.

`NotebookSketch` adds six original notebook scenes; `HairlineSketch` adapts three upstream Hairline figures to semantic paper and ink. Both have a dedicated catalog page and appear together in The sketchbook, with quiet/reduced motion, touch behavior, and attribution. `TripleBanner` and `BookmarkDrawing` add two more public journal-art components with their own catalog entries: naturally wrapping three-face ribbons and notched/pointed bookmarks. [Sketch APIs and native SVG companions](SKETCHES.md).

## Every component's visual page

A component page should answer what it does, when to use it, and how it behaves. Include a working React example using the actual export, a copyable code example, useful variants, relevant interactive states, and a concise accessibility note. Show the component on a surface that exposes its outline and text clearly.

All pages participate in the global **Hybrid / Light / Dark** control, with Hybrid default. Theme changes must update examples, labels, code panes, menus, and portals coherently. A component's dimensions should remain stable when its theme changes. Show long content and narrow layout behavior where they matter.

For generic controls, examples need resting, hover/focus, pressed/selected, disabled, and invalid/error states where applicable. For drawings, include a completed static state, replay, and reduced/quiet motion. Show meaningful combinations rather than multiplying variants that provide no distinct use.

## Foundations

| Pattern                      | Inventory expectations                                                                 | Source relationship                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Semantic color tokens        | Theme roles, surface pairs, contrast-aware text placement, illustrative paper swatches | Base palette extracted; additional surfaces/status tokens documented as extensions |
| Typography                   | Five families, hierarchy, paragraph, label, metadata, code, caption, font fallback     | Poppins, Lexend, IBM Plex Mono, Kalam, Caveat                                      |
| Grid and spacing             | Continuous 32px dots, rhythm examples, compact spacing scale, quiet reading wash       | Portfolio and current garden                                                       |
| Shape and elevation          | Irregular corners, folded paper, restrained ink shadows, layered artifact shadow       | Source paper motifs with shared library metrics                                    |
| Icon and mark language       | Shared sketch arrow, journal marks, semantic symbols, decorative SVG behavior          | Exact five-mark journal key and source drawing style                               |
| Theme and motion preferences | Hybrid default, explicit persistent theme, quiet/reduced motion, storage fallback      | Garden theme behavior and portfolio quiet motion                                   |

## Inputs and actions

`TaskCheckbox` adapts the garden’s native task control, curved check path, and line-by-line strike into a labeled React input. Its check draws in 220ms and task copy crosses in 280ms, using shared motion tokens. Descriptions remain outside the strike and nested tasks belong outside the parent label. It supports controlled/uncontrolled native state, input attributes, and a forwarded ref. Reduced motion, print, and forced colors retain the completed state. The dedicated example supports checking, clearing, and wrapped labels.

`Switch` keeps its native input and dimensions, with a 360ms reversible spring settle and 80ms press deformation. Disabled inputs do not deform, and reduced motion changes checked state without movement. Safari’s real native `InkSwitch` keeps its browser-managed appearance and feedback path.

| Pattern          | States/examples to expose                                                                    | Native behavior expectations                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Button           | Primary, secondary/outline, quiet, destructive if supported; small/regular; loading/disabled | Real button, correct type, accessible name, visible focus                     |
| Icon button      | Named icon, tooltip if useful, disabled, pressed/toggle if supported                         | Minimum comfortable hit area; icon is not the name                            |
| Text field       | Empty, filled, placeholder, help, required, disabled, error                                  | Label association, native editing, connected description/error                |
| Text area        | Multiline, resize, long text, disabled/error                                                 | Natural text flow; no fixed-height content clipping                           |
| Select           | Default/selected, grouped if supported, disabled/error                                       | Native select behavior unless a complete custom pattern is implemented        |
| Checkbox         | Unchecked, checked, disabled, labeled; indeterminate only if implemented                     | Native input and keyboard; hand-drawn tick is visual                          |
| Radio group      | Multiple options, selected, disabled option, long labels                                     | Shared name and native arrow-key selection                                    |
| Switch           | Off/on, disabled, visible setting label                                                      | Named binary state and keyboard operation                                     |
| Slider/range     | Label, current value, min/max, disabled                                                      | Keyboard adjustment and accessible value                                      |
| Search           | Query, results, empty result, clearing, optional preview                                     | Label, predictable focus, readable results; mixed Hybrid scope where used     |
| Form composition | Multiple fields, help and error summary, submit feedback                                     | Coherent validation and input semantics; demonstration submission stays local |

These are library scope categories. A complex custom combobox, date picker, file uploader, rich-text editor, or drag-and-drop system should be added only with an explicit implementation and complete behavior documentation. Styling a text field is not evidence those patterns exist.

## Content and paper

| Pattern        | States/examples to expose                                                            | Design guidance                                                                   |
| -------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Paper/card     | Plain, sage, peach, blue/lavender where supported; titled and untitled; long content | Real silhouette for folds; content grows naturally                                |
| Sticky note    | Single and layered, compact/long copy, optional fold                                 | Local tilt only; preserve readable body text                                      |
| Notched banner | Short/long label, static and drawn, narrow layout                                    | Exact source strip geometry; Kalam label                                          |
| Folded banner  | Tails/folds/front face, multiple paper roles, static/drawn                           | Preserve layered geometry and restrained shadow                                   |
| TripleBanner   | Exactly three labels, four tones, narrow/long copy, static/drawn/replay             | Original connected ribbon geometry; real text grows each face naturally            |
| BookmarkDrawing | Notched/pointed, decorative/named, static/drawn/replay                               | Fine original pen paths, faint echo, semantic seam, shared DrawingProps             |
| Annotation     | Title-only/body, four arrow directions, start/end alignment, static/drawn            | Caveat short title, Lexend body, inline decorative arrow                          |
| Callout/alert  | Informational, success/warning/error where supported, optional title                 | Meaning through text and icon; palette alone is insufficient                      |
| Quote          | Quote and attribution, short/long copy, Hybrid blue paper                            | Selectable text and correct quotation semantics                                   |
| Badge/tag      | Neutral/accent/status, long label, removable only if implemented                     | Tags and status are different meanings; removal is a named button                 |
| Divider/leader | Horizontal rule, dotted leader, label/folio                                          | Decorative separators do not replace headings                                     |
| Code block     | Long line, multi-line, filename/language, copy feedback                              | Selectable code, contained overflow, actual copy action                           |
| Data table     | Header, caption, multiple columns, narrow overflow, empty state                      | Preserve table semantics and readable relationships                               |
| Avatar         | Image, initials/fallback, accessible context                                         | Useful alternative when image fails; decorative duplicates hidden                 |
| Empty state    | Title, explanatory copy, relevant action                                             | Describe the state without inventing a failing backend                            |
| Skeleton       | Text/card shapes if supported, reduced motion                                        | Hide decorative shapes from assistive technology; announce actual loading context |

## Navigation and disclosure

`MenuToggle` in `src/lib/menu-toggle.tsx` is a controlled native button with an `open` boolean, dynamic `openLabel`/`closeLabel`, `aria-expanded`, forwarded native attributes/ref, and a 44px minimum target. Pass `aria-controls` for the associated panel. Its three SVG strokes stay mounted and morph through transforms/opacity using `--dm-menu-duration` and `--dm-menu-easing`; reduced motion disables transitions. The button does not impose a focus trap on ordinary disclosures.

The website's mobile navigation composes this control with a modal drawer below 700px. The persistent backdrop and panel transition together, including interrupted close/open movement. One button stays focused across both states; the closed sidebar is inert and hidden from assistive technology. Escape, outside taps, and route selection dismiss it. Search temporarily owns modal keyboard handling, and desktop resizing removes scroll lock and modality. This shell behavior is separate from the generic `Drawer` export.

| Pattern           | States/examples to expose                                       | Native behavior expectations                                                     |
| ----------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Text/sketch link  | Internal, external, focus/hover, visited if supported           | Real destination; shared drawn arrow is decorative                               |
| Breadcrumb        | Nested location, long segment, current page                     | Labeled navigation and clear current item                                        |
| Tabs              | Selected/disabled, keyboard focus, varying panel height         | Linked tabs/panels and documented arrow navigation                               |
| Accordion         | Closed/open, multiple items, long content                       | Expanded state, associated panel, native disclosure if used                      |
| Menu/dropdown     | Open/closed, disabled action if supported, Escape/outside close | Appropriate role and complete keyboard model; focus return                       |
| Pagination        | Current, previous/next, boundary state, narrow layout           | Named navigation, real destinations or clear local state                         |
| Sidebar/tree      | Current item, nested group, collapsed group, search, mobile     | Semantic links/disclosures; no decoration-induced focus stops                    |
| Table of contents | Active section, collapsed mobile, long heading                  | Working anchors, scroll offsets, active reading location                         |
| Reading mode      | Enter/exit, narrow/wide, all themes                             | Reachable exit; article stays readable and navigation changes are understandable |

Do not use menu roles for every collection of links. The showcase mobile navigation can expand in the document flow; a modal drawer requires its own focus and dismissal behavior.

## Feedback and overlays

`Popover` and `NotificationCard` are public exports with dedicated catalog pages. The notebook's `/#layers` composition explores them beside refreshed `Dialog`, `Drawer`, and `Toast` surfaces. [Layer APIs and composition guidance](LAYERS.md) document their behavior and distinguish Pebble's published interaction principles from Domino's own paper treatment.

`NotificationCard` is a static, named article with required `source`, `title`, and `children`, plus optional `time`, `icon`, `actions`, `count`, and `surface="paper" | "ink"`. Its readable queue badge does not create a live region or queue manager. The card stays one sheet at every queue size; there are no decorative backing cards. `Popover` supplies an anchored nonmodal dialog with controlled/uncontrolled state, a ref-forwarding trigger, viewport-aware placement, Escape/outside dismissal, and a Tab path back into the page. Its native top-layer path has a portal fallback.

`Dialog` and `Drawer` retain native modal semantics while adding `eyebrow`, decorative `icon`, and an inverse ink header through `surface`. `Dialog` defaults to `motion="fold"`: a single connected note arrives from the right with a shared 160ms fade during its 360ms unfolding motion. Its attached body/footer fold is gentle; the header stays locally flat and shares the whole-note movement and opacity. Closing begins immediately with a rightward slide and connected 200ms tuck; group opacity holds for 40ms, then fades over 200ms to complete the 240ms exit. No stationary rear sheet or duplicated content is added. `motion="settle"` uses the shared 240ms/160ms layer timing. `Drawer` always settles and omits the motion prop; the command palette also settles. Keep the modal mounted and drive `open` so motion can reverse; native modality persists through its full exit. Reduced motion shows the finished state immediately. `Toast` adds `eyebrow` and `action` content alongside existing tone/dismissal support. It announces status or a danger alert without taking focus or automatically removing itself.

| Pattern           | States/examples to expose                                                   | Native behavior expectations                                                            |
| ----------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Dialog/drawer     | Paper/ink header, fold/settle, context mark, open/closed, long content, wrapping actions | Accessible title, native modality, Escape, return focus, reversible exit                |
| Tooltip           | Pointer and keyboard, long text, edge placement                             | Supplementary explanation only; dismissible when necessary                              |
| Popover           | Top/bottom, start/center/end, open/closed, interactive content, long body   | Named nonmodal dialog; ref-forwarding trigger; Escape/close return focus, Tab may leave |
| Notification card | Paper/ink, single/queued, source/time, long title/body, wrapping actions    | Static named article; readable count; host owns delivery and announcements              |
| Toast/status      | Success/info/warning/danger, context label, action, optional dismiss        | Status or danger alert; no automatic focus or lifetime management                       |
| Progress          | Determinate/indeterminate, label, complete state                            | Accessible name and value; color is supplementary                                       |
| Spinner/loading   | Small/regular, labeled loading context, static reduced-motion version       | Do not announce every rotation; expose the actual operation state                       |

Overlay examples must inherit the intended theme even when rendered through a portal. Avoid showing an overlay as available unless its open, close, focus, and keyboard interactions are implemented.

## Journal and identity

| Pattern               | States/examples to expose                                                      | Fidelity requirements                                                             |
| --------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Animated name         | **Dom Lee.**, finished frame, replay, multiple instances, quiet/reduced motion | Exact Poppins source paths; separate teal period; unique SVG clipping identifiers |
| Garden plant          | Finished plant, replay, dark/light surfaces                                    | Shared stem/leaf/pot geometry; sage/terracotta source fill roles                  |
| Crane                 | Shared header/hero geometry where offered, completed/replay states             | Preserve original facets; same mark at different sizes                            |
| Sketch arrow          | Inline external link, annotation direction, hover/focus/static                 | Current-color SVG; no emoji substitution                                          |
| Journal key           | `•` task, `×` completed, `○` event, `–` note, `>` migrated                     | Exactly five source meanings; no scheduled or priority addition                   |
| Task list             | Native checkbox interaction, wrapped strike, nested tasks, disabled            | Preserve checked semantics; strike applies only to the task text                  |
| Folio/index row       | Stable number, dotted leader, label, real destination                          | Number from a stable destination registry, never array position                   |
| Timeline              | Milestone, heading/detail, mobile stack, optional draw                         | Neutral sample dates; clear chronological information                             |
| Flower/petal progress | Unfound/found, count, complete bloom, reduced motion                           | Theme-colored source art; progress also available as text                         |
| Polaroid/paper stack  | Real photos, N-item swipe/flick, slide-and-tuck, arrows, keyboard, quiet/reduced | Stable IDs, useful alt text, responsive image ratio, native vertical scroll/pinch |

Brand assets are optional additions to a consuming application. Generic buttons or inputs should not import a large drawing solely to inherit typography or color.

## Composition examples

The website should demonstrate the pieces together: a journal entry with metadata and tasks, a form with meaningful validation, a folded section heading with a supporting annotation, a navigation/readable-content Hybrid layout, a quote on blue paper, and a paper card with actions. These examples show how the system behaves in context without turning the library into a copy of personal site content.

Use neutral fixtures and local interactions. A save button, search box, or example form should visibly report what happened rather than imply an external service accepted data. Copy controls should copy the code they display and report success/failure.

## Review and extension rules

- Verify exports and examples against the real TypeScript implementation. Avoid documenting speculative props or code that refers to unavailable components.
- Preserve native HTML attributes and event behavior when wrapping controls. Consumers need labels, names, identifiers, descriptions, required state, and standard form behavior.
- Keep token changes centralized; avoid almost-identical colors inside individual examples.
- Review every component in Hybrid, Light, and Dark, including invalid/disabled/selected states and overlays.
- Check narrow/zoomed layouts, long labels, reduced motion, and keyboard interaction before marking an example complete.
- State whether each addition is extracted, adapted, or newly designed. A library extension can fit the system without being presented as source evidence.
- Add complex patterns only with their behavior, tests, and documentation. A visual sketch is a useful design study but is not an implemented component.

Available verification commands are `npm run check`, `npm run build`, `npm run build:lib`, and `npm test`. Record results outside this scope inventory after running them; this file makes no claim that they have passed.

## Implemented signature patterns

`src/lib/patterns.tsx` exports `Annotation`, `Timeline`, `PolaroidStack`, and `FlowerProgress`. Each has a dedicated catalogue entry, live preview, actual React example, prop reference, and usage guidance. PolaroidStack is implemented in `src/lib/polaroid-stack.tsx` and re-exported from patterns.tsx for compatibility. It supports any number of real photos, touch/pen drag and flick, native vertical scrolling and pinch zoom, keyboard/arrows, and the source-derived 480ms slide-and-tuck. Quiet and reduced motion use immediate changes. [Photo stack API and adoption](POLAROID-STACK.md).

## Touch feedback APIs

`src/lib/haptics.tsx` exports the scoped TouchFeedbackProvider (and TouchFeedback alias), TouchFeedbackSetting, InkSwitch, useTouchFeedback, haptic, armHapticCue, hapticPatterns and nativeSwitchProps. TouchFeedbackSetting and InkSwitch have dedicated visual catalogue pages; the Touch & haptics guide covers the provider/helper API, live examples and Safari instructions. Native targets preserve ordinary keyboard semantics and expose no additional tab stops. Their direct-touch behavior and the motor API are progressively enhanced; tests must distinguish event behavior from physical tactile output.

`Chevron` is the shared, optically centered SVG disclosure mark used by DropdownMenu, Select, Accordion, Annotation, Breadcrumb, and the website icon aliases. Controls rotate the same mounted icon; reduced motion changes direction immediately. Native selects retain picker/keyboard behavior and restore their native arrow in forced colors. See the Chevron catalog entry for geometry and props.
