# Agent handoff: adopt Domino UI

Replace the target and initial-scope placeholders, then paste the following into an agent working in that project. Choose a reviewed Domino UI commit rather than a moving branch. This prompt requests implementation in the target; it does not authorize a deployment or changes to unrelated projects.

```text
Integrate Domino UI into <TARGET_PROJECT_PATH_OR_REPOSITORY>.
Initial scope: <ROUTE, FEATURE, OR UI AREA TO MIGRATE>.
Design-system revision: <FULL_DOMINO_UI_COMMIT_SHA>.

Domino UI is the shared paper-and-ink design system for Dom Lee's personal
website, Quartz garden, and Obsidian workspace:
https://github.com/domogami/Domino-UI
Live visual notebook: https://ui.dominicklee.net/

Inspect the target repository's instructions, framework, current UI, routes,
theme controller, asset pipeline, and tests first. Implement the integration
within the requested scope and verify it in the target's actual runtime.
Keep its existing content, URLs, product behavior, accessibility, and features.
Use additive, reversible changes, and keep native platform behavior.

Read these source documents at the chosen revision before implementation:
- DESIGN.md: visual identity, typography, journal meanings, and motion.
- docs/ADOPTION.md: install, React starter, assets, and verification.
- docs/COMPONENTS.md: available component scope.
- docs/SHARED-SYSTEM.md: ownership, manifest, adapters, and rollback.
- docs/ACCESSIBILITY.md: interaction and readable-state requirements.
- docs/LAYERS.md for popovers, notifications, modals, drawers, and focus return.
- docs/ROUTING.md for content-only View Transitions and progressive page flow.
- docs/HAPTICS.md if adopting interactive touch feedback.
- docs/SKETCHES.md if using drawings.
- docs/QUARTZ.md or docs/OBSIDIAN.md for those native destinations.

Inspect actual exported APIs in src/lib/index.ts and their implementation
before using props. Do not invent component names or unsupported options.

Choose the appropriate implementation:

For React, install a pinned Git revision with:
npm install 'git+https://github.com/domogami/Domino-UI.git#<FULL_DOMINO_UI_COMMIT_SHA>'
Replace the placeholder. The package name is @domlee/ui; it is not currently
published to the npm registry. React and React DOM are peers, version 18+.
The Git package builds through prepare; use Node 24 for that build.
Import @domlee/ui/styles.css and @domlee/ui/fonts.css once in the supported
app entry. Mount ThemeProvider with defaultTheme="hybrid", and expose the
shared ThemeToggle. Keep routing, data, and layout owned by the target.
Account for SSR/prepaint/hydration and client component boundaries when
the target uses them. Do not mount competing theme/feedback controllers.

For Quartz, Obsidian, or another non-React destination, use generated tokens
and the native adapter instead of introducing React to restyle native UI.
The source is tokens/system.json plus src/adapters/*.css. Build with
npm run build:system; use the whole generated portable bundle, not the
source adapter alone. Generated outputs must not be hand-edited.
Preserve native theme attributes, controllers, editor/Markdown semantics,
graph/search behavior, and plugin integration. The prepared adapters have
not yet established that any destination is migrated or fully validated.

Keep these design decisions consistent:
- Hybrid is the default, with Light and Dark available. Hybrid means warm
  light working paper and charcoal navigation, with teal #0e7c79 accents
  on paper. Use semantic --dm-* roles, including the sidebar roles.
- Poppins is structural type, Lexend body text, IBM Plex Mono metadata/code,
  Kalam lettered headings, and Caveat short handwritten annotations.
  Self-host the supplied fonts and preserve their OFL notices.
- Keep the 32px dot-grid rhythm, folded banners that expand around text,
  restrained irregular corners, thin rounded ink, and generous reading space.
  Use shared controls, Chevron icons, drawings, and motion rather than
  duplicating them or substituting a generic handwritten aesthetic.
- Checkbox and TaskCheckbox share the garden's organic box and drawn check;
  TaskCheckbox also strikes completed copy. Preserve native state and keyboard
  behavior. RadioGroup has a finite ink fill and optional quiet mode.
- RibbonBanner (compatible name TripleBanner) is a standalone three-face
  Notebook ribbon. Use semantic tone or colors={face,reverse,ink,outline};
  all faces share the longest section width and wrap to their container.
  Enable animate plus replayOnClick for staged outline/fill/text replay.
- Use Popover for short contextual details, Dialog/Drawer for a modal task,
  and NotificationCard for an application-owned queue. Give each layer a clear
  title and actions; pass Dialog returnFocusRef for an explicit touch opener.
  Keep surfaces mounted through exit and preserve native top-layer behavior.
- Use NavTrail inside a dm-nav-trail-host for one moving selection surface
  across native links or buttons. Pass the host ref and committed activeKey;
  retain aria-current and router behavior. Optional dm-nav-icon SVGs have
  finite hover/focus/selection gestures; quiet/reduced motion settles instantly.
- Keep the navigation rail stationary during page changes. If the framework does not
  already own View Transitions, use createPageTransition around a synchronous
  route commit and one dm-page-transition content wrapper. Preserve history,
  scroll and focus, guard obsolete callbacks, and honor reduced motion.
- NotebookSketch offers notebook, flight, garden, camera, keyboard, compass.
  HairlineSketch offers riffle, branches, loupe, with upstream attribution.
  Use replayOnClick for click/tap/Enter/Space replay. Quiet and reduced
  motion show finished still art. Hairline play is a separate guided tour.
- Native adapters share styling; CSS does not add the React motion runtime,
  Hairline interaction engine, or a device haptics API.

For React touch feedback, use the shared TouchFeedbackProvider and setting,
pass a changing navigationKey from the target router, and keep it optional.
Use semantic feedback patterns and preserve visible/accessible outcomes.
Safari has no general navigator.vibrate support: only a directly activated
real native switch may provide a browser-managed tick on supported iPhones.
Read HAPTICS.md for the provider's native targets, gesture opt-outs, and
physical-device acceptance. Never claim felt haptics from browser emulation.

If static assets are needed, npx --no-install domino-ui-assets ./public
copies fonts and the theme-specific static sketches with license notices.
Adapt the destination to the target's public directory and base path;
verify the resulting URLs. Standalone web adapters include adjacent fonts;
the Obsidian snippet embeds them.

Fix shared visual decisions in Domino UI's canonical token/component/adapter
source when that checkout is available and the change is within authorization.
Otherwise report the needed shared change clearly. Keep unique product
layout local. Avoid permanent component forks, copied token literals,
global CSS overrides, or edits to a base Obsidian theme.

Record the adopted Git revision/package version and system-manifest.json
fingerprint, integration scope, remaining exceptions, and rollback steps
in the target's documentation. Verify the production build and runtime,
font requests, Hybrid/Light/Dark including saved preferences, mobile/reflow,
keyboard/focus, loading/disabled states, replay/reduced motion, and the
existing feature flows touched by the migration. Include screenshots of
the actual target and distinguish automated tests from physical testing.

Complete the authorized implementation rather than stopping at a plan.
Do not commit, push, publish, alter DNS, or modify another project unless
I separately authorize that release/action. Report what changed, the exact
revision adopted, the checks performed, limitations, and how to roll back.
```

For Dom's personal website, start from the current notebook routes in `dominicklee.net` and preserve the original wordmark choreography, touch preference, and independent legacy/archive designs. For the current Quartz design, inspect `obsidian-site/quartz/work/garden-v5`, retain its three-mode controller (`blended` means Hybrid), and preserve Flower Hunt and reading mode. For Obsidian, install the generated snippet over AnuPpuccin and verify the real editor and mobile app; leave private vault content out of the shared repository.

Source links: [design rules](https://github.com/domogami/Domino-UI/blob/main/DESIGN.md) · [adoption guide](https://github.com/domogami/Domino-UI/blob/main/docs/ADOPTION.md) · [public exports](https://github.com/domogami/Domino-UI/blob/main/src/lib/index.ts). For a fixed review, replace `main` in these links with the selected full commit SHA.
