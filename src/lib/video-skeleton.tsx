import type { CSSProperties, HTMLAttributes } from "react";
import "./video-skeleton.css";

export interface VideoSkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /** Width divided by height of the reserved video area. */
  aspectRatio?: number;
  width?: string | number;
  height?: string | number;
  /** Show the complete drawing without motion. */
  quiet?: boolean;
}

// Original film-leader marks and a play cue. Stable geometry supports SSR and
// hydration without loading a recording, font, poster, or media player.
const marks = [
  { part: "ring", d: "M119 25C144 22 166 40 166 64C167 87 147 105 123 105C97 107 77 88 76 66C74 44 95 26 119 25Z" },
  { part: "ring-echo", d: "M86 57C88 42 103 34 116 33M154 76C150 88 140 95 129 96" },
  { part: "play", d: "M109 48C119 52 132 59 142 65C133 72 119 79 110 84C108 73 109 58 109 48Z" },
  { part: "leader", d: "M61 127C98 125 142 129 179 126M181 123L181 130" },
  { part: "splice", d: "M48 126L52 126M189 126L193 126" },
] as const;

export function VideoSkeleton({
  aspectRatio = 16 / 9,
  width = "100%",
  height,
  quiet = false,
  className,
  style,
  ...props
}: VideoSkeletonProps) {
  const ratio = Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 16 / 9;
  return (
    <span
      {...props}
      aria-hidden="true"
      inert
      tabIndex={-1}
      data-quiet={quiet ? "true" : undefined}
      className={["dm-video-skeleton", className].filter(Boolean).join(" ")}
      style={{ width, height, aspectRatio: ratio, ...style }}
    >
      <svg className="dm-video-skeleton__frame" viewBox="0 0 400 225" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false">
        <path className="dm-video-skeleton__guide" d="M16 13C120 10 271 14 383 12L386 210C274 214 116 209 15 212L16 13Z"/>
        <path className="dm-video-skeleton__stroke" pathLength="1" d="M16 13C120 10 271 14 383 12C387 72 383 145 386 210C274 214 116 209 15 212C12 147 17 72 16 13Z" style={{ "--dm-video-skeleton-step": 0 } as CSSProperties}/>
        <path className="dm-video-skeleton__stroke dm-video-skeleton__stroke--perforations" pathLength="1" d="M40 24L57 24L57 34L40 35L40 24ZM101 24L118 25L118 35L101 34L101 24ZM164 24L181 24L180 35L164 34L164 24ZM225 24L242 24L243 35L226 35L225 24ZM287 24L304 24L305 35L288 34L287 24ZM348 24L365 25L365 35L348 35L348 24Z" style={{ "--dm-video-skeleton-step": 1 } as CSSProperties}/>
        <path className="dm-video-skeleton__stroke dm-video-skeleton__stroke--perforations" pathLength="1" d="M40 190L57 190L57 201L40 200L40 190ZM101 191L118 190L118 201L101 201L101 191ZM164 191L181 190L180 200L164 201L164 191ZM225 190L242 191L243 201L226 200L225 190ZM287 190L304 190L305 201L288 201L287 190ZM348 191L365 190L365 201L348 201L348 191Z" style={{ "--dm-video-skeleton-step": 2 } as CSSProperties}/>
      </svg>
      <svg className="dm-video-skeleton__drawing" viewBox="0 0 240 150" preserveAspectRatio="xMidYMid meet" fill="none" aria-hidden="true" focusable="false">
        <g className="dm-video-skeleton__guide">{marks.map(mark => <path key={mark.part} d={mark.d}/>)}</g>
        <path className="dm-video-skeleton__play-fill" d={marks[2].d}/>
        {marks.map((mark, index) => <path
          key={mark.part}
          className={`dm-video-skeleton__stroke dm-video-skeleton__stroke--${mark.part}`}
          d={mark.d}
          pathLength="1"
          style={{ "--dm-video-skeleton-step": index + 3 } as CSSProperties}
        />)}
      </svg>
    </span>
  );
}
