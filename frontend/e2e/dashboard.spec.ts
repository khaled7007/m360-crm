import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("displays stats cards", async ({ page }) => {
    const main = page.locator("main");
    await expect(main.locator("text=Active Leads")).toBeVisible();
    await expect(main.locator("text=Applications").first()).toBeVisible();
    await expect(main.locator("text=Active Facilities")).toBeVisible();
  });

  test("displays quick actions", async ({ page }) => {
    await expect(page.locator("text=New Lead")).toBeVisible();
    await expect(page.locator("text=New Application")).toBeVisible();
    await expect(page.locator("text=View Reports")).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.click("a:has-text('Leads')");
    await page.waitForURL("**/leads");
    await expect(page.locator("h1, h2").first()).toBeVisible();

    await page.click("a:has-text('Organizations')");
    await page.waitForURL("**/organizations");

    await page.click("a:has-text('Applications')");
    await page.waitForURL("**/applications");
  });
});
