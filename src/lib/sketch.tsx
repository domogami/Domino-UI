import {
  useId,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import type { DrawingProps } from "./brand";
import "./sketch.css";
import { SketchReplay } from "./sketch-replay";

export type NotebookSketchVariant =
  | "notebook"
  | "flight"
  | "garden"
  | "camera"
  | "keyboard"
  | "compass";

export interface NotebookSketchProps extends DrawingProps {
  variant?: NotebookSketchVariant;
  /** Omit beside an equivalent caption to keep the drawing decorative. */
  label?: string;
  className?: string;
  style?: CSSProperties;
  /** A small response to a pointer or touch; quiet also turns this off. */
  interactive?: boolean;
  /** Wrap in a native button that redraws on click, tap, Enter, or Space. */
  replayOnClick?: boolean;
}

type InkProps = {
  d: string;
  step?: number;
  tone?: "accent" | "muted" | "hatch";
};

function Ink({ d, step = 0, tone }: InkProps) {
  return (
    <path
      className={`dm-notebook-sketch-line${tone ? ` dm-notebook-sketch-${tone}` : ""}`}
      d={d}
      pathLength="1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      vectorEffect="non-scaling-stroke"
      style={{ "--dm-sketch-step": step } as CSSProperties}
    />
  );
}

function Paper({ d, step = 0 }: InkProps) {
  return (
    <>
      <path className="dm-notebook-sketch-paper" d={d} stroke="none" />
      <Ink d={d} step={step} />
    </>
  );
}

function Wash({ d, step = 0 }: InkProps) {
  return (
    <path
      className="dm-notebook-sketch-wash"
      d={d}
      stroke="none"
      style={{ "--dm-sketch-step": step } as CSSProperties}
    />
  );
}

function Caption({
  children,
  x,
  y,
  rotate = 0,
  step = 8,
}: {
  children: ReactNode;
  x: number;
  y: number;
  rotate?: number;
  step?: number;
}) {
  return (
    <text
      className="dm-notebook-sketch-caption"
      x={x}
      y={y}
      transform={`rotate(${rotate} ${x} ${y})`}
      style={{ "--dm-sketch-step": step } as CSSProperties}
    >
      {children}
    </text>
  );
}

function Notebook() {
  return (
    <>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--back">
        <Ink d="M27 188Q63 185 87 189M218 192Q257 187 295 191" tone="muted" />
        <Ink
          d="M47 183l-4 5m11-5-4 5m11-5-4 5m11-5-4 5m11-4-4 5"
          tone="hatch"
        />
      </g>
      <g className="dm-notebook-sketch-layer">
        <Paper d="M44 64 36 175Q96 166 157 189Q221 171 281 179L273 63Q213 52 158 77Q99 52 44 64Z" />
        <Ink d="M39 172Q99 161 157 184Q218 168 279 175M157 184v5" step={1} />
        <Paper d="M45 57Q102 49 158 75L157 182Q99 158 38 170Z" step={1} />
        <Paper
          d="M158 75Q213 50 270 58L279 171Q214 161 157 182Q153 129 158 75Z"
          step={1}
        />
        <Ink
          d="M160 80Q156 129 160 175M43 164Q96 154 148 173"
          step={2}
          tone="muted"
        />
        <Ink d="M163 175Q212 158 274 166" step={2} tone="hatch" />
        <Caption x={67} y={82} rotate={5} step={2}>
          today
        </Caption>
        <Ink d="M66 86Q85 84 109 90" step={3} tone="accent" />
        <Ink d="M61 100q4-1 9 1l-1 10-10-1Z" step={3} />
        <Ink d="m61 104 4 4 8-10" step={4} tone="accent" />
        <Ink
          d="M82 107q3-5 5-1t4-1q2 6 5 1t5 2q2-3 5 0t4-1q3 1 4 3l9 1"
          step={4}
        />
        <Ink d="M59 121q5-1 10 1l-1 10-10-1Z" step={4} />
        <Ink d="M80 128q2-5 4-1t3-1q3-5 5 1t5 0q4-3 5 2t5-1q3 1 6 2" step={5} />
        <Ink d="M57 143q4-1 10 1l-1 10-10-1Z" step={5} />
        <Ink d="M77 150q4-6 5-1t4-1q2 5 4 0t4 2q3 2 6 0t5 2l12 2" step={6} />
        <Caption x={183} y={88} rotate={-6} step={3}>
          small ideas
        </Caption>
        <Ink d="M184 96Q208 91 246 93" step={4} tone="hatch" />
        <Ink
          d="M188 114q5-8 10-7t8 8q3 5-3 11l-1 5-9 1-1-6q-7-5-4-12Z"
          step={4}
        />
        <Ink
          d="m193 136 9-1m-7 5 5-1M196 118l1 12m-1-12-4-4m5 4 4-5"
          step={5}
        />
        <Ink d="m183 103-4-4m31 8 5-2m-16-7 1-6" step={5} tone="accent" />
        <Ink
          d="M221 115q3-6 5-1t5-1q2 5 4 0t4 2l13-1M220 125q3-5 4-1t4-1q2 4 5 0t5 1l12-1M219 137q3-5 5-1t5-1q3 3 5 0l12-1"
          step={6}
        />
        <Ink d="M183 151Q216 143 254 147" step={7} tone="muted" />
        <Ink
          d="M251 59q-3-16 4-16 6 0 7 12l3 22q1 9-4 9-4 1-5-7l-3-23q0-5 3-5 2-1 3 5l2 21"
          step={6}
        />
        <Wash d="M137 175 147 179 145 198 140 194 135 197Z" step={7} />
        <Ink d="m137 175 10 4-2 19-5-4-5 3Z" step={7} tone="accent" />
      </g>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--front">
        <Paper d="m260 180 7-18 19-54q2-3 5-1l4 2q2 1 1 4l-19 53Z" step={7} />
        <Ink d="m267 162 10 4m-8-5 19-52m-28 71 2-7m20-55 10 4" step={8} />
        <Ink d="m286 105 2-6q1-4 4-3l3 1q3 1 2 5l-2 6" step={8} tone="accent" />
        <Caption x={84} y={218} rotate={-3}>
          a little room to think.
        </Caption>
        <Ink d="M80 204q-9-5-15-5m3-5-4 5 5 4" step={8} tone="accent" />
      </g>
    </>
  );
}

function Flight() {
  return (
    <>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--back">
        <Ink
          d="M34 164C57 177 91 178 108 157C123 138 97 118 81 137C65 156 102 178 129 158C150 143 159 122 182 117"
          step={0}
          tone="muted"
        />
        <Ink d="m32 161 5 2m-13-5 3 2M187 113l4-2" step={1} tone="muted" />
        <Ink
          d="M56 65q6-4 11 0 1-12 11-12 9-1 12 8 7-4 12 2"
          step={2}
          tone="muted"
        />
        <Ink d="M44 69q25-2 57-1" step={2} tone="hatch" />
        <Ink
          d="m275 152 1-7m-5 4 8-1m-20 27 1-3m-2 2 4-1"
          step={5}
          tone="accent"
        />
      </g>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--front">
        <Paper d="M137 91Q199 67 267 47L217 143Q208 125 201 107Z" step={2} />
        <Wash d="m201 107 66-60-45 51-5 45Z" step={3} />
        <Ink d="m137 91 64 16 66-60M201 107l16 36 5-45 45-51" step={3} />
        <Ink d="M146 90Q197 72 246 55M221 132l4-32" step={4} tone="hatch" />
        <Ink d="m218 108 4-2m-3 9 3-2m-2 9 2-2" step={4} tone="hatch" />
        <Ink d="m222 98-21 9" step={4} tone="accent" />
        <Ink d="m274 55 6-5m-8-8 6-1m-12-7 2-6" step={5} tone="accent" />
      </g>
      <g className="dm-notebook-sketch-layer">
        <Caption x={51} y={205} rotate={-4} step={6}>
          follow a little curiosity.
        </Caption>
        <Ink d="M151 209q33 1 70-5" step={7} tone="accent" />
        <Ink d="M233 183q12-7 12-21m-5 4 5-5 4 5" step={7} tone="accent" />
      </g>
    </>
  );
}

function Garden() {
  return (
    <>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--back">
        <Ink d="M52 192q40-4 69 1m98-1q27-5 50-2" tone="muted" />
        <Ink d="m87 190 6 3m0-5 8 5m-1-5 9 5m-2-5 9 5m-1-5 9 5" tone="hatch" />
        <Ink
          d="m237 68 2-9m-7 5 10-1m-14 21 3-4m-22-37 1-6m-3 3 6-1"
          step={6}
          tone="accent"
        />
      </g>
      <g className="dm-notebook-sketch-layer">
        <Paper d="m69 171 123-25 56 15-56 27Z" />
        <Ink
          d="m70 175 121 18 57-27m-57 22v5m-112-14 26 4m125-12 10-5"
          step={1}
          tone="muted"
        />
        <Paper d="m74 158 54-25 114 15-52 29Z" step={1} />
        <Ink d="m75 162 115 20 52-30m-52 25v5" step={2} />
        <Paper d="m83 143 42-24 110 16-42 27Z" step={2} />
        <Ink
          d="m84 147 109 20 42-28m-42 23v5M106 139l17-8m-11 14 19-10m-4 12 17-8m5 12 20-10m-6 12 21-9m-6 11 22-11"
          step={3}
          tone="hatch"
        />
        <Wash d="m102 173 15 2-5 19-6-5-8 3Z" step={4} />
        <Ink d="m102 173 15 2-5 19-6-5-8 3Z" step={4} tone="accent" />
      </g>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--front">
        <Ink d="M161 140C164 119 155 103 164 79Q173 59 169 47" step={3} />
        <Wash d="M158 108Q126 114 111 81Q142 76 158 108Z" step={4} />
        <Ink
          d="M158 108Q126 114 111 81Q142 76 158 108ZM115 85q22 9 43 23"
          step={4}
        />
        <Wash d="M163 88Q166 62 195 51Q201 75 163 88Z" step={5} />
        <Ink
          d="M163 88Q166 62 195 51Q201 75 163 88ZM163 88q16-13 28-30"
          step={5}
        />
        <Ink
          d="m179 72 0-7m1 7 7 0m-48 28-1-8m3 9-10-1"
          step={6}
          tone="hatch"
        />
        <Wash d="M169 66Q145 65 143 38Q167 40 169 66Z" step={5} />
        <Ink
          d="M169 66Q145 65 143 38Q167 40 169 66ZM169 66q-12-13-21-23"
          step={5}
        />
        <Ink d="M154 140q7 4 14-1m-30-16-4-4m44 12 7-3" step={6} tone="muted" />
        <Caption x={54} y={218} rotate={-3} step={7}>
          good things take tending.
        </Caption>
        <Ink d="M236 203q10-4 13-15m-7 3 7-5 3 8" step={8} tone="accent" />
      </g>
    </>
  );
}

function Camera() {
  return (
    <>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--back">
        <Ink d="M32 181q35-4 65 1m126 0q36-5 62-1" tone="muted" />
        <Ink d="m103 180 8 4m0-5 8 5m0-5 8 5m0-5 8 5m0-5 8 5" tone="hatch" />
        <Paper d="m43 61 74-13 16 101-75 13Z" />
        <Ink d="m51 68 59-10 10 67-59 10Z" step={1} />
        <Ink d="m59 117 17-23 17 12 9-17 15 25m-52 17 8-1" step={2} />
        <Ink
          d="M87 77q6-3 8 2t-4 7q-5 0-6-4t2-5M70 146l36-6"
          step={2}
          tone="hatch"
        />
        <Paper d="m211 48 66 13-20 98-67-14Z" step={1} />
        <Ink d="m216 57 51 10-13 62-51-11Z" step={2} />
        <Ink
          d="m207 100q19-10 24-1t28-3M226 77q4-5 8-2 1-8 6-7 7 0 7 7l8 2"
          step={2}
          tone="muted"
        />
        <Wash d="m232 43 24 5-3 12-24-5 3-4-2-4Z" step={3} />
        <Ink d="m232 43 24 5-3 12-24-5 3-4-2-4Z" step={3} tone="hatch" />
      </g>
      <g className="dm-notebook-sketch-layer">
        <Ink
          d="M88 114Q63 102 64 125q-2 15 24 27M236 111q25-12 21 8t-19 30"
          step={3}
        />
        <Paper
          d="M89 99q0-9 10-9l31 1 9-14 40 1 8 14 42 1q9 0 9 10l-1 58q0 11-11 11l-127-3q-11 0-11-11Z"
          step={3}
        />
        <Ink
          d="m90 110 148 3M91 156q1 7 8 7l127 3q5 0 6-5m-94-78 39 1"
          step={4}
          tone="muted"
        />
        <Ink
          d="M191 132c-1 20-15 35-35 35s-35-16-34-36 17-34 36-33 34 15 33 34Z"
          step={4}
        />
        <Ink
          d="M184 132c0 16-12 28-28 28s-28-13-27-29 13-27 29-26 27 12 26 27Z"
          step={5}
        />
        <Wash d="M145 115q13-7 24 0l-17 31q-12-4-14-14Z" step={5} />
        <Ink
          d="M174 132q0 16-17 17-16 0-17-17 0-16 17-16 16 0 17 16ZM146 128q2-8 10-8"
          step={5}
        />
        <Ink
          d="m128 117 4-4m-7 13 4-4m-6 13 4-4m1 15 3-4m3 13 2-4"
          step={6}
          tone="hatch"
        />
        <Ink d="m100 100 17 1-1 7-16-1Zm102 6 24 1-1 13-23-1Z" step={5} />
        <Ink
          d="m207 110 14 1-1 5-13-1M216 137q4-1 4 3t-4 3q-4-1-3-4t3-2"
          step={6}
        />
        <Ink
          d="m110 86 0-4q0-3 4-3l10 1q3 0 2 5l-1 2m-22 58 9 0m-9 5 9 0"
          step={6}
          tone="muted"
        />
        <Ink
          d="m137 170 0 5m5-5 0 6m5-6 0 6m5-6 0 6m5-5 0 5m5-5 0 5m5-5 0 5m5-5 0 5m5-5 0 4"
          step={7}
          tone="hatch"
        />
      </g>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--front">
        <Caption x={71} y={217} rotate={-3}>
          keep the little things.
        </Caption>
        <Ink d="M243 199q14-8 15-24m-6 5 6-6 3 8" step={8} tone="accent" />
        <Ink
          d="m40 88-6-3m7-5-3-6m242 61 5 2m-7 3 2 5"
          step={7}
          tone="accent"
        />
      </g>
    </>
  );
}

function Keyboard() {
  return (
    <>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--back">
        <Ink d="M32 184q33-3 61 1m123 6q40-2 68-7" tone="muted" />
        <Ink d="m64 177 11 5m0-5 12 5m0-5 12 5m0-4 10 4" tone="hatch" />
        <Ink
          d="M199 88q4-17-8-23l-12-6c-9-5-12-12-6-16s15 3 11 9-18 0-22-5 2-13 8-10 1 10-6 8-11-7-7-11q6-6 1-10"
          step={1}
        />
        <Ink
          d="M201 88q5-19-9-26l-12-6M155 24l6-1m-6-4 5-1"
          step={2}
          tone="hatch"
        />
        <Caption x={52} y={51} rotate={-7} step={6}>
          a good click.
        </Caption>
        <Ink d="M126 52q11 5 18 13m-1-6 2 7-7-2" step={7} tone="accent" />
      </g>
      <g className="dm-notebook-sketch-layer">
        <g transform="matrix(1 .12 -.35 .82 76 75)">
          <Paper
            d="M-8-7Q103-10 210-6q5 0 5 6l-1 99q-1 7-8 7l-211-1q-7 0-7-7l-1-98q0-6 5-7Z"
            step={2}
          />
          <Ink
            d="M-11 91q0 6 6 6l211 1q7 0 8-6M-5 101l33 0m157 1 19 0"
            step={3}
          />
          <Ink
            d="m-9 98 5 5m0-5 5 5m0-5 5 5m0-5 5 5m0-5 5 5m0-5 5 5"
            step={3}
            tone="hatch"
          />
          <Wash
            d="m0 1 16 0 0 14-16 0Zm164 22 35 0 0 15-35 0Zm-1 63 32 0 0 15-32 0Z"
            step={4}
          />
          <Ink
            d="m0 1 16 0 0 14-16 0Zm21 0 16 0 0 14-16 0Zm21 0 16 0 0 14-16 0Zm21 0 16 0 0 14-16 0Zm21 0 16 0 0 14-16 0Z"
            step={3}
          />
          <Ink
            d="m105 1 16 0 0 14-16 0Zm21 0 16 0 0 14-16 0Zm21 0 16 0 0 14-16 0Zm21 0 16 0 0 14-16 0Z"
            step={4}
          />
          <Ink
            d="m0 23 25 0 0 15-25 0Zm30 0 17 0 0 15-17 0Zm22 0 17 0 0 15-17 0Zm22 0 17 0 0 15-17 0Z"
            step={4}
          />
          <Ink
            d="m96 23 17 0 0 15-17 0Zm22 0 17 0 0 15-17 0Zm22 0 17 0 0 15-17 0Zm24 0 35 0 0 15-35 0Z"
            step={4}
          />
          <Ink
            d="m0 45 30 0 0 15-30 0Zm35 0 17 0 0 15-17 0Zm22 0 17 0 0 15-17 0Zm22 0 17 0 0 15-17 0Z"
            step={5}
          />
          <Ink
            d="m101 45 17 0 0 15-17 0Zm22 0 17 0 0 15-17 0Zm22 0 17 0 0 15-17 0Zm22 0 32 0 0 15-32 0Z"
            step={5}
          />
          <Ink
            d="m0 67 41 0 0 14-41 0Zm46 0 17 0 0 14-17 0Zm22 0 17 0 0 14-17 0Zm22 0 17 0 0 14-17 0Zm22 0 17 0 0 14-17 0Zm22 0 17 0 0 14-17 0Zm22 0 21 0 0 14-21 0Zm26 0 17 0 0 14-17 0Z"
            step={5}
          />
          <Ink
            d="m0 86 23 0 0 15-23 0Zm28 0 22 0 0 15-22 0Zm27 0 94 0 0 15-94 0Zm99 0 18 0 0 15-18 0Zm23 0 22 0 0 15-22 0Z"
            step={6}
          />
          <Ink
            d="m5 9 6 0m-5-3 4 0m39 2 4-1m17 1 4 0m40 0 4 0m18-1 4 0m19 0 4 0m-140 23 10 0m18 0 4 0m62 0 4 0m41 0 4 0m23 0 9 0"
            step={6}
            tone="hatch"
          />
          <Ink
            d="m11 53 13 0m40 0 4 0m40 0 4 0m18 0 4 0m48 0 7 0m-172 21 15 0m42 0 4 0m62 0 4 0m21 0 4 0m22 0 4 0m-144 20 8 0m25 0 8 0m30 0 51 0m52 0 7 0"
            step={7}
            tone="hatch"
          />
          <Ink
            d="m59 98 87 0m-142 1 15 0m138 0 12 0m11 0 15 0"
            step={7}
            tone="muted"
          />
          <Ink d="M207 8q0 8-8 8t-8-8q0-8 8-8t8 8ZM199 3l0 5" step={6} />
          <Ink
            d="m204 0 2-2m-15 1-2-2m19 12 3 1m-4 6 2 2"
            step={7}
            tone="hatch"
          />
        </g>
      </g>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--front">
        <Ink d="m253 163 5 0m-4 5 4 0m-6 5 4 0" step={7} tone="accent" />
        <Caption x={68} y={220} rotate={-3}>
          one thought at a time.
        </Caption>
        <Ink d="m42 112-7-4m10-2-4-8m-8 20-8-1" step={8} tone="accent" />
      </g>
    </>
  );
}

function Compass() {
  return (
    <>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--back">
        <Ink d="M32 184q39-4 67 0m117 4q34-4 64-1" tone="muted" />
        <Ink
          d="m85 181 9 5m-1-6 11 6m-1-6 10 6m0-6 10 6m0-6 9 6"
          tone="hatch"
        />
        <Paper d="m37 91 68-31 56 18 61-24 49 29-4 85-49-18-63 31-54-15-60 27Z" />
        <Wash d="m105 60 56 18-6 103-54-15Z" step={1} />
        <Ink d="m105 60-4 106m60-88-6 103m67-127-4 96" step={1} tone="hatch" />
        <Ink
          d="M44 119q18-19 34-15t32-12q19-14 38-2m-94 75q20-30 33-21t25-6M186 79q16 8 25-3t34 8m-57 60q14-13 27-5t39-12"
          step={2}
          tone="hatch"
        />
        <Ink
          d="m52 98 11-13 10 5 12-14 14 12m127 17 10-15 11 9 7-9 9 14"
          step={2}
          tone="muted"
        />
        <Ink
          d="m72 91 4-5 3 2m161 7 3-4 3 3m-28 37 3-3 3 3"
          step={2}
          tone="hatch"
        />
        <Ink
          d="m57 137 4-2m6-3 4-3m5-4 3-4m4-4 4-2m6-2 5 0m6 2 4 2m6 3 4 1m7 0 5-2m6-3 4-3m6-5 4-2m7-2 5 1m7 2 4 2m6 4 4 2m6 2 4 0m7-2 4-3m5-5 2-4"
          step={3}
          tone="accent"
        />
        <Ink
          d="m246 105 8 9m1-10-10 10M55 139q-3-4-6-1t2 6q4 1 4-5Z"
          step={4}
          tone="accent"
        />
      </g>
      <g className="dm-notebook-sketch-layer">
        <Ink
          d="M179 72q-5-4-4-9 1-6 7-6 7 1 6 7 0 6-5 8m-2-4q-3-2-2-5 1-3 4-2t1 5"
          step={3}
        />
        <Paper
          d="M168 77q-19-11-31 1l-19 23q-6 8 2 16l27 24q8 7 15 0l26-27q9-9 0-18Z"
          step={3}
        />
        <Ink
          d="m124 105 22-24q6-7 14-2l24 22q5 5 0 11l-25 25q-4 4-9 0l-26-24q-5-4 0-8Z"
          step={4}
        />
        <Ink d="m130 107 20-20 26 23-20 21Z" step={4} tone="hatch" />
        <Ink
          d="m154 100 4 12-11 5m-3-14 15 16m-5-6 10-1"
          step={5}
          tone="muted"
        />
        <Paper
          d="M132 126q15-18 37-16 24 1 35 22 12 23-4 42-15 20-39 16-26-2-34-26-7-21 5-38Z"
          step={4}
        />
        <Ink
          d="M135 132q14-20 36-16 23 3 29 24 7 21-10 36-17 15-37 7-22-7-23-28-1-13 5-23Z"
          step={5}
        />
        <Ink
          d="M140 137q12-17 30-13 18 2 24 20 4 18-10 29-13 12-31 6-17-6-18-24-1-10 5-18Z"
          step={5}
          tone="hatch"
        />
        <Wash d="m173 131-4 23-21 17 9-25Z" step={6} />
        <Ink
          d="m173 131-4 23-21 17 9-25Zm-16 15 12 8m-5-7q4-1 4 3t-4 3q-3-1-3-3t3-3Z"
          step={6}
        />
        <Ink
          d="m173 122 0 5m18 9-4 2m7 15-5-1m-9 20-2-4m-22 7 1-5m-20-10 5-2m1-22 4 3"
          step={6}
        />
        <Ink
          d="m170 118 1-4m28 26 4-1m-17 43 2 3m-40-2-2 4m-18-44-4-1"
          step={7}
          tone="hatch"
        />
        <Ink
          d="m132 166-3 5m7 1-3 6m8-1-3 5m8-1-2 5m8-2-1 5m8-3 0 5m8-6 1 5m7-7 2 4m6-8 3 3m4-9 3 2"
          step={7}
          tone="hatch"
        />
      </g>
      <g className="dm-notebook-sketch-layer dm-notebook-sketch-layer--front">
        <Caption x={49} y={220} rotate={-3}>
          leave room for a detour.
        </Caption>
        <Ink
          d="M247 183q12-4 13-15m-5 3 6-5 2 7m-1-114 4-5m1 10 6-2"
          step={8}
          tone="accent"
        />
      </g>
    </>
  );
}

const sketches: Record<NotebookSketchVariant, () => ReactNode> = {
  notebook: Notebook,
  flight: Flight,
  garden: Garden,
  camera: Camera,
  keyboard: Keyboard,
  compass: Compass,
};

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function prefersReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches;
}

// The server renders the finished artwork; hydration enables requested motion.
function reducedMotionOnServer() {
  return true;
}

/** Original, responsive pen drawings; all strokes finish once and rest. */
export function NotebookSketch({
  variant = "notebook",
  animate = true,
  quiet = false,
  speed = 1,
  replayKey = 0,
  label,
  interactive = true,
  replayOnClick = false,
  className = "",
  style,
}: NotebookSketchProps) {
  const title = `${useId().replaceAll(":", "")}-notebook-sketch-title`;
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    prefersReducedMotion,
    reducedMotionOnServer,
  );
  const effectiveQuiet = quiet || reducedMotion;
  const [localReplay, setLocalReplay] = useState(0);
  const Scene = sketches[variant];
  const respondsToPointer = interactive && !effectiveQuiet;

  function resetPointer(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.style.removeProperty("--dm-sketch-x");
    event.currentTarget.style.removeProperty("--dm-sketch-y");
  }

  function movePointer(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = Math.max(
      -1,
      Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1),
    );
    const y = Math.max(
      -1,
      Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1),
    );
    event.currentTarget.style.setProperty(
      "--dm-sketch-x",
      `${(x * 4).toFixed(2)}px`,
    );
    event.currentTarget.style.setProperty(
      "--dm-sketch-y",
      `${(y * 4).toFixed(2)}px`,
    );
  }

  const drawing = (
    <svg
      key={`${variant}-${replayKey}-${localReplay}-${speed}-${animate}-${effectiveQuiet}`}
      className={`dm-notebook-sketch ${className}`.trim()}
      viewBox="0 0 320 240"
      fill="none"
      stroke="currentColor"
      role={label ? "img" : undefined}
      aria-labelledby={label ? title : undefined}
      aria-hidden={replayOnClick || !label ? true : undefined}
      focusable="false"
      data-variant={variant}
      data-replay={localReplay}
      data-animate={animate && !effectiveQuiet ? "true" : "false"}
      data-interactive={respondsToPointer ? "true" : "false"}
      data-quiet={effectiveQuiet ? "true" : "false"}
      style={{ "--dm-drawing-rate": 1 / speed, ...style } as CSSProperties}
      onPointerDown={respondsToPointer ? movePointer : undefined}
      onPointerMove={respondsToPointer ? movePointer : undefined}
      onPointerLeave={respondsToPointer ? resetPointer : undefined}
      onPointerCancel={respondsToPointer ? resetPointer : undefined}
      onPointerUp={respondsToPointer ? resetPointer : undefined}
    >
      {label && <title id={title}>{label}</title>}
      <Scene />
    </svg>
  );
  return (
    <SketchReplay
      enabled={replayOnClick}
      quiet={effectiveQuiet || !animate}
      label={label || `${variant} sketch`}
      onReplay={() => setLocalReplay((value) => value + 1)}
    >
      {drawing}
    </SketchReplay>
  );
}
