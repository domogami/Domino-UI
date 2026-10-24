import { test, expect, type Locator, type Page } from "@playwright/test";

type Pulse = { pattern: number | number[]; at: number };
declare global {
  interface Window {
    hapticTestPulses: Pulse[];
    hapticTestFinish: number;
  }
}

// These tests verify requests and DOM events. They cannot verify a phone motor.
async function motor(page: Page, support: "yes" | "missing" | "blocked" = "yes") {
  await page.addInitScript((support) => {
    window.hapticTestPulses = [];
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: support === "missing" ? undefined : (pattern: number | number[]) => {
        if (support === "blocked") throw new Error("Device policy declined vibration");
        window.hapticTestPulses.push({ pattern, at: performance.now() });
        return true;
      },
    });
  }, support);
}

async function pulses(page: Page) {
  return page.evaluate(() => window.hapticTestPulses.filter(({ pattern }) => pattern !== 0));
}

async function resetPulses(page: Page) {
  await page.evaluate(() => { window.hapticTestPulses = []; });
  // Separate deliberate taps beyond the shared motor's 65ms throttle.
  await page.waitForTimeout(90);
}

async function guide(page: Page) {
  await page.goto("/#haptics");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A little feedback.");
  await expect(page.locator(".haptics-device h2")).not.toHaveText("Checking available APIs…");
}

const example = (page: Page, kind: string) => page.locator(`[data-feedback-example="${kind}"]`);
const replay = (page: Page) => page.getByRole("button", { name: "Replay the ink", exact: true });
const preference = (page: Page) => page.getByRole("checkbox", { name: "Touch feedback", exact: true });

test.describe("touch feedback requests", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("the five source patterns require touch and manual examples pulse once", async ({ page }) => {
    await motor(page);
    await guide(page);
    expect(await pulses(page)).toEqual([]);
    for (const kind of ["tap", "selection", "success", "error"]) {
      await page.waitForTimeout(90);
      await example(page, kind).tap();
    }
    expect((await pulses(page)).map(({ pattern }) => pattern)).toEqual([
      6, 4, [9, 45, 12], [14, 45, 14],
    ]);
    await page.waitForTimeout(90);
    await replay(page).tap();
    await expect.poll(async () => (await pulses(page)).map(({ pattern }) => pattern))
      .toEqual([6, 4, [9, 45, 12], [14, 45, 14], 6, 5]);
    await expect(page.locator(".haptics-action-log b")).toHaveText("5");
  });

  test("mouse, keyboard and scripted actions work without custom vibration", async ({ page }) => {
    await motor(page);
    await guide(page);
    await example(page, "tap").click();
    await example(page, "selection").focus();
    await page.keyboard.press("Enter");
    await example(page, "success").evaluate((button: HTMLButtonElement) => button.click());
    await expect(page.locator(".haptics-action-log b")).toHaveText("3");
    expect(await pulses(page)).toEqual([]);
  });

  test("one drawing cue follows the real final animation event", async ({ page }) => {
    await motor(page);
    await guide(page);
    await page.evaluate(() => {
      document.addEventListener("animationend", (event) => {
        if (event.animationName === "dm-haptic-ink") window.hapticTestFinish = performance.now();
      }, true);
    });
    await replay(page).tap();
    await expect.poll(async () => (await pulses(page)).map(({ pattern }) => pattern)).toEqual([6, 5]);
    const timing = await page.evaluate(() => ({ finish: window.hapticTestFinish, pulses: window.hapticTestPulses.filter(p => p.pattern !== 0) }));
    expect(timing.pulses[1].at - timing.pulses[0].at).toBeGreaterThan(750);
    expect(Math.abs(timing.pulses[1].at - timing.finish)).toBeLessThan(60);
    await expect(page.locator(".haptics-ink-preview")).toContainText("Completed drawings: 1");
    await page.waitForTimeout(90);
    await page.locator('[data-haptic-cue="domino-haptic-ink"]').evaluate((path) => {
      path.dispatchEvent(new AnimationEvent("animationend", { animationName: "dm-haptic-ink", bubbles: true }));
    });
    expect((await pulses(page)).map(({ pattern }) => pattern)).toEqual([6, 5]);
  });

  test("feedback preference persists and reduced motion quiets every pattern", async ({ page }) => {
    await motor(page);
    await guide(page);
    await preference(page).tap();
    await expect(preference(page)).not.toBeChecked();
    await resetPulses(page);
    await example(page, "success").tap();
    expect(await pulses(page)).toEqual([]);
    await page.reload();
    await expect(preference(page)).not.toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem("notebook-touch-feedback"))).toBe("off");
    await preference(page).tap();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(preference(page)).not.toHaveAttribute("switch");
    await resetPulses(page);
    await example(page, "error").tap();
    await replay(page).tap();
    await page.waitForTimeout(1000);
    expect(await pulses(page)).toEqual([]);
    await expect(page.locator(".haptics-action-log b")).toHaveText("2");
  });

  for (const cancel of ["blur", "next gesture", "outside gesture", "navigation", "animation cancel"] as const) {
    test(`${cancel} clears an armed drawing cue`, async ({ page }) => {
      await motor(page);
      await guide(page);
      await replay(page).tap();
      await page.waitForTimeout(100);
      if (cancel === "blur") await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      else if (cancel === "next gesture") await example(page, "selection").tap();
      else if (cancel === "outside gesture") await page.getByRole("heading", { level: 1 }).tap();
      else if (cancel === "navigation") await page.evaluate(() => { location.hash = "motion"; });
      else await page.locator('[data-haptic-cue="domino-haptic-ink"]').evaluate((path) => {
        path.dispatchEvent(new AnimationEvent("animationcancel", { animationName: "dm-haptic-ink", bubbles: true }));
      });
      await page.waitForTimeout(1000);
      expect((await pulses(page)).map(({ pattern }) => pattern)).toEqual(cancel === "next gesture" ? [6, 4] : [6]);
      if (cancel === "blur" || cancel === "navigation") {
        expect(await page.evaluate(() => window.hapticTestPulses.some(p => p.pattern === 0))).toBe(true);
      }
      if (cancel === "outside gesture")
        await expect(page.locator(".haptics-ink-preview")).toContainText("Completed drawings: 1");
    });
  }

  for (const support of ["missing", "blocked"] as const) {
    test(`a ${support} motor leaves feedback controls usable`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      await motor(page, support);
      await guide(page);
      await example(page, "success").tap();
      await replay(page).tap();
      await expect(page.locator(".haptics-action-log b")).toHaveText("2");
      await expect(page.locator(".haptics-ink-preview")).toContainText("Completed drawings: 1");
      expect(await pulses(page)).toEqual([]);
      expect(errors).toEqual([]);
    });
  }

  test("storage denial keeps the in-memory feedback preference usable", async ({ page }) => {
    await motor(page);
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new Error("Storage blocked"); };
      Storage.prototype.setItem = () => { throw new Error("Storage blocked"); };
    });
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await guide(page);
    await preference(page).tap();
    await resetPulses(page);
    await example(page, "tap").tap();
    expect(await pulses(page)).toEqual([]);
    await preference(page).tap();
    await resetPulses(page);
    await example(page, "selection").tap();
    expect((await pulses(page)).map(({ pattern }) => pattern)).toEqual([4]);
    expect(errors).toEqual([]);
  });
});

// Feature emulation checks real touch targeting, not Safari or physical haptics.
async function nativeSwitchFeatures(page: Page) {
  await motor(page, "missing");
  await page.addInitScript(() => {
    Object.defineProperty(HTMLInputElement.prototype, "switch", {
      configurable: true,
      get() { return this.hasAttribute("switch"); },
    });
    document.addEventListener("click", event => {
      if (event.target instanceof HTMLInputElement && event.target.matches(".dm-native-tap-target"))
        event.target.dataset.trustedTestTap = String(event.isTrusted);
    }, true);
  });
}

async function nativeTap(page: Page, control: Locator) {
  await control.scrollIntoViewIfNeeded();
  const box = (await control.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  await expect.poll(() => page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.classList.contains("dm-native-tap-target"), point)).toBe(true);
  await page.touchscreen.tap(point.x, point.y);
}

test.describe("emulated native switch targeting", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

  test("a rendered sibling target forwards one action and preserves keyboard buttons", async ({ page }) => {
    await nativeSwitchFeatures(page);
    await guide(page);
    const button = example(page, "tap");
    await nativeTap(page, button);
    await expect(page.locator(".haptics-action-log b")).toHaveText("1");
    const target = page.locator('.dm-native-tap-target[data-native-tap-label="Keep a thought"]');
    await expect(target).toHaveAttribute("data-trusted-test-tap", "true");
    await expect(target).toHaveAttribute("aria-hidden", "true");
    await expect(target).toHaveAttribute("tabindex", "-1");
    await expect(target).toHaveCSS("appearance", "auto");
    await expect(target).toHaveCSS("opacity", "0");
    await expect(button.locator("input")).toHaveCount(0);
    const sourceBox = (await button.boundingBox())!;
    const targetBox = (await target.boundingBox())!;
    expect(Math.abs(sourceBox.x - targetBox.x)).toBeLessThan(1);
    expect(Math.abs(sourceBox.y - targetBox.y)).toBeLessThan(1);
    expect(Math.abs(sourceBox.width - targetBox.width)).toBeLessThan(1);
    // Source-faithful layers may be hosted in body; ownership follows the real
    // opted-in control, rather than the layer's parent in the DOM.
    const targetLabels = await page.locator(".dm-native-tap-target").evaluateAll(inputs => inputs.map(input => input.getAttribute("data-native-tap-label")));
    expect(targetLabels.length).toBeGreaterThan(0);
    expect(targetLabels.every(label => ["Keep a thought", "Choose a page", "Finish a note", "Try an error", "Replay the ink"].includes(label ?? ""))).toBe(true);
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".haptics-action-log b")).toHaveText("2");
    await expect(button).toBeFocused();
    const visibleSwitch = page.getByRole("checkbox", { name: "Native switch example", exact: true });
    await expect(visibleSwitch).toHaveAttribute("switch", "");
    await expect(visibleSwitch).toHaveCSS("appearance", "auto");
    await visibleSwitch.tap();
    await expect(visibleSwitch).toBeChecked();
    await expect(page.locator(".haptics-action-log b")).toHaveText("3");
    await expect(page.locator(".sidebar .dm-native-tap-target, .topbar .dm-native-tap-target")).toHaveCount(0);
    expect(await pulses(page)).toEqual([]);
  });

  test("links and opted-out controls stay native, settings remove the enhancement", async ({ page }) => {
    await nativeSwitchFeatures(page);
    await guide(page);
    await page.locator(".haptics-playground").evaluate(root => {
      const fixtures = document.createElement("div");
      fixtures.innerHTML = '<a href="#haptics" aria-label="Haptic ordinary link">Ordinary link</a><button disabled aria-label="Haptic disabled">Disabled</button><button data-haptic="none" aria-label="Haptic quiet">Quiet</button><button data-native-tap="none" aria-label="Haptic original gesture">Original gesture</button>';
      root.prepend(fixtures);
    });
    await nativeTap(page, example(page, "selection"));
    await expect(page.locator('.dm-native-tap-target[data-native-tap-label^="Haptic "]')).toHaveCount(0);
    const tapTarget = page.locator('.dm-native-tap-target[data-native-tap-label="Keep a thought"]');
    await example(page, "tap").scrollIntoViewIfNeeded();
    await expect(tapTarget).toHaveCount(1);
    await example(page, "tap").evaluate((button: HTMLButtonElement) => { button.disabled = true; });
    await expect(tapTarget).toHaveCount(0);
    await example(page, "tap").evaluate((button: HTMLButtonElement) => { button.disabled = false; });
    await expect(tapTarget).toHaveCount(1);
    await preference(page).tap();
    await expect(page.locator(".dm-native-tap-target")).toHaveCount(0);
    await expect(page.getByRole("checkbox", { name: "Native switch example", exact: true })).not.toHaveAttribute("switch");
    await example(page, "success").tap();
    await expect(page.locator(".haptics-action-log b")).toHaveText("2");
    await preference(page).tap();
    await nativeTap(page, example(page, "tap"));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".dm-native-tap-target")).toHaveCount(0);
    await expect(preference(page)).not.toHaveAttribute("switch");
  });
});
