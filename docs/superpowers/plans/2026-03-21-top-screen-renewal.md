# Top Screen Renewal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ゲームトップを `Premium Launch Pad` へ作り替え、開始導線を `Start Session` 1つに整理したうえで、旧 `Lobby / Session / Records` 構造を廃止する。

**Architecture:** 既存の 1 ページ構成は維持しつつ、開始画面の主役を `SessionStartPanel.vue` に集約する。`pages/index.vue` は開始画面で旧 `hero-stats-panel` と `level-panel` を薄くし、`SessionStartPanel` へレベル選択、開始 CTA、語数、音声状態、記録要約を渡す。`assets/css/main.css` ではトップ画面だけ `Premium Launch Pad` の見た目に置き換え、プレイ中画面の見た目は壊さない。

**Tech Stack:** Nuxt 4, Vue 3, TypeScript, Vitest, Playwright, CSS

---

## File Structure

### Modify

- `pages/index.vue`
  - 開始画面での Hero / Launch Card / Progress Strip の配置を整理し、旧 `hero-stats-panel` / `level-panel` の役割を縮小または除去する
- `components/SessionStartPanel.vue`
  - `Premium Launch Pad` 専用レイアウトへ実質作り直し、`Start Session` と level selector を主役化する
- `assets/css/main.css`
  - トップ画面専用の大幅なスタイル刷新を実装し、旧 Lobby 系スタイルを置き換える
- `composables/useTrainerSessionUi.ts`
  - 開始画面用の見出し、補助説明、記録要約の供給を新しいコピー規則へ合わせる
- `tests/components/session-start-panel.test.ts`
  - `Premium Launch Pad` 専用の局所テストを追加し、見出し、CTA、level selector、progress strip を固定する
- `tests/components/index-page.test.ts`
  - 旧文言の消滅、`Start Session` の一意性、level selector 反映などを固定する
- `tests/e2e/game-flow.spec.ts`
  - 開始画面から `Start Session` で進行できること、レベル選択後も導線が崩れないことを固定する
- `README.md`
  - トップ画面の `Premium Launch Pad` と `Start Session` 導線を反映する

### Reference

- `docs/superpowers/specs/2026-03-21-top-screen-renewal-design.md`
- `components/SessionStartPanel.vue`
- `pages/index.vue`
- `assets/css/main.css`
- `tests/components/index-page.test.ts`
- `tests/e2e/game-flow.spec.ts`

### Notes

- プレイ中画面の構造や正誤フィードバックは今回の主対象ではない
- `Ready to Launch` と `Start Session` は固定ラベルとして扱う
- `Lobby / Session / Records`、`学習を始める`、`ゲームを始める`、`このレベルから始める` はトップ画面から除去する
- キーボードの `Enter` 開始導線は維持する

## Task 1: トップ画面の目標状態をテストで固定する

**Files:**
- Modify: `tests/components/index-page.test.ts`
- Modify: `tests/e2e/game-flow.spec.ts`
- Reference: `docs/superpowers/specs/2026-03-21-top-screen-renewal-design.md`

- [ ] **Step 1: component テストに新しい開始画面の期待を追加する**

```ts
expect(wrapper.text()).toContain('Ready to Launch');
expect(wrapper.text()).toContain('Start Session');
expect(wrapper.text()).not.toContain('Lobby');
expect(wrapper.text()).not.toContain('Records');
expect(wrapper.text()).not.toContain('ゲームを始める');
```

- [ ] **Step 2: レベル選択が主役カードへ反映される期待を追加する**

```ts
await wrapper.get('[data-level-selector=\"2\"]').trigger('click');
expect(wrapper.get('.session-start-panel').text()).toContain('Level 2');
```

- [ ] **Step 3: E2E に `Start Session` 導線と開始画面文言の期待を追加する**

```ts
await expect(page.getByRole('heading', { name: 'Ready to Launch' })).toBeVisible();
await expect(page.getByRole('button', { name: 'Start Session' })).toBeVisible();
await expect(page.getByText('Lobby')).toHaveCount(0);
```

- [ ] **Step 4: 追加テストだけを実行して RED を確認する**

Run: `npm run test:unit -- --run tests/components/index-page.test.ts`
Expected: FAIL

- [ ] **Step 5: E2E を部分実行して RED を確認する**

Run: `npx playwright test tests/e2e/game-flow.spec.ts`
Expected: FAIL または新規 assertion 未満足

- [ ] **Step 6: ここまでをコミットする**

```bash
git add tests/components/index-page.test.ts tests/e2e/game-flow.spec.ts
git commit -m "test: lock in premium launch pad top screen"
```

## Task 2: SessionStartPanel を Premium Launch Pad に置き換える

**Files:**
- Modify: `components/SessionStartPanel.vue`
- Modify: `composables/useTrainerSessionUi.ts`
- Create: `tests/components/session-start-panel.test.ts`
- Modify: `tests/components/index-page.test.ts`

- [ ] **Step 1: `SessionStartPanel.vue` 専用の failing test を追加する**

```ts
expect(wrapper.text()).toContain('Ready to Launch');
expect(wrapper.text()).toContain('Start Session');
expect(wrapper.text()).toContain('Best Score');
expect(wrapper.text()).not.toContain('Records');
```

- [ ] **Step 2: テストを実行して RED を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts`
Expected: FAIL

- [ ] **Step 3: `SessionStartPanel.vue` の props 責務を整理する**

対象:

- `Ready to Launch` 用の見出し
- `Start Session` CTA
- level selector
- count / sound / level summary
- progress strip 用の `Best Score / Best Streak`

- [ ] **Step 4: `SessionStartPanel.vue` を新レイアウトへ最小実装する**

対象:

- 主役カードの骨格
- level selector のマークアップ
- progress strip の骨格
- 旧 `Session / Records` 補助カードの撤去

- [ ] **Step 5: `useTrainerSessionUi.ts` の開始画面責務を新ルールへ揃える**

対象:

- `Ready to Launch`
- `Start Session`
- 補助説明 1 文
- 旧開始文言の除去
- `sessionPanelKicker` / `sessionPanelTitle` のような旧 `Session / Records` 前提責務の削除または非依存化

- [ ] **Step 6: component テストを実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts`
Expected: PASS

- [ ] **Step 7: ここまでをコミットする**

```bash
git add components/SessionStartPanel.vue composables/useTrainerSessionUi.ts tests/components/session-start-panel.test.ts tests/components/index-page.test.ts
git commit -m "feat: rebuild top screen launch card"
```

## Task 3: index.vue と CSS でトップ画面全体を再構成する

**Files:**
- Modify: `pages/index.vue`
- Modify: `assets/css/main.css`

- [ ] **Step 1: `pages/index.vue` で開始画面時の役割分担を整理する**

対象:

- 旧 `hero-stats-panel` の記録主役化をやめる
- 旧 `level-panel` を開始画面では縮小または非表示へ寄せる
- `SessionStartPanel` に必要情報を集中させる

- [ ] **Step 2: `assets/css/main.css` で Hero / Launch Card / Progress Strip の新スタイルを書く**

対象:

- `Premium Launch Pad` の card 表現
- level selector の選択状態
- progress strip の静かな実績帯
- 開始画面の背景強化

- [ ] **Step 3: 旧 Lobby 系スタイルを整理する**

対象:

- `Lobby / Session / Records` 前提のスタイル撤去
- 旧開始画面の視線分散要因を削る

- [ ] **Step 4: component テストを再実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/components/session-start-panel.test.ts tests/components/index-page.test.ts`
Expected: PASS

- [ ] **Step 5: ここまでをコミットする**

```bash
git add pages/index.vue assets/css/main.css
git commit -m "feat: restyle top screen as premium launch pad"
```

## Task 4: 導線維持、ドキュメント更新、総合検証

**Files:**
- Modify: `tests/e2e/game-flow.spec.ts`
- Modify: `README.md`

- [ ] **Step 1: E2E を新しい開始導線に追随させる**

対象:

- `Ready to Launch`
- `Start Session`
- レベル選択後も開始できること
- 旧文言が消えていること

- [ ] **Step 2: README にトップ画面刷新を追記する**

対象:

- `Premium Launch Pad`
- `Start Session`
- `Best Score / Best Streak` の progress strip

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
git commit -m "chore: finalize top screen renewal"
```
