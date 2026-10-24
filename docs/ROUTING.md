# Page flow

Routes feel like related sheets in one notebook. The document changes with a short fade and a small vertical settle while the navigation rail, theme control, and other persistent chrome keep their place. Content remains usable when the browser cannot capture a transition.

The live notebook uses this behavior throughout its hash routes. Start at `/#motion`, follow a page link, and use Back or Forward to try it. A modal or mobile drawer keeps its own existing motion instead of adding a second page animation.

## The shared rule

Name one content sheet, not the whole application. The shared treatment moves incoming content by 8px over the existing `layer-duration` of 240ms, with a 4px outgoing settle over `layer-exit-duration` of 160ms. Both use the shared paper/ink surfaces and layer easing. Avoid a large horizontal slide, 3D page turn, blurred page, or moving navigation rail for ordinary route changes.

`createPageTransition` is a progressive helper, not a router. Applications own URLs, history, loading, scroll restoration, and focus. The helper wraps a synchronous DOM commit, scopes the shared snapshot CSS, and discards obsolete queued commits. `@domlee/ui/styles.css` includes its styles.

```tsx
import { flushSync } from "react-dom";
import { createPageTransition } from "@domlee/ui";
import "@domlee/ui/styles.css";

// Create one controller for the router's lifetime.
const pages = createPageTransition();

export function commitPage(updateReactRoute: () => void) {
  return pages.run(
    () => {
      // The browser must capture the committed DOM, not a queued React render.
      flushSync(updateReactRoute);
    },
    {
      skip: Boolean(document.querySelector("dialog:modal")),
    },
  );
}

// In the application shell, put exactly one wrapper around route content:
// <main className="dm-page-transition">{routeContent}</main>
// Keep navigation and persistent overlays outside that wrapper.
// Call pages.cancel() when the router is torn down.
```

Run the helper from a browser navigation event or the router's commit boundary. Do not call `flushSync` from render or a React effect. Finish data loading first, or use the router's own pending-navigation handling; this helper is not a data-loading scheduler. If a framework already owns View Transitions, use that integration once and carry over the same content scope and motion rules. [React's `flushSync` guidance](https://react.dev/reference/react-dom/flushSync) explains the synchronous integration boundary.

## API

```ts
const pages = createPageTransition({ document?: Document });

await pages.run(update: () => void, { skip?: boolean });
pages.skip();
pages.cancel();
```

| Operation                     | Behavior                                                                                                                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `run(update)`                 | Captures a same-document change when supported. Resolves after that transition finishes. The update runs immediately when capture is unsupported, motion is reduced, the document is hidden, or `skip` is true. |
| `run(update, { skip: true })` | Commits immediately and ends an older visual transition. Use when a modal or browser-owned navigation animation already explains the change.                                                                    |
| `skip()`                      | Stops current visual motion while leaving its queued DOM update valid. Useful when the browser or application needs to stop animating.                                                                          |
| `cancel()`                    | Stops the visual state and invalidates pending updates. Use on router teardown. The controller can subsequently be reused.                                                                                      |
| `document`                    | Optional document for an embedded application. The default is the current document, read when `run` is called. Constructing the controller is safe during SSR.                                                  |

Keep one `.dm-page-transition` wrapper in the captured document. Its unique snapshot name is `dm-page-content`. The controller temporarily marks the root with `data-dm-page-transition`; that scope removes the root snapshot and names only the content sheet. It removes the marker after completion, cancellation, or an immediate fallback. The transition overlay allows pointer events through so a fast second navigation can supersede the first.

A skipped View Transition still executes its update callback. The controller uses a monotonic generation check inside that callback, so delayed callbacks from an older navigation cannot put the old page back. Starting a new route skips the preceding visual transition. Expected capture rejection is handled separately from an update failure; a failed application update still rejects the returned promise. [The View Transitions specification](https://drafts.csswg.org/css-view-transitions/#dom-document-startviewtransition) describes this callback-ordering behavior.

## Notebook routing contract

The catalog retains its existing hash URLs and native links. It listens to both `popstate` and `hashchange`, deduplicates the same destination, and commits React state through `flushSync` inside the transition callback. That covers regular links, keyboard activation, search selection, Back, and Forward without intercepting modified clicks or taking over browser history.

Actual route changes keep the notebook's existing scroll-to-top behavior. This iteration does not add per-history-entry scroll restoration. Same-route hashes and existing in-page anchor targets retain their normal behavior and do not start a page transition. A malformed encoded hash becomes a normal unknown route instead of throwing during decoding.

The router keeps the existing focus contract: desktop links retain keyboard focus; the mobile drawer and search dialog restore their openers through their own lifecycle. Page snapshots do not add a focus trap, a new tab stop, or a screen-reader-only duplicate of the content. The live DOM remains the semantic interface. If another application normally moves focus to a new page heading or restores a saved scroll position, perform that work as part of its committed update and preserve it with or without animation.

Snapshots are bypassed while a native modal is active, a custom modal is marked `aria-modal="true"`, or the mobile navigation is still moving. A supported `hasUAVisualTransition` signal also bypasses author motion so an interactive browser Back gesture does not receive a second animation. Unsupported browsers use the same immediate route commit. Reduced motion skips capture entirely; changing to reduced motion while a transition is active ends the visual motion. [Chrome's same-document guide](https://developer.chrome.com/docs/web-platform/view-transitions/same-document) documents capture, interruption, and browser-owned navigation transitions.

## Same-document and cross-document transitions

The notebook is a React application whose hash changes reuse one document. It therefore uses `document.startViewTransition` around the actual route commit. Adding a cross-document CSS rule alone would not animate these changes.

A site with separate same-origin HTML documents can instead opt both documents into cross-document transitions with `@view-transition { navigation: auto; }`. It must apply consistent unique snapshot names on both pages and preserve a still fallback and reduced-motion handling. That opt-in belongs to the consuming site; the component stylesheet does not enable it globally. See [Chrome's cross-document guide](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document) before adopting it in the personal site or Quartz.

The requested [Coding2GO video, “CSS Can Now Animate Between Pages”](https://www.youtube.com/watch?v=XH1G58QqPIM), demonstrates that cross-document CSS approach. Its useful direction here is a named content region with still navigation and progressive support. The notebook adapts that direction to its existing same-document React router.

## Verify the destination

Check the actual production build in its target browsers:

- The new route is captured after its DOM, title, and intended scroll position are committed; persistent chrome stays still.
- Fast navigation, including out-of-order skipped callbacks, leaves the latest route visible and no root marker behind.
- Back, Forward, keyboard links, in-page anchors, modified links, search, and mobile navigation retain their normal behavior.
- Unsupported capture, capture failure, hidden documents, and reduced motion commit readable content without delay.
- Modal closing, focus restoration, and scroll locks work independently of the page snapshot.

Desktop browser tests do not establish physical iPhone gesture behavior. Keep browser-owned navigation motion progressive and test swipe-back on the target device before making that claim.
