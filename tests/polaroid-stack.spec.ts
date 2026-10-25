import { expect, test, type Page } from "@playwright/test";

// Native page-scale gestures use the full Chromium browser rather than CI's
// separate headless shell. Channel is a worker option and belongs at file scope.
if (process.env.CI) test.use({ channel: "chromium" });

async function fixture(
  page: Page,
  options: {
    ids?: string[];
    quiet?: boolean;
    omitIds?: boolean;
    longCaption?: boolean;
  } = {},
) {
  await page.goto("/#component/polaroid-stack");
  await page.evaluate(async (options) => {
    const reactModule = await import("/node_modules/.vite/deps/react.js");
    const React = reactModule.default ?? reactModule;
    const client = await import("/node_modules/.vite/deps/react-dom_client.js");
    const createRoot = client.createRoot ?? client.default.createRoot;
    const { PolaroidStack } = await import("/src/lib/polaroid-stack.tsx");
    (window as any).printFixture?.unmount();
    document.querySelector("#print-fixture-host")?.remove();
    const pool = Object.fromEntries(
      ["A", "B", "C", "D", "E"].map((id, index) => [
        id,
        {
          ...(options.omitIds ? {} : { id }),
          src: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="${["#d5e3cd", "#eed5bf", "#ded9e8", "#c6d9de", "#efe7d7"][index]}"/><path d="M200 520Q640 80 1080 520" fill="none" stroke="#252b2e" stroke-width="12"/></svg>`)}`,
          alt: `Original test illustration ${id}`,
          caption: options.longCaption
            ? `Print ${id}: A much longer handwritten caption with room for curiosity and averylongunbrokencaptionthatmuststillwrapnaturally.`
            : `A small paper illustration ${id}.`,
          objectPosition: "20% 70%",
        },
      ]),
    );
    const state: any = {
      changes: [],
      references: [],
      pool,
      preventArrows: false,
    };
    (window as any).printFixture = state;
    const host = document.createElement("section");
    host.id = "print-fixture-host";
    host.style.cssText =
      "width:calc(100% - 32px);max-width:420px;margin:100px auto 0;background:var(--dm-paper)";
    document.body.append(host);
    const spacer = document.createElement("div");
    spacer.style.height = "900px";
    spacer.setAttribute("aria-hidden", "true");
    host.after(spacer);
    function Harness() {
      const [photos, setPhotos] = React.useState(
        (options.ids ?? ["A", "B", "C"]).map((id: string) => pool[id]),
      );
      const [quiet, setQuiet] = React.useState(options.quiet ?? false);
      const [ratio, setRatio] = React.useState(16 / 9);
      state.setPhotos = (ids: string[]) => setPhotos(ids.map((id) => pool[id]));
      state.setQuiet = setQuiet;
      state.setRatio = setRatio;
      state.patch = (id: string, patch: object) => {
        pool[id] = { ...pool[id], ...patch };
        setPhotos((current: any[]) =>
          current.map((photo) =>
            (photo.id ?? photo.src) === (options.omitIds ? pool[id].src : id)
              ? pool[id]
              : photo,
          ),
        );
      };
      return React.createElement(PolaroidStack, {
        photos,
        quiet,
        aspectRatio: ratio,
        id: "print-fixture",
        className: "fixture-print-stack",
        "data-consumer": "preserved",
        label: "Original illustration prints",
        onKeyDown: (event: KeyboardEvent) => {
          if (state.preventArrows) event.preventDefault();
        },
        onPointerDown: (event: any) => {
          state.lastPointerId = event.pointerId;
          state.lastPointerType = event.pointerType;
        },
        onIndexChange: (index: number, photo: any) => {
          state.changes.push({ index, id: photo.id, src: photo.src });
          state.references.push(Object.values(pool).includes(photo));
        },
      });
    }
    const root = createRoot(host);
    state.unmount = () => {
      root.unmount();
      spacer.remove();
    };
    root.render(React.createElement(Harness));
  }, options);
  await expect(stack(page)).toBeVisible();
  if ((options.ids ?? ["A", "B", "C"]).length)
    await surface(page).scrollIntoViewIfNeeded();
}
const stack = (page: Page) => page.locator("#print-fixture");
const surface = (page: Page) =>
  stack(page).locator(".dm-polaroid-stack__surface");
const front = (page: Page) =>
  stack(page).locator('.dm-polaroid-stack__photo[data-current="true"]');
const changes = (page: Page) =>
  page.evaluate(() => (window as any).printFixture.changes);
async function idle(page: Page) {
  await expect(stack(page)).toHaveAttribute("data-state", "idle");
}
async function setPhotos(page: Page, ids: string[]) {
  await page.evaluate(
    (ids) => (window as any).printFixture.setPhotos(ids),
    ids,
  );
}

async function touch(page: Page) {
  const session = await page.context().newCDPSession(page);
  const bounds = (await surface(page).boundingBox())!;
  const start = {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
  const base = Date.now() / 1000 - 1;
  const send = (
    type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel",
    points: { x: number; y: number; id: number }[],
    at: number,
  ) =>
    session.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: points,
      timestamp: base + at / 1000,
    });
  await send("touchStart", [{ ...start, id: 1 }], 0);
  return {
    session,
    start,
    send,
    move: (dx: number, dy: number, at = 100) =>
      send("touchMove", [{ x: start.x + dx, y: start.y + dy, id: 1 }], at),
    end: (at = 120) => send("touchEnd", [], at),
    cancel: (at = 120) => send("touchCancel", [], at),
  };
}

test("empty and single-photo states retain native attributes and safe image sizing", async ({
  page,
}) => {
  await fixture(page, { ids: [] });
  await expect(stack(page)).toHaveText("No photos to display.");
  await expect(stack(page)).toHaveAttribute("data-consumer", "preserved");
  await expect(surface(page)).toHaveCount(0);
  await setPhotos(page, ["A"]);
  await expect(front(page).locator("img")).toHaveAttribute(
    "alt",
    "Original test illustration A",
  );
  await expect(surface(page)).toHaveAttribute("aria-disabled", "true");
  await expect(surface(page)).toHaveAttribute("tabindex", "-1");
  await expect(
    stack(page).getByRole("button", { name: "Next photo", exact: true }),
  ).toBeDisabled();
  await surface(page).evaluate((button: HTMLButtonElement) => button.click());
  expect(await changes(page)).toEqual([]);
  await expect(front(page).locator("img")).toHaveCSS(
    "object-position",
    "20% 70%",
  );
  const ratio = () =>
    front(page)
      .locator("img")
      .evaluate(
        (image: HTMLImageElement) => image.clientWidth / image.clientHeight,
      );
  expect(await ratio()).toBeCloseTo(16 / 9, 1);
  await page.evaluate(() => (window as any).printFixture.setRatio(4 / 3));
  await expect.poll(ratio).toBeCloseTo(4 / 3, 1);
  await page.evaluate(() => (window as any).printFixture.setRatio(-1));
  await expect.poll(ratio).toBeCloseTo(16 / 9, 1);
});

test("five-photo navigation wraps, keeps a stable focused surface, and reports actual photo objects once", async ({
  page,
}) => {
  await fixture(page, { ids: ["A", "B", "C", "D", "E"], quiet: true });
  await expect(stack(page).locator(".dm-polaroid-stack__photo")).toHaveCount(3);
  expect(
    await stack(page)
      .locator('.dm-polaroid-stack__photo[aria-hidden="true"] img')
      .count(),
  ).toBe(2);
  const stable = await surface(page).elementHandle();
  await surface(page).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(stack(page)).toHaveAttribute("data-index", "4");
  await expect(front(page)).toHaveAttribute("data-photo-id", "E");
  await page.keyboard.press("ArrowRight");
  await expect(stack(page)).toHaveAttribute("data-index", "0");
  await page.keyboard.press("Enter");
  await expect(stack(page)).toHaveAttribute("data-index", "1");
  await page.keyboard.press("Space");
  await expect(stack(page)).toHaveAttribute("data-index", "2");
  await expect(surface(page)).toBeFocused();
  expect(
    await surface(page).evaluate(
      (button, original) => button === original,
      stable,
    ),
  ).toBe(true);
  await page.evaluate(() => {
    (window as any).printFixture.preventArrows = true;
  });
  await page.keyboard.press("ArrowRight");
  await expect(stack(page)).toHaveAttribute("data-index", "2");
  expect((await changes(page)).map((change: any) => change.id)).toEqual([
    "E",
    "A",
    "B",
    "C",
  ]);
  expect(
    await page.evaluate(() => (window as any).printFixture.references),
  ).toEqual([true, true, true, true]);
});

for (const omitIds of [false, true]) {
  test(`photo ${omitIds ? "URL" : "ID"} identity survives array changes without fabricated callbacks`, async ({
    page,
  }) => {
    await fixture(page, { ids: ["A", "B", "C", "D", "E"], omitIds });
    await stack(page)
      .getByRole("button", { name: "Next photo", exact: true })
      .click();
    await expect(stack(page)).toHaveAttribute("data-index", "1");
    const selectedSrc = await front(page).locator("img").getAttribute("src");
    await setPhotos(page, ["E", "A", "B", "C", "D"]);
    await idle(page);
    await expect(stack(page)).toHaveAttribute("data-index", "2");
    await expect(front(page).locator("img")).toHaveAttribute(
      "src",
      selectedSrc!,
    );
    await setPhotos(page, ["E", "A", "C", "D"]);
    await expect(stack(page)).toHaveAttribute("data-index", "2");
    await expect(front(page).locator("img")).toHaveAttribute(
      "alt",
      "Original test illustration C",
    );
    await setPhotos(page, []);
    await expect(stack(page)).toHaveText("No photos to display.");
    await setPhotos(page, ["D"]);
    await expect(front(page).locator("img")).toHaveAttribute(
      "alt",
      "Original test illustration D",
    );
    expect(await changes(page)).toHaveLength(1);
  });
}

test("excursion animation owns real underlying cards, locks extra actions, and cleans up on finish", async ({
  page,
}) => {
  await fixture(page);
  const frames = await stack(page)
    .getByRole("button", { name: "Next photo", exact: true })
    .evaluate(async (button) => {
      button.click();
      await new Promise(requestAnimationFrame);
      const root = button.closest(".dm-polaroid-stack")!;
      const card = root.querySelector<HTMLElement>(
        ".dm-polaroid-stack__photo--outgoing",
      )!;
      const animation = card
        .getAnimations()
        .find(
          (animation) =>
            animation instanceof CSSAnimation &&
            animation.animationName === "dm-polaroid-cycle",
        )!;
      animation.pause();
      const frame = (time: number) => {
        animation.currentTime = time;
        const style = getComputedStyle(card);
        return { transform: style.transform, z: style.zIndex };
      };
      const result = {
        duration: animation.effect!.getTiming().duration,
        start: frame(0),
        away: frame(220),
        tucked: frame(475),
        image: !!card.querySelector("img"),
        cardCount: root.querySelectorAll(".dm-polaroid-stack__photo").length,
      };
      (window as any).printFixture.animation = animation;
      return result;
    });
  expect(frames.duration).toBe(480);
  expect(frames.image).toBe(true);
  expect(frames.cardCount).toBe(3);
  expect(frames.away.transform).not.toBe(frames.start.transform);
  expect(frames.tucked.transform).not.toBe(frames.away.transform);
  expect(frames.start.z).toBe("5");
  expect(Number(frames.tucked.z)).toBeLessThan(Number(frames.start.z));
  await expect(stack(page)).toHaveAttribute("data-index", "1");
  await stack(page)
    .getByRole("button", { name: "Next photo", exact: true })
    .click();
  await expect(stack(page)).toHaveAttribute("data-index", "1");
  expect(await changes(page)).toHaveLength(1);
  await page.evaluate(() => {
    const animation = (window as any).printFixture.animation;
    animation.currentTime = 470;
    animation.play();
  });
  await idle(page);
  await expect(
    stack(page).locator(".dm-polaroid-stack__photo--outgoing"),
  ).toHaveCount(0);
  await stack(page)
    .getByRole("button", { name: "Previous photo", exact: true })
    .click();
  await expect(stack(page)).toHaveAttribute("data-index", "0");
  await idle(page);
  expect(await changes(page)).toHaveLength(2);
});

for (const width of [320, 390, 844]) {
  test(`real cards and long captions fit ${width}px without horizontal page overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    await fixture(page, { longCaption: true });
    await page.evaluate(() => document.fonts.ready);
    const bounds = (await stack(page).boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    const caption = front(page).locator(".dm-polaroid-stack__caption");
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
    await stack(page)
      .getByRole("button", { name: "Previous photo", exact: true })
      .click();
    await expect(stack(page)).toHaveAttribute("data-state", "cycling");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await idle(page);
  });
}

test.describe("trusted mobile gestures", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });

  test("a distance swipe follows the finger, commits once, and the next real tap remains usable", async ({
    page,
  }) => {
    await fixture(page);
    await expect(surface(page)).toHaveCSS("touch-action", "pan-y pinch-zoom");
    await expect(surface(page)).toHaveAttribute("data-native-tap", "none");
    const before = (await front(page).boundingBox())!;
    const gesture = await touch(page);
    await gesture.move(-90, 3, 180);
    await expect(stack(page)).toHaveAttribute("data-state", "dragging");
    expect((await front(page).boundingBox())!.x).toBeLessThan(before.x - 30);
    await gesture.end(200);
    await expect(stack(page)).toHaveAttribute("data-index", "1");
    await idle(page);
    expect(await changes(page)).toHaveLength(1);
    await surface(page).tap();
    await expect(stack(page)).toHaveAttribute("data-index", "2");
    await idle(page);
    expect(await changes(page)).toHaveLength(2);
    await gesture.session.detach();
  });

  test("a short fast flick commits while a slow short drag springs home", async ({
    page,
  }) => {
    await fixture(page);
    let gesture = await touch(page);
    await gesture.move(-22, 1, 20);
    await gesture.end(30);
    await expect(stack(page)).toHaveAttribute("data-index", "1");
    await idle(page);
    gesture = await touch(page);
    await gesture.move(22, 1, 250);
    await expect(stack(page)).toHaveAttribute("data-state", "dragging");
    await gesture.end(290);
    await expect(stack(page)).toHaveAttribute("data-state", "settling");
    await expect(stack(page)).toHaveAttribute("data-index", "1");
    await idle(page);
    const translation = await front(page).evaluate(
      (card) => new DOMMatrixReadOnly(getComputedStyle(card).transform).m41,
    );
    expect(translation).toBeCloseTo(0, 1);
    expect(await changes(page)).toHaveLength(1);
    await gesture.session.detach();
  });

  test("vertical scrolling, canceled touches, and multitouch never change the photo", async ({
    page,
  }) => {
    await fixture(page);
    let gesture = await touch(page);
    const scrollBefore = await page.evaluate(() => scrollY);
    await gesture.move(2, -125, 180);
    await gesture.end(210);
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeGreaterThan(scrollBefore + 30);
    await expect(stack(page)).toHaveAttribute("data-index", "0");
    await surface(page).scrollIntoViewIfNeeded();
    gesture = await touch(page);
    await gesture.move(-70, 1, 150);
    await gesture.cancel(180);
    await idle(page);
    await expect(stack(page)).toHaveAttribute("data-index", "0");
    await surface(page).dispatchEvent("click", { detail: 1, bubbles: true });
    await expect(stack(page)).toHaveAttribute("data-index", "0");
    gesture = await touch(page);
    await gesture.move(-60, 1, 150);
    const pointerId = await page.evaluate(
      () => (window as any).printFixture.lastPointerId,
    );
    await surface(page).dispatchEvent("lostpointercapture", {
      pointerId,
      pointerType: "touch",
      bubbles: true,
    });
    await gesture.cancel(175);
    await idle(page);
    await expect(stack(page)).toHaveAttribute("data-index", "0");
    gesture = await touch(page);
    await gesture.move(-60, 1, 150);
    await gesture.send(
      "touchStart",
      [
        { x: gesture.start.x - 60, y: gesture.start.y + 1, id: 1 },
        { x: gesture.start.x + 60, y: gesture.start.y, id: 2 },
      ],
      170,
    );
    await gesture.end(200);
    await idle(page);
    await expect(stack(page)).toHaveAttribute("data-index", "0");
    expect(await changes(page)).toEqual([]);
    await surface(page).tap();
    await expect(stack(page)).toHaveAttribute("data-index", "1");
    await gesture.session.detach();
  });

  test("trusted pen gestures use the same distance and flick contract", async ({
    page,
  }) => {
    await fixture(page);
    const session = await page.context().newCDPSession(page);
    const box = (await surface(page).boundingBox())!;
    const x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    const timestamp = Date.now() / 1000 - 1;
    await session.send("Input.dispatchMouseEvent", {
      type: "mousePressed",
      x,
      y,
      pointerType: "pen",
      button: "left",
      buttons: 1,
      clickCount: 1,
      timestamp,
    });
    await session.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: x - 75,
      y: y + 2,
      pointerType: "pen",
      button: "left",
      buttons: 1,
      timestamp: timestamp + 0.15,
    });
    await expect(stack(page)).toHaveAttribute("data-state", "dragging");
    expect(
      await page.evaluate(() => (window as any).printFixture.lastPointerType),
    ).toBe("pen");
    await session.send("Input.dispatchMouseEvent", {
      type: "mouseReleased",
      x: x - 75,
      y: y + 2,
      pointerType: "pen",
      button: "left",
      buttons: 0,
      clickCount: 1,
      timestamp: timestamp + 0.18,
    });
    await expect(stack(page)).toHaveAttribute("data-index", "1");
    await idle(page);
    expect(await changes(page)).toHaveLength(1);
    await session.detach();
  });

  test.describe("native browser pinch integration", () => {
    test("native pinch zoom remains available without cycling the prints", async ({
      page,
      browser,
    }) => {
      await fixture(page);
      await page.evaluate(() => document.fonts.ready);
      await surface(page).scrollIntoViewIfNeeded();
      await expect(surface(page)).toBeInViewport({ ratio: 1 });
      const session = await page.context().newCDPSession(page);
      try {
        // Playwright's generic touch context advertises one touch point. A phone
        // pinch needs actual multitouch capability, not just a mobile viewport.
        await session.send("Emulation.setTouchEmulationEnabled", {
          enabled: true,
          maxTouchPoints: 5,
        });
        expect(await page.evaluate(() => navigator.maxTouchPoints)).toBe(5);
        const diagnostics = await surface(page).evaluate((button) => {
          const box = button.getBoundingClientRect();
          const x = box.x + box.width / 2,
            y = box.y + box.height / 2;
          const hit = document.elementFromPoint(x, y);
          return {
            x,
            y,
            box: box.toJSON(),
            hitWithinSurface: !!hit && button.contains(hit),
            hitTag: hit?.tagName,
            hitClass: hit?.className,
            touchAction: getComputedStyle(button).touchAction,
            viewport: {
              width: innerWidth,
              height: innerHeight,
              scale: visualViewport?.scale,
              offsetTop: visualViewport?.offsetTop,
              offsetLeft: visualViewport?.offsetLeft,
            },
            maxTouchPoints: navigator.maxTouchPoints,
            userAgent: navigator.userAgent,
          };
        });
        const message = JSON.stringify({
          browser: browser.version(),
          channel: process.env.CI ? "chromium" : "configured Chrome",
          ...diagnostics,
        });
        expect(diagnostics.hitWithinSurface, message).toBe(true);
        expect(diagnostics.touchAction, message).toBe("pan-y pinch-zoom");
        const before = await page.evaluate(() => visualViewport?.scale ?? 1);
        const pinch = () =>
          session.send("Input.synthesizePinchGesture", {
            x: diagnostics.x,
            y: diagnostics.y,
            scaleFactor: 1.3,
            relativeSpeed: 300,
            gestureSourceType: "touch",
          });
        const previousAction = await surface(page).evaluate(
          (button: HTMLElement) => {
            const previous = button.style.touchAction;
            button.style.touchAction = "none";
            return previous;
          },
        );
        await pinch();
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        expect(
          await page.evaluate(() => visualViewport?.scale ?? 1),
          `touch-action:none negative control: ${message}`,
        ).toBeCloseTo(before, 2);
        await surface(page).evaluate((button: HTMLElement, previous) => {
          button.style.touchAction = previous;
        }, previousAction);
        await expect(surface(page)).toHaveCSS(
          "touch-action",
          "pan-y pinch-zoom",
        );
        await pinch();
        await expect
          .poll(() => page.evaluate(() => visualViewport?.scale ?? 1), {
            message,
          })
          .toBeGreaterThan(before + 0.05);
        await expect(stack(page)).toHaveAttribute("data-index", "0");
        expect(await changes(page)).toEqual([]);
      } finally {
        await session.detach();
      }
    });
  });

  test("quiet and reduced motion keep gestures useful without moving the paper", async ({
    page,
  }) => {
    await fixture(page, { quiet: true });
    const before = (await front(page).boundingBox())!;
    let gesture = await touch(page);
    await gesture.move(-70, 1, 160);
    expect(
      Math.abs((await front(page).boundingBox())!.x - before.x),
    ).toBeLessThan(1);
    await gesture.end(180);
    await expect(stack(page)).toHaveAttribute("data-index", "1");
    await idle(page);
    await page.evaluate(() => (window as any).printFixture.setQuiet(false));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await surface(page).tap();
    await expect(stack(page)).toHaveAttribute("data-index", "2");
    await idle(page);
    await expect(front(page)).toHaveCSS("animation-name", "none");
    await expect(front(page)).toHaveCSS("transition-duration", "0s");
    await gesture.session.detach();
  });

  test("unmounting during a drag leaves no callbacks or orphaned gesture handlers", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await fixture(page);
    const gesture = await touch(page);
    await gesture.move(-55, 1, 150);
    await expect(stack(page)).toHaveAttribute("data-state", "dragging");
    await page.evaluate(() => (window as any).printFixture.unmount());
    await gesture.end(200);
    await page.waitForTimeout(400);
    expect(await changes(page)).toEqual([]);
    expect(errors).toEqual([]);
    await gesture.session.detach();
  });
});
