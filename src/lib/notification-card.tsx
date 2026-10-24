import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import "./notification-card.css";

export interface NotificationCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "title" | "children"
> {
  source: string;
  title: ReactNode;
  children: ReactNode;
  time?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  /** Total notifications in the queue. The content represents the current item. */
  count?: number;
  surface?: "paper" | "ink";
}

/** A notification surface. The host owns its queue, timing and live announcements. */
export const NotificationCard = forwardRef<HTMLElement, NotificationCardProps>(
  function NotificationCard(
    {
      source,
      title,
      children,
      time,
      icon,
      actions,
      count = 1,
      surface = "paper",
      className = "",
      ...props
    },
    ref,
  ) {
    const titleId = `${useId()}-title`;
    const queueCount = Number.isFinite(count)
      ? Math.max(1, Math.floor(count))
      : 1;
    const stacked = queueCount > 1;

    return (
      <article
        {...props}
        ref={ref}
        aria-labelledby={
          props["aria-labelledby"] ??
          (!props["aria-label"] ? titleId : undefined)
        }
        className={[
          "dm-notification-card",
          `dm-notification-card--${surface}`,
          stacked && "dm-notification-card--stacked",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {stacked && (
          <span className="dm-notification-card__papers" aria-hidden="true">
            <span />
            <span />
          </span>
        )}
        <div className="dm-notification-card__sheet">
          <header className="dm-notification-card__header">
            <div className="dm-notification-card__metadata">
              <span className="dm-notification-card__source">
                <span className="dm-notification-card__icon" aria-hidden="true">
                  {icon ?? (
                    <svg viewBox="0 0 20 20" fill="none" focusable="false">
                      <path
                        d="M4 2.8 15.6 3l.5 13.8-12.3.4L4 2.8Z M6.7 7.2l6.7.1M6.6 10.3l5.8-.1M6.5 13.3l4 .1"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span>{source}</span>
              </span>
              {time != null && (
                <span className="dm-notification-card__time">{time}</span>
              )}
            </div>
            <h3 className="dm-notification-card__title" id={titleId}>
              {title}
            </h3>
            {stacked && (
              <span className="dm-notification-card__count">
                <span
                  className="dm-notification-card__count-dot"
                  aria-hidden="true"
                />
                {queueCount} in queue
              </span>
            )}
          </header>
          <div className="dm-notification-card__body">{children}</div>
          {actions != null && (
            <footer className="dm-notification-card__actions">{actions}</footer>
          )}
        </div>
      </article>
    );
  },
);
