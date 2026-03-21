# Answer Feedback Impact Design

Date: 2026-03-21

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
- 補助として `result banner`
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

`ResultBanner` は補助ではなく、回答結果の明確な要約として扱う。

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

Secondary files:

- `tests/components/index-page.test.ts`
- `tests/components/result-banner.test.ts`
- `tests/e2e/game-flow.spec.ts` if visible-state assertions need updates

今回はゲームロジックや scoring を変更しない。状態の増設も最小限に留め、既存の `feedbackTone` と `choiceClass` をベースに演出を強化する。

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

## Out of Scope

- 新しい scoring 演出
- パーティクルなどの大掛かりなアニメーション
- 新しいゲームモード
- 効果音の変更

## Success Criteria

- 音なしでも正誤が一瞬で分かる
- 不正解時に `自分の選択` と `正解` を見失わない
- 既存の PC 向け上質感は保つ
- 次の問題へのテンポを落とさない
