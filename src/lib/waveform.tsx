import type { CSSProperties, HTMLAttributes } from "react";
import "./waveform.css";

export interface WaveformProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children" | "role" | "aria-hidden" | "aria-label" | "aria-labelledby" | "tabIndex"> {
  /** Run the ink trace only after the owning player confirms playback. */
  playing?: boolean;
  /** Optional amplitudes from 0 to 1. This component never fetches or analyzes audio. */
  samples?: readonly number[];
  /** Decorative by default. Meaningful data also needs a clear label. */
  decorative?: boolean;
  label?: string;
  /** Keep the complete ink drawing still, even while playing. */
  quiet?: boolean;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
}

// Original, deterministic sketch amplitudes. These are an illustration, not a
// recording or fabricated measurement. Stable geometry supports SSR/hydration.
const sketch = [.03, .02, .18, .07, .56, .83, .28, .1, .33, .18, .04, .08, .4, .63, .88, .32, .09, .25, .07, .03, .14, .31, .11, .54, .78, .23, .1, .31, .08, .04, .18, .43, .72, .91, .37, .15, .3, .06, .03, .01] as const;

function amplitudes(samples?: readonly number[]) {
  if (!Array.isArray(samples) || !samples.length) return sketch;
  const count = Math.min(128, Math.max(2, samples.length));
  return Array.from({ length: count }, (_, index) => {
    const value = samples[Math.round(index * (samples.length - 1) / (count - 1))];
    return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  });
}

function inkPath(values: readonly number[]) {
  const points = values.map((value, index) => ({
    x: 4 + index * 312 / (values.length - 1),
    y: 32 + (index % 2 ? 1 : -1) * value * 25,
  }));
  const number = (value: number) => Number(value.toFixed(2));
  return points.reduce((path, point, index) => {
    if (!index) return `M${number(point.x)} ${number(point.y)}`;
    const previous = points[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `${path}C${number(middle)} ${number(previous.y)} ${number(middle)} ${number(point.y)} ${number(point.x)} ${number(point.y)}`;
  }, "");
}

export function Waveform({
  playing = false,
  samples,
  decorative = true,
  label,
  quiet = false,
  width,
  height,
  className,
  style,
  ...props
}: WaveformProps) {
  const name = typeof label === "string" ? label.replace(/[\u0000-\u001f\u007f]/g, " ").trim() : "";
  const hidden = decorative !== false || !name;
  const values = amplitudes(samples);
  const path = inkPath(values);
  return <span
    {...props}
    className={["dm-waveform", className].filter(Boolean).join(" ")}
    data-playing={playing === true ? "true" : "false"}
    data-quiet={quiet === true ? "true" : undefined}
    data-source={values === sketch ? "sketch" : "samples"}
    role={hidden ? undefined : "img"}
    aria-hidden={hidden ? "true" : undefined}
    aria-label={hidden ? undefined : name}
    aria-labelledby={undefined}
    tabIndex={undefined}
    style={{ ...(width !== undefined ? { width } : {}), ...(height !== undefined ? { height } : {}), ...style }}
  >
    <svg viewBox="0 0 320 64" fill="none" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="dm-waveform__baseline" d="M3 32C76 31 160 33 237 32L317 32"/>
      <path className="dm-waveform__ink" d={path}/>
      <path className="dm-waveform__trace" d={path} pathLength="320"/>
    </svg>
  </span>;
}
