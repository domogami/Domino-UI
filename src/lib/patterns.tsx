import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Chevron } from "./chevron";
import "./patterns.css";

const cx = (...values: (string | false | null | undefined)[]) =>
  values.filter(Boolean).join(" ");

export type AnnotationArrow = "up" | "down" | "left" | "right" | "none";

export interface AnnotationProps {
  title: ReactNode;
  children?: ReactNode;
  arrow?: AnnotationArrow;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

// Inline curved arrows from the garden's notebook/annotations.scss. Meaning lives in the text.
const annotationArrows: Record<
  Exclude<AnnotationArrow, "none">,
  { viewBox: string; path: string }
> = {
  down: {
    viewBox: "0 0 64 44",
    path: "M2 6 C31 0 48 12 45 39 M37 31 L45 39 L53 30",
  },
  up: {
    viewBox: "0 0 64 44",
    path: "M2 38 C31 44 48 32 45 5 M37 13 L45 5 L53 14",
  },
  right: {
    viewBox: "0 0 64 30",
    path: "M2 19 Q26 7 60 15 M51 7 L60 15 L50 22",
  },
  left: { viewBox: "0 0 64 30", path: "M62 19 Q38 7 4 15 M13 7 L4 15 L14 22" },
};

function AnnotationArrowDrawing({
  direction,
}: {
  direction: Exclude<AnnotationArrow, "none">;
}) {
  const geometry = annotationArrows[direction];
  return (
    <svg
      className={`dm-annotation__arrow dm-annotation__arrow--${direction}`}
      viewBox={geometry.viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={geometry.path} />
    </svg>
  );
}

/** A handwritten aside with an inline decorative arrow and optional native disclosure. */
export function Annotation({
  title,
  children,
  arrow = "right",
  collapsible = false,
  defaultOpen = true,
  className,
}: AnnotationProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const label = (
    <>
      {arrow === "left" && <AnnotationArrowDrawing direction="left" />}
      <span>{title}</span>
      {arrow !== "left" && arrow !== "none" && (
        <AnnotationArrowDrawing direction={arrow} />
      )}
    </>
  );
  const body = children != null && (
    <div className="dm-annotation__body">{children}</div>
  );
  const classes = cx("dm-annotation", className);

  if (collapsible) {
    return (
      <details
        className={classes}
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary className="dm-annotation__title">
          <span className="dm-annotation__label">{label}</span>
          <Chevron
            className="dm-annotation__disclosure"
            direction={open ? "up" : "down"}
            size={18}
          />
        </summary>
        {body}
      </details>
    );
  }

  return (
    <aside className={classes} aria-labelledby={id}>
      <p className="dm-annotation__title" id={id}>
        {label}
      </p>
      {body}
    </aside>
  );
}

export interface TimelineItem {
  id: string;
  title: ReactNode;
  description: ReactNode;
  meta?: ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  label?: string;
  className?: string;
}

/** Ordered milestones. Supply dates or stages through meta; the component invents neither. */
export function Timeline({
  items,
  label = "Timeline",
  className,
}: TimelineProps) {
  return (
    <ol className={cx("dm-timeline", className)} aria-label={label}>
      {items.map((item) => (
        <li className="dm-timeline__item" key={item.id}>
          <span className="dm-timeline__node" aria-hidden="true" />
          {item.meta != null && (
            <div className="dm-timeline__meta">{item.meta}</div>
          )}
          <h3 className="dm-timeline__title">{item.title}</h3>
          <div className="dm-timeline__description">{item.description}</div>
        </li>
      ))}
    </ol>
  );
}

export interface PolaroidPhoto {
  src: string;
  alt: string;
  caption?: string;
}

export interface PolaroidStackProps {
  photos: PolaroidPhoto[];
  label?: string;
  className?: string;
}

function StackArrow({ previous = false }: { previous?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={
        previous
          ? "dm-polaroid-stack__arrow dm-polaroid-stack__arrow--previous"
          : "dm-polaroid-stack__arrow"
      }
    >
      <path d="M3 15Q21 5 43 12M34 4L43 12L33 20" />
    </svg>
  );
}

/** User-supplied photos, explicit controls, and one stable stack with no hover movement. */
export function PolaroidStack({
  photos,
  label = "Photo stack",
  className,
}: PolaroidStackProps) {
  const [position, setPosition] = useState(0);
  const count = photos.length;
  const index = count ? position % count : 0;
  const photo = photos[index];
  const captionId = useId();
  const cycle = (step: number) => {
    if (count > 1)
      setPosition((current) => ((current % count) + step + count) % count);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      count < 2 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      cycle(event.key === "ArrowLeft" ? -1 : 1);
    }
  };

  if (!photo)
    return (
      <div
        className={cx(
          "dm-polaroid-stack",
          "dm-polaroid-stack--empty",
          className,
        )}
        role="group"
        aria-label={label}
      >
        <p>No photos to display.</p>
      </div>
    );

  const image = (
    <>
      <img src={photo.src} alt={photo.alt} loading="lazy" />
      <span className="dm-polaroid-stack__caption" id={captionId}>
        {photo.caption ?? <span aria-hidden="true">&nbsp;</span>}
      </span>
    </>
  );

  return (
    <div
      className={cx("dm-polaroid-stack", className)}
      role="group"
      aria-roledescription="photo stack"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      <div className="dm-polaroid-stack__stage">
        {count > 1 && (
          <span className="dm-polaroid-stack__back" aria-hidden="true" />
        )}
        {count > 1 ? (
          <button
            type="button"
            className="dm-polaroid-stack__photo"
            aria-label={`Next photo. Showing photo ${index + 1} of ${count}: ${photo.alt}`}
            aria-describedby={photo.caption ? captionId : undefined}
            onClick={() => cycle(1)}
          >
            {image}
          </button>
        ) : (
          <figure className="dm-polaroid-stack__photo">{image}</figure>
        )}
      </div>
      <div className="dm-polaroid-stack__controls">
        <button
          type="button"
          className="dm-polaroid-stack__control"
          aria-label="Previous photo"
          onClick={() => cycle(-1)}
          disabled={count < 2}
        >
          <StackArrow previous />
        </button>
        <p
          className="dm-polaroid-stack__count"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="dm-pattern-sr-only">Photo </span>
          {index + 1}
          <span aria-hidden="true"> / </span>
          <span className="dm-pattern-sr-only"> of </span>
          {count}
        </p>
        <button
          type="button"
          className="dm-polaroid-stack__control"
          aria-label="Next photo"
          onClick={() => cycle(1)}
          disabled={count < 2}
        >
          <StackArrow />
        </button>
      </div>
    </div>
  );
}

export interface FlowerProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

/** Discrete progress. Exact stem, leaf, petal, heart, and ground geometry from garden-v5. */
export function FlowerProgress({
  value,
  max = 5,
  label = "Flower progress",
  className,
}: FlowerProgressProps) {
  const total =
    Number.isFinite(max) && max > 0 ? Math.max(1, Math.round(max)) : 5;
  const current = Number.isFinite(value)
    ? Math.max(0, Math.min(total, Math.round(value)))
    : 0;
  return (
    <div
      className={cx("dm-flower-progress", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`${current} of ${total} petals found`}
      data-complete={current === total || undefined}
    >
      <svg
        viewBox="0 0 120 144"
        fill="none"
        aria-hidden="true"
        focusable="false"
        className="dm-flower-progress__drawing"
      >
        <path
          className="dm-flower-progress__stem"
          d="M60 127Q65 107 60 80L60 62M61 111Q37 115 32 94Q53 94 61 111M62 98Q84 96 87 77Q67 80 62 98"
        />
        {Array.from({ length: total }, (_, index) => (
          <g
            key={index}
            className={cx(
              "dm-flower-progress__petal",
              index < current && "dm-flower-progress__petal--found",
            )}
            transform={`rotate(${(index * 360) / total} 60 48)`}
          >
            <path
              pathLength="1"
              d="M60 47C40 35 42 12 57 9C75 6 81 28 60 47Z"
            />
          </g>
        ))}
        <circle className="dm-flower-progress__heart" cx="60" cy="48" r="10" />
        <path
          className="dm-flower-progress__ground"
          d="M42 130Q60 133 78 129"
        />
      </svg>
      <div className="dm-flower-progress__text">
        <span className="dm-flower-progress__label">{label}</span>
        <span className="dm-flower-progress__count">
          {current} / {total}
        </span>
      </div>
    </div>
  );
}
