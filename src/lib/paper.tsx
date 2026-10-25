import { useEffect, useRef, type HTMLAttributes } from "react";
import "./paper.css";

export interface PaperProps extends HTMLAttributes<HTMLDivElement> {
  pattern?: "dotted" | "lined" | "plain";
  padding?: "sm" | "md" | "lg";
  /** Place rules between writing rows, or slightly closer to their baseline. */
  ruleAlign?: "between" | "baseline";
}

type Band = { top: number; bottom: number };
const unruled =
  "input,textarea,select,button,figure,table,pre,svg,canvas,img,video,audio,iframe,[data-paper-unruled],.dm-paper";
const geometryProperties =
  /^(transform|translate|rotate|scale|zoom|font|lineHeight|letterSpacing|wordSpacing|width|height|margin|padding|inset|top|right|bottom|left)/;
const maxNodes = 4000;
const maxCharacters = 60_000;
const maxRules = 2000;
const typographyProperties = /^(font|lineHeight|letterSpacing|wordSpacing)/;

/** An ordinary surface; lined paper adds measured, purely decorative safe rules. */
export function Paper({
  pattern = "dotted",
  padding = "md",
  ruleAlign = "between",
  className,
  children,
  ...attributes
}: PaperProps) {
  const paper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const rules = useRef<SVGSVGElement>(null);
  const ink = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = paper.current;
    const body = content.current;
    const svg = rules.current;
    const path = ink.current;
    if (pattern !== "lined" || !root || !body || !svg || !path) return;
    let active = true;
    let frame = 0;
    let fontRequest = 0;
    const waiting = new WeakSet<Animation>();
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const fonts = document.fonts;

    const clear = (reason = "pending") => {
      path.removeAttribute("d");
      svg.dataset.rulesReady = "false";
      svg.dataset.ruleRows = "";
      svg.dataset.rulesReason = reason;
    };
    const length = (value: string, fallback: number) => {
      if (!value.trim()) return fallback;
      const px = value.trim().match(/^(-?(?:\d+\.?\d*|\.\d+))(?:px)?$/);
      if (px) return Number(px[1]);
      // Resolve ordinary CSS lengths/calc in the same font context. The owned,
      // invisible probe is out of flow and removed before anything is painted.
      const probe = document.createElement("span");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText =
        "position:absolute;visibility:hidden;pointer-events:none;height:0;margin:0;padding:0;border:0;";
      probe.style.width = value;
      if (!probe.style.width) return NaN;
      root.append(probe);
      const result = parseFloat(getComputedStyle(probe).width);
      probe.remove();
      return result;
    };
    const queueDraw = (clearFirst: boolean) => {
      if (!active) return;
      if (clearFirst) clear();
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const schedule = () => queueDraw(true);
    const hasMovingText = () => {
      if (typeof body.getAnimations !== "function") return false;
      let moving = false;
      const animations = body.getAnimations({ subtree: true });
      for (
        let ancestor: Element | null = root;
        ancestor;
        ancestor = ancestor.parentElement
      ) {
        animations.push(...ancestor.getAnimations());
      }
      for (const animation of animations) {
        const effect = animation.effect;
        if (
          !(effect instanceof KeyframeEffect) ||
          !(effect.target instanceof Element)
        )
          continue;
        const target = effect.target;
        const properties = body.contains(target)
          ? geometryProperties
          : typographyProperties;
        const excluded = target.closest(unruled);
        if (excluded && body.contains(excluded)) continue;
        if (!target.textContent?.trim()) continue;
        if (
          !effect
            .getKeyframes()
            .some((keyframe) =>
              Object.keys(keyframe).some((key) => properties.test(key)),
            )
        )
          continue;
        if (
          animation.playState === "idle" ||
          animation.playState === "finished"
        )
          continue;
        moving = true;
        if (!waiting.has(animation)) {
          waiting.add(animation);
          void animation.finished
            .catch(() => undefined)
            .then(() => {
              waiting.delete(animation);
              if (active) schedule();
            });
        }
      }
      return moving;
    };
    const draw = () => {
      frame = 0;
      if (!active || !root.isConnected) return;
      clear();
      if (fonts?.status === "loading") {
        clear("fonts");
        return;
      }
      if (hasMovingText()) {
        clear("moving-text");
        return;
      }
      const css = getComputedStyle(root);
      const pitch = length(css.getPropertyValue("--dm-paper-rule-pitch"), 32);
      const clearance = length(
        css.getPropertyValue("--dm-paper-rule-clearance"),
        3,
      );
      const guide = length(
        css.getPropertyValue("--dm-paper-rule-guide-offset"),
        2,
      );
      const width = root.clientWidth;
      const height = root.clientHeight;
      if (
        ![pitch, clearance, guide, width, height].every(Number.isFinite) ||
        pitch <= 0 ||
        clearance < 0 ||
        width <= 0 ||
        height <= 0 ||
        height / pitch > maxRules
      ) {
        clear("unsupported-size");
        return;
      }
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      const matrix = svg.getScreenCTM();
      // Axis-aligned positive scale/translate includes browser/CSS zoom. A
      // skew, rotation, reflection or perspective is intentionally unruled.
      if (
        !matrix ||
        matrix.is2D === false ||
        matrix.a <= 0 ||
        matrix.d <= 0 ||
        Math.abs(matrix.b) > 0.00001 ||
        Math.abs(matrix.c) > 0.00001
      ) {
        clear("unsupported-transform");
        return;
      }
      const local = (rect: DOMRect | DOMRectReadOnly): Band => ({
        top: (rect.top - matrix.f) / matrix.d,
        bottom: (rect.bottom - matrix.f) / matrix.d,
      });
      const bands: Band[] = [];
      const elements = [...body.querySelectorAll<HTMLElement>("*")];
      if (elements.length > maxNodes) {
        clear("content-limit");
        return;
      }
      const styles = new Map<Element, CSSStyleDeclaration>();
      const styleOf = (element: Element) => {
        let style = styles.get(element);
        if (!style) {
          style = getComputedStyle(element);
          styles.set(element, style);
        }
        return style;
      };
      for (const element of [body, ...elements]) {
        const style = styleOf(element);
        const excluded = element.closest(unruled);
        if (excluded && body.contains(excluded)) {
          if (excluded === element) {
            const rect = element.getBoundingClientRect();
            if (rect.width && rect.height) bands.push(local(rect));
          }
          continue;
        }
        if (style.writingMode !== "horizontal-tb") {
          clear("unsupported-writing-mode");
          return;
        }
        if (style.transform !== "none") {
          try {
            const transform = new DOMMatrixReadOnly(style.transform);
            if (
              !transform.is2D ||
              transform.a <= 0 ||
              transform.d <= 0 ||
              Math.abs(transform.b) > 0.00001 ||
              Math.abs(transform.c) > 0.00001
            ) {
              clear("unsupported-transform");
              return;
            }
          } catch {
            clear("unsupported-transform");
            return;
          }
        }
      }
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      let text: Node | null;
      let characters = 0;
      while ((text = walker.nextNode())) {
        const value = text.textContent ?? "";
        if (!value.trim()) continue;
        characters += value.length;
        if (characters > maxCharacters) {
          clear("content-limit");
          return;
        }
        const parent = text.parentElement;
        if (!parent) continue;
        const excluded = parent.closest(unruled);
        if (excluded && body.contains(excluded)) continue;
        const style = styleOf(parent);
        if (style.visibility !== "visible" || style.display === "none")
          continue;
        const range = document.createRange();
        range.selectNodeContents(text);
        let metrics:
          | Pick<
              TextMetrics,
              | "fontBoundingBoxAscent"
              | "fontBoundingBoxDescent"
              | "actualBoundingBoxAscent"
              | "actualBoundingBoxDescent"
            >
          | undefined;
        if (context) {
          context.font =
            style.font ||
            `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const transformed =
            style.textTransform === "uppercase"
              ? value.toLocaleUpperCase()
              : style.textTransform === "lowercase"
                ? value.toLocaleLowerCase()
                : value;
          metrics = context.measureText(transformed);
          if (style.textTransform === "capitalize") {
            // Capitalized words still contain lowercase descenders. The union
            // protects both their original ink and possible uppercase initials.
            const upper = context.measureText(value.toLocaleUpperCase());
            metrics = {
              fontBoundingBoxAscent: Math.max(
                metrics.fontBoundingBoxAscent,
                upper.fontBoundingBoxAscent,
              ),
              fontBoundingBoxDescent: Math.max(
                metrics.fontBoundingBoxDescent,
                upper.fontBoundingBoxDescent,
              ),
              actualBoundingBoxAscent: Math.max(
                metrics.actualBoundingBoxAscent,
                upper.actualBoundingBoxAscent,
              ),
              actualBoundingBoxDescent: Math.max(
                metrics.actualBoundingBoxDescent,
                upper.actualBoundingBoxDescent,
              ),
            };
          }
        }
        for (const rect of range.getClientRects()) {
          if (!rect.width || !rect.height) continue;
          const bounds = local(rect);
          const fontHeight = metrics
            ? metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
            : NaN;
          // Range gives the em rectangle. Canvas locates the actual ink within
          // it. If that mapping is unavailable/ambiguous, keep the whole range
          // as a conservative exclusion instead of inventing a baseline.
          if (
            metrics &&
            Number.isFinite(fontHeight) &&
            fontHeight > 0 &&
            Math.abs(bounds.bottom - bounds.top - fontHeight) <=
              Math.max(1, fontHeight * 0.1) &&
            Number.isFinite(metrics.actualBoundingBoxAscent) &&
            Number.isFinite(metrics.actualBoundingBoxDescent)
          ) {
            const scale = (bounds.bottom - bounds.top) / fontHeight;
            const baseline = bounds.top + metrics.fontBoundingBoxAscent * scale;
            bands.push({
              top: baseline - metrics.actualBoundingBoxAscent * scale,
              bottom: baseline + metrics.actualBoundingBoxDescent * scale,
            });
          } else bands.push(bounds);
        }
      }
      const origin =
        local(body.getBoundingClientRect()).top -
        (ruleAlign === "baseline" ? guide : 0);
      const rows: number[] = [];
      const phase = ((origin % pitch) + pitch) % pitch;
      // Extend the same grid through padding above the content, while keeping
      // its half-pixel stroke away from the paper's border edge.
      const first = phase < 1 ? phase + pitch : phase;
      for (let y = first; y <= height - 1; y += pitch) {
        // Include half the one-pixel stroke in the clearance, not just its axis.
        if (
          !bands.some(
            (band) =>
              y + 0.5 >= band.top - clearance &&
              y - 0.5 <= band.bottom + clearance,
          )
        )
          rows.push(y);
      }
      path.setAttribute("d", rows.map((y) => `M0 ${y}H${width}`).join(" "));
      svg.dataset.rulePitch = String(pitch);
      svg.dataset.ruleOrigin = String(origin);
      svg.dataset.ruleRows = rows.join(",");
      svg.dataset.rulesReason = "measured";
      svg.dataset.rulesReady = "true";
    };

    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    resize.observe(body);
    const mutations = new MutationObserver(schedule);
    mutations.observe(body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    });
    const ancestors = new MutationObserver(schedule);
    for (
      let element: Element | null = root;
      element;
      element = element.parentElement
    )
      ancestors.observe(element, { attributes: true });
    const loading = () => {
      const request = ++fontRequest;
      if (fonts?.status === "loading") {
        clear("fonts");
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
      } else {
        // WebKit can deliver an empty, already-loaded notification during
        // style/screenshot recalculation without a following loadingdone.
        // Keep known-safe ink until the atomic redraw instead of blanking it.
        queueDraw(false);
      }
      void fonts?.ready.then(() => {
        if (active && request === fontRequest) queueDraw(false);
      });
    };
    fonts?.addEventListener("loading", loading);
    fonts?.addEventListener("loadingdone", schedule);
    fonts?.addEventListener("loadingerror", schedule);
    void fonts?.ready.then(() => {
      if (active) schedule();
    });
    window.addEventListener("resize", schedule, { passive: true });
    window.visualViewport?.addEventListener("resize", schedule, {
      passive: true,
    });
    const motionEvents = [
      "animationstart",
      "animationend",
      "animationcancel",
      "transitionrun",
      "transitionend",
      "transitioncancel",
    ];
    const motion = (event: Event) => {
      const target = event.target;
      if (
        target instanceof Element &&
        (body.contains(target) || target.contains(root))
      )
        schedule();
    };
    motionEvents.forEach((name) =>
      document.addEventListener(name, motion, true),
    );
    schedule();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      ancestors.disconnect();
      fonts?.removeEventListener("loading", loading);
      fonts?.removeEventListener("loadingdone", schedule);
      fonts?.removeEventListener("loadingerror", schedule);
      window.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      motionEvents.forEach((name) =>
        document.removeEventListener(name, motion, true),
      );
      clear("inactive");
    };
  }, [pattern, ruleAlign]);

  return (
    <div
      {...attributes}
      ref={paper}
      className={[
        "dm-paper",
        `dm-paper--${pattern}`,
        `dm-paper--${padding}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-rule-align={pattern === "lined" ? ruleAlign : undefined}
    >
      {pattern === "lined" ? (
        <>
          <svg
            ref={rules}
            className="dm-paper__rules"
            aria-hidden="true"
            focusable="false"
            data-rules-ready="false"
          >
            <path ref={ink} className="dm-paper__rule-ink" />
          </svg>
          <div ref={content} className="dm-paper__content">
            {children}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  );
}
