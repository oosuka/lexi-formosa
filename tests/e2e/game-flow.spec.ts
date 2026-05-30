import { expect, type Page, test } from '@playwright/test';

const level1SeedVocabulary = [
  {
    id: 'seed-001',
    trad: '茶',
    ja: 'お茶',
    level: 1,
    length: 1,
    category: 'food',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'cha2',
  },
  {
    id: 'seed-002',
    trad: '書',
    ja: '本',
    level: 1,
    length: 1,
    category: 'object',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'shu1',
  },
  {
    id: 'seed-003',
    trad: '雨',
    ja: '雨',
    level: 1,
    length: 1,
    category: 'weather',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'yu3',
  },
  {
    id: 'seed-004',
    trad: '魚',
    ja: '魚',
    level: 1,
    length: 1,
    category: 'food',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'yu2',
  },
] as const;

const level2SeedVocabulary = [
  {
    id: 'seed-101',
    trad: '你好',
    ja: 'こんにちは',
    level: 2,
    length: 2,
    category: 'greeting',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'ni3 hao3',
  },
  {
    id: 'seed-102',
    trad: '謝謝',
    ja: 'ありがとう',
    level: 2,
    length: 2,
    category: 'greeting',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'xie4 xie5',
  },
  {
    id: 'seed-103',
    trad: '老師',
    ja: '先生',
    level: 2,
    length: 2,
    category: 'people',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'lao3 shi1',
  },
  {
    id: 'seed-104',
    trad: '學生',
    ja: '学生',
    level: 2,
    length: 2,
    category: 'people',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'xue2 sheng1',
  },
] as const;

const level3SeedVocabulary = [
  {
    id: 'seed-201',
    trad: '捷運轉乘站',
    ja: '乗換駅',
    level: 3,
    length: 5,
    category: 'place',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'jie2 yun4 zhuan3 cheng2 zhan4',
  },
  {
    id: 'seed-202',
    trad: '夜市小吃街',
    ja: '夜市グルメ街',
    level: 3,
    length: 5,
    category: 'place',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'ye4 shi4 xiao3 chi1 jie1',
  },
  {
    id: 'seed-203',
    trad: '傳統市場裡',
    ja: '市場の中',
    level: 3,
    length: 5,
    category: 'place',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'chuan2 tong3 shi4 chang3 li3',
  },
  {
    id: 'seed-204',
    trad: '博物館門票',
    ja: '博物館チケット',
    level: 3,
    length: 5,
    category: 'object',
    taiwanPriority: true,
    sources: ['seed'],
    pronunciation: 'bo2 wu4 guan3 men2 piao4',
  },
] as const;

const seedVocabularyByLevel = {
  1: level1SeedVocabulary,
  2: level2SeedVocabulary,
  3: level3SeedVocabulary,
} as const;

const correctLabelByTrad: Record<string, string> = Object.fromEntries(
  [...level1SeedVocabulary, ...level2SeedVocabulary, ...level3SeedVocabulary].map((entry) => [
    entry.trad,
    entry.ja,
  ])
);

const installMockWordlists = async (page: Page) => {
  await page.route('**/wordlists/metadata.json', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        total: 12,
        counts: {
          1: 4,
          2: 4,
          3: 4,
        },
      }),
    });
  });

  await page.route(/\/wordlists\/vocabulary-level-([1-3])\.json$/, async (route) => {
    const level = Number(
      route
        .request()
        .url()
        .match(/vocabulary-level-([1-3])\.json$/)?.[1] ?? 1
    );

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(seedVocabularyByLevel[level as 1 | 2 | 3]),
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

const answerCorrectChoiceWithShortcut = async (page: Page) => {
  const correctLabel = await getCorrectLabel(page);
  const choiceLabels = await page
    .locator('.choice-card')
    .evaluateAll((choices) => choices.map((choice) => choice.getAttribute('aria-label') ?? ''));
  const correctIndex = choiceLabels.findIndex((label) => label.includes(correctLabel));

  if (correctIndex < 0) {
    throw new Error(`Could not find a correct choice for ${correctLabel}`);
  }

  await page.keyboard.press(String(correctIndex + 1));
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

const expectNextQuestionButtonInViewport = async (page: Page) => {
  const buttonBounds = await page.getByRole('button', { name: '次の問題' }).evaluate((button) => {
    const rect = button.getBoundingClientRect();

    return {
      bottom: rect.bottom,
      top: rect.top,
      viewportHeight: window.innerHeight,
    };
  });

  expect(buttonBounds.top).toBeGreaterThanOrEqual(0);
  expect(buttonBounds.bottom).toBeLessThanOrEqual(buttonBounds.viewportHeight);
};

const getActionButtonLayout = async (page: Page, containerSelector: string) => {
  return page.locator(containerSelector).evaluate((container) => {
    if (!(container instanceof HTMLElement)) {
      throw new Error(`missing action container: ${containerSelector}`);
    }

    const buttons = Array.from(container.querySelectorAll('button')).map((button) => {
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error('action button is not a button element');
      }

      const rect = button.getBoundingClientRect();

      return {
        label: button.textContent?.trim() ?? '',
        width: rect.width,
        centerX: rect.left + rect.width / 2,
      };
    });
    const containerRect = container.getBoundingClientRect();

    return {
      buttons,
      containerCenterX: containerRect.left + containerRect.width / 2,
    };
  });
};

const scrollToPageBottom = async (page: Page) => {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
};

const makePageScrollable = async (page: Page) => {
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.setAttribute('data-test-scroll-spacer', 'true');
    spacer.style.height = '900px';
    document.body.append(spacer);
  });
};

test('ゲームを1問進められる', async ({ page }) => {
  await installMockWordlists(page);

  await page.goto('/');
  await expect(page).toHaveURL(/\/lexi-formosa\/$/);
  await expect(page.getByRole('button', { name: 'ゲームを始める' })).toBeVisible();
  await expect(page.getByText('PLAY', { exact: true })).toBeVisible();
  await expect(page.locator('.level-card strong').nth(0)).toHaveText(
    '1文字。基礎の単語から始める。'
  );
  await expect(page.locator('.level-card strong').nth(1)).toHaveText('2文字。日常でよく見る単語。');
  await expect(page.locator('.level-card strong').nth(2)).toHaveText('3文字以上。実用的な複合語。');

  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await expect(page.locator('.choice-card')).toHaveCount(4);

  const wordBefore = await page.locator('.trad-word').first().textContent();

  await answerCorrectChoice(page);
  await expect(page.locator('.choice-state')).toHaveText('正解');
  await expect(page.locator('.result-banner__message')).toContainText('正解。');
  await expect(page.getByRole('button', { name: '次の問題' })).toBeEnabled();
  await expect(page.locator('.choice-card:visible')).toHaveCount(4);

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

test('モバイル幅では回答後に不要な選択肢を隠して次の問題を画面内に収める', async ({ page }) => {
  await installMockWordlists(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await page.evaluate(() => window.scrollTo(0, 0));

  await answerCorrectChoiceWithShortcut(page);

  await expect(page.locator('.choice-card')).toHaveCount(4);
  await expect(page.locator('.choice-card:visible')).toHaveCount(1);
  await expect(page.getByRole('button', { name: '次の問題' })).toBeVisible();
  await expectNextQuestionButtonInViewport(page);
});

test('回答後の外部辞書パネルは1カラム幅で中央に揃える', async ({ page }) => {
  await installMockWordlists(page);
  await page.setViewportSize({ width: 558, height: 860 });

  await page.goto('/');
  await page.getByRole('button', { name: 'ゲームを始める' }).click();

  await answerCorrectChoice(page);

  const centers = await page.evaluate(() => {
    const quizPanel = document.querySelector('.quiz-panel');
    const lookupPanel = document.querySelector('.lookup-panel');
    if (!(quizPanel instanceof HTMLElement) || !(lookupPanel instanceof HTMLElement)) {
      return null;
    }

    const quizRect = quizPanel.getBoundingClientRect();
    const lookupRect = lookupPanel.getBoundingClientRect();

    return {
      quizCenter: quizRect.left + quizRect.width / 2,
      lookupCenter: lookupRect.left + lookupRect.width / 2,
    };
  });

  expect(centers).not.toBeNull();
  expect(Math.abs((centers?.quizCenter ?? 0) - (centers?.lookupCenter ?? 0))).toBeLessThanOrEqual(
    1
  );
});

test('モバイル幅では副操作のトップ復帰ボタンを短く中央寄せする', async ({ page }) => {
  await installMockWordlists(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await page.getByRole('button', { name: 'ゲームを始める' }).click();

  await answerCorrectChoice(page);

  const answerSupportLayout = await getActionButtonLayout(page, '.answer-support-actions');

  expect(answerSupportLayout.buttons.map((button) => button.label)).toEqual([
    '次の問題',
    'トップへ戻る',
  ]);
  expect(answerSupportLayout.buttons[0]?.width ?? 0).toBeGreaterThan(
    (answerSupportLayout.buttons[1]?.width ?? 0) + 40
  );
  expect(
    Math.abs((answerSupportLayout.buttons[1]?.centerX ?? 0) - answerSupportLayout.containerCenterX)
  ).toBeLessThanOrEqual(1);

  await page.getByRole('button', { name: '次の問題' }).click();
  await finishWithWrongAnswers(page);
  await expect(page.locator('.game-over-panel')).toBeVisible();

  const gameOverLayout = await getActionButtonLayout(page, '.game-over-actions');

  expect(gameOverLayout.buttons.map((button) => button.label)).toEqual([
    'もう一度始める',
    'トップへ戻る',
  ]);
  expect(gameOverLayout.buttons[0]?.width ?? 0).toBeGreaterThan(
    (gameOverLayout.buttons[1]?.width ?? 0) + 40
  );
  expect(
    Math.abs((gameOverLayout.buttons[1]?.centerX ?? 0) - gameOverLayout.containerCenterX)
  ).toBeLessThanOrEqual(1);
});

test('PC幅の開始前要約はコンパクト幅で中央寄せする', async ({ page }) => {
  await installMockWordlists(page);
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('/');

  const currentLevelLayout = await page.locator('.session-start-panel').evaluate((panel) => {
    if (!(panel instanceof HTMLElement)) {
      throw new Error('missing session start panel');
    }

    const summary = panel.querySelector('.session-start-current-level');

    if (!(summary instanceof HTMLElement)) {
      throw new Error('missing current level panel');
    }

    const panelRect = panel.getBoundingClientRect();
    const summaryRect = summary.getBoundingClientRect();

    return {
      panelCenterX: panelRect.left + panelRect.width / 2,
      panelWidth: panelRect.width,
      summaryCenterX: summaryRect.left + summaryRect.width / 2,
      summaryWidth: summaryRect.width,
    };
  });

  expect(
    Math.abs(currentLevelLayout.summaryCenterX - currentLevelLayout.panelCenterX)
  ).toBeLessThanOrEqual(1);
  expect(currentLevelLayout.summaryWidth).toBeLessThan(currentLevelLayout.panelWidth - 20);
});

test('モバイル幅の TOP は選択中レベル情報と記録を開始ボタン付近に表示する', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'lexi-formosa-high-scores-v2',
      JSON.stringify({
        1: { score: 11, streak: 1 },
        2: { score: 22, streak: 2 },
        3: { score: 33, streak: 3 },
      })
    );
  });
  await installMockWordlists(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');

  await expect(page.locator('.hero-stats-panel:visible')).toHaveCount(0);
  await expect(page.locator('.session-start-current-level:visible')).toContainText('最高スコア');
  await expect(page.locator('.session-start-current-level__topline:visible')).toHaveText(
    /Level 1.*4語/
  );
  await expect(page.locator('.session-start-current-level:visible')).toContainText('11');
  await expect(page.locator('.session-start-current-level:visible')).not.toContainText('22');

  await page.getByRole('button', { name: /Level 2/ }).click();

  await expect(page.locator('.session-start-current-level:visible')).toContainText('最高スコア');
  await expect(page.locator('.session-start-current-level__topline:visible')).toHaveText(
    /Level 2.*4語/
  );
  await expect(page.locator('.session-start-current-level:visible')).toContainText('22');
  await expect(page.locator('.session-start-current-level:visible')).not.toContainText('11');
});

test('ゲーム遷移後はページ上部へ戻る', async ({ page }) => {
  await installMockWordlists(page);
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await makePageScrollable(page);
  await scrollToPageBottom(page);
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { message: 'ページ下部までスクロールされる' })
    .toBeGreaterThan(0);

  await page.getByRole('button', { name: 'ゲームを始める' }).click();

  await expect(page.locator('.trad-word').first()).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { message: 'ゲーム開始後に上部へ戻る' })
    .toBe(0);

  await answerCorrectChoice(page);
  await scrollToPageBottom(page);
  await expect
    .poll(() => page.evaluate(() => window.scrollY), {
      message: '回答後に下部までスクロールされる',
    })
    .toBeGreaterThan(0);

  await page.getByRole('button', { name: '次の問題' }).click();

  await expect(page.locator('.trad-word').first()).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { message: '次の問題後に上部へ戻る' })
    .toBe(0);

  await finishWithWrongAnswers(page);
  await expect(page.locator('.game-over-panel')).toBeVisible();
  await scrollToPageBottom(page);
  await expect
    .poll(() => page.evaluate(() => window.scrollY), {
      message: 'ゲームオーバー後に下部までスクロールされる',
    })
    .toBeGreaterThan(0);

  await page.getByRole('button', { name: 'もう一度始める' }).click();

  await expect(page.locator('.trad-word').first()).toBeVisible();
  await expect(page.locator('.choice-card')).toHaveCount(4);
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { message: '再開後に上部へ戻る' })
    .toBe(0);

  await answerCorrectChoice(page);
  await scrollToPageBottom(page);
  await expect
    .poll(() => page.evaluate(() => window.scrollY), {
      message: '再開後の回答で下部までスクロールされる',
    })
    .toBeGreaterThan(0);

  await page.getByRole('button', { name: 'トップへ戻る' }).click();

  await expect(page.getByRole('button', { name: 'ゲームを始める' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { message: 'トップ復帰後に上部へ戻る' })
    .toBe(0);
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
