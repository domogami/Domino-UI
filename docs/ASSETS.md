# Asset provenance

Audited October 22, 2026. No private notes, reference photos, credentials, or analytics data were copied.

## Fonts

Copied from `dominicklee.net/public/fonts/`, where the supplied assets and licenses are documented in `docs/assets.md`. Distribution filenames here are descriptive; the font binaries are unchanged.

| Family        | Files in `public/fonts/`                | Original source filename                     | License               |
| ------------- | --------------------------------------- | -------------------------------------------- | --------------------- |
| Poppins       | `Poppins-Medium.woff2`                  | `577d5b99-d432-4bee-9dba-18a4f95eb489.woff2` | `poppins-OFL.txt`     |
| Poppins       | `Poppins-Semibold.woff2`                | `7e9c2124-736e-4a5d-877e-7b331873ad57.woff2` | `poppins-OFL.txt`     |
| Poppins       | `Poppins-Bold.woff2`                    | `f9cc56a6-1dc1-4ab8-a185-6fb759ffba46.woff2` | `poppins-OFL.txt`     |
| Lexend        | `Lexend-Light.ttf`, `Lexend-Medium.ttf` | Same names                                   | `lexend-OFL.txt`      |
| IBM Plex Mono | `IBMPlexMono-Regular.woff2`             | `bc027d93-df99-4e41-94fa-f8a3846d91f7.woff2` | `ibmplexmono-OFL.txt` |
| Caveat        | `Caveat.woff2`                          | `63f1500a-21ec-43d9-bf02-b5d2a42af2a7.woff2` | `caveat-OFL.txt`      |
| Kalam         | `Kalam-Bold.ttf`                        | Same name                                    | `Kalam-OFL.txt`       |

All are SIL Open Font License assets. Read and retain the supplied notices. The package's `@domlee/ui/fonts.css` resolves its font files relative to the installed package for compatible bundlers. The visual website's source stylesheet uses `/fonts/`, rewritten for its relative deployment base. Portable native adapter bundles include adjacent `fonts/` directories; preserve their layout.

## Original brand geometry

- Name glyphs: exact copy of `dominicklee.net/app/components/notebook/nameGlyphs.ts`, derived from Poppins Bold. Its original provenance comment is retained.
- Name renderer and timing: adapted from `HeroName.tsx`, `notebook.css:3631–3743`, and `docs/name-motion.md`.
- Crane facets: original six paths from `app/components/notebook/Crane.tsx`.
- Plant and banner paths: `app/components/notebook/NotebookDrawings.tsx`.
- Sketch arrows: `app/components/notebook/SketchArrow.tsx`.
- Flower artwork: the current garden's `work/garden-v5/site/flower-hunt/art.ts`.

Artwork is retained for Dom's own design system. No third-party relicensing of personal brand assets is asserted by this repository. Generic interface icons and the Domino mark were drawn as code for this library.

## Task motion and loading marks

`TaskCheckbox` retains the curved SVG check from `obsidian-site/quartz/work/garden-v5/site/notebook/tasks.scss`: `M3 12Q6 15 9 19Q14 10 22 3`, a 220ms clipped reveal, and the 280ms background-size strike. The original `site/notebook/motion/tasks.ts` wraps only inline task text; React supplies an equivalent owned span while leaving descriptions and nested tasks separate. The garden source remains unchanged.

The handwritten Skeleton’s nonverbal pen groups and avatar ring were authored for this library as an extension of the notebook aesthetic. They are illustrative loading marks, not samples of Dom’s personal handwriting or copied written content. Its block variant retains the earlier solid placeholder treatment.

## Photos

The Polaroid Stack example uses the same two public SNAP-75 keyboard photos already shown on [the personal website](https://dominicklee.net/). They are illustrative assets for this source-based pattern, not profile or private reference photos. Other identity examples use invented collaborator names and initials, not photographs or real participation claims.

## Notebook sketches and Hairline

The README logo and cover in `docs/images/domino-ui-{logo,cover}.{svg,png}` use the existing Domino mark, original notebook scene, semantic palette, and supplied font assets. The SVG files preserve the font notices in metadata; their PNG companions are native-rendered presentation assets. Component screenshots document the local visual notebook.

Added October 24, 2026. `src/lib/sketch.tsx` contains six original SVG scenes (`notebook`, `flight`, `garden`, `camera`, `keyboard`, and `compass`) authored for Domino UI. Their geometry, narrow pen strokes, curved annotations, and short Caveat captions extend the existing notebook language. They are not traced from external illustrations and do not reproduce Dom's personal handwriting. Eighteen static Light/Dark/Hybrid companions are generated into `public/sketches/` from the same geometry by `npm run export:sketches`. They embed Caveat WOFF2 and the full [SIL Open Font License](../public/fonts/caveat-OFL.txt) in SVG metadata; caption glyphs are not outlined.

`src/lib/hairline.tsx` uses the actual `riffle`, `branches`, and `loupe` functions from `@lucasmarkes/hairline` 0.5.1 through a small React lifecycle owner. These original figures and the runtime are **MIT © 2026 Lucas Marques**. Domino adds its own semantic palette and stricter quiet/reduced-motion boundary. Preserve [the included Hairline notice](licenses/hairline-MIT.txt) in distributions. Upstream: [source](https://github.com/lucasmarkes/hairline), [package metadata](https://github.com/lucasmarkes/hairline/blob/main/packages/hairline/package.json), and [license](https://github.com/lucasmarkes/hairline/blob/main/LICENSE).

The user-supplied [CleanYourTV repository](https://github.com/Gathin23/cleanyourtv) was inspected; it supplies no Hairline source or artwork for this feature. No TV launcher code, TV graphics, or device tooling were copied. The [sketch guide](SKETCHES.md) describes the two implementations and their reuse boundaries.
