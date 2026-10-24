# One system across the notebook, garden, and editor

Domino UI is the shared design source for the personal website, the current Quartz garden, and the Obsidian writing workspace. The React components are one implementation of that design. Quartz and Obsidian consume the same semantic tokens through their own CSS adapters.

The shared foundation and adapter builds are implemented in this repository. **Adoption in the three destinations is planned.** No destination website, vault, theme, note, or deployment has been modified by this preparation.

## Ownership

| Layer                                                               | Authority                                                              | Consumers                                               |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------- |
| Primitive palette, semantic roles, fonts, spacing, motion durations | `tokens/system.json`                                                   | All three destinations and the component notebook       |
| Resolved tokens                                                     | Generated `tokens/resolved.json`                                       | Tooling, documentation, and future non-CSS integrations |
| Web custom properties and font declarations                         | Generated `src/styles/tokens.css` and `fonts.css`                      | React library and visual guide                          |
| Original artwork, motion rendering, reusable React API              | `src/lib/`                                                             | Personal website and compatible React applications      |
| Native variable/selector translations                               | `src/adapters/portfolio.css`, `quartz.css`, `obsidian.css`             | Existing destination markup and controls                |
| Adoption versions                                                   | Generated `platforms/manifest.json`, then recorded in each destination | Review, drift detection, and rollback                   |
| Principles, journal meanings, writing and accessibility             | `DESIGN.md`, guides, and the component notebook                        | All implementations                                     |

Edit the canonical source instead of changing a generated copy. The generator resolves the light/dark/hybrid inheritance, validates role parity, checks font assets and licenses, and stamps each output with the same version and SHA-256 fingerprint. Package and token versions must agree. The visual guide uses the generated CSS itself, so accepted token changes appear there before adoption elsewhere.

## Build and check

```sh
npm run build:system  # Generate all CSS/JSON and portable native bundles
npm run check:system  # Detect drift in tracked generated web/font/token files
npm run test:system   # Validate token contracts, inheritance, fonts and manifests
npm run build:lib     # Generate system, then React ESM + CSS + type declarations
npm run build         # Generate system, then the static visual guide
npm test              # Real component tests and simulated native adapter fixtures
```

`platforms/` contains generated artifacts and is ignored by Git. Builds recreate it from checked-in sources. The canonical JSON, schema, resolved JSON, and generated web/font CSS are tracked. Font binaries and SIL Open Font Licenses remain in `public/fonts/`. Generated web bundles include a portable `fonts/` directory; the standalone Obsidian snippet embeds its font data and license notices so local paths and network access are unnecessary.

| Output                                                | Intended adoption                                         |
| ----------------------------------------------------- | --------------------------------------------------------- |
| `lib/domino-ui.js`, `lib/domino-ui.css`, declarations | React components through `@domlee/ui`                     |
| `platforms/portfolio/`                                | Optional token bridge over the existing notebook markup   |
| `platforms/quartz/`                                   | Native Quartz 5 palette, typography and notebook bridge   |
| `platforms/obsidian/domino-ui.css`                    | Switchable CSS snippet over the installed Obsidian theme  |
| `platforms/manifest.json`                             | Version, fingerprint, default theme and native mode names |

Package paths include `@domlee/ui/tokens.json`, `@domlee/ui/adapters/portfolio.css`, `@domlee/ui/adapters/quartz.css`, `@domlee/ui/adapters/obsidian.css`, and `@domlee/ui/system-manifest.json`. Git installations build through prepare; local-path development should build first. See the adoption guide for pinned Git or packed installs. The standalone folders can be adopted without Node or React in the destination runtime.

## One visual contract, native theme controls

Hybrid is the default when there is no valid explicit selection. It means dark chrome around light working paper. Light and Dark remain deliberate alternatives. All three share five typography roles, the 32px grid, spacing, semantic surface roles, restrained focus, and journal/handwriting conventions.

| Destination      | Native theme contract                                                                  | Preference owner                                          |
| ---------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| React            | `data-theme="hybrid\|light\|dark"`                                                     | `ThemeProvider`, default storage key `domino-theme`       |
| Quartz garden-v5 | `data-notebook-theme="blended\|light\|dark"`; binary `saved-theme` is light for Hybrid | Existing notebook controller and `notebook-theme`         |
| Obsidian         | `body.domino-theme-hybrid`, `domino-theme-light`, `domino-theme-dark`                  | Optional Style Settings class selector; Hybrid without it |

Sharing the design does not synchronize settings between domains or native applications. Each destination persists its own choice using its supported mechanisms. The user-facing mode names, default, and visual meaning stay consistent.

Layouts, editing behavior, search, navigation, content and accessibility semantics remain native. An animated SVG banner can be a React component on the portfolio; an Obsidian note can use a native `[!banner]` callout with the same font and color roles. These are documented adaptations, rather than promises of identical markup or motion in all apps.

## Migration order

1. **Review Domino UI.** Compare all three themes, the original name animation, handwritten rules, banners, forms and paper patterns. Settle shared token changes here first. Treat the visual guide as the acceptance reference.
2. **Personal website.** Start with the live notebook route in `dominicklee.net`. Adopt fonts/tokens and the theme provider, then replace duplicated primitives one section at a time. The optional portfolio bridge is a starter over native variables, not a complete removal of every existing hardcoded paint. Audit the remaining local colors before declaring the migration complete. Preserve content, canonical URLs, the original glyphs, motion sequence, responsive layout and independent archive/legacy routes. Release only after review.
3. **Quartz garden.** Work in `obsidian-site/quartz/work/garden-v5`, the current notebook design. Use the native adapter and retain the existing theme controller, graph events, search, reading mode and Flower Hunt behavior. Follow [the Quartz adoption guide](QUARTZ.md) for asset loading and exact selector compatibility. Avoid editing the older Quartz 4 checkout by mistake.
4. **Obsidian.** Add the generated snippet over AnuPpuccin, preserving its installation and settings. Keep the old `garden.css` for rollback, disable it while the new overlay is enabled, and test Reading, Live Preview and Source in the real app. Follow [the Obsidian adoption guide](OBSIDIAN.md). No private vault content needs to enter this repository.
5. **Record acceptance.** Store the adopted manifest/version beside the destination's integration, with the exact deployed build or installed snippet hash. Keep a short list of any explicitly deferred plugin or page exceptions.

## Updating without drift

Change shared roles in Domino UI, regenerate, inspect the visual guide, run checks, and build one version. Have each consumer adopt that same version deliberately. A destination-specific exception belongs in its adapter with a reason and a reproducible example; a repeated exception should become a shared token or pattern.

For rollback, restore the prior package/bundle and recorded manifest. Web adapters are opt-in through `html.domino-ui`; removing that activation class restores the previous web skin. The Obsidian overlay is reversible by disabling its snippet. Do not overwrite a base theme or replace note content to achieve visual consistency.

## Acceptance still required in each destination

Browser tests in this repository cover the actual React examples and representative native selector fixtures. They do not establish that the adapters have been installed or fully exercised in Quartz or Obsidian.

Before accepting a destination, verify Hybrid/Light/Dark, fresh and saved preferences, loaded fonts, headings/body/metadata/annotations, focus, contrast, reading/source states, forms, code, tables, callouts, long content, mobile/narrow layout, zoom, reduced motion, and print where relevant. Check its existing feature flows and plugin panels. Compare actual screenshots in that runtime against the library reference, then record the adopted fingerprint.

## Shared touch behavior

The personal site’s haptics are captured in the React interaction layer as an opt-in TouchFeedbackProvider, preference setting, InkSwitch, named patterns and animation cues. Preserve them during the portfolio adoption. [Touch feedback and Safari](HAPTICS.md) records exact patterns, browser-managed Safari ticks, current browser limitations, and physical-phone acceptance. Quartz CSS and the Obsidian snippet carry visual tokens; they do not gain a motor API from CSS. Any future runtime feedback integration remains a distinct platform adoption step.
