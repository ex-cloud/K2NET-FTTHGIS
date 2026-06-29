# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: permission.spec.ts >> Permission guard >> allows access to project export button with permission
- Location: e2e/permission.spec.ts:23:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('button').filter({ hasText: 'Export' })
Expected: 1
Received: 0
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" with timeout 5000ms
  - waiting for locator('button').filter({ hasText: 'Export' })
    14 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - heading "404" [level=1] [ref=e4]
    - heading "This page could not be found." [level=2] [ref=e6]
  - region "Notifications alt+T"
  - alert [ref=e7]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | // Simple E2E permission guard test
  4  | // Assumes the app reads 'permissions' from localStorage as a JSON array
  5  | 
  6  | test.describe('Permission guard', () => {
  7  |   test('denies access to project export button without permission', async ({ page, baseURL }) => {
  8  |     await page.goto(baseURL! + '/');
  9  | 
  10 |     // Simulate logged-in user WITHOUT projects.export permission
  11 |     await page.evaluate(() => {
  12 |       localStorage.setItem('permissions', JSON.stringify(['projects.view']));
  13 |     });
  14 | 
  15 |     // Navigate to a project page where export button would exist
  16 |     await page.goto(baseURL! + '/projects/test-project');
  17 | 
  18 |     // Expect export button to be hidden or disabled
  19 |     const exportButton = page.locator('button', { hasText: 'Export' });
  20 |     await expect(exportButton).toHaveCount(0);
  21 |   });
  22 | 
  23 |   test('allows access to project export button with permission', async ({ page, baseURL }) => {
  24 |     await page.goto(baseURL! + '/');
  25 | 
  26 |     // Simulate logged-in user WITH projects.export permission
  27 |     await page.evaluate(() => {
  28 |       localStorage.setItem('permissions', JSON.stringify(['projects.view', 'projects.export']));
  29 |     });
  30 | 
  31 |     await page.goto(baseURL! + '/projects/test-project');
  32 | 
  33 |     const exportButton = page.locator('button', { hasText: 'Export' });
> 34 |     await expect(exportButton).toHaveCount(1);
     |                                ^ Error: expect(locator).toHaveCount(expected) failed
  35 |     await expect(exportButton).toBeVisible();
  36 |   });
  37 | });
  38 | 
```