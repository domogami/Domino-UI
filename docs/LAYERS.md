# Paper layers

A small thought can sit beside its source. An important decision can take the foreground. Domino's layers use opaque paper, clear ink, and a visible edge to make that difference readable.

Run the notebook and open **`/#layers`** for the composed study, or **`/#component/popover`**, **`/#component/notification-card`**, **`/#component/dialog`**, and **`/#component/toast`** for the individual APIs. These are local notebook routes, not a published hosting address.

## What we learned from Pebble

Pebble's design guidance values quick comprehension, a few meaningful colors, prominent information, direct actions, and brief motion that explains a change. We can borrow that discipline while keeping Dom's paper, typography, and handwriting.

| Verified reference                                                                                                                                                                                                                                   | Translation into Domino                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Notification summaries use an icon, title, and first line before opening the full message. Important data uses larger, bolder text. [Core Experience Design](https://developer.repebble.com/guides/design-and-interaction/core-experience/)          | Separate source/time, title, body, and actions. Keep a notification readable before it is opened.                                       |
| Cards collect a complete set of useful information, reducing repeated menu levels. Action menus slide into view and identify their depth. [Recommended Guidelines](https://developer.repebble.com/guides/design-and-interaction/recommended/)        | Keep a popover self-contained. Use a visible paper edge and a queue count; open another layer only for a distinct task.                 |
| Message dialogs communicate a result; choice dialogs make a decision explicit. Card transitions show old data leaving and new data arriving. [Example Implementations](https://developer.repebble.com/guides/design-and-interaction/implementation/) | Distinguish passive notification, contextual popover, modal decision, and operation feedback. Use one short entrance and a faster exit. |
| Quick View can partially cover an app while the remaining layout adjusts. [Unobstructed Area](https://developer.repebble.com/guides/user-interfaces/unobstructed-area/)                                                                              | Preserve context around a nonmodal layer, constrain it to the available viewport, and keep its body scrollable.                         |
| Layouts should account for content size and avoid fixed content dimensions. [Content Size](https://developer.repebble.com/guides/user-interfaces/content-size/)                                                                                      | Wrap long copy and actions; let the viewport constrain the surface rather than clipping the message.                                    |

**The adaptation boundary:** single paper surfaces, fine pen outlines, unfolding motion, Caveat annotations, warm paper, and teal accents are Domino decisions. They are not claimed as Pebble specifications. These references establish interaction and hierarchy; no Pebble font, icon, illustration, or application code is included. The study does not claim pixel fidelity to Pebble screenshots or hardware rendering.

## Pick the smallest useful layer

| Component          | Use it for                                                                           | Behavior                                                                              |
| ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `NotificationCard` | A complete message, an inbox item, or the visible item in an application-owned queue | Ordinary `article`; no live announcement, focus movement, timing, or dismissal policy |
| `Popover`          | Contextual details or a few controls beside a trigger                                | Anchored nonmodal dialog; outside interaction or leaving focus dismisses it           |
| `Dialog`           | A focused task or decision that needs the user's attention                           | Native modal dialog; background becomes inert and focus stays inside                  |
| `Drawer`           | A longer modal task that benefits from an edge-aligned surface                       | The `Dialog` contract with `side="left"` or `side="right"`                            |
| `Toast`            | Feedback about an operation the user performed                                       | Status announcement, or alert for `tone="danger"`; does not move focus                |

An ordinary update should not require dismissing a modal. A notification card is not a browser push-notification API. A toast is not an inbox or a global notification manager.

## A working React composition

This example keeps all state in memory. The application owns saving, persistence, queues, and delivery. Load these styles once at the supported application entry; framework-specific client boundaries follow the [adoption guide](ADOPTION.md).

```tsx
import { useRef, useState } from "react";
import {
  Button,
  Dialog,
  NotificationCard,
  Popover,
  TaskCheckbox,
  ThemeProvider,
  ThemeToggle,
  Toast,
} from "@domlee/ui";
import "@domlee/ui/styles.css";
import "@domlee/ui/fonts.css";

export default function NotebookLayers() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);

  return (
    <ThemeProvider defaultTheme="hybrid">
      <main
        style={{
          display: "grid",
          gap: "24px",
          padding: "24px",
          background: "var(--dm-paper)",
          color: "var(--dm-ink)",
        }}
      >
        <ThemeToggle />
        <NotificationCard
          source="Journal"
          time="Just now"
          title="A little room for a new idea"
          count={3}
          surface="ink"
          actions={
            <Button ref={opener} onClick={() => setConfirmOpen(true)}>
              Review note
            </Button>
          }
        >
          <p>
            Keep the useful thought together with its source and next action.
          </p>
        </NotificationCard>

        <Popover
          trigger={<Button variant="secondary">Writing preferences</Button>}
          title="A quieter page"
          description="A few details beside the control that opened them."
          align="start"
        >
          <TaskCheckbox label="Leave space in the margin" defaultChecked />
        </Popover>

        <Dialog
          open={confirmOpen}
          returnFocusRef={opener}
          onClose={() => setConfirmOpen(false)}
          title="Keep this thought?"
          motion="fold"
          eyebrow="A note for later"
          surface="ink"
          description="A focused decision, with a clear way back."
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Keep writing
              </Button>
              <Button
                onClick={() => {
                  setSaved(true);
                  setConfirmOpen(false);
                }}
              >
                Mark as saved
              </Button>
            </>
          }
        >
          <p>This demonstration changes its own state without saving a file.</p>
        </Dialog>

        {saved && (
          <Toast
            title="A thought kept"
            eyebrow="Journal"
            description="Marked as saved in this example."
            onDismiss={() => setSaved(false)}
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSaved(false)}
              >
                Undo
              </Button>
            }
          />
        )}
      </main>
    </ThemeProvider>
  );
}
```

## Component contracts

### NotificationCard

`source`, `title`, and `children` are required. Optional `time`, `icon`, and `actions` accept React content. `surface` is `"paper"` by default; `"ink"` gives its header an inverse semantic ink/paper treatment. This deliberately changes with the active theme.

`count` represents the total application queue, including the current item. Values above one show a readable **“N in queue”** badge on the same single sheet. There are no duplicate backing cards or hidden messages. A thin accent seam and one quiet ink edge give the surface presence without illustrating the queue as a stack. The host supplies the currently visible content and any navigation. Finite values are rounded down with a minimum of one; other values behave as one.

Native article attributes and a forwarded `HTMLElement` ref are supported. The title supplies its accessible name unless the consumer provides `aria-label` or `aria-labelledby`. Custom icons are decorative; put any essential meaning in the title or body. Place the component in an application-owned live region only when delivery genuinely needs an announcement; do not announce an entire inbox on every render.

### Popover

Supply one focusable `trigger` that forwards its ref to a DOM element, plus `children`. Domino's `Button` works directly. Use `title` for a visible accessible name, or `label` if there is no title. Optional `description`, `eyebrow`, `footer`, and `closeLabel` customize the surrounding content. `side` is `"top"` or `"bottom"`; `align` is `"start"`, `"center"`, or `"end"`.

An uncontrolled instance uses `defaultOpen`; a controlled instance uses `open` with `onOpenChange`. Update the supplied state when a close is requested. Keep the component mounted so its exit can finish. Opening focuses a content control, or the panel when it has no interactive content. Escape and the close control restore the trigger. Tab can leave the popover; outside taps and moving focus outside dismiss it without pulling focus back from the new destination.

Where supported, the native Popover API places the surface in the browser's top layer while preserving its DOM relationship. It uses manual native behavior with React-owned dismissal and state. The fallback portals into the nearest open dialog or the document body. Use the application-level `ThemeProvider` so both paths share document tokens. The panel can flip above or below its trigger, repositions on scrolling/resizing, and constrains its body to available viewport space. It is nonmodal and does not trap focus.

### Dialog and Drawer

Pass `returnFocusRef` for an explicit opener, especially on Safari where tapping a button does not always focus it. The ref is used only after the modal closes and only while its target remains connected. Without it, the browser restores the previously focused element. Keep the opener available while a task is open.

`Dialog` requires `open`, `onClose`, and `title`. It accepts `description`, `footer`, `closeLabel`, `eyebrow`, a decorative `icon`, `surface="paper" | "ink"`, and `motion="fold" | "settle"`, plus native dialog attributes. The default `"fold"` brings one connected note softly in from the right while the attached body/footer fold opens. The header stays locally flat with solid paper paint and follows the shared whole-note fade; it has no separate opacity or hinge animation. A counter-hinge keeps the footer attached, and a light crease settles with the paper. Dismissal coordinates the rightward movement, connected fold/tuck, and whole-note fade. Choose `"settle"` for a quieter utility surface. `Drawer` adds `side="left" | "right"`, always uses settle motion, and does not expose a `motion` prop. The notebook command palette also uses settle motion.

The native `showModal()` path provides top-layer placement, modal focus handling, background inertness, and focus restoration. `onClose` requests an update to application state; it is not a replacement for setting `open={false}`. Escape requests closure. `closeOnBackdrop` defaults to `true`; set it to `false` when an accidental outside tap must not abandon a task. A backdrop dismissal must begin and end outside the surface. The named close control remains available.

Keep the component mounted and change `open` to preserve reversible entrance/exit transitions. The native modal remains active through its closing transition. Long content scrolls in the body while the heading and actions remain separate. A destructive confirmation needs explicit consequences and a clearly named destructive action; decorative handwriting does not carry those instructions.

### Toast

`title` is required. Optional `description`, `eyebrow`, `action`, and `onDismiss` supply context and a next step. `tone` supports `"success"` (default), `"info"`, `"warning"`, and `"danger"`. Danger uses `role="alert"`; other tones use `role="status"`.

Toast does not set a timer, move focus, persist delivery, or manage a stack. The host controls its lifetime. Give interactive feedback enough time to be read and used; a persistent Undo action is often more useful than a disappearing countdown. Avoid duplicating an announcement already made by another live region.

## Surface and motion rules

Shared layer tokens live in `tokens/system.json`: `layer-duration` is 240ms, `layer-exit-duration` is 160ms, and `layer-easing` is `cubic-bezier(0.22, 1, 0.36, 1)`. Popovers and settle dialogs use those durations. Folding dialogs use dedicated `dialog-duration` (**360ms**) and `dialog-exit-duration` (**240ms**) tokens. Opening starts the complete note **24px right / 4px down** at zero opacity, with a shared **160ms entry fade** while the connected fold settles into place. The header retains solid local paper paint and stays flat; it shares the group movement and opacity. Closing begins immediately and moves the note **20px right / 4px down** over 240ms while the leaf tucks over **200ms**. Group opacity holds for the first **40ms**, then fades over **200ms** to finish the exit. The backdrop starts its 240ms fade immediately. Visible planes carry their own outlines without a stationary backing plate or duplicate content. Native modality persists through the complete exit, including interrupted/reversed motion. Reduced motion uses the immediate finished state. The semantic `shadow-layer` is one subtle **2px / 3px ink edge**; `backdrop` changes by theme. Edit the canonical source and regenerate with `npm run build:system` rather than editing generated CSS.

Layers use opaque surfaces and borders; they remain legible without a blur effect or a soft shadow. Reduced motion removes the entrance/exit movement. A static `NotificationCard` has no automatic entrance. Forced-color styles preserve the surface boundary when decorative depth disappears. Custom application transitions must preserve the same readable resting state.

The renderer imports its own CSS so production tree-shaking cannot leave an unstyled surface. Review the actual built website and package consumer, not only a development preview. Check the three themes, mobile reflow, long content, focus return, Escape, outside interaction, repeated open/close, and reduced motion. Browser tests do not demonstrate physical Pebble or phone hardware behavior.
