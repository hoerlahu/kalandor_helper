import { test, expect } from '@playwright/test';
import path from 'node:path';

test('imports character JSON and opens roll UI', async ({ page }) => {
  await page.goto('/');

  const samplePath = path.join(process.cwd(), 'ExampleFiles', 'sample-character.json');
  await page.locator('#fileInput').setInputFiles(samplePath);

  await expect(page.locator('#importResult')).toContainText('Character imported successfully!');

  await page.locator('#whatToRollFeature').click();
  await expect(page.locator('#rollSelector')).toBeVisible();
  await expect(page.locator('#childSelect')).toBeVisible();
});
