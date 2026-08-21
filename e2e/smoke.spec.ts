import { expect, test } from '@playwright/test';

test('loads sample, previews, and starts create', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /虛構範例|sample|サンプル|샘플/i }).click();
  await expect(page.locator('#settings-card')).toBeVisible({ timeout: 15_000 });
  await page.locator('#map-consent').check();
  await expect(page.locator('#preview-button')).toBeEnabled();
  await page.locator('#preview-button').click();
  await expect(page.locator('#preview-card')).toBeVisible();
  await expect(page.locator('#create-button')).toBeEnabled({ timeout: 20_000 });
  await page.locator('#format-select').selectOption('sq480');
  await page.locator('#duration').selectOption('15');
  await page.locator('#create-button').click();
  await expect(page.locator('#progress')).toBeVisible();
  await expect
    .poll(async () => page.locator('#result-video:not(.hidden), #error-message:not(.hidden)').count(), {
      timeout: 120_000,
    })
    .toBeGreaterThan(0);
});

test('legal pages load', async ({ page }) => {
  await page.goto('./terms.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/條款|Terms|規約|약관/i);
  await page.goto('./legal-privacy.html');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/隱私|Privacy|プライバシー|개인정보/i);
  await page.goto('./stats.html');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
