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
    await idle(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
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
    }, testInfo) => {
      const results: any[] = [];
      const frame = (targetPage: Page) =>
        targetPage.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => resolve()),
            ),
        );
      for (const method of ["synthesized", "raw-two-touch"] as const) {
        for (const targetKind of ["plain", "stack"] as const) {
          // A fresh page prevents a previous successful native pinch from
          // changing the next probe's visual viewport or coordinate mapping.
          const targetPage = await page.context().newPage();
          let session: import("@playwright/test").CDPSession | undefined;
          try {
            if (targetKind === "stack") await fixture(targetPage);
            else
              await targetPage.setContent(
                `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;min-height:160vh}#pinch-plain{position:fixed;inset:32px;background:#efe7d7;touch-action:pan-y pinch-zoom}</style><main id="pinch-plain">Native pinch positive control</main>`,
              );
            await targetPage.bringToFront();
            await targetPage.evaluate(() => document.fonts.ready);
            const target =
              targetKind === "stack"
                ? surface(targetPage)
                : targetPage.locator("#pinch-plain");
            await target.scrollIntoViewIfNeeded();
            await expect(target).toBeInViewport({ ratio: 1 });
            session = await targetPage.context().newCDPSession(targetPage);
            await session.send("Emulation.setTouchEmulationEnabled", {
              enabled: true,
              maxTouchPoints: 5,
            });
            expect(
              await targetPage.evaluate(() => navigator.maxTouchPoints),
            ).toBe(5);
            const diagnostics = await target.evaluate((element) => {
              const box = element.getBoundingClientRect();
              const x = box.x + box.width / 2,
                y = box.y + box.height / 2;
              const hit = document.elementFromPoint(x, y);
              return {
                x,
                y,
                box: box.toJSON(),
                hitWithinSurface: !!hit && element.contains(hit),
                touchAction: getComputedStyle(element).touchAction,
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
            expect(diagnostics.hitWithinSurface).toBe(true);
            expect(diagnostics.touchAction).toBe("pan-y pinch-zoom");
            await targetPage.evaluate(() => {
              (window as any).stopPinchLog?.();
              (window as any).pinchEvents = [];
              const types = [
                "pointerdown",
                "pointermove",
                "pointerup",
                "pointercancel",
                "touchstart",
                "touchmove",
                "touchend",
                "touchcancel",
              ];
              const record = (event: Event) => {
                const log = (window as any).pinchEvents;
                if (log.length >= 100) return;
                const pointer = event as PointerEvent,
                  touch = event as TouchEvent;
                log.push({
                  type: event.type,
                  trusted: event.isTrusted,
                  prevented: event.defaultPrevented,
                  pointerId: pointer.pointerId,
                  pointerType: pointer.pointerType,
                  x: pointer.clientX,
                  y: pointer.clientY,
                  points: touch.touches
                    ? Array.from(touch.touches).map((point) => ({
                        id: point.identifier,
                        x: point.clientX,
                        y: point.clientY,
                      }))
                    : undefined,
                  target:
                    (event.target as Element)?.className ||
                    (event.target as Element)?.id,
                });
              };
              for (const type of types)
                document.addEventListener(type, record, { passive: true });
              (window as any).stopPinchLog = () => {
                for (const type of types)
                  document.removeEventListener(type, record);
              };
            });
            const before = await targetPage.evaluate(
              () => visualViewport?.scale ?? 1,
            );
            expect(before).toBe(1);
            const pinch = async () => {
              await targetPage.evaluate(() => {
                (window as any).pinchEvents = [];
              });
              await frame(targetPage);
              await frame(targetPage);
              let protocolError: string | undefined;
              try {
                if (method === "synthesized")
                  await session!.send("Input.synthesizePinchGesture", {
                    x: diagnostics.x,
                    y: diagnostics.y,
                    scaleFactor: 1.3,
                    relativeSpeed: 300,
                    gestureSourceType: "touch",
                  });
                else {
                  const points = (halfSpan: number) => [
                    { id: 1, x: diagnostics.x - halfSpan, y: diagnostics.y },
                    { id: 2, x: diagnostics.x + halfSpan, y: diagnostics.y },
                  ];
                  try {
                    await session!.send("Input.dispatchTouchEvent", {
                      type: "touchStart",
                      touchPoints: points(84),
                    });
                    for (let step = 1; step <= 12; step++) {
                      await frame(targetPage);
                      await session!.send("Input.dispatchTouchEvent", {
                        type: "touchMove",
                        touchPoints: points(84 + ((128 - 84) * step) / 12),
                      });
                    }
                  } finally {
                    await session!.send("Input.dispatchTouchEvent", {
                      type: "touchEnd",
                      touchPoints: [],
                    });
                  }
                }
              } catch (error) {
                protocolError = String(error);
              }
              await frame(targetPage);
              await frame(targetPage);
              return targetPage.evaluate(
                (protocolError) => ({
                  scale: visualViewport?.scale ?? 1,
                  events: (window as any).pinchEvents,
                  index:
                    document.querySelector<HTMLElement>("#print-fixture")
                      ?.dataset.index,
                  changes: (window as any).printFixture?.changes,
                  protocolError,
                }),
                protocolError,
              );
            };
            const previousAction = await target.evaluate(
              (element: HTMLElement) => {
                const previous = element.style.touchAction;
                element.style.touchAction = "none";
                return previous;
              },
            );
            const negative = await pinch();
            await target.evaluate((element: HTMLElement, previous) => {
              element.style.touchAction = previous;
            }, previousAction);
            await expect(target).toHaveCSS("touch-action", "pan-y pinch-zoom");
            const positive = await pinch();
            results.push({
              method,
              targetKind,
              browser: browser.version(),
              channel: process.env.CI ? "chromium" : "configured Chrome",
              diagnostics,
              before,
              negative,
              positive,
            });
          } finally {
            await targetPage
              .evaluate(() => (window as any).stopPinchLog?.())
              .catch(() => {});
            await session?.detach();
            await targetPage.close();
          }
        }
      }
      const summarize = (phase: any) => ({
        scale: phase.scale,
        index: phase.index,
        changes: phase.changes,
        protocolError: phase.protocolError,
        eventCount: phase.events.length,
        trustedTwoContacts: phase.events.some(
          (event: any) =>
            event.type === "touchstart" &&
            event.trusted &&
            event.points?.length >= 2,
        ),
        prevented: phase.events.some((event: any) => event.prevented),
      });
      const summaries = results.map((result) => ({
        method: result.method,
        target: result.targetKind,
        browser: result.browser,
        before: result.before,
        negative: summarize(result.negative),
        positive: summarize(result.positive),
        diagnostics: result.diagnostics,
      }));
      const report = JSON.stringify(results, null, 2);
      console.log("Native pinch comparison:", JSON.stringify(summaries));
      await testInfo.attach("native-pinch-comparison", {
        body: report,
        contentType: "application/json",
      });
      for (const result of results) {
        const message = JSON.stringify(
          summaries.find(
            (summary) =>
              summary.method === result.method &&
              summary.target === result.targetKind,
          ),
        );
        expect.soft(result.negative.protocolError, message).toBeUndefined();
        expect.soft(result.positive.protocolError, message).toBeUndefined();
        expect
          .soft(result.negative.scale, `touch-action:none: ${message}`)
          .toBeCloseTo(result.before, 2);
        if (result.targetKind === "stack") {
          for (const phase of [result.negative, result.positive]) {
            expect.soft(phase.index, message).toBe("0");
            expect.soft(phase.changes, message).toEqual([]);
          }
        }
        // The direct, trusted two-contact sequence is the component acceptance
        // check. The high-level synthesized gesture remains a diagnostic because
        // it is the disputed Linux browser capability, not application behavior.
        if (result.method === "raw-two-touch") {
          expect
            .soft(
              result.positive.events.some(
                (event: any) =>
                  event.type === "touchstart" &&
                  event.trusted &&
                  event.points?.length >= 2,
              ),
              message,
            )
            .toBe(true);
          expect
            .soft(
              result.positive.scale,
              `Native zoom on ${result.targetKind}: ${message}`,
            )
            .toBeGreaterThan(result.before + 0.05);
        }
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

test("catalog excursions paint the whole print beyond the stack in both directions", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1200 });
  await page.goto("/#component/polaroid-stack");
  await page.evaluate(() => document.fonts.ready);
  const catalogStack = page.locator(
    ".playground-canvas .polaroid-demo .dm-polaroid-stack",
  );
  await catalogStack.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      catalogStack
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  for (const direction of ["next", "previous"] as const)
    await assertPolaroidPaintOutsideStack(page, catalogStack, direction);
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
