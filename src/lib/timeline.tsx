import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type OlHTMLAttributes,
  type ReactNode,
} from "react";
import "./timeline.css";

export interface TimelineItem {
  id: string;
  title: ReactNode;
  description: ReactNode;
  meta?: ReactNode;
}

export interface TimelineProps extends Omit<
  OlHTMLAttributes<HTMLOListElement>,
  "children"
> {
  items: readonly TimelineItem[];
  label?: string;
  /** Draw once on the first viewport entry; false keeps the finished ink. */
  animate?: boolean;
  /** Finish immediately without replaying when quiet mode is later disabled. */
  quiet?: boolean;
  /** Change this value to request another drawing when the list is visible. */
  replayKey?: string | number;
}

type Phase = "pending" | "running" | "finished";
const reducedQuery = "(prefers-reduced-motion: reduce)";
const motionNames = new Set([
  "dm-timeline-connector",
  "dm-timeline-node",
  "dm-timeline-ink",
  "dm-timeline-content",
]);
function readReducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia(reducedQuery).matches
  );
}
function subscribeReducedMotion(update: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(reducedQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
// The initial phase is finished regardless of preference. This snapshot matches
// hydration without introducing a synthetic preference change for normal motion.
const serverReducedMotion = () => false;

/** Ordered milestones with decorative pen motion; all content remains usable. */
export function Timeline({
  items,
  label = "Timeline",
  animate = true,
  quiet = false,
  replayKey = 0,
  className,
  style,
  ...attributes
}: TimelineProps) {
  const list = useRef<HTMLOListElement>(null);
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    readReducedMotion,
    serverReducedMotion,
  );
  const [phase, setPhase] = useState<Phase>("finished");
  const [replay, setReplay] = useState(0);
  const hasRun = useRef(false);
  const generation = useRef(0);
  // ReactNode values may contain circular React elements. Only stable item IDs
  // determine structural changes; inline arrays and content edits do not replay.
  const identity = JSON.stringify(items.map((item) => item.id));
  const previous = useRef({ identity, replayKey });

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const request = ++generation.current;
    const requestedReplay = !Object.is(previous.current.replayKey, replayKey);
    previous.current = { identity, replayKey };
    let active = true;
    let observer: IntersectionObserver | undefined;
    const clean = () => {
      active = false;
      observer?.disconnect();
    };
    if (!animate || quiet || readReducedMotion()) {
      hasRun.current = true;
      setPhase("finished");
      return clean;
    }
    if (!items.length || (hasRun.current && !requestedReplay)) {
      setPhase("finished");
      return clean;
    }
    if (typeof IntersectionObserver === "undefined") {
      hasRun.current = true;
      setPhase("finished");
      return clean;
    }
    // Pending is a fully readable, finished static view. Only decorative ink
    // resets when an actual entry starts the drawing.
    // A replay during a drawing keeps its current ink until the next accepted
    // entry. Reset the animation clock there instead of flashing finished ink.
    if (phase !== "running") setPhase("pending");
    observer = new IntersectionObserver(
      (entries) => {
        if (
          !active ||
          request !== generation.current ||
          !entries.some(
            (entry) => entry.target === element && entry.isIntersecting,
          )
        )
          return;
        observer?.disconnect();
        hasRun.current = true;
        setReplay((value) => value + 1);
        setPhase("running");
      },
      { threshold: 0 },
    );
    observer.observe(element);
    return clean;
  }, [animate, quiet, reduced, replayKey, identity, items.length]);

  useEffect(() => {
    const element = list.current;
    if (phase !== "running" || !element) return;
    const request = generation.current;
    // Wait only for this list's finite drawing phases. Nested timelines and a
    // consumer's perpetual icon animation must never keep this list running.
    const animations =
      typeof element.getAnimations === "function" &&
      typeof CSSAnimation !== "undefined"
        ? element
            .getAnimations({ subtree: true })
            .filter(
              (animation) =>
                animation instanceof CSSAnimation &&
                motionNames.has(animation.animationName) &&
                animation.effect instanceof KeyframeEffect &&
                animation.effect.target instanceof Element &&
                animation.effect.target.closest(".dm-timeline") === element &&
                Number.isFinite(animation.effect.getComputedTiming().endTime),
            )
        : [];
    let cancelled = false;
    // Reset only the owned drawing clocks. The ol/li/content/link DOM stays
    // mounted, and rapid replay never paints an intermediate completed line.
    animations.forEach((animation) => {
      animation.currentTime = 0;
      animation.play();
    });
    void Promise.all(
      animations.map((animation) => animation.finished.catch(() => undefined)),
    ).then(() => {
      if (!cancelled && request === generation.current) setPhase("finished");
    });
    return () => {
      cancelled = true;
    };
  }, [phase, replay]);

  return (
    <ol
      {...attributes}
      ref={list}
      className={["dm-timeline", className].filter(Boolean).join(" ")}
      style={style}
      aria-label={attributes["aria-label"] ?? label}
      data-state={phase}
      data-replay={replay}
      data-animate={animate ? "true" : "false"}
      data-quiet={quiet || reduced ? "true" : "false"}
    >
      {items.map((item, index) => (
        <li
          className="dm-timeline__item"
          key={item.id}
          data-timeline-id={item.id}
          style={{ "--dm-timeline-index": index } as CSSProperties}
        >
          {index < items.length - 1 && (
            <svg
              className="dm-timeline__connector"
              viewBox="0 0 12 100"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path
                className="dm-timeline__line"
                d="M6 0 C4 18 8 34 5 53 S7 82 6 100"
                pathLength="1"
              />
            </svg>
          )}
          <span className="dm-timeline__node" aria-hidden="true">
            <svg viewBox="0 0 16 16" focusable="false">
              <path
                className="dm-timeline__node-ink"
                d="M8 2 C12 1 14 4 14 8 C15 12 11 14 7 14 C3 15 1 11 2 7 C1 3 4 1 8 2Z"
                pathLength="1"
              />
            </svg>
          </span>
          <div className="dm-timeline__content">
            {item.meta != null && (
              <div className="dm-timeline__meta">{item.meta}</div>
            )}
            <h3 className="dm-timeline__title">{item.title}</h3>
            <div className="dm-timeline__description">{item.description}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
