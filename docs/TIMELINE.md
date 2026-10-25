# A line through a few meaningful moments

`Timeline` presents ordered milestones with a hand-drawn connecting line and nodes. It draws once when it first enters the viewport. A small reveal supports the sequence while the real headings, metadata, descriptions, and links remain ordinary document content.

```tsx
import { useState } from "react";
import { Timeline, type TimelineItem } from "@domlee/ui";
import "@domlee/ui/styles.css";
import "@domlee/ui/fonts.css";

const milestones: readonly TimelineItem[] = [
  {
    id: "begin",
    meta: "01 / BEGIN",
    title: "A small idea",
    description: <p>Write down the thing you keep thinking about.</p>,
  },
  {
    id: "grow",
    meta: "02 / GROW",
    title: "A little momentum",
    description: <p>Give the useful pieces a little room to grow.</p>,
  },
];

export function CreativeProcess() {
  const [replay, setReplay] = useState(0);
  return (
    <section>
      <h2>A creative process</h2>
      <button type="button" onClick={() => setReplay((value) => value + 1)}>
        Draw the timeline again
      </button>
      <Timeline
        items={milestones}
        label="An illustrative creative process"
        replayKey={replay}
      />
    </section>
  );
}
```

Load the shared styles and fonts once at the application's supported entry. The example describes an illustrative process; replace it with real milestones. Keep IDs unique and stable when changing the list. `meta` accepts dates or stage labels and never invents a date for you. For a real date, pass a native `<time dateTime="2026-01-01">January 1, 2026</time>` element.

## API

| Prop                           | Default    | Meaning                                                                       |
| ------------------------------ | ---------- | ----------------------------------------------------------------------------- |
| `items`                        | required   | Readonly `TimelineItem[]`: `{ id, title, description, meta? }`                |
| `label`                        | `Timeline` | Accessible name for the ordered list                                          |
| `animate`                      | `true`     | Draw on first viewport entry                                                  |
| `quiet`                        | `false`    | Show the finished timeline without motion                                     |
| `replayKey`                    | `0`        | A string or number; change it to request another drawing                      |
| Native ordered-list attributes | omitted    | `id`, `className`, `style`, `start`, data/ARIA attributes, and event handlers |

`title`, `description`, and `meta` accept React nodes. Descriptions can contain real links and other useful content. The component renders an `ol`, one `li` per milestone, and an `h3` for each title. Use a surrounding section heading that makes that fixed heading level appropriate. The component supplies no progress status, route handling, date formatting, or automatic advancement.

## Motion and accessibility

The connecting ink and nodes explain the order; they carry no information beyond the list itself. Decorative drawing stays hidden from assistive technology. Essential text is present in the server-rendered document and remains accessible while the ink animates. Item content does not become an interactive replay surface.

Replay belongs to a separate native button, as in the example. Changing `replayKey` requests a fresh drawing without replacing the list or its links; an offscreen replay waits until the list is visible. Scrolling out and back does not create an endless replay. Changing the list's structure after its first run settles the new content without automatically replaying it. There is no autoplay loop, focus movement, click interception, or announcement for decorative motion.

Set `quiet` or `animate={false}` for a finished static list. The operating system's reduced-motion preference also keeps the completed state still. Server rendering and browsers without Intersection Observer show finished, readable content. The pending list stays visible; the running content reveal retains at least 76% opacity and moves only 4px. Keep native link behavior and visible keyboard focus. Do not add `tabIndex` to the list just to make an animation reachable.

The milestones draw in order. With the default tokens, a node inks for 120ms, then its connecting segment draws for 480ms. The next milestone starts 600ms after the previous one. Content reveals over 240ms from its milestone's start; a three-item sequence finishes in about 1.44 seconds. `timeline-duration` and `timeline-stagger` live in `tokens/system.json`. Change canonical tokens and run `npm run build:system` to regenerate their shared CSS variables.

## Composition and adoption

Long headings and descriptions wrap in the normal layout; the rail stays beside the entries rather than becoming a fixed-height image. Check narrow screens, zoom, and a long linked description in the consuming application. Hybrid is the default theme, and the line, nodes, text, and paper follow the shared semantic tokens in Light and Dark as well.

The implementation lives in `src/lib/timeline.tsx` and imports its own CSS. `Timeline`, `TimelineItem`, and `TimelineProps` remain available from the package root and through the existing patterns re-export. Follow [adoption](ADOPTION.md) for package installation, styles, and a reviewed commit pin. The visual catalog's Timeline page demonstrates entry, external replay, quiet mode, and linked content.
