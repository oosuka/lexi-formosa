import { expect, test } from '@playwright/test';

test('ゲームを1問進められる', async ({ page }) => {
  await page.route('**/wordlists/metadata.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        total: 2,
        counts: {
          1: 2,
          2: 0,
          3: 0,
        },
      }),
    });
  });

  await page.route('**/wordlists/vocabulary-level-1.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'seed-001',
          trad: '你好',
          ja: 'こんにちは',
          level: 1,
          length: 2,
          category: 'greeting',
          taiwanPriority: true,
          sources: ['seed'],
          pronunciation: 'ni3 hao3',
        },
        {
          id: 'seed-002',
          trad: '謝謝',
          ja: 'ありがとう',
          level: 1,
          length: 2,
          category: 'greeting',
          taiwanPriority: true,
          sources: ['seed'],
          pronunciation: 'xie4 xie5',
        },
        {
          id: 'seed-003',
          trad: '老師',
          ja: '先生',
          level: 1,
          length: 2,
          category: 'people',
          taiwanPriority: true,
          sources: ['seed'],
          pronunciation: 'lao3 shi1',
        },
        {
          id: 'seed-004',
          trad: '學生',
          ja: '学生',
          level: 1,
          length: 2,
          category: 'people',
          taiwanPriority: true,
          sources: ['seed'],
          pronunciation: 'xue2 sheng1',
        },
      ]),
    });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'この単語の意味は？' })).toBeVisible();
  await expect(page.locator('.choice-card')).toHaveCount(4);

  const wordBefore = await page.locator('.trad-word').first().textContent();

  await page.locator('.choice-card').first().click();
  await expect(page.locator('.feedback-pill')).toHaveText(/Correct|Miss/);

  const nextButton = page.getByRole('button', { name: '次の問題' });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();

  await expect(page.locator('.trad-word').first()).not.toHaveText(wordBefore ?? '');
});
