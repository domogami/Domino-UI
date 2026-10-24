# Notebook sketches and Hairline

The [sketch gallery](http://127.0.0.1:5173/#sketchbook) brings two related drawing treatments into Domino UI: original notebook scenes and an adapter for the actual [Hairline project](https://github.com/lucasmarkes/hairline). Both use the shared paper and ink palette. They remain distinct kinds of artwork with separate provenance.

## Original notebook scenes

`NotebookSketch` draws original, slightly irregular SVG paths in a 4:3 viewBox. Narrow rounded strokes, small teal details, a light accent wash, and short Caveat captions extend Dom's established notebook language. The lettering uses the shared font; these scenes are not samples of Dom's personal handwriting.

| `variant`  | Drawing                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| `notebook` | Open notebook and pen, with layered paper and a marginal thought         |
| `flight`   | Folded paper plane and a curved flight trail                             |
| `garden`   | Leafy growth from notebook pages, encouragement, and a curved annotation |
| `camera` | Camera with two photo keepsakes |
| `keyboard` | Mechanical keyboard, a few accent keys, and a curly cable |
| `compass` | Open compass, folded map, and a wandering trail |

```tsx
import { NotebookSketch } from "@domlee/ui";

<NotebookSketch variant="garden" replayOnClick label="A small plant taking root" />
<NotebookSketch variant="notebook" quiet />
```

| Prop                 | Default      | Behavior                                                                 |
| -------------------- | ------------ | ------------------------------------------------------------------------ |
| `variant`            | `"notebook"` | `"notebook"`, `"flight"`, `"garden"`, `"camera"`, `"keyboard"`, or `"compass"`                                  |
| `animate`            | `true`       | Reveals the strokes once; `false` starts with finished art               |
| `quiet`              | `false`      | Finished art with no entrance motion or pointer response                 |
| `interactive`        | `true`       | Allows a restrained response to pointer or touch                         |
| `speed`              | `1`          | Shared drawing rate: `0.5`, `1`, `1.5`, or `2`                           |
| `replayKey`          | `0`          | Changing the key restarts the drawing                                    |
| `replayOnClick` | `false` | Adds a native replay button for click, tap, Enter, and Space |
| `label`              | omitted      | Adds one accessible image description; omit beside an equivalent caption |
| `className`, `style` | omitted      | Layout and local CSS customization                                       |

The shared `sketch-duration` token is **1600ms**, with **90ms** between stroke groups. These are one-time reveals followed by rest, not looping pen jitter. Main lines stay 1.1 CSS pixels; hatching stays 0.75px through non-scaling SVG strokes. Pointer movement is clamped to ±4px per axis on the nearest layer, with smaller movement behind it; it never moves the surrounding layout. `animate={false}` still permits pointer response; use `quiet` for wholly still art.

When `replayOnClick` is enabled, each illustration owns its replay count. Only that drawing restarts, including rapid clicks, while its native button and keyboard focus stay in place. Quiet and reduced-motion modes disable replay and show completed ink. The gallery enables replay on every illustration, with a separate Draw again control for the whole set. A vertical touch gesture remains a scroll.

## Actual Hairline figures

`HairlineSketch` wraps `@lucasmarkes/hairline` **0.5.1**, using its original SVG figures and runtime through the published vanilla API inside a small React lifecycle owner. Importing only three figures keeps the other engines out of the website bundle. Its geometric, isometric drawings complement the original curved scenes; they are not redrawn or presented as Dom's work.

| `variant`  | Pointer response                                |
| ---------- | ----------------------------------------------- |
| `riffle`   | A paper card rises from a tray                  |
| `branches` | An idea trail lifts along its branching history |
| `loupe`    | A magnifying glass follows across a ruled page  |

```tsx
import { HairlineSketch } from "@domlee/ui";

<HairlineSketch variant="riffle" intensity={0.35} replayOnClick />
<HairlineSketch variant="loupe" play label="A loupe exploring a ruled page" />
<HairlineSketch variant="branches" quiet />
```

| Prop                                 | Default                     | Behavior                                                           |
| ------------------------------------ | --------------------------- | ------------------------------------------------------------------ |
| `variant`                            | `"riffle"`                  | `"riffle"`, `"branches"`, or `"loupe"`                             |
| `label`                              | description for the variant | One accessible image description                                   |
| `play`                               | `false`                     | Opts into Hairline's guided tour; real input pauses it             |
| `replayOnClick` | `false` | Adds a native button and replays a one-time ink sweep |
| `replayKey` | `0` | External ink-sweep replay control |
| `intensity`                          | `0.35`                      | Pointer response, clamped to 0–1                                   |
| `quiet`                              | `false`                     | Resting figure, with autoplay and pointer response disabled        |
| `onRead`                             | omitted                     | Receives upstream caption updates for an optional external readout |
| `className`, `style`, div attributes | omitted                     | Layout and local customization                                     |

Hairline reserves a 5:4 box and draws on the client. The adapter sets a 0.85px non-scaling stroke. Hairline owns the timing of its physical responses. Click replay uses the shared 1600ms sketch duration for a fresh ink sweep, without turning on the looping guided tour. It does not accept `speed`. The shared runtime sleeps at rest and offscreen and removes its listeners when unmounted.

## Palette and motion rules

Both treatments inherit semantic tokens without requiring `ThemeProvider`: `--dm-ink` for the pen, `--dm-accent` for a few details, and `--dm-surface` for paper. Hybrid keeps teal `#0e7c79` on light paper. Dark uses its own ink, paper, and accent values; do not hardcode Hybrid colors into a new drawing.

Hairline's plate fill must match its backing surface, because its filled shapes hide geometry behind them. The adapter supplies the same `--dm-surface` for both. It maps `--hairline-hi` to the accent, `--hairline-edge` to strong ink, `--hairline-mid` to softened ink, and `--hairline-lo` to the shared border. Override `--hairline-plate` deliberately if placing it on another paper color.

Quiet mode and `prefers-reduced-motion: reduce` make **both components wholly still**. The Hairline adapter goes further than upstream's reduced-motion behavior: it recreates a resting figure, disables pointer input and autoplay, and prevents palette transitions. The gallery's explicit motion control governs its demonstrations. No haptics run merely because a drawing moves.

Keep captions short and use `--dm-font-hand` (Caveat). Keep instructions, labels, and important information in readable UI type outside the drawing. Do not apply random shake, roughness filters, or continuous drift to suggest handwriting. Preserve vertical touch scrolling and keep illustrations outside the Tab order; intentional replay and play controls remain real labeled buttons.

## Ownership and reuse

The original notebook paths were authored for this library. Hairline's original figures and runtime are **MIT © 2026 Lucas Marques**; retain the [included license](licenses/hairline-MIT.txt) when distributing them. Font notices remain in `public/fonts/`. See [asset provenance](ASSETS.md).

The supplied [CleanYourTV repository](https://github.com/Gathin23/cleanyourtv) was inspected as a reference. Its current main branch is a TV launcher/tooling project and supplies no Hairline implementation. The relevant upstream references are Hairline's [README](https://github.com/lucasmarkes/hairline/blob/main/README.md), [theme styles](https://github.com/lucasmarkes/hairline/blob/main/packages/hairline/src/core/styles.ts), and [animation/input lifecycle](https://github.com/lucasmarkes/hairline/blob/main/packages/hairline/src/core/stage.ts).

## Quartz and Obsidian

The React showcase demonstrates the shared system; it does not install drawings into either destination. Eighteen static notebook SVGs live at `public/sketches/{notebook,flight,garden,camera,keyboard,compass}-{hybrid,light,dark}.svg`. Run `npm run export:sketches` to regenerate them from the React geometry after the library build. Captions embed the Caveat WOFF2 font and its full OFL notice in SVG metadata; they are not outlined glyphs. Match the exported palette to the page, give meaningful images alternative text, and preserve each file's embedded notice. A future native animated component must share the same tokens, motion preference, drawing geometry, and teardown behavior. CSS adapters alone do not provide the Hairline JavaScript runtime. No Quartz or Obsidian files were changed for this feature.
