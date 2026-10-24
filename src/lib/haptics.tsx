import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { nativeTapTargets } from "./nativeTapTargets";
import "./haptics.css";

/** The personal notebook's small, deliberate touch vocabulary. Milliseconds. */
export type Feedback = "tap" | "selection" | "draw" | "success" | "error";
export const hapticPatterns: Readonly<Record<Feedback, number | readonly number[]>> =
  Object.freeze({
    tap: 6,
    selection: 4,
    draw: 5,
    success: Object.freeze([9, 45, 12]),
    error: Object.freeze([14, 45, 14]),
  });

const storageKey = "notebook-touch-feedback";
const subscribers = new Set<() => void>();
type Session = {
  root: HTMLElement;
  touchAt: number;
  cues: Map<string, { feedback: Feedback; expires: number }>;
};
const sessions = new Set<Session>();
let enabled = true;
let reduced = false;
let supportsVibration = false;
let supportsNativeSwitch = false;
let coarsePointer = false;
let pulseAt = -Infinity;
let preferenceUsers = 0;
let detachPreferences: (() => void) | undefined;

// A real native switch can receive Safari's browser-managed feedback on a
// trusted tap. A scripted hidden switch or label .click() cannot reproduce it.
export const nativeSwitchProps = { switch: "" } as const;

function notify() {
  subscribers.forEach((subscriber) => subscriber());
}
function subscribe(subscriber: () => void) {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}
function snapshot() {
  return (
    Number(enabled) |
    (Number(reduced) << 1) |
    (Number(supportsVibration) << 2) |
    (Number(supportsNativeSwitch) << 3) |
    (Number(coarsePointer) << 4) |
    (Number(sessions.size > 0) << 5)
  );
}

function cancelFeedback() {
  for (const session of sessions) session.cues.clear();
  if (sessions.size && typeof navigator.vibrate === "function") {
    try {
      navigator.vibrate(0);
    } catch {
      // Browser policy may deny vibration; the interaction remains usable.
    }
  }
}

function connectPreferences() {
  preferenceUsers++;
  if (preferenceUsers === 1) {
    try {
      enabled = localStorage.getItem(storageKey) !== "off";
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(any-pointer: coarse)");
    reduced = motion.matches;
    coarsePointer = coarse.matches;
    supportsVibration = typeof navigator.vibrate === "function";
    supportsNativeSwitch = "switch" in document.createElement("input");
    const motionChanged = () => {
      reduced = motion.matches;
      if (reduced) {
        for (const session of sessions) session.touchAt = -Infinity;
        cancelFeedback();
      }
      notify();
    };
    const coarseChanged = () => {
      coarsePointer = coarse.matches;
      notify();
    };
    const preferenceChanged = (event: StorageEvent) => {
      if (event.key !== storageKey && event.key !== null) return;
      enabled = event.newValue !== "off";
      if (!enabled) cancelFeedback();
      notify();
    };
    motion.addEventListener("change", motionChanged);
    coarse.addEventListener("change", coarseChanged);
    window.addEventListener("storage", preferenceChanged);
    detachPreferences = () => {
      motion.removeEventListener("change", motionChanged);
      coarse.removeEventListener("change", coarseChanged);
      window.removeEventListener("storage", preferenceChanged);
    };
    notify();
  }
  return () => {
    preferenceUsers--;
    if (!preferenceUsers) {
      detachPreferences?.();
      detachPreferences = undefined;
    }
  };
}

function available(session: Session) {
  return (
    sessions.has(session) &&
    session.root.isConnected &&
    enabled &&
    !reduced &&
    document.visibilityState === "visible" &&
    typeof navigator.vibrate === "function"
  );
}
function pulse(session: Session, feedback: Feedback) {
  const now = performance.now();
  if (!available(session) || now - pulseAt < 65) return;
  try {
    const pattern = hapticPatterns[feedback];
    if (navigator.vibrate(typeof pattern === "number" ? pattern : [...pattern]))
      pulseAt = now;
  } catch {
    // API detection is advisory: a device or its policy may still decline.
  }
}
function recentSession() {
  let recent: Session | undefined;
  for (const session of sessions) {
    if (!recent || session.touchAt > recent.touchAt) recent = session;
  }
  return recent && performance.now() - recent.touchAt < 1200
    ? recent
    : undefined;
}

/** Requires a real touch/pen within 1,200ms in an opted-in provider scope. */
export function haptic(feedback: Feedback = "tap") {
  if (!sessions.size) return;
  const session = recentSession();
  if (session) pulse(session, feedback);
}

/** Arm only after explicit replay; the matching animationend performs the cue. */
export function armHapticCue(id: string, feedback: Feedback = "draw") {
  if (!sessions.size) return;
  const session = recentSession();
  if (!session || !available(session)) return;
  session.cues.set(id, { feedback, expires: performance.now() + 5000 });
}

function setEnabled(value: boolean) {
  enabled = value;
  try {
    localStorage.setItem(storageKey, value ? "on" : "off");
  } catch {
    // The setting still works without persistent storage.
  }
  if (!value) cancelFeedback();
  notify();
}

export type HapticCapability = "vibration-api" | "native-switch" | "unavailable";
/** Capability describes browser features, never proof of a physical motor pulse. */
export function useTouchFeedback() {
  const state = useSyncExternalStore(subscribe, snapshot, () => 1);
  useEffect(connectPreferences, []);
  const vibration = !!(state & 4);
  const native = !!(state & 8);
  const coarse = !!(state & 16);
  const capability: HapticCapability = vibration
    ? "vibration-api"
    : native && coarse
      ? "native-switch"
      : "unavailable";
  return {
    enabled: !!(state & 1),
    reducedMotion: !!(state & 2),
    mounted: !!(state & 32),
    supportsVibration: vibration,
    supportsNativeSwitch: native,
    coarsePointer: coarse,
    capability,
    setEnabled,
    haptic,
    armHapticCue,
  };
}

export interface TouchFeedbackSettingProps extends HTMLAttributes<HTMLLabelElement> {
  compact?: boolean;
}
export function TouchFeedbackSetting({
  compact = false,
  className = "",
  ...props
}: TouchFeedbackSettingProps) {
  const { enabled: checked, setEnabled } = useTouchFeedback();
  return (
    <label
      {...props}
      className={`dm-touch-feedback-setting ${compact ? "is-compact" : ""} ${className}`.trim()}
    >
      <span>
        Touch feedback
        {!compact && <small>Small taps, when your device supports them.</small>}
      </span>
      <InkSwitch
        aria-label="Touch feedback"
        checked={checked}
        onChange={(event) => setEnabled(event.target.checked)}
      />
    </label>
  );
}

export type InkSwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;
export function InkSwitch({ className = "", ...props }: InkSwitchProps) {
  const { enabled, reducedMotion, supportsNativeSwitch } = useTouchFeedback();
  const native = enabled && !reducedMotion;
  return (
    <input
      {...props}
      {...(native ? nativeSwitchProps : { switch: undefined })}
      className={`dm-ink-switch ${native && supportsNativeSwitch ? "dm-ink-switch--native" : ""} ${className}`.trim()}
      type="checkbox"
    />
  );
}

export interface TouchFeedbackProviderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Disable Safari button targets while keeping native InkSwitch controls. */
  nativeTapTargets?: boolean;
  /** Change this on SPA navigation to cancel feedback from the previous screen. */
  navigationKey?: string | number;
  /** Alias for hosts that call their location value routeKey. */
  routeKey?: string | number;
}

/** Opt-in scope. Importing the library never instruments the host document. */
export function TouchFeedbackProvider({
  children,
  className = "",
  nativeTapTargets: enhanceNativeTapTargets = true,
  navigationKey,
  routeKey,
  ...props
}: TouchFeedbackProviderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<Session | null>(null);
  useTouchFeedback();
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const session: Session = { root, touchAt: -Infinity, cues: new Map() };
    sessionRef.current = session;
    sessions.add(session);
    notify();
    const nativeTargets = enhanceNativeTapTargets
      ? nativeTapTargets(root, () => enabled && !reduced)
      : { refresh() {}, destroy() {} };
    const unsubscribeTargets = subscribe(nativeTargets.refresh);
    const owns = (target: EventTarget | null): target is Element =>
      target instanceof Element &&
      target.closest("[data-domino-haptics]") === root;
    const quiet = () => {
      session.touchAt = -Infinity;
      session.cues.clear();
      if (typeof navigator.vibrate === "function") {
        try {
          navigator.vibrate(0);
        } catch {
          // Cancellation can be denied by the same device policy as playback.
        }
      }
    };
    const pointer = (event: PointerEvent) => {
      if (!owns(event.target)) return;
      session.cues.clear();
      session.touchAt =
        event.isTrusted &&
        (event.pointerType === "touch" || event.pointerType === "pen")
          ? performance.now()
          : -Infinity;
    };
    // A new interaction anywhere cancels an earlier replay cue. This listener
    // only clears this scope; it never adds feedback to unrelated host controls.
    const outsidePointer = (event: PointerEvent) => {
      if (owns(event.target)) return;
      session.touchAt = -Infinity;
      session.cues.clear();
    };
    const click = (event: MouseEvent) => {
      if (!event.isTrusted || !owns(event.target)) return;
      const control = event.target.closest(
        'button, a[href], summary, input[type="checkbox"], input[type="radio"], [role="button"]',
      );
      if (!control || control.matches(':disabled, [aria-disabled="true"]')) return;
      const kind = control.getAttribute("data-haptic");
      if (kind === "none" || kind === "manual") return;
      if (performance.now() - session.touchAt < 1200)
        pulse(session, kind && Object.hasOwn(hapticPatterns, kind) ? (kind as Feedback) : "tap");
    };
    const drag = (event: PointerEvent) => {
      if (
        owns(event.target) &&
        event.isTrusted &&
        event.buttons &&
        (event.pointerType === "touch" || event.pointerType === "pen")
      )
        session.touchAt = performance.now();
    };
    const finish = (event: AnimationEvent) => {
      if (!owns(event.target)) return;
      const id = event.target.getAttribute("data-haptic-cue");
      const cue = id ? session.cues.get(id) : undefined;
      if (!cue) return;
      const animation = event.target.getAttribute("data-haptic-animation");
      if (animation && animation !== event.animationName) return;
      session.cues.delete(id!);
      if (
        cue.expires < performance.now() ||
        event.target.closest('[hidden], [inert], [data-motion="off"], .motion-paused') ||
        !event.target.getClientRects().length
      )
        return;
      pulse(session, cue.feedback);
    };
    const animationCancelled = (event: AnimationEvent) => {
      if (!owns(event.target)) return;
      const id = event.target.getAttribute("data-haptic-cue");
      if (id) session.cues.delete(id);
    };
    const visibility = () => {
      if (document.visibilityState !== "visible") quiet();
    };
    root.addEventListener("pointerdown", pointer, { capture: true, passive: true });
    root.addEventListener("click", click, true);
    root.addEventListener("pointermove", drag, { capture: true, passive: true });
    root.addEventListener("animationend", finish);
    root.addEventListener("animationcancel", animationCancelled);
    document.addEventListener("pointerdown", outsidePointer, { capture: true, passive: true });
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", quiet);
    window.addEventListener("pagehide", quiet);
    window.addEventListener("hashchange", quiet);
    window.addEventListener("popstate", quiet);
    return () => {
      unsubscribeTargets();
      nativeTargets.destroy();
      quiet();
      sessions.delete(session);
      sessionRef.current = null;
      notify();
      root.removeEventListener("pointerdown", pointer, true);
      root.removeEventListener("click", click, true);
      root.removeEventListener("pointermove", drag, true);
      root.removeEventListener("animationend", finish);
      root.removeEventListener("animationcancel", animationCancelled);
      document.removeEventListener("pointerdown", outsidePointer, true);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", quiet);
      window.removeEventListener("pagehide", quiet);
      window.removeEventListener("hashchange", quiet);
      window.removeEventListener("popstate", quiet);
    };
  }, [enhanceNativeTapTargets]);
  useEffect(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.touchAt = -Infinity;
    session.cues.clear();
    if (typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(0);
      } catch {
        // A route transition remains usable when cancellation is denied.
      }
    }
  }, [navigationKey, routeKey]);
  return (
    <div
      {...props}
      ref={rootRef}
      data-domino-haptics=""
      className={`dm-touch-feedback ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export const TouchFeedback = TouchFeedbackProvider;
