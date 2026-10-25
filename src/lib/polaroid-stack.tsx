import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import "./polaroid-stack.css";

export interface PolaroidPhoto {
  /** Unique, stable identity. The image URL is the fallback when it is omitted. */
  id?: string;
  src: string;
  alt: string;
  caption?: string;
  objectPosition?: CSSProperties["objectPosition"];
}

export interface PolaroidStackProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> {
  photos: readonly PolaroidPhoto[];
  label?: string;
  /** Width divided by height of the image window; captions grow independently. */
  aspectRatio?: number;
  quiet?: boolean;
  /** Runs once per accepted user action, immediately, before its visual finish. */
  onIndexChange?: (index: number, photo: PolaroidPhoto) => void;
}

type Item = { key: string; photo: PolaroidPhoto };
type Pose = { x: number; y: number; rotation: number };
type Cycle = { key: string; direction: -1 | 1; from: Pose };
type Gesture = {
  id: number;
  x: number;
  y: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  mode: "pending" | "horizontal" | "vertical";
};
const resting: Pose = { x: 0, y: 0, rotation: -3 };
const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(update: () => void) {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
const readMotion = () => window.matchMedia(reducedQuery).matches;
const serverMotion = () => true;
const modulo = (index: number, count: number) =>
  ((index % count) + count) % count;
const classNames = (...values: (string | false | undefined)[]) =>
  values.filter(Boolean).join(" ");

/** The two pen arrows from the personal notebook, without a mirrored substitute. */
function StackArrow({ previous = false }: { previous?: boolean }) {
  return (
    <svg
      className="dm-polaroid-stack__arrow"
      viewBox="0 0 40 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={
          previous
            ? "M34 17 C25 14 15 18 6 16 M16 6 Q11 12 6 16 Q11 20 16 25"
            : "M6 16 C15 18 25 14 34 16 M24 6 Q29 12 34 16 Q29 20 24 25"
        }
      />
    </svg>
  );
}

/** A small window onto any number of real photographs, with one stable swipe button. */
export function PolaroidStack({
  photos,
  label = "Photo stack",
  aspectRatio = 16 / 9,
  quiet = false,
  onIndexChange,
  className,
  style,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  ...attributes
}: PolaroidStackProps) {
  const signature = JSON.stringify(photos);
  const items = useMemo<Item[]>(() => {
    const occurrences = new Map<string, number>();
    return photos.map((photo) => {
      const identity =
        photo.id === undefined ? `src:${photo.src}` : `id:${photo.id}`;
      const occurrence = occurrences.get(identity) ?? 0;
      occurrences.set(identity, occurrence + 1);
      return { key: `${identity}:${occurrence}`, photo };
    });
  }, [photos, signature]);
  const [selected, setSelected] = useState<string | null>(
    items[0]?.key ?? null,
  );
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [drag, setDrag] = useState<Pose>(resting);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeMotion,
    readMotion,
    serverMotion,
  );
  const still = quiet || reduced;
  const surface = useRef<HTMLButtonElement>(null);
  const selectedIndex = useRef(0);
  const currentKey = useRef<string | null>(selected);
  const currentItems = useRef(items);
  const currentCycle = useRef<Cycle | null>(null);
  const stillRef = useRef(still);
  const gesture = useRef<Gesture | null>(null);
  const touches = useRef(new Set<number>());
  const suppressClick = useRef(false);
  const captionId = useId();
  const found = items.findIndex((item) => item.key === selected);
  const index = items.length
    ? found >= 0
      ? found
      : Math.min(selectedIndex.current, items.length - 1)
    : 0;
  const current = items[index];
  selectedIndex.current = index;
  currentKey.current = current?.key ?? null;
  currentItems.current = items;
  stillRef.current = still;

  const finishCycle = useCallback(() => {
    currentCycle.current = null;
    setCycle(null);
  }, []);
  const finishSettle = useCallback(() => setSettling(false), []);
  const release = useCallback((pointerId: number) => {
    const button = surface.current;
    if (button?.hasPointerCapture(pointerId)) {
      try {
        button.releasePointerCapture(pointerId);
      } catch {
        // A browser may already have released the pointer for a native gesture.
      }
    }
  }, []);
  const cancelGesture = useCallback(
    (suppress = true) => {
      const active = gesture.current;
      if (!active) return;
      gesture.current = null;
      if (suppress) suppressClick.current = true;
      setDragging(false);
      setDrag(resting);
      finishSettle();
      if (active.mode === "horizontal" && !stillRef.current) {
        setSettling(true);
      }
      release(active.id);
    },
    [finishSettle, release],
  );

  useEffect(() => {
    if (!cycle) return;
    const card = surface.current?.querySelector<HTMLElement>(
      ".dm-polaroid-stack__photo--outgoing",
    );
    const owned =
      card
        ?.getAnimations()
        .filter(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.animationName === "dm-polaroid-cycle" &&
            Number.isFinite(
              Number(animation.effect?.getComputedTiming().endTime),
            ),
        ) ?? [];
    if (!owned.length) {
      finishCycle();
      return;
    }
    let live = true;
    // Animationend is the ordinary handoff; finished also settles cancellation
    // and a host overriding motion, without guessing a token's duration in JS.
    Promise.allSettled(owned.map((animation) => animation.finished)).then(
      () => {
        if (live && currentCycle.current === cycle) finishCycle();
      },
    );
    return () => {
      live = false;
    };
  }, [cycle, finishCycle]);
  useEffect(() => {
    if (!settling) return;
    const card = surface.current?.querySelector<HTMLElement>(
      '[data-current="true"]',
    );
    const owned =
      card
        ?.getAnimations()
        .filter(
          (animation) =>
            animation instanceof CSSTransition &&
            animation.transitionProperty === "transform" &&
            Number.isFinite(
              Number(animation.effect?.getComputedTiming().endTime),
            ),
        ) ?? [];
    if (!owned.length) {
      finishSettle();
      return;
    }
    let live = true;
    Promise.allSettled(owned.map((animation) => animation.finished)).then(
      () => {
        if (live) finishSettle();
      },
    );
    return () => {
      live = false;
    };
  }, [settling, finishSettle]);
  useEffect(() => {
    // Reconcile by identity, including when an insertion changes its ordinal.
    // A changed data set cancels only the visual excursion, not another action.
    cancelGesture();
    finishCycle();
    finishSettle();
    setDrag(resting);
    setSelected(currentKey.current);
  }, [signature, cancelGesture, finishCycle, finishSettle]);
  useEffect(() => {
    if (!still) return;
    cancelGesture();
    finishCycle();
    finishSettle();
    setDrag(resting);
  }, [still, cancelGesture, finishCycle, finishSettle]);
  useEffect(() => {
    const pointerDown = (event: globalThis.PointerEvent) => {
      if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
      touches.current.add(event.pointerId);
      if (touches.current.size > 1) cancelGesture();
    };
    const pointerDone = (event: globalThis.PointerEvent) => {
      touches.current.delete(event.pointerId);
      // An unclaimed pointer can end outside the component without capture.
      if (gesture.current?.id === event.pointerId) cancelGesture();
    };
    const hidden = () => {
      if (document.visibilityState !== "visible") cancelGesture();
    };
    window.addEventListener("pointerdown", pointerDown, true);
    window.addEventListener("pointerup", pointerDone);
    window.addEventListener("pointercancel", pointerDone);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("pointerdown", pointerDown, true);
      window.removeEventListener("pointerup", pointerDone);
      window.removeEventListener("pointercancel", pointerDone);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [cancelGesture]);

  const change = (direction: -1 | 1) => {
    const available = currentItems.current;
    if (available.length < 2 || currentCycle.current) return;
    const previous = available.find((item) => item.key === currentKey.current);
    const nextIndex = modulo(
      selectedIndex.current + direction,
      available.length,
    );
    const next = available[nextIndex];
    let from = resting;
    const card = surface.current?.querySelector<HTMLElement>(
      '[data-current="true"]',
    );
    if (card && !stillRef.current) {
      const transform = getComputedStyle(card).transform;
      if (transform !== "none") {
        const matrix = new DOMMatrixReadOnly(transform);
        from = {
          x: matrix.m41,
          y: matrix.m42,
          rotation: (Math.atan2(matrix.m12, matrix.m11) * 180) / Math.PI,
        };
      }
    }
    finishSettle();
    gesture.current = null;
    setDragging(false);
    setDrag(resting);
    selectedIndex.current = nextIndex;
    currentKey.current = next.key;
    setSelected(next.key);
    if (previous && !stillRef.current) {
      const excursion = { key: previous.key, direction, from };
      currentCycle.current = excursion;
      setCycle(excursion);
    }
    onIndexChange?.(nextIndex, next.photo);
  };
  const startsOnSurface = (event: PointerEvent<HTMLDivElement>) =>
    event.target instanceof Node && !!surface.current?.contains(event.target);
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (!startsOnSurface(event)) return;
    if (event.isPrimary || event.pointerType === "mouse")
      suppressClick.current = false;
    if (
      event.pointerType === "mouse" ||
      !event.isPrimary ||
      event.button !== 0 ||
      touches.current.size > 1 ||
      currentItems.current.length < 2 ||
      currentCycle.current
    )
      return;
    finishSettle();
    gesture.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastTime: event.timeStamp,
      velocity: 0,
      mode: "pending",
    };
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    const elapsed = event.timeStamp - active.lastTime;
    if (elapsed > 0) active.velocity = (event.clientX - active.lastX) / elapsed;
    active.lastX = event.clientX;
    active.lastTime = event.timeStamp;
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 10) suppressClick.current = true;
    if (
      active.mode === "pending" &&
      Math.max(Math.abs(dx), Math.abs(dy)) >= 8
    ) {
      if (Math.abs(dx) > Math.abs(dy) * 1.5) {
        active.mode = "horizontal";
        try {
          surface.current?.setPointerCapture(event.pointerId);
        } catch {
          // Synthetic pointers and a browser-claimed gesture may have no capture.
        }
        setDragging(true);
      } else if (Math.abs(dy) >= Math.abs(dx)) active.mode = "vertical";
    }
    if (active.mode !== "horizontal") return;
    event.preventDefault();
    if (!stillRef.current) {
      const width = surface.current?.clientWidth || 300;
      const x = Math.tanh(dx / (width * 0.9)) * width * 0.9;
      setDrag({
        x,
        y: Math.max(-8, Math.min(8, dy * 0.12)),
        rotation: -3 + (x / width) * 10,
      });
    }
  };
  const end = (event: PointerEvent<HTMLDivElement>) => {
    const active = gesture.current;
    if (!active || active.id !== event.pointerId) return;
    const dx = event.clientX - active.x;
    const dy = event.clientY - active.y;
    const velocity =
      event.timeStamp - active.lastTime <= 80 ? active.velocity : 0;
    const horizontal =
      active.mode !== "vertical" && Math.abs(dx) > Math.abs(dy) * 1.5;
    const commit =
      horizontal &&
      (Math.abs(dx) >= 40 ||
        (Math.abs(dx) >= 14 &&
          Math.abs(velocity) >= 0.5 &&
          Math.sign(velocity) === Math.sign(dx)));
    if (Math.max(Math.abs(dx), Math.abs(dy)) > 10) suppressClick.current = true;
    if (commit) {
      gesture.current = null;
      release(active.id);
      change(dx < 0 ? 1 : -1);
    } else cancelGesture(suppressClick.current);
  };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      items.length < 2
    )
      return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      change(event.key === "ArrowLeft" ? -1 : 1);
    }
  };
  const state = cycle
    ? "cycling"
    : dragging
      ? "dragging"
      : settling
        ? "settling"
        : "idle";
  const ratio =
    Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 16 / 9;
  const visible = current
    ? [0, 1, 2]
        .slice(0, items.length)
        .map((offset) => items[modulo(index + offset, items.length)])
    : [];
  if (cycle && !visible.some((item) => item.key === cycle.key)) {
    const outgoing = items.find((item) => item.key === cycle.key);
    if (outgoing) visible.push(outgoing);
  }

  return (
    <div
      {...attributes}
      className={classNames(
        "dm-polaroid-stack",
        !current && "dm-polaroid-stack--empty",
        className,
      )}
      style={{ "--dm-polaroid-ratio": ratio, ...style } as CSSProperties}
      role="group"
      aria-roledescription="photo stack"
      aria-label={label}
      data-index={index}
      data-state={state}
      data-quiet={still || undefined}
      onKeyDown={keyboard}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (!event.defaultPrevented) start(event);
      }}
      onPointerMove={(event) => {
        onPointerMove?.(event);
        if (!event.defaultPrevented) move(event);
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        if (!event.defaultPrevented) end(event);
      }}
      onPointerCancel={(event) => {
        onPointerCancel?.(event);
        if (!event.defaultPrevented) cancelGesture();
      }}
      onLostPointerCapture={(event) => {
        onLostPointerCapture?.(event);
        if (!event.defaultPrevented && gesture.current?.id === event.pointerId)
          cancelGesture();
      }}
    >
      {!current ? (
        <p>No photos to display.</p>
      ) : (
        <>
          <div className="dm-polaroid-stack__stage">
            <button
              ref={surface}
              type="button"
              className="dm-polaroid-stack__surface"
              data-native-tap="none"
              data-haptic="manual"
              aria-label={`Next photo. Showing photo ${index + 1} of ${items.length}: ${current.photo.alt}`}
              aria-describedby={current.photo.caption ? captionId : undefined}
              aria-disabled={items.length < 2 || undefined}
              tabIndex={items.length > 1 ? 0 : -1}
              onClick={(event) => {
                const suppressed = suppressClick.current && event.detail !== 0;
                suppressClick.current = false;
                if (suppressed) {
                  event.preventDefault();
                  return;
                }
                change(1);
              }}
            >
              {visible.map((item) => {
                const depth = modulo(items.indexOf(item) - index, items.length);
                const front = item.key === current.key;
                const outgoing = cycle?.key === item.key;
                const pose = front
                  ? drag
                  : depth === 1
                    ? { x: 10, y: -10, rotation: 4 }
                    : { x: -6, y: -3, rotation: -7 };
                return (
                  <span
                    key={item.key}
                    className={classNames(
                      "dm-polaroid-stack__photo",
                      outgoing && "dm-polaroid-stack__photo--outgoing",
                    )}
                    data-current={front ? "true" : "false"}
                    data-photo-id={item.photo.id ?? item.photo.src}
                    aria-hidden={!front || undefined}
                    style={
                      {
                        "--dm-polaroid-x": `${pose.x}px`,
                        "--dm-polaroid-y": `${pose.y}px`,
                        "--dm-polaroid-rotation": `${pose.rotation}deg`,
                        "--dm-polaroid-z": front ? 4 : depth === 1 ? 3 : 2,
                        ...(outgoing
                          ? {
                              "--dm-polaroid-from-x": `${cycle.from.x}px`,
                              "--dm-polaroid-from-y": `${cycle.from.y}px`,
                              "--dm-polaroid-from-rotation": `${cycle.from.rotation}deg`,
                              "--dm-polaroid-distance":
                                cycle.direction === 1 ? "-105%" : "105%",
                              "--dm-polaroid-tilt":
                                cycle.direction === 1 ? "-12deg" : "12deg",
                            }
                          : {}),
                      } as CSSProperties
                    }
                    onAnimationEnd={(event) => {
                      if (
                        outgoing &&
                        currentCycle.current === cycle &&
                        event.target === event.currentTarget &&
                        event.animationName === "dm-polaroid-cycle"
                      )
                        finishCycle();
                    }}
                    onTransitionEnd={(event) => {
                      if (
                        front &&
                        event.target === event.currentTarget &&
                        event.propertyName === "transform"
                      )
                        finishSettle();
                    }}
                  >
                    <img
                      src={item.photo.src}
                      alt={front ? item.photo.alt : ""}
                      loading="lazy"
                      draggable={false}
                      style={{ objectPosition: item.photo.objectPosition }}
                    />
                    <span
                      className="dm-polaroid-stack__caption"
                      id={front ? captionId : undefined}
                    >
                      {item.photo.caption || (
                        <span aria-hidden="true">&nbsp;</span>
                      )}
                    </span>
                  </span>
                );
              })}
            </button>
          </div>
          <div className="dm-polaroid-stack__controls">
            <button
              type="button"
              className="dm-polaroid-stack__control"
              aria-label="Previous photo"
              data-haptic="selection"
              onClick={() => change(-1)}
              disabled={items.length < 2}
            >
              <StackArrow previous />
            </button>
            <p
              className="dm-polaroid-stack__count"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="dm-polaroid-stack__sr-only">Photo </span>
              {index + 1}
              <span aria-hidden="true"> / </span>
              <span className="dm-polaroid-stack__sr-only"> of </span>
              {items.length}
            </p>
            <button
              type="button"
              className="dm-polaroid-stack__control"
              aria-label="Next photo"
              data-haptic="selection"
              onClick={() => change(1)}
              disabled={items.length < 2}
            >
              <StackArrow />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
