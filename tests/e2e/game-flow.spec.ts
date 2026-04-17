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
      body: JSON.stringify(level1SeedVocabulary),
    });
  });
};

const correctLabelByTrad: Record<string, string> = {
  ...Object.fromEntries(level1SeedVocabulary.map((entry) => [entry.trad, entry.ja])),
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

const answerCorrectChoice = async (page: Page) => {
  const trad = (await page.locator('.trad-word').first().textContent())?.trim() ?? '';
  const correctLabel = correctLabelByTrad[trad];

  expect(correctLabel, `missing correct label for ${trad}`).toBeTruthy();

  if (!correctLabel) {
    throw new Error(`missing correct label for ${trad}`);
  }

  await page.getByRole('button', { name: new RegExp(`^[1-4]\\. ${correctLabel}$`) }).click();
};

test('ゲームを1問進められる', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  const sessionModule = page.locator('.session-module');

  await expect(sessionModule).toBeVisible();
  await expect(page.getByText('PLAY', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ゲームを始める' })).toBeVisible();
  await expect(page.getByText(/繁体字の意味を、\s*日本語4択/)).toBeVisible();
  await expect(sessionModule).toContainText('Level 1');
  await expect(sessionModule).toContainText('2 words');
  await expect(sessionModule).not.toContainText('LEVELS');
  await expect(sessionModule).not.toContainText('START');
  await expect(page.locator('.hero-stats-panel')).not.toContainText('レベルごとの最高記録');
  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await expect(page.locator('.hero-panel')).toHaveCount(0);
  await expect(page.locator('.quiz-panel')).toContainText('Level 1');
  await expect(page.locator('.quiz-panel')).toContainText('Score');
  await expect(page.locator('.choice-card')).toHaveCount(4);
  await expect(page.getByText('4つの選択肢から、意味に合うものを1つ選んでください。')).toHaveCount(
    0
  );
  await expect(page.getByRole('button', { name: '次の問題' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'トップへ戻る' })).toHaveCount(0);

  const wordBefore = await page.locator('.trad-word').first().textContent();

  await page.locator('.choice-card').first().click();
  await expect(page.locator('.feedback-pill')).toHaveText(/Correct|Miss/);
  await expect(page.locator('.answer-support-row')).toBeVisible();
  await expect(page.getByRole('button', { name: 'トップへ戻る' })).toBeVisible();

  const nextButton = page.getByRole('button', { name: '次の問題' });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();

  await expect(page.locator('.trad-word').first()).not.toHaveText(wordBefore ?? '');
});

test('回答後の impact state が最低限見える', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  await page.getByRole('button', { name: 'ゲームを始める' }).click();

  await answerCorrectChoice(page);
  await expect(page.locator('.choice-card--correct-impact')).toBeVisible();

  await page.getByRole('button', { name: '次の問題' }).click();
  await answerWrongChoice(page);

  await expect(page.locator('.quiz-panel--incorrect-impact')).toBeVisible();
  await expect(page.locator('.choice-card--incorrect-impact')).toBeVisible();
  await expect(page.locator('.choice-card--correct-reveal')).toBeVisible();

  const wordBeforeNext = await page.locator('.trad-word').first().textContent();
  const nextButton = page.getByRole('button', { name: '次の問題' });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();
  await expect(page.locator('.trad-word').first()).not.toHaveText(wordBeforeNext ?? '');
});
test('reduced motion でも不正解フィードバックと次の問題導線が残る', async ({ page }) => {
  await installMockWordlists(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);
  await expect(
    page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  ).resolves.toBe(true);

  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  const wordBefore = await page.locator('.trad-word').first().textContent();

  await answerWrongChoice(page);

  await expect(page.locator('.choice-card--incorrect .choice-state')).toHaveText(/YOUR PICK/i);
  await expect(page.locator('.choice-card--correct .choice-state')).toHaveText(/CORRECT/i);
  await expect(page.locator('.quiz-panel')).toHaveClass(/quiz-panel--incorrect/);

  const nextButton = page.getByRole('button', { name: '次の問題' });
  await expect(nextButton).toBeEnabled();
  await nextButton.click();

  await expect(page.locator('.trad-word').first()).not.toHaveText(wordBefore ?? '');
});

test('PC 幅ではプレイ中に Score / Streak / Miss がプレイエリアで見える', async ({ page }) => {
  await installMockWordlists(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  const playArea = page.locator('.quiz-panel');

  await expect(playArea).toBeVisible();
  await expect(page.locator('.hero-panel')).toHaveCount(0);
  await expect(playArea.getByText('Score', { exact: true })).toBeVisible();
  await expect(playArea.getByText('Streak', { exact: true })).toBeVisible();
  await expect(playArea.getByText('Miss', { exact: true })).toBeVisible();
});

test('スマホ幅では回答後の次の問題とトップへ戻るを中央に置く', async ({ page }) => {
  await installMockWordlists(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await answerCorrectChoice(page);

  const supportRow = page.locator('.answer-support-row');
  const supportActions = page.locator('.answer-support-actions');

  await expect(supportRow).toBeVisible();
  await expect(page.getByRole('button', { name: '次の問題' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'トップへ戻る' })).toBeVisible();

  const rowBox = await supportRow.boundingBox();
  const actionsBox = await supportActions.boundingBox();

  expect(rowBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();

  if (!rowBox || !actionsBox) {
    throw new Error('answer support layout was not measurable');
  }

  const leftGap = actionsBox.x - rowBox.x;
  const rightGap = rowBox.x + rowBox.width - (actionsBox.x + actionsBox.width);

  expect(Math.abs(leftGap - rightGap)).toBeLessThanOrEqual(1);
});

test('開始画面の PLAY モジュールは選択レベルと語数を表示する', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  const sessionModule = page.locator('.session-module');

  await expect(sessionModule).toBeVisible();
  await expect(sessionModule).toContainText('PLAY');
  await expect(sessionModule).toContainText('Level 1');
  await expect(sessionModule).toContainText('2 words');
  await expect(sessionModule).not.toContainText('LEVELS');
  await expect(sessionModule).not.toContainText('START');
  await expect(page.getByRole('button', { name: 'ゲームを始める' })).toBeVisible();
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
  await answerCorrectChoice(page);

  const overflowAfterAnswer = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(overflowAfterAnswer.scrollWidth).toBeLessThanOrEqual(overflowAfterAnswer.clientWidth);
  await page.getByRole('button', { name: '次の問題' }).click();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    await answerWrongChoice(page);

    if (attempt < 2) {
      await page.getByRole('button', { name: '次の問題' }).click();
    }
  }

  await expect(page.locator('.game-over-panel')).toBeVisible();

  const overflowAfterGameOver = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(overflowAfterGameOver.scrollWidth).toBeLessThanOrEqual(overflowAfterGameOver.clientWidth);
});

test('PC 幅では外部辞書リンクが 1 行で並ぶ', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);

  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await answerCorrectChoice(page);

  const lookupLinks = page.locator('.lookup-links .lookup-link');
  await expect(lookupLinks).toHaveCount(2);

  const firstBox = await lookupLinks.nth(0).boundingBox();
  const secondBox = await lookupLinks.nth(1).boundingBox();

  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  expect(Math.abs((firstBox?.y ?? 0) - (secondBox?.y ?? 0))).toBeLessThan(2);
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
  await expect(page.locator('.session-module')).toBeVisible();
  await expect(page.getByText('PLAY', { exact: true })).toBeVisible();
});
