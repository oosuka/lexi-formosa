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

const correctLabelByTrad: Record<string, string> = {
  你好: 'こんにちは',
  謝謝: 'ありがとう',
  老師: '先生',
  學生: '学生',
};

const answerWrongChoice = async (page: Page) => {
  const trad = (await page.locator('.trad-word').first().textContent())?.trim() ?? '';
  const correctLabel = correctLabelByTrad[trad];

  expect(correctLabel, `missing correct label for ${trad}`).toBeTruthy();

  if (!correctLabel) {
    throw new Error(`missing correct label for ${trad}`);
  }

  const choices = page.locator('.choice-card');
  const count = await choices.count();

  for (let index = 0; index < count; index += 1) {
    const choice = choices.nth(index);
    const label = (await choice.textContent())?.trim() ?? '';

    if (!label.includes(correctLabel)) {
      await choice.click();
      return;
    }
  }

  throw new Error(`Could not find a wrong choice for ${trad}`);
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

test('game over 後に restart と reset の導線を使える', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  await page.getByRole('button', { name: 'ゲームを始める' }).click();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await answerWrongChoice(page);

    if (attempt < 2) {
      await page.getByRole('button', { name: '次の問題' }).click();
    }
  }

  await expect(page.locator('.game-over-panel')).toBeVisible();
  await page.getByRole('button', { name: 'もう一度始める' }).click();
  await expect(page.locator('.choice-card')).toHaveCount(4);
  await expect(page.getByText('ゲームを始める')).toHaveCount(0);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await answerWrongChoice(page);

    if (attempt < 2) {
      await page.getByRole('button', { name: '次の問題' }).click();
    }
  }

  await expect(page.locator('.game-over-panel')).toBeVisible();
  await page.getByRole('button', { name: 'トップへ戻る' }).click();
  await expect(page.getByRole('button', { name: 'ゲームを始める' })).toBeVisible();
  await expect(page.locator('.level-panel')).toBeVisible();
});
