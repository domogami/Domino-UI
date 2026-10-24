import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  type MouseEvent,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import "./popover.css";

interface TriggerProps {
  onClick?: MouseEventHandler<HTMLElement>;
  ref?: Ref<HTMLElement>;
  disabled?: boolean;
  "aria-controls"?: string;
}

export interface PopoverProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "children"
> {
  /** One focusable element that forwards its ref to a DOM element. */
  trigger: ReactElement;
  title?: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Accessible name when no visible title is provided. */
  label?: string;
  closeLabel?: string;
  eyebrow?: ReactNode;
}

const focusableSelector =
  'a[href], button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';
const focusables = (root: ParentNode) =>
  Array.from(root.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) =>
      element.getClientRects().length > 0 &&
      !element.closest("[inert], [hidden]"),
  );
const activePopovers: HTMLDivElement[] = [];
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
const motionIsReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Read a trigger's ref without invoking React 18/19's deprecation warning getters. */
function elementRef(
  element: ReactElement<TriggerProps>,
): Ref<HTMLElement> | undefined {
  const propRef = Object.getOwnPropertyDescriptor(element.props, "ref")?.value;
  return propRef ?? Object.getOwnPropertyDescriptor(element, "ref")?.value;
}

/** An anchored, nonmodal paper dialog. Escape returns focus; Tab can leave freely. */
export function Popover({
  trigger,
  title,
  description,
  footer,
  children,
  side = "bottom",
  align = "start",
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  label = "More details",
  closeLabel = "Close popover",
  eyebrow = "a closer look",
  className = "",
  id,
  ...props
}: PopoverProps) {
  const generatedId = useId();
  const panelId = id ?? `${generatedId}-popover`;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = controlledOpen ?? uncontrolledOpen;
  const [present, setPresent] = useState(open);
  const [entered, setEntered] = useState(false);
  const [native, setNative] = useState<boolean | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const closeReason = useRef<"restore" | "leave" | undefined>(undefined);
  const openRef = useRef(open);
  const changeRef = useRef(onOpenChange);
  const controlledRef = useRef(controlledOpen !== undefined);
  const pendingChange = useRef<boolean | undefined>(undefined);
  openRef.current = open;
  changeRef.current = onOpenChange;
  controlledRef.current = controlledOpen !== undefined;

  const requestOpen = useCallback((next: boolean, restore = false) => {
    if (openRef.current === next || pendingChange.current === next) return;
    pendingChange.current = next;
    closeReason.current = next ? undefined : restore ? "restore" : "leave";
    // Prevent duplicate Escape / focusout / native-toggle notifications in one turn.
    if (!controlledRef.current) {
      openRef.current = next;
      setUncontrolledOpen(next);
    }
    changeRef.current?.(next);
  }, []);

  const sourceTrigger = trigger as ReactElement<TriggerProps>;
  const sourceRef = elementRef(sourceTrigger);
  const refCleanup = useRef<(() => void) | undefined>(undefined);
  const mergedTriggerRef = useCallback(
    (node: HTMLElement | null) => {
      triggerRef.current = node;
      if (!node && refCleanup.current) {
        refCleanup.current();
        refCleanup.current = undefined;
      } else if (typeof sourceRef === "function") {
        const cleanup = sourceRef(node);
        if (typeof cleanup === "function") refCleanup.current = cleanup;
      } else if (sourceRef) {
        sourceRef.current = node;
      }
    },
    [sourceRef],
  );

  useBrowserLayoutEffect(() => {
    pendingChange.current = undefined;
  }, [open]);

  useBrowserLayoutEffect(() => {
    setNative(typeof HTMLElement.prototype.showPopover === "function");
  }, []);

  const position = useCallback(() => {
    const panel = panelRef.current;
    const anchor = triggerRef.current;
    if (!panel || !anchor) return;
    const viewport = window.visualViewport;
    const minX = (viewport?.offsetLeft ?? 0) + 16;
    const minY = (viewport?.offsetTop ?? 0) + 16;
    const maxX =
      (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - 16;
    const maxY =
      (viewport?.offsetTop ?? 0) +
      (viewport?.height ?? window.innerHeight) -
      16;
    const rect = anchor.getBoundingClientRect();
    const gap = 12;
    panel.style.maxWidth = `${Math.max(0, maxX - minX)}px`;
    const width = panel.offsetWidth;
    const body = panel.querySelector<HTMLElement>(".dm-popover__body");
    // Read the body's full content height without relaxing the live max-height.
    // Expanding it during an internal scroll would reset scrollTop before the
    // next clamp, keeping controls below the fold permanently out of reach.
    const bodyOverflow = body
      ? Math.max(0, body.scrollHeight - body.clientHeight)
      : 0;
    const naturalHeight = Math.max(
      panel.scrollHeight,
      panel.offsetHeight + bodyOverflow,
    );
    const below = Math.max(0, maxY - rect.bottom - gap);
    const above = Math.max(0, rect.top - minY - gap);
    const preferred = side === "bottom" ? below : above;
    const alternate = side === "bottom" ? above : below;
    const actualSide =
      preferred < naturalHeight && alternate > preferred
        ? side === "bottom"
          ? "top"
          : "bottom"
        : side;
    const anchorSpace = actualSide === "bottom" ? below : above;
    // A short viewport (often the mobile keyboard) may require overlapping the anchor.
    const fullHeight = Math.max(0, maxY - minY);
    const available =
      anchorSpace < Math.min(240, fullHeight) ? fullHeight : anchorSpace;
    const height = Math.min(naturalHeight, available);
    const desiredLeft =
      align === "end"
        ? rect.right - width
        : align === "center"
          ? rect.left + (rect.width - width) / 2
          : rect.left;
    panel.style.left = `${Math.max(minX, Math.min(desiredLeft, maxX - width))}px`;
    panel.style.top = `${Math.max(minY, Math.min(actualSide === "bottom" ? rect.bottom + gap : rect.top - gap - height, maxY - height))}px`;
    panel.style.maxHeight = `${available}px`;
    panel.dataset.side = actualSide;
  }, [align, side]);

  useBrowserLayoutEffect(() => {
    if (native === null) return;
    const panel = panelRef.current;
    if (!panel) return;
    // Set the DOM property directly so React 18 also makes closing content inert.
    panel.inert = !open;
    clearTimeout(closeTimer.current);
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    if (open) {
      setPresent(true);
      if (native && !panel.matches(":popover-open")) panel.showPopover();
      position();
      frameRef.current = requestAnimationFrame(() => {
        if (!openRef.current) return;
        position();
        setEntered(true);
        const initial =
          panel.querySelector<HTMLElement>("[autofocus]") ??
          focusables(panel).find(
            (element) => !element.hasAttribute("data-popover-close"),
          ) ??
          panel;
        initial.focus({ preventScroll: true });
      });
    } else {
      setEntered(false);
      if (
        closeReason.current === "restore" ||
        (closeReason.current === undefined &&
          panel.contains(document.activeElement))
      ) {
        triggerRef.current?.focus({ preventScroll: true });
      }
      closeReason.current = undefined;
      const finish = () => {
        if (openRef.current) return;
        if (native && panel.matches(":popover-open")) panel.hidePopover();
        setPresent(false);
      };
      if (motionIsReduced()) finish();
      else {
        const duration =
          parseFloat(
            getComputedStyle(panel).getPropertyValue(
              "--dm-layer-exit-duration",
            ),
          ) || 160;
        closeTimer.current = setTimeout(finish, duration + 40);
      }
    }
    return () => {
      clearTimeout(closeTimer.current);
      if (frameRef.current !== undefined)
        cancelAnimationFrame(frameRef.current);
    };
  }, [open, native, position]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    activePopovers.push(panel);
    const isTopmost = () => activePopovers.at(-1) === panel;
    const outside = (event: PointerEvent) => {
      if (!isTopmost()) return;
      const target = event.target as Node;
      if (!panel.contains(target) && !triggerRef.current?.contains(target))
        requestOpen(false);
    };
    const focusOut = (event: FocusEvent) => {
      if (!isTopmost()) return;
      const target = event.target as Node;
      if (!panel.contains(target) && !triggerRef.current?.contains(target))
        requestOpen(false);
    };
    const nativeToggle = (event: Event) => {
      if (
        (event as ToggleEvent).newState === "closed" &&
        openRef.current &&
        !panel.matches(":popover-open")
      )
        requestOpen(false);
    };
    panel.addEventListener("toggle", nativeToggle);
    const reposition = () => position();
    const observer =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(reposition)
        : undefined;
    observer?.observe(panel);
    if (triggerRef.current) observer?.observe(triggerRef.current);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", focusOut);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    window.visualViewport?.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("scroll", reposition);
    return () => {
      observer?.disconnect();
      const stackIndex = activePopovers.indexOf(panel);
      if (stackIndex >= 0) activePopovers.splice(stackIndex, 1);
      panel.removeEventListener("toggle", nativeToggle);
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", focusOut);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      window.visualViewport?.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("scroll", reposition);
    };
  }, [open, position, requestOpen]);

  const panel = (
    <div
      {...props}
      ref={panelRef}
      id={panelId}
      popover={native === false ? undefined : "manual"}
      role="dialog"
      aria-labelledby={title ? `${panelId}-title` : props["aria-labelledby"]}
      aria-label={
        title || props["aria-labelledby"]
          ? undefined
          : (props["aria-label"] ?? label)
      }
      aria-describedby={
        [description && `${panelId}-description`, props["aria-describedby"]]
          .filter(Boolean)
          .join(" ") || undefined
      }
      aria-hidden={!open || undefined}
      tabIndex={-1}
      className={`dm-popover ${className}`.trim()}
      data-state={
        present ? (open ? (entered ? "open" : "opening") : "closing") : "closed"
      }
      data-native={native || undefined}
      onKeyDown={(event) => {
        props.onKeyDown?.(event);
        if (
          event.defaultPrevented ||
          activePopovers.at(-1) !== event.currentTarget
        )
          return;
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          requestOpen(false, true);
        } else if (event.key === "Tab") {
          const options = focusables(event.currentTarget);
          const index = options.indexOf(document.activeElement as HTMLElement);
          if (
            (event.shiftKey && index <= 0) ||
            (!event.shiftKey &&
              (index === options.length - 1 || options.length === 0))
          ) {
            event.preventDefault();
            const triggerNode = triggerRef.current;
            // Native modal dialogs make the surrounding document implicitly inert.
            // Leaving this nonmodal layer must stay in the dialog's tab cycle.
            const modal = triggerNode?.closest(
              'dialog[open], [aria-modal="true"]',
            );
            const outside = focusables(modal ?? document).filter(
              (element) => !event.currentTarget.contains(element),
            );
            const triggerIndex = triggerNode
              ? outside.indexOf(triggerNode)
              : -1;
            const destination = event.shiftKey
              ? triggerNode
              : (outside[triggerIndex + 1] ??
                (modal ? outside[0] : triggerNode));
            requestOpen(false);
            destination?.focus({ preventScroll: true });
          }
        }
      }}
    >
      <div className="dm-popover__header">
        <div className="dm-popover__heading">
          {eyebrow && <span className="dm-popover__eyebrow">{eyebrow}</span>}
          {title && <h2 id={`${panelId}-title`}>{title}</h2>}
          {description && <p id={`${panelId}-description`}>{description}</p>}
        </div>
        <button
          className="dm-popover__close"
          type="button"
          aria-label={closeLabel}
          data-popover-close
          onClick={() => requestOpen(false, true)}
        >
          <svg
            viewBox="0 0 20 20"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m5 5 10 10M15 5 5 15" />
          </svg>
        </button>
      </div>
      <div className="dm-popover__body">{children}</div>
      {footer && <div className="dm-popover__footer">{footer}</div>}
    </div>
  );

  return (
    <>
      {cloneElement(sourceTrigger, {
        ref: mergedTriggerRef,
        "aria-expanded": open,
        "aria-haspopup": "dialog",
        "aria-controls": [sourceTrigger.props["aria-controls"], panelId]
          .filter(Boolean)
          .join(" "),
        onClick: (event: MouseEvent<HTMLElement>) => {
          sourceTrigger.props.onClick?.(event);
          if (!event.defaultPrevented && !sourceTrigger.props.disabled)
            requestOpen(!openRef.current, openRef.current);
        },
      } as TriggerProps)}
      {native === false && typeof document !== "undefined"
        ? createPortal(
            panel,
            triggerRef.current?.closest("dialog[open]") ?? document.body,
          )
        : panel}
    </>
  );
}
