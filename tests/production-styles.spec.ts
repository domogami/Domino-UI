import { expect, test } from "@playwright/test";

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
