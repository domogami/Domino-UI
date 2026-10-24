import { forwardRef, useId } from "react";
import type { CheckboxProps } from "./components";
import "./task-checkbox.css";

export interface TaskCheckboxProps extends Omit<CheckboxProps, "type"> {}

/** The garden's native task control and line-by-line ink strike, adapted for React. */
export const TaskCheckbox = forwardRef<HTMLInputElement, TaskCheckboxProps>(
  function TaskCheckbox(
    { label, description, id, className = "", ...props },
    ref,
  ) {
    const generated = useId();
    const fieldId = id ?? generated;
    const descriptionId = description ? `${fieldId}-description` : undefined;
    return (
      <label
        className={`dm-task-checkbox ${props.disabled ? "dm-task-checkbox--disabled" : ""} ${className}`.trim()}
        htmlFor={fieldId}
      >
        <input
          {...props}
          ref={ref}
          type="checkbox"
          id={fieldId}
          className="dm-task-checkbox__input"
          aria-labelledby={
            props["aria-labelledby"] ??
            (!props["aria-label"] ? `${fieldId}-label` : undefined)
          }
          aria-describedby={
            [props["aria-describedby"], descriptionId]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <span className="dm-task-checkbox__copy">
          <span className="dm-task-checkbox__text" id={`${fieldId}-label`}>
            {label}
          </span>
          {description && (
            <span className="dm-task-checkbox__description" id={descriptionId}>
              {description}
            </span>
          )}
        </span>
      </label>
    );
  },
);
