# Codebase Hardening Implementation Plan

> Status: 破棄済み。現行 plan ではありません。責務分離とテスト補強を進めた時点の履歴としてのみ扱ってください。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存のゲーム挙動を維持したまま、`pages/index.vue` の責務を分離し、状態遷移の失敗を明示的に扱えるようにし、回帰を防ぐテストを補強する。

**Architecture:** ページはオーケストレーションに寄せ、音声、効果音、記録保存、UI導出値を composable / component へ切り出す。ゲーム進行のドメイン状態は `useTraditionalTrainer` に残し、UI通知や劣化挙動はページ層または専用 composable で受ける。テストは unit / component / e2e の3層で既存挙動を固定する。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Vitest, Playwright, Web Speech API, Web Audio API

---

## File Structure

### Create

- `composables/useTrainerAudio.ts`
- `composables/useFeedbackAudio.ts`
- `composables/useHighScores.ts`
- `composables/useTrainerSessionUi.ts`
- `components/SessionStartPanel.vue`
- `components/GameOverPanel.vue`
- `tests/unit/useTrainerAudio.test.ts`
- `tests/unit/useFeedbackAudio.test.ts`
- `tests/unit/useHighScores.test.ts`
- `tests/unit/useTrainerSessionUi.test.ts`
- `tests/components/session-start-panel.test.ts`
- `tests/components/game-over-panel.test.ts`

### Modify

- `pages/index.vue`
- `composables/useTraditionalTrainer.ts`
- `tests/components/index-page.test.ts`
- `tests/unit/useTraditionalTrainer.test.ts`
- `tests/e2e/game-flow.spec.ts`
- `README.md` if implementation changes user-facing操作 or testing scope

### Reference

- `docs/superpowers/specs/2026-03-21-codebase-hardening-design.md`
- `utils/trainer.ts`
- `tests/setup.ts`
- `AGENTS.md`

### Notes

- 英語 UI 文言は維持すること
- ゲームモード追加や語彙仕様変更は行わないこと
- `index.vue` の責務は「レイアウトとイベント接続」に寄せること

## Task 1: 既存挙動を固定するテストを先に補強する

**Files:**
- Modify: `tests/unit/useTraditionalTrainer.test.ts`
- Modify: `tests/components/index-page.test.ts`
- Modify: `tests/e2e/game-flow.spec.ts`
- Reference: `pages/index.vue`
- Reference: `composables/useTraditionalTrainer.ts`

- [ ] **Step 1: `useTraditionalTrainer` の失敗系テストを追加する**

追加候補:

```ts
it('次問題生成に失敗したときに例外を投げる', async () => {
  // pool を誤答不足にして初期化し、nextQuestion で失敗を確認する
});
```

- [ ] **Step 2: 失敗テストだけを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/unit/useTraditionalTrainer.test.ts`
Expected: 新規ケースが FAIL する

- [ ] **Step 3: `index-page` の失敗系UIテストを追加する**

追加候補:

```ts
it('次の問題への遷移失敗を継続不能状態として表示する', async () => {
  // trainer.nextQuestion が失敗した場合の表示
});
```

- [ ] **Step 4: component テストだけを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: 新規ケースが FAIL する

- [ ] **Step 5: E2E で維持したい導線を明文化する**

追加候補:

```ts
test('game over 後に restart/reset できる', async ({ page }) => {
  // 既存導線の維持確認
});
```

- [ ] **Step 6: E2E テストファイルを実行して新規ケースが現状未実装であることを確認する**

Run: `npm run test:e2e -- --grep "restart|reset"`
Expected: 新規ケースが FAIL または未実装相当になる

- [ ] **Step 7: ここまでをコミットする**

```bash
git add tests/unit/useTraditionalTrainer.test.ts tests/components/index-page.test.ts tests/e2e/game-flow.spec.ts
git commit -m "test: lock in current trainer flows"
```

## Task 2: 記録保存責務を `useHighScores` に分離する

**Files:**
- Create: `composables/useHighScores.ts`
- Create: `tests/unit/useHighScores.test.ts`
- Modify: `pages/index.vue`
- Reference: `types/vocabulary.ts`

- [ ] **Step 1: `useHighScores` の失敗テストを書く**

対象:

- 旧形式データを読める
- `localStorage` 読み込み失敗で空記録へフォールバックする
- 更新値が自己ベストのみ反映される
- 保存失敗でも例外を外へ投げない

- [ ] **Step 2: 新規 unit テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/unit/useHighScores.test.ts`
Expected: FAIL

- [ ] **Step 3: `useHighScores` を最小実装する**

実装要件:

- `createEmptyHighScores`
- parse / load / save
- record update helper
- `window` 不在時の no-op

- [ ] **Step 4: unit テストを再実行して緑を確認する**

Run: `npm run test:unit -- --run tests/unit/useHighScores.test.ts`
Expected: PASS

- [ ] **Step 5: `index.vue` から high score 関連ロジックを置き換える**

対象:

- `HIGH_SCORE_STORAGE_KEY`
- `parseLevelHighScore`
- `loadHighScores`
- `saveHighScores`
- watch 内の更新処理

- [ ] **Step 6: `index-page` テストを実行して回帰がないことを確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add composables/useHighScores.ts tests/unit/useHighScores.test.ts pages/index.vue tests/components/index-page.test.ts
git commit -m "refactor: extract high score persistence"
```

## Task 3: 音声と効果音を composable に分離する

**Files:**
- Create: `composables/useTrainerAudio.ts`
- Create: `composables/useFeedbackAudio.ts`
- Create: `tests/unit/useTrainerAudio.test.ts`
- Create: `tests/unit/useFeedbackAudio.test.ts`
- Modify: `pages/index.vue`
- Reference: `tests/setup.ts`

- [ ] **Step 1: `useTrainerAudio` の unit テストを書く**

対象:

- `SpeechSynthesis` 非対応時は再生不可状態になる
- voice 選択が `zh-TW` 優先になる
- `play` / `stop` / pending 管理が機能する

- [ ] **Step 2: `useFeedbackAudio` の unit テストを書く**

対象:

- `AudioContext` 非対応時は no-op
- 正解 / 不正解で音列生成が分岐する
- resume 失敗でも外へ例外を漏らさない

- [ ] **Step 3: 新規 unit テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/unit/useTrainerAudio.test.ts tests/unit/useFeedbackAudio.test.ts`
Expected: FAIL

- [ ] **Step 4: `useTrainerAudio` と `useFeedbackAudio` を最小実装する**

実装要件:

- ブラウザAPI未対応を non-fatal に扱う
- `index.vue` から API を呼ぶだけにする
- unmount cleanup を composable API から呼べるようにする

- [ ] **Step 5: unit テストを再実行して緑を確認する**

Run: `npm run test:unit -- --run tests/unit/useTrainerAudio.test.ts tests/unit/useFeedbackAudio.test.ts`
Expected: PASS

- [ ] **Step 6: `index.vue` の音声/効果音ロジックを差し替える**

対象:

- `speechSupported`
- `isSpeaking`
- `preferredVoice`
- `audioContext`
- `playCurrentQuestionAudio`
- `playFeedbackSound`
- lifecycle cleanup

- [ ] **Step 7: 既存 component テストを実行して回帰を確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 8: ここまでをコミットする**

```bash
git add composables/useTrainerAudio.ts composables/useFeedbackAudio.ts tests/unit/useTrainerAudio.test.ts tests/unit/useFeedbackAudio.test.ts pages/index.vue tests/components/index-page.test.ts
git commit -m "refactor: extract audio controls"
```

## Task 4: UI導出ロジックを `useTrainerSessionUi` に分離する

**Files:**
- Create: `composables/useTrainerSessionUi.ts`
- Create: `tests/unit/useTrainerSessionUi.test.ts`
- Modify: `pages/index.vue`
- Reference: `composables/useTraditionalTrainer.ts`
- Reference: `types/vocabulary.ts`

- [ ] **Step 1: UI導出値の unit テストを書く**

対象:

- `showSessionStart`
- `showLevelPanel`
- `answerMessage`
- `feedbackBadge`
- `gameOverTitle`
- `gameOverSummary`

- [ ] **Step 2: unit テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/unit/useTrainerSessionUi.test.ts`
Expected: FAIL

- [ ] **Step 3: `useTrainerSessionUi` を最小実装する**

入力:

- `game`
- `currentQuestion`
- `loadError`
- `sessionStartPending`
- `metadataStatus`
- `highScores`

出力:

- UI 用 computed 群

- [ ] **Step 4: unit テストを再実行して緑を確認する**

Run: `npm run test:unit -- --run tests/unit/useTrainerSessionUi.test.ts`
Expected: PASS

- [ ] **Step 5: `index.vue` の computed 群を差し替える**

対象:

- `showSessionStart`
- `showLevelPanel`
- `answerMessage`
- `feedbackTone`
- `feedbackBadge`
- game over 表示値

- [ ] **Step 6: 既存 page テストを再実行して回帰を確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add composables/useTrainerSessionUi.ts tests/unit/useTrainerSessionUi.test.ts pages/index.vue tests/components/index-page.test.ts
git commit -m "refactor: extract session ui state"
```

## Task 5: 開始前UIとゲームオーバーUIを component に分離する

**Files:**
- Create: `components/SessionStartPanel.vue`
- Create: `components/GameOverPanel.vue`
- Create: `tests/components/session-start-panel.test.ts`
- Create: `tests/components/game-over-panel.test.ts`
- Modify: `pages/index.vue`
- Modify: `tests/components/index-page.test.ts`

- [ ] **Step 1: `SessionStartPanel` の component テストを書く**

対象:

- タイトル、メタ情報、開始ボタン表示
- disabled 制御
- click event emission

- [ ] **Step 2: `GameOverPanel` の component テストを書く**

対象:

- score / streak / achievements 表示
- restart/reset event emission

- [ ] **Step 3: 新規 component テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts tests/components/game-over-panel.test.ts`
Expected: FAIL

- [ ] **Step 4: 2コンポーネントを最小実装する**

実装要件:

- 見た目のマークアップは現行を踏襲する
- 英語 UI 文言は維持する
- props / emits はページ依存を最小にする

- [ ] **Step 5: `index.vue` の該当テンプレートを置き換える**

対象:

- session start panel 部分
- game over panel 部分

- [ ] **Step 6: component テストと page テストを再実行する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts tests/components/game-over-panel.test.ts tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add components/SessionStartPanel.vue components/GameOverPanel.vue tests/components/session-start-panel.test.ts tests/components/game-over-panel.test.ts pages/index.vue tests/components/index-page.test.ts
git commit -m "refactor: split session panels into components"
```

## Task 6: `useTraditionalTrainer` に安全な遷移口を追加する

**Files:**
- Modify: `composables/useTraditionalTrainer.ts`
- Modify: `tests/unit/useTraditionalTrainer.test.ts`
- Modify: `pages/index.vue`
- Reference: `utils/trainer.ts`

- [ ] **Step 1: 安全な遷移口の期待挙動をテストで定義する**

候補 API:

```ts
const result = trainer.safeNextQuestion();
expect(result.ok).toBe(false);
expect(result.error).toBeInstanceOf(Error);
```

- [ ] **Step 2: unit テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/unit/useTraditionalTrainer.test.ts`
Expected: FAIL

- [ ] **Step 3: 最小実装を入れる**

実装要件:

- `nextQuestion` 互換を保つ、または内部委譲する
- 失敗時に UI 側が扱いやすい結果を返す
- 既存の正常系挙動は維持する

- [ ] **Step 4: `index.vue` の `moveToNextQuestion` を安全API利用へ置き換える**

要件:

- fatal error として表示する
- 音声 pending 状態を破綻させない

- [ ] **Step 5: unit / component テストを再実行して緑を確認する**

Run: `npm run test:unit -- --run tests/unit/useTraditionalTrainer.test.ts tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 6: ここまでをコミットする**

```bash
git add composables/useTraditionalTrainer.ts tests/unit/useTraditionalTrainer.test.ts pages/index.vue tests/components/index-page.test.ts
git commit -m "refactor: harden trainer transitions"
```

## Task 7: 低リスクなアクセシビリティ改善を追加する

**Files:**
- Modify: `pages/index.vue`
- Modify: `assets/css/main.css`
- Modify: `tests/components/index-page.test.ts`
- Modify: `tests/e2e/game-flow.spec.ts`

- [ ] **Step 1: キーボード操作またはフォーカス表示の期待をテスト化する**

候補:

- choice button の明確な focus style
- `1-4` キー回答
- `Enter` で次の問題

- [ ] **Step 2: 該当テストを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: FAIL

- [ ] **Step 3: 低リスクな改善だけ実装する**

推奨:

- `:focus-visible` の追加
- キーボードショートカットを導入する場合は既存導線を壊さない最小実装

- [ ] **Step 4: component / e2e を再実行して緑を確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: PASS

Run: `npm run test:e2e`
Expected: PASS

- [ ] **Step 5: ここまでをコミットする**

```bash
git add pages/index.vue assets/css/main.css tests/components/index-page.test.ts tests/e2e/game-flow.spec.ts
git commit -m "feat: improve keyboard and focus accessibility"
```

## Task 8: 総合検証とドキュメント確認

**Files:**
- Modify: `README.md` only if user-facing behavior or test guidance changed
- Reference: `AGENTS.md`

- [ ] **Step 1: unit テストをフル実行する**

Run: `npm run test:unit`
Expected: PASS

- [ ] **Step 2: lint を実行する**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: 型検査を実行する**

Run: `npx tsc --noEmit -p .nuxt/tsconfig.json`
Expected: PASS

- [ ] **Step 4: ビルドを実行する**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: UI導線変更があれば E2E をフル実行する**

Run: `npm run test:e2e`
Expected: PASS

- [ ] **Step 6: README 更新要否を確認する**

確認観点:

- ユーザー向け操作やコマンドに変更があるか
- テストガイド更新が必要か

- [ ] **Step 7: 最終コミットを作る**

```bash
git add README.md pages/index.vue composables components assets/css/main.css tests
git commit -m "refactor: harden game page architecture"
```
