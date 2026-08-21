import { expect, test } from '@playwright/test';

test('loads sample and enables preview', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /虛構範例|sample|サンプル|샘플/i }).click();
  await expect(page.locator('#settings-card')).toBeVisible({ timeout: 15_000 });
  await page.locator('#map-consent').check();
  await expect(page.locator('#preview-button')).toBeEnabled();
  await page.locator('#preview-button').click();
  await expect(page.locator('#preview-card')).toBeVisible();
});
