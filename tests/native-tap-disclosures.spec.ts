import { expect, test, type Locator, type Page } from "@playwright/test";

test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // The fixture owns one controller outside the application provider. This
    // emulates Safari feature detection, not a physical iPhone haptic motor.
    localStorage.setItem("notebook-touch-feedback", "off");
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
  await page.goto("/#component/icon-button");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Icon button.",
  );
});

async function tapCenter(page: Page, control: Locator) {
  await expect(control).toBeVisible();
  const box = (await control.boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

function proxy(page: Page, label: string) {
  return page.locator(
    `.dm-native-tap-target[data-native-tap-label="${label}"]`,
  );
}

test("the shared policy rejects disclosures, hidden scopes and nested closed bodies even without checkVisibility", async ({
  page,
}) => {
  const cases = await page.evaluate(async () => {
    const { isNativeTapTargetEligible } =
      await import("/src/lib/native-tap-policy.ts");
    const root = document.createElement("section");
    root.innerHTML = `
      <button id="ordinary-action">Ordinary action</button>
      <details id="outer-disclosure">
        <summary id="outer-summary">Outer summary <span id="summary-copy">copy</span></summary>
        <button id="closed-body">Closed body action</button>
        <details id="inner-disclosure" open>
          <summary id="inner-summary">Inner summary</summary>
          <button id="nested-body">Nested body action</button>
        </details>
      </details>
      <button id="expanded-control" aria-expanded="false">Expandable control</button>
      <div hidden><button id="hidden-action">Hidden action</button></div>
      <div inert><button id="inert-action">Inert action</button></div>
      <div aria-hidden="true"><button id="aria-hidden-action">Aria hidden action</button></div>
      <div data-native-tap="none"><button id="scope-action">Scope action</button></div>
    `;
    document.body.append(root);
    const element = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
    const eligible = (id: string) => isNativeTapTargetEligible(element(id));
    const initial = Object.fromEntries(
      [
        "ordinary-action",
        "outer-summary",
        "summary-copy",
        "closed-body",
        "nested-body",
        "expanded-control",
        "hidden-action",
        "inert-action",
        "aria-hidden-action",
        "scope-action",
      ].map((id) => [id, eligible(id)]),
    );
    // Safari can retain nonzero layout bounds for a closed details body.
    // This fallback must work on Safari versions lacking checkVisibility too.
    for (const id of ["closed-body", "nested-body", "scope-action"]) {
      Object.defineProperty(element(id), "checkVisibility", {
        configurable: true,
        value: undefined,
      });
    }
    const fallbackClosed = [eligible("closed-body"), eligible("nested-body")];
    const outer = element("outer-disclosure") as HTMLDetailsElement;
    const inner = element("inner-disclosure") as HTMLDetailsElement;
    outer.open = true;
    const bothOpen = eligible("nested-body");
    inner.open = false;
    const innerClosed = eligible("nested-body");
    root.setAttribute("data-native-tap", "none");
    const rootOptOut = eligible("ordinary-action");
    root.remove();
    return { initial, fallbackClosed, bothOpen, innerClosed, rootOptOut };
  });
  expect(cases.initial).toEqual({
    "ordinary-action": true,
    "outer-summary": false,
    "summary-copy": false,
    "closed-body": false,
    "nested-body": false,
    "expanded-control": false,
    "hidden-action": false,
    "inert-action": false,
    "aria-hidden-action": false,
    "scope-action": false,
  });
  expect(cases.fallbackClosed).toEqual([false, false]);
  expect(cases.bothOpen).toBe(true);
  expect(cases.innerClosed).toBe(false);
  expect(cases.rootOptOut).toBe(false);
});

test("closing nested disclosures removes their native targets and leaves native summaries free to receive touch", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const { nativeTapTargets } = await import("/src/lib/nativeTapTargets.ts");
    const root = document.createElement("section");
    root.id = "native-disclosure-fixture";
    root.setAttribute("data-domino-haptics", "");
    root.style.cssText =
      "position:fixed;inset:80px 24px auto;padding:16px;background:white;color:black;z-index:200;max-height:650px;overflow:auto";
    root.innerHTML = `
      <button style="width:180px;height:44px">Small fixture action</button>
      <details id="fixture-outer" open>
        <summary style="display:block;padding:20px 8px">Outer fixture disclosure</summary>
        <button id="fixture-closed-action" style="width:180px;height:44px">Closed fixture body action</button>
        <details id="fixture-inner" open>
          <summary style="display:block;padding:20px 8px">Inner fixture disclosure</summary>
          <button id="fixture-nested-action" style="width:180px;height:44px">Nested fixture body action</button>
        </details>
      </details>
      <button aria-expanded="false" style="width:250px;height:64px">Expandable fixture action</button>
      <div data-native-tap="none"><button style="width:180px;height:44px">Opted out fixture action</button></div>
      <div id="fixture-scroll-panel" style="height:110px;overflow:auto;margin-top:12px">
        <button style="width:180px;height:44px">Scroll panel fixture action</button>
        <div style="height:400px"></div>
      </div>
    `;
    document.body.append(root);
    // Reproduce WebKit's retained closed-details geometry in Chromium CI too.
    // Older Safari may also lack checkVisibility, so the semantic ancestor
    // guard must reject these controls before any retained box becomes a proxy.
    for (const id of ["fixture-closed-action", "fixture-nested-action"]) {
      const button = root.querySelector<HTMLButtonElement>(`#${id}`)!;
      const readBox = button.getBoundingClientRect.bind(button);
      const retainedBox = readBox();
      button.getBoundingClientRect = () =>
        button.closest("details:not([open])") ? retainedBox : readBox();
      Object.defineProperty(button, "checkVisibility", {
        configurable: true,
        value: undefined,
      });
    }
    (window as any).disclosureFixture = nativeTapTargets(root, () => true);
  });
  const root = page.locator("#native-disclosure-fixture");
  const outer = root.locator("#fixture-outer");
  const inner = root.locator("#fixture-inner");
  await expect(proxy(page, "Small fixture action")).toHaveCount(1);
  await expect(proxy(page, "Closed fixture body action")).toHaveCount(1);
  await expect(proxy(page, "Nested fixture body action")).toHaveCount(1);
  await expect(proxy(page, "Outer fixture disclosure")).toHaveCount(0);
  await expect(proxy(page, "Inner fixture disclosure")).toHaveCount(0);
  await expect(proxy(page, "Expandable fixture action")).toHaveCount(0);
  await expect(proxy(page, "Opted out fixture action")).toHaveCount(0);

  await tapCenter(page, outer.locator(":scope > summary"));
  await expect(outer).not.toHaveAttribute("open");
  await expect(proxy(page, "Closed fixture body action")).toHaveCount(0);
  await expect(proxy(page, "Nested fixture body action")).toHaveCount(0);
  await expect(inner).toHaveAttribute("open");

  await tapCenter(page, outer.locator(":scope > summary"));
  await expect(outer).toHaveAttribute("open");
  await expect(proxy(page, "Nested fixture body action")).toHaveCount(1);
  await tapCenter(page, inner.locator(":scope > summary"));
  await expect(inner).not.toHaveAttribute("open");
  await expect(proxy(page, "Nested fixture body action")).toHaveCount(0);
  await expect(proxy(page, "Closed fixture body action")).toHaveCount(1);

  // A real scrolling panel still owns the few eligible small-button targets;
  // fixed body overlays must not steal the panel's scroll chain.
  const panelTarget = proxy(page, "Scroll panel fixture action");
  await expect(panelTarget).toHaveCount(1);
  expect(
    await panelTarget.evaluate((element) => ({
      host: element.parentElement?.parentElement?.id,
      position: getComputedStyle(element).position,
    })),
  ).toEqual({ host: "fixture-scroll-panel", position: "absolute" });

  await root.evaluate((element) =>
    element.setAttribute("data-native-tap", "none"),
  );
  await expect(root.locator(".dm-native-tap-target")).toHaveCount(0);
  await root.evaluate((element) => element.removeAttribute("data-native-tap"));
  await expect(proxy(page, "Small fixture action")).toHaveCount(1);
  await page.evaluate(() => (window as any).disclosureFixture.destroy());
});
