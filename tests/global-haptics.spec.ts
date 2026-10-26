import { expect, test, type Locator, type Page } from "@playwright/test";

declare global {
  interface Window {
    globalTouchPulses: (number | number[])[];
  }
}

// Browser feature emulation verifies requests and trusted event forwarding,
// not physical iPhone haptic output.
async function vibrationFeatures(page: Page) {
  await page.addInitScript(() => {
    window.globalTouchPulses = [];
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: (pattern: number | number[]) => {
        window.globalTouchPulses.push(pattern);
        return true;
      },
    });
  });
}

async function nativeFeatures(page: Page) {
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
}

async function nativeTap(page: Page, control: Locator) {
  await control.scrollIntoViewIfNeeded();
  const box = (await control.boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
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
}

async function navigate(page: Page, route: string, heading: string) {
  await page.evaluate((route) => {
    location.hash = route;
  }, route);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
}

test.describe("notebook-wide touch feedback", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });

  test("initial load and navigation stay silent until an owned pulse needs one cancellation", async ({
    page,
  }) => {
    await vibrationFeatures(page);
    await page.goto("/#component/icon-button");
    await expect(page.locator("[data-domino-haptics]")).toHaveCount(1);
    expect(await page.evaluate(() => window.globalTouchPulses)).toEqual([]);
    await navigate(page, "component/button", "Button.");
    await page.evaluate(() => {
      window.dispatchEvent(new Event("blur"));
      window.dispatchEvent(new Event("pagehide"));
    });
    expect(await page.evaluate(() => window.globalTouchPulses)).toEqual([]);
    await navigate(page, "component/icon-button", "Icon button.");
    const save = page.locator(".playground-canvas .dm-icon-button").first();
    await save.tap();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => window.globalTouchPulses)).toEqual([6]);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    expect(await page.evaluate(() => window.globalTouchPulses)).toEqual([6, 0]);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await navigate(page, "haptics", "A little feedback.");
    expect(await page.evaluate(() => window.globalTouchPulses)).toEqual([6, 0]);
  });

  test("one app controller covers ordinary buttons and theme controls", async ({
    page,
  }) => {
    await vibrationFeatures(page);
    await page.goto("/#component/icon-button");
    await expect(page.locator("[data-domino-haptics]")).toHaveCount(1);
    const save = page.locator(".playground-canvas .dm-icon-button").first();
    await save.tap();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.evaluate(() =>
        window.globalTouchPulses.filter((value) => value !== 0),
      ),
    ).toEqual([6]);
    await page.waitForTimeout(90);
    await page.getByRole("button", { name: "Dark theme", exact: true }).tap();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(
      await page.evaluate(() =>
        window.globalTouchPulses.filter((value) => value !== 0),
      ),
    ).toEqual([6, 6]);
    expect(
      await page
        .locator(".topbar")
        .evaluate((element) =>
          Boolean(element.closest("[data-domino-haptics]")),
        ),
    ).toBe(true);
  });

  test("guide and layers reuse the app scope and request one manual pulse or finish cue", async ({
    page,
  }) => {
    await vibrationFeatures(page);
    await page.goto("/#component/button");
    const appScope = await page
      .locator("[data-domino-haptics]")
      .elementHandle();
    await navigate(page, "haptics", "A little feedback.");
    await expect(page.locator("[data-domino-haptics]")).toHaveCount(1);
    await page.locator('[data-feedback-example="selection"]').tap();
    expect(
      await page.evaluate(() =>
        window.globalTouchPulses.filter((value) => value !== 0),
      ),
    ).toEqual([4]);
    await page.waitForTimeout(90);
    await page
      .getByRole("button", { name: "Replay the ink", exact: true })
      .tap();
    await expect
      .poll(() =>
        page.evaluate(() =>
          window.globalTouchPulses.filter((value) => value !== 0),
        ),
      )
      .toEqual([4, 6, 5]);
    await expect(page.locator(".haptics-ink-preview")).toContainText(
      "Completed drawings: 1",
    );
    await navigate(page, "layers", "Layers of paper.");
    await expect(page.locator("[data-domino-haptics]")).toHaveCount(1);
    expect(await appScope!.evaluate((element) => element.isConnected)).toBe(
      true,
    );
    await navigate(page, "component/icon-button", "Icon button.");
    await expect(page.locator("[data-domino-haptics]")).toHaveCount(1);
    expect(await appScope!.evaluate((element) => element.isConnected)).toBe(
      true,
    );
  });

  test("the setting and ink-switch catalog pages share the single app controller and preference", async ({
    page,
  }) => {
    await vibrationFeatures(page);
    await page.goto("/#component/touch-feedback-setting");
    const appScope = await page
      .locator("[data-domino-haptics]")
      .elementHandle();
    await expect(page.locator("[data-domino-haptics]")).toHaveCount(1);
    const button = page.locator(
      '.playground-canvas button[data-haptic="selection"]',
    );
    await button.tap();
    await expect(button).toHaveText("A page, chosen ✓");
    expect(
      await page.evaluate(() =>
        window.globalTouchPulses.filter((value) => value !== 0),
      ),
    ).toEqual([4]);
    const setting = page
      .locator(".playground-canvas")
      .getByRole("checkbox", { name: "Touch feedback", exact: true });
    await page.waitForTimeout(90);
    await setting.tap();
    await expect(setting).not.toBeChecked();
    await expect(
      page.getByLabel("Site touch feedback", { exact: true }),
    ).not.toBeChecked();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("notebook-touch-feedback"),
      ),
    ).toBe("off");
    await page.evaluate(() => {
      window.globalTouchPulses = [];
    });
    await button.tap();
    await expect(button).toHaveText("Choose a page");
    expect(
      await page.evaluate(() =>
        window.globalTouchPulses.filter((value) => value !== 0),
      ),
    ).toEqual([]);
    await navigate(page, "component/ink-switch", "Ink switch.");
    await expect(page.locator("[data-domino-haptics]")).toHaveCount(1);
    await expect(
      page.locator(".playground-canvas .dm-ink-switch"),
    ).not.toHaveAttribute("switch");
    expect(await appScope!.evaluate((element) => element.isConnected)).toBe(
      true,
    );
    await navigate(
      page,
      "component/touch-feedback-setting",
      "Touch feedback setting.",
    );
    await setting.tap();
    await expect(
      page.getByLabel("Site touch feedback", { exact: true }),
    ).toBeChecked();
    await page.evaluate(() => {
      window.globalTouchPulses = [];
    });
    await page.waitForTimeout(90);
    await button.tap();
    expect(
      await page.evaluate(() =>
        window.globalTouchPulses.filter((value) => value !== 0),
      ),
    ).toEqual([4]);
    await expect(page.locator("[data-domino-haptics]")).toHaveCount(1);
  });

  test("native switch targets cover real app buttons and the header without duplicate activation", async ({
    page,
  }) => {
    await nativeFeatures(page);
    await page.goto("/#component/icon-button");
    await expect(page.locator("[data-domino-haptics]")).toHaveCount(1);
    const save = page.locator(".playground-canvas .dm-icon-button").first();
    await nativeTap(page, save);
    await expect(save).toHaveAttribute("aria-pressed", "true");
    await expect(save).toHaveAccessibleName("Unsave note");
    await expect(
      page.locator(
        '.dm-native-tap-target[data-native-tap-label="Unsave note"]',
      ),
    ).toHaveCount(1);
    await expect(save.locator("input")).toHaveCount(0);
    const theme = page.getByRole("button", { name: "Dark theme", exact: true });
    await nativeTap(page, theme);
    await expect(theme).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(
      page.locator('.dm-native-tap-target[data-native-tap-label="Dark theme"]'),
    ).toHaveCount(1);
    const toggle = page.locator("#notebook-navigation-toggle");
    await nativeTap(page, toggle);
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("dialog", { name: "Notebook navigation", exact: true }),
    ).toBeVisible();
    expect(
      await page
        .locator('.sidebar .nav-link[href="#overview"]')
        .evaluate((element) => element.tagName),
    ).toBe("A");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Open navigation", exact: true }),
    ).toBeFocused();
  });

  test("large replay artwork keeps its original touch surface while the small replay button is enhanced", async ({
    page,
  }) => {
    await nativeFeatures(page);
    await page.goto("/#component/triple-banner");
    await page.evaluate(() => document.fonts.ready);
    const art = page.locator(".playground-canvas .dm-triple-banner");
    const drawing = art.locator(".dm-sketch-replay");
    await expect(drawing).toHaveAttribute("data-native-tap", "none");
    await drawing.scrollIntoViewIfNeeded();
    const box = (await drawing.boundingBox())!;
    expect(
      await page.evaluate(
        ({ x, y }) =>
          Boolean(
            document.elementFromPoint(x, y)?.closest(".dm-native-tap-target"),
          ),
        {
          x: box.x + box.width / 2,
          y: box.y + Math.min(box.height / 2, 100),
        },
      ),
    ).toBe(false);
    await drawing.tap();
    await expect(art).toHaveAttribute("data-replay", "1");
    const smallReplay = page.getByRole("button", {
      name: "Replay ribbon",
      exact: true,
    });
    await nativeTap(page, smallReplay);
    await expect(smallReplay).toBeFocused();
    await expect(
      page.locator(
        '.dm-native-tap-target[data-native-tap-label="Replay ribbon"]',
      ),
    ).toHaveCount(1);
    await expect(drawing.locator("input")).toHaveCount(0);
  });

  test("one preference follows navigation and reduced motion clears global native targets", async ({
    page,
  }) => {
    await nativeFeatures(page);
    await page.goto("/#haptics");
    const setting = page.getByRole("checkbox", {
      name: "Touch feedback",
      exact: true,
    });
    await setting.tap();
    await expect(setting).not.toBeChecked();
    await expect(page.locator(".dm-native-tap-target")).toHaveCount(0);
    await navigate(page, "component/icon-button", "Icon button.");
    await expect(page.locator(".dm-native-tap-target")).toHaveCount(0);
    const save = page.locator(".playground-canvas .dm-icon-button").first();
    await save.tap();
    await expect(save).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("notebook-touch-feedback"),
      ),
    ).toBe("off");
    await expect(page.locator(".dm-native-tap-target")).toHaveCount(0);
    await navigate(page, "haptics", "A little feedback.");
    await setting.tap();
    await expect(setting).toBeChecked();
    await navigate(page, "component/icon-button", "Icon button.");
    await nativeTap(
      page,
      page.locator(".playground-canvas .dm-icon-button").first(),
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.locator(".dm-native-tap-target")).toHaveCount(0);
    await save.tap();
    await expect(save).toHaveAttribute("aria-pressed", "false");
  });
});
