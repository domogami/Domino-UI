import type { ReactNode } from "react";
import "./sketch-replay.css";

/** Keep the replay target and its keyboard focus stable while the artwork redraws. */
export function SketchReplay({
  enabled,
  quiet,
  label,
  ariaDescribedBy,
  onReplay,
  children,
}: {
  enabled: boolean;
  quiet: boolean;
  label: string;
  ariaDescribedBy?: string;
  onReplay: () => void;
  children: ReactNode;
}) {
  if (!enabled) return <>{children}</>;
  return (
    <button
      className="dm-sketch-replay"
      type="button"
      aria-label={`Replay ${label}`}
      aria-describedby={ariaDescribedBy}
      disabled={quiet}
      onClick={(event) => {
        // Hairline may focus its internal stage on pointerdown. Own focus before
        // replacing that stage so the replay button stays usable from the keyboard.
        event.currentTarget.focus({ preventScroll: true });
        onReplay();
      }}
      title={quiet ? "Sketch motion is quiet" : "Click or tap to draw again"}
    >
      {children}
    </button>
  );
}
