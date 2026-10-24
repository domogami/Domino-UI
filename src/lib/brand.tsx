import {
  useId,
  type CSSProperties,
  type ReactNode,
  type SVGProps,
} from "react";
import { nameGlyphs, nameWidth } from "./nameGlyphs";
import "./brand.css";

export type DrawingSpeed = 0.5 | 1 | 1.5 | 2;

export interface DrawingProps {
  /** Start the drawing on mount. False always displays the completed artwork. */
  animate?: boolean;
  /** Keep the completed artwork still, regardless of animate. */
  quiet?: boolean;
  speed?: DrawingSpeed;
  /** Change this value to remount the drawing and replay it. */
  replayKey?: string | number;
}

type BrandSvgProps = Omit<SVGProps<SVGSVGElement>, "children" | "speed"> &
  DrawingProps;

function drawingStyle(
  speed: DrawingSpeed,
  style?: CSSProperties,
): CSSProperties {
  return { "--dm-drawing-rate": 1 / speed, ...style } as CSSProperties;
}

/** Exact Poppins Bold outlines from dominicklee.net, with the Shared sketch timing. */
export function HeroName({
  animate = true,
  quiet = false,
  speed = 1,
  replayKey = 0,
  label = "Dom Lee.",
  className = "",
  style,
  ...props
}: BrandSvgProps & { label?: string }) {
  const id = useId().replaceAll(":", "");
  const clip = `${id}-hero-ink`;
  const title = `${id}-hero-title`;
  return (
    <svg
      {...props}
      key={`${replayKey}-${speed}-${animate}-${quiet}`}
      className={`dm-hero-name ${className}`.trim()}
      viewBox={`0 0 ${nameWidth} 108`}
      role="img"
      aria-labelledby={title}
      focusable="false"
      data-animate={animate && !quiet ? "true" : "false"}
      style={drawingStyle(speed, style)}
    >
      <title id={title}>{label}</title>
      <defs>
        <clipPath id={clip} clipPathUnits="userSpaceOnUse">
          <polygon
            className="dm-hero-name-sweep"
            points="-600,-10 540,-10 480,118 -600,118"
          />
        </clipPath>
      </defs>
      {nameGlyphs.slice(0, -1).map((glyph, index) => (
        <g key={index}>
          <path d={glyph.d} fill="currentColor" clipPath={`url(#${clip})`} />
          <path
            className="dm-hero-name-outline"
            d={glyph.d}
            fill="none"
            stroke="currentColor"
            strokeWidth=".65"
            pathLength="1"
          />
        </g>
      ))}
      <path className="dm-hero-name-period" d={nameGlyphs[6].d} />
    </svg>
  );
}

// Fold geometry traced from Crane_Logo_V5. Matches the portfolio masthead and hero.
const craneFolds = [
  "M48 99 76 85 70 73Z",
  "M80 68 142 194 160 142Z",
  "M168 89 218 26 229 76 183 98 164 131Z",
  "M154 192 186 117 194 177Z",
  "M196 110 309 46 265 197 205 177Z",
  "M275 199 291 146 350 142Z",
] as const;

/** The six original origami facets. Omit label when used beside a text brand. */
export function Crane({
  animate = false,
  quiet = false,
  speed = 1,
  replayKey = 0,
  label,
  className = "",
  style,
  ...props
}: BrandSvgProps & { label?: string }) {
  const title = `${useId().replaceAll(":", "")}-crane-title`;
  return (
    <svg
      {...props}
      key={`${replayKey}-${speed}-${animate}-${quiet}`}
      className={`dm-crane ${className}`.trim()}
      viewBox="30 10 340 210"
      fill="none"
      role={label ? "img" : undefined}
      aria-labelledby={label ? title : undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-animate={animate && !quiet ? "true" : "false"}
      style={drawingStyle(speed, style)}
    >
      {label && <title id={title}>{label}</title>}
      {craneFolds.map((d, index) => (
        <path
          key={d}
          d={d}
          pathLength="1"
          style={{ "--dm-fold": index } as CSSProperties}
        />
      ))}
    </svg>
  );
}

const arrowStrokes = {
  "up-right": "M5 20Q10 12 19 5M9 5Q15 4 19 5Q18 10 19 15",
  "down-right": "M5 4Q12 9 19 19M9 19Q15 20 19 19Q18 13 19 9",
  left: "M20 12Q12 10 4 12M10 5Q7 9 4 12Q7 15 10 19",
  right: "M4 12Q12 10 20 12M14 5Q17 9 20 12Q17 15 14 19",
  up: "M12 21Q10 13 12 3M5 10Q9 7 12 3Q15 7 19 10",
  undo: "M5 10Q12 2 19 9T17 20M5 3Q4 7 5 11Q9 12 13 11",
  refresh: "M19 7C11-2 1 6 4 15S20 25 21 13M19 2Q18 5 19 9Q15 10 12 9",
  swap: "M3 7Q11 6 21 7M16 2Q18 5 21 7Q18 9 16 12M21 17Q12 18 3 17M8 12Q5 15 3 17Q5 20 8 22",
  chevron: "M5 9Q8 11 12 15Q16 11 19 9",
} as const;

export type SketchArrowDirection = keyof typeof arrowStrokes;

/** Decorative ink paths; the containing link or button supplies its name. */
export function SketchArrow({
  direction = "up-right",
  className = "",
  ...props
}: Omit<SVGProps<SVGSVGElement>, "children"> & {
  direction?: SketchArrowDirection;
}) {
  return (
    <svg
      {...props}
      className={`dm-sketch-arrow ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path pathLength="1" d={arrowStrokes[direction]} />
    </svg>
  );
}

export interface HandwrittenNoteProps extends DrawingProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tone?: "accent" | "ink" | "muted" | "terracotta";
}

/** Caveat annotation. Text stays intact for assistive technology and word wrapping. */
export function HandwrittenNote({
  children,
  className = "",
  style,
  tone = "accent",
  animate = false,
  quiet = false,
  speed = 1,
  replayKey = 0,
}: HandwrittenNoteProps) {
  const text = typeof children === "string" ? children : null;
  let index = 0;
  return (
    <span
      key={`${replayKey}-${speed}-${animate}-${quiet}`}
      className={`dm-handwritten-note ${className}`.trim()}
      data-tone={tone}
      data-animate={animate && !quiet ? "true" : "false"}
      style={drawingStyle(speed, style)}
    >
      {text ? (
        <>
          <span className="dm-brand-sr-only">{text}</span>
          <span aria-hidden="true">
            {text.split(" ").map((word, wordIndex) => (
              <span key={wordIndex}>
                {wordIndex > 0 && " "}
                <span className="dm-ink-word">
                  {Array.from(word).map((letter) => (
                    <span
                      key={index}
                      className="dm-ink-letter"
                      style={{ "--dm-letter": index++ } as CSSProperties}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              </span>
            ))}
          </span>
        </>
      ) : (
        children
      )}
    </span>
  );
}

/** Original portfolio plant geometry. Wrap in a button to offer replay. */
export function GardenPlant({
  animate = false,
  quiet = false,
  speed = 1,
  replayKey = 0,
  label,
  className = "",
  style,
  ...props
}: BrandSvgProps & { label?: string }) {
  const title = `${useId().replaceAll(":", "")}-plant-title`;
  return (
    <svg
      {...props}
      key={`${replayKey}-${speed}-${animate}-${quiet}`}
      className={`dm-garden-plant ${className}`.trim()}
      viewBox="0 0 120 144"
      fill="none"
      role={label ? "img" : undefined}
      aria-labelledby={label ? title : undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-animate={animate && !quiet ? "true" : "false"}
      style={drawingStyle(speed, style)}
    >
      {label && <title id={title}>{label}</title>}
      <path
        className="dm-plant-stem"
        pathLength="1"
        d="M59 104Q65 91 61 77Q64 65 61 57Q59 53 59 49Q55 40 61 33Q61 21 67 13M61 77Q44 69 23 53M61 57Q80 45 92 26"
      />
      <path
        className="dm-plant-leaf"
        pathLength="1"
        d="M59 49Q35 46 35 20Q60 20 59 49Z"
      />
      <path
        className="dm-plant-leaf"
        pathLength="1"
        d="M61 57Q61 30 92 26Q94 50 61 57Z"
      />
      <path
        className="dm-plant-leaf"
        pathLength="1"
        d="M61 77Q32 79 23 53Q52 51 61 77Z"
      />
      <path
        className="dm-plant-leaf"
        pathLength="1"
        d="M61 33Q57 11 79 6Q85 25 61 33Z"
      />
      <path
        className="dm-plant-pot"
        pathLength="1"
        d="M34 103Q61 100 87 103L80 134Q60 139 42 134ZM31 94Q60 91 90 94L89 103Q60 106 32 103Z"
      />
      <path
        className="dm-plant-detail"
        pathLength="1"
        d="M47 113 50 126M37 140Q61 143 85 140"
      />
    </svg>
  );
}

/** Original folded/notched banner geometry, independent from page heading level. */
export function BrandBanner({
  children,
  folded = false,
  animate = false,
  quiet = false,
  speed = 1,
  replayKey = 0,
  className = "",
  style,
}: DrawingProps & {
  children: ReactNode;
  folded?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      key={`${replayKey}-${speed}-${animate}-${quiet}`}
      className={`dm-brand-banner ${folded ? "dm-brand-banner--folded" : ""} ${className}`.trim()}
      data-animate={animate && !quiet ? "true" : "false"}
      style={drawingStyle(speed, style)}
    >
      <svg
        viewBox="0 0 320 80"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {folded ? (
          <>
            <path
              className="dm-banner-tail"
              pathLength="1"
              d="M57 30 4 30 24 49 5 72 81 72 81 55M263 30 316 30 296 49 315 72 239 72 239 55"
            />
            <path
              className="dm-banner-fold"
              pathLength="1"
              d="M57 55 81 72 81 55ZM263 55 239 72 239 55Z"
            />
            <path
              className="dm-banner-face"
              pathLength="1"
              d="M57 8Q157 5 263 8L263 55Q157 52 57 55Z"
            />
          </>
        ) : (
          <path
            className="dm-banner-face"
            pathLength="1"
            d="M3 4 317 4 300 40 317 76 3 76 20 40Z"
          />
        )}
      </svg>
      <span className="dm-brand-banner-label">{children}</span>
    </span>
  );
}
