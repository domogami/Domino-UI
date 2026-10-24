import {
  Fragment,
  useId,
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
}

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
  className = "",
  style,
  ...props
}: TripleBannerProps) {
  const effectiveQuiet = useQuietDrawing(quiet);
  const [localReplay, setLocalReplay] = useState(0);
  const Band = replayOnClick ? "span" : "div";
  const Label = replayOnClick ? "span" : "div";
  const replayLabel =
    label ||
    (lines.every((line) => typeof line === "string" || typeof line === "number")
      ? lines.join(", ")
      : "triple banner");
  return (
    <div
      {...props}
      className={`dm-journal-art dm-triple-banner dm-triple-banner--${tone} ${className}`.trim()}
      data-animate={animate && !effectiveQuiet ? "true" : "false"}
      data-quiet={effectiveQuiet ? "true" : "false"}
      data-replay={localReplay}
      style={{ "--dm-drawing-rate": 1 / speed, ...style } as CSSProperties}
    >
      <SketchReplay
        enabled={replayOnClick}
        quiet={effectiveQuiet || !animate}
        label={replayLabel}
        onReplay={() => setLocalReplay((value) => value + 1)}
      >
        <Fragment
          key={`${replayKey}-${localReplay}-${speed}-${animate}-${effectiveQuiet}`}
        >
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
                  <Ink
                    className="dm-triple-banner__fold"
                    step={index * 3 - 1}
                    d="M335-26Q431-29 539-25L265 98Q164 102 62 98Z"
                  />
                  <Ink
                    className="dm-journal-art-seam"
                    step={index * 3}
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
                      <Ink
                        className="dm-triple-banner__tail"
                        d="M69 43 8 44 26 68 9 94 88 93 88 75Z"
                      />
                      <Ink
                        className="dm-triple-banner__crease"
                        d="M63 74 88 93 87 74Z"
                      />
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <Ink
                        className="dm-triple-banner__tail"
                        step={7}
                        d="M531 43 592 44 574 68 591 94 512 93 512 75Z"
                      />
                      <Ink
                        className="dm-triple-banner__crease"
                        step={7}
                        d="M537 74 512 93 513 74Z"
                      />
                    </>
                  )}
                  <Ink
                    className="dm-triple-banner__face"
                    step={index * 3 + 1}
                    d="M63 0Q294-2 537 0L539 100Q298 102 62 100Z"
                  />
                  <Ink
                    className="dm-journal-art-echo"
                    step={index * 3 + 2}
                    d="M76 5Q289 3 518 5"
                  />
                </svg>
                <Label className="dm-triple-banner__label">{line}</Label>
              </Band>
            </Fragment>
          ))}
        </Fragment>
      </SketchReplay>
    </div>
  );
}

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
