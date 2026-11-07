# Consistent action menus

An action menu belongs to one entry. Its accessible trigger names that entry, for example **Actions for Field notes**. Keep the same wording, icons and order wherever that entry appears. A reading page and a card must not give the same action different names.

Use `ActionMenu` for a short action list, `Popover` for contextual controls and `Dialog` for a focused task. The primary task can remain visible beside the menu. Menu items are commands, not navigation tabs.

| Order | Group | Labels and meaning |
| --- | --- | --- |
| 1 | Open or edit | **Open**, **Edit**, or a specific object such as **Edit shared details**. Avoid a second synonym elsewhere. |
| 2 | Personal contribution | **Write my notes** or **Edit my notes** when authorship is independent. Never imply that this edits somebody else's writing. |
| 3 | Organize | **Highlight** / **Remove highlight**. Use a checked menu item when the state is reversible. |
| 4 | Take a copy | **Save photos**, **Export**, or **Add to calendar**. Specify the actual object and do not promise a device destination the browser cannot verify. |
| 5 | Inspect | **Version history** for earlier versions and their authors. |
| 6 | Destructive | A separator followed by **Archive** or **Remove**. Reserve **Delete permanently** for actual irreversible destruction. |

Only include available actions. Do not show an empty group or separator. A transiently unavailable command may remain disabled when its presence helps explain the workflow. Hide commands that the viewer can never perform. Destructive actions require an appropriate confirmation or a genuine Undo path supplied by the application.

## Component example

```tsx
<ActionMenu label="Actions for Field notes" items={[
  { id: "edit", label: "Edit", icon: <Pencil />, onSelect: edit },
  { id: "highlight", label: highlighted ? "Remove highlight" : "Highlight",
    checked: highlighted, onSelect: toggleHighlight },
  { id: "export", label: "Export", separatorBefore: true, onSelect: exportEntry },
  { id: "history", label: "Version history", onSelect: showHistory },
  { id: "remove", label: "Remove", danger: true, separatorBefore: true,
    onSelect: confirmRemoval },
]} />
```

Icons decorate visible labels. Each target is at least 44px high. Arrow keys, Home/End and typeahead browse enabled actions; Escape closes only the menu and restores its trigger. Tab leaves the menu within the current modal when applicable. The panel fits the visual viewport and is portaled into the current dialog when one is open. Selection runs after the retained menu closes, so a following dialog gets focus cleanly.

Applications own the actions, authorization, unsaved-draft protection, confirmation and history. A menu never mutates data itself. A displayed shortcut is a hint; the app must implement and document its handler. Reduced Motion removes the settling movement.
