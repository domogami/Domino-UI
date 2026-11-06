import { expect, test } from "@playwright/test";

for (const action of ["button", "Escape", "backdrop"] as const) {
  test(`a cancelled ${action} close can be retried without losing its draft`, async ({ page }) => {
    await page.goto("/");
    await page.addScriptTag({ type: "module", content:
      'import { mount } from "/tests/fixtures/dialog-close-cancellation.tsx"; mount();' });
    const opener = page.getByRole("button", { name: "Open guarded dialog", exact: true });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Unsaved draft", exact: true });
    await expect(dialog).toHaveAttribute("data-state", "open");
    const close = async () => {
      if (action === "button") await dialog.getByRole("button", { name: "Close dialog", exact: true }).click();
      else if (action === "Escape") await page.keyboard.press("Escape");
      else await page.mouse.click(8, 8);
    };
    for (let attempt = 1; attempt <= 2; attempt++) {
      page.once("dialog", confirmation => confirmation.dismiss());
      await close();
      await expect(page.getByLabel("Close requests")).toHaveText(String(attempt));
      await expect(dialog).toHaveAttribute("data-state", "open");
      await expect(dialog.getByLabel("Draft text")).toHaveValue("Keep my unfinished writing");
      expect(await dialog.evaluate(element => element.matches(":modal"))).toBe(true);
      await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
    }
    page.once("dialog", confirmation => confirmation.accept());
    await close();
    await expect(page.getByLabel("Close requests")).toHaveText("3");
    await expect(dialog).toBeHidden();
    await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
    await expect(opener).toBeFocused();
  });
}
