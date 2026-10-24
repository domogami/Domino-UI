import { useId, useRef, useState } from "react";
import * as UI from "../lib";
import {
  HeroName,
  HandwrittenNote,
  Crane,
  GardenPlant,
  SketchArrow,
  BrandBanner,
} from "../lib/brand";
import type { DrawingSpeed } from "../lib/brand";
import { Icon } from "../Icons";

function TaskCheckboxDemo({ compact = false }: { compact?: boolean }) {
  const [completed, setCompleted] = useState([false, true, false]);
  const tasks = [
    "Leave a little room for curiosity",
    "Keep the pieces that feel like you",
    "Write down the small idea that keeps returning, then give it a little room to grow.",
  ];
  return (
    <div className="task-checkbox-demo demo-stack">
      <fieldset>
        <legend>Today, a few good things</legend>
        {tasks.slice(0, compact ? 2 : 3).map((label, index) => (
          <UI.TaskCheckbox
            key={label}
            label={label}
            checked={completed[index]}
            onChange={(event) =>
              setCompleted((values) =>
                values.map((value, i) =>
                  i === index ? event.target.checked : value,
                ),
              )
            }
            description={
              !compact && index === 0
                ? "A small thing worth keeping."
                : undefined
            }
          />
        ))}
      </fieldset>
      {!compact && (
        <>
          <div className="demo-row">
            <UI.Button
              variant="secondary"
              size="sm"
              onClick={() => setCompleted([false, false, false])}
            >
              A fresh list
            </UI.Button>
            <span className="hand-small" role="status">
              {completed.filter(Boolean).length} of 3, thoughtfully done.
            </span>
          </div>
          <small className="task-checkbox-demo__source">
            From the Quartz garden · 220ms drawn check · 280ms ink strike
          </small>
        </>
      )}
    </div>
  );
}

export function Demo({
  id,
  compact = false,
  quiet = false,
  speed = 1,
}: {
  id: string;
  compact?: boolean;
  quiet?: boolean;
  speed?: DrawingSpeed;
}) {
  const [open, setOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [toast, setToast] = useState(true);
  const [page, setPage] = useState(2);
  const [petals, setPetals] = useState(3);
  const [saved, setSaved] = useState(false);
  const menuPanelId = useId();
  const dialogTriggerRef = useRef<HTMLButtonElement>(null);
  const notice = () => setSaved((v) => !v);
  switch (id) {
    case "chevron":
      return (
        <div className="demo-row">
          {(["down", "up", "right", "left"] as const).map((direction) => (
            <span
              key={direction}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
              }}
            >
              <UI.Chevron direction={direction} size={20} />
              {!compact && direction}
            </span>
          ))}
        </div>
      );
    case "button":
      return (
        <div className="demo-row">
          <UI.Button size={compact ? "sm" : "md"} onClick={notice}>
            {saved ? "Thought planted ✓" : "Plant an idea"}
            {!compact && <Icon name="arrow" size={15} />}
          </UI.Button>
          <UI.Button
            size={compact ? "sm" : "md"}
            variant="secondary"
            onClick={notice}
          >
            Keep exploring
          </UI.Button>
          {!compact && (
            <>
              <UI.Button variant="ghost" onClick={notice}>
                Maybe later
              </UI.Button>
              <UI.Button disabled>A quiet moment</UI.Button>
              <UI.Button loading>Saving</UI.Button>
              <UI.Button variant="danger" onClick={notice}>
                Remove note
              </UI.Button>
            </>
          )}
        </div>
      );
    case "icon-button":
      return (
        <div className="demo-row">
          <UI.IconButton
            label={saved ? "Unsave note" : "Save note"}
            aria-pressed={saved}
            onClick={notice}
          >
            <Icon name={saved ? "check" : "heart"} />
          </UI.IconButton>
          <UI.IconButton
            label="More about this note"
            variant="secondary"
            onClick={notice}
          >
            <Icon name="info" />
          </UI.IconButton>
          <UI.IconButton
            label="Explore the garden"
            variant="ghost"
            onClick={notice}
          >
            <Icon name="leaf" />
          </UI.IconButton>
        </div>
      );
    case "dropdown-menu":
      return (
        <div className="demo-stack">
          <UI.DropdownMenu
            label="Note actions"
            items={[
              {
                id: "save",
                label: saved ? "Remove bookmark" : "Bookmark note",
                onSelect: notice,
              },
              {
                id: "copy",
                label: "Copy a thought",
                onSelect: () => {
                  void navigator.clipboard?.writeText(
                    "Leave a little room for curiosity.",
                  );
                  setSaved(true);
                },
              },
              {
                id: "archive",
                label: "Archive note",
                separatorBefore: true,
                onSelect: notice,
              },
            ]}
          />
          {saved && <small role="status">A thought, kept.</small>}
        </div>
      );
    case "input":
      return (
        <div className="demo-stack">
          <UI.Input
            label="Notebook title"
            placeholder="A thought worth keeping"
            hint={compact ? undefined : "Give it a small, specific name."}
          />
          {!compact && (
            <>
              <UI.Input
                label="A thought that needs a name"
                error="Add a title before keeping this note."
                placeholder="Your title"
              />
              <UI.Input
                label="A quiet field"
                disabled
                value="Taking a little break"
                readOnly
              />
            </>
          )}
        </div>
      );
    case "textarea":
      return (
        <UI.Textarea
          label="A note to future me"
          placeholder="Start anywhere…"
          rows={compact ? 2 : 4}
          hint={compact ? undefined : "There is no perfect first sentence."}
        />
      );
    case "select":
      return (
        <UI.Select label="Keep it in" defaultValue="garden">
          <option value="garden">Digital garden</option>
          <option value="ideas">Loose ideas</option>
          <option value="journal">Daily journal</option>
        </UI.Select>
      );
    case "checkbox":
      return (
        <div className="demo-stack">
          <UI.Checkbox label="Leave room for curiosity" defaultChecked />
          <UI.Checkbox label="Try something a little different" />
          {!compact && (
            <>
              <UI.Checkbox label="A thought for another day" disabled />
              <a className="text-link" href="#component/task-checkbox">
                Try the garden’s drawn task checkbox{" "}
                <Icon name="arrow" size={14} />
              </a>
            </>
          )}
        </div>
      );
    case "task-checkbox":
      return <TaskCheckboxDemo compact={compact} />;
    case "radio-group":
      return (
        <UI.RadioGroup
          label="A little reading time"
          defaultValue="slow"
          options={[
            { value: "slow", label: "Slow & steady" },
            { value: "quick", label: "Just a quick look" },
            { value: "later", label: "Save it for later" },
          ]}
        />
      );
    case "switch":
      return (
        <div className="demo-stack">
          <UI.Switch label="Quiet motion" />
          <UI.Switch label="Keep my place" defaultChecked />
          {!compact && <UI.Switch label="A setting for later" disabled />}
        </div>
      );
    case "slider":
      return (
        <UI.Slider
          label="Room to breathe"
          min={0}
          max={100}
          defaultValue={64}
        />
      );
    case "badge":
      return (
        <div className="demo-row">
          <UI.Badge tone="sage" dot>
            Growing
          </UI.Badge>
          <UI.Badge tone="peach">In the works</UI.Badge>
          <UI.Badge tone="lavender">An idea</UI.Badge>
          <UI.Badge tone="blue">For later</UI.Badge>
          {!compact && <UI.Badge>A small note</UI.Badge>}
        </div>
      );
    case "avatar":
      return (
        <div className="demo-row">
          <UI.Avatar name="Dom Lee" size="lg" />
          <UI.Avatar name="Alex Rivera" tone="peach" />
          <UI.Avatar name="Sam Park" tone="lavender" size="sm" />
        </div>
      );
    case "avatar-group":
      return (
        <UI.AvatarGroup label="Illustrative notebook collaborators">
          <UI.Avatar name="Dom Lee" />
          <UI.Avatar name="Alex Rivera" tone="peach" />
          <UI.Avatar name="Sam Park" tone="lavender" />
          <UI.Avatar name="Jamie Chen" tone="blue" />
        </UI.AvatarGroup>
      );
    case "card":
      return (
        <UI.Card
          eyebrow="FROM THE NOTEBOOK"
          title="A small beginning"
          description="Every garden starts somewhere."
        >
          {!compact && (
            <>
              <p>
                One thought, carefully kept. A little room for it to become
                something.
              </p>
              <UI.Button size="sm" variant="secondary" onClick={notice}>
                {saved ? "A thought, saved ✓" : "Keep this thought"}
              </UI.Button>
            </>
          )}
        </UI.Card>
      );
    case "table":
      return (
        <UI.Table
          caption="Illustrative notebook inventory"
          columns={[
            {
              key: "name",
              header: "Notebook",
              render: (row: { name: string; status: string }) => row.name,
            },
            {
              key: "status",
              header: "Status",
              render: (row: { name: string; status: string }) => (
                <UI.Badge tone="sage">{row.status}</UI.Badge>
              ),
            },
          ]}
          data={[
            { name: "Digital garden", status: "Growing" },
            { name: "Loose ideas", status: "Taking root" },
          ]}
        />
      );
    case "kbd":
      return (
        <div className="demo-row">
          <UI.Kbd>⌘</UI.Kbd>
          <UI.Kbd>K</UI.Kbd>
          <span className="small-muted">to find a component</span>
        </div>
      );
    case "divider":
      return (
        <div className="demo-stack">
          <UI.Divider />
          <UI.Divider variant="dotted" />
          {!compact && <UI.Divider label="a fresh page" />}
        </div>
      );
    case "tooltip":
      return (
        <div className="demo-row">
          <UI.Tooltip content="Keep this thought for later">
            <UI.IconButton
              label="Bookmark this note"
              variant="secondary"
              onClick={notice}
            >
              <Icon name={saved ? "check" : "book"} />
            </UI.IconButton>
          </UI.Tooltip>
          <span className="small-muted">Hover or focus the bookmark</span>
        </div>
      );
    case "callout":
      return (
        <div className="demo-stack">
          <UI.Callout title="Room to grow" tone="success">
            Start small. Keep what feels useful.
          </UI.Callout>
          {!compact && (
            <>
              <UI.Callout title="A little context" tone="info">
                Paper is the canvas. Ink does the talking.
              </UI.Callout>
              <UI.Callout title="A gentle reminder" tone="warning">
                Give your work a title before you leave.
              </UI.Callout>
              <UI.Callout title="That thought needs a name" tone="danger">
                Add a title and try saving again.
              </UI.Callout>
            </>
          )}
        </div>
      );
    case "progress":
      return (
        <div className="demo-stack">
          <UI.Progress label="A page taking shape" value={64} />
          {!compact && (
            <>
              <UI.Progress label="Just beginning" value={8} />
              <UI.Progress label="A thought, finished" value={100} />
            </>
          )}
        </div>
      );
    case "spinner":
      return (
        <div className="demo-row">
          <UI.Spinner label="Finding your notes" />
          <span>Finding your notes…</span>
        </div>
      );
    case "skeleton":
      return (
        <div className="demo-stack">
          <div
            role="region"
            aria-label="Loading a journal entry"
            aria-busy="true"
            className="demo-stack"
          >
            {!compact && (
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <UI.Skeleton circle width={42} height={42} />
                <div className="demo-stack" style={{ flex: 1, gap: 5 }}>
                  <UI.Skeleton width="60%" height={20} />
                  <UI.Skeleton width="35%" height={12} />
                </div>
              </div>
            )}
            <UI.Skeleton width="92%" height={18} />
            <UI.Skeleton width="100%" height={18} />
            <UI.Skeleton width="76%" height={18} />
          </div>
          {!compact && (
            <>
              <span role="status" className="small-muted">
                A page taking shape…
              </span>
              <div
                className="demo-row"
                style={{ justifyContent: "flex-start" }}
              >
                <UI.Skeleton variant="block" width={58} height={38} />
                <span className="small-muted">
                  Block variant for image areas
                </span>
              </div>
            </>
          )}
        </div>
      );
    case "empty-state":
      return (
        <UI.EmptyState
          icon={<Icon name="pen" size={28} />}
          title="A fresh page"
          description="A little room for your next idea."
          action={
            !compact && (
              <UI.Button onClick={notice}>
                {saved ? "Your first thought ✓" : "Write a note"}
              </UI.Button>
            )
          }
        />
      );
    case "notification-card":
      return (
        <UI.NotificationCard
          source="The garden"
          title="A small idea is ready to grow."
          time={compact ? undefined : "JUST NOW"}
          count={3}
          surface="ink"
          icon={<Icon name="leaf" />}
          actions={
            !compact && (
              <UI.Button size="sm" onClick={notice}>
                {saved ? "A thought, kept ✓" : "Keep this thought"}
              </UI.Button>
            )
          }
        >
          <p>Your note is saved. Leave a little room for what comes next.</p>
        </UI.NotificationCard>
      );
    case "popover":
      return (
        <UI.Popover
          title="A thought in the margin"
          description="A little context, close at hand."
          trigger={
            <UI.Button variant="secondary">
              A closer look <Icon name="plus" size={15} />
            </UI.Button>
          }
          footer={
            <span className="hand-small">small enough to keep nearby.</span>
          }
        >
          <p>Keep related context beside the thing it explains.</p>
          <UI.Checkbox
            label="Keep this thought nearby"
            checked={saved}
            onChange={(event) => setSaved(event.target.checked)}
          />
        </UI.Popover>
      );
    case "toast":
      return toast ? (
        <UI.Toast
          eyebrow="Your notebook"
          title="A thought, saved."
          description={compact ? undefined : "Ready when you come back."}
          onDismiss={() => setToast(false)}
        />
      ) : (
        <UI.Button variant="secondary" onClick={() => setToast(true)}>
          Show notification
        </UI.Button>
      );
    case "dialog":
      return (
        <>
          <UI.Button
            ref={dialogTriggerRef}
            variant="secondary"
            onClick={() => setOpen(true)}
          >
            Open a little conversation
            <Icon name="external" size={15} />
          </UI.Button>
          <UI.Dialog
            open={open}
            returnFocusRef={dialogTriggerRef}
            onClose={() => setOpen(false)}
            title="Keep this thought?"
            eyebrow="YOUR NOTEBOOK / A SMALL DECISION"
            icon={<Icon name="book" />}
            surface="ink"
            description="A small place for something worth remembering."
            footer={
              <>
                <UI.Button variant="ghost" onClick={() => setOpen(false)}>
                  Maybe later
                </UI.Button>
                <UI.Button
                  onClick={() => {
                    setOpen(false);
                    setSaved(true);
                  }}
                >
                  Save note
                </UI.Button>
              </>
            }
          >
            <UI.Input
              label="Note title"
              defaultValue="A little room for curiosity"
            />
          </UI.Dialog>
          {saved && (
            <small role="status">Your thought is saved in this example.</small>
          )}
        </>
      );
    case "drawer":
      return (
        <>
          <UI.Button
            ref={dialogTriggerRef}
            variant="secondary"
            onClick={() => setDrawer(true)}
          >
            Look in the margins
            <Icon name="arrow" size={15} />
          </UI.Button>
          <UI.Drawer
            open={drawer}
            returnFocusRef={dialogTriggerRef}
            onClose={() => setDrawer(false)}
            title="In the margins"
            description="A few details, close at hand."
          >
            <UI.JournalList
              items={[
                { id: "a", type: "note", content: "Let small things grow." },
                {
                  id: "b",
                  type: "task",
                  content: "Make a little room for an idea.",
                },
              ]}
            />
            <UI.Textarea
              label="A passing thought"
              placeholder="Something to come back to…"
            />
          </UI.Drawer>
        </>
      );
    case "menu-toggle":
      return (
        <div className="demo-stack">
          <div className="demo-row">
            <UI.MenuToggle
              open={open}
              aria-controls={menuPanelId}
              openLabel="Open example navigation"
              closeLabel="Close example navigation"
              onClick={() => setOpen((value) => !value)}
            />
            <span>
              {open ? "A few places to go." : "Open the notebook index."}
            </span>
          </div>
          <nav
            id={menuPanelId}
            hidden={!open}
            aria-label="Example notebook navigation"
            className={open ? "demo-stack" : undefined}
          >
            <a href="#overview">Notebook overview</a>
            <a href="#components">All components</a>
            <a href="#motion">Motion & identity</a>
          </nav>
          {!compact && (
            <small className="small-muted">
              The same three strokes move in both directions. Try changing your
              mind midway through.
            </small>
          )}
        </div>
      );
    case "tabs":
      return (
        <UI.Tabs
          label="Notebook views"
          items={[
            {
              id: "notes",
              label: "Notes",
              content: (
                <p>A thought worth keeping. A sentence to come back to.</p>
              ),
            },
            {
              id: "ideas",
              label: "Ideas",
              content: (
                <p>
                  Loose beginnings. Little possibilities. Things taking root.
                </p>
              ),
            },
            {
              id: "saved",
              label: "For later",
              content: (
                <p>Good ideas can wait here until the time feels right.</p>
              ),
            },
          ]}
        />
      );
    case "accordion":
      return (
        <UI.Accordion
          items={[
            {
              id: "start",
              title: "Where do I start?",
              content:
                "Start with the smallest useful thing. A button, a label, a little room to write.",
            },
            {
              id: "grow",
              title: "What if it grows?",
              content:
                "Give it a little space. Keep the same tokens and compose the pieces you already have.",
            },
          ]}
        />
      );
    case "breadcrumbs":
      return (
        <UI.Breadcrumbs
          items={[
            { label: "Notebook", href: "#overview" },
            { label: "Components", href: "#components" },
            { label: "A small idea" },
          ]}
        />
      );
    case "pagination":
      return (
        <UI.Pagination page={page} totalPages={5} onPageChange={setPage} />
      );
    case "theme-toggle":
      return (
        <div className="demo-stack">
          <UI.ThemeToggle />
          <small className="small-muted">
            This changes the whole notebook. Hybrid is the default.
          </small>
        </div>
      );
    case "banner":
      return (
        <div className="demo-stack">
          <UI.Banner tone="accent" variant="notched">
            THINGS TAKING ROOT
          </UI.Banner>
          {!compact && (
            <>
              <UI.Banner tone="sage" variant="folded">
                A few folds, a few ideas.
              </UI.Banner>
              <UI.Banner tone="ink">In the margins</UI.Banner>
            </>
          )}
        </div>
      );
    case "paper":
      return (
        <UI.Paper pattern="lined" padding="md">
          <h3>A place to begin</h3>
          <p>One thought, then another.</p>
          {!compact && (
            <p>A steady rhythm gives the words a little room to breathe.</p>
          )}
        </UI.Paper>
      );
    case "sticky-note":
      return (
        <UI.StickyNote tone="sage">
          <span className="hand-text">
            Remember to leave
            <br />a little room
            <br />
            for curiosity.
          </span>
        </UI.StickyNote>
      );
    case "journal-list":
      return (
        <UI.JournalList
          label="A little journal key"
          items={[
            { id: "task", type: "task", content: "Plant a small idea" },
            { id: "done", type: "completed", content: "Make a little space" },
            { id: "note", type: "note", content: "Leave room to grow" },
            ...(!compact
              ? [
                  {
                    id: "event",
                    type: "event" as const,
                    content: "A little happening",
                  },
                  {
                    id: "migrated",
                    type: "migrated" as const,
                    content: "Carry a thought forward",
                  },
                ]
              : []),
          ]}
        />
      );
    case "hero-name":
      return (
        <div className="name-demo">
          <HeroName animate={!quiet} quiet={quiet} speed={speed} />
        </div>
      );
    case "notebook-sketch":
      return (
        <div className="sketchbook-component-demo">
          {(
            [
              "notebook",
              "flight",
              "garden",
              "camera",
              "keyboard",
              "compass",
            ] as const
          )
            .slice(0, compact ? 1 : 6)
            .map((variant, index) => (
              <figure key={variant}>
                <UI.NotebookSketch
                  variant={variant}
                  quiet={quiet}
                  speed={speed}
                  interactive={!compact}
                  replayOnClick={!compact}
                  label={
                    [
                      "An open bullet journal and pen",
                      "A folded paper plane with a looping trail",
                      "A little idea growing from notebook pages",
                      "A little camera beside two keepsake photographs",
                      "A mechanical keyboard with a curly cable and a few teal keys",
                      "An open compass resting on a folded map with a wandering trail",
                    ][index]
                  }
                />
                {!compact && (
                  <figcaption>
                    {
                      [
                        "a page for today",
                        "a little room to wander",
                        "small thoughts grow here",
                        "keep the little things",
                        "one thought at a time",
                        "leave room for a detour",
                      ][index]
                    }
                  </figcaption>
                )}
              </figure>
            ))}
        </div>
      );
    case "hairline-sketch":
      return (
        <div className="sketchbook-component-demo">
          {(["riffle", "branches", "loupe"] as const)
            .slice(0, compact ? 1 : 3)
            .map((variant, index) => (
              <figure key={variant}>
                <UI.HairlineSketch
                  variant={variant}
                  quiet={quiet || compact}
                  replayOnClick={!compact}
                />
                {!compact && (
                  <figcaption>
                    {
                      [
                        "notes to shuffle",
                        "follow a thread",
                        "look a little closer",
                      ][index]
                    }
                  </figcaption>
                )}
              </figure>
            ))}
        </div>
      );
    case "handwritten-note":
      return (
        <HandwrittenNote>
          a little room for curiosity <SketchArrow direction="down-right" />
        </HandwrittenNote>
      );
    case "crane":
      return <Crane className="art-demo" />;
    case "garden-plant":
      return <GardenPlant className="plant-demo" />;
    case "sketch-arrow":
      return (
        <div className="demo-row sketch-demo">
          <SketchArrow direction="up-right" />
          <SketchArrow direction="right" />
          <SketchArrow direction="down-right" />
          <SketchArrow direction="undo" />
          <SketchArrow direction="refresh" />
        </div>
      );
    case "brand-banner":
      return (
        <BrandBanner animate={!quiet} quiet={quiet} speed={speed} folded>
          Paper, patience & curiosity
        </BrandBanner>
      );
    case "annotation":
      return (
        <UI.Annotation
          title="a thought in the margin"
          arrow="right"
          collapsible={!compact}
          defaultOpen
        >
          <p>Keep the things that make you curious.</p>
        </UI.Annotation>
      );
    case "timeline":
      return (
        <UI.Timeline
          label="An illustrative creative process"
          items={[
            {
              id: "begin",
              meta: "01 / BEGIN",
              title: "A small idea",
              description: "Write down the thing you keep thinking about.",
            },
            {
              id: "grow",
              meta: "02 / GROW",
              title: "A little momentum",
              description: "Keep the pieces that feel useful.",
            },
            ...(!compact
              ? [
                  {
                    id: "keep",
                    meta: "03 / KEEP",
                    title: "Something worth sharing",
                    description:
                      "Let your idea find a little place in the world.",
                  },
                ]
              : []),
          ]}
        />
      );
    case "polaroid-stack":
      return (
        <UI.PolaroidStack
          label="SNAP-75 keyboard build photos"
          photos={[
            {
              src: `${import.meta.env.BASE_URL}images/snap75-top.jpg`,
              alt: "SNAP-75 split keyboard from above, with colorful keycaps and two screens",
              caption: "every little detail.",
            },
            {
              src: `${import.meta.env.BASE_URL}images/snap75-desk.jpg`,
              alt: "Hand-soldered SNAP-75 keyboard on a desk",
              caption: "the first one I ever soldered.",
            },
          ]}
        />
      );
    case "flower-progress":
      return (
        <div className="demo-stack">
          <UI.FlowerProgress value={petals} label="Ideas taking root" />
          {!compact && (
            <UI.Button
              variant="secondary"
              onClick={() => setPetals((v) => (v + 1) % 6)}
            >
              Find another petal
            </UI.Button>
          )}
        </div>
      );
    case "touch-feedback-setting":
      return compact ? (
        <UI.TouchFeedbackSetting compact />
      ) : (
        <UI.TouchFeedbackProvider navigationKey="setting-example">
          <div className="demo-stack">
            <UI.TouchFeedbackSetting />
            <UI.Button data-haptic="selection" onClick={notice}>
              {saved ? "A page, chosen ✓" : "Choose a page"}
            </UI.Button>
            <a className="text-link" href="#haptics">
              Safari instructions & feedback patterns
            </a>
          </div>
        </UI.TouchFeedbackProvider>
      );
    case "ink-switch":
      return (
        <label className="demo-row">
          <span>Gentle reminders</span>
          <UI.InkSwitch defaultChecked />
        </label>
      );
    default:
      return <UI.EmptyState title="A little room for an idea" />;
  }
}
