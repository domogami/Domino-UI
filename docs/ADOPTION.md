# Bring Domino UI into another project

Domino UI provides reusable React components, semantic design tokens, original SVG artwork, and native CSS adapters. Keep the design system in [this repository](https://github.com/domogami/Domino-UI); each project consumes a deliberate version. The visual notebook belongs here too, so the examples remain beside the components they demonstrate.

The package is named **`@domlee/ui`**. It is not currently published to the npm registry. Use a pinned Git revision or a locally packed build. React applications need React and React DOM 18 or later. Use Node 24 for Git installations and package builds; the consuming application's runtime remains its own choice.

## Choose the right integration

| Project                    | Use                                                        | Keep native                                                            |
| -------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------- |
| React application          | `@domlee/ui`, component CSS, fonts, and the theme provider | Routing, data, application state, layout, and product behavior         |
| Existing non-React website | Generated tokens and an appropriate native adapter         | Framework, markup, controls, and interaction lifecycle                 |
| Dom's Quartz 5 notebook    | Generated Quartz bundle and its existing theme controller  | Preact/Quartz components, graph, search, reading mode, and Flower Hunt |
| Obsidian                   | Generated standalone CSS snippet over the installed theme  | Editor, vault, Markdown, plugins, and base-theme updates               |

The adapters are implemented here. **Personal-site integration starts with the shared PolaroidStack only. The broader personal-site theme, Quartz site, and Obsidian workspace have not been migrated by this preparation.** A fixture passing in Domino UI does not establish that an adapter works in a destination's actual runtime. The personal photo adapter keeps the site's existing fonts, local palette, motion preference, and haptic controller; it does not install a second theme provider. See [reusable photo stacks](POLAROID-STACK.md) for the data array and integration boundary.

## Install a fixed revision

For a quick exploration of the latest mainline build:

```sh
npm install git+https://github.com/domogami/Domino-UI.git#main
```

From the consuming project's directory, use the full commit SHA of the reviewed Domino UI revision:

```sh
npm install 'git+https://github.com/domogami/Domino-UI.git#<FULL_COMMIT_SHA>'
```

Replace the placeholder before running the command. The Git installation builds the library through its `prepare` script. Commit the resulting dependency declaration and lockfile in the consuming project when its release is authorized. Avoid tracking a moving `main` branch in a production dependency.

For public builds without SSH credentials, check that both the dependency declaration and its lockfile `resolved` entry keep the full `git+https://github.com/domogami/Domino-UI.git#<FULL_COMMIT_SHA>` URL. Some npm versions normalize GitHub installations to a `github:` declaration and a `git+ssh:` lock entry. Preserve HTTPS in the declaration, the lockfile's root dependency, and the package's resolved URL, then verify a clean `npm ci` with `prepare` enabled. The personal-site integration has been checked with a fresh npm cache and SSH disabled.

For local development, create the same distributable package explicitly:

```sh
# In a Domino UI checkout
npm ci
npm pack

# In the consuming project, using the actual generated archive path
npm install /absolute/path/to/domlee-ui-0.1.0.tgz
```

A tarball is a useful review artifact, but an absolute local path is not a portable dependency for another machine or CI. Use a pinned Git revision or an approved package registry for a shared release. Installing the source checkout by local path is possible for development after `npm run build:lib`, but consumer verification should use a packed or Git-installed build.

## Start with one real React surface

Load the styles once from the application's global/client entry. Component CSS includes the shared tokens; font CSS is an explicit import. With Vite and compatible CSS bundlers, the font import resolves bundled font assets and emits self-hosted URLs.

```tsx
import { useState } from "react";
import {
  Button,
  Card,
  NotebookSketch,
  TaskCheckbox,
  ThemeProvider,
  ThemeToggle,
  TouchFeedbackProvider,
  TouchFeedbackSetting,
} from "@domlee/ui";
import "@domlee/ui/styles.css";
import "@domlee/ui/fonts.css";
import "./notebook.css";

export function NotebookPreview({ navigationKey }: { navigationKey: string }) {
  const [taps, setTaps] = useState(0);

  return (
    <ThemeProvider defaultTheme="hybrid">
      <TouchFeedbackProvider navigationKey={navigationKey}>
        <div className="notebook-shell">
          <header>
            <h1>A few good pieces</h1>
            <ThemeToggle />
          </header>
          <main>
            <h2>A small experiment</h2>
            <Card
              title="Make room for a small idea"
              description="Paper, ink, and a little curiosity."
            >
              <NotebookSketch
                variant="notebook"
                replayOnClick
                label="An open notebook and pen, with room to think"
              />
              <TaskCheckbox label="Try the garden's animated task check" />
              <Button
                data-haptic="selection"
                onClick={() => setTaps((value) => value + 1)}
              >
                Try a little tap
              </Button>
              <p role="status">
                {taps
                  ? `Activated ${taps} time${taps === 1 ? "" : "s"}.`
                  : "Ready when you are."}
              </p>
            </Card>
            <TouchFeedbackSetting />
          </main>
        </div>
      </TouchFeedbackProvider>
    </ThemeProvider>
  );
}
```

```css
/* notebook.css: app layout stays in the consuming project. */
.notebook-shell {
  box-sizing: border-box;
  min-height: 100svh;
  padding: clamp(1rem, 4vw, 4rem);
  background: var(--dm-paper);
  color: var(--dm-ink);
  font-family: var(--dm-font-body);
  line-height: 1.7;
}

.notebook-shell > header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--dm-space-4);
  margin-bottom: var(--dm-space-8);
}

.notebook-shell h1 {
  font-family: var(--dm-font-heading);
}

.notebook-shell > main {
  max-width: 48rem;
  margin-inline: auto;
}
```

Pass your router's changing location value as `navigationKey`; no router dependency is required by Domino UI. Mount each provider once at the appropriate app boundary. A React Server Components application needs a client boundary for these interactive providers and controls, with global styles loaded from its supported layout entry. For SSR, align the initial `data-theme` and saved preference before paint without introducing a server/client hydration mismatch. The library does not install a router, reset the entire document, or supply your app shell.

## Preserve the visual contract

Hybrid is the default when no valid preference exists. `ThemeProvider` exposes Light, Hybrid, and Dark and stores the explicit choice under `domino-theme` by default. Hybrid means light working paper with charcoal navigation; a wholly light preview panel is not a substitute for styling an application's navigation region. Use `--dm-sidebar`, `--dm-sidebar-ink`, and related sidebar roles for that region. Primary accents and annotations on Hybrid paper use teal `#0e7c79` through `--dm-accent`.

Poppins provides structure, Lexend body text, IBM Plex Mono metadata/code, Kalam lettered headings, and Caveat short handwritten annotations. Keep the 32px dot-grid rhythm, narrow rounded sketch strokes, restrained paper shapes, and readable native controls. Reuse the shared `Chevron` rather than a text caret. Follow [the design guide](../DESIGN.md) and [accessibility contract](ACCESSIBILITY.md) for the details.

For original drawing examples, `NotebookSketch` supports `notebook`, `flight`, `garden`, `camera`, `keyboard`, and `compass`. Set `replayOnClick` for native click, tap, Enter, and Space replay. `HairlineSketch` supports `riffle`, `branches`, and `loupe`; its replay is an ink sweep, while `play` separately enables the upstream guided tour. Quiet/reduced-motion modes keep completed still art. See [sketch APIs, assets, and attribution](SKETCHES.md).

## Fonts and static artwork

For a static asset pipeline or non-React destination, the package provides a copy command:

```sh
npx --no-install domino-ui-assets ./public
```

It copies `fonts/` and `sketches/` into the supplied public directory, retaining font notices. Existing files with different contents are protected unless replacement is explicitly requested. Serve that directory through the target framework's real public asset mechanism; check nested base paths rather than assuming `/` is correct. Static sketch filenames follow `{variant}-{hybrid|light|dark}.svg` and contain their caption font and OFL notice. They are completed illustrations, not animated React components.

Standalone web adapter folders already include their font assets beside their CSS. Preserve that relative directory structure. Obsidian's generated snippet embeds its fonts and notices. Keep [font and artwork provenance](ASSETS.md), including the Hairline MIT license, with redistributed assets.

## Touch feedback and Safari

Touch feedback is optional. Use one `TouchFeedbackProvider`, the shared preference setting, and semantic `data-haptic` values (`tap`, `selection`, `draw`, `success`, `error`). Keep ordinary visual feedback, labels, keyboard behavior, and readable status messages. Avoid duplicate feedback controllers when migrating an existing site.

Supported Vibration API browsers can request the named patterns after trusted touch/pen input. Safari does not provide a general `navigator.vibrate` path. A supported iPhone/Safari combination may give a browser-managed tick from a directly activated real native switch; `InkSwitch` and the provider preserve that progressive enhancement. Scripted clicks and timers cannot provide custom Safari haptic patterns. Reduced motion and the shared off setting silence the enhancement. For scrolling-sensitive controls, `data-native-tap="none"` excludes the Safari auxiliary target; `nativeTapTargets={false}` disables those targets for the entire provider. Read [the complete haptics guide](HAPTICS.md) before enabling it in a destination. Desktop WebKit tests do not prove a physical motor pulse.

## Native Quartz and Obsidian adoption

Run `npm run build:system` in Domino UI to generate `platforms/portfolio/`, `platforms/quartz/`, `platforms/obsidian/`, and `platforms/manifest.json`. Generated `platforms/` output is recreated by builds and is not a source file to edit. Packaged exports include `@domlee/ui/adapters/portfolio.css`, `@domlee/ui/adapters/quartz.css`, `@domlee/ui/adapters/obsidian.css`, and `@domlee/ui/system-manifest.json`.

Follow [Quartz's guide](QUARTZ.md) for its stylesheet hook, font placement, and `html.domino-ui` activation. Dom's current design lives in `obsidian-site/quartz/work/garden-v5`; its native Hybrid value is `data-notebook-theme="blended"` with binary `saved-theme="light"`. Preserve the existing controller rather than adding the React provider. Do not accidentally migrate the older Quartz 4 checkout.

Follow [Obsidian's guide](OBSIDIAN.md) to add the generated CSS snippet over AnuPpuccin. Preserve the installed base theme and its updates. Disable the earlier Garden overlay while the Domino overlay is enabled, keeping it available for rollback. No React runtime, vault-content rewrite, or base-theme edit is needed. These CSS adapters do not add JavaScript sketch animation or haptics.

## Update, verify, and record

Shared values belong in `tokens/system.json`; regenerate with `npm run build:system`. Fix reusable component behavior in `src/lib/` and native mappings in `src/adapters/`. Avoid copying CSS or artwork into several projects and then tuning the copies independently. A unique product layout can stay local; a repeated design decision should be fixed in the shared system.

Record the installed Git revision/package version and `system-manifest.json` fingerprint in the destination's adoption notes. Adopt updates deliberately, retain the previous revision for rollback, and review [the shared-system guide](SHARED-SYSTEM.md) when changing tokens.

Verify the actual consuming application's production build and preview: successful font requests; fresh/saved Hybrid, Light, and Dark; desktop and narrow reflow; long labels; keyboard focus; disabled/loading states; replay and reduced motion. Exercise existing routes and features that the migration touches. Inspect the built output as well as the development server: a missing stylesheet can leave unstyled SVGs even when component logic passes. Test Safari haptics on the physical target device before claiming tactile support. Report the destination checks separately from Domino UI's own tests.

Use [the ready-to-paste agent prompt](AGENT-PROMPT.md) to carry this contract into another project.
