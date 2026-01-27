import { test, expect } from "@playwright/test";

test("koinly export modal opens and format switch works", async ({ page }) => {
  /* Behavior: open CSV export modal from the address transactions section.
     Expected: modal appears and format switch to Raw shows helper copy. */
  await page.goto("/address/P2KTESTADDRESS", { waitUntil: "domcontentloaded" });

  await page.getByRole("tab", { name: /transactions/i }).click();
  const transactionsPanel = page.locator("#tab-panel-transactions");
  await transactionsPanel.getByTestId("koinly-export-button").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: /format/i }).click();
  await page.getByRole("menuitemradio", { name: /raw/i }).click();

  await expect(dialog.getByText(/raw export downloads only the current page/i)).toBeVisible();
});
