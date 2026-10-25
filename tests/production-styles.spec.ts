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
  expect(await oldPath!.evaluate((path) => path.isConnected)).toBe(true);
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

test("production PolaroidStack paints real slide-and-tuck frames and cleans up", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1200 });
  await page.goto("/#component/polaroid-stack");
  await page.evaluate(() => document.fonts.ready);
  const stack = page.locator(".polaroid-demo .dm-polaroid-stack");
  const surface = stack.locator(".dm-polaroid-stack__surface");
  const current = () =>
    stack.locator('.dm-polaroid-stack__photo[data-current="true"]');
  await expect(stack).toHaveAttribute("data-index", "0");
  await expect(stack.locator(".dm-polaroid-stack__photo img")).toHaveCount(2);
  await expect(stack.locator(".dm-polaroid-stack__back")).toHaveCount(0);
  await expect(surface).toHaveAttribute("data-native-tap", "none");
  await expect(surface).toHaveCSS("touch-action", "pan-y pinch-zoom");
  await page
    .getByRole("button", { name: "Add a sample print", exact: true })
    .tap();
  await expect(stack.locator(".dm-polaroid-stack__photo img")).toHaveCount(3);
  await expect(surface).toHaveAttribute("aria-label", /Showing photo 1 of 3/);
  await stack.getByRole("button", { name: "Next photo", exact: true }).tap();
  await expect(stack).toHaveAttribute("data-index", "1");
  await expect(stack).toHaveAttribute("data-state", "idle");
  for (const direction of ["previous", "next"] as const) {
    await assertPolaroidPaintOutsideStack(page, stack, direction);
  }
  await surface.focus();
  const stableSurface = await surface.elementHandle();
  await page.keyboard.press("ArrowRight");
  await expect(stack).toHaveAttribute("data-index", "2");
  await expect(stack).toHaveAttribute("data-state", "idle");
  await expect(current()).toHaveAttribute("data-photo-id", "notebook-print");
  await expect(current().locator("img")).toHaveAttribute(
    "src",
    /social-cover\.png$/,
  );
  await expect(surface).toBeFocused();
  expect(
    await surface.evaluate(
      (button, original) => button === original,
      stableSurface,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Reset photo stack", exact: true })
    .tap();
  await expect(stack).toHaveAttribute("data-index", "0");
  await expect(stack.locator(".dm-polaroid-stack__photo img")).toHaveCount(2);
  await expect(
    stack.locator(".dm-polaroid-stack__photo--outgoing"),
  ).toHaveCount(0);
});

test("production PolaroidStack quiet and reduced motion preserve wrapping and keyboard use", async ({
  page,
}) => {
  await page.goto("/#component/polaroid-stack");
  const stack = page.locator(".polaroid-demo .dm-polaroid-stack");
  const surface = stack.locator(".dm-polaroid-stack__surface");
  const current = () =>
    stack.locator('.dm-polaroid-stack__photo[data-current="true"]');
  const quiet = page.getByRole("switch", {
    name: "Quiet stack motion",
    exact: true,
  });
  await quiet.locator("..").tap();
  await expect(quiet).toBeChecked();
  await surface.tap();
  await expect(stack).toHaveAttribute("data-index", "1");
  await expect(stack).toHaveAttribute("data-state", "idle");
  await expect(current()).toHaveCSS("animation-name", "none");
  await expect(current()).toHaveCSS("transition-duration", "0s");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await quiet.locator("..").tap();
  await expect(quiet).not.toBeChecked();
  await surface.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(stack).toHaveAttribute("data-index", "0");
  await expect(stack).toHaveAttribute("data-state", "idle");
  await expect(current()).toHaveCSS("transition-duration", "0s");
  await current()
    .locator(".dm-polaroid-stack__caption")
    .evaluate((caption) => {
      caption.textContent =
        "A longer handwritten caption with enough room for curiosity and averylongunbrokenwordthatmuststillwrap.";
      (caption as HTMLElement).style.fontSize = "36px";
    });
  for (const viewport of [
    { width: 320, height: 844 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await surface.scrollIntoViewIfNeeded();
    const caption = current().locator(".dm-polaroid-stack__caption");
    expect(
      await caption.evaluate(
        (element) => element.scrollWidth <= element.clientWidth + 1,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

async function assertPolaroidPaintOutsideStack(
  page: import("@playwright/test").Page,
  stack: import("@playwright/test").Locator,
  direction: "next" | "previous",
) {
  await stack.evaluate((element) =>
    element.scrollIntoView({ block: "center", inline: "center" }),
  );
  const capture = await stack
    .getByRole("button", {
      name: direction === "next" ? "Next photo" : "Previous photo",
      exact: true,
    })
    .evaluate(async (button) => {
      button.click();
      await new Promise(requestAnimationFrame);
      const root = button.closest(".dm-polaroid-stack")!;
      const outgoing = root.querySelector<HTMLElement>(
        ".dm-polaroid-stack__photo--outgoing",
      )!;
      const animations = root.getAnimations({ subtree: true });
      for (const animation of animations) animation.pause();
      const excursion = outgoing
        .getAnimations()
        .find(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.animationName === "dm-polaroid-cycle",
        )!;
      const duration = Number(excursion.effect!.getTiming().duration);
      const sample = (time: number) => {
        excursion.currentTime = time;
        const style = getComputedStyle(outgoing);
        const matrix = new DOMMatrixReadOnly(style.transform);
        return { x: matrix.m41, y: matrix.m42, z: Number(style.zIndex) };
      };
      const departure = sample(0);
      const tuck = sample(duration - 1);
      excursion.currentTime = duration * 0.48;
      await new Promise(requestAnimationFrame);
      const image = outgoing.querySelector("img")!;
      const imageBox = image.getBoundingClientRect();
      const rootBox = root.getBoundingClientRect();
      const cardBox = outgoing.getBoundingClientRect();
      const matrix = new DOMMatrixReadOnly(
        getComputedStyle(outgoing).transform,
      );
      const previousPointer = outgoing.style.pointerEvents;
      const previousVisibility = outgoing.style.visibility;
      // A test-only pointer-events override exposes the painted card to hit testing;
      // it does not change its geometry, stacking, or any ancestor's clipping.
      outgoing.style.pointerEvents = "auto";
      const points = [-0.3, 0, 0.3].map((offset) => {
        const x =
          imageBox.x +
          imageBox.width / 2 +
          matrix.m11 * image.clientWidth * offset;
        const y =
          imageBox.y +
          imageBox.height / 2 +
          matrix.m12 * image.clientWidth * offset;
        const hit = document.elementFromPoint(x, y);
        return {
          x,
          y,
          paintedHit: !!hit && outgoing.contains(hit),
          outsideStack: x < rootBox.left || x > rootBox.right,
          hitClass: hit?.className,
        };
      });
      (window as any).polaroidPaintControl = {
        animations,
        excursion,
        outgoing,
        previousPointer,
        previousVisibility,
      };
      return {
        duration,
        departure,
        tuck,
        away: { x: matrix.m41, y: matrix.m42 },
        points,
        root: rootBox.toJSON(),
        card: cardBox.toJSON(),
        width: innerWidth,
        height: innerHeight,
        index: root.getAttribute("data-index"),
      };
    });
  expect(capture.duration).toBe(480);
  if (direction === "next")
    expect(capture.away.x).toBeLessThan(capture.departure.x - 50);
  else expect(capture.away.x).toBeGreaterThan(capture.departure.x + 50);
  expect(Math.hypot(capture.tuck.x, capture.tuck.y)).toBeLessThan(50);
  expect(capture.tuck.z).toBeLessThan(capture.departure.z);
  expect(capture.card.left).toBeGreaterThanOrEqual(0);
  expect(capture.card.right).toBeLessThanOrEqual(capture.width);
  expect(capture.card.top).toBeGreaterThanOrEqual(0);
  expect(capture.card.bottom).toBeLessThanOrEqual(capture.height);
  for (const point of capture.points) {
    expect(point.outsideStack, JSON.stringify(capture)).toBe(true);
    expect(point.paintedHit, JSON.stringify(capture)).toBe(true);
  }
  const farPoint = direction === "next" ? capture.points[0] : capture.points[2];
  const clip = {
    x: Math.floor(farPoint.x - 8),
    y: Math.floor(farPoint.y - 8),
    width: 16,
    height: 16,
  };
  const painted = await page.screenshot({ clip, animations: "allow" });
  await page.evaluate(() => {
    (window as any).polaroidPaintControl.outgoing.style.visibility = "hidden";
  });
  const withoutCard = await page.screenshot({ clip, animations: "allow" });
  expect(
    painted.equals(withoutCard),
    "The outgoing image must paint outside the stack's layout box.",
  ).toBe(false);
  await page.evaluate(() => {
    const state = (window as any).polaroidPaintControl;
    state.outgoing.style.visibility = state.previousVisibility;
    state.outgoing.style.pointerEvents = state.previousPointer;
  });
  await stack.getByRole("button", { name: "Next photo", exact: true }).click();
  await expect(stack).toHaveAttribute("data-index", capture.index!);
  await page.evaluate(async () => {
    const state = (window as any).polaroidPaintControl;
    state.excursion.currentTime =
      Number(state.excursion.effect.getTiming().duration) - 10;
    for (const animation of state.animations) animation.play();
    await Promise.allSettled(
      state.animations.map((animation: Animation) => animation.finished),
    );
  });
  await expect(stack).toHaveAttribute("data-state", "idle");
  await expect(
    stack.locator(".dm-polaroid-stack__photo--outgoing"),
  ).toHaveCount(0);
}

test("production Timeline retains drawing CSS, paints connector growth and replays without remounting", async ({
  page,
}) => {
  await page.goto("/#component/timeline");
  await page.evaluate(() => document.fonts.ready);
  const timeline = page.locator(
    ".playground-canvas .timeline-demo .dm-timeline",
  );
  await timeline.scrollIntoViewIfNeeded();
  await expect(timeline).toHaveRole("list");
  await expect(timeline.getByRole("listitem")).toHaveCount(3);
  await expect(timeline.getByRole("heading", { level: 3 })).toHaveCount(3);
  await expect(timeline).toHaveAttribute("data-state", "finished");
  const originalList = await timeline.elementHandle();
  const firstItem = timeline.getByRole("listitem").first();
  const originalItem = await firstItem.elementHandle();
  const previous = await timeline.getAttribute("data-replay");
  const replay = page.getByRole("button", {
    name: "Replay timeline",
    exact: true,
  });
  await replay.focus();
  await replay.press("Enter");
  await expect(timeline).not.toHaveAttribute("data-replay", previous!);
  await expect(timeline).toHaveAttribute("data-state", "running");
  const line = timeline.locator(".dm-timeline__line").first();
  const connector = timeline.locator(".dm-timeline__connector").first();
  await expect(line).toHaveCSS("fill", "none");
  await expect(line).toHaveCSS("stroke-width", "1.5px");
  expect(await line.evaluate((path) => getComputedStyle(path).stroke)).not.toBe(
    "rgb(0, 0, 0)",
  );
  const timing = await timeline.evaluate((root) => {
    const animations = root.getAnimations({ subtree: true });
    for (const animation of animations) animation.pause();
    const path = root.querySelector(".dm-timeline__line")!;
    const connector = path
      .getAnimations()
      .find(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName === "dm-timeline-connector",
      )!;
    (window as any).timelineProductionAnimations = animations;
    (window as any).timelineProductionConnector = connector;
    return {
      duration: connector.effect!.getTiming().duration,
      delay: connector.effect!.getTiming().delay,
    };
  });
  expect(timing.duration).toBe(480);
  expect(timing.delay).toBe(120);
  const frame = async (fraction: number) => {
    await page.evaluate((fraction) => {
      const animation = (window as any).timelineProductionConnector;
      const timing = animation.effect.getTiming();
      animation.currentTime = timing.delay + Number(timing.duration) * fraction;
    }, fraction);
    return {
      offset: await line.evaluate((path) =>
        parseFloat(getComputedStyle(path).strokeDashoffset),
      ),
      pixels: await connector.screenshot({ animations: "allow" }),
    };
  };
  const early = await frame(0.1),
    complete = await frame(0.99);
  expect(early.offset).toBeGreaterThan(complete.offset + 0.5);
  expect(early.pixels.equals(complete.pixels)).toBe(false);
  await page.evaluate(async () => {
    const animations: Animation[] = (window as any)
      .timelineProductionAnimations;
    for (const animation of animations) {
      const timing = animation.effect!.getTiming();
      animation.currentTime =
        Number(timing.delay) + Number(timing.duration) - 1;
      animation.play();
    }
    await Promise.allSettled(animations.map((animation) => animation.finished));
  });
  await expect(timeline).toHaveAttribute("data-state", "finished");
  await expect(replay).toBeFocused();
  expect(
    await timeline.evaluate(
      (element, saved) => element === saved,
      originalList,
    ),
  ).toBe(true);
  expect(
    await firstItem.evaluate(
      (element, saved) => element === saved,
      originalItem,
    ),
  ).toBe(true);
});

test("production Timeline quiet and reduced motion keep milestones readable and responsive", async ({
  page,
}) => {
  await page.goto("/#component/timeline");
  const timeline = page.locator(
    ".playground-canvas .timeline-demo .dm-timeline",
  );
  const replay = page.getByRole("button", {
    name: "Replay timeline",
    exact: true,
  });
  const quiet = page.getByRole("switch", {
    name: "Quiet timeline motion",
    exact: true,
  });
  await quiet.locator("..").tap();
  await expect(quiet).toBeChecked();
  await expect(timeline).toHaveAttribute("data-state", "finished");
  await expect(replay).toBeDisabled();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await quiet.locator("..").tap();
  await expect(quiet).not.toBeChecked();
  await expect(timeline).toHaveAttribute("data-state", "finished");
  await expect(replay).toBeDisabled();
  for (const content of await timeline.locator(".dm-timeline__content").all()) {
    await expect(content).toHaveCSS("opacity", "1");
    await expect(content).toHaveCSS("transform", "none");
  }
  for (const path of await timeline
    .locator(".dm-timeline__line, .dm-timeline__node-ink")
    .all()) {
    await expect(path).toHaveCSS("animation-name", "none");
    await expect(path).toHaveCSS("stroke-dashoffset", "0px");
  }
  await timeline
    .locator(".dm-timeline__title")
    .first()
    .evaluate((heading) => {
      heading.textContent =
        "A much longer heading and averylongunbrokentitlethatmuststillwrapnaturally.";
      (heading as HTMLElement).style.fontSize = "34px";
    });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await timeline.scrollIntoViewIfNeeded();
    for (const element of await timeline
      .locator(
        ".dm-timeline__content, .dm-timeline__meta, .dm-timeline__title, .dm-timeline__description",
      )
      .all())
      expect(
        await element.evaluate(
          (node) => node.scrollWidth <= node.clientWidth + 1,
        ),
      ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(timeline.getByRole("heading", { level: 3 })).toHaveCount(3);
});

async function paperPaintMasks(page: import("@playwright/test").Page) {
  const paper = page.locator(".playground-canvas .dm-paper");
  await paper.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await expect(paper.locator(".dm-paper__rules")).toHaveAttribute(
    "data-rules-ready",
    "true",
  );
  await page.evaluate(() => {
    document.querySelector("#compiled-paper-mask")?.remove();
    const style = document.createElement("style");
    style.id = "compiled-paper-mask";
    document.head.append(style);
    (window as any).compiledPaperMask = style.sheet;
  });
  const capture = async (ink: boolean, rules: boolean) => {
    await page.evaluate(
      ({ ink, rules }) => {
        const sheet: CSSStyleSheet = (window as any).compiledPaperMask;
        while (sheet.cssRules.length) sheet.deleteRule(0);
        if (!ink)
          sheet.insertRule(
            ".playground-canvas .dm-paper, .playground-canvas .dm-paper * { -webkit-text-fill-color: transparent !important; text-shadow: none !important; text-decoration-color: transparent !important; }",
          );
        if (!rules)
          sheet.insertRule(
            ".playground-canvas .dm-paper__rules { visibility:hidden !important; }",
          );
      },
      { ink, rules },
    );
    return (await paper.screenshot({ animations: "disabled" })).toString(
      "base64",
    );
  };
  const blank = await capture(false, false),
    ink = await capture(true, false),
    rules = await capture(false, true);
  const result = await page.evaluate(
    async ({ blank, ink, rules }) => {
      async function decode(data: string) {
        const image = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${data}`)).blob(),
        );
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d")!;
        context.drawImage(image, 0, 0);
        return {
          width: image.width,
          height: image.height,
          data: context.getImageData(0, 0, image.width, image.height).data,
        };
      }
      const [base, text, lines] = await Promise.all([
        decode(blank),
        decode(ink),
        decode(rules),
      ]);
      let inkPixels = 0,
        rulePixels = 0,
        intersections = 0;
      for (let y = 4; y < base.height - 4; y++)
        for (let x = 4; x < base.width - 4; x++) {
          const offset = (y * base.width + x) * 4;
          const differs = (pixels: Uint8ClampedArray) =>
            [0, 1, 2].some(
              (channel) =>
                Math.abs(
                  pixels[offset + channel] - base.data[offset + channel],
                ) >= 5,
            );
          const hasInk = differs(text.data),
            hasRule = differs(lines.data);
          if (hasInk) inkPixels++;
          if (hasRule) rulePixels++;
          if (hasInk && hasRule) intersections++;
        }
      return { inkPixels, rulePixels, intersections };
    },
    { blank, ink, rules },
  );
  await page.evaluate(() => {
    const sheet: CSSStyleSheet = (window as any).compiledPaperMask;
    while (sheet.cssRules.length) sheet.deleteRule(0);
  });
  expect(result.inkPixels).toBeGreaterThan(100);
  expect(result.rulePixels).toBeGreaterThan(100);
  expect(result.intersections).toBe(0);
}

test("production ruled Paper keeps real rule paint clear of heading and wrapped prose in both placements", async ({
  page,
}) => {
  await page.goto("/#component/paper");
  await page.evaluate(() => document.fonts.ready);
  const paper = page.locator(".playground-canvas .dm-paper");
  await paper.scrollIntoViewIfNeeded();
  await expect(
    paper.getByRole("heading", { name: "A place to begin" }),
  ).toBeVisible();
  await paperPaintMasks(page);
  const original = await paper.elementHandle();
  for (const align of ["baseline", "between"]) {
    await page
      .getByRole("combobox", { name: "Rule placement", exact: true })
      .selectOption(align);
    await expect(paper).toHaveAttribute("data-rule-align", align);
    for (const padding of ["sm", "lg", "md"]) {
      await page
        .getByRole("combobox", { name: "Paper padding", exact: true })
        .selectOption(padding);
      await expect(paper).toHaveClass(new RegExp(`dm-paper--${padding}`));
      await expect(paper.locator(".dm-paper__rules")).toHaveAttribute(
        "data-rules-ready",
        "true",
      );
      expect(
        await paper.locator(".dm-paper__rules").getAttribute("data-rule-rows"),
      ).not.toBe("");
    }
  }
  expect(
    await paper.evaluate((element, saved) => element === saved, original),
  ).toBe(true);
  await paperPaintMasks(page);
});

test("production ruled Paper remeasures larger fonts, zoom and narrow wrapped text", async ({
  page,
}) => {
  await page.goto("/#component/paper");
  await page.evaluate(() => document.fonts.ready);
  const paper = page.locator(".playground-canvas .dm-paper");
  await paper.locator("h3").evaluate((heading) => {
    heading.textContent =
      "Growing typography and a much larger thought with gypqj descenders";
    heading.style.fontSize = "37px";
    heading.style.fontFamily = '"Kalam", cursive';
    heading.style.fontWeight = "700";
  });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await paper.scrollIntoViewIfNeeded();
    await paperPaintMasks(page);
  }
  await paper.evaluate((element) => {
    element.style.zoom = "1.25";
  });
  await paperPaintMasks(page);
  await expect(paper.getByRole("heading")).toHaveCount(1);
  await expect(paper.locator("p")).toHaveCount(2);
  expect(
    await paper.evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).toBe(true);
});

test("production icon squares and drawn choices retain their native behavior", async ({
  page,
}) => {
  await page.goto("/#component/icon-button");
  const icons = page.locator(".playground-canvas .dm-icon-button");
  await expect(icons).toHaveCount(3);
  for (const button of await icons.all()) {
    const geometry = await button.evaluate((element) => {
      const button = element.getBoundingClientRect();
      const glyph = element.querySelector("svg")!.getBoundingClientRect();
      return {
        width: button.width,
        height: button.height,
        dx: Math.abs(button.x + button.width / 2 - glyph.x - glyph.width / 2),
        dy: Math.abs(button.y + button.height / 2 - glyph.y - glyph.height / 2),
      };
    });
    expect(geometry.width).toBe(44);
    expect(geometry.height).toBe(44);
    expect(geometry.dx).toBeLessThan(0.6);
    expect(geometry.dy).toBeLessThan(0.6);
  }
  await page.goto("/#component/checkbox");
  const choice = page.getByRole("checkbox", {
    name: "Try something a little different",
    exact: true,
  });
  await choice.check();
  await expect(choice).toBeChecked();
  await expect
    .poll(() =>
      choice.evaluate(
        (element) => getComputedStyle(element, "::after").clipPath,
      ),
    )
    .toBe("inset(0px)");
  const box = await choice.evaluate((element) => ({
    radius: getComputedStyle(element).borderRadius,
    mask: getComputedStyle(element, "::after").maskImage,
  }));
  expect(box.radius).not.toBe("0px");
  expect(box.mask).toContain("svg");
  expect(
    await choice
      .locator("..")
      .locator(".dm-choice__label")
      .evaluate((element) => getComputedStyle(element).textDecorationLine),
  ).toBe("none");
  await choice.focus();
  await page.keyboard.press("Space");
  await expect(choice).not.toBeChecked();
});

test("production radio color blooms then settles and quiet motion remains static", async ({
  page,
}) => {
  await page.goto("/#component/radio-group");
  const group = page.locator(".playground-canvas .dm-radio-group");
  const quick = group.getByRole("radio", {
    name: "Just a quick look",
    exact: true,
  });
  await quick.tap();
  await expect(quick).toBeChecked();
  const bloom = await quick.evaluate((element) => {
    const animation = element
      .getAnimations({ subtree: true })
      .find(
        (animation) =>
          animation instanceof CSSAnimation &&
          animation.animationName === "dm-radio-ink-bloom",
      );
    if (!animation) return null;
    animation.pause();
    animation.currentTime = 176;
    const style = getComputedStyle(element, "::before");
    return {
      opacity: Number(style.opacity),
      scale: new DOMMatrixReadOnly(style.transform).a,
      fill: style.backgroundColor,
    };
  });
  expect(bloom).not.toBeNull();
  expect(bloom!.opacity).toBeGreaterThan(0.1);
  expect(bloom!.scale).toBeGreaterThan(1);
  expect(bloom!.fill).not.toBe("rgba(0, 0, 0, 0)");
  await quick.focus();
  await page.keyboard.press("ArrowDown");
  const later = group.getByRole("radio", {
    name: "Save it for later",
    exact: true,
  });
  await expect(later).toBeChecked();
  await expect(quick).not.toBeChecked();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await quick.tap();
  await expect(quick).toBeChecked();
  expect(
    await quick.evaluate((element) => ({
      name: getComputedStyle(element, "::before").animationName,
      duration: getComputedStyle(element, "::after").transitionDuration,
    })),
  ).toEqual({ name: "none", duration: "0s" });
});

test("production navigation uses a persistent moving marker and honors reduced motion", async ({
  page,
}) => {
  await page.goto("/#component/nav-trail");
  const nav = page.getByRole("navigation", {
    name: "Try the moving notebook selection",
  });
  const marker = nav.locator(".dm-nav-trail");
  await expect(marker).toHaveAttribute("data-nav-ready", "true");
  const original = await marker.elementHandle();
  await nav.getByRole("button", { name: "A little room for ideas" }).tap();
  await expect(
    nav.getByRole("button", { name: "A little room for ideas" }),
  ).toHaveAttribute("aria-current", "page");
  await expect
    .poll(() =>
      marker.evaluate((element) => {
        const row = element
          .parentElement!.querySelector('[aria-current="page"]')!
          .getBoundingClientRect();
        const box = element.getBoundingClientRect();
        return Math.max(
          Math.abs(row.x - box.x),
          Math.abs(row.y - box.y),
          Math.abs(row.width - box.width),
          Math.abs(row.height - box.height),
        );
      }),
    )
    .toBeLessThan(0.8);
  expect(await original!.evaluate((element) => element.isConnected)).toBe(true);
  await expect(marker).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await nav.getByRole("button", { name: "Made & loved" }).tap();
  await expect(marker).toHaveCSS("transition-duration", "0s");
  expect(
    await nav.evaluate(
      (element) => element.querySelectorAll("a,button").length,
    ),
  ).toBe(3);
});

test("production ribbon custom colors and shared faces survive responsive wrapping", async ({
  page,
}) => {
  await page.goto("/#component/triple-banner");
  const art = page.locator(".playground-canvas .dm-triple-banner");
  const label = art.locator(".dm-triple-banner__label").nth(1);
  await label.evaluate((element) => {
    element.textContent =
      "A much longer middle thought with room for every word";
  });
  await expect
    .poll(() =>
      art.evaluate((element) => {
        const bands = [
          ...element.querySelectorAll<HTMLElement>(".dm-triple-banner__band"),
        ];
        const widths = bands.map((band) => band.getBoundingClientRect().width);
        return Math.max(...widths) - Math.min(...widths);
      }),
    )
    .toBeLessThan(0.6);
  expect(
    await art.evaluate((element) =>
      [
        ...element.querySelectorAll<HTMLElement>(".dm-triple-banner__label"),
      ].every(
        (label) =>
          label.scrollWidth <= label.clientWidth + 1 &&
          label.getBoundingClientRect().bottom <=
            label.closest(".dm-triple-banner__band")!.getBoundingClientRect()
              .bottom,
      ),
    ),
  ).toBe(true);
  await page.getByText("Use custom ribbon colors", { exact: true }).tap();
  await expect(
    page.getByRole("switch", { name: "Use custom ribbon colors", exact: true }),
  ).toBeChecked();
  const color = page.getByLabel("Ribbon text color", { exact: true });
  await color.evaluate((element: HTMLInputElement) => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )!.set!.call(element, "#73539c");
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(label).toHaveCSS("color", "rgb(115, 83, 156)");
  const fill = art.locator(".dm-triple-banner__face").first();
  await expect(fill).toHaveCSS("animation-name", "dm-ribbon-fill");
  await expect(label).toHaveCSS("animation-name", "dm-ribbon-label");
  const oldLabel = await label.elementHandle();
  await page.getByRole("button", { name: "Replay ribbon", exact: true }).tap();
  expect(await oldLabel!.evaluate((element) => element.isConnected)).toBe(true);
  const lettering = await art.evaluate((element) => {
    const animations = element.getAnimations({ subtree: true });
    const fills = animations.filter(
      (animation) =>
        animation instanceof CSSAnimation &&
        animation.animationName === "dm-ribbon-fill",
    );
    const labels = animations.filter(
      (animation) =>
        animation instanceof CSSAnimation &&
        animation.animationName === "dm-ribbon-label",
    );
    const lastFill = Math.max(
      ...fills.map((animation) =>
        Number(animation.effect!.getComputedTiming().endTime),
      ),
    );
    const firstLabel = labels[0];
    const timing = firstLabel.effect!.getTiming();
    const label = (firstLabel.effect as KeyframeEffect).target as HTMLElement;
    const seek = (time: number) => {
      animations.forEach((animation) => {
        animation.pause();
        animation.currentTime = time;
      });
      const css = getComputedStyle(label);
      const right =
        css.clipPath.match(/calc\([^)]*\)|[+-]?[\d.]+(?:px|%)/g)?.[1] ?? "0px";
      const width = label.getBoundingClientRect().width;
      const rightPercent =
        ([...right.replace(/\s/g, "").matchAll(/([+-]?[\d.]+)(px|%)/g)].reduce(
          (sum, term) =>
            sum + Number(term[1]) * (term[2] === "%" ? width / 100 : 1),
          0,
        ) /
          width) *
        100;
      return {
        clip: css.clipPath,
        right: rightPercent,
        transform: css.transform,
        top: label.getBoundingClientRect().top,
      };
    };
    const before = seek(lastFill - 1);
    const writing = seek(Number(timing.delay) + Number(timing.duration) / 2);
    const finished = seek(
      Math.max(
        ...animations.map((animation) =>
          Number(animation.effect!.getComputedTiming().endTime),
        ),
      ),
    );
    return {
      lastFill,
      delay: Number(timing.delay),
      before,
      writing,
      finished,
      creases: element.querySelectorAll(".dm-triple-banner__crease").length,
      tails: element.querySelectorAll(".dm-triple-banner__tail").length,
    };
  });
  expect(lettering.delay + 0.01).toBeGreaterThanOrEqual(lettering.lastFill);
  expect(lettering.before.clip).toContain("100%");
  expect(lettering.writing.right).toBeGreaterThan(0);
  expect(lettering.writing.right).toBeLessThan(100);
  expect(lettering.finished.right).toBeLessThanOrEqual(0);
  expect(lettering.before.transform).toBe("none");
  expect(lettering.writing.transform).toBe("none");
  expect(lettering.finished.transform).toBe("none");
  expect(lettering.writing.top).toBe(lettering.before.top);
  expect(lettering.finished.top).toBe(lettering.before.top);
  expect(lettering.creases).toBe(0);
  expect(lettering.tails).toBe(2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(fill).toHaveCSS("animation-name", "none");
  await expect(label).toHaveCSS("opacity", "1");
  await expect(label).toHaveCSS("clip-path", "none");
});
