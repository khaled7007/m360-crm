import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Organizations CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.click("a:has-text('Organizations')");
    await page.waitForURL("**/organizations");
  });

  test("displays organizations page with header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Organizations" })).toBeVisible();
    await expect(page.locator("text=Manage SME borrowers")).toBeVisible();
  });

  test("has New Organization button", async ({ page }) => {
    await expect(
      page.locator("button:has-text('New Organization')")
    ).toBeVisible();
  });

  test("opens create organization modal", async ({ page }) => {
    await page.click("button:has-text('New Organization')");
    await expect(page.locator("text=Create New Organization")).toBeVisible();
    await expect(
      page.locator("text=Organization Name (English)")
    ).toBeVisible();
    await expect(
      page.locator("text=Organization Name (Arabic)")
    ).toBeVisible();
    await expect(
      page.locator("text=Commercial Registration (CR) Number")
    ).toBeVisible();
  });

  test("shows table or empty state", async ({ page }) => {
    await page.waitForTimeout(2000);
    const hasTable = await page.locator("table").isVisible();
    const hasEmpty = await page.locator("text=No organizations found").isVisible();
    expect(hasTable || hasEmpty).toBeTruthy();
  });

  test("can close modal with Cancel", async ({ page }) => {
    await page.click("button:has-text('New Organization')");
    await expect(page.locator("text=Create New Organization")).toBeVisible();
    await page.click("button:has-text('Cancel')");
    await expect(
      page.locator("text=Create New Organization")
    ).not.toBeVisible();
  });
});
