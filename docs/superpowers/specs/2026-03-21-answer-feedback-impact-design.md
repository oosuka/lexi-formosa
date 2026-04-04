# Answer Feedback Impact Design

Date: 2026-03-21

> Status: この設計の内容は実装済みです。現行仕様の一次情報ではなく、回答フィードバック強化時の設計メモの履歴として扱ってください。

## Goal

`LexiFormosa` の回答後フィードバックを、音声や効果音がなくても一瞬で正誤が分かる状態へ強化する。

現状は `Correct / Miss` の情報が主に文言と控えめな色差に依存しており、プレイ中に見落としやすい。今回の変更では、`choice-card`、`result banner`、`quiz-panel` の 3 層で反応させ、学習ゲームとして十分に明快な正誤フィードバックを作る。

## Desired Outcome

- 音を消していても `正解 / 不正解 / 自分が押したカード / 正解のカード` がすぐ分かる
- 現在の静かな PC 向け UI を壊さず、回答直後だけ強く反応する
- 演出はやや派手でもよいが、テンポは壊さない
- `prefers-reduced-motion` では動きを抑えても情報差は残す

## Direction

採用方針は `Focused Impact` とする。

- 通常時は落ち着いた学習 UI
- 回答直後だけ強い視覚反応
- 主役は `choice-card`
- `ResultBanner` は二次情報だが、正誤要約として必須表示
- 全体把握用に `quiz-panel` に短い stage reaction

## Feedback Layers

### 1. Choice Layer

回答直後の主役。

- 正解カード
  - 軽い pop
  - 緑の glow
  - `CORRECT` ラベルの視認性強化
  - 必要なら check icon を追加
- 不正解で押したカード
  - 短い shake
  - 赤系の沈み込み
  - `YOUR PICK` を明確に残す
  - 必要なら cross icon を追加
- その他のカード
  - muted 状態を今より一段引く

不正解時は、押したカードの反応のあとに正解カードが少し遅れて立つようにする。

### 2. Feedback Layer

`ResultBanner` は choice-card より強くしない。ただし、回答結果の要約として常に視認しやすく保つ。

- `Correct / Miss` badge を今より強くする
- 色差を拡大する
- 軽い立ち上がり演出を入れる
- ただし card の反応より主張しすぎない

### 3. Stage Layer

`quiz-panel` 全体にも短い反応を入れる。

- 正解時: 緑系の短い flash
- 不正解時: 赤系の短い flash
- 1 回だけ反応し、常時装飾にはしない

## Motion Rules

### Correct

- card pop: 約 120ms
- glow peak: 約 220ms
- settle: 約 500ms

### Incorrect

- shake: 約 260ms
- selected miss state は即時表示
- correct card reveal は 80-120ms 遅延

### Shared

- `quiz-panel` の反応は 400-600ms で消える
- `result banner` の立ち上がりは短く、小さく
- 長いアニメーションは避ける

## Reduced Motion

`prefers-reduced-motion` では以下を維持し、揺れや拡大は切る。

- 色差
- 枠線
- badge
- icon
- `CORRECT / YOUR PICK` のラベル差
- `quiz-panel` の状態色

## Implementation Boundaries

Primary files:

- `assets/css/main.css`
- `pages/index.vue`
- `components/ResultBanner.vue`
- `composables/useTrainerSessionUi.ts`

Secondary files:

- `tests/components/index-page.test.ts`
- `tests/components/result-banner.test.ts`
- `tests/e2e/game-flow.spec.ts` if visible-state assertions need updates

今回はゲームロジックや scoring を変更しない。状態の増設も最小限に留め、既存の `feedbackTone` と `choiceClass` をベースに演出を強化する。

`useTrainerSessionUi.ts` は次の責務だけを持つ。

- `Correct / Miss / Loading / Ready` の表示文言生成
- `ResultBanner` に渡す tone, badge, message, uiError の生成
- reduced motion 判定や CSS animation の詳細は持たない

`pages/index.vue` は次を担当する。

- `feedbackTone` と回答状態に応じた class 付与
- `quiz-panel` と `choice-card` の状態クラス接続
- `ResultBanner` と action row の配置

`ResultBanner.vue` は次を担当する。

- 受け取った `tone / badge / message / uiError` を表示
- banner 自体の強調表現
- 正解/不正解の主役にはならず、要約として振る舞う

## Testing Strategy

- component
  - 正解時に correct card が主結果として見える
  - 不正解時に selected miss card と correct card が明確に区別される
  - `feedback-row` と `result-banner` が強い状態差を持つ
- reduced motion
  - class や label 差だけで情報が残る
- e2e
  - 回答 -> 次の問題 の導線維持
  - 正解 / 不正解 state の表示崩れがない

モーションそのものの秒数や easing は unit test では直接検証しない。CSS animation に閉じる。
代わりに次を検証する。

- 正解時に `correct` 系 class / label が即時付与される
- 不正解時に `incorrect` 系 class と `correct` 系 class が同一画面で識別できる
- `quiz-panel` に正誤対応の stage class が付く
- reduced motion 時にも色以外の badge / label 差が残る
- `次の問題` の出現条件と進行タイミングは現状維持

## Out of Scope

- 新しい scoring 演出
- パーティクルなどの大掛かりなアニメーション
- 新しいゲームモード
- 効果音の変更

## Acceptance Criteria

- 回答後 1 フレーム目で、selected card と correct card を class または label で同時に識別できる
- 不正解時に `YOUR PICK` と `CORRECT` が同時に見える
- `quiz-panel` に `correct` または `incorrect` の stage class が付き、短い全体反応を持つ
- `ResultBanner` は表示されるが、choice-card より主役化しない
- reduced motion でも、正解カードと誤選択カードを色以外の badge / label で区別できる
- `次の問題` ボタンの有効化条件と表示タイミングは現状維持
- scoring、miss count、game over 条件は変わらない

## Success Criteria

- 音なしでも正誤がすぐ分かる
- 不正解時に `自分の選択` と `正解` を見失わない
- 既存の PC 向け上質感は保つ
- 次の問題へのテンポを落とさない
