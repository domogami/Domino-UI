import { expect, test } from "@playwright/test";

test("dropdown chevron stays centered across fonts and rotates the same SVG", async ({
  page,
}) => {
  await page.goto("/#component/dropdown-menu");
  const trigger = page.locator(".playground-canvas").getByRole("button", {
    name: "Note actions",
    exact: true,
  });
  const chevron = trigger.locator("svg.dm-chevron");
  await expect(chevron).toHaveAttribute("data-direction", "down");
  const original = await chevron.elementHandle();
  const measurements = await trigger.evaluate((button) => {
    const svg = button.querySelector("svg")!;
    const path = svg.querySelector("path")!;
    const shape = path.getBBox();
    const results = [];
    for (const font of ['"Lexend", sans-serif', "serif", "monospace"]) {
      (button as HTMLElement).style.fontFamily = font;
      const bounds = button.getBoundingClientRect();
      const icon = svg.getBoundingClientRect();
      results.push({
        centerDifference: Math.abs(
          (icon.top + icon.bottom - bounds.top - bounds.bottom) / 2,
        ),
        width: icon.width,
        height: icon.height,
      });
    }
    (button as HTMLElement).style.removeProperty("font-family");
    return {
      results,
      shapeCenter: [shape.x + shape.width / 2, shape.y + shape.height / 2],
    };
  });
  expect(measurements.shapeCenter).toEqual([12, 12]);
  for (const result of measurements.results) {
    expect(result.centerDifference).toBeLessThanOrEqual(0.5);
    expect(result.width).toBe(result.height);
  }
  await trigger.click();
  await expect(chevron).toHaveAttribute("data-direction", "up");
  await expect
    .poll(() =>
      chevron.evaluate(
        (svg) => new DOMMatrix(getComputedStyle(svg).transform).a,
      ),
    )
    .toBe(-1);
  await page.keyboard.press("Escape");
  await expect(chevron).toHaveAttribute("data-direction", "down");
  await expect
    .poll(() =>
      chevron.evaluate(
        (svg) => new DOMMatrix(getComputedStyle(svg).transform).a,
      ),
    )
    .toBe(1);
  expect(await chevron.evaluate((svg, saved) => svg === saved, original)).toBe(
    true,
  );
});

test("accordion, annotation and breadcrumbs reuse the same centered pen geometry", async ({
  page,
}) => {
  await page.goto("/#component/accordion");
  const control = page
    .locator(".playground-canvas .dm-accordion button")
    .first();
  const chevron = control.locator(".dm-chevron");
  const geometry = await chevron.locator("path").getAttribute("d");
  await expect(chevron).toHaveAttribute("data-direction", "down");
  await control.click();
  await expect(chevron).toHaveAttribute("data-direction", "up");
  await expect(control).toHaveAttribute("aria-expanded", "true");

  await page.goto("/#component/annotation");
  const summary = page.locator(".playground-canvas .dm-annotation summary");
  await expect(summary.locator(".dm-chevron path")).toHaveAttribute(
    "d",
    geometry!,
  );
  await expect(summary.locator(".dm-chevron")).toHaveAttribute(
    "data-direction",
    "up",
  );
  await summary.click();
  await expect(summary.locator(".dm-chevron")).toHaveAttribute(
    "data-direction",
    "down",
  );

  await page.goto("/#component/breadcrumbs");
  const separators = page.locator(
    ".playground-canvas .dm-breadcrumbs .dm-chevron",
  );
  await expect(separators).toHaveCount(2);
  for (const separator of await separators.all()) {
    await expect(separator).toHaveAttribute("data-direction", "right");
    await expect(separator.locator("path")).toHaveAttribute("d", geometry!);
  }
});

test("select keeps a native control, space for long labels and a centered disabled indicator", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto("/#component/select");
  const select = page.locator(".playground-canvas select");
  await select.selectOption("ideas");
  await expect(select).toHaveValue("ideas");
  const result = await select.evaluate((node) => {
    node.options[node.selectedIndex].textContent =
      "A very long notebook collection name with a lot of thoughts to keep";
    node.disabled = true;
    const indicator = node.nextElementSibling!;
    const bounds = node.getBoundingClientRect();
    const icon = indicator.getBoundingClientRect();
    return {
      appearance: getComputedStyle(node).appearance,
      padding: parseFloat(getComputedStyle(node).paddingInlineEnd),
      opacity: getComputedStyle(indicator).opacity,
      pointerEvents: getComputedStyle(indicator).pointerEvents,
      width: bounds.width,
      centerDifference: Math.abs(
        (icon.top + icon.bottom - bounds.top - bounds.bottom) / 2,
      ),
      trailingRoom: bounds.right - icon.left,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  await expect(select).toBeDisabled();
  expect(result).toMatchObject({
    appearance: "none",
    opacity: "0.5",
    pointerEvents: "none",
    overflow: false,
  });
  expect(result.centerDifference).toBeLessThanOrEqual(0.5);
  expect(result.padding).toBeGreaterThan(result.trailingRoom);
  expect(result.width).toBeLessThan(320);
});

test("reduced motion changes disclosure direction immediately and forced colors restores native select arrow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#component/dropdown-menu");
  const trigger = page
    .locator(".playground-canvas")
    .getByRole("button", { name: "Note actions", exact: true });
  const chevron = trigger.locator(".dm-chevron");
  await trigger.click();
  await expect(chevron).toHaveCSS("transition-duration", "0s");
  expect(
    await chevron.evaluate(
      (svg) => new DOMMatrix(getComputedStyle(svg).transform).a,
    ),
  ).toBe(-1);

  await page.emulateMedia({ forcedColors: "active" });
  await page.goto("/#component/select");
  await expect(page.locator(".playground-canvas select")).toHaveCSS(
    "appearance",
    "auto",
  );
  await expect(
    page.locator(".playground-canvas .dm-select__indicator"),
  ).toBeHidden();
});
