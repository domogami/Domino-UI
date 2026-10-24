import { useState } from "react";
import { Button, Badge, Callout } from "../lib";
import {
  TouchFeedbackProvider,
  TouchFeedbackSetting,
  InkSwitch,
  useTouchFeedback,
  hapticPatterns,
  type Feedback,
} from "../lib/haptics";
import { Icon } from "../Icons";
import { CodeBlock, PageIntro } from "./Foundations";
import "./haptics-page.css";

const meanings: Record<Feedback, { title: string; use: string }> = {
  tap: {
    title: "A small tap",
    use: "A button, keypad action, or ordinary control.",
  },
  selection: {
    title: "A little change",
    use: "A tab, a forecast sample, a repeated result, or photo selection.",
  },
  draw: {
    title: "The last stroke",
    use: "The actual end of an explicitly replayed drawing.",
  },
  success: {
    title: "A thought, finished",
    use: "A successful calculation, copy, or completed action.",
  },
  error: {
    title: "Something to revisit",
    use: "A failed calculation or action that needs attention.",
  },
};

function HapticPlayground() {
  const {
    enabled,
    reducedMotion,
    haptic,
    armHapticCue,
    capability,
    supportsNativeSwitch,
    coarsePointer,
    mounted,
  } = useTouchFeedback();
  const [count, setCount] = useState(0);
  const [last, setLast] = useState("No action yet.");
  const [native, setNative] = useState(false);
  const [drawing, setDrawing] = useState(0);
  const [finished, setFinished] = useState(0);
  const record = (message: string) => {
    setCount((value) => value + 1);
    setLast(message);
  };
  const status = !mounted
    ? "Checking available APIs…"
    : capability === "vibration-api"
      ? "Vibration API detected"
      : capability === "native-switch"
        ? "Native switch path detected"
        : "No supported feedback path detected";
  return (
    <div className="haptics-playground">
      <div className="haptics-device">
        <span className="haptics-device-mark">
          <Icon name="sparkle" size={24} />
        </span>
        <div>
          <span className="eyebrow">THIS BROWSER · ADVISORY DETECTION</span>
          <h2>{status}</h2>
          <p>
            {reducedMotion
              ? "Your reduced-motion preference keeps feedback quiet."
              : !enabled
                ? "Touch feedback is off. Actions remain available."
                : capability === "vibration-api"
                  ? "Patterns can be requested after touch. The browser cannot confirm that a motor moved."
                  : capability === "native-switch"
                    ? "A compatible device may provide one native tick when your finger toggles the switch target."
                    : "You can explore the controls here. A missing motor or browser feature does not block an action."}
          </p>
        </div>
      </div>
      <div className="haptics-preference">
        <TouchFeedbackSetting />
        <span>
          Shared with the personal notebook, weather journal, and calculator
          when adopted on the same origin.
        </span>
      </div>
      <div className="haptics-demo-grid">
        <section
          className="haptics-actions"
          aria-label="Feedback pattern examples"
        >
          <h3>A few small interactions</h3>
          <p>
            Tap with your finger to try the available path. A mouse or keyboard
            keeps custom motor requests quiet.
          </p>
          <div className="demo-row">
            {(["tap", "selection", "success", "error"] as const).map((kind) => (
              <Button
                key={kind}
                variant={
                  kind === "error"
                    ? "secondary"
                    : kind === "tap"
                      ? "primary"
                      : "secondary"
                }
                data-haptic="manual"
                data-feedback-example={kind}
                onClick={() => {
                  haptic(kind);
                  record(
                    `${kind[0].toUpperCase() + kind.slice(1)} action requested.`,
                  );
                }}
              >
                {kind === "tap"
                  ? "Keep a thought"
                  : kind === "selection"
                    ? "Choose a page"
                    : kind === "success"
                      ? "Finish a note"
                      : "Try an error"}
              </Button>
            ))}
          </div>
          <div className="haptics-action-log" role="status">
            <b>{count}</b>
            <span>
              {last}
              <small>The count records actions, not physical vibrations.</small>
            </span>
          </div>
        </section>
        <section className="haptics-native">
          <h3>A visible native switch</h3>
          <p>
            Safari recognizes the <code>switch</code> attribute on a checkbox.
            Keep a real native control for browser-managed feedback.
          </p>
          <label className="haptics-switch-label">
            <span>Keep a little space</span>
            <InkSwitch
              aria-label="Native switch example"
              checked={native}
              onChange={(event) => {
                setNative(event.target.checked);
                record("Native switch changed.");
              }}
            />
          </label>
          <small>
            {supportsNativeSwitch
              ? "The switch attribute is recognized by this browser."
              : "This browser uses the ordinary checkbox fallback."}
            {supportsNativeSwitch && !coarsePointer
              ? " No coarse pointer is detected."
              : ""}
          </small>
        </section>
      </div>
      <section className="haptics-drawing">
        <div>
          <span className="eyebrow">A CUE THAT FOLLOWS THE INK</span>
          <h3>Let the last stroke finish.</h3>
          <p>
            Replay arms one cue. Its actual <code>animationend</code> event can
            request the 5ms drawing pattern on a supported vibration path.
          </p>
          <Button
            variant="secondary"
            data-haptic="tap"
            onClick={() => {
              armHapticCue("domino-haptic-ink", "draw");
              setDrawing((value) => value + 1);
              record("Drawing explicitly replayed.");
            }}
          >
            <Icon name="replay" size={15} />
            Replay the ink
          </Button>
        </div>
        <div
          className="haptics-ink-preview"
          data-motion={reducedMotion ? "off" : "on"}
        >
          <svg
            viewBox="0 0 220 100"
            aria-label="An ink line with a leaf"
            role="img"
            key={drawing}
          >
            <path
              d="M15 79Q60 88 99 55T205 24M102 54Q100 22 135 18Q136 46 102 54Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              pathLength="1"
              className={drawing && !reducedMotion ? "haptics-ink-draw" : ""}
              data-haptic-cue="domino-haptic-ink"
              data-haptic-animation="dm-haptic-ink"
              onAnimationEnd={() => setFinished((value) => value + 1)}
            />
          </svg>
          <span>Completed drawings: {finished}</span>
        </div>
      </section>
    </div>
  );
}

export function HapticsPage({ copy }: { copy: (text: string) => void }) {
  return (
    <>
      <PageIntro
        eyebrow="INTERACTION / TOUCH FEEDBACK"
        title="A little feedback"
        description="The personal notebook has a sense of touch, too. Keep its five patterns, explicit drawing cues, and Safari’s native tap path together with the rest of the system."
      />
      <div className="entry-badges">
        <Badge tone="sage">From the personal site</Badge>
        <Badge>Progressive enhancement</Badge>
        <Badge>Physical-device check required</Badge>
      </div>
      <TouchFeedbackProvider navigationKey="haptics-guide">
        <HapticPlayground />
      </TouchFeedbackProvider>
      <section className="guide-section">
        <div className="section-heading">
          <h2>Five patterns, with a purpose</h2>
          <span className="hand-small">just enough to feel it.</span>
        </div>
        <p className="guide-copy">
          These are the exact requests in the personal site’s feedback module.
          Numbers are milliseconds; arrays alternate vibration and silence.
          Safari’s native tap path supplies a single browser-chosen tick rather
          than these patterns.
        </p>
        <div className="haptics-patterns">
          {(Object.keys(meanings) as Feedback[]).map((kind) => {
            const values =
              typeof hapticPatterns[kind] === "number"
                ? [hapticPatterns[kind] as number]
                : (hapticPatterns[kind] as readonly number[]);
            return (
              <article key={kind}>
                <div>
                  <code>{kind}</code>
                  <strong>{meanings[kind].title}</strong>
                  <p>{meanings[kind].use}</p>
                </div>
                <div className="haptics-pattern-visual">
                  <div aria-hidden="true">
                    {values.map((duration, index) => (
                      <i
                        key={index}
                        className={index % 2 ? "is-gap" : ""}
                        style={{ width: Math.max(9, duration * 2) }}
                      />
                    ))}
                  </div>
                  <code>
                    {values.length === 1
                      ? `${values[0]}ms`
                      : `[${values.join(", ")}]`}
                  </code>
                </div>
              </article>
            );
          })}
        </div>
        <div className="haptics-timing">
          <div>
            <b>65ms</b>
            <span>minimum spacing between accepted motor requests</span>
          </div>
          <div>
            <b>1200ms</b>
            <span>recent trusted touch or pen window</span>
          </div>
          <div>
            <b>5000ms</b>
            <span>expiry for an explicitly armed finish cue</span>
          </div>
        </div>
      </section>
      <section className="guide-section" id="safari-haptics">
        <h2>Using feedback in Safari</h2>
        <p className="guide-copy">
          On a compatible iPhone, open the page in Safari, leave{" "}
          <b>Touch feedback</b> enabled, and tap the visible switch or an
          enhanced demo button with your finger. Keep reduced motion off for
          this test. Safari 18 added feedback for native switch controls on iOS;
          recognizing the attribute alone cannot prove a haptic-capable device
          is present.
        </p>
        <ol className="haptics-steps">
          <li>
            <b>Start on the actual iPhone.</b> Open the public comparison linked
            below, or a phone-accessible preview. The desktop’s localhost URL
            cannot open this preview on your phone. If no tick is felt, check
            Settings → Accessibility → Touch → Vibration.
          </li>
          <li>
            <b>Keep a real native switch.</b> Use{" "}
            <code>&lt;input type="checkbox" switch /&gt;</code>. Native
            appearance and the default trusted tap must remain intact.
          </li>
          <li>
            <b>For a styled button, preserve the direct tap.</b> The source’s
            enhancement places a transparent rendered switch in a sibling layer
            over the eligible control. Your finger toggles it directly, and the
            resulting change forwards the button action once.
          </li>
          <li>
            <b>Leave gesture-heavy controls alone.</b> Use{" "}
            <code>data-native-tap="none"</code> for swipes, scrubbing, scrolling
            conflicts, or controls requiring their original trusted event. Links
            keep native navigation and previews.
          </li>
          <li>
            <b>Check it on the phone.</b> Safari does not expose the general
            Vibration API. Custom waveforms and delayed drawing-finish pulses
            are unavailable through the native switch path.
          </li>
        </ol>
        <Callout title="A browser-dependent enhancement" tone="info">
          Current WebKit reports include native switches interfering with pan
          gestures on some iOS versions. Test scrolling, release location,
          menus, and focus on the real device. Disable native tap targets for
          affected controls or for the provider; the visible native switch can
          remain available.
        </Callout>
        <div className="haptics-source-links">
          <a
            href="https://support.apple.com/guide/iphone/turn-off-vibration-iphd722c9100/ios"
            target="_blank"
            rel="noreferrer"
          >
            Apple: device vibration setting
            <Icon name="external" size={14} />
          </a>
          <a
            href="https://webkit.org/blog/15865/webkit-features-in-safari-18-0/#html"
            target="_blank"
            rel="noreferrer"
          >
            WebKit: native switch feedback
            <Icon name="external" size={14} />
          </a>
          <a
            href="https://github.com/WebKit/WebKit/commit/fc1ef83"
            target="_blank"
            rel="noreferrer"
          >
            WebKit: scripted click restriction
            <Icon name="external" size={14} />
          </a>
          <a
            href="https://bugs.webkit.org/show_bug.cgi?id=321591"
            target="_blank"
            rel="noreferrer"
          >
            WebKit: switch gesture report
            <Icon name="external" size={14} />
          </a>
        </div>
      </section>
      <section className="guide-section">
        <h2>Bring the source behavior into React</h2>
        <p className="guide-copy">
          The provider is opt-in and scoped to its children. Importing the
          library does not instrument the host page. It preserves the source
          preference key, <code>notebook-touch-feedback</code>, and respects
          reduced motion.
        </p>
        <CodeBlock
          copy={copy}
          code={
            'import { TouchFeedbackProvider, TouchFeedbackSetting, Button } from "@domlee/ui";\nimport "@domlee/ui/styles.css";\n\nexport function NotebookActions({ pathname }: { pathname: string }) {\n  return (\n    <TouchFeedbackProvider navigationKey={pathname}>\n      <TouchFeedbackSetting />\n      <Button data-haptic="selection">Choose a page</Button>\n      <Button data-native-tap="none">Keep the original gesture</Button>\n    </TouchFeedbackProvider>\n  );\n}'
          }
        />
        <CodeBlock
          copy={copy}
          code={
            'import { useTouchFeedback } from "@domlee/ui";\n\nfunction SaveAction() {\n  const { haptic } = useTouchFeedback();\n  return (\n    <button data-haptic="manual" onClick={() => {\n      // Perform the actual local action, then request its outcome.\n      haptic("success");\n    }}>Keep this thought</button>\n  );\n}'
          }
        />
        <p className="guide-copy">
          <code>data-haptic="none"</code> opts out of both automatic click
          feedback and Safari button targets. <code>data-haptic="manual"</code>{" "}
          leaves vibration timing to the handler while allowing a native Safari
          tick. <code>nativeTapTargets={"{false}"}</code> on the provider
          disables the transparent target enhancement.
        </p>
      </section>
      <section className="guide-section">
        <h2>Finish cues follow the real animation</h2>
        <CodeBlock
          copy={copy}
          code={
            '// In a trusted touch handler, before starting an explicit replay:\narmHapticCue("my-drawing", "draw");\n\n// On the element that actually finishes the CSS animation:\n<path\n  data-haptic-cue="my-drawing"\n  data-haptic-animation="my-final-stroke"\n  className="my-drawing"\n/>\n\n// @keyframes my-final-stroke must be the real animationName.\n// No timer or synthetic click is used to manufacture Safari feedback.'
          }
        />
        <p className="guide-copy">
          New pointer interaction, navigation, blur, page hide, disabled
          feedback, or reduced motion clears a pending cue. Hover, ambient
          animation, and automatic page drawings stay quiet. A finish cue is
          consumed once and ignores expired, hidden, or paused artwork.
        </p>
      </section>
      <section className="guide-section">
        <h2>Keep touch in the shared system</h2>
        <div className="two-columns">
          <div>
            <h3>Personal site</h3>
            <p className="guide-copy">
              Preserve weather sample ticks, keypad feedback, calculation
              outcomes, photo selection, and explicitly replayed sky, plant, and
              crane finish cues. Their event markers belong with the component
              that owns the interaction.
            </p>
          </div>
          <div>
            <h3>Quartz & Obsidian</h3>
            <p className="guide-copy">
              CSS adapters share visual and motion rules. They cannot provide
              motor feedback by themselves. Any later JavaScript or native-app
              integration must respect its own platform, device, preferences,
              and gesture behavior.
            </p>
          </div>
        </div>
        <p className="guide-copy">
          The source notes record an earlier physical iPhone Safari confirmation
          of the direct-tap technique. This library’s browser tests validate
          requests, targeting, event forwarding, and cleanup; they cannot feel a
          vibration or certify every Safari version.
        </p>
        <a
          className="text-link"
          href="https://dominicklee.net/studies/haptics"
          target="_blank"
          rel="noreferrer"
        >
          Open the original physical-phone comparison
          <Icon name="external" size={15} />
        </a>
      </section>
    </>
  );
}
