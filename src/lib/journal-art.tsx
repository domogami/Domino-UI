import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type SVGProps,
} from "react";
import type { DrawingProps } from "./brand";
import { SketchReplay } from "./sketch-replay";
import "./journal-art.css";

export interface TripleBannerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children">, DrawingProps {
  lines: [ReactNode, ReactNode, ReactNode];
  tone?: "accent" | "sage" | "peach" | "ink";
  /** Give the replay control a concise name when it is enabled. */
  label?: string;
  /** Use plain, noninteractive labels when the banner becomes a replay button. */
  replayOnClick?: boolean;
  /** Override the paper faces, folded reverse, lettering, and thin outline. */
  colors?: RibbonBannerColors;
}

export interface RibbonBannerColors {
  face?: CSSProperties["color"];
  reverse?: CSSProperties["color"];
  ink?: CSSProperties["color"];
  outline?: CSSProperties["color"];
}

export type RibbonBannerProps = TripleBannerProps;

export interface BookmarkDrawingProps
  extends Omit<SVGProps<SVGSVGElement>, "children" | "speed">, DrawingProps {
  /** Omit beside an equivalent caption to keep the illustration decorative. */
  label?: string;
  variant?: "notched" | "pointed";
  /** A stable native button redraws the ink on click, tap, Enter, or Space. */
  replayOnClick?: boolean;
}

const reducedQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(reducedQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
function readReducedMotion() {
  return window.matchMedia(reducedQuery).matches;
}
function reducedMotionOnServer() {
  return true;
}
function useQuietDrawing(quiet: boolean) {
  return (
    useSyncExternalStore(
      subscribeReducedMotion,
      readReducedMotion,
      reducedMotionOnServer,
    ) || quiet
  );
}

const useDrawingLayoutEffect =
  typeof document === "undefined" ? useEffect : useLayoutEffect;
const ribbonMotion = new Set([
  "dm-journal-art-draw",
  "dm-ribbon-fill",
  "dm-ribbon-label",
]);

function RibbonPiece({
  d,
  step,
  kind,
}: {
  d: string;
  step: number;
  kind: "face" | "fold" | "tail" | "crease";
}) {
  return (
    <>
      <path
        className={`dm-triple-banner__fill dm-triple-banner__${kind}`}
        d={d}
        stroke="none"
        style={{ "--dm-journal-art-step": step } as CSSProperties}
      />
      <Ink className="dm-triple-banner__outline" d={d} step={step} />
    </>
  );
}

function Ink({
  d,
  step = 0,
  className = "",
}: {
  d: string;
  step?: number;
  className?: string;
}) {
  return (
    <path
      className={`dm-journal-art-line ${className}`.trim()}
      d={d}
      pathLength="1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.15"
      strokeLinecap="round"
      strokeLinejoin="round"
      vectorEffect="non-scaling-stroke"
      style={{ "--dm-journal-art-step": step } as CSSProperties}
    />
  );
}

/** Three paper faces on one folded ribbon. Real text determines each face's height. */
export function TripleBanner({
  lines,
  tone = "accent",
  animate = false,
  quiet = false,
  speed = 1,
  replayKey = 0,
  label,
  replayOnClick = false,
  colors,
  className = "",
  style,
  ...props
}: TripleBannerProps) {
  const labelId = `${useId().replaceAll(":", "")}-ribbon-label`;
  const effectiveQuiet = useQuietDrawing(quiet);
  const element = useRef<HTMLDivElement>(null);
  const [localReplay, setLocalReplay] = useState(0);
  const Band = replayOnClick ? "span" : "div";
  const Label = replayOnClick ? "span" : "div";
  const replayLabel =
    label ||
    (lines.every((line) => typeof line === "string" || typeof line === "number")
      ? lines.join(", ")
      : "triple banner");
  useDrawingLayoutEffect(() => {
    const root = element.current;
    if (!root) return;
    let frame = 0;
    let active = true;
    const labels = Array.from(
      root.querySelectorAll<HTMLElement>(".dm-triple-banner__label"),
    );
    const measure = () => {
      if (!active) return;
      let preferred = 0;
      for (const label of labels) {
        // Measure a hidden, noninteractive copy at its natural one-line width.
        // The live label never moves, and WebKit receives a definite shared
        // width before resolving each band's wrapped intrinsic height.
        const copy = label.cloneNode(true) as HTMLElement;
        const css = getComputedStyle(label);
        copy.removeAttribute("id");
        copy
          .querySelectorAll("[id]")
          .forEach((node) => node.removeAttribute("id"));
        copy.setAttribute("aria-hidden", "true");
        copy.inert = true;
        copy.style.cssText = `position:fixed;inset:auto;visibility:hidden;pointer-events:none;inline-size:max-content;max-inline-size:none;min-inline-size:0;block-size:auto;display:block;animation:none;transform:none;font:${css.font};letter-spacing:${css.letterSpacing};word-spacing:${css.wordSpacing};text-transform:${css.textTransform}`;
        document.body.append(copy);
        preferred = Math.max(
          preferred,
          (copy.getBoundingClientRect().width +
            1.2 *
              Number.parseFloat(
                getComputedStyle(label.parentElement!).fontSize,
              )) /
            0.79,
        );
        copy.remove();
      }
      const next = `${Math.ceil(preferred)}px`;
      if (root.style.getPropertyValue("--dm-ribbon-preferred-width") !== next)
        root.style.setProperty("--dm-ribbon-preferred-width", next);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    const resize =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : undefined;
    resize?.observe(root);
    labels.forEach((label) => resize?.observe(label));
    const content = new MutationObserver(schedule);
    labels.forEach((label) =>
      content.observe(label, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      }),
    );
    document.fonts?.addEventListener("loadingdone", schedule);
    void document.fonts?.ready.then(() => {
      if (active) schedule();
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resize?.disconnect();
      content.disconnect();
      document.fonts?.removeEventListener("loadingdone", schedule);
    };
  }, [lines, style, className]);
  // Retain the actual labels and the replay button. Rewinding only our owned
  // clocks avoids a completed-ink flash and preserves focus during rapid replay.
  useDrawingLayoutEffect(() => {
    const root = element.current;
    if (!root || !animate || effectiveQuiet) return;
    root.getAnimations({ subtree: true }).forEach((animation) => {
      if (
        typeof CSSAnimation !== "undefined" &&
        animation instanceof CSSAnimation &&
        ribbonMotion.has(animation.animationName) &&
        animation.effect instanceof KeyframeEffect &&
        animation.effect.target instanceof Element &&
        animation.effect.target.closest(".dm-triple-banner") === root
      ) {
        animation.currentTime = 0;
        animation.play();
      }
    });
  }, [animate, effectiveQuiet, replayKey, localReplay, speed]);
  return (
    <div
      {...props}
      ref={element}
      className={`dm-journal-art dm-triple-banner dm-triple-banner--${tone} ${className}`.trim()}
      data-animate={animate && !effectiveQuiet ? "true" : "false"}
      data-quiet={effectiveQuiet ? "true" : "false"}
      data-replay={localReplay}
      style={
        {
          "--dm-drawing-rate": 1 / speed,
          ...(colors?.face ? { "--dm-triple-paper": colors.face } : {}),
          ...(colors?.reverse ? { "--dm-triple-reverse": colors.reverse } : {}),
          ...(colors?.ink ? { "--dm-triple-label": colors.ink } : {}),
          ...(colors?.outline ? { "--dm-triple-outline": colors.outline } : {}),
          ...style,
        } as CSSProperties
      }
    >
      <SketchReplay
        enabled={replayOnClick}
        quiet={effectiveQuiet || !animate}
        label={replayLabel}
        ariaDescribedBy={
          label
            ? [0, 1, 2].map((index) => `${labelId}-${index}`).join(" ")
            : undefined
        }
        onReplay={() => setLocalReplay((value) => value + 1)}
      >
        <>
          {lines.map((line, index) => (
            <Fragment key={index}>
              {index > 0 && (
                <svg
                  className="dm-triple-banner__reverse"
                  viewBox="0 0 600 72"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  <RibbonPiece
                    kind="fold"
                    step={index * 2 - 1}
                    d="M335-26Q431-29 539-25L265 98Q164 102 62 98Z"
                  />
                  <Ink
                    className="dm-journal-art-seam"
                    step={index * 2 - 1}
                    d="M526-18Q402 42 269 91"
                  />
                </svg>
              )}
              <Band className="dm-triple-banner__band">
                <svg
                  className="dm-triple-banner__paper"
                  viewBox="0 0 600 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  {index === 0 && (
                    <>
                      <RibbonPiece
                        kind="tail"
                        step={0}
                        d="M63 43 8 44 26 68 9 94 63 93Z"
                      />
                      <RibbonPiece
                        kind="crease"
                        step={0}
                        d="M63 74 53 84 63 93Z"
                      />
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <RibbonPiece
                        kind="tail"
                        step={4}
                        d="M537 43 592 44 574 68 591 94 537 93Z"
                      />
                      <RibbonPiece
                        kind="crease"
                        step={4}
                        d="M537 74 547 84 537 93Z"
                      />
                    </>
                  )}
                  <RibbonPiece
                    kind="face"
                    step={index * 2}
                    d="M63 0Q294-2 537 0L539 100Q298 102 62 100Z"
                  />
                </svg>
                <Label
                  id={`${labelId}-${index}`}
                  className="dm-triple-banner__label"
                  style={{ "--dm-ribbon-row": index } as CSSProperties}
                >
                  {line}
                </Label>
              </Band>
            </Fragment>
          ))}
        </>
      </SketchReplay>
    </div>
  );
}

/** Descriptive alias; TripleBanner remains available for existing consumers. */
export const RibbonBanner = TripleBanner;

/** Original hanging bookmark line art, with a faint second pen pass and teal seam. */
export function BookmarkDrawing({
  label,
  variant = "notched",
  animate = true,
  quiet = false,
  speed = 1,
  replayKey = 0,
  replayOnClick = false,
  className = "",
  style,
  ...props
}: BookmarkDrawingProps) {
  const titleId = `${useId().replaceAll(":", "")}-bookmark-title`;
  const effectiveQuiet = useQuietDrawing(quiet);
  const [localReplay, setLocalReplay] = useState(0);
  const named = !!(label || props["aria-label"] || props["aria-labelledby"]);
  const pointed = variant === "pointed";
  const drawing = (
    <svg
      {...props}
      key={`${variant}-${replayKey}-${localReplay}-${speed}-${animate}-${effectiveQuiet}`}
      className={`dm-journal-art dm-bookmark-drawing ${className}`.trim()}
      viewBox="0 0 240 240"
      fill="none"
      stroke="currentColor"
      role={named ? "img" : undefined}
      aria-labelledby={label ? titleId : props["aria-labelledby"]}
      aria-label={label ? undefined : props["aria-label"]}
      aria-hidden={replayOnClick || !named ? true : undefined}
      focusable="false"
      data-variant={variant}
      data-replay={localReplay}
      data-animate={animate && !effectiveQuiet ? "true" : "false"}
      data-quiet={effectiveQuiet ? "true" : "false"}
      style={{ "--dm-drawing-rate": 1 / speed, ...style } as CSSProperties}
    >
      {label && <title id={titleId}>{label}</title>}
      <Ink d="M43 41Q114 35 194 39" />
      <Ink
        step={1}
        d={
          pointed
            ? "M82 39Q114 37 145 39L147 175Q133 192 116 202L83 177Z"
            : "M80 39Q113 37 146 38L148 191Q131 182 115 170Q99 184 82 192Z"
        }
      />
      <Ink
        className="dm-journal-art-seam"
        step={2}
        d={
          pointed
            ? "M140 48 142 173Q130 187 116 195"
            : "M140 48 142 181Q129 174 117 165"
        }
      />
      <Ink
        className="dm-journal-art-echo"
        step={3}
        d={
          pointed
            ? "M151 48 153 178Q139 194 120 207"
            : "M152 49 154 199Q134 189 118 177"
        }
      />
      <Ink
        className="dm-journal-art-echo"
        step={3}
        d="M48 45Q65 42 76 43M155 43l31 1M86 45l5-.4"
      />
    </svg>
  );
  return (
    <SketchReplay
      enabled={replayOnClick}
      quiet={effectiveQuiet || !animate}
      label={label || props["aria-label"] || `${variant} bookmark`}
      onReplay={() => setLocalReplay((value) => value + 1)}
    >
      {drawing}
    </SketchReplay>
  );
}
