import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.locator("h1")).toContainText("Sign in to M360");
  });

  test("logs in with valid credentials", async ({ page }) => {
    await page.goto("/en/login");
    await page.fill('input[id="email"]', "admin@m360.sa");
    await page.fill('input[id="password"]', "admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/en/login");
    await page.fill('input[id="email"]', "wrong@test.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid email or password")).toBeVisible();
  });
});
