import { expect, test, type Locator, type Page } from "@playwright/test";

type StrikeElement = HTMLElement & { strikeSamples?: Promise<number[]> };

async function armStrikeSamples(text: Locator) {
  await text.evaluate((element) => {
    const input = element.closest("label")!.querySelector("input")!;
    input.addEventListener("change", () => {
      (element as StrikeElement).strikeSamples = new Promise((resolve) => {
        const frames: number[] = [];
        const started = performance.now();
        const sample = () => {
          frames.push(parseFloat(getComputedStyle(element).backgroundSize));
          if (performance.now() - started < 400) requestAnimationFrame(sample);
          else resolve(frames);
        };
        sample();
      });
    }, { once: true });
  });
}

async function strikeSamples(text: Locator) {
  return text.evaluate(async (element) =>
    await (element as StrikeElement).strikeSamples ?? [],
  );
}

async function thumbState(control: Locator) {
  return control.locator("..").locator(".dm-switch__track").evaluate((track) => {
    const style = getComputedStyle(track, "::after");
    const matrix = new DOMMatrixReadOnly(style.transform);
    return {
      x: matrix.m41,
      scaleX: matrix.m11,
      scaleY: matrix.m22,
      transitionProperty: style.transitionProperty,
      transitionDuration: style.transitionDuration,
      easing: style.transitionTimingFunction,
    };
  });
}

async function pointAtTrack(page: Page, control: Locator) {
  const rect = await control.locator("..").locator(".dm-switch__track").boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x + rect!.width / 2, rect!.y + rect!.height / 2);
}

test("garden tasks draw and erase their strike through native click and Space", async ({ page }) => {
  await page.goto("/#component/task-checkbox");
  const task = page.locator(".playground-canvas .dm-task-checkbox").first();
  const input = task.getByRole("checkbox");
  const text = task.locator(".dm-task-checkbox__text");
  const description = task.locator(".dm-task-checkbox__description");
  await expect(input).not.toBeChecked();
  await expect(text).toHaveCSS("background-size", "0% 1.5px");

  await armStrikeSamples(text);
  await input.click();
  await expect(input).toBeChecked();
  const drawing = await strikeSamples(text);
  expect(drawing.some((width) => width > 0 && width < 100)).toBe(true);
  expect(drawing.at(-1)).toBe(100);
  await expect(description).toHaveCSS("background-image", "none");
  await expect(description).toHaveCSS("text-decoration-line", "none");
  await expect(input).toHaveAccessibleDescription("A small thing worth keeping.");

  await armStrikeSamples(text);
  await input.focus();
  await page.keyboard.press("Space");
  await expect(input).not.toBeChecked();
  const erasing = await strikeSamples(text);
  expect(erasing.some((width) => width > 0 && width < 100)).toBe(true);
  expect(erasing.at(-1)).toBe(0);
  await expect(input).toBeFocused();
});

test("the garden task strike wraps with its text inside a narrow notebook", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/#component/task-checkbox");
  const task = page.locator(".playground-canvas .dm-task-checkbox").last();
  await task.getByRole("checkbox").check();
  const text = task.locator(".dm-task-checkbox__text");
  await expect(text).toHaveCSS("background-size", "100% 1.5px");
  await expect(text).toHaveCSS("box-decoration-break", "clone");
  const layout = await text.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    const lines = [...range.getClientRects()];
    const container = element.closest(".playground-canvas")!.getBoundingClientRect();
    return {
      lines: lines.length,
      fits: lines.every((line) => line.left >= container.left && line.right <= container.right),
      pageFits: document.documentElement.scrollWidth <= innerWidth,
    };
  });
  expect(layout.lines).toBeGreaterThan(1);
  expect(layout.fits).toBe(true);
  expect(layout.pageFits).toBe(true);
});

test("reduced-motion garden tasks retain a finished static check and strike", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#component/task-checkbox");
  const task = page.locator(".playground-canvas .dm-task-checkbox").first();
  const input = task.getByRole("checkbox");
  const text = task.locator(".dm-task-checkbox__text");
  await input.check();
  await expect(text).toHaveCSS("background-size", "100% 1.5px");
  await expect(text).toHaveCSS("transition-property", "none");
  expect(await input.evaluate((element) => getComputedStyle(element, "::after").animationName)).toBe("none");
  await input.focus();
  await page.keyboard.press("Space");
  await expect(input).not.toBeChecked();
  await expect(text).toHaveCSS("background-size", "0% 1.5px");
});

test("the switch spring settles at each native state and survives a quick reversal", async ({ page }) => {
  await page.goto("/#component/switch");
  const control = page.locator(".playground-canvas").getByRole("switch", { name: "Quiet motion", exact: true });
  await expect(control).not.toBeChecked();
  expect((await thumbState(control)).x).toBe(0);
  expect((await thumbState(control)).easing).toContain("cubic-bezier(0.34, 1.4, 0.64, 1)");
  await control.locator("..").click();
  await expect(control).toBeChecked();
  await expect.poll(async () => (await thumbState(control)).x).toBe(16);
  expect((await thumbState(control)).scaleX).toBe(1);

  await control.focus();
  await page.keyboard.press("Space");
  await expect(control).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(control).toBeChecked();
  await expect.poll(async () => (await thumbState(control)).x).toBe(16);
  await page.keyboard.press("Space");
  await expect.poll(async () => (await thumbState(control)).x).toBe(0);
});

test("switch press stretches the thumb then settles while disabled controls stay still", async ({ page }) => {
  await page.goto("/#component/switch");
  const canvas = page.locator(".playground-canvas");
  const control = canvas.getByRole("switch", { name: "Quiet motion", exact: true });
  await pointAtTrack(page, control);
  await page.mouse.down();
  await expect.poll(async () => (await thumbState(control)).scaleX).toBe(1.24);
  expect((await thumbState(control)).scaleY).toBe(0.88);
  await page.mouse.up();
  await expect(control).toBeChecked();
  await expect.poll(async () => (await thumbState(control)).x).toBe(16);
  expect((await thumbState(control)).scaleX).toBe(1);

  await pointAtTrack(page, control);
  await page.mouse.down();
  await expect.poll(async () => (await thumbState(control)).scaleX).toBe(1.24);
  expect((await thumbState(control)).x).toBe(14.5);
  await page.mouse.up();
  await expect(control).not.toBeChecked();
  await expect.poll(async () => (await thumbState(control)).x).toBe(0);

  const disabled = canvas.getByRole("switch", { name: "A setting for later", exact: true });
  await expect(disabled).toBeDisabled();
  await pointAtTrack(page, disabled);
  await page.mouse.down();
  expect((await thumbState(disabled)).scaleX).toBe(1);
  expect((await thumbState(disabled)).x).toBe(0);
  await page.mouse.up();
  await expect(disabled).not.toBeChecked();
});

test("reduced-motion switches change state without sliding or press deformation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#component/switch");
  const control = page.locator(".playground-canvas").getByRole("switch", { name: "Quiet motion", exact: true });
  await pointAtTrack(page, control);
  await page.mouse.down();
  expect(await thumbState(control)).toMatchObject({ x: 0, scaleX: 1, scaleY: 1, transitionProperty: "none" });
  await page.mouse.up();
  await expect(control).toBeChecked();
  expect(await thumbState(control)).toMatchObject({ x: 16, scaleX: 1, scaleY: 1, transitionProperty: "none" });
  await pointAtTrack(page, control);
  await page.mouse.down();
  expect(await thumbState(control)).toMatchObject({ x: 16, scaleX: 1, scaleY: 1, transitionProperty: "none" });
  await page.mouse.up();
  await expect(control).not.toBeChecked();
  expect((await thumbState(control)).x).toBe(0);
});
