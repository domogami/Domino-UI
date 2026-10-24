import type { SVGProps } from "react";
import "./chevron.css";

export type ChevronDirection = "down" | "up" | "left" | "right";

export interface ChevronProps extends Omit<
  SVGProps<SVGSVGElement>,
  "children"
> {
  direction?: ChevronDirection;
  size?: number | string;
}

/** One centered pen stroke for controls and navigation. Meaning belongs to its label. */
export function Chevron({
  direction = "down",
  size = "1em",
  className,
  ...props
}: ChevronProps) {
  return (
    <svg
      {...props}
      className={["dm-chevron", className].filter(Boolean).join(" ")}
      data-direction={direction}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 8L12 16L20 8" />
    </svg>
  );
}
