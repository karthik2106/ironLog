import { test, expect } from "@playwright/test";

test("demo user can reach the dashboard", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Demo mode" }).click();
  await expect(page.getByRole("heading", { name: /Ready/ })).toBeVisible();
});
