import { test, expect } from "@playwright/test";

test("nav links work from transactions", async ({ page }) => {
  /* Behavior: nav links remain usable after landing on transactions.
     Expected: clicking Blocks and Tokens navigates to their list pages. */
  await page.goto("/transactions", { waitUntil: "domcontentloaded" });

  await page.getByRole("link", { name: /blocks/i }).click();
  await expect(page).toHaveURL(/\/blocks/);

  await page.getByRole("link", { name: /tokens/i }).click();
  await expect(page).toHaveURL(/\/tokens/);
});

test("nav links include events and contracts", async ({ page }) => {
  /* Behavior: nav exposes all primary list routes from transactions.
     Expected: clicking Events and Contracts navigates to those pages. */
  await page.goto("/transactions", { waitUntil: "domcontentloaded" });

  await page.getByRole("link", { name: /events/i }).click();
  await expect(page).toHaveURL(/\/events/);

  await page.getByRole("link", { name: /contracts/i }).click();
  await expect(page).toHaveURL(/\/contracts/);
});
