import { expect, type Page, test } from '@playwright/test';

const installMockWordlists = async (page: Page) => {
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
};

test('ゲームを1問進められる', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  await expect(page.getByRole('heading', { name: 'この単語の意味は？' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ゲームを始める' })).toBeVisible();
  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await expect(page.locator('.choice-card')).toHaveCount(4);

  const wordBefore = await page.locator('.trad-word').first().textContent();

  await page.locator('.choice-card').first().click();
  await expect(page.locator('.feedback-pill')).toHaveText(/Correct|Miss/);

  const nextButton = page.getByRole('button', { name: '次の問題' });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();

  await expect(page.locator('.trad-word').first()).not.toHaveText(wordBefore ?? '');
});

test('開始前の案内カードは高さが揃う', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  const detailCards = page.locator('.session-start-detail');

  await expect(detailCards).toHaveCount(2);

  const firstCard = await detailCards.nth(0).boundingBox();
  const secondCard = await detailCards.nth(1).boundingBox();

  expect(firstCard).not.toBeNull();
  expect(secondCard).not.toBeNull();
  expect(Math.abs((firstCard?.height ?? 0) - (secondCard?.height ?? 0))).toBeLessThanOrEqual(1);
});

test('モバイル幅でも横にはみ出さない', async ({ page }) => {
  await installMockWordlists(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  const overflowBeforeStart = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(overflowBeforeStart.scrollWidth).toBeLessThanOrEqual(overflowBeforeStart.clientWidth);

  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await page.locator('.choice-card').first().click();

  const overflowAfterAnswer = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(overflowAfterAnswer.scrollWidth).toBeLessThanOrEqual(overflowAfterAnswer.clientWidth);
});
