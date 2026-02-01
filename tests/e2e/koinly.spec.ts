import { test, expect } from "@playwright/test";

test("koinly export modal opens and format switch works", async ({ page }) => {
  /* Behavior: open CSV export modal from the address transactions section.
     Expected: modal appears and format switch to Raw shows helper copy. */
  const configResponse = await page.request.get("/config.json");
  if (!configResponse.ok()) {
    throw new Error(`Failed to load config.json (${configResponse.status()})`);
  }
  const config = (await configResponse.json()) as { apiBaseUrl?: string };
  const apiBaseUrl = (config.apiBaseUrl ?? "").replace(/\/+$/, "");
  if (!apiBaseUrl) {
    throw new Error("apiBaseUrl is missing from config.json");
  }

  const addressesResponse = await page.request.get(`${apiBaseUrl}/addresses?limit=1`);
  if (!addressesResponse.ok()) {
    throw new Error(`Failed to load addresses (${addressesResponse.status()})`);
  }
  const addresses = (await addressesResponse.json()) as { addresses?: { address?: string }[] };
  const address = addresses.addresses?.[0]?.address;
  if (!address) {
    throw new Error("No addresses returned from the API");
  }

  await page.goto(`/address/${address}`, { waitUntil: "domcontentloaded" });

  await page.getByRole("tab", { name: /transactions/i }).click();
  const transactionsPanel = page.locator("#tab-panel-transactions");
  await transactionsPanel.getByTestId("koinly-export-button").click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: /format/i }).click();
  await page.getByRole("menuitemradio", { name: /raw/i }).click();

  await expect(dialog.getByText(/raw export downloads only the current page/i)).toBeVisible();
});
