import { expect, type Page, test } from '@playwright/test';

const level1SeedVocabulary = [
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
] as const;

const correctLabelByTrad: Record<string, string> = Object.fromEntries(
  level1SeedVocabulary.map((entry) => [entry.trad, entry.ja])
);

const installMockWordlists = async (page: Page) => {
  await page.route('**/wordlists/metadata.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        total: 4,
        counts: {
          1: 4,
          2: 0,
          3: 0,
        },
      }),
    });
  });

  await page.route('**/wordlists/vocabulary-level-1.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(level1SeedVocabulary),
    });
  });
};

const getCorrectLabel = async (page: Page) => {
  const trad = (await page.locator('.trad-word').first().textContent())?.trim() ?? '';
  const correctLabel = correctLabelByTrad[trad];

  if (!correctLabel) {
    throw new Error(`missing correct label for ${trad}`);
  }

  return correctLabel;
};

const answerCorrectChoice = async (page: Page) => {
  const correctLabel = await getCorrectLabel(page);
  await page.getByRole('button', { name: new RegExp(`^[1-4]\\. ${correctLabel}$`) }).click();
};

const answerWrongChoice = async (page: Page) => {
  const correctLabel = await getCorrectLabel(page);
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

  throw new Error(`Could not find a wrong choice for ${correctLabel}`);
};

const finishWithWrongAnswers = async (page: Page) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await answerWrongChoice(page);

    if (attempt < 2) {
      await page.getByRole('button', { name: '次の問題' }).click();
    }
  }
};

const expectNoHorizontalOverflow = async (page: Page) => {
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
};

test('ゲームを1問進められる', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);
  await expect(page.getByRole('button', { name: 'ゲームを始める' })).toBeVisible();
  await expect(page.getByText('PLAY', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await expect(page.locator('.choice-card')).toHaveCount(4);

  const wordBefore = await page.locator('.trad-word').first().textContent();

  await answerCorrectChoice(page);
  await expect(page.locator('.feedback-pill')).toHaveText(/Correct|Miss/);
  await expect(page.getByRole('button', { name: '次の問題' })).toBeEnabled();

  await page.getByRole('button', { name: '次の問題' }).click();
  await expect(page.locator('.trad-word').first()).not.toHaveText(wordBefore ?? '');
});

test('モバイル幅でも主要状態で横にはみ出さない', async ({ page }) => {
  await installMockWordlists(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await answerCorrectChoice(page);
  await expectNoHorizontalOverflow(page);

  await page.getByRole('button', { name: '次の問題' }).click();
  await finishWithWrongAnswers(page);
  await expect(page.locator('.game-over-panel')).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('ゲームオーバー後に再開とトップ復帰ができる', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);
  await page.getByRole('button', { name: 'ゲームを始める' }).click();

  await finishWithWrongAnswers(page);
  await expect(page.locator('.game-over-panel')).toBeVisible();

  await page.getByRole('button', { name: 'もう一度始める' }).click();
  await expect(page.locator('.choice-card')).toHaveCount(4);
  await expect(page.getByText('ゲームを始める')).toHaveCount(0);

  await finishWithWrongAnswers(page);
  await page.getByRole('button', { name: 'トップへ戻る' }).click();
  await expect(page.getByRole('button', { name: 'ゲームを始める' })).toBeVisible();
});
