# UI Renewal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `Focused Learning Desk` を軸に、LexiFormosa の PC 向け UI/UX を刷新し、プレイ中の集中感、進行情報の見やすさ、正誤の分かりやすさ、UI 文言と重点訳の自然さを改善する。

**Architecture:** 既存の状態管理とゲームルールは維持しつつ、ページを `Lobby / Playing / Answered / Game Over` の見せ方で再構成する。`pages/index.vue` は状態接続を維持し、視覚構成は専用 component に寄せる。語彙訳の重点修正は `data/manual-vocabulary.json` を優先し、生成物の直接編集は行わない。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Vitest, Playwright, Biome, CSS, local vocabulary generation scripts

---

## File Structure

### Create

- `components/TrainerTopRail.vue`
- `components/QuestionStage.vue`
- `components/ResultBanner.vue`
- `tests/components/trainer-top-rail.test.ts`
- `tests/components/question-stage.test.ts`
- `tests/components/result-banner.test.ts`

### Modify

- `pages/index.vue`
- `assets/css/main.css`
- `components/SessionStartPanel.vue`
- `components/GameOverPanel.vue`
- `composables/useTrainerSessionUi.ts`
- `tests/components/index-page.test.ts`
- `tests/components/session-start-panel.test.ts`
- `tests/components/game-over-panel.test.ts`
- `tests/e2e/game-flow.spec.ts`
- `tests/fixtures/vocabulary.ts`
- `data/manual-vocabulary.json`
- `README.md`
- `docs/superpowers/specs/2026-03-21-ui-renewal-design.md` only if approved design changes during implementation

### Reference

- `docs/superpowers/specs/2026-03-21-ui-renewal-design.md`
- `pages/index.vue`
- `components/SessionStartPanel.vue`
- `components/GameOverPanel.vue`
- `composables/useTrainerSessionUi.ts`
- `data/manual-vocabulary.json`
- `scripts/generate-vocabulary.mjs`
- `AGENTS.md`

### Notes

- 英語ラベルは維持すること
- ゲームルール、得点計算、基本導線は変更しないこと
- PC ファーストだが、モバイル崩れは起こさないこと
- `Score / Streak / Miss` はプレイ中に常時見えること
- 正解 / 不正解は視覚的に現状より明確であること
- 語彙訳の修正は「頻出 / 違和感が強い / 誤学習の恐れがある」ものに限定すること

## Task 1: 現行挙動を新レイアウト前提のテストで固定する

**Files:**
- Modify: `tests/components/index-page.test.ts`
- Modify: `tests/e2e/game-flow.spec.ts`
- Reference: `pages/index.vue`
- Reference: `docs/superpowers/specs/2026-03-21-ui-renewal-design.md`

- [ ] **Step 1: プレイ中の常設情報に関する component テストを追加する**

```ts
it('プレイ中は score streak miss を画面内で確認できる', async () => {
  const wrapper = await mountSuspended(IndexPage);
  await startGame(wrapper);

  expect(wrapper.text()).toContain('Score');
  expect(wrapper.text()).toContain('Streak');
  expect(wrapper.text()).toContain('Miss');
});
```

- [ ] **Step 2: 回答後の正誤状態に関する component テストを追加する**

```ts
it('不正解時は選択カードと正解カードを別状態で表示する', async () => {
  // wrong choice を押し、correct / incorrect class と結果文言を確認する
});
```

- [ ] **Step 3: component テストだけを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: 新規ケースが FAIL する

- [ ] **Step 4: E2E に PC レイアウト確認を追加する**

```ts
test('PC 幅では top rail に score streak miss が見える', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/');
  await page.getByRole('button', { name: 'ゲームを始める' }).click();
  await expect(page.getByText('Score')).toBeVisible();
  await expect(page.getByText('Streak')).toBeVisible();
  await expect(page.getByText('Miss')).toBeVisible();
});
```

- [ ] **Step 5: E2E テストファイルを実行して赤を確認する**

Run: `npm run test:e2e -- --grep "top rail|正解|不正解|game over"`
Expected: 新規ケースが FAIL または未実装相当になる

- [ ] **Step 6: ここまでをコミットする**

```bash
git add tests/components/index-page.test.ts tests/e2e/game-flow.spec.ts
git commit -m "test: lock in ui renewal targets"
```

## Task 2: デザイントークンとプレイ中の骨格を組み直す

**Files:**
- Create: `components/TrainerTopRail.vue`
- Modify: `assets/css/main.css`
- Modify: `pages/index.vue`
- Test: `tests/components/trainer-top-rail.test.ts`
- Reference: `docs/superpowers/specs/2026-03-21-ui-renewal-design.md`

- [ ] **Step 1: `TrainerTopRail` の unit/component テストを書く**

```ts
it('score streak miss を表示し、miss は残り回数が分かる', () => {
  const wrapper = mount(TrainerTopRail, {
    props: { score: 120, streak: 4, missesInRow: 1, maxMisses: 3, levelLabel: 'Level 2' },
  });

  expect(wrapper.text()).toContain('Score');
  expect(wrapper.text()).toContain('120');
  expect(wrapper.text()).toContain('Miss');
  expect(wrapper.text()).toContain('1 / 3');
});
```

- [ ] **Step 2: 新規テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/components/trainer-top-rail.test.ts`
Expected: FAIL

- [ ] **Step 3: `TrainerTopRail.vue` を最小実装する**

```vue
<template>
  <div class="top-rail">
    <article class="top-rail-metric">...</article>
  </div>
</template>
```

- [ ] **Step 4: `assets/css/main.css` に新しい色・余白・カードトークンを追加する**

対象:

- 背景色
- surface 色
- correct / miss 色
- shadow
- top rail
- PC 中央集中レイアウト

- [ ] **Step 5: `pages/index.vue` に top rail を接続する**

対象:

- プレイ中だけ top rail を表示
- `Score / Streak / Miss` を上部固定帯に移動
- 既存の重複したセッション情報を整理

- [ ] **Step 6: 追加テストを再実行して緑を確認する**

Run: `npm run test:unit -- --run tests/components/trainer-top-rail.test.ts tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add components/TrainerTopRail.vue assets/css/main.css pages/index.vue tests/components/trainer-top-rail.test.ts tests/components/index-page.test.ts
git commit -m "feat: add focused play rail"
```

## Task 3: 問題カードと選択肢のビジュアルを刷新する

**Files:**
- Create: `components/QuestionStage.vue`
- Modify: `pages/index.vue`
- Modify: `assets/css/main.css`
- Test: `tests/components/question-stage.test.ts`
- Test: `tests/components/index-page.test.ts`

- [ ] **Step 1: `QuestionStage` のテストを書く**

```ts
it('繁体字を主役として表示し、読み補助と音声ボタンを補助表示する', () => {
  const wrapper = mount(QuestionStage, {
    props: { trad: '捷運站', katakanaReading: 'ジエ ユン ヂャン', pinyinReading: 'jié yùn zhàn' },
  });

  expect(wrapper.text()).toContain('捷運站');
  expect(wrapper.text()).toContain('ジエ ユン ヂャン');
});
```

- [ ] **Step 2: 新規テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/components/question-stage.test.ts`
Expected: FAIL

- [ ] **Step 3: `QuestionStage.vue` を最小実装する**

実装要件:

- 大きい繁体字
- 控えめな読み補助
- 音声ボタン
- ローディング / fatal error / start panel との共存を想定

- [ ] **Step 4: `pages/index.vue` で既存の word card を置き換える**

対象:

- `currentQuestion`
- `katakanaReading`
- `pinyinReading`
- `togglePronunciationAudio`

- [ ] **Step 5: `assets/css/main.css` で問題カードと 4 択の見た目を刷新する**

対象:

- 中央の主役カード
- 4 択カードの hover
- 選択後の押下感
- PC での横幅と余白

- [ ] **Step 6: component テストで回帰確認を行う**

Run: `npm run test:unit -- --run tests/components/question-stage.test.ts tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add components/QuestionStage.vue pages/index.vue assets/css/main.css tests/components/question-stage.test.ts tests/components/index-page.test.ts
git commit -m "feat: redesign question stage"
```

## Task 4: 回答後の結果帯と正誤フィードバックを明確化する

**Files:**
- Create: `components/ResultBanner.vue`
- Modify: `pages/index.vue`
- Modify: `assets/css/main.css`
- Modify: `composables/useTrainerSessionUi.ts`
- Test: `tests/components/result-banner.test.ts`
- Test: `tests/components/index-page.test.ts`

- [ ] **Step 1: `ResultBanner` のテストを書く**

```ts
it('correct 状態で得点加算を表示する', () => {
  const wrapper = mount(ResultBanner, {
    props: { tone: 'correct', badge: 'Correct', message: '正解です。+15点', error: null },
  });

  expect(wrapper.text()).toContain('Correct');
  expect(wrapper.text()).toContain('+15点');
});
```

- [ ] **Step 2: `incorrect` 状態のテストも追加する**

```ts
it('incorrect 状態で正解と残り miss を表示する', () => {
  // Miss と正解文言を確認する
});
```

- [ ] **Step 3: 新規テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/components/result-banner.test.ts`
Expected: FAIL

- [ ] **Step 4: `ResultBanner.vue` を最小実装する**

実装要件:

- `Correct / Miss / Loading`
- 補助文
- UI error の表示
- CTA はページ側から渡す

- [ ] **Step 5: `useTrainerSessionUi.ts` のメッセージを調整する**

対象:

- 開始前説明
- 正解時文言
- 不正解時文言
- ゲームオーバー要約

- [ ] **Step 6: `pages/index.vue` と CSS で正解 / 不正解の見え方を強化する**

対象:

- 正解カード
- 誤選択カード
- muted カード
- 結果帯

- [ ] **Step 7: 関連テストを再実行して緑を確認する**

Run: `npm run test:unit -- --run tests/components/result-banner.test.ts tests/components/index-page.test.ts tests/unit/useTrainerSessionUi.test.ts`
Expected: PASS

- [ ] **Step 8: ここまでをコミットする**

```bash
git add components/ResultBanner.vue pages/index.vue assets/css/main.css composables/useTrainerSessionUi.ts tests/components/result-banner.test.ts tests/components/index-page.test.ts tests/unit/useTrainerSessionUi.test.ts
git commit -m "feat: strengthen answer feedback"
```

## Task 5: 開始前とゲームオーバー画面を新デザインに合わせる

**Files:**
- Modify: `components/SessionStartPanel.vue`
- Modify: `components/GameOverPanel.vue`
- Modify: `pages/index.vue`
- Modify: `assets/css/main.css`
- Modify: `tests/components/session-start-panel.test.ts`
- Modify: `tests/components/game-over-panel.test.ts`
- Modify: `tests/components/index-page.test.ts`

- [ ] **Step 1: 開始前パネルの期待表示をテストへ反映する**

対象:

- 中央主導の開始カード
- level 情報
- records の静かな補助表示
- 文言の自然化

- [ ] **Step 2: ゲームオーバーパネルの期待表示をテストへ反映する**

対象:

- `今回の結果`
- `今回の Score`
- `Best Streak`
- CTA の強弱

- [ ] **Step 3: テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts tests/components/game-over-panel.test.ts`
Expected: FAIL

- [ ] **Step 4: `SessionStartPanel.vue` をデザインに合わせて更新する**

実装要件:

- 学習デスク的なヒーロー
- 開始導線を主役化
- level / count / sound の整列

- [ ] **Step 5: `GameOverPanel.vue` をデザインに合わせて更新する**

実装要件:

- 結果サマリーの整理
- achievements の視認性調整
- ボタン優先度

- [ ] **Step 6: 関連テストを再実行して緑を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts tests/components/game-over-panel.test.ts tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add components/SessionStartPanel.vue components/GameOverPanel.vue pages/index.vue assets/css/main.css tests/components/session-start-panel.test.ts tests/components/game-over-panel.test.ts tests/components/index-page.test.ts
git commit -m "feat: redesign lobby and game over states"
```

## Task 6: UI 文言と重点語彙訳を整える

**Files:**
- Modify: `composables/useTrainerSessionUi.ts`
- Modify: `pages/index.vue`
- Modify: `tests/components/index-page.test.ts`
- Modify: `tests/fixtures/vocabulary.ts`
- Modify: `data/manual-vocabulary.json`
- Reference: `AGENTS.md`

- [ ] **Step 1: UI 文言の違和感を洗い出してテストに反映する**

対象:

- 開始前説明
- 読み込み文言
- 正解 / 不正解文言
- game over 要約

- [ ] **Step 2: 重点修正する語彙候補を `manual-vocabulary` から列挙する**

例:

- `醫院: 病院`
- `老師: 先生`
- そのほか学習上の誤解が大きい訳

- [ ] **Step 3: `data/manual-vocabulary.json` を更新する**

```json
{
  "trad": "醫院",
  "ja": "病院・医院"
}
```

上の内容は例。実際は 4 択に馴染む短い自然な語にする。

- [ ] **Step 4: fixture も合わせて更新する**

対象:

- `tests/fixtures/vocabulary.ts`
- 該当 UI テストの期待値

- [ ] **Step 5: 文言関連テストを実行する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts tests/unit/useTrainerSessionUi.test.ts`
Expected: PASS

- [ ] **Step 6: 語彙データを再生成する**

Run: `npm run generate:data`
Expected: `public/wordlists` と `data/vocabulary*.json` がローカル再生成される

- [ ] **Step 7: データ整合性を確認する**

Run: `npm run check:data`
Expected: PASS

- [ ] **Step 8: 監査を実行する**

Run: `npm run audit:data`
Expected: 警告が出てもよいが、今回触った重点語彙に重大な違和感がない

- [ ] **Step 9: ここまでをコミットする**

```bash
git add composables/useTrainerSessionUi.ts pages/index.vue tests/components/index-page.test.ts tests/fixtures/vocabulary.ts data/manual-vocabulary.json
git commit -m "feat: refine copy and priority translations"
```

## Task 7: README 同期と総合検証を行う

**Files:**
- Modify: `README.md`
- Reference: `AGENTS.md`
- Reference: `docs/superpowers/specs/2026-03-21-ui-renewal-design.md`

- [ ] **Step 1: README の UI 説明を更新する**

対象:

- PC 向け集中レイアウト
- `Score / Streak / Miss` 常設
- 正誤フィードバック強化
- UI 文言 / 重点訳の調整に関わる説明

- [ ] **Step 2: lint を実行する**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: unit テストを実行する**

Run: `npm run test:unit`
Expected: PASS

- [ ] **Step 4: e2e テストを実行する**

Run: `npm run test:e2e`
Expected: PASS

- [ ] **Step 5: 型チェックを実行する**

Run: `npx tsc --noEmit -p .nuxt/tsconfig.json`
Expected: PASS

- [ ] **Step 6: ビルドを実行する**

Run: `npm run build`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add README.md
git commit -m "docs: sync ui renewal behavior"
```

## Recommended Execution Order

1. Task 1 で目標挙動を固定
2. Task 2 で top rail と骨格を作る
3. Task 3 で問題カードと選択肢を刷新
4. Task 4 で回答後の強い正誤フィードバックを入れる
5. Task 5 で start / game over を新デザインへ揃える
6. Task 6 で UI 文言と重点訳を仕上げる
7. Task 7 で README と総合検証を完了
