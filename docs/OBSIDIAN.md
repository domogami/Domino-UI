# Obsidian adapter

Domino UI can supply the same fonts, semantic palette, dot grid, headings, callouts and native controls to Obsidian. The integration is an independent CSS snippet over the existing theme. AnuPpuccin remains installed and can keep receiving updates. The snippet does not fork its source or edit its Style Settings values.

This is a prepared adapter in the Domino UI repository. It has not been installed or visually verified in the user's running Obsidian app. A browser fixture can check the role mapping and three themes, but cannot establish compatibility with every Obsidian version, community plugin, mobile view or AnuPpuccin layout option.

## Files and build

- `tokens/system.json` is the canonical shared token source; `src/styles/tokens.css` is its generated web stylesheet.
- `src/styles/fonts.css` contains the generated shared font family definitions.
- `src/adapters/obsidian.css` maps those values to native Obsidian variables and Markdown selectors.
- `platforms/obsidian/domino-ui.css` is the generated, standalone installable snippet. Its font files are embedded with their SIL Open Font License notices, so it can work offline without remote font requests.

Run `npm run build:system` to regenerate adapters after changing `tokens/system.json`, fonts or the mapping. The package export is `@domlee/ui/adapters/obsidian.css`; the same generated file is used for manual installation. `platforms/manifest.json` records the implementation version. Copy the generated file into a vault only during the later adoption step; copying the source adapter alone would omit its tokens and fonts. Do not hand-edit generated output to tune the design system.

## Planned installation

1. In Obsidian, open Settings → Appearance → CSS snippets and use the folder button to locate this vault's snippets directory.
2. Copy the generated `platforms/obsidian/domino-ui.css` into that directory. Leave the existing `garden.css` file in place as a rollback copy.
3. Reload snippets, disable `garden`, then enable `domino-ui`. These two overlays both style notes and should not be active together. Keep the installed AnuPpuccin theme selected.
4. With the existing Style Settings plugin enabled, open Settings → Style Settings → Domino UI → Appearance and choose **Hybrid**, **Light** or **Dark**. Hybrid is the default, including when the plugin is absent.
5. Open a neutral test note in Reading, Live Preview and Source mode. Check file navigation, note properties, settings, command palette, links, tables, callouts, checkboxes, text selection and keyboard focus. Check a narrow window and the actual mobile app before enabling the snippet there.

To reverse the change, disable `domino-ui` and re-enable `garden` if desired. The adapter changes no note content, layout settings, theme files, community plugin data or saved AnuPpuccin settings.

The existing Garden overlay was inspected on October 22, 2026 at `Dom's 2nd Brain/.obsidian/snippets/garden.css` in the iCloud Obsidian documents directory. That source confirms the user's additive overlay pattern, embedded Poppins/Lexend fonts and continuous note grid. Only the known snippet and installed theme/plugin implementation sources were inspected; private note contents were not needed.

## Appearance contract

| Choice          | Body class                                         | Document panes             | Application chrome            |
| --------------- | -------------------------------------------------- | -------------------------- | ----------------------------- |
| Hybrid, default | `domino-theme-hybrid`, or no explicit Domino class | Shared light paper and ink | Shared charcoal sidebar roles |
| Light           | `domino-theme-light`                               | Shared light paper and ink | Shared light sidebar roles    |
| Dark            | `domino-theme-dark`                                | Shared dark paper and ink  | Shared dark sidebar roles     |

The optional Style Settings `class-select` control applies one of these classes directly to `document.body` and persists the selection through that plugin. The contract was verified against the locally installed plugin implementation and AnuPpuccin's existing setting schema. Obsidian's native `theme-light` or `theme-dark` class may still be present; it does not decide Domino's appearance. This gives Hybrid the same default across all destinations.

The generated tokens make the fallback explicit: a body without `domino-theme-light` or `domino-theme-dark` receives Hybrid roles, and explicit selections override that fallback. A note's `cssclasses` property applies to a note container and cannot change this application-wide setting. Without Style Settings, the snippet supplies Hybrid and dot controls use their defaults; no custom JavaScript plugin is required.

The palette has two regions. Chrome consumes `--dm-sidebar`, `--dm-sidebar-ink`, `--dm-sidebar-muted`, `--dm-sidebar-border`, `--dm-sidebar-active` and `--dm-sidebar-accent`. Markdown leaves reset their native roles to `--dm-paper`, `--dm-surface`, `--dm-ink`, `--dm-muted`, `--dm-border` and `--dm-accent`. Native controls inherit from their own region. Hybrid notes explicitly use the light native control scheme, while the charcoal application chrome uses the dark scheme.

The mapping also sets the native interface/body/monospace fonts and AnuPpuccin's existing editor font hooks. Poppins supplies note headings, Lexend supplies reading and interface text, IBM Plex Mono supplies code, Kalam supplies optional banners and Caveat supplies optional handwritten annotations. Existing pane geometry, file width preferences and heading size preferences remain controlled by Obsidian and the base theme.

## Markdown vocabulary

These are native callouts, so the note remains usable without Domino UI. Handwriting is reserved for a short aside; its supporting body stays in the shared reading font.

```md
> [!annotation] A thought to come back to
> Longer explanation remains ordinary body text.

> [!banner] This week's experiments
> Use the banner as a short section label.

> [!tip] Worth a try
> Native callout icons and explicit titles retain the meaning.

- [ ] Test an idea
- [x] Finish the first pass
```

`annotation` and `banner` are visual treatments. The CSS banner is a compact notched strip adapted for native callout markup; it does not reproduce the portfolio's animated folded SVG ribbon. Ordinary Markdown heading hierarchy should still provide the document outline. Existing Quartz annotation snippets may provide extra arrow metadata; consolidate those styles before adopting Domino to avoid two adapters competing for the same callout. This adapter does not add an arrow-metadata parser or animation.

Task checkboxes keep Obsidian's native editable behavior and Markdown serialization. The five journal marks in the design guide describe written journal notation and are not substituted for interactive checkboxes. The exact animated “Dom Lee.” wordmark remains a shared web asset; CSS does not inject it into Obsidian chrome or into note content.

## Dot controls and limits

Style Settings exposes dot visibility (`--dm-obsidian-dot-strength`, default `1`) and spacing (`--dm-obsidian-grid-size`, default `32px`). The defaults follow canonical grid tokens; setting visibility to `0` removes the texture. Reading and editor scroll surfaces own the grid, with a translucent paper wash immediately behind text. Printed note backgrounds are removed.

The source adapter deliberately limits its structural selectors to native Markdown regions and known application controls. Canvas, PDF viewers, plugin-specific panes, embedded web content, syntax token colors and custom rainbow folder rules need their own adoption checks. A plugin may paint directly from its own palette instead of native variables. Future fixes should extend this adapter from a reproducible example rather than editing AnuPpuccin or distributing private vault configuration.
