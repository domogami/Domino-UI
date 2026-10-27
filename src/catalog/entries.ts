export type Group =
  | "Actions"
  | "Inputs"
  | "Display"
  | "Feedback"
  | "Navigation"
  | "Notebook"
  | "Brand";
export type Entry = {
  id: string;
  name: string;
  group: Group;
  summary: string;
  code: string;
  props: string[][];
  guidance: string;
  usage: string;
  origin: "Adapted" | "Extended" | "Original";
};

// Examples assume the shown components are imported from @domlee/ui.
// Stateful examples define their hooks and callbacks; collection APIs document stable identities.
export const entries: Entry[] = [
  {
    id: "chevron",
    name: "Chevron",
    group: "Navigation",
    summary:
      "One centered SVG mark for dropdowns, selects, and disclosure. Clear at every font and size.",
    code: '<Chevron direction="down" />\n<Chevron direction="up" size={20} />\n<Chevron direction="right" />\n<Chevron direction="left" />',
    props: [
      ["direction", "down | up | right | left", "down"],
      ["size", "number | string", "1em"],
      ["native SVG attributes", "SVGProps except children", "—"],
    ],
    guidance:
      "Use the same centered mark for control affordances. Disclosure controls rotate the persistent SVG when expanded; reduced motion changes direction immediately. The icon is decorative, so the surrounding control supplies its accessible name and expanded state. Keep hand-drawn SketchArrow for annotations and expressive links.",
    usage:
      "Import Chevron and styles.css from @domlee/ui. DropdownMenu, Select, Accordion, Annotation, and Breadcrumb already use this geometry. Center its square box with the control's text line; avoid font characters or baseline offsets. Native select keyboard and picker behavior remains intact.",
    origin: "Extended",
  },
  {
    id: "button",
    name: "Button",
    group: "Actions",
    summary:
      "Small invitations to do something. Clear hierarchy, crisp ink, a little paper underneath.",
    code: '<Button variant="primary">Plant an idea</Button>\n<Button variant="secondary">Keep exploring</Button>\n<Button variant="ghost">Maybe later</Button>',
    props: [
      ["variant", "primary | secondary | ghost | danger", "primary"],
      ["size", "sm | md | lg", "md"],
      ["loading", "boolean; disables the button", "false"],
      ["disabled", "boolean", "false (native)"],
      ["icon / trailingIcon", "ReactNode; decorative", "—"],
      ["type", "button | submit | reset", "button"],
      ["children", "ReactNode", "—"],
    ],
    guidance:
      "Use one primary action per section. Write an active verb and its object. Preserve a visible disabled and loading state.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "icon-button",
    name: "Icon button",
    group: "Actions",
    summary:
      "A compact action for a familiar symbol, always paired with an accessible label.",
    code: '<IconButton label="Refresh notes" variant="secondary">\n  <SketchArrow direction="refresh" />\n</IconButton>',
    props: [
      ["label", "string; accessible name and fallback title", "required"],
      ["children", "ReactNode; decorative icon", "required"],
      ["variant", "primary | secondary | ghost | danger", "primary"],
      ["size", "sm | md | lg", "md"],
      ["loading / disabled", "boolean", "false"],
      ["title", "string", "label"],
      ["type", "button | submit | reset", "button"],
    ],
    guidance:
      "Use only familiar icons. The accessible label must stand on its own. All Button attributes and forwarded button refs are supported.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "dropdown-menu",
    name: "Dropdown menu",
    group: "Actions",
    summary:
      "A short list of related actions, tucked behind one quiet trigger.",
    code: "import { useState } from 'react';\n\nfunction Example() {\n  const [result, setResult] = useState('No action yet.');\n  return <>\n    <DropdownMenu label=\"Note actions\" items={[\n      { id: 'bookmark', label: 'Bookmark',\n        onSelect: () => setResult('Bookmarked.') },\n      { id: 'archive', label: 'Archive', separatorBefore: true,\n        onSelect: () => setResult('Archived.') }\n    ]} />\n    <p role=\"status\">{result}</p>\n  </>;\n}",
    props: [
      ["label", "ReactNode; trigger content", "required"],
      ["items", "DropdownMenuItem[]", "required"],
      ["item.id / item.label", "string / ReactNode", "required per item"],
      ["item.onSelect", "() => void", "—"],
      ["item.disabled / danger / separatorBefore", "boolean", "false"],
      ["item.shortcut", "string; display only", "—"],
      ["align", "start | end", "start"],
      ["className", "string", "—"],
    ],
    guidance:
      "Use actions rather than site navigation. Arrow keys, Home, End and initial letters move through enabled items. Escape closes and restores trigger focus.",
    origin: "Extended",
    usage:
      "Import DropdownMenu from @domlee/ui. The example defines its state and handlers. Give each item a stable, unique id. shortcut is a displayed hint; install any shortcut handler in your application. Only the listed props are supported.",
  },
  {
    id: "input",
    name: "Text input",
    group: "Inputs",
    summary:
      "A clear place to put a thought. Labels stay visible after the placeholder disappears.",
    code: '<Input label="Notebook title"\n  placeholder="A thought worth keeping"\n  hint="Give it a small, specific name." />',
    props: [
      ["label", "ReactNode", "—; provide label or aria-label"],
      ["hint / error", "ReactNode", "—; error replaces hint"],
      ["fieldClassName", "string; wrapper class", "—"],
      ["id", "string", "generated with useId"],
      ["leading", "ReactNode; decorative", "—"],
      ["value / defaultValue", "native input value", "—"],
      ["onChange", "ChangeEventHandler<HTMLInputElement>", "—"],
      ["type", "native input type", "text (native)"],
      ["disabled / required", "boolean", "false (native)"],
    ],
    guidance:
      "A placeholder is an example, never the label. Error messages explain how to fix the entry.",
    origin: "Extended",
    usage:
      "Import Input from @domlee/ui. Native input attributes and a forwarded input ref are supported. Use value and onChange for controlled state, or defaultValue for an initial uncontrolled value.",
  },
  {
    id: "textarea",
    name: "Textarea",
    group: "Inputs",
    summary:
      "Room for a longer thought, with the same paper, outline, and focus language.",
    code: '<Textarea label="A note to future me" rows={4}\n  placeholder="Start anywhere…" />',
    props: [
      ["label", "ReactNode", "—; provide label or aria-label"],
      ["hint / error", "ReactNode", "—; error replaces hint"],
      ["fieldClassName", "string; wrapper class", "—"],
      ["id", "string", "generated with useId"],
      ["rows", "number", "4"],
      ["value / defaultValue", "native textarea value", "—"],
      ["onChange", "ChangeEventHandler<HTMLTextAreaElement>", "—"],
      ["disabled / required", "boolean", "false (native)"],
    ],
    guidance:
      "Let people resize the field. Keep helper copy outside the writing area.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "select",
    name: "Select",
    group: "Inputs",
    summary: "A native, keyboard-friendly way to choose one thing from a list.",
    code: '<Select label="Notebook" name="notebook" defaultValue="garden">\n  <option value="garden">Digital garden</option>\n  <option value="ideas">Loose ideas</option>\n</Select>',
    props: [
      ["label", "ReactNode", "—; provide label or aria-label"],
      ["hint / error", "ReactNode", "—; error replaces hint"],
      ["fieldClassName", "string; wrapper class", "—"],
      ["id", "string", "generated with useId"],
      ["children", "native option / optgroup elements", "—"],
      ["value / defaultValue", "native select value", "—"],
      ["onChange", "ChangeEventHandler<HTMLSelectElement>", "—"],
      ["multiple / disabled / required", "boolean", "false (native)"],
    ],
    guidance:
      "Use a select when options are familiar. For a few meaningful alternatives, show a radio group. Supply native option children; there is no options or placeholder prop.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "checkbox",
    name: "Checkbox",
    group: "Inputs",
    summary:
      "An independent choice, with an inked check and a generous click target.",
    code: '<Checkbox label="Keep this idea close"\n  defaultChecked />',
    props: [
      ["label", "ReactNode", "required"],
      ["description", "ReactNode", "—"],
      [
        "checked / defaultChecked",
        "boolean; controlled / initial",
        "— / false (native)",
      ],
      ["onChange", "ChangeEventHandler<HTMLInputElement>", "—"],
      ["disabled / required", "boolean", "false (native)"],
      ["id", "string", "generated with useId"],
    ],
    guidance:
      "Use checkboxes for independent choices. The organic box and 220ms drawn check match TaskCheckbox; ordinary choices keep their label intact. Group related choices under a visible legend. Set the native indeterminate property through the forwarded input ref; there is no indeterminate prop. Reduced motion keeps a completed static mark.",
    origin: "Adapted",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "task-checkbox",
    name: "Task checkbox",
    group: "Inputs",
    summary:
      "The Quartz garden’s drawn check and satisfying ink strike, kept together as a reusable task control.",
    code: `<TaskCheckbox label="Leave room for curiosity" />
<TaskCheckbox label="Keep the pieces that feel like you" defaultChecked />`,
    props: [
      ["label", "ReactNode; inline task copy", "required"],
      ["description", "ReactNode; stays outside the strike", "—"],
      [
        "checked / defaultChecked",
        "boolean; controlled / initial",
        "— / false",
      ],
      ["onChange", "ChangeEventHandler<HTMLInputElement>", "—"],
      ["disabled / required", "boolean", "false"],
      ["id", "string", "generated with useId"],
    ],
    guidance:
      "Use for completing a task. The original curved SVG check draws in 220ms and a line crosses the task copy in 280ms. Wrapped lines each receive their own strike; descriptions and nested tasks remain separate. Keep ordinary independent settings as Checkbox or Switch. Native checked state, keyboard behavior and a visible focus indicator remain intact. Reduced motion and print show a static finished state.",
    usage:
      "Import TaskCheckbox from @domlee/ui plus styles.css. Adapted directly from garden-v5/site/notebook/tasks.scss; the React label owns its text, replacing the garden’s DOM-decoration pass. Native input attributes and a forwarded ref are supported; type and internal className are owned. Put nested tasks outside the parent label. Completion is local to your state; no storage or garden mutation is added.",
    origin: "Adapted",
  },
  {
    id: "radio-group",
    name: "Radio group",
    group: "Inputs",
    summary:
      "An ink-filled choice with a soft press, a spreading color bloom, and a settled dot.",
    code: "<RadioGroup label=\"Reading pace\"\n  options={[{value:'slow', label:'Slow & steady'},\n  {value:'quick', label:'A quick look'}]}\n  defaultValue=\"slow\" />",
    props: [
      ["label", "ReactNode; fieldset legend", "required"],
      ["options", "RadioOption[]", "required"],
      [
        "option.value / option.label",
        "string / ReactNode",
        "required per option",
      ],
      ["option.description / disabled", "ReactNode / boolean", "— / false"],
      ["name", "string", "generated with useId"],
      [
        "value / defaultValue",
        "string; controlled / initial",
        "— / empty string",
      ],
      ["onValueChange", "(value: string) => void", "—"],
      ["orientation", "horizontal | vertical", "vertical"],
      ["quiet", "boolean; settle instantly without animation", "false"],
      ["disabled / required", "boolean", "false"],
    ],
    guidance:
      "Keep choices mutually exclusive. A 320ms color bloom and reversible dot settle respond to selection, with a short press compression. Give every option a stable, unique value, which also supplies its React key. onValueChange receives the value string. Native arrow keys and shared-name grouping are preserved. Quiet and reduced motion show a finished mark immediately.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "switch",
    name: "Switch",
    group: "Inputs",
    summary: "An immediate on or off setting, without an extra save step.",
    code: 'import { useState } from \'react\';\n\nfunction Example() {\n  const [quiet, setQuiet] = useState(false);\n  return <Switch label="Quiet motion" checked={quiet}\n    description="Keep drawings still."\n    onChange={event => setQuiet(event.currentTarget.checked)} />;\n}',
    props: [
      ["label", "ReactNode", "required"],
      ["description", "ReactNode", "—"],
      [
        "checked / defaultChecked",
        "boolean; controlled / initial",
        "— / false (native)",
      ],
      ["onChange", "ChangeEventHandler<HTMLInputElement>", "—"],
      ["disabled / required", "boolean", "false (native)"],
      ["id", "string", "generated with useId"],
    ],
    guidance:
      "Use a switch for settings that take effect immediately. Read checked from the native change event; onChange does not receive a boolean directly.",
    origin: "Extended",
    usage:
      "Import Switch from @domlee/ui. The example defines quiet state. Native checkbox attributes and a forwarded input ref are supported; type is owned by Switch.",
  },
  {
    id: "slider",
    name: "Slider",
    group: "Inputs",
    summary:
      "Adjust a continuous value when feeling out a range matters more than exact typing.",
    code: '<Slider label="A little room to breathe"\n  min={0} max={100} defaultValue={48} />',
    props: [
      ["label", "ReactNode", "required"],
      ["min / max / step", "number | string", "0 / 100 / 1 (native)"],
      ["value / defaultValue", "native input value", "— / 50"],
      ["showValue", "boolean", "true"],
      ["formatValue", "(value: number) => string", "—; displays the number"],
      ["onChange", "ChangeEventHandler<HTMLInputElement>", "—"],
      ["id", "string", "generated with useId"],
      ["disabled", "boolean", "false (native)"],
    ],
    guidance:
      "Show the current value and meaningful limits. Use an input when precision matters. onChange receives a native event; convert event.currentTarget.value to a number for controlled state.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "badge",
    name: "Badge & tag",
    group: "Display",
    summary:
      "Little labels for status, category, and context. A restrained set of paper colors.",
    code: '<Badge tone="sage">Growing</Badge>\n<Badge tone="peach">In the works</Badge>\n<Badge tone="lavender">A little idea</Badge>',
    props: [
      ["tone", "sage | peach | lavender | blue | neutral", "neutral"],
      ["dot", "boolean; decorative status dot", "false"],
      ["children", "ReactNode", "—"],
    ],
    guidance:
      "Color supports the written label. Never use color alone to communicate status.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "avatar",
    name: "Avatar",
    group: "Display",
    summary:
      "A small identity marker, with useful initials when a portrait is unavailable.",
    code: '<Avatar name="Dom Lee" />\n<Avatar name="Alex Rivera" size="lg" />',
    props: [
      ["name", "string; accessible name and initials source", "required"],
      ["src", "string; image URL", "—; initials shown"],
      ["size", "sm | md | lg", "md"],
      ["tone", "sage | peach | lavender | blue | neutral", "sage"],
      ["title", "string", "name"],
    ],
    guidance:
      "Initials use the first letters of up to two name parts. Failed images fall back to initials. Use real portraits only with permission; demonstration identities are illustrative.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "avatar-group",
    name: "Avatar group",
    group: "Display",
    summary:
      "A small gathering of people, with names that remain available to assistive technology.",
    code: '<AvatarGroup>\n  <Avatar name="Dom Lee" />\n  <Avatar name="Alex Rivera" />\n  <Avatar name="Sam Park" />\n</AvatarGroup>',
    props: [
      ["label", "string; accessible group name", "People"],
      ["children", "ReactNode; typically Avatar elements", "—"],
    ],
    guidance:
      "Use a group for attribution or collaborators. Example identities do not imply real participation. Add stable React keys when generating avatars from data.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "card",
    name: "Card",
    group: "Display",
    summary:
      "A bounded thought, with enough structure to scan and enough space to read.",
    code: '<Card title="A small beginning"\n  description="Every garden starts somewhere.">\n  One thought, carefully kept.\n</Card>',
    props: [
      ["title / description / eyebrow / footer", "ReactNode", "—"],
      ["children", "ReactNode", "—"],
      ["interactive", "boolean; visual hover treatment", "false"],
    ],
    guidance:
      "Keep each card about one subject. Card titles render as h3. interactive changes presentation; it adds no link, keyboard behavior, or click handler. Place a real action or link inside.",
    origin: "Adapted",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "table",
    name: "Table",
    group: "Display",
    summary:
      "Structured information in rows and columns, with quiet rules and readable alignment.",
    code: "<Table caption=\"Notebook inventory\"\n  data={[{ id: 'garden', name: 'Digital garden', status: 'Growing' }]}\n  rowKey={row => row.id}\n  columns={[\n    { key: 'name', header: 'Notebook', render: row => row.name },\n    { key: 'status', header: 'Status',\n      render: row => <Badge tone=\"sage\">{row.status}</Badge> }\n  ]} />",
    props: [
      ["caption", "string; visible table caption", "required"],
      ["data", "T[]", "required"],
      ["columns", "TableColumn<T>[]", "required"],
      [
        "column.key / column.header",
        "string / ReactNode",
        "required per column",
      ],
      [
        "column.render",
        "(row: T, index: number) => ReactNode",
        "required per column",
      ],
      ["column.align", "left | center | right", "—; native alignment"],
      ["rowKey", "(row: T, index: number) => string | number", "array index"],
      ["emptyMessage", "ReactNode", "No entries yet."],
    ],
    guidance:
      "Use descriptive headers and a caption. Horizontal scrolling protects readable column widths. Give columns unique keys and use rowKey with persistent row identity when data may reorder.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "kbd",
    name: "Keyboard key",
    group: "Display",
    summary: "A small visual cue for a real keyboard shortcut.",
    code: "<Kbd>⌘</Kbd> <Kbd>K</Kbd>",
    props: [["children", "ReactNode; key name or symbol", "—"]],
    guidance:
      "Show shortcuts only when they work. Kbd is visual notation and installs no keyboard handler. Write out complex combinations in supporting text.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "divider",
    name: "Divider",
    group: "Display",
    summary:
      "A small pause between related thoughts. A solid rule, dotted line, or handwritten aside.",
    code: '<Divider />\n<Divider label="a fresh page" />',
    props: [
      ["variant", "solid | dotted", "dotted"],
      ["label", "ReactNode", "—"],
    ],
    guidance:
      "Use space first. Add a divider when a change of topic needs a clearer signal. The root exposes separator semantics.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "tooltip",
    name: "Tooltip",
    group: "Feedback",
    summary: "A brief aside that appears on hover or keyboard focus.",
    code: '<Tooltip content="Keep this idea for later">\n  <IconButton label="Bookmark">⌑</IconButton>\n</Tooltip>',
    props: [
      ["content", "ReactNode", "required"],
      [
        "children",
        "single ReactElement accepting aria-describedby",
        "required",
      ],
      ["side", "top | bottom", "top"],
    ],
    guidance:
      "Keep it short. Essential information belongs in the interface. Use a focusable child that forwards aria-describedby; interactive content needs a separate control.",
    origin: "Extended",
    usage:
      "Import Tooltip and the child control from @domlee/ui. Only content, children and side are supported. Tooltip appends its description ID to the child’s existing aria-describedby.",
  },
  {
    id: "callout",
    name: "Callout",
    group: "Feedback",
    summary:
      "A thought pulled into the margin: helpful context, a gentle warning, or a little encouragement.",
    code: '<Callout title="Room to grow" tone="info">\n  Start small. Keep what feels useful.\n</Callout>',
    props: [
      ["title", "ReactNode", "—"],
      ["tone", "info | success | warning | danger", "info"],
      ["icon", "ReactNode; decorative", "i / ✓ / ! according to tone"],
      ["children", "ReactNode", "—"],
    ],
    guidance:
      "Give callouts a clear purpose. Semantic tone choices map to the palette. Callout does not automatically announce newly inserted content. Avoid wrapping ordinary paragraphs just for decoration.",
    origin: "Adapted",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "progress",
    name: "Progress",
    group: "Feedback",
    summary: "A quiet measure of something on its way to being complete.",
    code: '<Progress label="A page taking shape" value={64} />',
    props: [
      ["value", "number; clamped between 0 and max", "required"],
      ["max", "number; positive maximum", "100; non-positive uses 100"],
      ["label", "ReactNode", "—; supply accessible name"],
      ["showValue", "boolean; rounded percentage", "true"],
    ],
    guidance:
      "Use actual progress when known. Supply label or aria-label for an accessible name. Do not invent a precise percentage for an unknown task.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "spinner",
    name: "Spinner",
    group: "Feedback",
    summary:
      "A small activity cue when something is happening and its progress is unknown.",
    code: '<Spinner label="Finding your notes" />',
    props: [
      ["label", "string; accessible status", "Loading"],
      ["size", "sm | md | lg", "md"],
    ],
    guidance:
      "Pair the activity cue with a readable status. Reduced motion keeps a static indicator. Avoid competing status announcements for one operation.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "skeleton",
    name: "Skeleton",
    group: "Feedback",
    summary:
      "Quiet pen strokes that write, rest, and leave room for a thought to arrive.",
    code: '<div aria-busy="true" aria-label="Loading a journal entry">\n  <Skeleton width="70%" height={20} />\n  <Skeleton width="100%" height={18} />\n  <Skeleton width="82%" height={18} />\n</div>\n<span role="status">A page taking shape…</span>',
    props: [
      ["width", "string | number; CSS width", "100%"],
      ["height", "string | number; CSS height", "16"],
      [
        "circle",
        "boolean; sketched ring, or filled circle with block",
        "false",
      ],
      ["variant", "handwritten | block", "handwritten"],
    ],
    guidance:
      "Reserve the final content dimensions. Handwritten is the default: nonverbal pen marks draw gently, then pause. Use PhotoSkeleton for pictures, or block for plain solid areas. Each skeleton is hidden from assistive technology; mark the containing region busy and give the whole operation one readable loading status outside it. Reduced motion shows finished, static strokes.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "photo-skeleton",
    name: "Photo skeleton",
    group: "Feedback",
    summary:
      "A picture taking shape in ink: a sketched frame, soft hills, and a sun, with a long quiet pause.",
    code: '<div aria-busy="true" aria-label="Loading a photograph">\n  <PhotoSkeleton aspectRatio={4 / 3} />\n</div>\n<span role="status">Loading a photograph…</span>\n\n{/* Fill an existing reserved frame instead: */}\n<PhotoSkeleton width="100%" height="100%" quiet />',
    props: [
      ["aspectRatio", "number; width divided by height", "4 / 3"],
      ["width", "string | number; CSS width", "100%"],
      ["height", "string | number; CSS height", "auto"],
      ["quiet", "boolean; complete static drawing", "false"],
      ["span attributes", "className, style, data-* and native span attributes", "—"],
    ],
    guidance:
      "Use only while a real photograph is pending, and reserve the final image dimensions. The original drawing is decorative and noninteractive; its frame follows the available ratio while the sun and hills keep their proportions. It draws once, holds for most of the cycle, then fades before another pass. Quiet and reduced motion show the finished ink. Keep loaded images visible during refreshes; show errors and empty collections as their actual states.",
    usage:
      "Import PhotoSkeleton and styles.css from @domlee/ui. Its transparent surface inherits the caller’s paper, with muted ink and accent tokens in either theme. Supply aspectRatio for an independent frame, or width and height of 100% inside an already sized photo area. The placeholder is aria-hidden and inert; set aria-busy on the containing loading region and give that operation one readable status outside it. It never loads an image or invents a caption, author, or memory.",
    origin: "Original",
  },
  {
    id: "empty-state",
    name: "Empty state",
    group: "Feedback",
    summary: "An invitation at the beginning, with a clear and kind next step.",
    code: '<EmptyState title="A fresh page"\n  description="A little room for your next idea."\n  action={<Button>Write a note</Button>} />',
    props: [
      ["title", "ReactNode; renders h3", "required"],
      ["description / action", "ReactNode", "—"],
      ["icon", "ReactNode; decorative", "○"],
    ],
    guidance:
      "Explain what will appear here and offer one useful action. Connect the action to an actual task in your application. Skip blame and false urgency.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "notification-card",
    name: "Notification card",
    group: "Feedback",
    summary:
      "A glanceable thought on one clean sheet, with a fine accent seam and a readable queue count.",
    code: '<NotificationCard source="The garden" title="A small idea is ready to grow."\n  time="JUST NOW" count={3} surface="ink"\n  actions={<a href="/notes">Open your notes</a>}>\n  <p>Your thought is saved. Leave a little room for what comes next.</p>\n</NotificationCard>',
    props: [
      ["source / title", "string / ReactNode", "required"],
      ["children", "ReactNode; message body", "required"],
      ["time / icon / actions", "ReactNode; icon is decorative", "—"],
      [
        "count",
        "number; total queue size, normalized to a positive integer",
        "1",
      ],
      ["surface", "paper | ink; header treatment", "paper"],
    ],
    guidance:
      "Use a strong title and a useful first line. A compact count appears when more than one message is waiting. This named article does not interrupt or announce itself; the host owns the queue, dismissal, and a single appropriate live region. Keep important information available until the user has acted.",
    origin: "Extended",
    usage:
      "Import NotificationCard and styles.css from @domlee/ui. Compose native links or Button actions, and pass the real queue count. No portal, automatic timeout, global manager, or extra copies of the content are created. See Layers & notifications for a working queue.",
  },
  {
    id: "popover",
    name: "Popover",
    group: "Feedback",
    summary:
      "An anchored paper layer for a little context or a small choice, with the surrounding page still in sight.",
    code: '<Popover title="A thought in the margin"\n  description="A little context, close at hand."\n  trigger={<Button variant="secondary">A closer look</Button>}\n  footer={<small>You can always change your mind.</small>}>\n  <p>Keep related context beside the thing it explains.</p>\n  <Checkbox label="Keep this thought nearby" />\n</Popover>',
    props: [
      [
        "trigger",
        "ReactElement; one focusable control accepting a ref",
        "required",
      ],
      ["children", "ReactNode; panel body", "required"],
      [
        "title / description / footer / eyebrow",
        "ReactNode",
        "— / — / — / a closer look",
      ],
      ["side / align", "top | bottom / start | center | end", "bottom / start"],
      [
        "open / defaultOpen",
        "boolean; controlled / initial uncontrolled",
        "— / false",
      ],
      ["onOpenChange", "(open: boolean) => void", "—"],
      [
        "label / closeLabel",
        "string; fallback panel name / dismiss action",
        "More details / Close popover",
      ],
    ],
    guidance:
      "Use for short, related context and controls. The panel flips and fits the viewport, scrolls long content, closes on outside interaction or Escape, and preserves natural Tab navigation. Escape and an explicit close return focus to the trigger. A modal decision belongs in Dialog; a list of actions belongs in DropdownMenu.",
    origin: "Extended",
    usage:
      "Import Popover, Button, Checkbox and styles.css from @domlee/ui. Native Popover API places it in the top layer; older browsers use a positioned portal. The trigger's ref and click handler are composed. A controlled parent must update open through onOpenChange. Keep the component mounted through its closing transition; reduced motion closes immediately.",
  },
  {
    id: "toast",
    name: "Toast",
    group: "Feedback",
    summary:
      "A small confirmation that stays out of the way and can be dismissed.",
    code: 'import { useState } from \'react\';\n\nfunction Example() {\n  const [visible, setVisible] = useState(true);\n  return visible ? <Toast title="A thought, saved."\n    description="Ready when you come back." tone="success"\n    onDismiss={() => setVisible(false)} /> : null;\n}',
    props: [
      ["title", "ReactNode", "required"],
      ["description / action", "ReactNode", "—"],
      ["eyebrow", "ReactNode; compact source context", "—"],
      ["tone", "success | info | warning | danger", "success"],
      ["onDismiss", "() => void; shows dismiss button", "—"],
    ],
    guidance:
      "Routine updates use status semantics; danger uses alert semantics. Keep errors requiring action visible near their cause. The parent controls placement, visibility and dismissal timing.",
    origin: "Extended",
    usage:
      "Import Toast from @domlee/ui. The example defines visible state and removes the toast on dismissal. Toast does not create a portal, queue or automatic timeout.",
  },
  {
    id: "dialog",
    name: "Dialog",
    group: "Feedback",
    summary:
      "A focused conversation, with a named purpose and a clear way back.",
    code: 'import { useState } from \'react\';\n\nfunction Example() {\n  const [open, setOpen] = useState(false);\n  return <>\n    <Button onClick={() => setOpen(true)}>Open note</Button>\n    <Dialog open={open} onClose={() => setOpen(false)}\n      title="A thought worth keeping"\n      description="A small space for a focused thought."\n      footer={<Button onClick={() => setOpen(false)}>Done</Button>}>\n      <p>You can always revisit it.</p>\n    </Dialog>\n  </>;\n}',
    props: [
      ["open", "boolean; controlled", "required"],
      ["onClose", "() => void; update open state", "required"],
      ["title", "ReactNode", "required"],
      ["description / footer", "ReactNode", "—"],
      ["eyebrow / icon", "ReactNode; compact context / decorative mark", "—"],
      ["surface", "paper | ink; header treatment", "paper"],
      ["children", "ReactNode", "—"],
      ["closeLabel", "string", "Close dialog"],
      ["motion", "fold | settle; staged unfolding or a quiet arrival", "fold"],
      ["closeOnBackdrop", "boolean", "true"],
      [
        "returnFocusRef",
        "RefObject<HTMLElement | null>; explicit opener for touch browsers",
        "native focus return",
      ],
    ],
    guidance:
      'The native modal contains focus, supports Escape and returns focus when closed. One connected note arrives softly from the right with a shared 160ms fade during its 360ms unfolding motion. Its header stays flat and follows the same movement and opacity; the attached body/footer fold is gentle. Closing begins immediately with a rightward slide and 200ms tuck, alongside a 40ms opacity hold then 200ms whole-note fade, finishing in 240ms. There is no stationary rear plate or duplicate content. Use motion="settle" for a utility such as search. Keep it mounted while open changes so motion can reverse; modality persists through the full exit. Reduced motion skips movement. onClose must update open state. Supply a concise title and a visible close action.',
    origin: "Extended",
    usage:
      "Import Dialog and Button from @domlee/ui. The example defines open state and its opener. Native dialog attributes are supported; the component owns its DOM ref and open/showModal synchronization.",
  },
  {
    id: "drawer",
    name: "Drawer",
    group: "Feedback",
    summary:
      "A little extra space at the edge for details, filters, or a focused task.",
    code: 'import { useState } from \'react\';\n\nfunction Example() {\n  const [open, setOpen] = useState(false);\n  return <>\n    <Button onClick={() => setOpen(true)}>Open the margins</Button>\n    <Drawer open={open} onClose={() => setOpen(false)}\n      title="In the margins" side="right">\n      <p>A few more details, close at hand.</p>\n    </Drawer>\n  </>;\n}',
    props: [
      ["side", "left | right", "right"],
      ["open", "boolean; controlled", "required"],
      ["onClose", "() => void; update open state", "required"],
      ["title", "ReactNode", "required"],
      ["description / footer", "ReactNode", "—"],
      [
        "eyebrow / icon / surface",
        "ReactNode / ReactNode / paper | ink",
        "— / — / paper",
      ],
      ["children", "ReactNode", "—"],
      ["closeLabel", "string", "Close dialog"],
      ["closeOnBackdrop", "boolean", "true"],
      [
        "returnFocusRef",
        "RefObject<HTMLElement | null>; explicit opener for touch browsers",
        "native focus return",
      ],
    ],
    guidance:
      "Use for supporting tasks that benefit from more room. Drawer uses Dialog behavior, including Escape, backdrop dismissal and focus restoration.",
    origin: "Extended",
    usage:
      "Import Drawer and Button from @domlee/ui. The example defines open state. Drawer accepts Dialog content and behavior props plus side, and preserves its edge slide rather than accepting motion. onClose must update open state.",
  },
  {
    id: "nav-trail",
    name: "Navigation trail",
    group: "Navigation",
    summary:
      "One paper highlight glides between native links, with a small drawn gesture from each icon.",
    code: `import { useRef, useState } from "react";
import { NavTrail } from "@domlee/ui";

function NotebookNav() {
  const nav = useRef<HTMLElement>(null);
  const [current, setCurrent] = useState("notes");
  return <nav ref={nav} className="dm-nav-trail-host" aria-label="Notebook">
    <NavTrail containerRef={nav} activeKey={current} />
    {["notes", "ideas", "kept"].map(id =>
      <button key={id} type="button" style={{ display: "block", padding: 12 }}
        aria-current={current === id ? "page" : undefined}
        onClick={() => setCurrent(id)}>{id}</button>
    )}
  </nav>;
}`,
    props: [
      [
        "containerRef",
        "RefObject<HTMLElement | null>; scrollable positioned host",
        "required",
      ],
      ["activeKey", "string | number; committed route or selection", "—"],
      [
        "activeSelector",
        "string; one selected element inside the host",
        "[aria-current=page]",
      ],
      ["itemSelector", "string; native interactive rows", "a[href],button"],
      ["iconSelector", "string; SVG inside each row", ".dm-nav-icon"],
      ["quiet", "boolean; immediate selection and no icon gesture", "false"],
      [
        "native span attributes",
        "HTMLAttributes except children; decorative marker only",
        "—",
      ],
    ],
    guidance:
      "Use a single persistent marker inside a dm-nav-trail-host. Keep links, buttons, focus and aria-current on the original rows. It retargets from its current position during fast navigation and follows nested indentation, wrapping, scroll and resize. A small icon gesture runs once on hover, focus or selection; quiet and reduced motion move instantly.",
    usage:
      "Import NavTrail and styles.css from @domlee/ui. The host must be positioned and contain one matching active item. Give SVGs dm-nav-icon and optional data-nav-icon=pen, heart, sparkle, ruler, type, play or code on the row for personal gestures. The consuming router still owns URLs, focus, history and drawer behavior. See docs/NAVIGATION.md.",
    origin: "Extended",
  },
  {
    id: "menu-toggle",
    name: "Menu toggle",
    group: "Navigation",
    summary:
      "Three quiet ink strokes that smoothly become a close mark, then return when the index closes.",
    code: 'import { useId, useState } from \'react\';\n\nfunction Example() {\n  const [open, setOpen] = useState(false);\n  const panelId = useId();\n  return <>\n    <MenuToggle open={open} aria-controls={panelId}\n      onClick={() => setOpen((value) => !value)} />\n    <nav id={panelId} hidden={!open} aria-label="Notebook navigation">\n      <a href="#overview">Notebook overview</a>\n      <a href="#components">All components</a>\n    </nav>\n  </>;\n}',
    props: [
      ["open", "boolean; controlled expanded state", "required"],
      [
        "onClick",
        "MouseEventHandler<HTMLButtonElement>; update open state",
        "—",
      ],
      ["openLabel", "string; accessible name when closed", "Open navigation"],
      ["closeLabel", "string; accessible name when open", "Close navigation"],
      ["aria-controls", "string; associated panel id", "—"],
      ["disabled", "boolean", "false (native)"],
      ["type", "button | submit | reset", "button"],
    ],
    guidance:
      "Keep the button mounted while state changes so the three strokes can reverse smoothly. The 44px target exposes its expanded state and current action. Honor reduced motion. A modal slide-out navigation also needs Escape dismissal, background inertness, focus trapping, and focus restoration in its owning layout.",
    origin: "Extended",
    usage:
      "Import MenuToggle from @domlee/ui. The example defines state and a unique panel id with useId. Native button attributes and a forwarded button ref are supported. Override --dm-menu-duration and --dm-menu-easing to coordinate the icon with its panel; defaults are 360ms and cubic-bezier(.22, 1, .36, 1).",
  },
  {
    id: "tabs",
    name: "Tabs",
    group: "Navigation",
    summary:
      "Related views in one place, with a steady underline to show where you are.",
    code: "<Tabs label=\"Notebook views\" defaultValue=\"notes\" items={[\n  { id: 'notes', label: 'Notes', content: <p>A thought worth keeping.</p> },\n  { id: 'ideas', label: 'Ideas', content: <p>A little room to grow.</p> }\n]} />",
    props: [
      ["label", "string; accessible tablist name", "required"],
      ["items", "TabItem[]", "required"],
      [
        "item.id / item.label / item.content",
        "string / ReactNode / ReactNode",
        "required per item",
      ],
      ["item.disabled", "boolean", "false"],
      [
        "value / defaultValue",
        "string; controlled / initial tab ID",
        "— / first enabled item ID",
      ],
      ["onValueChange", "(value: string) => void", "—"],
    ],
    guidance:
      "Use for alternate views of one subject. Arrow keys, Home and End select enabled tabs. Give each item a stable, unique id; inactive panels remain mounted and hidden.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "accordion",
    name: "Accordion",
    group: "Navigation",
    summary: "A set of thoughts that can open a little at a time.",
    code: "<Accordion items={[\n  {id:'begin', title:'Where do I start?',\n   content:'Start with the smallest useful thing.'}\n]} />",
    props: [
      ["items", "AccordionItem[]", "required"],
      [
        "item.id / item.title / item.content",
        "string / ReactNode / ReactNode",
        "required per item",
      ],
      ["item.disabled", "boolean", "false"],
      ["defaultOpen", "string[]; initial open item IDs", "[]"],
      ["multiple", "boolean; permit multiple open items", "false"],
    ],
    guidance:
      "Titles render inside h3. Give items stable, unique ids. defaultOpen is initial state; later prop changes do not control expanded items. Keep titles descriptive and essential content visible.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "breadcrumbs",
    name: "Breadcrumbs",
    group: "Navigation",
    summary: "A quiet trail back through the notebook.",
    code: "<Breadcrumbs items={[\n  {label:'Notebook', href:'#'},\n  {label:'Digital garden'}\n]} />",
    props: [
      ["items", "BreadcrumbItem[]", "required"],
      ["item.label", "ReactNode", "required per item"],
      ["item.href", "string", "—"],
      ["label", "string; accessible navigation name", "Breadcrumb"],
    ],
    guidance:
      "The final item is always the current page and never a link, even if it has href. Keep labels consistent with navigation and use real application destinations.",
    origin: "Extended",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "pagination",
    name: "Pagination",
    group: "Navigation",
    summary: "Move through a longer collection without losing your place.",
    code: "import { useState } from 'react';\n\nfunction Example() {\n  const [page, setPage] = useState(1);\n  return <Pagination page={page} totalPages={5}\n    onPageChange={setPage} label=\"Notebook pages\" />;\n}",
    props: [
      ["page", "number; controlled current page", "required"],
      ["totalPages", "number; rounded down, minimum 1", "required"],
      ["onPageChange", "(page: number) => void", "required"],
      ["label", "string; accessible navigation name", "Pagination"],
    ],
    guidance:
      "The current page is clamped to the available range; unavailable directions are disabled. Connect page state to the displayed collection. Use links for independently addressable pages.",
    origin: "Extended",
    usage:
      "Import Pagination from @domlee/ui. The example defines page state. Your application supplies the corresponding page content after onPageChange.",
  },
  {
    id: "theme-toggle",
    name: "Theme toggle",
    group: "Navigation",
    summary:
      "Three ways to open the same notebook. Hybrid is the default before a saved preference exists.",
    code: '<ThemeProvider defaultTheme="hybrid" storageKey="domino-theme">\n  <ThemeToggle />\n  <Paper>A little room for curiosity.</Paper>\n</ThemeProvider>',
    props: [
      ["ThemeToggle.compact", "boolean; icon-only presentation", "false"],
      ["ThemeToggle.className", "string", "empty string"],
      ["ThemeProvider.children", "ReactNode", "required"],
      ["ThemeProvider.defaultTheme", "hybrid | light | dark", "hybrid"],
      [
        "ThemeProvider.storageKey",
        "string; localStorage preference key",
        "domino-theme",
      ],
      [
        "useTheme()",
        "{ theme: Theme; setTheme: (theme: Theme) => void }",
        "requires ThemeProvider",
      ],
    ],
    guidance:
      "Hybrid uses charcoal navigation and cream working surfaces. A saved choice takes precedence over defaultTheme. The toggle exposes light, hybrid and dark as named pressed buttons.",
    origin: "Adapted",
    usage:
      "Import ThemeProvider, ThemeToggle, Paper and optionally useTheme from @domlee/ui. Mount one provider at the application root; it writes data-theme and color-scheme on the document root and persists the choice. ThemeToggle accepts only compact and className.",
  },
  {
    id: "banner",
    name: "Banner",
    group: "Notebook",
    summary:
      "Notched paper, folded tails, and a hand-lettered label. One of the notebook’s signatures.",
    code: '<Banner tone="ink" variant="folded">Things taking root</Banner>\n<Banner tone="sage" variant="notched">A fresh page</Banner>',
    props: [
      ["children", "ReactNode", "—"],
      ["tone", "ink | sage | paper | accent", "ink"],
      ["variant", "folded | notched", "folded"],
    ],
    guidance:
      "Use banners for meaningful landmarks. Banner renders a div; supply the appropriate heading as its content. Use BrandBanner for the original animated SVG treatment.",
    origin: "Adapted",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "paper",
    name: "Paper",
    group: "Notebook",
    summary:
      "Warm paper with a steady writing rhythm. Rules leave every letter room to breathe.",
    code: '<Paper pattern="lined" padding="md" ruleAlign="between">\n  <h3>A place to begin</h3>\n  <p>One thought, then another.</p>\n  <p>A steady rhythm gives the words a little room to breathe.</p>\n</Paper>',
    props: [
      ["children", "ReactNode", "—"],
      ["pattern", "dotted | lined | plain", "dotted"],
      ["padding", "sm | md | lg", "md"],
      ["ruleAlign", "between | baseline; placement on lined paper", "between"],
    ],
    guidance:
      "Writing rules must stay clear of every letter, including descenders. Place text between two rules or just above a writing guide. Lined paper gives ordinary prose a 32px rhythm and leaves clear bands for larger headings, controls, and figures. Let text wrap naturally. Keep dots subdued on dotted paper.",
    origin: "Adapted",
    usage:
      'Import Paper and styles.css from @domlee/ui. pattern="lined" owns the writing rhythm; ruleAlign="between" centers rows and "baseline" brings the guide closer beneath the ink. Rules follow the real content origin through padding, reflow, and font changes. Content is always readable, including before decorative rules are ready. Native div attributes are supported. See docs/PAPER-RHYTHM.md for composition and rich text.',
  },
  {
    id: "sticky-note",
    name: "Sticky note",
    group: "Notebook",
    summary:
      "A folded corner and a single personal aside, held in soft green paper.",
    code: "<StickyNote>\n  Remember to leave a little\n  room for curiosity.\n</StickyNote>",
    props: [
      ["children", "ReactNode", "—"],
      ["tone", "sage | peach | lavender | paper", "sage"],
      ["folded", "boolean", "true"],
    ],
    guidance:
      "Reserve folded corners for brief annotations. The shadow belongs to the transparent container so it follows the clipped paper silhouette. Keep note content readable.",
    origin: "Adapted",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "journal-list",
    name: "Journal list",
    group: "Notebook",
    summary: "Five meaningful marks, kept true to the personal notebook key.",
    code: "<JournalList label=\"Today’s notebook\" items={[\n  { id: 'plant', type: 'task', content: 'Plant a small idea' },\n  { id: 'space', type: 'completed', content: 'Make a little space' },\n  { id: 'thought', type: 'note', content: 'Leave room to grow',\n    meta: 'In the margins' }\n]} />",
    props: [
      ["items", "JournalEntry[]", "required"],
      ["item.id", "string; stable, unique identity", "required per item"],
      [
        "item.type",
        "task | completed | event | note | migrated",
        "required per item",
      ],
      ["item.content", "ReactNode", "required per item"],
      ["item.meta", "ReactNode", "—"],
      ["label", "string; accessible list name", "—"],
    ],
    guidance:
      "The marks mean task, completed task, event, note and migrated task. Keep these meanings intact; migration does not mean in progress. Use stable item IDs rather than array positions.",
    origin: "Adapted",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "triple-banner",
    name: "Ribbon banner",
    group: "Notebook",
    summary:
      "Three connected paper faces draw, fill, and reveal their handwritten thoughts. One width follows the longest section.",
    code: '<RibbonBanner lines={["Paper & patience", "A little curiosity", "Room to grow"]}\n  tone="accent" animate replayOnClick\n  colors={{ face: "#fbf9f1", reverse: "#bfd0c4", ink: "#0e7c79", outline: "#272d30" }} />',
    props: [
      [
        "lines",
        "[ReactNode, ReactNode, ReactNode]; three visible labels",
        "required",
      ],
      ["tone", "accent | sage | peach | ink", "accent"],
      [
        "colors",
        "{ face?, reverse?, ink?, outline? }; CSS color values",
        "semantic tone colors",
      ],
      [
        "animate / quiet",
        "boolean; draw once / completed and still",
        "false / false",
      ],
      ["speed", "0.5 | 1 | 1.5 | 2", "1"],
      ["replayKey", "string | number; change to draw again", "0"],
      [
        "replayOnClick",
        "boolean; stable native replay button (requires animate)",
        "false",
      ],
      [
        "label",
        "string; replay button name",
        "plain text lines, otherwise triple banner",
      ],
      ["native div attributes", "HTMLAttributes except children", "—"],
    ],
    guidance:
      "Give three related phrases one clear landmark. All faces share the width of the longest section, wrap at the available width, and grow vertically with their real text. Ink outlines draw first, paper and reverse folds fill next, then handwritten labels write on from left to right without moving. Keep labels plain and noninteractive when replayOnClick wraps the artwork in a button. Quiet and reduced motion show completed artwork immediately.",
    usage:
      "Import RibbonBanner (or its compatible TripleBanner name) and styles.css from @domlee/ui. Use a semantic tone, or override individual face, reverse, ink and outline colors through colors. Set max-width on its container. Text stays selectable without replay; use headings only when replay is off and the hierarchy calls for them. Tap, click, Enter, or Space replays when enabled. See docs/RIBBON-BANNER.md for sizing, timing and theming.",
    origin: "Original",
  },
  {
    id: "bookmark-drawing",
    name: "Bookmark drawing",
    group: "Brand",
    summary:
      "A fine ink bookmark hanging from a little rail, with a V-cut or pointed tip and a quiet teal seam.",
    code: '<BookmarkDrawing variant="notched" replayOnClick\n  label="A little bookmark for a thought worth keeping" />\n<BookmarkDrawing variant="pointed" quiet />',
    props: [
      ["variant", "notched | pointed", "notched"],
      ["label", "string; omit for decorative artwork", "—"],
      [
        "animate / quiet",
        "boolean; draw once / completed and still",
        "true / false",
      ],
      ["speed", "0.5 | 1 | 1.5 | 2", "1"],
      ["replayKey", "string | number; change to draw again", "0"],
      ["replayOnClick", "boolean; stable native replay button", "false"],
      ["native SVG attributes", "SVGProps except children and speed", "—"],
    ],
    guidance:
      "Leave room around the fine line work. A small color seam and a second light pen pass add depth without a solid block shadow. Keep it decorative beside equivalent visible copy, or give meaningful art a label. A bookmark drawing does not imply a working save control.",
    usage:
      "Import BookmarkDrawing and styles.css from @domlee/ui. SVG geometry scales to its container while the fine stroke keeps its weight. Enable replayOnClick for a persistent native button, or change replayKey from an external control. Quiet and reduced motion display finished ink.",
    origin: "Original",
  },
  {
    id: "notebook-sketch",
    name: "Notebook sketch",
    group: "Brand",
    summary:
      "Six original little drawings in fine ink, from an open journal to a camera, keyboard, and compass.",
    code: '<NotebookSketch variant="notebook" replayOnClick\n  label="An open journal, ready for a few good things" />\n<NotebookSketch variant="camera" replayOnClick />\n<NotebookSketch variant="keyboard" replayOnClick />\n<NotebookSketch variant="compass" quiet />',
    props: [
      [
        "variant",
        "notebook | flight | garden | camera | keyboard | compass",
        "notebook",
      ],
      ["label", "string; omit for decorative artwork", "—"],
      [
        "animate / quiet",
        "boolean; reveal once / completed and still",
        "true / false",
      ],
      ["interactive", "boolean; gentle pointer response", "true"],
      ["speed", "0.5 | 1 | 1.5 | 2", "1"],
      ["replayKey", "string | number; change to draw again", "0"],
      [
        "replayOnClick",
        "boolean; native button for click, tap, Enter, and Space",
        "false",
      ],
      ["className / style", "string / CSSProperties", "—"],
    ],
    guidance:
      "Give one small drawing room beside an introduction or empty state. The original curved paths draw once using the shared 1600ms sketch duration and 90ms stagger; no jitter or perpetual idle loop. Touch preserves vertical scrolling. Quiet mode and reduced motion show completed ink and stop pointer movement.",
    origin: "Original",
    usage:
      "Import NotebookSketch and styles.css from @domlee/ui. Size through width and max-width; SVG strokes keep their fine CSS-pixel weight. Give meaningful art a label; omit label beside equivalent visible text. replayOnClick adds a persistent native button, disabled in quiet/reduced motion; the drawing remounts while keyboard focus stays in place. Change replayKey for external replay. See The sketchbook for all six drawings.",
  },
  {
    id: "hairline-sketch",
    name: "Hairline sketch",
    group: "Brand",
    summary:
      "Hairline’s interactive objects, adapted to notebook paper, fine ink, and a small accent of color.",
    code: '<HairlineSketch variant="riffle" intensity={0.35} replayOnClick\n  label="A tray of notes that lifts toward your pointer" />\n<HairlineSketch variant="branches" replayOnClick />\n<HairlineSketch variant="loupe" quiet />',
    props: [
      ["variant", "riffle | branches | loupe", "riffle"],
      [
        "label",
        "string; accessible description",
        "description of selected figure",
      ],
      ["intensity", "number, clamped to 0…1", "0.35"],
      ["play", "boolean; opt in to the guided tour", "false"],
      [
        "replayOnClick",
        "boolean; native button to replay the ink sweep",
        "false",
      ],
      ["replayKey", "string | number; external replay control", "0"],
      ["quiet", "boolean; static drawing, no pointer response", "false"],
      ["onRead", "(text: string) => void; upstream readout", "—"],
      [
        "native div attributes",
        "except children, role, aria-label, tabIndex",
        "—",
      ],
    ],
    guidance:
      "Pointer movement and light touch explore each object. replayOnClick adds a keyboard-accessible button and a one-time ink sweep, without turning on the guided tour. Autoplay remains optional. Quiet mode and reduced motion reset to a finished illustration, disable replay, and stop pointer input. Keep essential information in visible text outside the drawing.",
    origin: "Extended",
    usage:
      "Import HairlineSketch and styles.css from @domlee/ui. The MIT licensed @lucasmarkes/hairline runtime supplies the original figures; Domino supplies the semantic palette and motion boundary. Theme variables need no ThemeProvider when you already supply Domino CSS tokens. Set --hairline-plate to the actual background if placing the illustration on a different paper surface. See The sketchbook for attribution and examples.",
  },
  {
    id: "hero-name",
    name: "Dom Lee.",
    group: "Brand",
    summary:
      "The original Poppins letterforms, sketched in outline and filled with one shared sweep of ink.",
    code: "<HeroName animate speed={1} replayKey={0}\n  style={{ fontSize: '72px' }} />",
    props: [
      ["animate", "boolean; draw on mount", "true"],
      ["quiet", "boolean; completed, still artwork", "false"],
      ["speed", "0.5 | 1 | 1.5 | 2", "1"],
      ["replayKey", "string | number; change to replay", "0"],
      ["label", "string; accessible SVG name", "Dom Lee."],
      ["className / style", "string / CSSProperties", "empty string / —"],
      [
        "native SVG attributes",
        "SVGProps<SVGSVGElement>, excluding children",
        "—",
      ],
    ],
    guidance:
      "Outlines 160–1180ms. Shared diagonal fill 1320–1980ms. Green period 2060–2240ms. Speed divides every time by its value. Size with fontSize; the SVG measures 4.39933em × 1.08em.",
    origin: "Original",
    usage:
      "Import from @domlee/ui. Change replayKey or the React key to replay; changing speed also remounts the artwork. quiet, animate={false}, and prefers-reduced-motion display completed artwork. className and style are supported.",
  },
  {
    id: "handwritten-note",
    name: "Handwritten note",
    group: "Brand",
    summary:
      "An informal voice in the margin. A Caveat annotation with a quiet, human rhythm.",
    code: '<HandwrittenNote tone="accent" animate>\n  a little room for curiosity\n</HandwrittenNote>',
    props: [
      [
        "children",
        "ReactNode; string children support letter animation",
        "required",
      ],
      ["tone", "accent | ink | muted | terracotta", "accent"],
      ["animate", "boolean; draw on mount", "false"],
      ["quiet", "boolean; completed, still artwork", "false"],
      ["speed", "0.5 | 1 | 1.5 | 2", "1"],
      ["replayKey", "string | number; change to replay", "0"],
      ["className / style", "string / CSSProperties", "empty string / —"],
    ],
    guidance:
      "Use handwriting for brief human asides. String children reveal for 70ms per letter with 75ms stagger and preserve whole-word wrapping. Keep body text in Lexend. Add SketchArrow separately when useful.",
    origin: "Adapted",
    usage:
      "Import from @domlee/ui. Change replayKey or the React key to replay; changing speed also remounts the artwork. quiet, animate={false}, and prefers-reduced-motion display completed artwork. className and style are supported. Only the listed props are supported. Non-string children remain visible without per-letter animation.",
  },
  {
    id: "crane",
    name: "Origami crane",
    group: "Brand",
    summary:
      "The original six paper facets, kept together as one recognizable little signature.",
    code: "<Crane label=\"Origami crane\" animate\n  style={{ width: '240px', color: '#0e7c79' }} />",
    props: [
      ["animate", "boolean; draw on mount", "false"],
      ["quiet", "boolean; completed, still artwork", "false"],
      ["speed", "0.5 | 1 | 1.5 | 2", "1"],
      ["replayKey", "string | number; change to replay", "0"],
      ["label", "string; accessible SVG name", "—; decorative and aria-hidden"],
      ["className / style", "string / CSSProperties", "empty string / —"],
      [
        "native SVG attributes",
        "SVGProps<SVGSVGElement>, excluding children",
        "—",
      ],
    ],
    guidance:
      "Preserve the six original facets. The outline and fill sequence lasts 2400ms per facet with 130ms stagger, ending at 3050ms at normal speed. Paper-colored artwork needs a contrasting panel.",
    origin: "Original",
    usage:
      "Import from @domlee/ui. Change replayKey or the React key to replay; changing speed also remounts the artwork. quiet, animate={false}, and prefers-reduced-motion display completed artwork. className and style are supported.",
  },
  {
    id: "garden-plant",
    name: "Garden plant",
    group: "Brand",
    summary:
      "Sage leaves, ink stems, and a terracotta pot. A small link back to the digital garden.",
    code: '<GardenPlant label="A little garden plant" animate />',
    props: [
      ["animate", "boolean; draw on mount", "false"],
      ["quiet", "boolean; completed, still artwork", "false"],
      ["speed", "0.5 | 1 | 1.5 | 2", "1"],
      ["replayKey", "string | number; change to replay", "0"],
      ["label", "string; accessible SVG name", "—; decorative and aria-hidden"],
      ["className / style", "string / CSSProperties", "empty string / —"],
      [
        "native SVG attributes",
        "SVGProps<SVGSVGElement>, excluding children",
        "—",
      ],
    ],
    guidance:
      "Keep the plant small and purposeful. Stems, leaves and pot finish around 2400ms. Omit label for decorative use; wrap it in a named button when replay is an action.",
    origin: "Adapted",
    usage:
      "Import from @domlee/ui. Change replayKey or the React key to replay; changing speed also remounts the artwork. quiet, animate={false}, and prefers-reduced-motion display completed artwork. className and style are supported.",
  },
  {
    id: "sketch-arrow",
    name: "Sketch arrow",
    group: "Brand",
    summary:
      "An ink arrow that feels drawn by hand and inherits the surrounding color.",
    code: '<Button variant="ghost" trailingIcon={<SketchArrow direction="up-right" />}>\n  Keep exploring\n</Button>',
    props: [
      [
        "direction",
        "up-right | down-right | left | right | up | undo | refresh | swap | chevron",
        "up-right",
      ],
      ["className", "string", "empty string"],
      [
        "native SVG attributes",
        "SVGProps<SVGSVGElement>, excluding children",
        "—",
      ],
    ],
    guidance:
      "Arrows are always decorative and hidden from screen readers. The containing control supplies its accessible name. Essential instructions cannot depend on arrows. There is no down direction.",
    origin: "Adapted",
    usage:
      "Import the shown components from @domlee/ui. Standard className, style, aria-* and native element attributes are supported unless a narrower API is described here.",
  },
  {
    id: "brand-banner",
    name: "Brand banner",
    group: "Brand",
    summary:
      "The original SVG ribbon: a notched strip or folded tails, drawn in outline before its paper fills with ink.",
    code: "<BrandBanner animate folded>\n  A little room to grow\n</BrandBanner>",
    props: [
      ["children", "ReactNode", "required"],
      ["folded", "boolean; layered folded geometry", "false; notched strip"],
      ["animate", "boolean; draw on mount", "false"],
      ["quiet", "boolean; completed, still artwork", "false"],
      ["speed", "0.5 | 1 | 1.5 | 2", "1"],
      ["replayKey", "string | number; change to replay", "0"],
      ["className / style", "string / CSSProperties", "empty string / —"],
    ],
    guidance:
      "Outline 0–800ms, fill 750–1200ms, label 1100–1400ms. The Kalam label sizes the ribbon intrinsically; proportional tracks keep it inside the painted face, including when long text wraps. Place this span inside an appropriate heading.",
    usage:
      "Import from @domlee/ui. Change replayKey or the React key to replay; changing speed also remounts the artwork. quiet, animate={false}, and prefers-reduced-motion display completed artwork. className and style are supported. Only the listed props are supported. Customize --dm-banner-paper and --dm-banner-ink for a deliberate alternate colorway.",
    origin: "Original",
  },
];

entries.push(
  {
    id: "annotation",
    name: "Annotation",
    group: "Notebook",
    summary:
      "A note pulled into the margin, with a curved ink arrow and room for a little more context.",
    code: '<Annotation title="a thought in the margin" arrow="right"\n  collapsible defaultOpen>\n  <p>Keep the things that make you curious.</p>\n</Annotation>',
    props: [
      ["title", "ReactNode", "required"],
      ["children", "ReactNode", "—"],
      ["arrow", "up | down | left | right | none", "right"],
      ["collapsible", "boolean; native details disclosure", "false"],
      ["defaultOpen", "boolean", "true"],
      ["className", "string", "—"],
    ],
    guidance:
      "Caveat belongs in the short title. Supporting copy uses Lexend. Keep the arrow decorative and the title meaningful. Native disclosure works with keyboard and touch.",
    usage:
      "Import Annotation from @domlee/ui. Use collapsible only for optional context; essential instructions remain visible. defaultOpen initializes a disclosure and is not a controlled state prop.",
    origin: "Adapted",
  },
  {
    id: "timeline",
    name: "Timeline",
    group: "Notebook",
    summary:
      "A line of ink that draws through meaningful milestones, with hand-lettered headings and a replayable reveal.",
    code: `import { useState } from 'react';
import { Button, Timeline } from '@domlee/ui';

export function Milestones() {
  const [replay, setReplay] = useState(0);
  return <>
    <Timeline label="An illustrative creative process" replayKey={replay}
      items={[
        {id:'begin', meta:'01 / BEGIN', title:'A small idea',
         description:'Write down the thing you keep thinking about.'},
        {id:'grow', meta:'02 / GROW', title:'A little momentum',
         description:'Keep the pieces that feel useful.'}
      ]} />
    <Button onClick={() => setReplay(value => value + 1)}>Replay timeline</Button>
  </>;
}`,
    props: [
      [
        "items",
        "readonly TimelineItem[]; {id, title, description, meta?}",
        "required",
      ],
      ["label", "string; accessible list name", "Timeline"],
      ["animate", "boolean; draw once on first viewport entry", "true"],
      ["quiet", "boolean; show the completed timeline immediately", "false"],
      ["replayKey", "string | number; change to draw again", "0"],
      ["className", "string", "—"],
      ["Native ol attributes", "OlHTMLAttributes<HTMLOListElement>", "—"],
    ],
    guidance:
      "Use stable milestone IDs and a meaningful chronological sequence. The hand-drawn connector reaches each node before the next milestone inks in; content remains readable throughout. The sequence plays once on first viewport entry. A separate Replay button can change replayKey without replacing list items or stealing link focus. Quiet and reduced motion show finished ink immediately. Supply real dates when relevant; sample stage labels describe an illustrative process.",
    usage:
      "Import Timeline and styles.css from @domlee/ui. It renders an ordered list with h3 headings and ordinary interactive content. Keep replay controls separate from the list, and change replayKey to redraw. animate={false}, quiet, and reduced motion keep it static. Full API, viewport behavior, and canonical timing are in docs/TIMELINE.md. Example milestones describe an illustrative process, not personal history.",
    origin: "Adapted",
  },
  {
    id: "polaroid-stack",
    name: "Polaroid stack",
    group: "Notebook",
    summary:
      "Real keepsakes in a reusable stack. Flick, tap, or use the arrows to slide one print beneath the next.",
    code: "const photos = [\n  {id: 'keyboard-top', src: '/images/snap75-top.jpg',\n   alt: 'SNAP-75 split keyboard from above', caption: 'every little detail.'},\n  {id: 'keyboard-desk', src: '/images/snap75-desk.jpg',\n   alt: 'Hand-soldered keyboard on a desk', caption: 'the first one I soldered.'},\n  // Add more entries with stable IDs, image paths, alt text, and captions.\n];\n\n<PolaroidStack label=\"Keyboard build photos\" photos={photos}\n  aspectRatio={16 / 9} />",
    props: [
      ["photos", "readonly PolaroidPhoto[]; any length", "required"],
      [
        "photo.src / photo.alt",
        "string / string; image URL and useful alternative",
        "required",
      ],
      ["photo.id", "string; unique stable identity", "image URL fallback"],
      [
        "photo.caption / photo.objectPosition",
        "string / CSS object-position",
        "— / center",
      ],
      ["label", "string; accessible group name", "Photo stack"],
      ["aspectRatio", "number; image width divided by height", "16 / 9"],
      ["quiet", "boolean; instant changes and no drag deformation", "false"],
      [
        "onIndexChange",
        "(index, photo) => void; once per accepted user action",
        "—",
      ],
      ["native div attributes", "HTMLAttributes except children", "—"],
    ],
    guidance:
      "Use useful alt text and stable IDs when photos can be added or reordered. Horizontal touch or pen drags follow the finger; a deliberate swipe or quick flick sends the top print beneath the stack. Short drags return gently. Vertical page scrolling and pinch zoom remain native. Clicking, tapping, keyboard Left/Right, and the previous/next arrows share the same selection. Quiet and reduced motion keep the finished arrangement still. No hover drift, autoplay, or blank backing cards.",
    usage:
      "Import PolaroidStack and styles.css from @domlee/ui. Supply image paths, alt text, and optional handwritten captions. The same component supports zero, one, or many photos, renders a small window of real prints, and keeps the current identity when a list is extended or reordered. Set aspectRatio for the collection and objectPosition for an intentional portrait crop. The example begins with the two public SNAP-75 photos; Add a sample print adds the illustrated Domino cover to demonstrate a third item. See docs/POLAROID-STACK.md for reuse and personal-site adoption.",
    origin: "Adapted",
  },
  {
    id: "flower-progress",
    name: "Flower progress",
    group: "Notebook",
    summary:
      "A little progress, one petal at a time. The garden’s original flower, with a count you can read.",
    code: "import { useState } from 'react';\n\nfunction Example() {\n  const [petals, setPetals] = useState(3);\n  return <>\n    <FlowerProgress value={petals} label=\"Ideas taking root\" />\n    <Button onClick={() => setPetals(v => (v + 1) % 6)}>\n      Find another petal\n    </Button>\n  </>;\n}",
    props: [
      ["value", "number; rounded and clamped", "required"],
      ["max", "positive number; rounded to petal count", "5"],
      ["label", "string; accessible progress name", "Flower progress"],
      ["className", "string", "—"],
    ],
    guidance:
      "Use actual discrete progress. Dashed petals are still to come; terracotta petals have been found. Text and progressbar semantics communicate the same count without depending on color.",
    usage:
      "Import FlowerProgress and Button from @domlee/ui and useState from React. max controls both the number of drawn petals and the progress maximum. The component is a read-only progress indicator; your application owns updates.",
    origin: "Adapted",
  },
);

entries.push(
  {
    id: "touch-feedback-setting",
    name: "Touch feedback setting",
    group: "Feedback",
    summary:
      "The personal notebook’s shared touch preference, with native Safari switch feedback where available.",
    code: `<TouchFeedbackProvider navigationKey="notebook">
  <TouchFeedbackSetting />
  <Button data-haptic="selection">Choose a page</Button>
</TouchFeedbackProvider>`,
    props: [
      ["compact", "boolean; omit helper copy", "false"],
      ["className", "string", "empty string"],
      ["label attributes", "HTMLAttributes<HTMLLabelElement>", "—"],
    ],
    guidance:
      "Mount the setting in a TouchFeedbackProvider to opt a region into feedback. It shares notebook-touch-feedback with the original site on the same origin. Reduced motion silences feedback. Safari provides a direct native tick; custom patterns and animation-finish pulses require the Vibration API.",
    usage:
      "Import TouchFeedbackProvider, TouchFeedbackSetting and Button from @domlee/ui plus styles.css. The provider is scoped; pass navigationKey on SPA location changes. Its nativeTapTargets boolean can disable transparent Safari targets. See Touch & haptics for the complete provider/helper API and Safari instructions.",
    origin: "Adapted",
  },
  {
    id: "ink-switch",
    name: "Ink switch",
    group: "Inputs",
    summary:
      "The original inked setting control, progressively enhanced into a real native switch for Safari touch feedback.",
    code: `import { useState } from 'react';

function Example() {
  const [checked, setChecked] = useState(true);
  return <label>Gentle reminders
    <InkSwitch checked={checked}
      onChange={event => setChecked(event.target.checked)} />
  </label>;
}`,
    props: [
      ["checked / defaultChecked", "boolean; native input state", "—"],
      ["onChange", "ChangeEventHandler<HTMLInputElement>", "—"],
      ["disabled", "boolean", "false"],
      ["className", "string", "empty string"],
      ["type", "fixed to checkbox", "checkbox"],
    ],
    guidance:
      "Use for an actual on/off setting with a visible label. The switch attribute is retained only when feedback is enabled and motion is not reduced. Native appearance must remain intact for Safari’s browser-managed feedback; unsupported browsers keep the inked checkbox fallback.",
    usage:
      "Import InkSwitch from @domlee/ui and styles.css. Native input attributes except type pass through. A surrounding label or aria-label must name the control. Use with TouchFeedbackProvider for the shared interaction scope, and TouchFeedbackSetting for the global preference. API detection does not prove a physical motor pulse.",
    origin: "Adapted",
  },
);

export const groups: Group[] = [
  "Actions",
  "Inputs",
  "Display",
  "Feedback",
  "Navigation",
  "Notebook",
  "Brand",
];
export const findEntry = (id: string) => entries.find((item) => item.id === id);
