import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
} from "react";
import {
  branches,
  loupe,
  riffle,
  type Figure,
  type HairlineOptions,
} from "@lucasmarkes/hairline";
import "./hairline.css";
import { SketchReplay } from "./sketch-replay";

// Original figures and runtime: Hairline, MIT © 2026 Lucas Marques.
// https://github.com/lucasmarkes/hairline — Domino supplies the palette and motion boundary.
export type HairlineSketchVariant = "riffle" | "branches" | "loupe";

export interface HairlineSketchProps extends Omit<
  ComponentPropsWithoutRef<"div">,
  "children" | "role" | "aria-label" | "tabIndex"
> {
  variant?: HairlineSketchVariant;
  /** One description for the illustration, rather than its decorative SVG parts. */
  label?: string;
  /** Opt in to Hairline's guided pointer tour. Real input pauses the tour. */
  play?: boolean;
  /** Pointer response from 0 to 1; the default keeps the drawing gentle. */
  intensity?: number;
  /** A finished, still illustration with no pointer response or automatic motion. */
  quiet?: boolean;
  /** Replay the one-time ink sweep on click, tap, Enter, or Space. */
  replayOnClick?: boolean;
  /** Change to replay the ink sweep from an external control. */
  replayKey?: string | number;
  /** Upstream caption updates, for a visible readout outside the illustration. */
  onRead?: HairlineOptions["onRead"];
}

// The public vanilla functions tree-shake to these three figures. The upstream
// React entry currently initializes every component, retaining all 33 engines.
const figures = { riffle, branches, loupe };
const descriptions: Record<HairlineSketchVariant, string> = {
  riffle: "A tray of paper cards drawn in thin ink lines",
  branches: "A branching trail of ideas drawn in thin ink lines",
  loupe: "A magnifying glass over a ruled notebook page",
};
const motionQuery = "(prefers-reduced-motion: reduce)";
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function motionSnapshot() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
    ? window.matchMedia(motionQuery).matches
    : true;
}

function subscribeMotion(onChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function")
    return () => {};
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

type FigureLayerProps = {
  variant: HairlineSketchVariant;
  intensity: number;
  play: boolean;
  still: boolean;
  label: string;
  reveal: boolean;
  onRead?: HairlineOptions["onRead"];
};

/** A small React owner for the public mount/update/destroy lifecycle. */
function FigureLayer({
  variant,
  intensity,
  play,
  still,
  label,
  reveal,
  onRead,
}: FigureLayerProps) {
  const host = useRef<HTMLDivElement>(null);
  const figure = useRef<Figure | null>(null);
  const read = useRef(onRead);
  const lastOptions = useRef<HairlineOptions | null>(null);

  useIsoLayoutEffect(() => {
    read.current = onRead;
  });

  useIsoLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const options: HairlineOptions = { intensity, play, label };
    const mounted = figures[variant](element, {
      ...options,
      onRead: (text) => read.current?.(text),
    });
    figure.current = mounted;
    lastOptions.current = options;
    // These figures are illustrations here, including the otherwise focusable Riffle.
    element.setAttribute("aria-hidden", "true");
    element.setAttribute("role", "presentation");
    element.tabIndex = -1;
    return () => {
      mounted.destroy();
      if (figure.current === mounted) {
        figure.current = null;
        lastOptions.current = null;
      }
    };
    // The keyed owner mounts from its initial pose; option changes go through update below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant]);

  useIsoLayoutEffect(() => {
    const previous = lastOptions.current;
    if (
      !previous ||
      (previous.intensity === intensity &&
        previous.play === play &&
        previous.label === label)
    )
      return;
    const next: HairlineOptions = { intensity, play, label };
    figure.current?.update(next);
    lastOptions.current = next;
  }, [intensity, play, label]);

  return (
    <div
      ref={host}
      className="dm-hairline__figure"
      style={{ aspectRatio: "5 / 4" }}
      aria-hidden="true"
      role="presentation"
      tabIndex={-1}
      inert={still}
      data-reveal={reveal && !still}
    />
  );
}

/** Real Hairline figures, dressed in notebook ink, with a complete still-motion mode. */
export function HairlineSketch({
  variant = "riffle",
  label,
  play = false,
  intensity = 0.35,
  quiet = false,
  replayOnClick = false,
  replayKey = 0,
  onRead,
  className = "",
  style,
  ...attrs
}: HairlineSketchProps) {
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    motionSnapshot,
    () => true,
  );
  const still = quiet || reducedMotion;
  const [localReplay, setLocalReplay] = useState(0);
  const response = Number.isFinite(intensity)
    ? Math.min(1, Math.max(0, intensity))
    : 0.35;
  const description = label ?? descriptions[variant];

  const drawing = (
    <div
      {...attrs}
      className={`dm-hairline ${className}`.trim()}
      style={style}
      role="img"
      aria-label={description}
      aria-hidden={replayOnClick ? true : undefined}
      data-variant={variant}
      data-quiet={still}
      data-active={!still}
      data-autoplay={play && !still}
      data-replay={localReplay}
    >
      <FigureLayer
        // Recreating a quiet figure also resets any spring or tour already in progress.
        // Its intensity joins the key so updates cannot start a quiet loupe's spring.
        key={`${variant}-${replayKey}-${localReplay}-${still ? `still-${response}` : "live"}`}
        variant={variant}
        intensity={response}
        play={play && !still}
        still={still}
        label={description}
        reveal={localReplay > 0 || replayKey !== 0}
        onRead={onRead}
      />
    </div>
  );
  return (
    <SketchReplay
      enabled={replayOnClick}
      quiet={still}
      label={description}
      onReplay={() => setLocalReplay((value) => value + 1)}
    >
      {drawing}
    </SketchReplay>
  );
}
