# Start Screen Arcade Refresh Implementation Plan

> Status: 破棄済み。現行 plan ではありません。開始画面の比較検討時の履歴としてのみ扱ってください。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** スタート画面をアーケード寄りの開始体験へ刷新し、`ゲームを始める` を主役に据えつつ、`Records` の全レベル表示と `Level` の選択導線を維持する。

**Architecture:** 既存の 1 ページ構成とゲーム状態管理は維持し、開始前 UI の情報階層だけを整理する。`app/pages/index.vue` は上段 `Taiwan Traditional Chinese Trainer / Records` と下段 `Level / Lobby` の骨格を保ったまま、`app/components/SessionStartPanel.vue` を説明中心のカードから CTA 主役の開始ステージに置き換える。`app/composables/useTrainerSessionUi.ts` は開始前コピーを最小化し、`app/assets/css/main.css` は上段圧縮と大型 `Lobby` のスタイルに集中する。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Vitest, Playwright, CSS

---

## File Structure

### Modify

- `app/components/SessionStartPanel.vue`
  - 旧 `Focused Learning Desk` / `Session` / `Records` 補助カードを撤去し、`ゲームを始める` 主役の開始ステージへ置き換える
- `app/composables/useTrainerSessionUi.ts`
  - 開始前に不要になった copy props を削り、`SessionStartPanel` へ渡す最小データを揃える
- `app/pages/index.vue`
  - 開始画面の説明文を 1 文へ更新し、`SessionStartPanel` へ新 props を渡し、`Level` ルールから不要文言を削る
- `app/assets/css/main.css`
  - 上段 2 枠の縦幅を詰め、`Records` の密度を上げ、大型 `Lobby` ステージの見た目を実装する
- `tests/components/session-start-panel.test.ts`
  - 新 `Lobby` 構造と冗長文言除去を固定する
- `tests/components/index-page.test.ts`
  - 開始画面の新コピー、全レベル Records、Level ルール整理を固定する
- `tests/e2e/game-flow.spec.ts`
  - 開始画面から `ゲームを始める` で入れる導線が壊れていないことを維持する
- `README.md`
  - 開始画面説明を新 UI に同期する

### Reference

- `docs/superpowers/specs/2026-04-04-start-screen-arcade-refresh-design.md`
- `app/pages/index.vue`
- `app/components/SessionStartPanel.vue`
- `app/composables/useTrainerSessionUi.ts`
- `app/assets/css/main.css`

### Notes

- `Records` は全レベルの `Best Score / Best Streak` 表示を維持する
- `Lobby` 内の補足は `選択レベル + 語数` までに絞る
- `Level` のルール一覧から `すべて繁体字の単語` を削除する
- 開始ボタンの文言は `ゲームを始める` のまま維持する
- プレイ中画面の `Score / Streak / Miss` 表示構造は今回変えない

## Task 1: 開始画面の新しい期待値をテストで固定する

**Files:**
- Modify: `tests/components/session-start-panel.test.ts`
- Modify: `tests/components/index-page.test.ts`
- Reference: `docs/superpowers/specs/2026-04-04-start-screen-arcade-refresh-design.md`

- [ ] **Step 1: `SessionStartPanel` の新しい構造を表す failing test を追加する**

```ts
it('開始ステージでは CTA を主役にし、旧補助カードを出さない', async () => {
  const wrapper = mount(SessionStartPanel, {
    props: {
      currentLevelLabel: 'Level 1',
      currentLevelCountLabel: '45語',
      canStartSession: true,
      loadError: null,
    },
  });

  expect(wrapper.text()).toContain('準備OK。');
  expect(wrapper.text()).toContain('Level 1');
  expect(wrapper.text()).toContain('45語');
  expect(wrapper.text()).toContain('ゲームを始める');
  expect(wrapper.text()).not.toContain('Focused Learning Desk');
  expect(wrapper.text()).not.toContain('Session');
  expect(wrapper.text()).not.toContain('Records');
});
```

- [ ] **Step 2: `SessionStartPanel` 単体テストだけを実行して RED を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts`
Expected: FAIL with missing `準備OK。` and/or old `Focused Learning Desk` assertions still passing

- [ ] **Step 3: index page の開始画面コピーを固定する failing test を追加する**

```ts
it('開始画面では説明を1文にし、冗長な開始文言を出さない', async () => {
  const wrapper = await mountSuspended(IndexPage);

  expect(wrapper.text()).toContain(
    '台湾で使われる繁体字の意味を、日本語4択でテンポよく見抜いていく単語ゲーム。'
  );
  expect(wrapper.text()).toContain('ゲームを始める');
  expect(wrapper.text()).not.toContain('このレベルから始める');
  expect(wrapper.text()).not.toContain('落ち着いたテンポ');
});
```

- [ ] **Step 4: index page で `Records` と `Level` の要件を固定する test を追加する**

```ts
it('開始画面では全レベル Records を維持し、Level ルールから不要文言を除く', async () => {
  const wrapper = await mountSuspended(IndexPage);
  const recordGridText = wrapper.get('.record-grid').text();
  const ruleItems = wrapper.findAll('.hint-block li').map((item) => item.text());

  expect(recordGridText).toContain('Level 1');
  expect(recordGridText).toContain('Level 2');
  expect(recordGridText).toContain('Level 3');
  expect(recordGridText).toContain('Best Score');
  expect(recordGridText).toContain('Best Streak');
  expect(ruleItems).not.toContain('すべて繁体字の単語');
});
```

- [ ] **Step 5: component テストだけを実行して RED を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts tests/components/index-page.test.ts`
Expected: FAIL with old start panel copy and old Level rules still present

- [ ] **Step 6: ここまでをコミットする**

```bash
git add tests/components/session-start-panel.test.ts tests/components/index-page.test.ts
git commit -m "開始画面刷新の期待値をテストで固定"
```

## Task 2: SessionStartPanel と開始前 copy を最小構成へ整理する

**Files:**
- Modify: `app/components/SessionStartPanel.vue`
- Modify: `app/composables/useTrainerSessionUi.ts`
- Modify: `tests/components/session-start-panel.test.ts`

- [ ] **Step 1: `useTrainerSessionUi.ts` から不要になった開始前 copy を削る**

```ts
const canStartSession = computed(
  () => showSessionStart.value && !isLoading.value && Boolean(currentQuestion.value)
);
```

削除対象:

- `startPanelTitle`
- `startPanelCopy`
- `startPanelModeLabel`

- [ ] **Step 2: `SessionStartPanel.vue` の props を新構成へ絞る**

```ts
const props = defineProps<{
  currentLevelLabel: string;
  currentLevelCountLabel: string;
  canStartSession: boolean;
  loadError: string | null;
}>();
```

- [ ] **Step 3: `SessionStartPanel.vue` を CTA 主役のテンプレートへ置き換える**

```vue
<section class="session-start-panel">
  <div class="session-start-panel__hero">
    <p class="session-start-kicker">Arcade Lobby</p>
    <strong class="session-start-title">準備OK。</strong>
    <div class="session-start-chips" aria-label="選択中の開始条件">
      <span class="session-start-chip">{{ props.currentLevelLabel }}</span>
      <span class="session-start-chip">{{ props.currentLevelCountLabel }}</span>
    </div>
  </div>

  <div class="session-start-panel__actions">
    <button
      class="primary-button session-start-button"
      type="button"
      :disabled="!props.canStartSession"
      aria-keyshortcuts="Enter"
      @click="emit('start')"
    >
      ゲームを始める
    </button>
    <p v-if="props.loadError" class="session-start-error">{{ props.loadError }}</p>
  </div>
</section>
```

- [ ] **Step 4: 単体テストの props と期待値を新 API に合わせる**

```ts
const wrapper = mount(SessionStartPanel, {
  props: {
    currentLevelLabel: 'Level 2',
    currentLevelCountLabel: '38語',
    canStartSession: false,
    loadError: 'level 2 missing',
  },
});

expect(wrapper.text()).toContain('準備OK。');
expect(wrapper.text()).toContain('38語');
expect(wrapper.text()).toContain('level 2 missing');
```

- [ ] **Step 5: `SessionStartPanel` 単体テストを実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts`
Expected: PASS

- [ ] **Step 6: ここまでをコミットする**

```bash
git add app/components/SessionStartPanel.vue app/composables/useTrainerSessionUi.ts tests/components/session-start-panel.test.ts
git commit -m "開始ステージをCTA中心の構成へ整理"
```

## Task 3: index.vue と CSS で開始画面全体を B 案ベースへ寄せる

**Files:**
- Modify: `app/pages/index.vue`
- Modify: `app/assets/css/main.css`
- Modify: `tests/components/index-page.test.ts`

- [ ] **Step 1: hero の説明文を 1 文へ差し替える**

```vue
<p class="hero-text">
  台湾で使われる繁体字の意味を、日本語4択でテンポよく見抜いていく単語ゲーム。
</p>
```

- [ ] **Step 2: `SessionStartPanel` 呼び出し側を新 props に合わせる**

```vue
<SessionStartPanel
  :current-level-label="currentLevelCard.label"
  :current-level-count-label="currentLevelCountLabel"
  :can-start-session="canStartSession"
  :load-error="uiError"
  @start="startSession()"
/>
```

- [ ] **Step 3: `Level` ルール一覧から不要文言を削る**

```vue
<div class="hint-block">
  <p>ルール</p>
  <ul>
    <li>正解は4択のうち1つだけ</li>
    <li>3回続けて間違えると終了</li>
    <li>正解で10点</li>
    <li>3連続正解以降はボーナス加点</li>
  </ul>
</div>
```

- [ ] **Step 4: 上段 2 枠の高さを詰め、`Lobby` を大型ステージに見せる CSS を追加する**

```css
.hero-brand {
  min-height: 248px;
  gap: 14px;
  padding: 24px 28px;
}

.hero-stats-panel {
  min-height: 248px;
  gap: 12px;
}

.session-start-panel {
  display: grid;
  gap: 18px;
  padding: 28px;
  border-radius: var(--radius-xl);
  background:
    radial-gradient(circle at top left, rgba(255, 188, 92, 0.22), transparent 34%),
    radial-gradient(circle at bottom right, rgba(15, 118, 110, 0.16), transparent 36%),
    linear-gradient(160deg, rgba(255, 249, 239, 0.98), rgba(242, 250, 247, 0.96));
}
```

- [ ] **Step 5: `Records` のカード密度を上げる CSS を追加する**

```css
.record-card {
  gap: 10px;
  padding: 14px 16px;
}

.record-stat strong {
  font-size: 1.45rem;
}
```

- [ ] **Step 6: component テストを再実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add app/pages/index.vue app/assets/css/main.css tests/components/index-page.test.ts
git commit -m "開始画面を大型ロビー構成へ更新"
```

## Task 4: E2E・README・最終検証を揃える

**Files:**
- Modify: `tests/e2e/game-flow.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: E2E で開始画面コピー変更後も開始導線が成立することを固定する**

```ts
await expect(page.getByRole('button', { name: 'ゲームを始める' })).toBeVisible();
await expect(
  page.getByText('台湾で使われる繁体字の意味を、日本語4択でテンポよく見抜いていく単語ゲーム。')
).toBeVisible();
await expect(page.getByText('このレベルから始める')).toHaveCount(0);
```

- [ ] **Step 2: README の開始画面説明を新構成へ更新する**

```md
- 開始画面は上段にタイトルと全レベル Records、下段に Level 選択と大型 Lobby を配置
- `ゲームを始める` からセッション開始
```

- [ ] **Step 3: 単体テストを通す**

Run: `npm run test:unit`
Expected: PASS

- [ ] **Step 4: 型チェックを通す**

Run: `npx tsc --noEmit -p .nuxt/tsconfig.json`
Expected: PASS

- [ ] **Step 5: E2E を通す**

Run: `npm run test:e2e`
Expected: PASS

- [ ] **Step 6: ビルドを通す**

Run: `npm run build`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add tests/e2e/game-flow.spec.ts README.md
git commit -m "開始画面刷新の導線と文書を更新"
```

## Self-Review Checklist

- Spec coverage:
  - `Taiwan Traditional Chinese Trainer` の 1 文化は Task 1 Step 3 と Task 3 Step 1 で実装する
  - `Records` の全レベル維持は Task 1 Step 4 と Task 3 Step 5 で固定する
  - `Level` から不要文言削除は Task 1 Step 4 と Task 3 Step 3 で実装する
  - `Lobby` の大型 CTA 化は Task 1 Step 1 と Task 2 Step 3 と Task 3 Step 4 で実装する
  - README 同期は Task 4 Step 2 で対応する
- Placeholder scan:
  - `TBD` / `TODO` / `適宜` / `必要に応じて` を使っていないこと
  - 各コード変更 step に対象コード例があること
- Type consistency:
  - `SessionStartPanel` props は `currentLevelLabel`, `currentLevelCountLabel`, `canStartSession`, `loadError` の 4 つで統一する
  - `SessionStartPanel` の見出し `準備OK。` はコンポーネント内に固定し、`useTrainerSessionUi` から別名 prop を増やさない
