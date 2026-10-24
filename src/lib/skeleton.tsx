import type { HTMLAttributes } from "react";
import "./skeleton.css";

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  /** Quiet pen strokes by default; use block to reserve solid image areas. */
  variant?: "handwritten" | "block";
}

// Authored, nonverbal pen marks stay identical during server and client render.
// Small pauses between each group suggest the rhythm of words, without fake text.
const words = [
  "M3 18 C6 17 7 4 10 5 C14 7 7 22 12 19 C15 17 15 10 18 11 C21 12 17 20 21 18 C24 16 24 11 27 12 C31 14 26 20 31 18 L36 15",
  "M45 18 C48 16 48 10 51 11 C55 13 48 19 53 18 C58 17 56 6 60 5 C65 6 58 20 63 18 C65 17 66 11 69 12 C72 13 67 20 73 18 C78 17 76 11 80 12 C84 14 79 19 85 17 L91 14",
  "M101 17 C105 18 105 10 108 11 C113 13 105 20 111 18 C115 17 114 9 118 11 C122 14 116 19 122 17 C127 16 126 4 130 5 C134 7 127 20 133 18 L139 15",
  "M148 18 C152 17 152 10 156 11 C160 13 153 19 158 18 C163 17 162 12 165 12 C170 13 162 25 166 25 C170 24 167 17 173 15 C176 13 177 11 179 12 C183 15 177 20 184 17 L190 15",
  "M201 17 C205 17 205 4 209 5 C213 7 206 21 212 18 C216 16 215 11 219 12 C223 14 216 20 223 18 C227 17 226 11 230 12 C235 13 228 20 235 17 L241 15",
  "M251 18 C254 17 255 10 258 11 C263 12 255 20 261 18 C266 17 263 4 268 5 C272 7 265 20 271 18 C275 17 274 10 278 11 C283 13 276 20 283 18 C287 16 286 12 290 13 L298 16",
  "M308 18 C311 16 311 11 314 12 C319 13 311 20 318 18 C323 17 320 11 325 12 C329 14 323 19 329 17 C333 15 332 6 336 6 C340 8 333 20 340 18 L355 15",
];

const ring = [
  "M20 3 C29 2 36 9 36 19 C37 29 29 37 20 36 C10 37 3 29 4 19 C3 10 10 3 20 3",
  "M10 7 C16 1 28 3 33 10",
];

export function Skeleton({
  width = "100%",
  height = 16,
  circle = false,
  variant = "handwritten",
  className,
  style,
  ...props
}: SkeletonProps) {
  const paths = circle ? ring : words;
  return (
    <span
      {...props}
      aria-hidden="true"
      className={[
        "dm-skeleton",
        `dm-skeleton--${variant}`,
        circle && "dm-skeleton--circle",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width, height, ...style }}
    >
      {variant === "handwritten" && (
        <svg
          className="dm-skeleton__drawing"
          viewBox={circle ? "0 0 40 40" : "0 0 360 28"}
          preserveAspectRatio={circle ? "xMidYMid meet" : "none"}
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <g className="dm-skeleton__guide">
            {paths.map((path, index) => (
              <path key={index} d={path} />
            ))}
          </g>
          <g className="dm-skeleton__ink">
            {paths.map((path, index) => (
              <path
                key={index}
                d={path}
                pathLength="1"
                style={{
                  animationDelay: `calc(var(--dm-skeleton-word-stagger, 110ms) * ${index})`,
                }}
              />
            ))}
          </g>
        </svg>
      )}
    </span>
  );
}
