import { forwardRef, type ButtonHTMLAttributes } from "react";
import "./menu-toggle.css";

export interface MenuToggleProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  open: boolean;
  openLabel?: string;
  closeLabel?: string;
}

/** A controlled disclosure button whose three ink strokes become a close mark. */
export const MenuToggle = forwardRef<HTMLButtonElement, MenuToggleProps>(
  function MenuToggle(
    {
      open,
      openLabel = "Open navigation",
      closeLabel = "Close navigation",
      className,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        className={["dm-menu-toggle", className].filter(Boolean).join(" ")}
        data-state={open ? "open" : "closed"}
        aria-expanded={open}
        aria-label={open ? closeLabel : openLabel}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            className="dm-menu-toggle__line dm-menu-toggle__top"
            d="M5 12h14"
          />
          <path
            className="dm-menu-toggle__line dm-menu-toggle__middle"
            d="M5 12h14"
          />
          <path
            className="dm-menu-toggle__line dm-menu-toggle__bottom"
            d="M5 12h14"
          />
        </svg>
      </button>
    );
  },
);
