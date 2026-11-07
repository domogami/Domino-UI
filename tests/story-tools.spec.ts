import { expect, test } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  (page as any).storyErrors = errors;
  await page.goto("/tests/fixtures/story-tools.html");
  await expect(page.getByRole("heading", { name: "Story tools fixture" })).toBeVisible();
});
test.afterEach(async ({ page }) => expect((page as any).storyErrors).toEqual([]));

test("action menu fits outside clipped containers and keyboard selection waits for its layer to close", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const trigger = page.getByRole("button", { name: "Actions for Field notes", exact: true }).first();
  await trigger.focus(); await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu", { name: "Actions for Field notes" });
  await expect(menu.getByRole("menuitem", { name: "Edit", exact: true })).toBeFocused();
  const bounds = (await menu.boundingBox())!; expect(bounds.x).toBeGreaterThanOrEqual(11); expect(bounds.x + bounds.width).toBeLessThanOrEqual(309); expect(bounds.y + bounds.height).toBeLessThanOrEqual(629);
  for (const button of await menu.getByRole("menuitem").all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("End"); await expect(menu.getByRole("menuitem", { name: "Archive", exact: true })).toBeFocused();
  await page.keyboard.press("Home"); await page.keyboard.press("ArrowDown"); await expect(menu.getByRole("menuitemcheckbox", { name: "Highlight", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown"); await expect(menu.getByRole("menuitem", { name: "Version history", exact: true })).toBeFocused();
  await page.keyboard.press("Home"); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Following action", exact: true })).toBeVisible();
  await expect(menu).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
test("Escape closes only the action menu inside an editor and preserves unsaved writing", async ({ page }) => {
  await page.getByRole("button", { name: "Edit field notes", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Field notes editor", exact: true });
  await editor.getByRole("textbox", { name: "Unpublished writing", exact: true }).fill("Keep this unfinished writing.");
  const trigger = editor.getByRole("button", { name: "Actions for Field notes", exact: true });
  await trigger.click(); await expect(page.getByRole("menu")).toBeVisible(); await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden(); await expect(editor).toBeVisible(); await expect(trigger).toBeFocused();
  await expect(editor.getByRole("textbox", { name: "Unpublished writing", exact: true })).toHaveValue("Keep this unfinished writing.");
});
test("command palette retains typing focus, skips disabled items and navigates only after native close", async ({ page }) => {
  await page.getByRole("button", { name: "Search entries", exact: true }).click();
  const palette = page.locator("dialog.dm-command-palette"), input = palette.getByRole("combobox", { name: "Search", exact: true });
  await expect(input).toBeFocused(); await input.fill("river"); await expect(palette.getByRole("option")).toHaveCount(1); await expect(input).toBeFocused();
  await input.fill(""); await page.keyboard.press("Home"); await page.keyboard.press("ArrowDown");
  await expect(palette.getByRole("option", { name: /Garden observations/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Enter"); await expect(palette).not.toHaveAttribute("open", "");
  await expect(page.getByRole("status").filter({ hasText: "Opened garden after native close." })).toHaveText("Opened garden after native close.");
  await page.getByRole("button", { name: "Edit field notes", exact: true }).click(); const editor = page.getByRole("dialog", { name: "Field notes editor", exact: true });
  await editor.getByRole("button", { name: "Search from editor", exact: true }).click(); await expect(palette).toBeVisible(); await page.keyboard.press("Escape");
  await expect(palette).not.toHaveAttribute("open", ""); await expect(editor).toBeVisible(); await expect(editor.getByRole("textbox")).toHaveValue("Unpublished field notes.");
});
test("reading controls clamp sizes, reset and expose quiet state at narrow widths in both themes", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const group = page.getByRole("group", { name: "Reading controls" });
  for (let index = 0; index < 5; index++) await group.getByRole("button", { name: "Increase text size" }).click();
  await expect(group.getByRole("button", { name: "Increase text size" })).toBeDisabled(); await expect(group.getByRole("status")).toHaveText("150%");
  await group.getByRole("button", { name: "Reset text size" }).click(); await expect(group.getByRole("status")).toHaveText("100%");
  await group.getByRole("button", { name: "Decrease text size" }).click(); await expect(group.getByRole("button", { name: "Decrease text size" })).toBeDisabled();
  await group.getByRole("button", { name: "Quiet reading view" }).click(); await expect(group.getByRole("button", { name: "Quiet reading view" })).toHaveAttribute("aria-pressed", "true");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    for (const button of await group.getByRole("button").all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});
