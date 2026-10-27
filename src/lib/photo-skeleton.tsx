import type { CSSProperties, HTMLAttributes } from "react";
import "./photo-skeleton.css";

export interface PhotoSkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Width divided by height of the reserved photo area. */
  aspectRatio?: number;
  width?: string | number;
  height?: string | number;
  /** Show the complete drawing without motion. */
  quiet?: boolean;
}

// Original, nonverbal landscape marks. Fixed geometry stays identical in SSR,
// hydration, and every quiet/reduced-motion view; no image or font is fetched.
const landscape = [
  { part: "sun", d: "M166 32C178 30 187 40 185 51C184 62 174 69 163 66C152 64 147 55 150 45C153 36 159 33 166 32Z" },
  { part: "rays", d: "M166 21L167 13M188 28L194 22M195 48L204 47M146 28L140 22" },
  { part: "cloud", d: "M28 62C31 54 38 52 45 55C47 43 63 40 70 49C76 45 85 50 85 57C92 56 97 60 96 66C77 67 47 66 28 67" },
  { part: "far-hill", d: "M22 127C42 119 54 96 72 97C91 97 101 121 121 118C138 115 148 92 166 91C186 90 201 112 219 124" },
  { part: "near-hill", d: "M22 141C45 139 57 119 79 121C102 122 114 141 138 138C164 134 177 119 197 127C207 131 215 136 221 138" },
  { part: "ground", d: "M23 148C74 145 117 151 158 148C181 147 199 146 219 148" },
  { part: "echo", d: "M51 155C72 153 90 157 112 155M169 155C181 154 193 155 204 154" },
] as const;

export function PhotoSkeleton({
  aspectRatio = 4 / 3,
  width = "100%",
  height,
  quiet = false,
  className,
  style,
  ...props
}: PhotoSkeletonProps) {
  const ratio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 4 / 3;
  return (
    <span
      {...props}
      aria-hidden="true"
      inert
      tabIndex={-1}
      data-quiet={quiet ? "true" : undefined}
      className={["dm-photo-skeleton", className].filter(Boolean).join(" ")}
      style={{ width, height, aspectRatio: ratio, ...style }}
    >
      <svg
        className="dm-photo-skeleton__frame"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="dm-photo-skeleton__guide" d="M17 13C114 10 272 14 383 12L386 283C276 287 115 283 15 286L17 13Z"/>
        <path className="dm-photo-skeleton__stroke" pathLength="1" d="M17 13C114 10 272 14 383 12C387 86 384 192 386 283C276 287 115 283 15 286C12 202 17 105 17 13Z" style={{ "--dm-photo-skeleton-step": 0 } as CSSProperties}/>
        <path className="dm-photo-skeleton__stroke dm-photo-skeleton__frame-echo" pathLength="1" d="M24 21C104 18 194 22 252 20M377 184C378 218 377 253 378 275" style={{ "--dm-photo-skeleton-step": 1 } as CSSProperties}/>
      </svg>
      <svg
        className="dm-photo-skeleton__drawing"
        viewBox="0 0 240 180"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <g className="dm-photo-skeleton__guide">
          {landscape.map(mark => <path key={mark.part} d={mark.d}/>)}
        </g>
        {landscape.map((mark, index) => <path
          key={mark.part}
          className={`dm-photo-skeleton__stroke dm-photo-skeleton__stroke--${mark.part}`}
          d={mark.d}
          pathLength="1"
          style={{ "--dm-photo-skeleton-step": index + 2 } as CSSProperties}
        />)}
      </svg>
    </span>
  );
}
