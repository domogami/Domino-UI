/**
 * The notebook's Safari enhancement: a directly touched native switch forwards
 * one activation to the original button. Targets are sibling layer controls,
 * never nested inside buttons, and never a scripted hidden-label workaround.
 * Only controls inside the explicit Domino scope are instrumented.
 */
export function nativeTapTargets(root: HTMLElement, preference: () => boolean) {
  const coarse = window.matchMedia("(any-pointer: coarse)");
  const supported =
    "switch" in document.createElement("input") &&
    typeof navigator.vibrate !== "function";
  const targets = new Map<HTMLElement, HTMLInputElement>();
  const layers = new Map<HTMLElement, HTMLDivElement>();
  const positions = new Map<HTMLElement, string>();
  let frame = 0;
  let destroyed = false;
  const active = () =>
    !destroyed &&
    root.isConnected &&
    supported &&
    coarse.matches &&
    preference() &&
    document.visibilityState === "visible";

  function removeLayer(host: HTMLElement, layer: HTMLDivElement) {
    layer.remove();
    const original = positions.get(host);
    if (original !== undefined && host.style.position === "relative")
      host.style.position = original;
    positions.delete(host);
    layers.delete(host);
  }
  function clear() {
    for (const [button, input] of targets) {
      button.removeAttribute("data-native-tap-pressed");
      input.remove();
    }
    targets.clear();
    resize.disconnect();
    for (const [host, layer] of layers) removeLayer(host, layer);
  }

  function measure() {
    frame = 0;
    if (destroyed) return;
    if (!active()) {
      clear();
      return;
    }
    const modal = document.querySelector<HTMLElement>("dialog[open]");
    const keep = new Set<HTMLElement>();
    const controls = root.querySelectorAll<HTMLElement>(
      'button, summary, [role="button"]',
    );
    for (const button of controls) {
      if (
        button.closest("[data-domino-haptics]") !== root ||
        button.matches(
          ':disabled, [aria-disabled="true"], [data-haptic="none"], [data-native-tap="none"]',
        ) ||
        button.closest('[hidden], [inert], [aria-hidden="true"]') ||
        (modal && !modal.contains(button))
      )
        continue;
      const rect = button.getBoundingClientRect();
      const css = getComputedStyle(button);
      if (
        !rect.width ||
        !rect.height ||
        css.visibility !== "visible" ||
        css.pointerEvents === "none" ||
        Number(css.opacity) === 0
      )
        continue;
      let left = Math.max(0, rect.left);
      let right = Math.min(innerWidth, rect.right);
      let top = Math.max(0, rect.top);
      let bottom = Math.min(innerHeight, rect.bottom);
      let visible = true;
      let scrollHost: HTMLElement | null = null;
      // Clip to scroll panels as well as the viewport, so a scrolled-out target
      // cannot intercept taps on navigation underneath the panel.
      for (let parent = button.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (Number(style.opacity) === 0 || style.visibility !== "visible") {
          visible = false;
          break;
        }
        const box = parent.getBoundingClientRect();
        if (!scrollHost && /auto|scroll/.test(`${style.overflowX} ${style.overflowY}`))
          scrollHost = parent;
        if (/hidden|clip|auto|scroll/.test(style.overflowX)) {
          left = Math.max(left, box.left);
          right = Math.min(right, box.right);
        }
        if (/hidden|clip|auto|scroll/.test(style.overflowY)) {
          top = Math.max(top, box.top);
          bottom = Math.min(bottom, box.bottom);
        }
      }
      if (!visible || right <= left || bottom <= top) continue;
      // Retain the original scrolling ancestor. Native switch pan behavior is
      // browser-version dependent; hosts can opt out with data-native-tap=none.
      const host = scrollHost ?? modal ?? document.body;
      const local = host !== document.body;
      if (local && getComputedStyle(host).position === "static") {
        if (!positions.has(host)) positions.set(host, host.style.position);
        host.style.position = "relative";
      }
      let layer = layers.get(host);
      if (!layer) {
        layer = document.createElement("div");
        layer.className = "dm-native-tap-layer";
        layer.setAttribute("aria-hidden", "true");
        host.append(layer);
        layers.set(host, layer);
      }
      let input = targets.get(button);
      if (!input) {
        input = document.createElement("input");
        input.type = "checkbox";
        input.setAttribute("switch", "");
        input.className = "dm-native-tap-target";
        input.tabIndex = -1;
        input.setAttribute("aria-hidden", "true");
        input.dataset.haptic = "none";
        let trusted = false;
        let previous: HTMLElement | null = null;
        input.addEventListener("pointerdown", (event) => {
          trusted = event.isTrusted;
          previous = document.activeElement as HTMLElement;
          button.setAttribute("data-native-tap-pressed", "");
          // Keep the native default action: Safari needs the real switch tap.
        });
        const release = () => button.removeAttribute("data-native-tap-pressed");
        input.addEventListener("pointerup", release);
        input.addEventListener("pointercancel", () => {
          trusted = false;
          release();
        });
        input.addEventListener("change", () => {
          release();
          if (
            !trusted ||
            !active() ||
            !button.isConnected ||
            button.matches(':disabled, [aria-disabled="true"], [data-haptic="none"], [data-native-tap="none"]') ||
            button.closest('[hidden], [inert], [aria-hidden="true"]')
          ) {
            trusted = false;
            return;
          }
          trusted = false;
          // Retain caret editing in the notebook calculator and a shared port.
          const focus =
            button.closest(".calc-keypad, [data-native-tap-preserve-input]") &&
            previous?.matches("input:not(.dm-native-tap-target), textarea")
              ? previous
              : button;
          focus?.focus({ preventScroll: true });
          button.click();
          refresh();
        });
        targets.set(button, input);
        resize.observe(button);
      }
      input.dataset.nativeTapLabel =
        button.getAttribute("aria-label") ?? button.textContent?.trim() ?? "";
      if (input.parentElement !== layer) layer.append(input);
      const origin = host.getBoundingClientRect();
      Object.assign(input.style, {
        position: local ? "absolute" : "fixed",
        left: `${local ? rect.left - origin.left + host.scrollLeft - host.clientLeft : rect.left}px`,
        top: `${local ? rect.top - origin.top + host.scrollTop - host.clientTop : rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        clipPath: `inset(${top - rect.top}px ${rect.right - right}px ${rect.bottom - bottom}px ${left - rect.left}px round ${css.borderTopLeftRadius} ${css.borderTopRightRadius} ${css.borderBottomRightRadius} ${css.borderBottomLeftRadius})`,
      });
      keep.add(button);
    }
    for (const [button, input] of targets) {
      if (keep.has(button)) continue;
      resize.unobserve(button);
      button.removeAttribute("data-native-tap-pressed");
      input.remove();
      targets.delete(button);
    }
    for (const [host, layer] of layers) {
      if (!layer.children.length) removeLayer(host, layer);
    }
  }
  function refresh() {
    if (!active()) clear();
    else if (!frame && !destroyed) frame = requestAnimationFrame(measure);
  }
  const resize = new ResizeObserver(refresh);
  const mutation = new MutationObserver((records) => {
    if (
      records.some(
        (record) =>
          !(record.target instanceof Element) ||
          !record.target.closest(".dm-native-tap-layer"),
      )
    )
      refresh();
  });
  if (supported) {
    mutation.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "class", "style", "hidden", "inert", "disabled", "aria-disabled",
        "aria-label", "open", "data-haptic", "data-native-tap",
      ],
    });
    document.addEventListener("scroll", refresh, true);
    root.addEventListener("transitionend", refresh, true);
    root.addEventListener("animationend", refresh, true);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("resize", refresh);
    window.visualViewport?.addEventListener("scroll", refresh);
    coarse.addEventListener("change", refresh);
    document.fonts.ready.then(refresh);
    refresh();
  }
  return {
    refresh,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      mutation.disconnect();
      clear();
      document.removeEventListener("scroll", refresh, true);
      root.removeEventListener("transitionend", refresh, true);
      root.removeEventListener("animationend", refresh, true);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("resize", refresh);
      window.visualViewport?.removeEventListener("resize", refresh);
      window.visualViewport?.removeEventListener("scroll", refresh);
      coarse.removeEventListener("change", refresh);
    },
  };
}
