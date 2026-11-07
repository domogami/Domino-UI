# Search and reading tools

Import `ActionMenu`, `CommandPalette`, `ReadingControls` and their types from `@domlee/ui/story-tools`, then import `@domlee/ui/story-tools.css` beside the existing system styles. Full library builds also export the components from `@domlee/ui`.

## CommandPalette

`CommandPalette` is a controlled, settling Domino Dialog. Supply `open`, `onOpenChange`, `query`, `onQueryChange`, `items` and `onSelect(id)`. Optional `filters`, `status`, `loading` and `emptyState` support local indexes and asynchronous sources without putting product-specific data fetching into the component. Each item has a stable `id`, plain-text `label`, optional `description`, `group`, `icon`, `meta` and `disabled` state.

The search input retains focus while arrow keys, Home/End and pointer movement select an option. Enter requests that option; Escape closes the search layer. Available results remain usable while another source is loading. `onAfterClose` reports actual native modality release once per opened cycle. Keep navigation pending until that callback, and clear pending targets when the user/session changes.

The application owns Cmd/Ctrl+K. Do not replace a rich editor's link shortcut or intercept IME composition. Do not index private drafts, other accounts' data or hidden administrative records just because the browser has them in memory. Show partial-source failures and an explicit retry instead of silently reporting that nothing exists. Query text does not need to leave the device for local indexes.

## ReadingControls

`ReadingControls` takes `value` (percent), `onValueChange`, `quiet` and `onQuietChange`. Defaults are `min={90}`, `max={150}`, `step={10}`; Reset chooses 100% within the permitted bounds. Size controls and the quiet toggle stay labeled, keyboard-accessible and large enough to tap. The current percentage is announced without shifting focus.

The application owns persistence and scope. A reading preference belongs to the reader, not to the entry. Apply larger text to prose and editing text without enlarging every navigation item. Quiet view should calm decoration and secondary controls while keeping the exit and reading controls reachable; it must not alter saved writing or start/stop audio unexpectedly. Compose font size with existing font preferences and preserve usable controls at narrow widths.

## Package compatibility

`scripts/build-story-tools-package.mjs base.tgz output.tgz` creates an additive consumer package. It preserves every existing package file byte-for-byte except the manifest's added exports, then adds only the tools, their CSS/types and these guides. The new JS imports the existing package for base Button/Dialog/Input, preserving its current modal fixes and visual components. A provenance receipt verifies the preserved files and package hashes. This route is for consumers pinned to a compatible package while the design-system default branch catches up; it does not replace the normal full library build.
