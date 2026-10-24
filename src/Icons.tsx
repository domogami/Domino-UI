import type { CSSProperties } from "react";
import { Chevron } from "./lib/chevron";
export function Icon({
  name,
  size = 18,
  style,
  ...props
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}) {
  if (name === "chevron" || name === "down") {
    return (
      <Chevron
        direction={name === "chevron" ? "right" : "down"}
        size={size}
        style={style}
        {...props}
      />
    );
  }
  const paths: Record<string, React.ReactNode> = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    arrow: (
      <>
        <path d="M4 12h16m-6-6 6 6-6 6" />
      </>
    ),
    external: (
      <>
        <path d="M14 4h6v6m0-6L9 15M10 4H4v16h16v-6" />
      </>
    ),
    code: (
      <>
        <path d="m8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M15 8V3H3v13h5" />
      </>
    ),
    book: (
      <>
        <path d="M12 5v16M3 3c5-1 9 2 9 2s4-3 9-2v16c-5-1-9 2-9 2s-4-3-9-2V3Z" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    palette: (
      <>
        <path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4 2 2 0 0 1 1-3h3c5 0 3-11-6-11Z" />
        <path d="M7 8h.01M12 6h.01M17 8h.01M6 13h.01" strokeWidth="3" />
      </>
    ),
    type: (
      <>
        <path d="M3 5h18M12 5v16M8 21h8" />
      </>
    ),
    ruler: (
      <>
        <path d="m3 15 12-12 6 6L9 21l-6-6Zm5-5 3 3m1-7 3 3M5 13l3 3" />
      </>
    ),
    pen: (
      <>
        <path d="m14 4 6 6M4 20l2-7L17 2l5 5L11 18l-7 2Z" />
      </>
    ),
    play: <path d="m8 4 12 8-12 8V4Z" />,
    replay: (
      <>
        <path d="M3 10a9 9 0 1 1 1 7M3 3v7h7" />
      </>
    ),
    check: <path d="m4 12 5 5L20 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" />
      </>
    ),
    heart: (
      <path d="M12 21S2 15 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 7-10 13-10 13Z" />
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" />
      </>
    ),
    moon: <path d="M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13Z" />,
    half: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 3C6 2 1 9 6 16s15 2 14-13ZM4 21 16 9" />
      </>
    ),
    sparkle: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10h.01" />
      </>
    ),
    github: (
      <>
        <path d="M9 19c-4 1-4-2-6-2m12 5v-4c0-1-.3-2-1-2 4-.4 7-2 7-6 0-2-.5-3-2-4 0-1 0-3-1-3-2 0-4 2-4 2H9S7 3 5 3C4 3 4 5 4 6c-1 1-2 2-2 4 0 4 3 6 7 6-.7.6-1 1-1 2v4" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.55"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={style}
      {...props}
    >
      {paths[name] || paths.grid}
    </svg>
  );
}
export function DominoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size + 7} viewBox="0 0 36 43" aria-hidden="true">
      <g transform="rotate(-12 18 21)">
        <rect x="8" y="3" width="21" height="36" rx="3" fill="currentColor" />
        <path d="M8 21h21" stroke="var(--dm-sidebar)" strokeWidth="1.5" />
        <circle cx="18.5" cy="12" r="2" fill="var(--dm-sidebar)" />
        <circle cx="18.5" cy="30" r="2" fill="var(--dm-sidebar)" />
      </g>
    </svg>
  );
}
