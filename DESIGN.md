# Domino UI design system

Domino UI turns Dom Lee's personal notebook and digital garden into a shared design system for the personal website, Quartz, and Obsidian. React components and a visual reference website implement that system alongside native CSS adapters. Its identity comes from warm paper, charcoal ink, a deliberate dot grid, folded banners, useful journal notation, and occasional handwritten thoughts. Structure comes first; the drawings add personality around it.

This document defines the visual language and its provenance. [Component scope](docs/COMPONENTS.md) covers the library inventory and [accessibility requirements](docs/ACCESSIBILITY.md) describe behavior that implementations must preserve. These are design requirements, not a statement of conformance or production readiness.

## Source of truth

The references are the [personal website](https://dominicklee.net/) and [digital garden](https://domogami.github.io/), supported by their local source. The source audit was performed on October 22, 2026. Live references establish the destination and overall composition; local code supplies exact geometry, values, and behavior. Both public homepages were captured through Firecrawl and inspected in the browser during this audit. Local source supplied exact values, artwork geometry, responsive rules, and motion timings; branding extraction was treated as supporting evidence because some detected font roles were imprecise.

| Reference            | Local source                                                               | What it establishes                                                                                             |
| -------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Portfolio guide      | `dominicklee.net/docs/design-system.md`                                    | Five type families, paper and ink palette, 32px rhythm, journal meanings, folds, motion, responsive composition |
| Portfolio styles     | `dominicklee.net/app/styles/notebook.css`                                  | Exact CSS, final cascade, banner/plant/name timing, focus appearance, paper shapes                              |
| Portfolio drawings   | `dominicklee.net/app/components/notebook/NotebookDrawings.tsx`             | Notched and folded banner SVG geometry, drawn note and plant composition                                        |
| Portfolio wordmark   | `dominicklee.net/app/components/notebook/HeroName.tsx` and `nameGlyphs.ts` | Exact Poppins glyph outlines, separate period, unique clipping identifiers                                      |
| Current garden       | `obsidian-site/quartz/work/garden-v5/quartz.config.yaml`                   | Light/Dark palette and Poppins/Lexend/IBM Plex Mono roles                                                       |
| Garden notebook skin | `obsidian-site/quartz/work/garden-v5/site/notebook/`                       | Hybrid composition, theme persistence, Caveat annotations, task checks, graph panels, reading mode              |
| Garden flower art    | `obsidian-site/quartz/work/garden-v5/site/flower-hunt/`                    | Portable drawn petals, bloom/progress motif, mobile positioning                                                 |

The repository root at `obsidian-site/quartz` contains an older Quartz 4 design with Schibsted Grotesk, Source Sans Pro, and older dark overrides. Use `work/garden-v5` for the current notebook identity. Do not combine the old palette with the current garden by accident. Likewise, the portfolio's archive and legacy routes are independent designs.

The extraction concerns reusable styling, SVG artwork, and interaction patterns. Personal note contents, photographs, pairing information, and credentials are not part of the component library. Use neutral demonstration copy and public or locally authored sample artwork.

## Design principles

1. **Make the notebook useful.** Clear reading order, labels, links, and native controls give the page its structure. Decorative marks should help someone find, connect, or remember information.
2. **Treat the grid as layout.** Place text and section spacing deliberately against the 32px rhythm. Keep a continuous background phase across adjoining panels.
3. **Keep the ink legible.** Body copy uses a readable sans serif and a strong paper/ink pairing. Writing rules sit between text rows or beneath the ink, with clearance for every letter and descender. Handwriting, pale paper colors, and mint accents have limited roles.
4. **Use a small family of drawings.** Reuse the exact name glyphs, shared arrows, folded ribbons, plant, and crane geometry. Avoid a mixture of unrelated sketch styles.
5. **Keep irregularity local.** Asymmetric corner radii, a small paper tilt, and a curved arrow can feel human while controls, columns, and reading lines remain stable.
6. **Prefer Hybrid.** A dark navigation region beside light reading paper is the default composition. Every component must also work in complete Light and Dark themes.
7. **Make motion optional.** Artwork has a complete resting state. Reduced motion, quiet mode, interrupted scripts, and repeated previews must keep the content usable.

## Color foundations

The portfolio establishes paper `#efe7d7`, ink `#252b2e`, teal `#0e7c79`, mint `#43d0c1`, charcoal `#2b3034`, terracotta `#a34e36`, and soft green paper `#d5e3cd`. These colors have distinct roles; adding many adjacent shades weakens the identity.

The current garden defines this full source palette in `quartz.config.yaml:25–44`:

| Source role                   | Light                  | Dark                    |
| ----------------------------- | ---------------------- | ----------------------- |
| Canvas (`light`)              | `#efe7d7`              | `#2b3034`               |
| Rule/border (`lightgray`)     | `#cfc5b4`              | `#50565a`               |
| Muted ink (`gray`)            | `#77756f`              | `#aaa79f`               |
| Body ink (`darkgray`)         | `#414748`              | `#ded7ca`               |
| Strong ink (`dark`)           | `#252b2e`              | `#efe7d7`               |
| Primary accent (`secondary`)  | `#0e7c79`              | `#b6cf8e`               |
| Secondary accent (`tertiary`) | `#a34e36`              | `#e6b78d`               |
| Accent wash                   | `rgba(14,124,121,.08)` | `rgba(182,207,142,.10)` |
| Selection wash                | `rgba(67,208,193,.24)` | `rgba(182,207,142,.24)` |

The source Hybrid rail is `#2b3034`, with cream text and a lightened teal link color (`color-mix(in srgb, #0e7c79 60%, #efe7d7)`). Its graphic teal remains `#0e7c79`. Hybrid quote paper is `#c6d9de`, with `#24545b` text and a 3px teal left rule. These scope changes are in `site/notebook/hybrid.scss` and `search.scss`; Hybrid is not a translucent average of Light and Dark.

### Library theme roles

All consumers derive semantic `--dm-*` properties from canonical `tokens/system.json`. `src/styles/tokens.css`, resolved JSON and native bundles are generated by `npm run build:system`. Edit the canonical source; do not edit generated files. The [shared-system guide](docs/SHARED-SYSTEM.md) records versioning, adoption and rollback. This table records the initial mapping; the canonical JSON is authoritative if implementation changes.

| Library role         | Light     | Dark      | Hybrid                    |
| -------------------- | --------- | --------- | ------------------------- |
| Page paper           | `#efe7d7` | `#2b3034` | Light paper               |
| Surface              | `#f7f3e9` | `#323b3e` | Light surface             |
| Raised surface       | `#fcf9f1` | `#394347` | Light raised surface      |
| Strong ink           | `#252b2e` | `#efe7d7` | Light ink                 |
| Muted ink            | `#696b63` | `#b1b4a8` | Light muted ink           |
| Border               | `#c8c0b1` | `#566164` | Light border              |
| Action accent        | `#0e7c79` | `#b6cf8e` | Teal                      |
| Ink on action accent | `#fffdf7` | `#252b2e` | Light accent ink          |
| Navigation surface   | `#f0eadd` | `#252b2e` | `#2b3034`                 |
| Navigation ink       | `#252b2e` | `#efe7d7` | `#efe7d7`                 |
| Navigation accent    | `#0e7c79` | `#b6cf8e` | `#b6cf8e`                 |
| Focus                | `#0e7c79` | `#b6cf8e` | Region-appropriate accent |

The source-derived base paper, ink, teal, charcoal, pistachio accent, blue quote paper, and soft green paper remain recognizable. **Library extensions** include separate raised surfaces, adjusted muted/border roles, dark paper tints, danger feedback, navigation selection surfaces, and uniform elevation tokens. Hybrid's pistachio navigation accent is a library choice drawn from the source Dark palette; the garden itself uses lightened teal there. Do not describe those mappings as exact copies of garden CSS.

| Illustrative paper | Light value | Dark value | Role                                   |
| ------------------ | ----------- | ---------- | -------------------------------------- |
| Sage               | `#d5e3cd`   | `#3e5144`  | Sticky notes, gentle positive emphasis |
| Peach              | `#eed5bf`   | `#614e42`  | Warm paper variant                     |
| Lavender           | `#ded9e8`   | `#4a455a`  | Secondary paper variant                |
| Blue               | `#c6d9de`   | `#384e57`  | Quote/reference paper                  |

Peach/lavender variants and the dark illustrative equivalents extend the reference system. They do not encode status by themselves. Error and success messages need explicit wording and an appropriate semantic icon or mark. Mint `#43d0c1` is a drawing accent and active-location detail; it is not automatically suitable for small text on cream.

### Theme behavior

- With no valid saved choice, select **Hybrid**, independently of the operating system preference.
- Expose three named choices: Hybrid, Light, Dark. A visible selection and an accessible name must agree.
- Persist explicit selection when storage is available; keep controls functional when storage throws or is unavailable.
- Apply the initial preference before first paint where practical. A server-rendered application should provide a matching initial attribute or a small preference initializer.
- Hybrid changes surface roles, not column measurements or component positions. A theme switch must not rearrange the page.
- Give portals, dialogs, menus, code samples, and search previews their intended theme scope. CSS variables inherit from the rendering location, so a portal mounted elsewhere needs deliberate scoping.
- The garden's saved value `blended` is a legacy implementation detail. A new application may use `hybrid`; migration is required only when importing an existing garden preference.

## Type system

| Family            | Intended role                                                        | Source guidance                                                   |
| ----------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Poppins**       | Brand, exact wordmark outlines, structural headings and display text | 500/600/700 supplied; use 600–700 for strong hierarchy            |
| **Lexend**        | Body copy, labels, form fields, descriptions                         | Source body is 300; 500 provides emphasis without changing family |
| **IBM Plex Mono** | Navigation metadata, code, dates, folios, tokens, small labels       | Avoid long narrative paragraphs in mono                           |
| **Kalam Bold**    | Deliberately lettered banner text, project/timeline headings         | Portfolio uses 700; it is the more structured handwritten face    |
| **Caveat**        | Informal annotation, marginal note, quotation title, short caption   | Reserve for short supporting thoughts; body copy stays Lexend     |

Self-hosted font definitions live in `src/styles/fonts.css`; font files and their individual SIL Open Font License notices live in `public/fonts/`. Applications must serve the font URLs used by that stylesheet and retain license notices when redistributing. The name's SVG paths come from Poppins and retain their provenance.

The portfolio body reference is 17px/32px Lexend 300. The garden uses a 1rem body with line-height 1.85, a 2.4rem page title, 1.85rem h2, and 1.5rem h3. At ≤800px its title becomes 1.65rem and article h1/h2/h3 become 1.6/1.4/1.2rem. These are reference scales, not a requirement to make every component use a 32px line box. Dense controls need a comfortable target while long reading needs a relaxed rhythm.

Keep supporting labels readable at zoom. Source folios sometimes use very small type; library examples should not use those sizes for essential instructions. Use real heading elements with correct hierarchy. A banner is a treatment of a heading, not a reason to skip heading levels.

Kalam's optical baseline correction in the portfolio is `.12em`. Move the ink inside its label rather than moving the grid or whole heading row. Header index handwriting remains level; do not introduce a rotation or a wavy hover treatment there.

## Grid, spacing, shapes, and elevation

The **32px grid** is the organizing rhythm. Place text between dot rows. The portfolio uses a continuous cream hero grid with no parallax or crane drift, section padding of 64px, a gutter of `clamp(24px, 5vw, 80px)`, and a maximum inner width of 1440px. Main text-bearing spacing follows 32px multiples; local controls and details may use smaller increments.

The library spacing scale is an explicit extension built from that rhythm: **4, 8, 12, 16, 24, 32, 48, 64px**. Use 4/8px for icon-label details, 12/16px for control interiors, 24/32px for local groups, and 48/64px for section separation. Content length and responsive reflow take priority over forced row alignment.

### Writing rules and text

**A writing rule must never run through text.** Set ordinary ruled prose on the 32px row rhythm, with block spacing in whole rows and a content origin that follows the real padding. `Paper` supports `ruleAlign="between"` for text centered between rules and `ruleAlign="baseline"` for a guide closer beneath the ink. Preserve clearance around ascenders, descenders, handwriting, wrapped lines, and mixed font families.

Large headings, embedded controls, code, and figures need clear bands. Omit a complete unsafe rule row while keeping the content's natural layout; do not paint opaque patches over letters, shrink text to fit a line, or rely on a fixed background offset. Font loading, responsive reflow, and zoom must preserve the separation. Decorative rulings can wait for a safe layout; readable text never waits for decoration. The canonical pitch, clearance, and guide offset are `paper-rule-pitch` (32px), `paper-rule-clearance` (3px), and `paper-rule-guide-offset` (2px). [Paper rhythm and composition](docs/PAPER-RHYTHM.md) records the React contract and the same rule for future native integrations.

| Detail             | Reference                                              |
| ------------------ | ------------------------------------------------------ |
| Garden dot pitch   | 32px                                                   |
| Garden dot edge    | `0.85px` to transparent at `1.15px`                    |
| Light garden dot   | `rgba(37,43,46,.16)`                                   |
| Dark garden dot    | `rgba(239,231,215,.14)`                                |
| Hybrid rail dot    | `rgba(239,231,215,.09)`                                |
| Dot phase          | `background-position: 0 -16px`                         |
| Portfolio dot edge | 1px to transparent at 1.3px, with `rgba(30,36,39,.19)` |

The library follows the quieter garden dot treatment. A translucent paper wash can reduce texture behind sustained reading; the garden uses a 72% canvas wash behind articles and 82% behind graph surfaces. Do not lower the text opacity to achieve that effect.

Keep structural UI mostly square with restrained irregularity. Source radii include callouts `3px 7px 5px 4px`, graph surfaces `5px 9px 6px 8px`, checkboxes `3px 5px 2px 4px`, and standard toolbar controls 8px. The shared library radius adopts the callout contour. Avoid large pill shapes for every control.

Folded paper must have a real silhouette: clip the paper layer at its 20px missing corner and put its drop shadow on an outer container. Never paint a triangular patch with an assumed page color; it breaks on differently colored surfaces. A notched strip and a folded ribbon are separate variants with their own source geometry.

Elevation is restrained. The source folded banner face uses a small `0 2px 1.5px` dark teal shadow; photographic polaroids use `2px 10px 24px #0004`. The library's `2px 3px 0` ink shadow is a new shared token for paper/control separation. Use the stronger photographic shadow only for stacked physical artifacts. A semantic border should still define the control when shadows disappear.

### Paper layers

Contextual popovers, modal decisions, and notification cards use opaque paper with a strong ink boundary. The shared `shadow-layer` adds one subtle 2px / 3px ink edge; it is a deliberate library extension. Notification queues use a readable badge on one sheet, without duplicate backing cards. Keep depth crisp and restrained, preserve context around the foreground, and separate source metadata, title, content, and actions. An inverse ink header is a semantic treatment in every theme, including Dark.

The [Paper layers guide](docs/LAYERS.md) records inspiration from Pebble's published interaction guidance: prominent information, limited meaningful color, self-contained cards, visible actions, and short motion that explains change. Single paper surfaces, folding motion, handwritten annotations, and teal are Domino's adaptation, not Pebble specifications. Do not copy Pebble artwork, fonts, or icons to express that influence.

Use a nonmodal `Popover` for a small contextual task, a native `Dialog` or `Drawer` for a focused decision, a static `NotificationCard` for a complete message, and a `Toast` for operation feedback. Keep the actual message and queue count readable. Shared settle motion enters over 240ms and exits over 160ms. `Dialog` defaults to `motion="fold"`: the complete note arrives from 24px right and 4px down, with a shared 160ms entry fade inside the 360ms unfolding motion. A gentle connected body/footer fold and light crease settle into one flat note. The header keeps solid paper paint and follows the whole-note movement and opacity, with no independent hinge or fade. Closing begins immediately, moving the note right and down as the connected leaf tucks over 200ms. Group opacity holds for 40ms, then fades over 200ms to finish the 240ms exit; the backdrop starts clearing immediately over those 240ms. The visible planes carry their own outlines without a stationary rear plate or duplicated content. `motion="settle"` remains available for utility dialogs; `Drawer` and the command palette always settle. Native modality persists through the complete exit, motion can reverse, and reduced motion shows the finished state immediately. The notebook's `/#layers` composition demonstrates those choices together.

## Handwriting, banners, and journal marks

Use **Kalam** for a named section on a paper banner and **Caveat** for an aside about the section. One handwritten thought with an arrow is usually enough beside a heading. Keep instructions, validation, form labels, and long paragraphs in Lexend. Do not turn all headings into casual handwriting.

Reuse the exact SVG banners from `NotebookDrawings.tsx`: the standard notched strip and the folded ribbon with tails, folds, and a front face. Preserve the folding order. Labels must stay within the front panel at narrow widths and at enlarged text sizes. The garden's smaller graph banner uses Poppins; that is a contextual source variant.

`TripleBanner` extends the family with three connected ribbon faces and two diagonal reverse folds. It uses new geometry inspired by the supplied reference, rather than copying the existing single-ribbon paths. Its three real-text labels determine the face heights and wrap naturally, including narrow layouts and long words. `BookmarkDrawing` adds original notched and pointed hanging-bookmark silhouettes with a fine teal seam and a faint second pen pass. Both share `DrawingProps`, semantic colors, quiet/reduced motion, and optional native-button replay; enable `animate` explicitly for a replayable triple ribbon. Keep replayable labels plain and noninteractive.

Annotations have optional curved arrows pointing up, down, left, or right. Arrows travel inline with the title and wrap safely within the content column. They are decorative hints; actual references should use a descriptive link. Do not position an arrow across an unrelated control or use it to convey essential instructions by position alone. End-aligned and title-only annotations are valid. Collapsible annotation bodies retain regular body typography.

The canonical journal key contains **exactly five marks**, from the portfolio guide:

| Mark | Personal label     | Meaning                    |
| ---- | ------------------ | -------------------------- |
| `•`  | on my list         | Actionable task            |
| `×`  | made & loved       | Completed task             |
| `○`  | a little happening | Dated event                |
| `–`  | worth a scribble   | Note, observation, or idea |
| `>`  | carried forward    | Migrated task              |

There is deliberately no scheduled-task symbol. Do not add `<` or priority asterisks to this key, and do not redefine an arrow as a generic marker for ongoing work. Article listings use note dashes. A displayed symbol needs visible text or an equivalent accessible description; shape and color must not be its only explanation. Native checkboxes are used when a user can actually change task completion.

Navigation uses a separate small mint location dot alongside `aria-current="location"`. Its meaning is current reading location, not a new journal category. Keep it from shifting the link when it appears.

Other reusable motifs include a drawn potted plant, shared faceted crane, dotted leader, folio, outbound sketch arrow, layered note, and flower/petal progress. Decorations must not intercept pointer events or become extra keyboard stops. A replay control is an intentional exception and needs a real button.

### Thin notebook sketches

`NotebookSketch` extends that family with six original scenes: notebook, flight, garden, camera, keyboard, and compass. Keep the pen narrow and rounded, with non-scaling strokes, restrained hatching, a few semantic accent marks, and short Caveat captions. Curved paths and intentional asymmetry supply the handwritten character; random shake and roughness filters do not. The art reveals once using the shared 1600ms sketch duration and 90ms stroke-group stagger, then rests. Optional pointer depth is bounded to ±4px per axis on the nearest layer, with less movement behind it and no layout movement.

`HairlineSketch` complements those curves with the actual Hairline 0.5.1 isometric figures: paper cards, branching ideas, and a loupe. Its 0.85px line weight and semantic paper/ink/accent palette fit the notebook while preserving the upstream geometry and attribution. Plate fills must match the backing paper so foreground shapes conceal the lines behind them. Hybrid uses teal details on light paper; Light and Dark inherit their own semantic roles.

Quiet mode and the operating system's reduced-motion setting leave both drawing types entirely still, including pointer response. Autoplay is an explicit Hairline option rather than the default; controls for replay or a guided tour live outside the illustration. Do not add keyboard stops to decorative artwork, and keep essential instructions in the normal reading flow. [Sketch usage and provenance](docs/SKETCHES.md) distinguish original art, the licensed Hairline runtime, and future native Quartz/Obsidian integration.

## Motion choreography

Motion describes a drawing becoming ink on paper. Avoid unrelated bounce, continuous drift, and repeated entrance effects on ordinary content. The portfolio and garden have different timing budgets, so preserve their identity while choosing a deliberate context.

| Pattern                      | Source sequence                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Portfolio name, **Dom Lee.** | Exact Poppins outlines over 2120ms; diagonal fill sweep 660ms starting at 1320ms; period lands for 180ms starting at 2060ms    |
| Portfolio shared hero        | Name starts at 0; ribbon outline starts 160ms for 1020ms; fill begins 1180ms; label begins 1380ms; tagline 2300ms; copy 2920ms |
| Ordinary portfolio banner    | Outline 800ms; fill 450ms beginning at 750ms; label follows                                                                    |
| Garden compact banner        | Outline 600ms, then fill 240ms; label begins 840ms                                                                             |
| Portfolio handwriting        | Clipped character reveal 70ms with 75ms stagger; preserve whole words                                                          |
| Garden bounded handwriting   | 22ms step, 65ms glyph reveal, 650ms budget; cap long sequences                                                                 |
| Plant                        | Staggered stem, leaves, and pot outlines with soft fills; full source sequence about 2.4s                                      |
| Garden task                  | 220ms check drawing; 280ms wrapped strike                                                                                      |
| Standard UI                  | Library extension: 160ms fast and 240ms base feedback                                                                          |
| Folding dialog               | Library extension: whole-note right-side arrival/unfold over 360ms with 160ms entry fade; 240ms close with connected tuck and a shared 40ms hold / 200ms fade |

The wordmark's period is part of the requested identity. The garden header intentionally omits it; use the portfolio's period-bearing variant for the library's main brand example. Use instance-specific SVG identifiers so several wordmarks can coexist on one page. Do not replace its geometry with live text in an approximately similar font.

Handwritten reveal is a clipped text effect, not literal pen-path tracing. Keep an accessible full label while visual character spans animate. Repeated replay must restart predictably and avoid accumulating timers. Show completed art immediately under reduced motion or quiet mode. Ordinary paragraphs, navigation, search results, validation, and essential instructions must not wait for a drawing.

Provide explicit replay and motion controls in the showcase. Keyboard focus and Find must not land on invisible content. Static examples must remain meaningful when animation is disabled or interrupted. Preserve printing with completed artwork and normal readable text.

## Responsive composition

Task completion retains the garden’s original 220ms curved check and 280ms ink strike, scoped to the task copy so descriptions remain clear. A springing switch uses a 360ms reversible settle and 80ms press deformation. Handwritten loading placeholders use nonverbal pen marks with a long write-and-rest cadence; their faint guide preserves layout context between passes. All use shared motion tokens and show static completed states under reduced motion. The banner face sizes from its label, with proportional artwork margins and natural wrapping rather than shrinking the handwriting to fit.

Reference breakpoints differ by application: the portfolio uses major changes at 1100px and 760px; the garden uses 1200px and 800px. They are evidence for layout transitions, not a reason to bake one page's dimensions into every primitive.

The library website keeps the navigation rail and document aligned on larger screens and uses a modal slide-out navigation below 700px. Its single menu button morphs between three strokes and a close mark as the panel slides and backdrop fades. Shared `menu-duration` (360ms) and `menu-easing` (`cubic-bezier(0.22, 1, 0.36, 1)`) tokens coordinate reversible transitions. Reduced motion changes state immediately. Closed navigation is inert; the modal contains focus and restores it on dismissal, while desktop resizing releases the scroll lock. Hybrid's charcoal area follows the actual header/rail box. Components keep their theme-independent measurements.

Page changes name only the content sheet for a progressive View Transition; persistent chrome keeps its place. Incoming content settles by 8px over the existing 240ms layer duration, while the outgoing sheet leaves by 4px over 160ms. Use `createPageTransition` at the router's synchronous DOM commit boundary, or the consuming framework's own integration. Reduced motion, unsupported capture, active modals, and browser-owned navigation animations use the normal immediate commit. Rapid navigation invalidates obsolete callbacks, and application history, scroll, and focus remain application responsibilities. The notebook retains scroll-to-top for actual route changes and native behavior for in-page anchors. [Page-flow API and routing contract](docs/ROUTING.md).

At garden widths below 1200px, related panels follow the article in an adaptive grid with 16rem minimum columns. At ≤800px the navigation expands in document flow and the flower collector becomes a footer-adjacent row. Carry that principle into reusable compositions: decorative fixed controls must not cover text, form actions, or footer links.

Support 320px, 390px, 768px, 1024px, 1440px, and 1920px visual checks, plus 200% text enlargement and reflow equivalent to 400% zoom. Let long labels wrap, preserve `min-width: 0`, and confine necessary horizontal scrolling to code/table regions. Keep at least 44px comfortable touch targets. [Accessibility requirements](docs/ACCESSIBILITY.md) cover detailed behavior.

## Adding and changing components

Public exports live in `src/lib/index.ts`. Shared implementations are in `src/lib/components.tsx`, `theme.tsx`, and `brand.tsx`; shared colors/metrics and font definitions live in `src/styles/`. The visual website is composed in `src/App.tsx` with its catalog in `src/catalog/`.

Each new component needs an evident purpose, a visual example, a code example that uses its actual export, meaningful states, and all three theme checks. Describe whether its appearance is extracted from the sources or extends the system. Keep brand drawings separate from generic controls so an application can adopt the UI without automatically including every illustration.

Use [the component inventory](docs/COMPONENTS.md) to review scope. Test results and outstanding limitations belong in the project validation record or release notes. This guide defines expected behavior and must not be used as evidence that a check has passed.

## Touch feedback

Touch is part of the shared interaction language. [HAPTICS.md](docs/HAPTICS.md) captures the personal site’s exact tap, selection, draw, success and error patterns, provider API, gesture gating, preference, cancellation and Safari usage. Haptics remain optional, theme-independent and quiet under reduced motion. The Safari path uses a direct real native-switch tap, distinct from custom Vibration API patterns and animation-finish cues. The library preserves both paths with scoped opt-in behavior and per-control opt-outs. API and event tests are not physical-device verification.

## Control chevrons and sketch replay

Use the shared centered `Chevron` SVG for dropdown, select, breadcrumb, and disclosure affordances. Keep its square box aligned to the control center; do not substitute text glyphs or baseline offsets. Expanded controls rotate the persistent icon, with an immediate direction change under reduced motion. Keep hand-drawn SketchArrow marks for annotations.

Sketches may opt into `replayOnClick`: one stable native button redraws its own ink on click, tap, Enter, or Space. Other drawings remain at rest. Preserve button focus during replay, allow vertical touch scrolling, and disable replay when quiet or reduced motion is active. The notebook set includes six scenes; Hairline replays an ink sweep while its guided tour remains separately opt in.


## Drawn timelines

`Timeline` carries the notebook's hand-lettered milestones into a finite pen-drawn sequence. Organic nodes ink in, a fine connector draws down to the next milestone, and its readable copy settles gently into place. The ordered list and its links remain present throughout; drawing never gates chronology or essential information.

Play once on first viewport entry. An explicit external control can change `replayKey` to draw again while preserving the list, milestone identity, and focus. Do not loop or erase the timeline as a reader scrolls away. Quiet mode, `animate={false}`, and reduced motion show the finished timeline immediately. Canonical `timeline-duration` (480ms per connector) and `timeline-stagger` (120ms milestone dwell) produce 600ms milestone starts and a 1440ms three-item sequence. See [timeline motion and adoption](docs/TIMELINE.md).

## Reusable photo stacks

`PolaroidStack` carries the personal site's actual hand-drawn arrows and slide-and-tuck movement into a reusable N-photo stack. It shows real following prints, keeps a stable image window with naturally wrapping Caveat captions, and preserves the selected photo by a stable ID when the list changes. The default landscape window is 16:9; collections can choose another ratio and per-photo object position. Do not force a tall mobile height onto a narrow landscape photo.

Touch and pen gestures follow horizontal intent, preserve native vertical scrolling and pinch zoom, and suppress the synthetic click after a drag. A short drag returns; a deliberate swipe or quick flick cycles one item. Previous/next, tap, and keyboard Left/Right share that state. The outgoing print owns its transform for the source-derived 480ms slide-and-tuck. Keep the stack and its ancestors unclipped so the whole print remains visible beyond the stack's layout box until it tucks underneath. Quiet and reduced motion show the final selection immediately. The swipe surface opts out of Safari's auxiliary native tap target; arrow controls remain eligible. Native gestures, photo identity, and accessible count are part of this component's behavior. See [Polaroid stack usage](docs/POLAROID-STACK.md).
