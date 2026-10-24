import { expect, test, type Locator, type Page } from "@playwright/test";

async function enableSwitch(page: Page, name: string) {
  const control = page.getByRole("switch", { name, exact: true });
  if (!(await control.isChecked())) await control.locator("..").click();
  await expect(control).toBeChecked();
}

async function geometry(sketch: Locator) {
  return sketch.evaluateAll((roots) =>
    roots.map((root) => {
      const svg =
        root instanceof SVGSVGElement ? root : root.querySelector("svg");
      if (!svg) return [];
      return Array.from(
        svg.querySelectorAll("path, g, line, ellipse, circle"),
      ).map(
        (element) =>
          ["d", "transform", "x1", "y1", "x2", "y2", "cx", "cy"]
            .map((attribute) => element.getAttribute(attribute) ?? "")
            .join("|") + `|${getComputedStyle(element).transform}`,
      );
    }),
  );
}

async function expectFinished(originals: Locator) {
  const paths = originals.locator(".dm-notebook-sketch-line");
  expect(await paths.count()).toBeGreaterThan(3);
  expect(
    await paths.evaluateAll((elements) =>
      elements.every((element) => {
        const css = getComputedStyle(element);
        return (
          css.animationName === "none" && parseFloat(css.strokeDashoffset) === 0
        );
      }),
    ),
  ).toBe(true);
}

async function finishInk(sketch: Locator) {
  await sketch.locator(".dm-notebook-sketch-line").evaluateAll((paths) => {
    paths.forEach((path) =>
      path.getAnimations().forEach((animation) => {
        animation.pause();
        animation.currentTime = 8000;
      }),
    );
  });
}

async function expectDrawingRestart(sketch: Locator) {
  await expect
    .poll(() =>
      sketch
        .locator(".dm-notebook-sketch-line")
        .first()
        .evaluate((path) => ({
          running: path
            .getAnimations()
            .some((animation) => animation.playState === "running"),
          unfinished: parseFloat(getComputedStyle(path).strokeDashoffset) > 0,
        })),
    )
    .toEqual({ running: true, unfinished: true });
}

test("the sketchbook paints original and Hairline ink in every theme", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  const originals = page.locator(".sketchbook-originals .dm-notebook-sketch");
  const hairline = page.locator(".sketchbook-hairline .dm-hairline");
  await expect(originals).toHaveCount(6);
  await expect(hairline).toHaveCount(3);
  await expect(page.locator(".sketchbook-originals figcaption")).toHaveCount(6);

  for (const theme of ["Hybrid", "Light", "Dark"]) {
    await page
      .locator(".topbar")
      .getByRole("button", { name: `${theme} theme`, exact: true })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      theme.toLowerCase(),
    );
    for (const sketch of [
      ...(await originals.all()),
      ...(await hairline.all()),
    ]) {
      await expect(sketch).toBeVisible();
      const strokes = await sketch
        .locator("path, polygon, ellipse, line")
        .evaluateAll((elements) =>
          elements
            .map((element) => {
              const css = getComputedStyle(element);
              return {
                stroke: css.stroke,
                fill: css.fill,
                width: parseFloat(css.strokeWidth),
                vector: css.vectorEffect,
              };
            })
            .filter((style) => style.stroke !== "none"),
        );
      expect(strokes.length).toBeGreaterThan(3);
      expect(
        strokes.every(
          (style) =>
            style.stroke !== "rgb(0, 0, 0)" &&
            style.fill !== "rgb(0, 0, 0)" &&
            style.width > 0 &&
            style.width <= 2.5 &&
            style.vector === "non-scaling-stroke",
        ),
      ).toBe(true);
    }
  }
});

test("original drawings paint a growing line and replay from fresh ink", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  await page.evaluate(() => document.fonts.ready);
  const sketch = page
    .locator(".sketchbook-originals .dm-notebook-sketch")
    .first();
  const first = sketch.locator(".dm-notebook-sketch-line").first();
  await expect(first).toHaveCSS("animation-name", "dm-notebook-sketch-draw");
  const initial = await first.evaluate((element) =>
    Number(element.getAnimations()[0].currentTime),
  );
  await expect
    .poll(() =>
      first.evaluate((element) =>
        Number(element.getAnimations()[0].currentTime),
      ),
    )
    .toBeGreaterThan(initial + 80);

  const frame = async (time: number) => {
    await sketch
      .locator(".dm-notebook-sketch-line")
      .evaluateAll((paths, time) => {
        paths.forEach((path) =>
          path.getAnimations().forEach((animation) => {
            animation.pause();
            animation.currentTime = time;
          }),
        );
      }, time);
    return sketch.screenshot();
  };
  const beginning = await frame(0);
  const complete = await frame(8000);
  expect(beginning.equals(complete)).toBe(false);
  await expect(first).toHaveCSS("stroke-dashoffset", "0px");
  await page.getByRole("button", { name: "Draw again", exact: true }).click();
  await expect
    .poll(() =>
      first.evaluate((element) => element.getAnimations()[0].playState),
    )
    .toBe("running");
  await expect
    .poll(() =>
      first.evaluate((element) =>
        parseFloat(getComputedStyle(element).strokeDashoffset),
      ),
    )
    .toBeGreaterThan(0);
});

test("each original drawing replays independently on click, Enter, and Space", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  const originals = page.locator(".sketchbook-originals .dm-notebook-sketch");
  const cards = page.locator(".sketchbook-originals .sketchbook-card");
  const buttons = cards.locator("button.dm-sketch-replay");
  await expect(originals).toHaveCount(6);
  await expect(buttons).toHaveCount(6);
  await finishInk(originals);

  for (let index = 0; index < 6; index++) {
    const replay = buttons.nth(index);
    const sketch = originals.nth(index);
    const before = await originals.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-replay")),
    );
    const buttonNode = await replay.elementHandle();
    await expect(replay).toHaveAccessibleName(/^Replay .+/);
    await replay.click();
    await expectDrawingRestart(sketch);
    await expect(replay).toBeFocused();
    expect(
      await buttonNode!.evaluate(
        (element) => document.activeElement === element,
      ),
    ).toBe(true);
    const after = await originals.evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("data-replay")),
    );
    expect(after[index]).not.toEqual(before[index]);
    expect(after.filter((_, position) => position !== index)).toEqual(
      before.filter((_, position) => position !== index),
    );
    await finishInk(sketch);
  }

  const replay = buttons.first();
  const sketch = originals.first();
  await replay.focus();
  for (const key of ["Enter", "Space"]) {
    const before = await sketch.getAttribute("data-replay");
    await replay.press(key);
    await expectDrawingRestart(sketch);
    await expect(sketch).not.toHaveAttribute("data-replay", before!);
    await expect(replay).toBeFocused();
    await finishInk(sketch);
  }
});

test("rapid drawing replays restart fresh ink without replacing the control", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  const card = page.locator(".sketchbook-originals .sketchbook-card").first();
  const replay = card.locator("button.dm-sketch-replay");
  const sketch = card.locator(".dm-notebook-sketch");
  const buttonNode = await replay.elementHandle();
  for (let click = 0; click < 4; click++) {
    const before = await sketch.getAttribute("data-replay");
    await replay.click({ delay: 15 });
    await expect(sketch).not.toHaveAttribute("data-replay", before!);
    await expectDrawingRestart(sketch);
  }
  expect(
    await buttonNode!.evaluate((element) => document.activeElement === element),
  ).toBe(true);
  await expect(card.locator(".dm-notebook-sketch")).toHaveCount(1);
});

test("Hairline responds to the pointer and its guided tour is opt in", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  const figures = page.locator(".sketchbook-hairline .dm-hairline");
  for (const figure of await figures.all()) {
    await expect(figure).toHaveAttribute("data-autoplay", "false");
    await expect(figure.locator(".dm-hairline__figure")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  }
  const loupe = page.locator(
    '.sketchbook-hairline .dm-hairline[data-variant="loupe"]',
  );
  await loupe.scrollIntoViewIfNeeded();
  const initial = await geometry(loupe);
  const bounds = (await loupe.boundingBox())!;
  await page.mouse.move(
    bounds.x + bounds.width * 0.75,
    bounds.y + bounds.height * 0.35,
  );
  await expect.poll(() => geometry(loupe)).not.toEqual(initial);
  await enableSwitch(page, "Let Hairline wander");
  for (const figure of await figures.all())
    await expect(figure).toHaveAttribute("data-autoplay", "true");
});

test("Hairline studies replay their ink without opting into automatic wandering", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  const cards = page.locator(".sketchbook-hairline .sketchbook-card");
  const figures = cards.locator(".dm-hairline");
  await expect(cards.locator("button.dm-sketch-replay")).toHaveCount(3);
  for (const card of await cards.all()) {
    const replay = card.locator("button.dm-sketch-replay");
    const figure = card.locator(".dm-hairline");
    const before = await figure.getAttribute("data-replay");
    const buttonNode = await replay.elementHandle();
    await expect(replay).toHaveAccessibleName(/^Replay .+/);
    await replay.click();
    await expect(figure).not.toHaveAttribute("data-replay", before!);
    await expect(figure).toHaveAttribute("data-autoplay", "false");
    await expect
      .poll(() =>
        figure.evaluate((element) =>
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
    expect(
      await buttonNode!.evaluate(
        (element) => document.activeElement === element,
      ),
    ).toBe(true);
  }
  for (const figure of await figures.all())
    await expect(figure).toHaveAttribute("data-autoplay", "false");

  const replay = cards.first().locator("button.dm-sketch-replay");
  const first = figures.first();
  const before = await first.getAttribute("data-replay");
  await replay.focus();
  await replay.press("Enter");
  await expect(first).not.toHaveAttribute("data-replay", before!);
  await expect(replay).toBeFocused();
});

test("quiet sketches finish the ink and stop pointer and automatic motion", async ({
  page,
}) => {
  await page.goto("/#sketchbook");
  await enableSwitch(page, "Let Hairline wander");
  await enableSwitch(page, "Quiet sketches");
  const originals = page.locator(".sketchbook-originals .dm-notebook-sketch");
  await expectFinished(originals);
  for (const replay of await page.locator("button.dm-sketch-replay").all())
    await expect(replay).toBeDisabled();
  await expectFinished(originals);
  for (const sketch of await originals.all())
    await expect(sketch).toHaveAttribute("data-interactive", "false");
  const inkBefore = await geometry(originals);
  await originals.first().hover({ position: { x: 30, y: 30 } });
  await page.waitForTimeout(300);
  expect(await geometry(originals)).toEqual(inkBefore);
  const figures = page.locator(".sketchbook-hairline .dm-hairline");
  for (const figure of await figures.all()) {
    await expect(figure).toHaveAttribute("data-quiet", "true");
    await expect(figure).toHaveAttribute("data-autoplay", "false");
    await expect(figure.locator(".dm-hairline__figure")).toHaveCSS(
      "pointer-events",
      "none",
    );
  }
  const loupe = page.locator(
    '.sketchbook-hairline .dm-hairline[data-variant="loupe"]',
  );
  await loupe.scrollIntoViewIfNeeded();
  const initial = await geometry(loupe);
  await loupe.hover({ position: { x: 30, y: 30 } });
  await page.waitForTimeout(350);
  expect(await geometry(loupe)).toEqual(initial);
});

test("reduced motion keeps completed drawings and inert Hairline figures", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#sketchbook");
  await enableSwitch(page, "Let Hairline wander");
  const originals = page.locator(".sketchbook-originals .dm-notebook-sketch");
  await expectFinished(originals);
  for (const replay of await page.locator("button.dm-sketch-replay").all())
    await expect(replay).toBeDisabled();
  await expectFinished(originals);
  const inkBefore = await geometry(originals);
  await originals.first().hover({ position: { x: 30, y: 30 } });
  await page.waitForTimeout(300);
  expect(await geometry(originals)).toEqual(inkBefore);
  const figures = page.locator(".sketchbook-hairline .dm-hairline");
  for (const figure of await figures.all()) {
    await expect(figure).toHaveAttribute("data-active", "false");
    await expect(figure).toHaveAttribute("data-autoplay", "false");
    await expect(figure.locator(".dm-hairline__figure")).toHaveAttribute(
      "inert",
      "",
    );
  }
  const initial = await geometry(figures);
  await figures.last().scrollIntoViewIfNeeded();
  await figures.last().hover({ position: { x: 50, y: 50 } });
  await page.waitForTimeout(350);
  expect(await geometry(figures)).toEqual(initial);
});

test("narrow touch screens keep sketches inside the page and permit vertical gestures", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(new URL("/#sketchbook", baseURL).toString());
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await expect(page.locator(".sketchbook-page")).toBeVisible();
    const bounds = await page
      .locator(
        ".sketchbook-page .dm-notebook-sketch, .sketchbook-page .dm-hairline",
      )
      .evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: rect.width };
        }),
      );
    expect(bounds).toHaveLength(9);
    expect(
      bounds.every(
        (rect) => rect.width > 0 && rect.left >= 0 && rect.right <= width + 1,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const replay = page
    .locator(".sketchbook-originals button.dm-sketch-replay")
    .first();
  const sketch = replay.locator(".dm-notebook-sketch");
  const beforeReplay = await sketch.getAttribute("data-replay");
  await replay.tap();
  await expect(sketch).not.toHaveAttribute("data-replay", beforeReplay!);
  await expectDrawingRestart(sketch);
  await expect(replay).toHaveCSS("touch-action", "pan-y");
  const figure = page.locator(
    '.sketchbook-hairline .dm-hairline[data-variant="loupe"] .dm-hairline__figure',
  );
  await figure.scrollIntoViewIfNeeded();
  await expect(figure).toHaveCSS("touch-action", "pan-y");
  await page.evaluate(() => {
    document.addEventListener(
      "touchstart",
      (event) => {
        document.documentElement.dataset.sketchTouchPrevented = String(
          event.defaultPrevented,
        );
      },
      { once: true },
    );
  });
  const box = (await figure.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await expect(page.locator("html")).toHaveAttribute(
    "data-sketch-touch-prevented",
    "false",
  );
  await context.close();
});
