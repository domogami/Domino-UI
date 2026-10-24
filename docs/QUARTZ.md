# Quartz adapter

This adapter prepares Domino UI for Dom Lee's existing Quartz 5 notebook. It maps the shared design tokens onto Quartz's native CSS variables and the notebook's existing markup. It does not require React.

**Status: prepared in Domino UI; not installed or verified in the destination Quartz runtime.** The destination checkout has not been modified. Importing the stylesheet alone has no effect: `html.domino-ui` is the explicit activation boundary.

## Files and generation

- Canonical design decisions: [`tokens/system.json`](../tokens/system.json).
- Generated standalone stylesheet: [`platforms/quartz/domino-ui.css`](../platforms/quartz/domino-ui.css).
- Native variable mapping source: [`src/adapters/quartz.css`](../src/adapters/quartz.css).
- Package stylesheet export: `@domlee/ui/adapters/quartz.css`.

Run `npm run build:system` after changing canonical tokens or adapter source. Use the generated standalone stylesheet in Quartz; it includes the native-selector token blocks before the mapping rules. The source adapter by itself expects `--dm-*` tokens to be present.

## Verified native theme contract

The source inspection used `obsidian-site/quartz/work/garden-v5` on 2026-10-22.

| User-facing mode | Notebook attribute on `<html>`  | Quartz attribute on `<html>` | Article / navigation   |
| ---------------- | ------------------------------- | ---------------------------- | ---------------------- |
| Light            | `data-notebook-theme="light"`   | `saved-theme="light"`        | Light / light          |
| Dark             | `data-notebook-theme="dark"`    | `saved-theme="dark"`         | Dark / dark            |
| Hybrid           | `data-notebook-theme="blended"` | `saved-theme="light"`        | Cream paper / charcoal |

`saved-theme="blended"` is not part of this notebook's contract. `theme.inline.ts:5-7` defines the three internal values and the Hybrid label; `:11-19` defaults to `blended`; `:26-32` applies both attributes. Native graph and syntax behavior still receives the binary Quartz `saved-theme` value.

The generated CSS uses `html.domino-ui` for a Hybrid fallback, then explicit `html.domino-ui[data-notebook-theme="light"]`, `html.domino-ui[data-notebook-theme="dark"]`, and `html.domino-ui[data-notebook-theme="blended"]` token scopes. Keep the existing notebook controller so its attributes, labels, reading mode, graph events, and keyboard behavior remain authoritative.

Quartz persists its explicit three-mode choice under `notebook-theme` (`theme.inline.ts:18-19,48-52`). The React library uses its separate `domino-theme` preference. These keys remain independent; sharing a visual contract does not require sharing browser storage. An absent or invalid notebook preference means Hybrid. Do not derive the initial three-mode choice from Quartz's legacy binary `theme` key.

## Semantic mappings

| Quartz variable                     | Domino role                         |
| ----------------------------------- | ----------------------------------- |
| `--light`                           | `--dm-paper`                        |
| `--lightgray`                       | `--dm-border`                       |
| `--gray`                            | `--dm-muted`                        |
| `--darkgray`, `--dark`              | `--dm-ink`                          |
| `--secondary`                       | `--dm-accent`                       |
| `--tertiary`                        | `--dm-terracotta`                   |
| `--highlight`                       | Accent at 8% over transparency      |
| `--textHighlight`                   | Accent at 24% over transparency     |
| `--titleFont`, `--headerFont`       | `--dm-font-heading`                 |
| `--bodyFont`                        | `--dm-font-body`                    |
| `--codeFont`                        | `--dm-font-mono`                    |
| `--notebook-grid`, `--notebook-dot` | `--dm-grid-size`, `--dm-grid-color` |

The left sidebar uses `--dm-sidebar`, `--dm-sidebar-ink`, `--dm-sidebar-muted`, `--dm-sidebar-border`, and `--dm-sidebar-accent`. This keeps Hybrid's charcoal navigation independent of its cream article. Reading mode deliberately returns the compact toolbar to article colors. Hybrid search keeps a charcoal result list and a cream preview, including while reading mode is active.

The adapter also maps the existing graph ribbon, annotation and quote handwriting, metadata and code fonts, native input colors, and keyboard focus. It keeps native controls and the existing task-checkbox implementation. It does not replace Quartz's grid, explorer, modal lifecycle, graph renderer, animation geometry, reading-mode layout, breakpoints, or Flower Hunt placement.

## Integration when the migration is ready

1. Generate the standalone bundle in Domino UI and copy the **whole** `platforms/quartz/` directory into the Quartz checkout as `quartz/static/domino-ui/`. Keep `domino-ui.css`, `fonts/`, and the font license files together. Quartz's built-in Static emitter copies this tree into the generated site's `static/domino-ui/` directory.
2. Load `static/domino-ui/domino-ui.css` as a separate stylesheet after the existing CSS. The inspected YAML configuration supports local transformer plugins; their `additionalHead` resources are rendered after normal styles. A proposed local plugin for this hook is shown below. Keep the generated CSS unchanged so its relative `./fonts/` URLs resolve beside it. Do not pass this font bundle through `@use` into a different output path.
3. Activate the adapter in the existing prepaint `applyPreferences()` function, alongside its current attribute updates:

   ```ts
   root.classList.add("domino-ui");
   // Keep the existing saved-theme and data-notebook-theme updates.
   ```

4. The generated bundle supplies the shared Poppins, Lexend, IBM Plex Mono, Caveat, and Kalam font faces. The current notebook registers its handwriting asset as `Notebook Caveat`; the adapter deliberately uses the canonical `Caveat` role from the bundle. Verify the bundled font requests succeed before removing any redundant destination font loading.
5. Rebuild the notebook components with `node site/notebook/build.mjs` after editing `theme.inline.ts`; regenerate the plugin index with `node --import tsx quartz/plugins/loader/install-plugins.ts` after adding the local plugin. Then run the destination repository's documented type checks and Quartz build/preview.

Remove the root class to deactivate the adapter. Keep it out of the default destination build until the actual migration is reviewed. Later token updates can replace the generated CSS without hand-copying palette values into `quartz.config.yaml` or individual notebook partials.

### Proposed stylesheet hook

This is integration code to add during the future migration; it has not been installed. It uses the verified `additionalHead` extension point rather than replacing the core Head component. A no-op Markdown plugin list supplies the transformer's required category contract; it does not change note content. The resource callback uses `pathToRoot` and the configured base path, including Quartz's special 404 path behavior.

Create `site/notebook/plugins/domino-styles/package.json`:

```json
{
  "name": "@domlee/domino-styles",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./index.js" },
  "quartz": {
    "name": "domino-styles",
    "displayName": "Domino styles",
    "description": "Opt-in shared design system stylesheet",
    "version": "1.0.0",
    "quartzVersion": ">=5.0.0 <6.0.0",
    "category": ["transformer"]
  }
}
```

Create `site/notebook/plugins/domino-styles/index.js`:

```js
import { h } from "preact";
import { joinSegments, pathToRoot } from "@quartz-community/utils";

export default function DominoStyles() {
  return {
    name: "DominoStyles",
    markdownPlugins: () => [],
    externalResources(ctx) {
      const baseUrl = ctx.cfg.configuration.baseUrl ?? "example.com";
      const notFoundBase = new URL(`https://${baseUrl}`).pathname;
      return {
        additionalHead: [
          (page) =>
            h("link", {
              rel: "stylesheet",
              href: joinSegments(
                page.slug === "404"
                  ? notFoundBase
                  : pathToRoot(page.slug ?? "index"),
                "static/domino-ui/domino-ui.css",
              ),
              "data-persist": true,
            }),
        ],
      };
    },
  };
}
```

Add to the existing `plugins:` list in `quartz.config.yaml`:

```yaml
- source: ./site/notebook/plugins/domino-styles
  enabled: true
  order: 100
```

## Destination verification still required

Check all three themes on an article, folder/tag listing, search results and preview, graph, callouts, code blocks, tasks, and reading mode. Check desktop, tablet, and mobile mastheads; keyboard focus and native controls; reduced motion, forced colors, and print. Confirm all five font roles actually load, a fresh visitor gets Hybrid, a saved choice survives navigation/reload, and the native graph receives theme-change events. Check Flower Hunt on mobile in its destination footer. These are migration acceptance checks, not a claim of completed destination testing.

## Source evidence

These references describe the inspected destination checkout, not a generic Quartz installation:

- `site/notebook/theme.inline.ts:5-19,26-52,64-97`: mode values, default, storage keys, DOM attributes, graph event, lifecycle, and keyboard controls.
- `quartz.config.yaml:16-44`: current Poppins/Lexend/IBM Plex Mono roles and native light/dark palette.
- `quartz/util/theme.ts:176-205`: emitted native root color/font variables and binary dark selector. Its theme variables are appended after component styles; the adapter uses stronger opt-in selectors rather than depending only on load order.
- `quartz/styles/custom.scss:1-11`: existing notebook import entry point.
- `quartz/plugins/emitters/static.ts:7-19`: built-in recursive static asset copying.
- `quartz/plugins/index.ts:4-21`, `quartz/components/Head.tsx:25-28,101-110`: transformer resource collection, nested/404 base-path handling, and the late `additionalHead` hook.
- `quartz/plugins/loader/config-loader.ts:322-350,431-482,531-545`: local plugin categories, factory loading, and the required transformer method contract.
- `site/notebook/notebook.scss:3-24,26-63,89-145,176-249`: local Caveat asset, grid dots, shared article layout, metadata, quote type, focus, and mobile geometry.
- `site/notebook/hybrid.scss:5-43,46-103`: exact Hybrid selector, local charcoal sidebar variables, blue quote surface, desktop paint continuation, and mobile masthead.
- `site/notebook/search.scss:3-47`: Hybrid search's independent result-list and preview palettes.
- `site/notebook/controls.scss:9-86,141-210`: native toolbar controls and reading-mode sidebar palette reset.
- `site/notebook/NotebookTheme.tsx:6-51`, `site/notebook/NotebookBrand.tsx:8-35`: actual toolbar and brand component markup.
- `site/notebook/annotations.scss:2-42`, `site/notebook/motion.scss:6-44`, `site/notebook/tasks.scss:1-37,64-90`: annotation handwriting, existing ribbon markup styles, native checkboxes, reduced motion, print, and forced colors.
