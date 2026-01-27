import { test, expect } from "@playwright/test";

test("no page errors on basic navigation", async ({ page }) => {
  /* Behavior: user navigates between list pages.
     Expected: no uncaught page errors are emitted. */
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    errors.push(error.message);
  });

  await page.goto("/transactions", { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /blocks/i }).click();
  await page.waitForLoadState("domcontentloaded");

  expect(errors).toEqual([]);
});
