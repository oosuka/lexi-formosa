# Answer Feedback Impact Implementation Plan

> Status: この計画の内容は実装済みです。現行仕様の一次情報ではなく、回答フィードバック強化を行った時点の実装計画の履歴として扱ってください。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 音や効果音がなくても、回答直後に正解・不正解・自分の選択・正解のカードが一瞬で分かる強い視覚フィードバックを実装する。

**Architecture:** 既存の `feedbackTone` と `choiceClass` を維持しつつ、`choice-card`、`ResultBanner`、`quiz-panel` の 3 層に演出を足す。文言生成は `useTrainerSessionUi.ts` に残し、`pages/index.vue` は状態クラス接続、`assets/css/main.css` は演出本体、`ResultBanner.vue` は要約表示に専念させる。reduced motion では動きを減らし、class / label / badge 差だけを必ず残す。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Vitest, Playwright, CSS

---

## File Structure

### Modify

- `assets/css/main.css`
  - choice-card の正誤演出、quiz-panel の stage reaction、ResultBanner の強調表現、reduced motion fallback を実装する
- `pages/index.vue`
  - `quiz-panel` と `choice-card` に正誤対応 class を付与し、必要な icon / label の接続を行う
- `components/ResultBanner.vue`
  - badge / message / error の見え方を、強い要約表示に合わせて最小限調整する
- `composables/useTrainerSessionUi.ts`
  - 正解 / 不正解 / loading / ready の message と badge を、強いフィードバック前提の文言へ整える
- `tests/components/index-page.test.ts`
  - correct / incorrect / stage reaction / reduced-motion fallback の見た目フックを固定する
- `tests/components/result-banner.test.ts`
  - ResultBanner の必須 class と要約表示を固定する
- `tests/e2e/game-flow.spec.ts`
  - 主要導線を維持しつつ、正解 / 不正解 state の可視性が崩れていないことを最低限確認する
- `README.md`
  - 正誤フィードバック強化の挙動を必要最小限で追記する

### Reference

- `docs/superpowers/specs/2026-03-21-answer-feedback-impact-design.md`
- `docs/superpowers/specs/2026-03-21-ui-renewal-design.md`
- `pages/index.vue`
- `components/ResultBanner.vue`
- `composables/useTrainerSessionUi.ts`
- `tests/components/index-page.test.ts`
- `tests/e2e/game-flow.spec.ts`

### Notes

- scoring、miss count、game over 条件は変えない
- `ResultBanner` は二次情報だが必須の要約として扱い、choice-card より主役化しない
- CSS animation の秒数や easing 自体は unit test で厳密検証しない
- reduced motion でも色以外の `badge / label / class` 差を残す

## Task 1: 正誤 state の期待をテストで固定する

**Files:**
- Modify: `tests/components/index-page.test.ts`
- Modify: `tests/e2e/game-flow.spec.ts`
- Reference: `docs/superpowers/specs/2026-03-21-answer-feedback-impact-design.md`

- [ ] **Step 1: 正解時の choice-card / panel state を component テストへ追加する**

```ts
expect(correctChoice.classes()).toContain('choice-card--correct-impact');
expect(wrapper.get('.quiz-panel').classes()).toContain('quiz-panel--correct-impact');
```

- [ ] **Step 2: 不正解時の selected / correct / panel state を component テストへ追加する**

```ts
expect(selectedWrongChoice.classes()).toContain('choice-card--incorrect-impact');
expect(correctChoice.classes()).toContain('choice-card--correct-reveal');
expect(wrapper.get('.quiz-panel').classes()).toContain('quiz-panel--incorrect-impact');
```

- [ ] **Step 3: reduced motion fallback を component テストへ追加する**

```ts
expect(correctChoice.text()).toContain('CORRECT');
expect(selectedWrongChoice.text()).toContain('YOUR PICK');
```

- [ ] **Step 4: E2E に正誤 state の最低限の可視性確認を追加する**

```ts
await expect(page.locator('.choice-card--correct-impact')).toBeVisible();
await expect(page.locator('.quiz-panel--incorrect-impact')).toBeVisible();
```

- [ ] **Step 5: 追加テストだけを実行して赤を確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: FAIL

- [ ] **Step 6: E2E テストを部分実行して未実装を確認する**

Run: `npx playwright test tests/e2e/game-flow.spec.ts`
Expected: FAIL または新規 assertion 未満足

- [ ] **Step 7: ここまでをコミットする**

```bash
git add tests/components/index-page.test.ts tests/e2e/game-flow.spec.ts
git commit -m "test: lock in answer feedback impact"
```

## Task 2: choice-card と quiz-panel の正誤演出を実装する

**Files:**
- Modify: `assets/css/main.css`
- Modify: `pages/index.vue`
- Modify: `tests/components/index-page.test.ts`

- [ ] **Step 1: `pages/index.vue` で choice-card と quiz-panel の impact class を接続する**

対象:

- `choiceClass()` の返り値を impact 用 class へ拡張
- `quiz-panel` に `quiz-panel--correct-impact` / `quiz-panel--incorrect-impact` を付与
- `YOUR PICK` / `CORRECT` の表示差が維持されることを確認

- [ ] **Step 2: `assets/css/main.css` に correct impact の最小実装を書く**

対象:

- `choice-card--correct-impact`
- `quiz-panel--correct-impact`
- `@keyframes` for pop / glow

- [ ] **Step 3: `assets/css/main.css` に incorrect impact の最小実装を書く**

対象:

- `choice-card--incorrect-impact`
- `choice-card--correct-reveal`
- `quiz-panel--incorrect-impact`
- `@keyframes` for shake / reveal

- [ ] **Step 4: muted card と stage reaction のバランスを調整する**

対象:

- muted card を今より一段引く
- panel reaction は 1 回だけで終わるようにする

- [ ] **Step 5: reduced motion fallback を追加する**

対象:

- `@media (prefers-reduced-motion: reduce)`
- transform / shake を切る
- border / label / badge 差は残す

- [ ] **Step 6: component テストを実行して緑を確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add pages/index.vue assets/css/main.css tests/components/index-page.test.ts
git commit -m "feat: add impact states to answer cards"
```

## Task 3: ResultBanner の要約表現を強化する

**Files:**
- Modify: `components/ResultBanner.vue`
- Modify: `assets/css/main.css`
- Modify: `composables/useTrainerSessionUi.ts`
- Modify: `tests/components/result-banner.test.ts`

- [ ] **Step 1: ResultBanner の文言と impact class の期待をテストへ反映する**

```ts
expect(wrapper.text()).toContain('Correct');
expect(wrapper.classes()).toContain('result-banner--correct-impact');
```

- [ ] **Step 2: `useTrainerSessionUi.ts` の文言を最小調整する**

対象:

- `Correct / Miss / Loading / Ready` の message
- badge と message の責務は維持

- [ ] **Step 3: `ResultBanner.vue` を最小調整する**

対象:

- props は増やさない
- badge / message / error の並びと class を強い要約向けに保つ

- [ ] **Step 4: `assets/css/main.css` で banner の impact 表現を実装する**

対象:

- `result-banner--correct-impact`
- `result-banner--incorrect-impact`
- `result-banner--loading-impact` if needed

- [ ] **Step 5: ResultBanner のテストを再実行して緑を確認する**

Run: `npm run test:unit -- --run tests/components/result-banner.test.ts`
Expected: PASS

- [ ] **Step 6: ここまでをコミットする**

```bash
git add components/ResultBanner.vue composables/useTrainerSessionUi.ts assets/css/main.css tests/components/result-banner.test.ts
git commit -m "feat: strengthen result banner feedback"
```

## Task 4: 導線維持とドキュメント更新を仕上げる

**Files:**
- Modify: `tests/e2e/game-flow.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: E2E を新しい impact class に追随させる**

対象:

- 正解 / 不正解後でも `次の問題` 導線が維持される
- class assertion があれば最新名へ更新

- [ ] **Step 2: README に正誤フィードバック強化を追記する**

対象:

- 音がなくても正誤が見分けやすいこと
- correct / incorrect card state の強化

- [ ] **Step 3: 主要検証を実行する**

Run:

```bash
npm run lint
npm run test:unit
npm run test:e2e
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

Expected: PASS

- [ ] **Step 4: ここまでをコミットする**

```bash
git add tests/e2e/game-flow.spec.ts README.md
git commit -m "chore: finalize answer feedback impact"
```
