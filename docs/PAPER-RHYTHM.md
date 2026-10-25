# Paper lines leave room for the words

A notebook rule belongs between the ink or just below its writing edge. It must never pass through a letter, descender, control, or figure. Readable content takes priority over filling every row with a line.

`Paper pattern="lined"` treats ruling as part of text layout. Its rules follow the content's actual padding and measured geometry. A full-width rule is omitted when it would intersect protected content or its clearance area. The resulting quiet bands around headings and rich content are intentional.

```tsx
import { Paper } from "@domlee/ui";
import "@domlee/ui/styles.css";
import "@domlee/ui/fonts.css";

export function NotebookPage() {
  return (
    <Paper pattern="lined" ruleAlign="between" padding="md">
      <h2>A little room for curiosity</h2>
      <p>
        One useful thought, then another. Let the words find their own space.
      </p>
      <p>A longer paragraph can wrap naturally while the guides stay clear.</p>
    </Paper>
  );
}
```

Use `ruleAlign="baseline"` for the closer writing-guide treatment. Both alignments obey the same ink-clearance requirement. Load the shared styles and fonts once at the application's supported entry, following the [adoption guide](ADOPTION.md).

## API and layout

| Prop                  | Default   | Meaning                                                              |
| --------------------- | --------- | -------------------------------------------------------------------- |
| `children`            | omitted   | Native text, headings, prose, and rich content                       |
| `pattern`             | `dotted`  | `dotted`, `lined`, or `plain`                                        |
| `padding`             | `md`      | Existing `sm`, `md`, or `lg` paper inset                             |
| `ruleAlign`           | `between` | Lined-paper guide placement: `between` or `baseline`                 |
| Native div attributes | omitted   | `id`, `className`, `style`, data/ARIA attributes, and event handlers |

The existing dotted/plain patterns and padding API remain available. `ruleAlign` applies to lined paper. The component remains an ordinary `div`; the application supplies the correct headings, paragraphs, lists, and landmarks. Rules are decorative and add no focus stop or announcement.

Lined prose follows a 32px rhythm. A large heading can reserve 64px or another appropriate whole-row multiple; it does not have to fit inside one 32px line. Oversized headings, controls, code, figures, and other rich regions may need unruled bands. Do not shrink their text or clip their contents to make the grid appear complete.

Rule omission happens across the whole row. Lined Paper adds one stable content wrapper beside its decorative SVG layer. Measurement never wraps individual glyphs, reorders or remounts existing children, paints opaque letter patches, or clips content. Dotted/plain Paper keep their direct child structure. Native links and controls retain their behavior.

Native controls, figures, code blocks, tables, images, and embedded drawings reserve clear bands. Mark another custom rich region with `data-paper-unruled` when it needs the same treatment.

## Shared rhythm tokens

| Canonical token           | Default | Purpose                                              |
| ------------------------- | ------- | ---------------------------------------------------- |
| `paper-rule-pitch`        | `32px`  | Base distance between candidate rules                |
| `paper-rule-clearance`    | `3px`   | Protected space around measured ink and rich content |
| `paper-rule-guide-offset` | `2px`   | Closer writing-guide phase for baseline alignment    |

The rule origin follows the actual content inset, including responsive padding. Baseline alignment moves the guide phase closer to the writing edge; the clearance check still decides which rules can appear. Custom font metrics and content can therefore change the number of visible rules.

Edit `tokens/system.json` and run `npm run build:system` to regenerate canonical values. Keep pitch, prose leading, heading spacing, and guide placement coherent when customizing a consuming application. A bigger font alone is not evidence that the old pitch remains safe.

## Measurement and readable fallback

Font loading, resizing, content changes, and zoom can change where ink lands. Ruling must be recalculated against that geometry. While safe positions are unknown, the content remains readable on an unruled sheet. Relevant text animation can temporarily remove rules until its geometry settles. Unsupported rotation, perspective, or writing modes also keep the sheet safely unruled. Server rendering and a page without JavaScript use that same safe unruled fallback.

The rule is stronger than reducing a line's opacity. A faint line through a glyph still breaks the writing-guide relationship. A repeating gradient placed behind arbitrary rich text cannot guarantee clearance: different fonts, paragraph margins, wrapped lines, headings, and responsive padding change the alignment independently.

An application's own ruled surface should use this same layout-aware contract. Do not recreate the old background gradient and assume a 32px pitch will automatically align every descendant. This guide establishes the shared design principle; it does not claim that the personal site, Quartz, or Obsidian has already adopted the new ruled-paper implementation.

## Dot grids and other ink

Dots are separate, discrete marks rather than continuous horizontal rules. Keep them quiet, place text deliberately in the available space, and soften or clear the texture behind dense reading copy when necessary. Ink clarity still wins. Dotted and plain Paper do not acquire the lined prose layout merely because they share the paper palette.

An intentional completed-task strike conveys task state and retains its own meaning. Skeleton shimmer and folded-paper shading are different effects as well; they are not notebook ruling.

## Acceptance checks

Review both guide alignments in Hybrid, Light, and Dark. Include narrow widths, changed padding, long wrapped paragraphs, all five supplied fonts, large headings, and descenders such as `g j p q y`. Check real glyph ink and clearance rather than treating a line-box rectangle as a complete measure of visible letters.

Repeat the check after fonts finish loading, at browser zoom, after text changes, and with mixed lists, links, code, controls, and figures. Verify that safe rows remain full-width, unsafe rows are omitted, content is never clipped or patched, and the no-JavaScript/server-rendered sheet stays readable. The catalog's Paper and foundation specimens should demonstrate this contract with the same props as their copyable examples.
