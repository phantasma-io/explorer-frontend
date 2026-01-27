import { test, expect } from "@playwright/test";

test("language switch works on series", async ({ page }) => {
  /* Behavior: user switches UI language on the Series list page.
     Expected: heading updates to the German translation for Series. */
  await page.goto("/series", { waitUntil: "domcontentloaded" });

  await page.getByRole("button", { name: /select language/i }).click();
  await page.getByRole("menuitemradio", { name: /DE/i }).click();

  await expect(page.getByRole("heading", { name: "Serie" })).toBeVisible();
});
