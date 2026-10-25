import { expect, test } from "@playwright/test";

interface ProductionRouteSnapshot {
  count: number;
  root: string;
  sheet: string;
  rail: string;
  marked: boolean;
}

type ProductionRoutingWindow = Window & {
  productionRouteTransitions: ViewTransition[];
  productionRouteSnapshots: Promise<ProductionRouteSnapshot>[];
};

test("production journal art wraps, draws and replays on a mobile viewport", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("notebook-touch-feedback", "off"),
  );
  await page.goto("/#component/triple-banner");
  await page.evaluate(() => document.fonts.ready);
  const art = page.locator(".playground-canvas .dm-triple-banner");
  await expect(art.locator(".dm-triple-banner__band")).toHaveCount(3);
  await expect(art.locator(".dm-triple-banner__reverse")).toHaveCount(2);
  await expect(art.locator(".dm-triple-banner__label").first()).toHaveCSS(
    "font-family",
    /Kalam/,
  );
  const replay = art.getByRole("button", {
    name: "Replay Paper & patience, A little curiosity, Room to grow",
    exact: true,
  });
  for (const theme of ["hybrid", "light", "dark"]) {
    await page.evaluate(
      (value) => (document.documentElement.dataset.theme = value),
      theme,
    );
    const fit = await art.evaluate((element) => {
      (element as HTMLElement).style.width = "180px";
      const labels = [
        ...element.querySelectorAll<HTMLElement>(".dm-triple-banner__label"),
      ];
      labels[0].textContent =
        "A small collection of very good thoughts worth keeping";
      return (
        labels.every((label) => {
          const band = label.closest(".dm-triple-banner__band")!;
          return (
            label.scrollWidth <= label.clientWidth + 1 &&
            label.getBoundingClientRect().bottom <=
              band.getBoundingClientRect().bottom
          );
        }) && element.scrollWidth <= element.clientWidth + 1
      );
    });
    expect(fit).toBe(true);
  }
  const oldPath = await art
    .locator(".dm-journal-art-line")
    .first()
    .elementHandle();
  await replay.tap();
  expect(await oldPath!.evaluate((path) => path.isConnected)).toBe(false);
  await expect(replay).toBeFocused();
  const path = art.locator(".dm-journal-art-line").first();
  const start = await path.evaluate((element) =>
    parseFloat(getComputedStyle(element).strokeDashoffset),
  );
  expect(start).toBeGreaterThan(0);
  await expect
    .poll(() =>
      path.evaluate((element) =>
        parseFloat(getComputedStyle(element).strokeDashoffset),
      ),
    )
    .toBeLessThan(start);

  await page.goto("/#component/bookmark-drawing");
  const bookmark = page.locator(".dm-bookmark-drawing").first();
  await expect(bookmark).toHaveAttribute("data-variant", "notched");
  await expect(
    page.locator('.dm-bookmark-drawing[data-variant="pointed"]'),
  ).toHaveCount(1);
  await expect(bookmark.locator(".dm-journal-art-seam")).toHaveCSS(
    "stroke-width",
    "0.85px",
  );
  const markerReplay = page.getByRole("button", {
    name: "Replay A V-cut bookmark",
    exact: true,
  });
  await markerReplay.tap();
  await expect(bookmark).toHaveAttribute("data-replay", "1");
  await expect(markerReplay).toBeFocused();
  expect(
    await bookmark.evaluate(
      (element) => element.getBoundingClientRect().right <= innerWidth,
    ),
  ).toBe(true);
});

test("production journal ink and modal folds honor reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() =>
    localStorage.setItem("notebook-touch-feedback", "off"),
  );
  await page.goto("/#component/triple-banner");
  const ribbon = page.locator(".dm-triple-banner").first();
  await expect(ribbon).toHaveAttribute("data-quiet", "true");
  await expect(ribbon.getByRole("button")).toBeDisabled();
  await expect(ribbon.locator(".dm-journal-art-line").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.goto("/#layers");
  await page
    .getByRole("button", { name: "Open layered modal", exact: true })
    .tap();
  const dialog = page.getByRole("dialog", {
    name: "A thought worth keeping",
    exact: true,
  });
  await expect(dialog).toHaveClass(/dm-dialog--fold/);
  await expect(dialog.locator(".dm-dialog__body")).toHaveCSS(
    "transform",
    "none",
  );
  await expect(dialog.locator(".dm-dialog__footer")).toHaveCSS(
    "transition-delay",
    "0s",
  );
  await expect(dialog).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("production paper layers retain their styles, viewport fit and nested focus behavior", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("notebook-touch-feedback", "off"),
  );
  await page.goto("/#layers");
  const card = page.locator(".layers-stage .dm-notification-card");
  await expect(card).toHaveAccessibleName("A small idea is ready to grow.");
  await expect(card.locator(".dm-notification-card__sheet")).toHaveCSS(
    "border-top-style",
    "solid",
  );
  expect(
    await card
      .locator(".dm-notification-card__sheet")
      .evaluate((element) =>
        parseFloat(getComputedStyle(element).borderTopWidth),
      ),
  ).toBeGreaterThanOrEqual(1);
  await expect(card.locator(".dm-notification-card__title")).toHaveCSS(
    "font-family",
    /Poppins/,
  );
  const trigger = page.getByRole("button", {
    name: "Open paper popover",
    exact: true,
  });
  await trigger.tap();
  const popover = page.getByRole("dialog", {
    name: "A thought in the margin",
    exact: true,
  });
  await expect(popover).toHaveAttribute("data-state", "open");
  await expect(popover).toHaveCSS("border-top-style", "solid");
  expect(
    await popover.evaluate((element) =>
      parseFloat(getComputedStyle(element).borderTopWidth),
    ),
  ).toBeGreaterThanOrEqual(1);
  await expect(popover).toHaveCSS("opacity", "1");
  expect(
    await popover.evaluate((element) => element.matches(":popover-open")),
  ).toBe(true);
  expect(
    await popover.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.left >= 15 &&
        rect.right <= innerWidth - 15 &&
        rect.top >= 15 &&
        rect.bottom <= innerHeight - 15
      );
    }),
  ).toBe(true);
  const pinnedChoice = popover.getByRole("checkbox", {
    name: "Pin this thought for later",
    exact: true,
  });
  const scrollBody = popover.locator(".dm-popover__body");
  const startsBelowFold = await pinnedChoice.evaluate((choice) => {
    const body = choice.closest(".dm-popover__body")!;
    return (
      choice.getBoundingClientRect().bottom >
      body.getBoundingClientRect().bottom
    );
  });
  await pinnedChoice.check();
  await expect(pinnedChoice).toBeChecked();
  if (startsBelowFold) {
    await expect
      .poll(() => scrollBody.evaluate((body) => body.scrollTop))
      .toBeGreaterThan(0);
    // Repositioning after internal scroll must not expand the body and reset it.
    await page.waitForTimeout(100);
    expect(await scrollBody.evaluate((body) => body.scrollTop)).toBeGreaterThan(
      0,
    );
  }
  await popover
    .getByRole("button", { name: "Close popover", exact: true })
    .tap();
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
  const opener = page.getByRole("button", {
    name: "Open layered modal",
    exact: true,
  });
  await page.locator("dialog.dm-dialog--fold").evaluate((element) => {
    const leaf = element.querySelector<HTMLElement>(".dm-dialog__leaf")!;
    const body = element.querySelector<HTMLElement>(".dm-dialog__body")!;
    const footer = element.querySelector<HTMLElement>(".dm-dialog__footer")!;
    const marker = (owner: HTMLElement, edge: "top" | "bottom") => {
      const point = document.createElement("span");
      point.setAttribute("aria-hidden", "true");
      point.style.cssText = `position:absolute;left:50%;${edge}:0;width:0;height:0;pointer-events:none`;
      owner.append(point);
      return point;
    };
    const bodyJoint = marker(body, "bottom");
    const footerJoint = marker(footer, "top");
    const angle = (plane: HTMLElement) => {
      const transform = getComputedStyle(plane).transform;
      if (transform === "none") return 0;
      const matrix = new DOMMatrixReadOnly(transform);
      return (Math.atan2(matrix.m23, matrix.m22) * 180) / Math.PI;
    };
    const translation = () => {
      const transform = getComputedStyle(element).transform;
      return transform === "none"
        ? new DOMMatrixReadOnly()
        : new DOMMatrixReadOnly(transform);
    };
    const sample = () => ({
      opacity: Number(getComputedStyle(element).opacity),
      x: translation().m41,
      y: translation().m42,
      header: getComputedStyle(element.querySelector(".dm-dialog__header")!)
        .transform,
      leaf: getComputedStyle(leaf).transform,
      leafAngle: angle(leaf),
      footerAngle: angle(footer),
      headerOpacity: Number(
        getComputedStyle(element.querySelector(".dm-dialog__header")!).opacity,
      ),
      jointGap: Math.hypot(
        bodyJoint.getBoundingClientRect().x -
          footerJoint.getBoundingClientRect().x,
        bodyJoint.getBoundingClientRect().y -
          footerJoint.getBoundingClientRect().y,
      ),
    });
    const watch = (state: "open" | "closing") =>
      new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          if (element.getAttribute("data-state") !== state) return;
          observer.disconnect();
          const animations = element
            .getAnimations({ subtree: true })
            .filter(
              (animation) =>
                animation instanceof CSSTransition &&
                ["transform", "opacity"].includes(animation.transitionProperty),
            );
          const duration = Math.max(
            ...animations.map((animation) =>
              Number(animation.effect!.getComputedTiming().endTime),
            ),
          );
          animations.forEach((animation) => animation.pause());
          const seek = (time: number) => {
            animations.forEach((animation) => {
              animation.currentTime = time;
            });
            return sample();
          };
          const start = seek(0);
          const firstBeat = seek(40);
          const middle = seek(duration * 0.5);
          const tucked = seek(duration * 0.75);
          const foldComplete = seek(duration - 40);
          const fading = seek(duration * 0.92);
          const end = seek(duration + 1);
          animations.forEach((animation) => animation.finish());
          resolve({
            duration,
            start,
            firstBeat,
            middle,
            tucked,
            foldComplete,
            fading,
            end,
            modal: element.matches(":modal"),
          });
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["data-state"],
        });
      });
    (window as any).productionFoldProbe = {
      opening: watch("open"),
      closing: watch("closing"),
    };
  });
  await opener.tap();
  const dialog = page.getByRole("dialog", {
    name: "A thought worth keeping",
    exact: true,
  });
  const opening = await page.evaluate(
    () => (window as any).productionFoldProbe.opening,
  );
  expect(opening.duration).toBeGreaterThanOrEqual(350);
  expect(opening.duration).toBeLessThanOrEqual(380);
  expect(opening.modal).toBe(true);
  expect(opening.start.opacity).toBe(0);
  expect(opening.firstBeat.opacity).toBeGreaterThan(0);
  expect(opening.firstBeat.opacity).toBeLessThan(1);
  expect(opening.middle.opacity).toBe(1);
  expect(opening.end.opacity).toBe(1);
  expect(opening.start.x).toBeCloseTo(24, 1);
  expect(opening.start.y).toBeCloseTo(4, 1);
  expect(opening.firstBeat.x).toBeGreaterThan(opening.middle.x);
  expect(opening.firstBeat.x).toBeLessThan(opening.start.x);
  expect(opening.middle.x).toBeGreaterThan(0);
  expect(opening.end.x).toBe(0);
  expect(opening.end.y).toBe(0);
  expect(opening.start.leafAngle).toBeCloseTo(-40, 1);
  expect(opening.start.footerAngle).toBeCloseTo(80, 1);
  for (const phase of [
    opening.start,
    opening.firstBeat,
    opening.middle,
    opening.end,
  ]) {
    expect(phase.headerOpacity).toBe(1);
    expect(phase.header).toBe("none");
    expect(phase.jointGap).toBeLessThanOrEqual(2.5);
  }
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog).toHaveCSS("border-top-width", "0px");
  await expect(dialog).toHaveCSS("opacity", "1");
  const header = dialog.locator(".dm-dialog__header");
  await expect(header).toHaveCSS("opacity", "1");
  await expect(header).toHaveCSS("border-top-width", "2px");
  await expect(header).toHaveCSS("transform", "none");
  await expect(header).toHaveCSS("transition-delay", "0s");
  await expect(dialog).not.toHaveAttribute("data-folding", "true");
  await expect(dialog.locator(".dm-dialog__leaf")).toHaveCSS(
    "transform",
    "none",
  );
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  const help = dialog.getByRole("button", {
    name: "Why give it a name?",
    exact: true,
  });
  await help.tap();
  const nested = page.getByRole("dialog", {
    name: "A name is just a starting point",
    exact: true,
  });
  await expect(nested).toHaveAttribute("data-state", "open");
  await page.keyboard.press("Escape");
  await expect(nested).toBeHidden();
  await expect(dialog).toBeVisible();
  await expect(help).toBeFocused();
  await page.keyboard.press("Escape");
  const closing = await page.evaluate(
    () => (window as any).productionFoldProbe.closing,
  );
  expect(closing.duration).toBeGreaterThanOrEqual(230);
  expect(closing.duration).toBeLessThanOrEqual(250);
  expect(closing.modal).toBe(true);
  expect(closing.middle.leaf).toContain("matrix3d");
  expect(Math.abs(closing.middle.leafAngle)).toBeGreaterThan(20);
  expect(Math.abs(closing.middle.footerAngle)).toBeGreaterThan(40);
  expect(closing.start.opacity).toBe(1);
  expect(closing.firstBeat.opacity).toBe(1);
  expect(closing.middle.opacity).toBeGreaterThan(0);
  expect(closing.middle.opacity).toBeLessThan(1);
  expect(closing.foldComplete.opacity).toBeGreaterThan(0);
  expect(closing.foldComplete.opacity).toBeLessThan(closing.middle.opacity);
  expect(closing.fading.opacity).toBeGreaterThan(0);
  expect(closing.fading.opacity).toBeLessThan(closing.foldComplete.opacity);
  expect(closing.end.opacity).toBe(0);
  expect(closing.start.x).toBe(0);
  expect(closing.firstBeat.x).toBeGreaterThan(0);
  expect(closing.middle.x).toBeGreaterThan(closing.firstBeat.x);
  expect(closing.end.x).toBeCloseTo(20, 1);
  expect(closing.end.y).toBeCloseTo(4, 1);
  expect(closing.end.leafAngle).toBeCloseTo(-52, 1);
  expect(closing.end.footerAngle).toBeCloseTo(104, 1);
  for (const phase of [
    closing.start,
    closing.firstBeat,
    closing.middle,
    closing.tucked,
    closing.foldComplete,
    closing.fading,
    closing.end,
  ]) {
    expect(phase.headerOpacity).toBe(1);
    expect(phase.header).toBe("none");
    expect(phase.jointGap).toBeLessThanOrEqual(2.5);
  }
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("production reduced motion settles paper immediately and preserves dismissal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#layers");
  const card = page.locator(".layers-stage .dm-notification-card");
  await expect(card).toHaveCSS("animation-name", "none");
  await page
    .getByRole("button", { name: "Open paper popover", exact: true })
    .tap();
  const popover = page.getByRole("dialog", {
    name: "A thought in the margin",
    exact: true,
  });
  await expect(popover).toHaveAttribute("data-state", "open");
  await expect(popover).toHaveCSS("transition-duration", "0s");
  await expect(popover).toHaveCSS("transform", "none");
  await expect(
    popover.getByRole("checkbox", {
      name: "Pin this thought for later",
      exact: true,
    }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Open paper popover", exact: true })
    .focus();
  await expect(popover).toHaveAttribute("data-state", "open");
  await page.keyboard.press("Escape");
  await expect(popover).toBeHidden();
  await page
    .getByRole("button", { name: "Open layered modal", exact: true })
    .tap();
  const dialog = page.getByRole("dialog", {
    name: "A thought worth keeping",
    exact: true,
  });
  await expect(dialog).toHaveCSS("transition-duration", "0s");
  await expect(dialog).toHaveCSS("transform", "none");
  await dialog.getByRole("button", { name: "Close dialog", exact: true }).tap();
  await expect(dialog).toBeHidden();
});

test("production chevrons stay centered, rotate disclosures and preserve the native select", async ({
  page,
}) => {
  await page.goto("/#component/dropdown-menu");
  const trigger = page.locator(".playground-canvas").getByRole("button", {
    name: "Note actions",
    exact: true,
  });
  const chevron = trigger.locator(".dm-chevron");
  await expect(chevron).toHaveAttribute("data-direction", "down");
  await expect(chevron).toHaveCSS("transition-duration", "0.16s");
  const geometry = await chevron.locator("path").getAttribute("d");
  const centered = await trigger.evaluate((button) => {
    const svg = button.querySelector("svg")!;
    const shape = svg.querySelector("path")!.getBBox();
    const control = button.getBoundingClientRect();
    const icon = svg.getBoundingClientRect();
    return {
      shapeCenter: [shape.x + shape.width / 2, shape.y + shape.height / 2],
      centerDifference: Math.abs(
        (icon.top + icon.bottom - control.top - control.bottom) / 2,
      ),
    };
  });
  expect(centered.shapeCenter).toEqual([12, 12]);
  expect(centered.centerDifference).toBeLessThanOrEqual(0.5);
  await trigger.tap();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(chevron).toHaveAttribute("data-direction", "up");
  await expect
    .poll(() =>
      chevron.evaluate(
        (svg) => new DOMMatrix(getComputedStyle(svg).transform).a,
      ),
    )
    .toBe(-1);

  await page.goto("/#component/select");
  const select = page.locator(".playground-canvas select");
  const indicator = page.locator(".playground-canvas .dm-select__indicator");
  await expect(indicator).toBeVisible();
  await expect(indicator).toHaveCSS("pointer-events", "none");
  await expect(indicator.locator(".dm-chevron path")).toHaveAttribute(
    "d",
    geometry!,
  );
  await select.selectOption("ideas");
  await expect(select).toHaveValue("ideas");
  const selectCenterDifference = await select.evaluate((control) => {
    const bounds = control.getBoundingClientRect();
    const icon = control.nextElementSibling!.getBoundingClientRect();
    return Math.abs((icon.top + icon.bottom - bounds.top - bounds.bottom) / 2);
  });
  expect(selectCenterDifference).toBeLessThanOrEqual(0.5);
});

test("production handwriting animates real frames and paints a growing stroke", async ({
  page,
}) => {
  await page.goto("/#component/skeleton");
  await page.evaluate(() => document.fonts.ready);
  const loading = page.getByRole("region", { name: "Loading a journal entry" });
  const drawing = loading.locator(".dm-skeleton--circle svg");
  const path = drawing.locator(".dm-skeleton__ink path").first();
  await expect(path).toHaveCSS("animation-name", "dm-skeleton-write");
  await expect(path).toHaveCSS("stroke-dasharray", "1px");
  const initial = await path.evaluate((element) => ({
    time: Number(element.getAnimations()[0].currentTime),
    offset: getComputedStyle(element).strokeDashoffset,
  }));
  await expect
    .poll(() =>
      path.evaluate(
        (element, initial) =>
          element.getAnimations()[0].playState === "running" &&
          Number(element.getAnimations()[0].currentTime) > initial.time + 100 &&
          getComputedStyle(element).strokeDashoffset !== initial.offset,
        initial,
      ),
    )
    .toBe(true);

  // Two paused frames isolate the drawn stroke from layout and font changes.
  // Both are fully opaque; their different pixels must come from stroke growth.
  const frameAt = async (time: number) => {
    await drawing.locator(".dm-skeleton__ink path").evaluateAll(
      (paths, time) =>
        paths.forEach((element) =>
          element.getAnimations().forEach((animation) => {
            animation.pause();
            animation.currentTime = time;
          }),
        ),
      time,
    );
    await expect(path).toHaveCSS("opacity", "1");
    return {
      offset: await path.evaluate((element) =>
        parseFloat(getComputedStyle(element).strokeDashoffset),
      ),
      pixels: await drawing.screenshot(),
    };
  };
  const early = await frameAt(800);
  const later = await frameAt(1600);
  expect(early.offset).toBeGreaterThan(0.5);
  expect(later.offset).toBeLessThan(0.1);
  expect(early.pixels.equals(later.pixels)).toBe(false);
  await expect(loading.locator(".dm-skeleton--circle")).toHaveCSS(
    "height",
    "42px",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("production reduced motion keeps finished handwriting and a static block", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#component/skeleton");
  const paths = page.locator(".dm-skeleton__ink path");
  expect(await paths.count()).toBeGreaterThan(0);
  const finished = await paths.evaluateAll((elements) =>
    elements.every((element) => {
      const style = getComputedStyle(element);
      return (
        style.animationName === "none" &&
        parseFloat(style.strokeDashoffset) === 0 &&
        style.opacity === "1"
      );
    }),
  );
  expect(finished).toBe(true);
  await expect(page.locator(".dm-skeleton--block")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".dm-skeleton--block")).toHaveCSS(
    "background-image",
    /linear-gradient/,
  );
});

test("production garden tasks retain their drawn check and text strike", async ({
  page,
}) => {
  await page.goto("/#component/task-checkbox");
  const task = page.locator(".playground-canvas .dm-task-checkbox").first();
  const input = task.getByRole("checkbox");
  const text = task.locator(".dm-task-checkbox__text");
  await expect(input).toHaveCSS("appearance", "none");
  await expect(input).toHaveCSS("border-top-left-radius", "3px");
  await expect(text).toHaveCSS("transition-duration", "0.28s, 0.28s");
  await expect(text).toHaveCSS("background-size", "0% 1.5px");
  await input.check();
  const check = await input.evaluate((element) => {
    const style = getComputedStyle(element, "::after");
    return { animation: style.animationName, mask: style.maskImage };
  });
  expect(check.animation).toBe("dm-task-check");
  expect(check.mask).toContain("data:image/svg+xml");
  expect(check.mask).toContain("Q6");
  await expect(text).toHaveCSS("background-size", "100% 1.5px");
  await expect(task.locator(".dm-task-checkbox__description")).toHaveCSS(
    "background-image",
    "none",
  );
});

test("production switches use the spring and settle at their native state", async ({
  page,
}) => {
  await page.goto("/#component/switch");
  const control = page
    .locator(".playground-canvas")
    .getByRole("switch", { name: "Quiet motion", exact: true });
  const track = control.locator("..").locator(".dm-switch__track");
  const thumb = () =>
    track.evaluate((element) => {
      const style = getComputedStyle(element, "::after");
      return {
        duration: style.transitionDuration,
        easing: style.transitionTimingFunction,
        x: new DOMMatrixReadOnly(style.transform).m41,
      };
    });
  expect((await thumb()).duration).toContain("0.36s");
  expect((await thumb()).easing).toContain("cubic-bezier(0.34, 1.4, 0.64, 1)");
  expect((await thumb()).x).toBe(0);
  await control.locator("..").click();
  await expect(control).toBeChecked();
  await expect.poll(async () => (await thumb()).x).toBe(16);
});

test("production mobile menu strokes morph into a close mark", async ({
  page,
}) => {
  await page.goto("/#component/menu-toggle");
  const toggle = page.locator(".playground-canvas .dm-menu-toggle");
  await expect(toggle).toHaveAccessibleName("Open example navigation");
  const top = toggle.locator(".dm-menu-toggle__top");
  const middle = toggle.locator(".dm-menu-toggle__middle");
  await expect(toggle).toHaveCSS("min-height", "44px");
  await expect(top).toHaveCSS("transition-duration", "0.36s, 0.36s");
  await expect(top).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, -6)");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(toggle).toHaveAccessibleName("Close example navigation");
  await expect(middle).toHaveCSS("opacity", "0");
  const rotation = await top.evaluate((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI);
  });
  expect(rotation).toBeCloseTo(45, 1);
  await expect(
    page.getByRole("navigation", { name: "Example notebook navigation" }),
  ).toBeVisible();
});

test("production haptics scopes retain the ink and native switch appearance", async ({
  page,
}) => {
  await page.goto("/#haptics");
  await expect(page.locator("[data-domino-haptics]")).toHaveCSS(
    "display",
    "contents",
  );
  await expect(page.locator(".dm-touch-feedback-setting")).toHaveCSS(
    "display",
    "flex",
  );
  const control = page.getByLabel("Native switch example", { exact: true });
  await expect(control).toHaveAttribute("switch", "");
  await expect(control).toHaveCSS("width", "40px");
  await expect(control).toHaveCSS("height", "24px");
  await expect
    .poll(() =>
      control.evaluate((element) => {
        const native = "switch" in document.createElement("input");
        return (
          element.classList.contains("dm-ink-switch--native") === native &&
          getComputedStyle(element).appearance === (native ? "auto" : "none")
        );
      }),
    )
    .toBe(true);
});

test("production sketch modules retain visible pen strokes, drawing frames, and real Hairline response", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  await page.evaluate(() => document.fonts.ready);
  const originals = page.locator(".sketchbook-originals .dm-notebook-sketch");
  const figures = page.locator(".sketchbook-hairline .dm-hairline");
  await expect(originals).toHaveCount(6);
  await expect(figures).toHaveCount(3);
  const first = originals.first().locator(".dm-notebook-sketch-line").first();
  await expect(first).toHaveCSS("animation-name", "dm-notebook-sketch-draw");
  await expect(first).toHaveCSS("fill", "none");
  await expect(first).toHaveCSS("vector-effect", "non-scaling-stroke");
  const frame = async (time: number) => {
    await originals
      .first()
      .locator(".dm-notebook-sketch-line")
      .evaluateAll(
        (paths, time) =>
          paths.forEach((path) =>
            path.getAnimations().forEach((animation) => {
              animation.pause();
              animation.currentTime = time;
            }),
          ),
        time,
      );
    return originals.first().screenshot();
  };
  const beginning = await frame(0);
  const complete = await frame(8000);
  expect(beginning.equals(complete)).toBe(false);
  const replay = page
    .locator(".sketchbook-originals button.dm-sketch-replay")
    .first();
  const replayBefore = await originals.first().getAttribute("data-replay");
  await expect(replay).toHaveAccessibleName(/^Replay .+/);
  await replay.tap();
  await expect(originals.first()).not.toHaveAttribute(
    "data-replay",
    replayBefore!,
  );
  await expect
    .poll(() =>
      first.evaluate(
        (path) =>
          path
            .getAnimations()
            .some((animation) => animation.playState === "running") &&
          parseFloat(getComputedStyle(path).strokeDashoffset) > 0,
      ),
    )
    .toBe(true);

  for (const theme of ["Hybrid", "Dark"]) {
    await page
      .locator(".topbar")
      .getByRole("button", { name: `${theme} theme`, exact: true })
      .click();
    for (const figure of await figures.all()) {
      await expect(figure.locator("svg")).toHaveAttribute(
        "viewBox",
        "0 0 400 320",
      );
      const ink = await figure
        .locator("svg path, svg line, svg ellipse")
        .evaluateAll((elements) =>
          elements
            .map((element) => {
              const css = getComputedStyle(element);
              return {
                stroke: css.stroke,
                width: parseFloat(css.strokeWidth),
                vector: css.vectorEffect,
                fill: css.fill,
              };
            })
            .filter((style) => style.stroke !== "none"),
        );
      expect(ink.length).toBeGreaterThan(3);
      expect(
        ink.every(
          (style) =>
            style.stroke !== "rgb(0, 0, 0)" &&
            style.fill !== "rgb(0, 0, 0)" &&
            style.width > 0 &&
            style.width <= 1.5 &&
            style.vector === "non-scaling-stroke",
        ),
      ).toBe(true);
    }
  }
  const loupe = page.locator(
    '.sketchbook-hairline .dm-hairline[data-variant="loupe"]',
  );
  const hairlineReplay = page
    .locator(".sketchbook-hairline button.dm-sketch-replay")
    .last();
  const beforeHairlineReplay = await loupe.getAttribute("data-replay");
  await hairlineReplay.tap();
  await expect(loupe).not.toHaveAttribute("data-replay", beforeHairlineReplay!);
  await expect(loupe).toHaveAttribute("data-autoplay", "false");
  await expect
    .poll(() =>
      loupe.evaluate((element) =>
        element
          .getAnimations({ subtree: true })
          .some(
            (animation) =>
              animation instanceof CSSAnimation &&
              animation.animationName.startsWith("dm-hairline") &&
              animation.playState === "running",
          ),
      ),
    )
    .toBe(true);
  const clips = await loupe.evaluate((element) => {
    const animation = element
      .getAnimations({ subtree: true })
      .find(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName.startsWith("dm-hairline"),
      )!;
    const effect = animation.effect as KeyframeEffect;
    const target = effect.target!;
    animation.pause();
    animation.currentTime = 0;
    const beginning = getComputedStyle(target).clipPath;
    animation.currentTime = Number(effect.getTiming().duration) + 1;
    return { beginning, complete: getComputedStyle(target).clipPath };
  });
  expect(clips.beginning).not.toEqual(clips.complete);
  await loupe.scrollIntoViewIfNeeded();
  const shape = () =>
    loupe
      .locator("svg path")
      .evaluateAll((paths) => paths.map((path) => path.getAttribute("d")));
  const initial = await shape();
  const bounds = (await loupe.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width * 0.75,
    bounds.y + bounds.height * 0.35,
  );
  await expect.poll(shape).not.toEqual(initial);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("production quiet and reduced motion keep finished original and Hairline sketches still", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  const quiet = page.getByRole("switch", {
    name: "Quiet sketches",
    exact: true,
  });
  await quiet.locator("..").click();
  await expect(quiet).toBeChecked();
  const originals = page.locator(".sketchbook-originals .dm-notebook-sketch");
  const figures = page.locator(".sketchbook-hairline .dm-hairline");
  const finished = async () => {
    for (const replay of await page.locator("button.dm-sketch-replay").all())
      await expect(replay).toBeDisabled();
    const paths = originals.locator(".dm-notebook-sketch-line");
    expect(await paths.count()).toBeGreaterThan(3);
    expect(
      await paths.evaluateAll((elements) =>
        elements.every((element) => {
          const css = getComputedStyle(element);
          return (
            css.animationName === "none" &&
            parseFloat(css.strokeDashoffset) === 0
          );
        }),
      ),
    ).toBe(true);
    for (const figure of await figures.all()) {
      await expect(figure).toHaveAttribute("data-active", "false");
      await expect(figure).toHaveAttribute("data-autoplay", "false");
      await expect(figure.locator(".dm-hairline__figure")).toHaveAttribute(
        "inert",
        "",
      );
      await expect(figure.locator(".dm-hairline__figure")).toHaveCSS(
        "pointer-events",
        "none",
      );
    }
  };
  await finished();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await quiet.locator("..").click();
  await expect(quiet).not.toBeChecked();
  await finished();
  const loupe = page.locator(
    '.sketchbook-hairline .dm-hairline[data-variant="loupe"]',
  );
  await loupe.scrollIntoViewIfNeeded();
  const shape = () =>
    loupe
      .locator("svg path")
      .evaluateAll((paths) => paths.map((path) => path.getAttribute("d")));
  const initial = await shape();
  await loupe.hover({ position: { x: 30, y: 30 } });
  await page.waitForTimeout(350);
  expect(await shape()).toEqual(initial);
});

test("production native switch targets stay in the paper popover top layer", async ({
  page,
}) => {
  // Feature emulation validates trusted touch routing, not a physical motor pulse.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(HTMLInputElement.prototype, "switch", {
      configurable: true,
      get() {
        return this.hasAttribute("switch");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#layers");
  const trigger = page.getByRole("button", {
    name: "Open paper popover",
    exact: true,
  });
  await trigger.evaluate((button) => {
    (window as any).productionLayerActions = { opens: 0, closes: 0 };
    button.addEventListener(
      "click",
      () => (window as any).productionLayerActions.opens++,
    );
  });
  const tapEnhanced = async (control: import("@playwright/test").Locator) => {
    await control.scrollIntoViewIfNeeded();
    const rect = (await control.boundingBox())!;
    const point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    await expect
      .poll(() =>
        page.evaluate(
          ({ x, y }) =>
            document
              .elementFromPoint(x, y)
              ?.classList.contains("dm-native-tap-target"),
          point,
        ),
      )
      .toBe(true);
    await page.touchscreen.tap(point.x, point.y);
  };
  await tapEnhanced(trigger);
  const popover = page.getByRole("dialog", {
    name: "A thought in the margin",
    exact: true,
  });
  await expect(popover).toHaveAttribute("data-state", "open");
  await expect(popover).toHaveCSS("opacity", "1");
  const close = popover.getByRole("button", {
    name: "Close popover",
    exact: true,
  });
  await close.evaluate((button) =>
    button.addEventListener(
      "click",
      () => (window as any).productionLayerActions.closes++,
    ),
  );
  const closeTarget = page.locator(
    '.dm-native-tap-target[data-native-tap-label="Close popover"]',
  );
  await expect(closeTarget).toHaveCount(1);
  expect(
    await closeTarget.evaluate((input) =>
      input.closest("[popover]")?.matches(":popover-open"),
    ),
  ).toBe(true);
  await tapEnhanced(close);
  await expect(popover).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(closeTarget).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as any).productionLayerActions),
  ).toEqual({ opens: 1, closes: 1 });
  expect(errors).toEqual([]);
});

test("production route transitions capture only the content sheet and keep reduced-motion routing immediate", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const browser = window as ProductionRoutingWindow;
    browser.productionRouteTransitions = [];
    browser.productionRouteSnapshots = [];
    const start = document.startViewTransition;
    if (!start) return;
    // Keep the actual browser capture; observe only its returned lifecycle.
    document.startViewTransition = function (update) {
      const transition = start.call(this, update);
      browser.productionRouteTransitions.push(transition);
      // Capture styles in the ready microtask, before finished removes the
      // temporary scope. Later test IPC reads this stored capture, not live CSS.
      const snapshot = transition.ready.then(() => ({
        count: browser.productionRouteTransitions.length,
        root: getComputedStyle(document.documentElement).viewTransitionName,
        sheet: getComputedStyle(document.querySelector(".dm-page-transition")!)
          .viewTransitionName,
        rail: getComputedStyle(document.querySelector(".sidebar")!)
          .viewTransitionName,
        marked: document.documentElement.hasAttribute(
          "data-dm-page-transition",
        ),
      }));
      browser.productionRouteSnapshots.push(snapshot);
      void snapshot.catch(() => {});
      return transition;
    };
  });
  await page.goto("/#overview");
  const supported = await page.evaluate(
    () => typeof document.startViewTransition === "function",
  );
  // A real hash navigation exercises the same event path as a route link while
  // avoiding the mobile drawer, whose own animation intentionally takes priority.
  await page.evaluate(() => {
    location.hash = "colors";
  });
  await expect(
    page.getByRole("heading", { name: "Color & themes.", exact: true }),
  ).toBeVisible();
  if (supported) {
    const snapshot = await page.evaluate(
      () => (window as ProductionRoutingWindow).productionRouteSnapshots[0],
    );
    expect(snapshot).toEqual({
      count: 1,
      root: "none",
      sheet: "dm-page-content",
      rail: "none",
      marked: true,
    });
    await page.evaluate(async () => {
      await (
        window as Window & { productionRouteTransitions: ViewTransition[] }
      ).productionRouteTransitions.at(-1)!.finished;
    });
  }
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-dm-page-transition",
  );
  await page.goBack();
  await expect(page).toHaveURL(/#overview$/);
  await expect(page.locator(".overview-hero")).toBeVisible();
  if (supported) {
    await page.evaluate(async () => {
      await (
        window as Window & { productionRouteTransitions: ViewTransition[] }
      ).productionRouteTransitions.at(-1)!.finished;
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  const countBefore = await page.evaluate(
    () =>
      (window as Window & { productionRouteTransitions: ViewTransition[] })
        .productionRouteTransitions.length,
  );
  await page.evaluate(() => {
    location.hash = "typography";
  });
  await expect(
    page.getByRole("heading", { name: "Words with character.", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        (window as Window & { productionRouteTransitions: ViewTransition[] })
          .productionRouteTransitions.length,
    ),
  ).toBe(countBefore);
  await expect(page.locator("html")).not.toHaveAttribute(
    "data-dm-page-transition",
  );
  expect(errors).toEqual([]);
});
