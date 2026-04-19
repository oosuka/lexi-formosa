import { expect, test } from '@playwright/test';

const appleTouchIconPaths = [
  '/apple-touch-icon.png',
  '/apple-touch-icon-precomposed.png',
  '/apple-touch-icon-120x120.png',
  '/apple-touch-icon-120x120-precomposed.png',
] as const;

test.describe('static assets', () => {
  test('TOP が Apple touch icon を明示する', async ({ page }) => {
    await page.goto('/');

    const touchIconHrefs = await page
      .locator('head link[rel="apple-touch-icon"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));

    expect(touchIconHrefs).toContain('apple-touch-icon.png');
    expect(touchIconHrefs).toContain('apple-touch-icon-120x120.png');
  });

  for (const iconPath of appleTouchIconPaths) {
    test(`${iconPath} を PNG として配信する`, async ({ request }) => {
      const response = await request.get(iconPath);

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    });
  }
});
