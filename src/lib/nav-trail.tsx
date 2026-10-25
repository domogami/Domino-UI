import {
  useEffect,
  useLayoutEffect,
  useRef,
  type HTMLAttributes,
  type RefObject,
} from "react";
import "./nav-trail.css";

export interface NavTrailProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** The scrollable navigation containing the original anchors or buttons. */
  containerRef: RefObject<HTMLElement | null>;
  /** Request measurement immediately after the application's route commits. */
  activeKey?: string | number;
  activeSelector?: string;
  itemSelector?: string;
  iconSelector?: string;
  quiet?: boolean;
}

type Placement = { top: number; left: number; width: number; height: number };
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const reducedQuery = "(prefers-reduced-motion: reduce)";
const geometryKeys = ["top", "left", "width", "height"] as const;

/** One persistent selection surface; the host keeps its native navigation semantics. */
export function NavTrail({
  containerRef,
  activeKey,
  activeSelector = '[aria-current="page"]',
  itemSelector = "a[href],button",
  iconSelector = ".dm-nav-icon",
  quiet = false,
  className,
  ...attributes
}: NavTrailProps) {
  const markerRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<(() => void) | null>(null);
  const quietRef = useRef(quiet);
  quietRef.current = quiet;
  const cancelFlairRef = useRef<(() => void) | null>(null);

  useBrowserLayoutEffect(() => {
    const marker = markerRef.current;
    // A child layout effect may precede attachment of its parent host's ref.
    // The required host class gives the same container during that first commit.
    const nav =
      containerRef.current ??
      marker?.closest<HTMLElement>(".dm-nav-trail-host");
    if (!nav || !marker) return;
    let active = true;
    let frame = 0;
    let placed = false;
    let previous: Placement | null = null;
    let previousItem: Element | null = null;
    const observed = new Set<Element>();
    const ownedFlair = new Map<Element, Animation[]>();
    const lastFlair = new WeakMap<Element, number>();
    const media =
      typeof matchMedia === "function" ? matchMedia(reducedQuery) : null;
    const reduced = () => quietRef.current || Boolean(media?.matches);
    const cancelFlair = () => {
      ownedFlair.forEach((animations) =>
        animations.forEach((animation) => animation.cancel()),
      );
      ownedFlair.clear();
    };
    cancelFlairRef.current = cancelFlair;

    const flair = (item: Element) => {
      if (reduced()) return;
      const icon = item.querySelector<SVGSVGElement>(iconSelector);
      if (!icon || typeof icon.animate !== "function") return;
      const now = performance.now();
      // A pointer hover/focus immediately followed by its route commit is one gesture.
      if (now - (lastFlair.get(icon) ?? -Infinity) < 140) return;
      lastFlair.set(icon, now);
      ownedFlair.get(icon)?.forEach((animation) => animation.cancel());
      const css = getComputedStyle(marker);
      const token = css.getPropertyValue("--dm-nav-icon-duration").trim();
      const duration = Math.max(
        0,
        Number.parseFloat(token || "420") *
          (token.endsWith("s") && !token.endsWith("ms") ? 1000 : 1),
      );
      if (!Number.isFinite(duration) || !duration) return;
      const name = item.getAttribute("data-nav-icon");
      const gesture =
        name === "pen"
          ? [
              "translate(0, 0) rotate(0deg)",
              "translate(1px, -1px) rotate(-11deg)",
              "translate(0, 0) rotate(0deg)",
            ]
          : name === "heart"
            ? ["scale(1)", "scale(1.13)", "scale(1)"]
            : name === "sparkle"
              ? [
                  "scale(1) rotate(0deg)",
                  "scale(1.13) rotate(12deg)",
                  "scale(1) rotate(0deg)",
                ]
              : name === "ruler"
                ? [
                    "translateX(0) rotate(0deg)",
                    "translateX(1px) rotate(-5deg)",
                    "translateX(0) rotate(0deg)",
                  ]
                : name === "type"
                  ? ["scaleX(1)", "scaleX(.88)", "scaleX(1)"]
                  : name === "play" || name === "code"
                    ? ["translateX(0)", "translateX(1.5px)", "translateX(0)"]
                    : ["rotate(0deg)", "rotate(-7deg)", "rotate(0deg)"];
      const base = getComputedStyle(icon).transform;
      const transforms = gesture.map((transform) =>
        base === "none" ? transform : `${base} ${transform}`,
      );
      const animations = [
        icon.animate(
          transforms.map((transform, index) => ({
            transform,
            offset: [0, 0.42, 1][index],
          })),
          {
            duration,
            easing:
              css.getPropertyValue("--dm-nav-easing").trim() ||
              "cubic-bezier(.22,.8,.24,1)",
          },
        ),
      ];
      // Trace the existing outline once; retain every original path and its semantics.
      const strokes = [
        ...icon.querySelectorAll<SVGGeometryElement>(
          "path,rect,circle,line,polyline,polygon,ellipse",
        ),
      ];
      strokes.forEach((stroke, index) => {
        if (
          typeof stroke.getTotalLength !== "function" ||
          getComputedStyle(stroke).stroke === "none"
        )
          return;
        let length: number;
        try {
          length = stroke.getTotalLength();
        } catch {
          return;
        }
        if (!Number.isFinite(length) || length <= 0) return;
        animations.push(
          stroke.animate(
            [
              {
                strokeDasharray: `${length} ${length}`,
                strokeDashoffset: length,
              },
              { strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 },
            ],
            {
              duration: duration * 0.72,
              delay: Math.min(index * duration * 0.055, duration * 0.22),
              easing: "ease-out",
            },
          ),
        );
      });
      ownedFlair.set(icon, animations);
      void Promise.all(
        animations.map((animation) =>
          animation.finished.catch(() => undefined),
        ),
      ).then(() => {
        if (ownedFlair.get(icon) === animations) ownedFlair.delete(icon);
      });
    };

    const measure = () => {
      if (!active) return;
      const item = nav.querySelector<HTMLElement>(activeSelector);
      const bounds = nav.getBoundingClientRect();
      if (
        !item ||
        !item.getClientRects().length ||
        !bounds.width ||
        !bounds.height ||
        getComputedStyle(item).visibility === "hidden"
      ) {
        marker.dataset.navReady = "false";
        placed = false;
        previous = null;
        return;
      }
      const box = item.getBoundingClientRect();
      const scaleX = nav.offsetWidth ? bounds.width / nav.offsetWidth : 1;
      const scaleY = nav.offsetHeight ? bounds.height / nav.offsetHeight : 1;
      const next: Placement = {
        top: (box.top - bounds.top) / scaleY + nav.scrollTop - nav.clientTop,
        left:
          (box.left - bounds.left) / scaleX + nav.scrollLeft - nav.clientLeft,
        width: box.width / scaleX,
        height: box.height / scaleY,
      };
      if (
        !geometryKeys.every((key) => Number.isFinite(next[key])) ||
        next.width <= 0 ||
        next.height <= 0
      )
        return;
      geometryKeys.forEach((key) => {
        next[key] = Math.round(next[key] * 100) / 100;
      });
      if (
        !previous ||
        geometryKeys.some((key) => next[key] !== previous![key])
      ) {
        marker.style.width = `${next.width}px`;
        marker.style.height = `${next.height}px`;
        marker.style.transform = `translate3d(${next.left}px, ${next.top}px, 0)`;
        previous = next;
      }
      marker.dataset.activeHref = item.getAttribute("href") ?? "";
      if (!placed) {
        // Commit the first geometry while transitions are disabled: no flight from (0,0).
        marker.getBoundingClientRect();
        marker.dataset.navReady = "true";
        placed = true;
      }
      if (previousItem && previousItem !== item) flair(item);
      previousItem = item;
    };
    const schedule = () => {
      if (active && !frame)
        frame = requestAnimationFrame(() => {
          frame = 0;
          measure();
        });
    };
    measureRef.current = measure;
    const resize =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(schedule)
        : null;
    const watchLayout = () => {
      const elements = new Set<Element>([nav]);
      nav.querySelectorAll(itemSelector).forEach((item) => {
        for (
          let element: Element | null = item;
          element && nav.contains(element);
          element = element.parentElement
        )
          elements.add(element);
      });
      observed.forEach((element) => {
        if (!elements.has(element)) {
          resize?.unobserve(element);
          observed.delete(element);
        }
      });
      elements.forEach((element) => {
        if (!observed.has(element)) {
          observed.add(element);
          resize?.observe(element);
        }
      });
    };
    const mutations = new MutationObserver((records) => {
      const relevant = records.filter(
        (record) => record.target !== marker && !marker.contains(record.target),
      );
      if (!relevant.length) return;
      if (relevant.some((record) => record.type === "childList")) watchLayout();
      schedule();
    });
    mutations.observe(nav, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-current", "class", "style", "hidden"],
    });
    const ancestors = new MutationObserver(schedule);
    for (
      let element = nav.parentElement;
      element;
      element = element.parentElement
    )
      ancestors.observe(element, {
        attributes: true,
        attributeFilter: [
          "class",
          "style",
          "hidden",
          "aria-hidden",
          "data-theme",
        ],
      });
    const findItem = (target: EventTarget | null) =>
      target instanceof Element ? target.closest(itemSelector) : null;
    const hover = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const item = findItem(event.target);
      if (
        item &&
        nav.contains(item) &&
        (!(event.relatedTarget instanceof Node) ||
          !item.contains(event.relatedTarget))
      )
        flair(item);
    };
    const focus = (event: FocusEvent) => {
      const item = findItem(event.target);
      if (item && nav.contains(item)) flair(item);
    };
    const preference = () => {
      if (reduced()) cancelFlair();
      measure();
    };
    nav.addEventListener("pointerover", hover);
    nav.addEventListener("focusin", focus);
    nav.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("scroll", schedule, {
      passive: true,
      capture: true,
    });
    document.fonts?.addEventListener("loadingdone", schedule);
    document.fonts?.addEventListener("loadingerror", schedule);
    void document.fonts?.ready.then(() => {
      if (active) schedule();
    });
    media?.addEventListener("change", preference);
    watchLayout();
    measure();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      cancelFlair();
      resize?.disconnect();
      mutations.disconnect();
      ancestors.disconnect();
      nav.removeEventListener("pointerover", hover);
      nav.removeEventListener("focusin", focus);
      nav.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      document.fonts?.removeEventListener("loadingdone", schedule);
      document.fonts?.removeEventListener("loadingerror", schedule);
      media?.removeEventListener("change", preference);
      measureRef.current = null;
      cancelFlairRef.current = null;
    };
  }, [containerRef, activeSelector, itemSelector, iconSelector]);

  useBrowserLayoutEffect(() => {
    measureRef.current?.();
  }, [activeKey]);
  useBrowserLayoutEffect(() => {
    if (quiet) cancelFlairRef.current?.();
  }, [quiet]);

  return (
    <span
      {...attributes}
      ref={markerRef}
      aria-hidden="true"
      className={["dm-nav-trail", className].filter(Boolean).join(" ")}
      data-nav-ready="false"
      data-quiet={quiet ? "true" : undefined}
    />
  );
}
