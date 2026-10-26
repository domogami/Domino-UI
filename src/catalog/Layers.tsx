import { useRef, useState, type MouseEvent } from "react";
import { Button, Checkbox, Dialog, Input, Switch } from "../lib/components";
import { Popover } from "../lib/popover";
import { NotificationCard } from "../lib/notification-card";
import { HandwrittenNote, SketchArrow } from "../lib/brand";
import { Chevron } from "../lib/chevron";
import { Icon } from "../Icons";
import { CodeBlock, PageIntro } from "./Foundations";
import "./layers.css";

const initialNotes = [
  {
    id: "garden",
    source: "The garden",
    title: "A small idea is ready to grow.",
    body: "Your note is saved. Leave a little room for the thought that comes next.",
    icon: "leaf",
    time: "JUST NOW",
  },
  {
    id: "notebook",
    source: "Your notebook",
    title: "A few good things, kept together.",
    body: "Three little observations found a home on today's page. A collection starts with one.",
    icon: "book",
    time: "2 MIN AGO",
  },
  {
    id: "sketch",
    source: "The sketchbook",
    title: "Follow a little curiosity.",
    body: "A line becomes a drawing. A small detour becomes something worth keeping.",
    icon: "pen",
    time: "5 MIN AGO",
  },
];

const code = `import { useRef, useState } from 'react';
import { Button, Dialog, NotificationCard, Popover } from '@domlee/ui';
import '@domlee/ui/styles.css';
import '@domlee/ui/fonts.css';

export function NotebookLayers() {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  return <>
    <Popover title="A thought in the margin"
      trigger={<Button variant="secondary">A closer look</Button>}>
      <p>Keep related context beside the thing it explains.</p>
    </Popover>

    {/* Your app owns the queue and live announcements. */}
    <NotificationCard source="The garden" title="An idea, safely kept."
      time="JUST NOW" count={3} surface="ink"
      actions={<Button ref={opener} onClick={() => setOpen(true)}>Open note</Button>}>
      <p>A little progress, with room for the next thought.</p>
    </NotificationCard>

    {/* Keep mounted so its exit can finish. */}
    <Dialog open={open} onClose={() => setOpen(false)} returnFocusRef={opener}
      eyebrow="A SMALL DECISION" surface="ink" title="Keep this note?"
      footer={<Button onClick={() => setOpen(false)}>Keep it</Button>}>
      <p>One clear task, on its own sheet of paper.</p>
    </Dialog>
  </>;
}`;

export function LayersPage({ copy }: { copy: (text: string) => void }) {
  const [notes, setNotes] = useState(initialNotes);
  const [index, setIndex] = useState(0);
  const [ink, setInk] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [name, setName] = useState("A few good pieces");
  const [saved, setSaved] = useState("");
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const openEditor = (event: MouseEvent<HTMLButtonElement>) => {
    returnFocusRef.current = event.currentTarget;
    setEditorOpen(true);
  };
  const note = notes[index];
  const dismiss = () => {
    setNotes((items) => items.filter((_, i) => i !== index));
    setIndex((value) => Math.max(0, Math.min(value, notes.length - 2)));
  };
  return (
    <div className="layers-page">
      <PageIntro
        eyebrow="03 / DEPTH & ATTENTION"
        title="Layers of paper"
        description="Notifications, context, and small decisions. Clear ink, a little depth, and room to see the page underneath."
      >
        <HandwrittenNote animate={false} className="layers-intro-note">
          one thought at a time <SketchArrow direction="down-right" />
        </HandwrittenNote>
      </PageIntro>

      <section
        className="layers-hero"
        aria-labelledby="notification-study-title"
      >
        <div className="layers-hero-copy">
          <span className="eyebrow">01 / A THOUGHT ARRIVES</span>
          <h2 id="notification-study-title">
            A little presence.
            <br />A clear next step.
          </h2>
          <p>
            A source, a strong title, a useful first line. One clean sheet, a
            fine teal seam, and a clear count of what is waiting.
          </p>
          <Switch
            label="Ink header"
            checked={ink}
            onChange={(event) => setInk(event.target.checked)}
          />
          <span className="layers-hand-note">
            a little ink, plenty of room <SketchArrow direction="right" />
          </span>
        </div>
        <div className="layers-stage">
          <div className="layers-stage-caption">
            <span>THE INCOMING TRAY</span>
            <span>LOCAL DEMO</span>
          </div>
          {note ? (
            <>
              <NotificationCard
                key={note.id}
                className="layers-incoming"
                source={note.source}
                title={note.title}
                time={note.time}
                icon={<Icon name={note.icon} />}
                count={notes.length}
                surface={ink ? "ink" : "paper"}
                actions={
                  <>
                    <Button size="sm" onClick={openEditor}>
                      Open note <SketchArrow direction="up-right" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={dismiss}>
                      Dismiss note
                    </Button>
                  </>
                }
              >
                <p>{note.body}</p>
              </NotificationCard>
              <div
                className="layers-queue-controls"
                role="group"
                aria-label="Notification queue"
              >
                <button
                  type="button"
                  aria-label="Previous notification"
                  disabled={notes.length < 2}
                  onClick={() =>
                    setIndex(
                      (value) => (value - 1 + notes.length) % notes.length,
                    )
                  }
                >
                  <Chevron direction="left" />
                </button>
                <span>
                  {index + 1} <i>/</i> {notes.length}
                </span>
                <button
                  type="button"
                  aria-label="Next notification"
                  disabled={notes.length < 2}
                  onClick={() =>
                    setIndex((value) => (value + 1) % notes.length)
                  }
                >
                  <Chevron direction="right" />
                </button>
              </div>
            </>
          ) : (
            <div className="layers-empty">
              <Icon name="leaf" size={32} />
              <h3>All caught up.</h3>
              <HandwrittenNote animate={false}>
                room for what comes next
              </HandwrittenNote>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setNotes(initialNotes);
                  setIndex(0);
                }}
              >
                Refill the tray
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="layers-examples">
        <section
          className="layers-example"
          aria-labelledby="popover-study-title"
        >
          <span className="eyebrow">02 / BESIDE THE THOUGHT</span>
          <h2 id="popover-study-title">Keep the page in sight.</h2>
          <p>
            A popover holds a short explanation or a small choice near the thing
            it belongs to.
          </p>
          <div className="layers-example-actions">
            <Popover
              title="A thought in the margin"
              eyebrow="A CLOSER LOOK"
              description="A little context, without losing your place."
              trigger={
                <Button variant="secondary">
                  Open paper popover <Icon name="plus" size={15} />
                </Button>
              }
              footer={
                <span className="layers-popover-aside">
                  small enough to keep nearby.
                </span>
              }
            >
              <p>
                These layers keep a crisp outline and an opaque paper surface.
                The context around them remains available.
              </p>
              <Checkbox
                label="Pin this thought for later"
                checked={pinned}
                onChange={(event) => setPinned(event.target.checked)}
              />
            </Popover>
            <span className="layers-inline-status">
              {pinned ? "A thought, pinned." : "Try a small choice inside."}
            </span>
          </div>
        </section>
        <section
          className="layers-example"
          aria-labelledby="dialog-study-title"
        >
          <span className="eyebrow">03 / A MOMENT OF FOCUS</span>
          <h2 id="dialog-study-title">One thing, on its own page.</h2>
          <p>
            A modal opens like a folded note. The heading stays clear while the
            paper unfolds beneath it, then tucks away in one small gesture. Open
            it again to replay the movement.
          </p>
          <div className="layers-example-actions">
            <Button onClick={openEditor}>
              Open layered modal <Icon name="arrow" size={15} />
            </Button>
            <span className="layers-inline-status" role="status">
              {saved}
            </span>
          </div>
        </section>
      </div>

      <Dialog
        open={editorOpen}
        returnFocusRef={returnFocusRef}
        onClose={() => setEditorOpen(false)}
        title="A thought worth keeping"
        eyebrow="YOUR NOTEBOOK / A SMALL DECISION"
        icon={<Icon name="book" size={23} />}
        surface={ink ? "ink" : "paper"}
        description="Give the idea a home. The rest of the notebook will be right where you left it."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditorOpen(false)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                setSaved(`Kept in “${name || "Untitled notebook"}”.`);
                setEditorOpen(false);
              }}
            >
              Keep this note
            </Button>
          </>
        }
      >
        <div className="layers-dialog-copy">
          <HandwrittenNote animate={false}>
            a few good pieces, kept together.
          </HandwrittenNote>
          <p>
            A small idea doesn't need a complicated ceremony. Choose its
            notebook and keep going.
          </p>
        </div>
        <Input
          label="Notebook name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="layers-nested-help">
          <Popover
            title="A name is just a starting point"
            eyebrow="A NOTE ABOUT NAMES"
            trigger={
              <Button size="sm" variant="ghost">
                Why give it a name?
              </Button>
            }
          >
            <p>
              Use something you'll recognize later. You can change a notebook
              name whenever the idea takes a new shape.
            </p>
          </Popover>
        </div>
      </Dialog>

      <section
        className="layers-principles"
        aria-labelledby="layers-principles-title"
      >
        <div>
          <span className="eyebrow">BORROW THE PRINCIPLE, KEEP THE HAND</span>
          <h2 id="layers-principles-title">What Pebble teaches us</h2>
          <p>
            Pebble's notification and card guidance favors information you can
            read at a glance, clear actions, and depth that explains where you
            are. Here is how those ideas fit this notebook.
          </p>
        </div>
        <div className="layers-principle-grid">
          {[
            [
              "01",
              "Let the title do its job",
              "Source and time stay compact. A strong title and useful first line carry the message.",
            ],
            [
              "02",
              "Make depth mean something",
              "A small count explains the queue. A contextual sheet stays near its trigger. A single unfolding page holds a decision.",
            ],
            [
              "03",
              "Keep the next step visible",
              "One primary action, a quieter alternative, and a reachable close. No essential instruction waits for an animation.",
            ],
            [
              "04",
              "Move once, then rest",
              "A quick settle welcomes context; a deliberate fold opens a decision. Closing stays reversible, and reduced motion shows the finished page immediately.",
            ],
          ].map(([number, title, description]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <p className="layers-source-note">
          References:{" "}
          <a href="https://developer.repebble.com/guides/design-and-interaction/core-experience/">
            Pebble core experience
          </a>
          ,{" "}
          <a href="https://developer.repebble.com/guides/design-and-interaction/recommended/">
            cards and action menus
          </a>
          , and{" "}
          <a href="https://developer.repebble.com/guides/user-interfaces/content-size/">
            content-aware sizing
          </a>
          . The paper folds, teal details, and handwritten asides are our own
          translation. No Pebble artwork or fonts are included.
        </p>
      </section>
      <CodeBlock code={code} copy={copy} />
    </div>
  );
}
