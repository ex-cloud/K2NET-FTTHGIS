import { test, expect } from '@playwright/test';

// Simple E2E permission guard test
// Assumes the app reads 'permissions' from localStorage as a JSON array

test.describe('Permission guard', () => {
  test('denies access to project export button without permission', async ({ page, baseURL }) => {
    await page.goto(baseURL! + '/');

    // Simulate logged-in user WITHOUT projects.export permission
    await page.evaluate(() => {
      localStorage.setItem('permissions', JSON.stringify(['projects.view']));
    });

    // Navigate to a project page where export button would exist
    await page.goto(baseURL! + '/projects/test-project');

    // Expect export button to be hidden or disabled
    const exportButton = page.locator('button', { hasText: 'Export' });
    await expect(exportButton).toHaveCount(0);
  });

  test('allows access to project export button with permission', async ({ page, baseURL }) => {
    await page.goto(baseURL! + '/');

    // Simulate logged-in user WITH projects.export permission
    await page.evaluate(() => {
      localStorage.setItem('permissions', JSON.stringify(['projects.view', 'projects.export']));
    });

    await page.goto(baseURL! + '/projects/test-project');

    const exportButton = page.locator('button', { hasText: 'Export' });
    await expect(exportButton).toHaveCount(1);
    await expect(exportButton).toBeVisible();
  });
});
