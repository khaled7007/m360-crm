import { Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/en/login");
  await page.fill('input[id="email"]', "admin@m360.sa");
  await page.fill('input[id="password"]', "admin123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 10000 });
}
