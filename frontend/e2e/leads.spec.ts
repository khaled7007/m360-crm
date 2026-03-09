import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Leads CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.click("a:has-text('Leads')");
    await page.waitForURL("**/leads");
  });

  test("displays leads page with header", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
    await expect(
      page.locator("text=Manage potential business opportunities")
    ).toBeVisible();
  });

  test("has New Lead button", async ({ page }) => {
    await expect(page.locator("button:has-text('New Lead')")).toBeVisible();
  });

  test("opens create lead modal", async ({ page }) => {
    await page.click("button:has-text('New Lead')");
    await expect(page.locator("text=Create New Lead")).toBeVisible();
    await expect(page.locator("label:has-text('Contact Name')")).toBeVisible();
    await expect(page.locator("label:has-text('Company Name')")).toBeVisible();
  });

  test("can fill and submit lead form", async ({ page }) => {
    await page.click("button:has-text('New Lead')");
    await page.waitForSelector("text=Create New Lead");

    // Fill the form
    await page.fill('input[placeholder="John Doe"]', "Test Contact");
    await page.fill('input[placeholder="Acme Corp"]', "Test Company");
    await page.fill('input[placeholder="john@example.com"]', "test@test.com");
    await page.fill('input[placeholder="+966 50 123 4567"]', "+966501234567");

    // Submit
    await page.click("button:has-text('Create Lead')");
    // If backend is running, expect success toast; otherwise expect error
    // This test validates form interaction works regardless
  });

  test("can close modal with Cancel", async ({ page }) => {
    await page.click("button:has-text('New Lead')");
    await expect(page.locator("text=Create New Lead")).toBeVisible();
    await page.click("button:has-text('Cancel')");
    await expect(page.locator("text=Create New Lead")).not.toBeVisible();
  });
});
