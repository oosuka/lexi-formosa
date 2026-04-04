# Apple-Informed Top And Play Screen Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apple HIG を参照した静かな学習アプリ寄りの UI 文法を、トップ画面だけでなくプレイ中画面まで一貫して適用する。

**Architecture:** 開始画面は既存の `PLAY` モジュール構成を維持しつつ、プレイ中は `hero-panel` と独立した `Session` 枠を非表示にし、`quiz-panel` 1 枚へ情報を集約する。`Score / Streak / Miss` は独立帯ではなく問題カード上部の細い情報列へ統合し、`QuestionStage` をプレイ中の主役コンポーネントとして再構成する。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Vitest, Playwright, CSS

---

## File Structure

### Modify

- `app/pages/index.vue`
  - プレイ中は `hero-panel` を出さず、`quiz-panel` だけを表示する
  - `TrainerTopRail` を外し、プレイ中情報を `QuestionStage` へ渡す
- `app/components/QuestionStage.vue`
  - `Level / Score / Streak / Miss` の情報列を内包する構造へ更新する
  - 音声ボタンを上部情報列の一部として馴染ませる
- `app/assets/css/main.css`
  - プレイ中の単一 surface、情報列、問題カード、選択肢、フィードバックの余白と素材感を整える
- `tests/components/question-stage.test.ts`
  - 情報列を含む新しい `QuestionStage` API と表示を固定する
- `tests/components/index-page.test.ts`
  - プレイ中に `hero-panel` が消え、`quiz-panel` に情報列が統合されることを固定する
- `tests/e2e/game-flow.spec.ts`
  - プレイ開始後の `hero-panel` 非表示と `Score / Streak / Miss` 統合を固定する
- `README.md`
  - プレイ中 UI が単一カードへ統合されたことを説明する

### Delete

- `app/components/TrainerTopRail.vue`
  - 独立コンポーネントとしては不要になる
- `tests/components/trainer-top-rail.test.ts`
  - `QuestionStage` へ責務統合する

### Keep As-Is

- `app/components/SessionStartPanel.vue`
  - 開始画面側の `PLAY` 仕様は現状維持
- `app/composables/useTrainerSessionUi.ts`
  - スコア計算や状態遷移ロジックは変えない
- `app/utils/trainer.ts`
  - 出題ロジックは変えない

### References

- `docs/superpowers/specs/2026-04-04-apple-start-screen-design-system.md`

## Task 1: プレイ中 UI の新仕様を failing test で固定する

**Files:**
- Modify: `tests/components/question-stage.test.ts`
- Modify: `tests/components/index-page.test.ts`
- Modify: `tests/e2e/game-flow.spec.ts`
- Delete: `tests/components/trainer-top-rail.test.ts`

- [ ] **Step 1: `QuestionStage` に情報列を含む新 props を前提とした failing test を書く**

```ts
it('プレイ中の情報列と問題表示を同じカード内で表示する', () => {
  const wrapper = mount(QuestionStage, {
    props: {
      levelLabel: 'Level 2',
      score: 45,
      streak: 3,
      missesInRow: 1,
      maxMisses: 3,
      trad: '捷運站',
      katakanaReading: 'ジエ ユン ヂャン',
      pinyinReading: 'jié yùn zhàn',
      canPlayAudio: true,
      isSpeaking: false,
    },
  });

  expect(wrapper.text()).toContain('Level 2');
  expect(wrapper.text()).toContain('Score');
  expect(wrapper.text()).toContain('45');
  expect(wrapper.text()).toContain('Streak');
  expect(wrapper.text()).toContain('3');
  expect(wrapper.text()).toContain('Miss');
  expect(wrapper.text()).toContain('1 / 3');
  expect(wrapper.text()).toContain('捷運站');
});
```

- [ ] **Step 2: `IndexPage` でプレイ開始後に `hero-panel` が消えることを固定する failing test を追加する**

```ts
it('プレイ開始後は hero-panel を表示せず、quiz-panel だけを主役にする', async () => {
  const wrapper = await mountSuspended(IndexPage);

  await wrapper.get('button.session-start-button').trigger('click');
  await flushPromises();

  expect(wrapper.find('.hero-panel').exists()).toBe(false);
  expect(wrapper.get('.quiz-panel').text()).toContain('Score');
  expect(wrapper.get('.quiz-panel').text()).toContain('Streak');
  expect(wrapper.get('.quiz-panel').text()).toContain('Miss');
});
```

- [ ] **Step 3: E2E にプレイ中の単一カード構成を固定する期待値を追加する**

```ts
const playArea = page.locator('.quiz-panel');

await expect(playArea.getByText('Score', { exact: true })).toBeVisible();
await expect(playArea.getByText('Streak', { exact: true })).toBeVisible();
await expect(playArea.getByText('Miss', { exact: true })).toBeVisible();
await expect(page.locator('.hero-panel')).toHaveCount(0);
```

- [ ] **Step 4: `trainer-top-rail` 専用 test を削除する**

- [ ] **Step 5: RED を確認する**

Run: `npm run test:unit -- --run tests/components/question-stage.test.ts tests/components/index-page.test.ts`
Expected: FAIL with old独立帯 UI

## Task 2: プレイ中のマークアップを 1 枚の学習面へ統合する

**Files:**
- Modify: `app/pages/index.vue`
- Modify: `app/components/QuestionStage.vue`
- Delete: `app/components/TrainerTopRail.vue`

- [ ] **Step 1: `QuestionStage` の props を HUD 情報込みへ拡張する**

```ts
const props = defineProps<{
  levelLabel: string;
  score: number;
  streak: number;
  missesInRow: number;
  maxMisses: number;
  trad: string;
  katakanaReading: string;
  pinyinReading: string;
  canPlayAudio: boolean;
  isSpeaking: boolean;
}>();
```

- [ ] **Step 2: `QuestionStage` のテンプレートを上部情報列 + 問題本文構成へ更新する**

```vue
<article class="question-stage">
  <div class="question-stage__hud">
    <div class="question-stage__meta">
      <span class="question-stage__level">{{ props.levelLabel }}</span>
    </div>

    <dl class="question-stage__stats">
      <div><dt>Score</dt><dd>{{ props.score }}</dd></div>
      <div><dt>Streak</dt><dd>{{ props.streak }}</dd></div>
      <div><dt>Miss</dt><dd>{{ missLabel }}</dd></div>
    </dl>

    <button class="audio-button" ...>
      {{ audioButtonLabel }}
    </button>
  </div>

  <strong class="question-stage__trad trad-word">{{ props.trad }}</strong>
  <div v-if="props.katakanaReading || props.pinyinReading" class="question-stage__readings">
    ...
  </div>
</article>
```

- [ ] **Step 3: `index.vue` から `TrainerTopRail` を除去して `QuestionStage` へ値を渡す**

```vue
<QuestionStage
  :level-label="LEVEL_COPY[currentQuestion.level].label"
  :score="score"
  :streak="streak"
  :misses-in-row="missesInRow"
  :max-misses="maxMisses"
  :trad="currentQuestion.trad"
  ...
/>
```

- [ ] **Step 4: プレイ中は `hero-panel` を描画しない条件分岐へ整理する**

```vue
<section v-if="showSessionStart" class="hero-panel">
  ...
</section>

<section
  v-if="showSessionStart"
  class="session-module surface-card"
>
  ...
</section>

<section v-else class="workspace-grid workspace-grid--play">
  <section class="quiz-panel surface-card">
    ...
  </section>
</section>
```

- [ ] **Step 5: unit tests を実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/components/question-stage.test.ts tests/components/index-page.test.ts`
Expected: PASS

## Task 3: Apple 寄りの余白・色・文字ルールをプレイ中へ適用する

**Files:**
- Modify: `app/assets/css/main.css`
- Modify: `README.md`
- Modify: `tests/e2e/game-flow.spec.ts`

- [ ] **Step 1: `quiz-panel` を単一 surface として整える**

```css
.workspace-grid--play {
  display: block;
}

.quiz-panel {
  max-width: 920px;
  margin: 0 auto;
  padding: 24px;
}
```

- [ ] **Step 2: `QuestionStage` の HUD 行と本文の間隔を整える**

```css
.question-stage__hud {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 16px;
  align-items: center;
  margin-bottom: 20px;
}

.question-stage__readings {
  margin-top: 12px;
}

.choice-grid {
  margin-top: 24px;
}
```

- [ ] **Step 3: 正誤フィードバックと選択肢の色を start screen と同じ素材感に寄せる**

- [ ] **Step 4: README のプレイ中画面説明を更新する**

```md
- プレイ中はタイトル枠や Session 枠を表示せず、問題カード 1 枚へ情報を集約
- `Score / Streak / Miss` は問題カード上部の情報列に表示
```

- [ ] **Step 5: E2E を実行して PC 幅と主要導線を確認する**

Run: `npm run test:e2e`
Expected: PASS

## Task 4: 最終検証

**Files:**
- Verify only

- [ ] **Step 1: lint を実行する**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 2: unit tests を実行する**

Run: `npm run test:unit`
Expected: PASS

- [ ] **Step 3: 型チェックを実行する**

Run: `npx tsc --noEmit -p .nuxt/tsconfig.json`
Expected: PASS

- [ ] **Step 4: build を実行する**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: UI 導線変更なので E2E を再実行する**

Run: `npm run test:e2e`
Expected: PASS

## Self-Review Checklist

- Spec coverage
  - 開始画面 `PLAY` 仕様は既存実装を維持している
  - プレイ中は `hero-panel` と `Session` 枠が消える
  - `Score / Streak / Miss` が問題カード上部に統合される
  - `Level` と realtime 指標の Title Case が揃う
  - 色、余白、角丸、影がトップ画面と矛盾しない
- Placeholder scan
  - `TODO` や曖昧な UI 文言が残っていない
- Type consistency
  - `QuestionStage` がプレイ中 HUD 情報の単一責務を持つ
  - `TrainerTopRail` への依存が残っていない
