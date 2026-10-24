import { expect, test } from "@playwright/test";

test("a paper dialog keeps native modality through its exit and restores the opener", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  const opener = page.locator(".playground-canvas").getByRole("button", {
    name: "Open a little conversation",
  });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  const modalDuringExit = await dialog.evaluate(
    (element) =>
      new Promise<boolean>((resolve) => {
        const observer = new MutationObserver(() => {
          if (element.getAttribute("data-state") !== "closing") return;
          observer.disconnect();
          resolve(
            element.matches(":modal") &&
              getComputedStyle(document.body).overflow === "hidden",
          );
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["data-state"],
        });
        (
          element.querySelector(
            '[aria-label="Close dialog"]',
          ) as HTMLButtonElement
        ).click();
      }),
  );
  expect(modalDuringExit).toBe(true);
  await expect(dialog).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(opener).toBeFocused();
  // A completed close must not leave a stale closing state on the next opening.
  await opener.click();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog).toHaveCSS("opacity", "1");
});

test("reduced motion closes without a visual exit and backdrop presses dismiss once", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#component/dialog");
  const opener = page.locator(".playground-canvas").getByRole("button", {
    name: "Open a little conversation",
  });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog).toHaveCSS("transition-duration", "0s");
  await expect(dialog).toHaveCSS("transform", "none");
  for (const region of await dialog
    .locator(
      ":scope > .dm-dialog__header, :scope > .dm-dialog__leaf, :scope > .dm-dialog__leaf > .dm-dialog__body, :scope > .dm-dialog__leaf > .dm-dialog__footer",
    )
    .all()) {
    await expect(region).toHaveCSS("transform", "none");
    await expect(region).toHaveCSS("opacity", "1");
    await expect(region).toHaveCSS("transition-duration", "0s");
    await expect(region).toHaveCSS("transition-delay", "0s");
  }
  expect(
    await dialog
      .locator(".dm-dialog__body")
      .evaluate((element) => getComputedStyle(element, "::before").opacity),
  ).toBe("0");
  await page.mouse.click(8, 8);
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await opener.click();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});

test("a controlled reopen reverses the exit without losing native modality", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  const opener = page.locator(".playground-canvas").getByRole("button", {
    name: "Open a little conversation",
  });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  // Simulate a parent changing its controlled value before the exit completes.
  // The page is intentionally inert here, so use the existing parent's handler.
  await dialog.evaluate(
    (element) =>
      new Promise<void>((resolve) => {
        const observer = new MutationObserver(() => {
          if (element.getAttribute("data-state") !== "closing") return;
          observer.disconnect();
          const button = [
            ...document.querySelectorAll<HTMLButtonElement>(
              ".playground-canvas button",
            ),
          ].find((candidate) =>
            candidate.textContent?.includes("Open a little conversation"),
          )!;
          button.click();
          resolve();
        });
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["data-state"],
        });
        (
          element.querySelector(
            '[aria-label="Close dialog"]',
          ) as HTMLButtonElement
        ).click();
      }),
  );
  await expect(dialog).toHaveAttribute("data-state", "open");
  await page.waitForTimeout(300);
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  await expect(dialog).toHaveCSS("opacity", "1");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("a selection that begins on the paper cannot dismiss it by ending outside", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  await page
    .locator(".playground-canvas")
    .getByRole("button", {
      name: "Open a little conversation",
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  const input = await dialog
    .getByRole("textbox", { name: "Note title" })
    .boundingBox();
  expect(input).not.toBeNull();
  await page.mouse.move(input!.x + 20, input!.y + input!.height / 2);
  await page.mouse.down();
  await page.mouse.move(8, 8);
  await page.mouse.up();
  await expect(dialog).toHaveAttribute("data-state", "open");
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  await page.mouse.click(8, 8);
  await expect(dialog).toBeHidden();
});

test("paper remains usable in a short narrow viewport and only its body scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await page.goto("/#component/dialog");
  await page
    .locator(".playground-canvas")
    .getByRole("button", {
      name: "Open a little conversation",
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog).toHaveCSS("transform", "none");
  await dialog.locator(".dm-dialog__body").evaluate((body) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "A long thought worth keeping. ".repeat(90);
    body.append(paragraph);
  });
  const measurements = await dialog.evaluate((element) => {
    const body = element.querySelector(".dm-dialog__body") as HTMLElement;
    const header = element.querySelector(".dm-dialog__header") as HTMLElement;
    const heading = header.querySelector("h2")!.getBoundingClientRect();
    const description = header.querySelector("p")!.getBoundingClientRect();
    const headerRect = header.getBoundingClientRect();
    const close = header.querySelector("button")!.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const footer = element
      .querySelector(".dm-dialog__footer")!
      .getBoundingClientRect();
    return {
      width: rect.width,
      left: rect.left,
      top: rect.top,
      bottom: rect.bottom,
      footerBottom: footer.bottom,
      bodyScrolls: body.scrollHeight > body.clientHeight,
      outerScrolls: element.scrollHeight > element.clientHeight,
      headerScrolls: header.scrollHeight > header.clientHeight,
      fullHeaderFits:
        heading.top >= headerRect.top &&
        description.bottom <= headerRect.bottom,
      closeWidth: close.width,
      closeHeight: close.height,
    };
  });
  expect(measurements.width).toBeLessThanOrEqual(276);
  expect(measurements.left).toBeGreaterThanOrEqual(0);
  expect(measurements.top).toBeGreaterThanOrEqual(0);
  expect(measurements.bottom).toBeLessThanOrEqual(450);
  expect(measurements.footerBottom).toBeLessThanOrEqual(450);
  expect(measurements.bodyScrolls).toBe(true);
  expect(measurements.outerScrolls).toBe(false);
  expect(measurements.headerScrolls).toBe(false);
  expect(measurements.fullHeaderFits).toBe(true);
  expect(measurements.closeWidth).toBeGreaterThanOrEqual(44);
  expect(measurements.closeHeight).toBeGreaterThanOrEqual(44);
  await expect(
    dialog.getByRole("button", { name: "Save note", exact: true }),
  ).toBeInViewport();
  await expect(
    dialog.getByRole("heading", { name: "Keep this thought?", exact: true }),
  ).toBeInViewport();
  await expect(
    dialog.getByText("A small place for something worth remembering.", {
      exact: true,
    }),
  ).toBeInViewport();
});

test("a long header remains readable by scrolling while its close and actions stay available", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 450 });
  await page.goto("/#component/dialog");
  await page
    .locator(".playground-canvas")
    .getByRole("button", {
      name: "Open a little conversation",
    })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(dialog).toHaveCSS("transform", "none");
  const scrollState = await dialog
    .locator(".dm-dialog__header")
    .evaluate((header) => {
      header.querySelector("p")!.textContent =
        "A long description that stays readable on its own sheet of paper. ".repeat(
          20,
        );
      header.scrollTop = header.scrollHeight;
      return {
        scrolls: header.scrollHeight > header.clientHeight,
        reachedEnd:
          header.scrollTop + header.clientHeight >= header.scrollHeight - 1,
        closeVisible:
          header.querySelector("button")!.getBoundingClientRect().top >=
          header.getBoundingClientRect().top,
      };
    });
  expect(scrollState.scrolls).toBe(true);
  expect(scrollState.reachedEnd).toBe(true);
  expect(scrollState.closeVisible).toBe(true);
  expect(
    await dialog.evaluate(
      (element) => element.scrollHeight > element.clientHeight,
    ),
  ).toBe(false);
  await expect(
    dialog.getByRole("button", { name: "Save note", exact: true }),
  ).toBeInViewport();
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  await expect(dialog).toBeHidden();
});

test("Escape dismisses the nested margin before its modal and restores each opener", async ({
  page,
}) => {
  await page.goto("/#layers");
  const opener = page.getByRole("button", { name: "Open layered modal" });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "A thought worth keeping",
    exact: true,
  });
  await expect(dialog).toHaveAttribute("data-state", "open");
  const marginOpener = dialog.getByRole("button", {
    name: "Why give it a name?",
  });
  await marginOpener.click();
  const margin = page.getByRole("dialog", {
    name: "A name is just a starting point",
    exact: true,
  });
  await expect(margin).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(margin).toBeHidden();
  await expect(dialog).toHaveAttribute("data-state", "open");
  await expect(marginOpener).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("paper folds through coordinated hinges and crease shading on the same dialog nodes", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  await page.evaluate(() => {
    const dialog = document.querySelector<HTMLDialogElement>(
      ".playground-canvas .dm-dialog",
    )!;
    const header = dialog.querySelector<HTMLElement>(".dm-dialog__header")!;
    const leaf = dialog.querySelector<HTMLElement>(".dm-dialog__leaf")!;
    const body = dialog.querySelector<HTMLElement>(".dm-dialog__body")!;
    const footer = dialog.querySelector<HTMLElement>(".dm-dialog__footer")!;
    const point = (owner: HTMLElement, edge: "top" | "bottom") => {
      const marker = document.createElement("span");
      marker.setAttribute("aria-hidden", "true");
      marker.style.cssText = `position:absolute;left:50%;${edge}:0;width:0;height:0;pointer-events:none`;
      owner.append(marker);
      return marker;
    };
    const bodyJoint = point(body, "bottom");
    const footerJoint = point(footer, "top");
    const isFlat = (element: HTMLElement) => {
      const transform = getComputedStyle(element).transform;
      if (transform === "none") return true;
      const matrix = new DOMMatrixReadOnly(transform);
      // A zero-angle leaf keeps perspective until its transition cleanup runs.
      // Perspective alone does not tilt, scale, or translate the paper plane.
      return (
        Math.abs(matrix.m11 - 1) < 0.001 &&
        Math.abs(matrix.m22 - 1) < 0.001 &&
        Math.abs(matrix.m33 - 1) < 0.001 &&
        [
          matrix.m12,
          matrix.m13,
          matrix.m14,
          matrix.m21,
          matrix.m23,
          matrix.m24,
          matrix.m31,
          matrix.m32,
          matrix.m41,
          matrix.m42,
          matrix.m43,
        ].every((value) => Math.abs(value) < 0.001)
      );
    };
    const sample = () => ({
      shell: getComputedStyle(dialog).transform,
      shellFlat: isFlat(dialog),
      shellOpacity: Number(getComputedStyle(dialog).opacity),
      headerDelay: getComputedStyle(header).transitionDelay,
      header: getComputedStyle(header).transform,
      leaf: getComputedStyle(leaf).transform,
      leafFlat: isFlat(leaf),
      footer: getComputedStyle(footer).transform,
      footerFlat: isFlat(footer),
      headerOpacity: Number(getComputedStyle(header).opacity),
      bodyOpacity: Number(getComputedStyle(body).opacity),
      footerOpacity: Number(getComputedStyle(footer).opacity),
      crease: Number(getComputedStyle(body, "::before").opacity),
      jointGap: Math.hypot(
        bodyJoint.getBoundingClientRect().x -
          footerJoint.getBoundingClientRect().x,
        bodyJoint.getBoundingClientRect().y -
          footerJoint.getBoundingClientRect().y,
      ),
    });
    const watch = (state: "open" | "closing") =>
      new Promise((resolve) => {
        const observer = new MutationObserver(() => {
          if (dialog.dataset.state !== state) return;
          observer.disconnect();
          const animations = dialog
            .getAnimations({ subtree: true })
            .filter(
              (animation) =>
                animation instanceof CSSTransition &&
                ["transform", "opacity"].includes(animation.transitionProperty),
            );
          const duration = Math.max(
            ...animations.map((animation) =>
              Number(animation.effect!.getComputedTiming().endTime),
            ),
          );
          animations.forEach((animation) => animation.pause());
          const seek = (time: number) => {
            animations.forEach((animation) => {
              animation.currentTime = time;
            });
            return sample();
          };
          const start = seek(0);
          const early = seek(duration / 4);
          const middle = seek(duration / 2);
          const tucked = seek(duration * 0.75);
          const foldComplete = seek(duration - 40);
          const fading = seek(duration * 0.92);
          const end = seek(duration + 1);
          animations.forEach((animation) => animation.finish());
          resolve({
            duration,
            start,
            early,
            middle,
            tucked,
            foldComplete,
            fading,
            end,
            regionsPersist:
              dialog.querySelector(".dm-dialog__header") === header &&
              dialog.querySelector(".dm-dialog__leaf") === leaf &&
              dialog.querySelector(".dm-dialog__body") === body &&
              dialog.querySelector(".dm-dialog__footer") === footer &&
              body.parentElement === leaf &&
              footer.parentElement === leaf,
            modal: dialog.matches(":modal"),
          });
        });
        observer.observe(dialog, {
          attributes: true,
          attributeFilter: ["data-state"],
        });
      });
    (window as any).foldProbe = {
      opening: watch("open"),
      closing: watch("closing"),
    };
  });
  const opener = page
    .locator(".playground-canvas")
    .getByRole("button", { name: "Open a little conversation" });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveClass(/dm-dialog--fold/);
  const opening = await page.evaluate(() => (window as any).foldProbe.opening);
  expect(opening.duration).toBeGreaterThanOrEqual(350);
  expect(opening.duration).toBeLessThanOrEqual(380);
  expect(opening.regionsPersist).toBe(true);
  expect(opening.modal).toBe(true);
  for (const region of ["shell", "leaf", "footer"] as const) {
    expect(opening.start[region]).not.toBe("none");
    expect(opening.middle[region]).not.toBe(opening.start[region]);
    expect(opening.end[`${region}Flat`]).toBe(true);
  }
  // The paper and lettering stay opaque; only the hinges and crease move.
  expect(opening.start.shellOpacity).toBe(1);
  for (const phase of [
    opening.start,
    opening.early,
    opening.middle,
    opening.tucked,
    opening.fading,
    opening.end,
  ]) {
    expect(phase.shellOpacity).toBe(1);
    expect(phase.header).toBe("none");
    expect(phase.headerOpacity).toBe(1);
    expect(phase.bodyOpacity).toBe(1);
    expect(phase.footerOpacity).toBe(1);
    expect(phase.headerDelay).toBe("0s");
    // These projected zero-size points sit on the actual paper planes, so the
    // assertion detects a visually detached fold rather than matching CSS text.
    expect(phase.jointGap).toBeLessThanOrEqual(2.5);
  }
  expect(opening.middle.crease).toBeLessThan(opening.start.crease);
  expect(opening.end.crease).toBe(0);
  expect(opening.end.bodyOpacity).toBe(1);
  await expect(dialog).not.toHaveAttribute("data-folding", "true");
  for (const region of [".dm-dialog__leaf", ".dm-dialog__footer"]) {
    await expect(dialog.locator(region)).toHaveCSS("transform", "none");
    await expect(dialog.locator(region)).toHaveCSS("transform-style", "flat");
  }
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  const closing = await page.evaluate(() => (window as any).foldProbe.closing);
  expect(closing.duration).toBeGreaterThanOrEqual(230);
  expect(closing.duration).toBeLessThanOrEqual(250);
  expect(closing.regionsPersist).toBe(true);
  expect(closing.modal).toBe(true);
  expect(closing.start.leafFlat).toBe(true);
  expect(closing.early.leafFlat).toBe(false);
  expect(closing.middle.leaf).toContain("matrix3d");
  expect(closing.middle.footerFlat).toBe(false);
  expect(closing.start.headerDelay).toBe("0s");
  for (const phase of [
    closing.start,
    closing.early,
    closing.middle,
    closing.tucked,
    closing.foldComplete,
  ]) {
    expect(phase.shellOpacity).toBe(1);
  }
  expect(closing.fading.shellOpacity).toBeGreaterThan(0);
  expect(closing.fading.shellOpacity).toBeLessThan(1);
  expect(closing.end.shellOpacity).toBe(0);
  for (const phase of [
    closing.start,
    closing.early,
    closing.middle,
    closing.tucked,
    closing.foldComplete,
    closing.fading,
    closing.end,
  ]) {
    expect(phase.header).toBe("none");
    expect(phase.headerOpacity).toBe(1);
    expect(phase.bodyOpacity).toBe(1);
    expect(phase.footerOpacity).toBe(1);
    expect(phase.jointGap).toBeLessThanOrEqual(2.5);
  }
  expect(closing.end.crease).toBeGreaterThan(closing.start.crease);
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("native modality waits for a longer owned fold phase before restoring focus", async ({
  page,
}) => {
  await page.goto("/#component/dialog");
  await page.addStyleTag({
    content:
      '.dm-dialog--fold[data-state="closing"] .dm-dialog__footer { transition-duration: 600ms; }',
  });
  const opener = page
    .locator(".playground-canvas")
    .getByRole("button", { name: "Open a little conversation" });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "Keep this thought?",
    exact: true,
  });
  await expect(dialog).toHaveCSS("transform", "none");
  await page.evaluate(() => {
    const dialog = document.querySelector<HTMLDialogElement>(
      ".playground-canvas .dm-dialog",
    )!;
    (window as any).lastFoldPhase = new Promise((resolve) => {
      const observer = new MutationObserver(() => {
        if (dialog.dataset.state !== "closing") return;
        observer.disconnect();
        const footer = dialog.querySelector(".dm-dialog__footer")!;
        const hinge = footer
          .getAnimations()
          .find(
            (animation) =>
              animation instanceof CSSTransition &&
              animation.transitionProperty === "transform",
          )!;
        hinge.finished.then(
          () => resolve({ completed: true, modal: dialog.matches(":modal") }),
          () => resolve({ completed: false, modal: dialog.matches(":modal") }),
        );
      });
      observer.observe(dialog, {
        attributes: true,
        attributeFilter: ["data-state"],
      });
    });
  });
  await dialog
    .getByRole("button", { name: "Close dialog", exact: true })
    .click();
  expect(await page.evaluate(() => (window as any).lastFoldPhase)).toEqual({
    completed: true,
    modal: true,
  });
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});
