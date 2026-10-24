import {
  cloneElement,
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type DialogHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefObject,
  type SelectHTMLAttributes,
  type TableHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Chevron } from "./chevron";
import "./components.css";
import "./switch-motion.css";
import "./paper-layers.css";

const cx = (...values: (string | false | null | undefined)[]) =>
  values.filter(Boolean).join(" ");

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      trailingIcon,
      className,
      children,
      disabled,
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
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cx(
          "dm-button",
          `dm-button--${variant}`,
          `dm-button--${size}`,
          className,
        )}
      >
        {loading ? (
          <Spinner size="sm" label="Loading" />
        ) : (
          icon && (
            <span className="dm-button__icon" aria-hidden="true">
              {icon}
            </span>
          )
        )}
        {children}
        {trailingIcon && (
          <span className="dm-button__icon" aria-hidden="true">
            {trailingIcon}
          </span>
        )}
      </button>
    );
  },
);

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  label: string;
  children: ReactNode;
}
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ label, children, className, ...props }, ref) {
    return (
      <Button
        {...props}
        ref={ref}
        aria-label={label}
        title={props.title ?? label}
        className={cx("dm-icon-button", className)}
      >
        <span aria-hidden="true">{children}</span>
      </Button>
    );
  },
);

export type BadgeTone = "sage" | "peach" | "lavender" | "blue" | "neutral";
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
}
export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span {...props} className={cx("dm-badge", `dm-tone--${tone}`, className)}>
      {dot && <span className="dm-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  fieldClassName?: string;
}
export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>, FieldProps {
  leading?: ReactNode;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, fieldClassName, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  const helpId = `${fieldId}-help`;
  return (
    <div className={cx("dm-field", fieldClassName)}>
      {label && (
        <label className="dm-field__label" htmlFor={fieldId}>
          {label}
          {props.required && <span aria-hidden="true"> *</span>}
        </label>
      )}
      <div
        className={cx("dm-input-wrap", !!leading && "dm-input-wrap--leading")}
      >
        {leading && (
          <span className="dm-input-leading" aria-hidden="true">
            {leading}
          </span>
        )}
        <input
          {...props}
          ref={ref}
          id={fieldId}
          aria-invalid={!!error || props["aria-invalid"]}
          aria-describedby={
            cx(props["aria-describedby"], !!(hint || error) && helpId) ||
            undefined
          }
          className={cx("dm-input", className)}
        />
      </div>
      {(hint || error) && (
        <span
          id={helpId}
          className={cx("dm-field__hint", !!error && "dm-field__error")}
        >
          {error || hint}
        </span>
      )}
    </div>
  );
});

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, fieldClassName, className, id, rows = 4, ...props },
    ref,
  ) {
    const generated = useId();
    const fieldId = id ?? generated;
    const helpId = `${fieldId}-help`;
    return (
      <div className={cx("dm-field", fieldClassName)}>
        {label && (
          <label className="dm-field__label" htmlFor={fieldId}>
            {label}
            {props.required && <span aria-hidden="true"> *</span>}
          </label>
        )}
        <textarea
          {...props}
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={!!error || props["aria-invalid"]}
          aria-describedby={
            cx(props["aria-describedby"], !!(hint || error) && helpId) ||
            undefined
          }
          className={cx("dm-input", "dm-textarea", className)}
        />
        {(hint || error) && (
          <span
            id={helpId}
            className={cx("dm-field__hint", !!error && "dm-field__error")}
          >
            {error || hint}
          </span>
        )}
      </div>
    );
  },
);

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    { label, hint, error, fieldClassName, className, id, children, ...props },
    ref,
  ) {
    const generated = useId();
    const fieldId = id ?? generated;
    const helpId = `${fieldId}-help`;
    const listbox = props.multiple || (props.size ?? 1) > 1;
    return (
      <div className={cx("dm-field", fieldClassName)}>
        {label && (
          <label className="dm-field__label" htmlFor={fieldId}>
            {label}
            {props.required && <span aria-hidden="true"> *</span>}
          </label>
        )}
        <div className="dm-select-wrap">
          <select
            {...props}
            ref={ref}
            id={fieldId}
            aria-invalid={!!error || props["aria-invalid"]}
            aria-describedby={
              cx(props["aria-describedby"], !!(hint || error) && helpId) ||
              undefined
            }
            className={cx(
              "dm-input",
              "dm-select",
              listbox && "dm-select--listbox",
              className,
            )}
          >
            {children}
          </select>
          {!listbox && (
            <span className="dm-select__indicator" aria-hidden="true">
              <Chevron size={18} />
            </span>
          )}
        </div>
        {(hint || error) && (
          <span
            id={helpId}
            className={cx("dm-field__hint", !!error && "dm-field__error")}
          >
            {error || hint}
          </span>
        )}
      </div>
    );
  },
);

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: ReactNode;
  description?: ReactNode;
}
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, description, className, id, ...props }, ref) {
    const generated = useId();
    const fieldId = id ?? generated;
    return (
      <label
        className={cx(
          "dm-choice",
          props.disabled && "dm-choice--disabled",
          className,
        )}
        htmlFor={fieldId}
      >
        <input
          {...props}
          ref={ref}
          id={fieldId}
          type="checkbox"
          className="dm-checkbox"
          aria-labelledby={
            props["aria-labelledby"] ??
            (!props["aria-label"] ? `${fieldId}-label` : undefined)
          }
          aria-describedby={
            cx(
              props["aria-describedby"],
              !!description && `${fieldId}-description`,
            ) || undefined
          }
        />
        <span>
          <span id={`${fieldId}-label`} className="dm-choice__label">
            {label}
          </span>
          {description && (
            <span
              id={`${fieldId}-description`}
              className="dm-choice__description"
            >
              {description}
            </span>
          )}
        </span>
      </label>
    );
  },
);

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}
export interface RadioGroupProps extends Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  "onChange" | "defaultValue"
> {
  options: RadioOption[];
  label: ReactNode;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  orientation?: "horizontal" | "vertical";
}
export function RadioGroup({
  options,
  label,
  name,
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  orientation = "vertical",
  className,
  ...props
}: RadioGroupProps) {
  const generated = useId();
  const [internal, setInternal] = useState(defaultValue ?? "");
  const selected = value ?? internal;
  return (
    <fieldset
      {...props}
      disabled={disabled}
      className={cx(
        "dm-radio-group",
        `dm-radio-group--${orientation}`,
        className,
      )}
    >
      <legend className="dm-field__label">{label}</legend>
      <div className="dm-radio-group__options">
        {options.map((option) => (
          <label
            className={cx(
              "dm-choice",
              (disabled || option.disabled) && "dm-choice--disabled",
            )}
            key={option.value}
          >
            <input
              className="dm-radio"
              type="radio"
              name={name ?? generated}
              value={option.value}
              checked={selected === option.value}
              disabled={option.disabled}
              required={required}
              onChange={() => {
                setInternal(option.value);
                onValueChange?.(option.value);
              }}
            />
            <span>
              <span className="dm-choice__label">{option.label}</span>
              {option.description && (
                <span className="dm-choice__description">
                  {option.description}
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export interface SwitchProps extends Omit<CheckboxProps, "type"> {}
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, description, className, id, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <label
      className={cx(
        "dm-choice",
        "dm-switch",
        props.disabled && "dm-choice--disabled",
        className,
      )}
      htmlFor={fieldId}
    >
      <input
        {...props}
        ref={ref}
        id={fieldId}
        type="checkbox"
        role="switch"
        className="dm-switch__input"
        aria-labelledby={
          props["aria-labelledby"] ??
          (!props["aria-label"] ? `${fieldId}-label` : undefined)
        }
        aria-describedby={
          cx(
            props["aria-describedby"],
            !!description && `${fieldId}-description`,
          ) || undefined
        }
      />
      <span className="dm-switch__track" aria-hidden="true" />
      <span>
        <span id={`${fieldId}-label`} className="dm-choice__label">
          {label}
        </span>
        {description && (
          <span
            className="dm-choice__description"
            id={`${fieldId}-description`}
          >
            {description}
          </span>
        )}
      </span>
    </label>
  );
});

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: ReactNode;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}
export const Slider = forwardRef<HTMLInputElement, SliderProps>(function Slider(
  {
    label,
    showValue = true,
    formatValue,
    className,
    id,
    value,
    defaultValue = 50,
    onChange,
    ...props
  },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  const [internal, setInternal] = useState(Number(defaultValue));
  const current = Number(value ?? internal);
  return (
    <div className={cx("dm-slider", className)}>
      <div className="dm-slider__label">
        <label htmlFor={fieldId} className="dm-field__label">
          {label}
        </label>
        {showValue && (
          <output htmlFor={fieldId}>
            {formatValue ? formatValue(current) : current}
          </output>
        )}
      </div>
      <input
        {...props}
        ref={ref}
        id={fieldId}
        type="range"
        value={value ?? internal}
        onChange={(event) => {
          setInternal(Number(event.target.value));
          onChange?.(event);
        }}
      />
    </div>
  );
});

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: ReactNode;
  showValue?: boolean;
}
export function Progress({
  value,
  max = 100,
  label,
  showValue = true,
  className,
  ...props
}: ProgressProps) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.max(0, Math.min(value, safeMax));
  const percent = Math.round((safeValue / safeMax) * 100);
  const id = useId();
  return (
    <div className={cx("dm-progress", className)}>
      {(label || showValue) && (
        <div className="dm-progress__label">
          <span id={id}>{label}</span>
          {showValue && <span aria-hidden="true">{percent}%</span>}
        </div>
      )}
      <div
        {...props}
        className="dm-progress__track"
        role="progressbar"
        aria-label={
          typeof label === "string"
            ? label
            : (props["aria-label"] ??
              (!label && !props["aria-labelledby"] ? "Progress" : undefined))
        }
        aria-labelledby={
          label && typeof label !== "string" ? id : props["aria-labelledby"]
        }
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}
export function Spinner({
  size = "md",
  label = "Loading",
  className,
  ...props
}: SpinnerProps) {
  return (
    <span
      {...props}
      className={cx("dm-spinner", `dm-spinner--${size}`, className)}
      role="status"
      aria-label={label}
    >
      <span className="dm-sr-only">{label}</span>
    </span>
  );
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string;
  size?: "sm" | "md" | "lg";
  tone?: BadgeTone;
}
export function Avatar({
  name,
  src,
  size = "md",
  tone = "sage",
  className,
  ...props
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      {...props}
      className={cx(
        "dm-avatar",
        `dm-avatar--${size}`,
        `dm-tone--${tone}`,
        className,
      )}
      role="img"
      aria-label={name}
      title={props.title ?? name}
    >
      {src && !failed ? (
        <img src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        initials
      )}
    </span>
  );
}
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
}
export function AvatarGroup({
  children,
  label = "People",
  className,
  ...props
}: AvatarGroupProps) {
  return (
    <div
      {...props}
      className={cx("dm-avatar-group", className)}
      role="group"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export interface TooltipProps {
  children: ReactElement<{ "aria-describedby"?: string }>;
  content: ReactNode;
  side?: "top" | "bottom";
}
export function Tooltip({ children, content, side = "top" }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const hovering = useRef(false);
  const focused = useRef(false);
  const dismissed = useRef(false);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        dismissed.current = true;
        setOpen(false);
      }
    };
    document.addEventListener("keydown", escape, true);
    return () => document.removeEventListener("keydown", escape, true);
  }, [open]);
  return (
    <span
      className={cx("dm-tooltip", `dm-tooltip--${side}`)}
      data-visible={open || undefined}
      onPointerEnter={() => {
        hovering.current = true;
        dismissed.current = false;
        setOpen(true);
      }}
      onPointerLeave={() => {
        hovering.current = false;
        setOpen(focused.current && !dismissed.current);
      }}
      onFocus={() => {
        focused.current = true;
        dismissed.current = false;
        setOpen(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          focused.current = false;
          setOpen(hovering.current && !dismissed.current);
        }
      }}
    >
      {cloneElement(children, {
        "aria-describedby": cx(children.props["aria-describedby"], id),
      })}
      <span className="dm-tooltip__content" id={id} role="tooltip">
        {content}
      </span>
    </span>
  );
}

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}
export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue"
> {
  items: TabItem[];
  label: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}
export function Tabs({
  items,
  label,
  value,
  defaultValue,
  onValueChange,
  className,
  ...props
}: TabsProps) {
  const prefix = useId();
  const [internal, setInternal] = useState(
    defaultValue ?? items.find((item) => !item.disabled)?.id,
  );
  const preferred = value ?? internal;
  const selected = items.some((item) => item.id === preferred && !item.disabled)
    ? preferred
    : items.find((item) => !item.disabled)?.id;
  const root = useRef<HTMLDivElement>(null);
  const select = (id: string) => {
    setInternal(id);
    onValueChange?.(id);
  };
  return (
    <div {...props} ref={root} className={cx("dm-tabs", className)}>
      <div
        className="dm-tabs__list"
        role="tablist"
        aria-label={label}
        onKeyDown={(event) => {
          const enabled = items.filter((item) => !item.disabled);
          const focused = (event.target as HTMLElement).closest(
            '[role="tab"]',
          )?.id;
          const index = enabled.findIndex(
            (item) => `${prefix}-tab-${item.id}` === focused,
          );
          let next: TabItem | undefined;
          if (event.key === "ArrowRight")
            next = enabled[(index + 1) % enabled.length];
          if (event.key === "ArrowLeft")
            next = enabled[(index - 1 + enabled.length) % enabled.length];
          if (event.key === "Home") next = enabled[0];
          if (event.key === "End") next = enabled.at(-1);
          if (next) {
            event.preventDefault();
            select(next.id);
            document.getElementById(`${prefix}-tab-${next.id}`)?.focus();
          }
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            id={`${prefix}-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={selected === item.id}
            aria-controls={`${prefix}-panel-${item.id}`}
            disabled={item.disabled}
            tabIndex={selected === item.id ? 0 : -1}
            onClick={() => select(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className="dm-tabs__panel"
          id={`${prefix}-panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`${prefix}-tab-${item.id}`}
          hidden={selected !== item.id}
          tabIndex={0}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean;
}
export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  items: AccordionItem[];
  defaultOpen?: string[];
  multiple?: boolean;
}
export function Accordion({
  items,
  defaultOpen = [],
  multiple = false,
  className,
  ...props
}: AccordionProps) {
  const prefix = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div {...props} className={cx("dm-accordion", className)}>
      {items.map((item) => {
        const expanded = open.includes(item.id);
        return (
          <div className="dm-accordion__item" key={item.id}>
            <h3 className="dm-accordion__heading">
              <button
                type="button"
                id={`${prefix}-button-${item.id}`}
                disabled={item.disabled}
                aria-expanded={expanded}
                aria-controls={`${prefix}-panel-${item.id}`}
                onClick={() =>
                  setOpen((previous) =>
                    expanded
                      ? previous.filter((id) => id !== item.id)
                      : multiple
                        ? [...previous, item.id]
                        : [item.id],
                  )
                }
              >
                {item.title}
                <Chevron direction={expanded ? "up" : "down"} size={18} />
              </button>
            </h3>
            <div
              className="dm-accordion__panel"
              id={`${prefix}-panel-${item.id}`}
              role="region"
              aria-labelledby={`${prefix}-button-${item.id}`}
              hidden={!expanded}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface DialogProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "title" | "onClose"
> {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  closeOnBackdrop?: boolean;
  /** A short source or context label above the title. */
  eyebrow?: ReactNode;
  /** Decorative context mark. The title remains the accessible name. */
  icon?: ReactNode;
  /** Ink gives the header a high-contrast cap; the content remains on paper. */
  surface?: "paper" | "ink";
  /** Fold a paper decision open, or use a quiet settle for utility dialogs. */
  motion?: "fold" | "settle";
  /** Explicit opener for browsers where tapping a button does not focus it. */
  returnFocusRef?: RefObject<HTMLElement | null>;
}
/** Native modal semantics provide focus trapping, Escape support, and focus restoration. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  closeLabel = "Close dialog",
  closeOnBackdrop = true,
  eyebrow,
  icon,
  surface = "paper",
  motion = "fold",
  returnFocusRef,
  children,
  className,
  ...props
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const openRef = useRef(open);
  openRef.current = open;
  const closeRequested = useRef(false);
  const pressedBackdrop = useRef(false);
  const internalCloses = useRef(0);
  const [motionState, setMotionState] = useState<
    "closed" | "opening" | "open" | "closing"
  >("closed");
  const requestClose = () => {
    if (!openRef.current || closeRequested.current) return;
    closeRequested.current = true;
    onCloseRef.current();
  };
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    let frame = 0;
    let nextFrame = 0;
    if (open) {
      closeRequested.current = false;
      if (!dialog.open) {
        setMotionState("opening");
        dialog.showModal();
        // Give the paper its first frame before it settles into place.
        frame = requestAnimationFrame(() => {
          nextFrame = requestAnimationFrame(() => setMotionState("open"));
        });
      } else {
        // Reversing a close uses the same mounted surface and CSS transition.
        setMotionState("open");
      }
    } else if (dialog.open) {
      setMotionState("closing");
    } else {
      setMotionState("closed");
    }
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(nextFrame);
    };
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (open || motionState !== "closing" || !dialog?.open) return;
    // Read the rendered closing state so host styles and reduced motion determine
    // the actual exit duration. The native modal stays active through this exit.
    const milliseconds = (value: string) =>
      value
        .split(",")
        .map((part) =>
          part.trim().endsWith("ms")
            ? parseFloat(part)
            : parseFloat(part) * 1000,
        );
    const regions = [
      dialog,
      ...dialog.querySelectorAll<HTMLElement>(
        ":scope > .dm-dialog__header, :scope > .dm-dialog__body, :scope > .dm-dialog__footer",
      ),
    ];
    const phaseEnd = (style: CSSStyleDeclaration) => {
      const durations = milliseconds(style.transitionDuration);
      const delays = milliseconds(style.transitionDelay);
      return Math.max(
        0,
        ...durations.map(
          (duration, index) => duration + delays[index % delays.length],
        ),
      );
    };
    // The shell covers the complete fold; also honor an owned region's longer
    // host override or crease transition before releasing native modality.
    const duration = Math.max(
      ...regions.flatMap((region) => [
        phaseEnd(getComputedStyle(region)),
        phaseEnd(getComputedStyle(region, "::before")),
      ]),
    );
    const timeout = window.setTimeout(
      () => {
        if (openRef.current || !dialog.open) return;
        internalCloses.current += 1;
        dialog.close();
        if (returnFocusRef?.current?.isConnected)
          returnFocusRef.current.focus({ preventScroll: true });
        setMotionState("closed");
      },
      duration + (duration ? 34 : 0),
    );
    return () => clearTimeout(timeout);
  }, [open, motionState, motion, returnFocusRef]);
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) {
        internalCloses.current += 1;
        dialog.close();
      }
    };
  }, []);
  return (
    <dialog
      {...props}
      ref={ref}
      className={cx(
        "dm-dialog",
        `dm-dialog--${surface}`,
        `dm-dialog--${motion}`,
        className,
      )}
      data-state={motionState}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(event) => {
        props.onCancel?.(event);
        if (!event.defaultPrevented) {
          event.preventDefault();
          requestClose();
        }
      }}
      onClose={() => {
        if (internalCloses.current) {
          internalCloses.current -= 1;
          return;
        }
        setMotionState("closed");
        if (openRef.current && !ref.current?.open) requestClose();
      }}
      onPointerDown={(event) => {
        props.onPointerDown?.(event);
        const rect = event.currentTarget.getBoundingClientRect();
        pressedBackdrop.current =
          !event.defaultPrevented &&
          event.target === event.currentTarget &&
          (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom);
      }}
      onClick={(event) => {
        props.onClick?.(event);
        if (
          !event.defaultPrevented &&
          closeOnBackdrop &&
          pressedBackdrop.current &&
          event.target === event.currentTarget
        ) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            requestClose();
        }
      }}
    >
      <div className="dm-dialog__header">
        <div className="dm-dialog__heading">
          {icon && (
            <span className="dm-dialog__icon" aria-hidden="true">
              {icon}
            </span>
          )}
          <div className="dm-dialog__heading-copy">
            {eyebrow && <div className="dm-dialog__eyebrow">{eyebrow}</div>}
            <h2 id={`${id}-title`}>{title}</h2>
            {description && <p id={`${id}-description`}>{description}</p>}
          </div>
        </div>
        <IconButton variant="ghost" label={closeLabel} onClick={requestClose}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </IconButton>
      </div>
      <div className="dm-dialog__body">{children}</div>
      {footer && <div className="dm-dialog__footer">{footer}</div>}
    </dialog>
  );
}
export interface DrawerProps extends Omit<DialogProps, "motion"> {
  side?: "left" | "right";
}
export function Drawer({ side = "right", className, ...props }: DrawerProps) {
  return (
    <Dialog
      {...props}
      motion="settle"
      className={cx("dm-drawer", `dm-drawer--${side}`, className)}
    />
  );
}

export interface ToastProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  onDismiss?: () => void;
  tone?: "success" | "info" | "warning" | "danger";
  action?: ReactNode;
  eyebrow?: ReactNode;
}
export function Toast({
  title,
  description,
  onDismiss,
  tone = "success",
  action,
  eyebrow,
  className,
  ...props
}: ToastProps) {
  return (
    <div
      {...props}
      className={cx("dm-toast", `dm-callout--${tone}`, className)}
      role={tone === "danger" ? "alert" : "status"}
    >
      <span className="dm-toast__mark" aria-hidden="true">
        {tone === "success"
          ? "✓"
          : tone === "danger" || tone === "warning"
            ? "!"
            : "i"}
      </span>
      <div className="dm-toast__copy">
        {eyebrow && <div className="dm-toast__eyebrow">{eyebrow}</div>}
        <strong>{title}</strong>
        {description && <p>{description}</p>}
        {action && <div className="dm-toast__action">{action}</div>}
      </div>
      {onDismiss && (
        <IconButton
          label="Dismiss notification"
          variant="ghost"
          size="sm"
          onClick={onDismiss}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </IconButton>
      )}
    </div>
  );
}

export interface DropdownMenuItem {
  id: string;
  label: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
  separatorBefore?: boolean;
  shortcut?: string;
}
export interface DropdownMenuProps {
  label: ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "end";
  className?: string;
}
export function DropdownMenu({
  label,
  items,
  align = "start",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const focusLast = useRef(false);
  const buttons = () => [
    ...(menu.current?.querySelectorAll<HTMLButtonElement>(
      '[role="menuitem"]:not(:disabled)',
    ) ?? []),
  ];
  const close = (restore = false) => {
    setOpen(false);
    if (restore) trigger.current?.focus();
  };
  useEffect(() => {
    if (open) {
      const enabled = buttons();
      (focusLast.current ? enabled.at(-1) : enabled[0])?.focus();
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return (
    <div ref={root} className={cx("dm-dropdown", className)}>
      <Button
        variant="secondary"
        ref={trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        trailingIcon={<Chevron direction={open ? "up" : "down"} />}
        onClick={() => {
          focusLast.current = false;
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            focusLast.current = event.key === "ArrowUp";
            setOpen(true);
          }
        }}
      >
        {label}
      </Button>
      {open && (
        <div
          ref={menu}
          id={id}
          className={cx("dm-dropdown__menu", `dm-dropdown__menu--${align}`)}
          role="menu"
          aria-label={typeof label === "string" ? label : "Actions"}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              close(true);
            }
            // Let native Tab navigation finish before removing the focused menu item.
            if (event.key === "Tab") window.setTimeout(() => setOpen(false), 0);
            const enabled = buttons();
            const current = enabled.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            let next = -1;
            if (event.key === "ArrowDown")
              next = (current + 1) % enabled.length;
            if (event.key === "ArrowUp")
              next = (current - 1 + enabled.length) % enabled.length;
            if (event.key === "Home") next = 0;
            if (event.key === "End") next = enabled.length - 1;
            if (next >= 0) {
              event.preventDefault();
              enabled[next]?.focus();
            }
            if (event.key.length === 1 && /\S/.test(event.key)) {
              const match = enabled.find((button) =>
                button.textContent
                  ?.trim()
                  .toLowerCase()
                  .startsWith(event.key.toLowerCase()),
              );
              if (match) {
                event.preventDefault();
                match.focus();
              }
            }
          }}
        >
          {items.map((item) => (
            <div key={item.id} role="none">
              {item.separatorBefore && (
                <div className="dm-dropdown__separator" role="separator" />
              )}
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                disabled={item.disabled}
                className={cx(item.danger && "dm-dropdown__danger")}
                onClick={() => {
                  close(true);
                  item.onSelect?.();
                }}
              >
                {item.label}
                {item.shortcut && <Kbd>{item.shortcut}</Kbd>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
}
export function Pagination({
  page,
  totalPages,
  onPageChange,
  label = "Pagination",
  className,
  ...props
}: PaginationProps) {
  const total = Math.max(1, Math.floor(totalPages));
  const current = Math.max(1, Math.min(page, total));
  const pages = [
    ...new Set(
      [1, current - 1, current, current + 1, total].filter(
        (number) => number >= 1 && number <= total,
      ),
    ),
  ].sort((a, b) => a - b);
  return (
    <nav
      {...props}
      className={cx("dm-pagination", className)}
      aria-label={label}
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={current === 1}
        aria-label="Previous page"
        onClick={() => onPageChange(current - 1)}
      >
        ←
      </Button>
      {pages.map((number, index) => (
        <span className="dm-pagination__item" key={number}>
          {index > 0 && number - pages[index - 1] > 1 && (
            <span className="dm-pagination__ellipsis" aria-hidden="true">
              …
            </span>
          )}
          <button
            type="button"
            aria-label={`Page ${number}`}
            aria-current={current === number ? "page" : undefined}
            onClick={() => onPageChange(number)}
          >
            {number}
          </button>
        </span>
      ))}
      <Button
        variant="ghost"
        size="sm"
        disabled={current === total}
        aria-label="Next page"
        onClick={() => onPageChange(current + 1)}
      >
        →
      </Button>
    </nav>
  );
}

export interface BreadcrumbItem {
  label: ReactNode;
  href?: string;
}
export interface BreadcrumbsProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  label?: string;
}
export function Breadcrumbs({
  items,
  label = "Breadcrumb",
  className,
  ...props
}: BreadcrumbsProps) {
  return (
    <nav
      {...props}
      className={cx("dm-breadcrumbs", className)}
      aria-label={label}
    >
      <ol>
        {items.map((item, index) => (
          <li key={index}>
            {index > 0 && <Chevron direction="right" size={12} />}
            {index === items.length - 1 ? (
              <span aria-current="page">{item.label}</span>
            ) : item.href ? (
              <a href={item.href}>{item.label}</a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  footer?: ReactNode;
  interactive?: boolean;
}
export function Card({
  title,
  description,
  eyebrow,
  footer,
  interactive = false,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <article
      {...props}
      className={cx(
        "dm-card",
        interactive && "dm-card--interactive",
        className,
      )}
    >
      {(eyebrow || title || description) && (
        <header className="dm-card__header">
          {eyebrow && <span className="dm-eyebrow">{eyebrow}</span>}
          {title && <h3>{title}</h3>}
          {description && <p>{description}</p>}
        </header>
      )}
      {children && <div className="dm-card__body">{children}</div>}
      {footer && <footer className="dm-card__footer">{footer}</footer>}
    </article>
  );
}

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "ink" | "sage" | "paper" | "accent";
  variant?: "folded" | "notched";
}
export function Banner({
  children,
  tone = "ink",
  variant = "folded",
  className,
  ...props
}: BannerProps) {
  return (
    <div
      {...props}
      className={cx(
        "dm-banner",
        `dm-banner--${tone}`,
        `dm-banner--${variant}`,
        className,
      )}
    >
      <span
        className="dm-banner__tail dm-banner__tail--left"
        aria-hidden="true"
      />
      <span className="dm-banner__face">{children}</span>
      <span
        className="dm-banner__tail dm-banner__tail--right"
        aria-hidden="true"
      />
    </div>
  );
}

export interface CalloutProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title?: ReactNode;
  tone?: "info" | "success" | "warning" | "danger";
  icon?: ReactNode;
}
export function Callout({
  title,
  tone = "info",
  icon,
  children,
  className,
  ...props
}: CalloutProps) {
  return (
    <div
      {...props}
      className={cx("dm-callout", `dm-callout--${tone}`, className)}
    >
      <span className="dm-callout__icon" aria-hidden="true">
        {icon ??
          (tone === "success"
            ? "✓"
            : tone === "warning" || tone === "danger"
              ? "!"
              : "i")}
      </span>
      <div>
        {title && <strong className="dm-callout__title">{title}</strong>}
        <div className="dm-callout__body">{children}</div>
      </div>
    </div>
  );
}

export interface PaperProps extends HTMLAttributes<HTMLDivElement> {
  pattern?: "dotted" | "lined" | "plain";
  padding?: "sm" | "md" | "lg";
}
export function Paper({
  pattern = "dotted",
  padding = "md",
  className,
  children,
  ...props
}: PaperProps) {
  return (
    <div
      {...props}
      className={cx(
        "dm-paper",
        `dm-paper--${pattern}`,
        `dm-paper--${padding}`,
        className,
      )}
    >
      {children}
    </div>
  );
}
export interface StickyNoteProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "sage" | "peach" | "lavender" | "paper";
  folded?: boolean;
}
export function StickyNote({
  tone = "sage",
  folded = true,
  className,
  children,
  ...props
}: StickyNoteProps) {
  return (
    <div
      {...props}
      className={cx(
        "dm-sticky-note",
        `dm-sticky-note--${tone}`,
        folded && "dm-sticky-note--folded",
        className,
      )}
    >
      <div className="dm-sticky-note__paper" aria-hidden="true" />
      <div className="dm-sticky-note__content">{children}</div>
    </div>
  );
}
export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  variant?: "solid" | "dotted";
}
export function Divider({
  label,
  variant = "dotted",
  className,
  ...props
}: DividerProps) {
  return (
    <div
      {...props}
      className={cx("dm-divider", `dm-divider--${variant}`, className)}
      role="separator"
    >
      {label && <span>{label}</span>}
    </div>
  );
}

export type JournalEntryType =
  | "task"
  | "completed"
  | "event"
  | "note"
  | "migrated";
export interface JournalEntry {
  id: string;
  type: JournalEntryType;
  content: ReactNode;
  meta?: ReactNode;
}
export interface JournalListProps extends HTMLAttributes<HTMLUListElement> {
  items: JournalEntry[];
  label?: string;
}
const journalSymbols: Record<
  JournalEntryType,
  { symbol: string; label: string }
> = {
  task: { symbol: "•", label: "Task" },
  completed: { symbol: "×", label: "Completed task" },
  event: { symbol: "○", label: "Event" },
  note: { symbol: "–", label: "Note" },
  migrated: { symbol: ">", label: "Migrated task" },
};
export function JournalList({
  items,
  label,
  className,
  ...props
}: JournalListProps) {
  return (
    <ul
      {...props}
      className={cx("dm-journal-list", className)}
      aria-label={label}
    >
      {items.map((item) => (
        <li key={item.id} className={`dm-journal-list__${item.type}`}>
          <span className="dm-journal-list__symbol" aria-hidden="true">
            {journalSymbols[item.type].symbol}
          </span>
          <span className="dm-sr-only">
            {journalSymbols[item.type].label}:{" "}
          </span>
          <span className="dm-journal-list__content">
            {item.content}
            {item.meta && (
              <span className="dm-journal-list__meta">{item.meta}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export interface EmptyStateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div {...props} className={cx("dm-empty-state", className)}>
      <div className="dm-empty-state__icon" aria-hidden="true">
        {icon ?? "○"}
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="dm-empty-state__action">{action}</div>}
    </div>
  );
}

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
}
export interface TableProps<T> extends TableHTMLAttributes<HTMLTableElement> {
  columns: TableColumn<T>[];
  data: T[];
  caption: string;
  rowKey?: (row: T, index: number) => string | number;
  emptyMessage?: ReactNode;
}
export function Table<T>({
  columns,
  data,
  caption,
  rowKey,
  emptyMessage = "No entries yet.",
  className,
  ...props
}: TableProps<T>) {
  return (
    <div className="dm-table-wrap">
      <table {...props} className={cx("dm-table", className)}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                scope="col"
                key={column.key}
                style={{ textAlign: column.align }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map((row, index) => (
              <tr key={rowKey?.(row, index) ?? index}>
                {columns.map((column) => (
                  <td key={column.key} style={{ textAlign: column.align }}>
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="dm-table__empty">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export interface KbdProps extends HTMLAttributes<HTMLElement> {}
export function Kbd({ children, className, ...props }: KbdProps) {
  return (
    <kbd {...props} className={cx("dm-kbd", className)}>
      {children}
    </kbd>
  );
}
