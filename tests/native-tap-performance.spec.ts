import { test, expect, type Page } from "@playwright/test";

test.use({ isMobile: true, hasTouch: true, viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("notebook-touch-feedback", "off");
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: undefined });
    if (!("switch" in HTMLInputElement.prototype)) Object.defineProperty(HTMLInputElement.prototype, "switch", { configurable: true, get() { return this.hasAttribute("switch"); } });
  });
});
async function fixture(page: Page) {
  await page.goto("/#component/icon-button");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Icon button.");
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const { nativeTapTargets } = await import("/src/lib/nativeTapTargets.ts");
    const root = document.createElement("section");
    root.id = "native-performance-fixture";
    root.setAttribute("data-domino-haptics", "");
    root.style.cssText = "position:relative;width:330px;margin:40px auto 0;padding:12px";
    const button = document.createElement("button");
    button.id = "visible-fixture-button";
    button.textContent = "Visible fixture action";
    button.style.cssText = "display:block;width:250px;height:48px";
    root.append(button);
    const role = document.createElement("div");
    role.id = "dynamic-role-fixture";
    role.textContent = "Dynamic role action";
    role.style.cssText = "width:250px;height:48px";
    root.append(role);
    const spacer = document.createElement("div"); spacer.style.height = "1000px"; root.append(spacer);
    const hidden = document.createElement("div"); hidden.style.display = "none";
    for (let index = 0; index < 240; index++) {
      const item = document.createElement("button"); item.textContent = `Offscreen fixture ${index}`; item.style.cssText = "display:block;height:48px";
      (index % 2 ? root : hidden).append(item);
    }
    root.append(hidden); document.body.append(root);
    const state = { active: false, styles: 0, boxes: 0, discoveries: 0, clicks: 0 };
    (window as any).nativePerformanceFixture = { state, root, cleanup: nativeTapTargets(root, () => true) };
    button.addEventListener("click", () => { state.clicks++; });
    role.addEventListener("click", () => { state.clicks++; });
    const query = root.querySelectorAll.bind(root);
    root.querySelectorAll = ((...args: Parameters<typeof root.querySelectorAll>) => { if (state.active) state.discoveries++; return query(...args); }) as typeof root.querySelectorAll;
    const styles = getComputedStyle;
    window.getComputedStyle = (...args) => { if (state.active) state.styles++; return styles(...args); };
    const bounds = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () { if (state.active) state.boxes++; return bounds.call(this); };
    button.scrollIntoView({ block: "center", behavior: "instant" });
  });
  await page.locator("#visible-fixture-button").scrollIntoViewIfNeeded();
  await expect(page.locator('.dm-native-tap-target[data-native-tap-label="Visible fixture action"]')).toHaveCount(1);
}
async function tap(page: Page, label: string) {
  const input = page.locator(`.dm-native-tap-target[data-native-tap-label="${label}"]`);
  await expect(input).toHaveCount(1);
  const box = (await input.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}
test("long scroll scopes avoid offscreen style walks and do not rediscover candidates for pose/class changes", async ({ page }) => {
  await fixture(page);
  const result = await page.evaluate(async () => {
    const { state, root } = (window as any).nativePerformanceFixture;
    state.active = true;
    for (let step = 0; step < 12; step++) {
      root.style.setProperty("--fixture-pose", `${step}px`);
      root.classList.toggle("fixture-odd", Boolean(step % 2));
      window.scrollBy(0, step % 2 ? -8 : 8);
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    state.active = false;
    return { ...state };
  });
  expect(result.discoveries).toBe(0);
  expect(result.styles).toBeLessThan(1000);
  expect(result.boxes).toBeLessThan(10_000);
});
test("cached candidates retain trusted tap forwarding and refresh visibility, disabled state and new button roles", async ({ page }) => {
  await fixture(page);
  await tap(page, "Visible fixture action");
  expect(await page.evaluate(() => (window as any).nativePerformanceFixture.state.clicks)).toBe(1);
  await page.locator("#visible-fixture-button").evaluate(element => { element.style.visibility = "hidden"; });
  await expect(page.locator('.dm-native-tap-target[data-native-tap-label="Visible fixture action"]')).toHaveCount(0);
  await page.locator("#visible-fixture-button").evaluate(element => { element.style.visibility = "visible"; element.setAttribute("disabled", ""); });
  await expect(page.locator('.dm-native-tap-target[data-native-tap-label="Visible fixture action"]')).toHaveCount(0);
  await page.locator("#visible-fixture-button").evaluate(element => element.removeAttribute("disabled"));
  await tap(page, "Visible fixture action");
  expect(await page.evaluate(() => (window as any).nativePerformanceFixture.state.clicks)).toBe(2);
  await page.locator("#dynamic-role-fixture").evaluate(element => element.setAttribute("role", "button"));
  await tap(page, "Dynamic role action");
  expect(await page.evaluate(() => (window as any).nativePerformanceFixture.state.clicks)).toBe(3);
  await page.locator("#dynamic-role-fixture").evaluate(element => element.removeAttribute("role"));
  await expect(page.locator('.dm-native-tap-target[data-native-tap-label="Dynamic role action"]')).toHaveCount(0);
  await page.locator("#visible-fixture-button").evaluate(element => element.remove());
  await expect(page.locator('.dm-native-tap-target[data-native-tap-label="Visible fixture action"]')).toHaveCount(0);
});
