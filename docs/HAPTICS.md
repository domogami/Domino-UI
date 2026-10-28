# Touch feedback and Safari

Touch feedback is part of the notebook's interaction language: a small tap for an action, a tick when a selection changes, and a quiet finish to an explicitly replayed drawing. It is an optional enhancement. Every action still needs its ordinary visual state, accessible name, keyboard behavior, and readable success or error message.

The React implementation is captured in `src/lib/haptics.tsx`, `nativeTapTargets.ts`, and `haptics.css`. Auxiliary-target eligibility is owned by the shared `isNativeTapTargetEligible` policy. The visual notebook mounts one `TouchFeedbackProvider` around the application, so eligible buttons in its chrome, component pages, and layers share the same controller. The sidebar’s **Touch feedback** setting and the guide’s setting control one saved preference. Importing the library alone does not install a controller into another project; consumers mount their own provider. The **Touch & haptics** page provides examples and Safari instructions.

## Source and evidence

Captured on October 22, 2026 from the personal website's local source:

| Source in `dominicklee.net`                                | Behavior captured                                                                                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `app/components/TouchFeedback.tsx`                         | Named patterns, stored preference, trusted touch/pen gating, cancellation, animation finish cues, native settings switches    |
| `app/components/nativeTapTargets.ts`                       | Historical native switch targets over buttons and disclosure summaries; disclosure overlays are now excluded by shared policy |
| `app/styles/touch-feedback.css`                            | Hand-drawn switch fallback, native appearance, transparent rendered targets, pressed state                                    |
| `docs/weather-journal.md`, “Touch feedback and pen arrows” | Notebook/weather/calculator intent, Safari findings, previous physical-phone report, test limits                              |
| Notebook, weather, and calculator callers                  | Selection ticks, replay cues, calculator success/error, quiet ambient animation                                               |

The original capture records a successful direct-tap sample on Dom’s iPhone in Safari. On October 25, 2026, Dom also confirmed that this notebook’s live **Native switch example** produces a tick on his iPhone. That verifies the real switch sample on that device; automated browser tests establish event forwarding and coverage, not felt output from every enhanced button. The original platform references below were retrieved on October 22, 2026.

## The shared feedback vocabulary

These values are retained exactly from the personal website. They are milliseconds for the Vibration API, not intensity levels or guarantees of a perceptible effect. Arrays alternate vibration, pause, vibration.

| Name        | Pattern        | Intended use                                             |
| ----------- | -------------- | -------------------------------------------------------- |
| `tap`       | `6`            | A deliberate button action                               |
| `selection` | `4`            | A discrete tab, forecast hour, or graph selection change |
| `draw`      | `5`            | The end of a user-replayed drawing                       |
| `success`   | `[9, 45, 12]`  | A completed calculation or confirmed result              |
| `error`     | `[14, 45, 14]` | An invalid calculation or action requiring correction    |

Safari's native switch path produces its own browser-managed tick at direct activation. It cannot reproduce the millisecond patterns or schedule a later drawing-finish vibration. The same semantic name therefore describes the interaction's meaning across devices, while available tactile output differs.

Use feedback at meaningful boundaries. Tick when graph selection changes, not on every pointer-move pixel. Automatic page drawings, hover, decorative rain, idle animation, and background work remain quiet. No action may depend on a user feeling a pulse.

## What runs on each platform

| Environment                                             | Available path                                                                           | Practical limit                                                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Touch browser exposing `navigator.vibrate`              | Named Vibration API patterns and eligible finish cues                                    | Hardware, browser policy, activation, and OS settings determine whether vibration occurs    |
| Safari on a supported iPhone                            | Direct activation of a real native HTML switch; progressive targets for eligible buttons | One browser-managed switch tick, not an arbitrary haptics API                               |
| Safari on iPad or macOS                                 | Native switch UI may be available                                                        | Switch support does not establish tactile hardware or a felt pulse; verify the exact device |
| Other unsupported browsers, mouse/keyboard interactions | Ordinary component behavior and visible feedback                                         | No simulated motor output is added                                                          |
| Quartz CSS adapter or Obsidian CSS snippet              | Shared visual tokens and controls                                                        | CSS alone cannot call a motor API; runtime integration would be separate work               |

MDN currently lists Safari and Safari on iOS as unsupported for `navigator.vibrate`. The method requires user activation where supported; calling it with `0` cancels a pattern. A successful API result is not proof that the user felt anything. [MDN: `Navigator.vibrate()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate).

WebKit introduced `<input type="checkbox" switch>` in Safari 17.4 and announced switch haptic feedback for Safari on iOS 18. These are distinct support milestones. Detect the feature; do not use a version number or a user-agent string as proof that a motor is usable. [WebKit: HTML switch](https://webkit.org/blog/15054/an-html-switch-control/), [WebKit: Safari 18](https://webkit.org/blog/15865/webkit-features-in-safari-18-0/#html).

## Using it in Safari on iPhone

1. Open the [live notebook guide](https://ui.dominicklee.net/#haptics) directly in Safari on the physical iPhone. The [personal-site comparison](https://dominicklee.net/studies/haptics) is another reference. The desktop’s `127.0.0.1:5173` address points back to the phone when opened there; use the public URL for a phone test.
2. Enable **Touch feedback** in the sidebar (open the menu on mobile) or in the guide. Both use one preference on this site. It defaults on and persists locally as `notebook-touch-feedback`; `off` suppresses feedback. The library honors the same key when adopted on the same origin. Settings are not synchronized between domains or apps.
3. This system deliberately stays quiet with the device's reduced-motion preference enabled. Keep that preference respected; only change it for a comparison if you want to.
4. Tap the actual native switch with a finger first. Then tap a supported button in the examples. A direct native tick may be felt. Replaying a drawing does not add a second finish pulse on Safari.
5. If there is no feedback, verify the device and Safari version, then check whether device vibration is disabled. Apple documents **Settings → Accessibility → Touch → Vibration** as the master vibration setting. Do not interpret a lack of vibration as a failed button action. [Apple: vibration settings](https://support.apple.com/guide/iphone/turn-off-vibration-iphd722c9100/ios).

There is no general Safari `navigator.vibrate` permission or JavaScript call to enable here. Enabling keyboard haptics is a separate OS feature; it does not grant a website a custom vibration API. The useful first diagnostic is a real native switch on the actual device.

## Coverage in the living notebook

The provider stays mounted across routes. Eligible small buttons, theme controls, search, tabs, replay controls, and modal/popover actions receive the shared enhancement. Disclosure and navigation controls with `aria-expanded` retain their native touch target; their supported Vibration API feedback remains available. The guide and layer examples reuse this same controller rather than mounting nested providers.

Safari uses one direct native switch tick. It cannot play the Android duration patterns or a delayed drawing-completion pulse. Links and large swipe/scroll surfaces retain their native gestures; artwork replay surfaces opt out of a switch overlay while their separate replay buttons can still receive it. Native checkbox/radio behavior is preserved. Touch feedback defaults on, honors the saved preference, and stays quiet under reduced motion.

## Safari implementation: a real control and a real tap

The smallest standalone example is a genuine on/off setting, with a label and the native appearance retained:

```html
<label for="touch-feedback">Touch feedback</label>
<input id="touch-feedback" type="checkbox" switch checked />

<style>
  #touch-feedback {
    appearance: auto;
    accent-color: var(--dm-accent, #0e7c79);
  }
</style>
```

On an unsupported browser this remains a checkbox. On supported Safari, let the user activate the control directly. Keep native appearance for the native feedback path. The custom journal appearance is the fallback used when native feedback is unavailable or disabled. WebKit documents `accent-color` support and checkbox fallback for this markup. [WebKit: HTML switch](https://webkit.org/blog/15054/an-html-switch-control/).

The production source additionally enhances eligible buttons. Disclosure summaries, controls inside summaries, and controls with `aria-expanded` retain their native touch targets and receive no auxiliary switch overlay. It feature-detects `"switch" in document.createElement("input")`, checks that the Vibration API is absent and a coarse pointer is available, and creates a transparent but rendered native switch target matching the visible control's geometry. The switch is a sibling in a separate layer, not an interactive child inside a button. Its real trusted tap toggles the switch; the handler then focuses and activates the original button once.

The real button retains its accessible name, role, keyboard handling, and focus. The auxiliary input is excluded from tab order and the accessibility tree. Layers account for scroll clipping, viewport changes, and open dialogs. These details are part of the implementation, so use the shared provider instead of copying only a transparent input into an app.

This is a browser-dependent progressive enhancement, not a portable standard haptics API. In particular:

- Never try to create custom Safari patterns with a hidden input, scripted `input.click()`, scripted `label.click()`, or a timer. WebKit's `fc1ef83` patch adds an explicit regression test that a scripted label click cannot generate feedback, even when called from another real click. Current switch code also checks event trust and active user-gesture processing. [WebKit patch](https://github.com/WebKit/WebKit/commit/fc1ef83), [current switch implementation](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/CheckboxInputType.cpp).
- Do not cover text links, swipe surfaces, draggable graphs, or controls whose default touch behavior must be retained. Use `data-native-tap="none"` on a control or ancestor boundary to exclude auxiliary targets throughout that subtree while retaining any supported Vibration API behavior. Use `data-haptic="none"` to exclude both paths.
- Test scroll gestures that begin directly over a target. WebKit bug 321591 reports switches swallowing a pan and toggling when released elsewhere on iPhone Safari 26.5.2. A fix is proposed in PR 71769; the retrieved evidence does not establish that it shipped. Clipping a layer to its scroll host fixes geometry, not this browser gesture behavior. Exclude affected controls when scrolling needs the original touch target. [WebKit bug 321591](https://bugs.webkit.org/show_bug.cgi?id=321591), [proposed change](https://github.com/WebKit/WebKit/pull/71769).

## Scroll safety and disclosure policy

Scroll safety takes priority over an auxiliary Safari switch tick. A large disclosure row is also a place where someone starts a page pan; putting a real switch over it changes the browser's gesture handling. The shared policy excludes `summary`, controls inside a summary, and controls with `aria-expanded`. `Accordion` also supplies a `data-native-tap="none"` boundary so its expanded content retains ordinary touch targets. Reading surfaces and other gesture-sensitive regions should set the same boundary explicitly:

```tsx
<main data-native-tap="none">
  <details>
    <summary>Read more</summary>
    <p>The page remains a normal scrolling surface.</p>
  </details>
</main>
```

This opt-out concerns auxiliary switch overlays. It does not disable Android's supported Vibration API path or remove a real, visible `InkSwitch` used for an on/off setting.

Eligibility must be checked before reading geometry or creating a proxy. Nonzero `getBoundingClientRect()` dimensions alone do not prove that a control is rendered: WebKit can retain nonzero boxes for content inside a closed disclosure. The policy uses `checkVisibility()` when available and explicitly rejects closed-details content and hidden, inert, or `aria-hidden` subtrees. Keep the closed-details check even when a browser exposes `checkVisibility()`. Existing proxies must be removed when a control becomes ineligible, including after collapse; a stale transparent proxy must not remain over unrelated visible content.

Existing non-React controllers and adapters must consume the same policy rather than copying its conditions:

```ts
import { isNativeTapTargetEligible } from "@domlee/ui/native-tap-policy";

// In the controller's candidate pass, before measuring or creating a proxy:
if (!isNativeTapTargetEligible(control)) continue;
```

The helper is also exported from `@domlee/ui`. The `native-tap-policy` subpath imports neither React nor component CSS and does not install a controller. The adapter still owns its controller lifecycle and must remove proxies omitted from the eligible set.

The October 28, 2026 voting-guide regression made both failure modes concrete: broad summary overlays could capture an attempted pan, and hidden disclosure content could leave misleading geometry for auxiliary targets. Fix the shared eligibility policy and adopt it in existing controllers; a page-specific CSS patch or pointer-movement threshold does not repair WebKit's native switch touch arbitration. The linked WebKit bug and proposed browser fix remain open as of that review.

## React integration

Mount one `TouchFeedbackProvider` around the interactive app. It supplies the local preference, event listeners, and scoped native targets inside a `data-domino-haptics` boundary. Importing the library alone never instruments a host document. It does not require React Router. Pass a changing `navigationKey` (or its `routeKey` alias) when client navigation changes the page, so pending feedback is canceled; hash changes and history navigation are also observed. `TouchFeedback` is an alias for the provider.

```tsx
import {
  Button,
  InkSwitch,
  ThemeProvider,
  TouchFeedbackProvider,
  TouchFeedbackSetting,
} from "@domlee/ui";
import "@domlee/ui/styles.css";

export function Notebook({ routeKey }: { routeKey: string }) {
  return (
    <ThemeProvider defaultTheme="hybrid">
      <TouchFeedbackProvider routeKey={routeKey}>
        <TouchFeedbackSetting />
        <Button data-haptic="selection">Next page</Button>
        <label>
          Gentle reminders
          <InkSwitch defaultChecked />
        </label>
      </TouchFeedbackProvider>
    </ThemeProvider>
  );
}
```

Standard buttons and supported controls receive a `tap` by default after recent trusted touch/pen input. `data-haptic="selection"`, `"draw"`, `"success"`, or `"error"` selects a semantic pattern. `data-haptic="manual"` suppresses the automatic Vibration API click pulse when an action owns its feedback; Safari still has only its direct native tick. `data-haptic="none"` suppresses both paths.

Use `useTouchFeedback()` for explicit selection or result feedback. It returns `enabled`, `reducedMotion`, `setEnabled`, `haptic`, and `armHapticCue`, plus browser-capability information. `capability` is `"vibration-api"`, `"native-switch"`, or `"unavailable"`; this describes available browser features, not verified tactile output. The same `haptic()` and `armHapticCue()` helpers are exported directly for adapters and existing callers.

```tsx
import { Button, useTouchFeedback } from "@domlee/ui";

function ConfirmEntry() {
  const { haptic } = useTouchFeedback();
  return (
    <Button data-haptic="manual" onClick={() => haptic("success")}>
      Confirm entry
    </Button>
  );
}
```

`TouchFeedbackProvider` accepts `nativeTapTargets={false}` to disable transparent Safari button targets independently of visible native switches. This is useful for affected scrolling or gesture-heavy pages; a smaller `data-native-tap="none"` ancestor boundary can protect one reading region without adding a second provider.

`InkSwitch` takes normal React input props except `type`, which is fixed to `checkbox`. Use it for an actual on/off setting; `nativeSwitchProps` is also exported for adapters that need the native attribute. The named timing values are exported as `hapticPatterns`. Avoid embedding a second independently configured feedback controller in a destination that already mounts this provider.

## Animation cues and cancellation

Call `armHapticCue(id, "draw")` only from a deliberate replay handler. Put that ID in `data-haptic-cue` on the element whose CSS animation completes. Use `data-haptic-animation` to match one animation name when the element has several. The existing `HeroName` choreography is preserved; feedback should only be attached through an explicit replay, never automatic page load.

```tsx
const { armHapticCue } = useTouchFeedback();

// Inside a real replay handler:
armHapticCue("plant-replay", "draw");
// Restart the actual drawing animation through the component's normal state.

// On the animated element:
// data-haptic-cue="plant-replay" data-haptic-animation="draw-plant"
```

The system follows `animationend` instead of inventing a parallel timeout. Arming requires a real touch/pen input in the last 1,200ms; an armed cue expires after 5,000ms. Accepted motor calls are rate limited to one every 65ms. New pointer input clears pending cues; route changes, loss of focus, hidden/page-hide state, turning feedback off, and reduced motion cancel queued feedback and any accessible motor pattern. Hidden, unrendered, or motion-paused targets cannot complete a cue. These guardrails are shared interaction behavior, not browser support guarantees.

Hybrid, Light, and Dark all use the same feedback vocabulary and preference. Theme changes affect visual tokens, not pulse strength. The haptic setting remains independent of theme, and reduced motion silences the enhancement in every theme.

## Adoption and verification

The personal website can eventually replace its existing module with the shared React implementation, preserving the preference key, caller meanings, native switch behavior, and route cancellation. Quartz can reuse the vocabulary in its native runtime if a small JavaScript integration is deliberately added. Obsidian's snippet only carries visual styling; haptics would need a separately evaluated runtime/plugin path. The current CSS adapter bundles do not add that behavior.

Automated tests can verify requested patterns, gesture gating, cancellation, preference persistence, single activation, focus, eligibility, stale-proxy removal after disclosure collapse, target positioning, disabled states, and fallback behavior. Mocking `navigator.vibrate`, emulating a coarse pointer, or running Playwright WebKit cannot establish a felt pulse on physical iPhone hardware.

Before accepting a destination, record the device model, OS/browser version, URL or build, theme, motion setting, and feedback preference, then check:

- A real native switch and each supported button produce the expected single activation with a finger.
- Success/error patterns and drawing finish cues work on a physical Vibration API device; Safari gives only its direct native tick.
- Turning feedback off and enabling reduced motion silence both paths; the preference survives reload.
- Keyboard, mouse, screen-reader controls, focus restoration, text selection, links, graph dragging, calculator caret editing, and dialog controls remain usable.
- Perform genuine pans that start directly on a disclosure heading and on its expanded body, in both directions and with releases outside the starting control. Verify that the page or intended scroll panel moves and that a pan does not toggle the disclosure. Repeat after collapse and reopen; check that no hidden-content proxies remain. Also test any remaining auxiliary switch target. Programmatic `scrollTo()` does not exercise touch arbitration.
- Navigation, blur, hidden/background state, interrupted animations, and rapid repeated input leave no delayed feedback.
- Hybrid, Light, and Dark retain consistent visual feedback and readable states when no tactile output is available.

Desktop WebKit with an iPhone viewport can verify structural eligibility, layout, and event routing. It does not run the same physical iOS touch arbitration and cannot establish that the switch pan bug is absent on an iPhone. Record a physical Safari pan check separately before claiming that behavior is verified.

Physical acceptance for this new shared-library build remains to be recorded.
