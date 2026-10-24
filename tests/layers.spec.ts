import { expect, test } from "@playwright/test";

test("the notification tray navigates, dismisses the real queue, and can start again", async ({
  page,
}) => {
  await page.goto("/#layers");
  const card = page.locator(".layers-stage .dm-notification-card");
  await expect(card).toHaveAccessibleName("A small idea is ready to grow.");
  await expect(card.getByText("3 in queue")).toBeVisible();
  expect(
    await card.evaluate(
      (element) =>
        element.closest('[role="status"], [role="alert"], [aria-live]') ===
        null,
    ),
  ).toBe(true);
  await expect(card).toHaveClass(/dm-notification-card--queued/);
  await expect(card.locator(".dm-notification-card__sheet")).toHaveCount(1);
  await expect(card.locator(".dm-notification-card__papers")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Next notification", exact: true })
    .click();
  await expect(card).toHaveAccessibleName("A few good things, kept together.");
  await page
    .getByRole("button", { name: "Previous notification", exact: true })
    .click();
  await expect(card).toHaveAccessibleName("A small idea is ready to grow.");
  await page.getByRole("button", { name: "Dismiss note", exact: true }).click();
  await expect(card.getByText("2 in queue")).toBeVisible();
  await page.getByRole("button", { name: "Dismiss note", exact: true }).click();
  await expect(card).toHaveAccessibleName("Follow a little curiosity.");
  await expect(card).not.toHaveClass(/dm-notification-card--queued/);
  await expect(card.locator(".dm-notification-card__count")).toHaveCount(0);
  await expect(card.locator(".dm-notification-card__sheet")).toHaveCount(1);
  await expect(card.locator(".dm-notification-card__papers")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Next notification", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Dismiss note", exact: true }).click();
  await expect(card).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "All caught up.", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Refill the tray", exact: true })
    .click();
  await expect(card.getByText("3 in queue")).toBeVisible();
});

for (const theme of ["light", "hybrid", "dark"]) {
  test(`layers wrap real content without clipping at 320px in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/#layers");
    await page
      .getByRole("button", { name: `${theme} theme`, exact: false })
      .click();
    await page.evaluate(() => document.fonts.ready);
    const card = page.locator(".layers-stage .dm-notification-card");
    const header = card.locator(".dm-notification-card__header");
    const colors = await header.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      color: getComputedStyle(element).color,
    }));
    expect(colors.background).not.toBe(colors.color);
    await card.locator(".dm-notification-card__title").evaluate((element) => {
      element.textContent =
        "A much longer thought, with enough room for curiosity and averylongunbrokennotebooknamethatmuststillfit.";
    });
    for (const target of [
      card,
      header,
      card.locator(".dm-notification-card__actions"),
    ]) {
      expect(
        await target.evaluate(
          (element) => element.scrollWidth <= element.clientWidth + 1,
        ),
      ).toBe(true);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator(".layers-hero-copy .dm-switch").click();
    await expect(
      page.getByRole("switch", { name: "Ink header", exact: true }),
    ).not.toBeChecked();
    await expect(card).toHaveClass(/dm-notification-card--paper/);
    expect(
      await header.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      ),
    ).not.toBe(colors.background);
  });
}

test("the layered modal saves its local note and restores the initiating control", async ({
  page,
}) => {
  await page.goto("/#layers");
  const opener = page.getByRole("button", {
    name: "Open layered modal",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog", {
    name: "A thought worth keeping",
    exact: true,
  });
  await dialog
    .getByRole("textbox", { name: "Notebook name", exact: true })
    .fill("A garden of small ideas");
  await dialog
    .getByRole("button", { name: "Keep this note", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  await expect(page.getByRole("status")).toHaveText(
    "Kept in “A garden of small ideas”.",
  );
});
