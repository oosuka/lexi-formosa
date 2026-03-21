# Top Screen Renewal Design

Date: 2026-03-21

## Goal

ゲームトップの開始体験を抜本的に作り直し、`Lobby / Session / Records` の分散した構造をやめる。

現状は開始導線に関わる情報が複数の枠へ分かれ、`学習を始める` `ゲームを始める` `このレベルから始める` のような近い意味の文言も併存している。そのため、何を見て何を押せばよいかが一目で伝わらない。

今回の変更では、トップ画面を `Premium Launch Pad` として再設計し、`レベルを選ぶ -> セッション条件を理解する -> 1つの CTA で始める` を 1 画面で明快にする。

## Desired Outcome

- トップ画面を見た瞬間に、主役が `レベル選択 + 1つの開始ボタン` だと分かる
- `Lobby / Session / Records` の分割を廃止し、開始導線を 1 枚の主役カードに集約する
- `始める` に関する言葉の重複を解消し、役割が異なる文言だけを残す
- 有料課金ゲーム級の上質感に寄せつつ、既存の PC 向け静かな世界観は維持する
- プレイ中の画面とは役割を分け、トップ画面だけ一段洗練された入口として感じられる

## Direction

採用方針は `Premium Launch Pad` とする。

- Hero はブランドと短い導入だけに絞る
- 主役は中央の `Launch Card`
- 記録表示は主役から降ろし、細い `Progress Strip` に要約する
- レベル選択は単なる情報一覧ではなく、ゲーム開始前のコントロールとして扱う

## Information Architecture

### 1. Hero

画面上部はブランド、短い説明、最小限の雰囲気づくりだけにする。

- 長い説明文は削る
- 現在の世界観を壊さない短い導入文だけを残す
- 視線をすぐ中央の `Launch Card` へ落とす

### 2. Launch Card

トップ画面の主役。

ここに以下を集約する。

- 現在選択中レベルの badge
- 開始画面固有の見出し
- 選択中レベルの短い説明
- 語数
- 音声状態
- 大きい `Start Session` ボタン

### 3. Level Selector

レベル選択は `Launch Card` の内部に統合する。

- 既存の別サイドパネルは廃止する
- `Level 1 / 2 / 3` の切替は、単なる縦一覧よりもコントロール感のある selector として見せる
- 選択中レベルが即座に主役カードへ反映される

### 4. Progress Strip

開始前の実績表示は細い補助エリアに格下げする。

- `Best Score`
- `Best Streak`

上記だけをレベル別に静かに表示する。今の `Session / Records` 見出し付きカード群は廃止する。

## Copy Strategy

今回の最重要ルールは、`始める` の意味を 1 つに絞ること。

### Remove

- `Lobby`
- `Session`
- `Records`
- `学習を始める`
- `このレベルから始める`

### Replace

- `ゲームを始める` -> `Start Session`

### Keep or Replace

- 画面タイトル: `Ready to Launch` を採用する
- 補助説明: 1 文だけ残す
- CTA: `Start Session` に固定する

### Allowed Labels

- `Ready to Launch`
- `Start Session`
- `Level`
- `Count`
- `Sound`
- `Best Score`
- `Best Streak`

### Forbidden Labels

- `Lobby`
- `Session`
- `Records`
- `学習を始める`
- `ゲームを始める`
- `このレベルから始める`

### Copy Roles

- タイトル: この画面の意味を示す
- 補助説明: プレイ前の不安を減らす
- CTA: 実際にセッションを始める唯一の動詞

## Visual Design

### Launch Card

- 今の plain card より密度を一段上げる
- 上部に level badge
- 中央に大きい見出し
- 下部に compact な info row
- 最下部に大きい主 CTA

### Level Selector

- カード一覧より、タブとカードの中間のような UI
- 押した感と選択状態を明快にする
- ただし派手すぎず、静かな高級感を保つ

### Progress Strip

- 大きい補助カード群ではなく、細い実績帯にする
- 情報量はあるが主張しない
- ゲーム本編の `Score / Streak / Miss` よりも静かなトーンで扱う

### Background and Atmosphere

- 既存の配色と雰囲気を踏襲する
- 開始画面だけ、淡い radial glow と層感を少し足す
- 高級感は「意図された余白と密度」で出し、装飾過多にはしない

## UX Rules

- 初見ユーザーは `レベルを選ぶ -> Start Session を押す` だけで理解できること
- 最高記録は見たい人だけが視線を落として確認できる位置に置く
- ロード失敗や音声非対応でも、開始導線自体は明快に保つ
- キーボード操作の `Enter` 開始導線は維持する
- 既存のゲーム本編への遷移条件は変えない

## Implementation Boundaries

Primary files:

- `pages/index.vue`
- `components/SessionStartPanel.vue`
- `assets/css/main.css`

Secondary files:

- `composables/useTrainerSessionUi.ts`
- `tests/components/index-page.test.ts`
- `tests/e2e/game-flow.spec.ts`
- `README.md`

### Component Strategy

- `SessionStartPanel.vue` は残すが、現行の Lobby 用レイアウトを流用せず、`Premium Launch Pad` 専用に実質作り直す
- `useTrainerSessionUi.ts` は開始可否、レベル別記録、音声状態などの UI データ供給は続けるが、旧 `Session / Records` 前提のコピーや見出し責務は持たせない
- `pages/index.vue` では、開始画面表示中に旧 `hero-stats-panel` と旧 `level-panel` の役割を主役カードへ寄せる

## Testing Strategy

- component
  - 開始画面で主役が `Launch Card` に寄っていること
  - `Lobby / Session / Records` の旧構造が消えていること
  - `Start Session` 導線が 1 つに整理されていること
  - レベル切替で主役カードの情報が更新されること
- e2e
  - 開始画面から `Start Session` でゲーム開始できること
  - レベル選択後も開始導線が崩れないこと
  - PC 幅でトップ画面が横崩れしないこと

## Out of Scope

- プレイ中画面の再設計
- スコア計算やゲームロジックの変更
- 新しいモードや設定画面の追加
- 音声機能自体の仕様変更

## Acceptance Criteria

- トップ画面で最も目立つ操作が `Start Session` 1 つだけになる
- `Ready to Launch` がトップ画面の主見出しとして表示される
- `Lobby / Session / Records` の旧見出しが消える
- `学習を始める` `ゲームを始める` `このレベルから始める` のような競合する開始文言が消える
- レベル選択、語数、音声状態が主役カード内で理解できる
- `Best Score / Best Streak` は残るが主役ではない
- 開始導線、キーボード操作、ロード失敗時の劣化動作は維持される

## Success Criteria

- トップ画面の意味が一目で分かる
- 有料アプリや有料ゲームの入口に近い上質感が出る
- 旧 UI の「情報が分かれていて意味不明」という印象がなくなる
- ゲーム本編へ入るまでの迷いが減る
