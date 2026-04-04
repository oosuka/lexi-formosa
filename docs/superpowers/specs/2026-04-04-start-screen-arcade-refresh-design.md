# Start Screen Arcade Refresh Design

Date: 2026-04-04

> Status: 現行トップ画面の再設計用仕様。`docs/superpowers/specs/2026-03-21-top-screen-renewal-design.md` の `Premium Launch Pad` 方針は採用せず、今回の合意内容で上書きする。

## Goal

スタート画面の開始体験を、説明中心の UI から「すぐ遊びたくなる」ゲーム中心の UI へ作り直す。

現状は `Taiwan Traditional Chinese Trainer`、`Records`、`Level`、`Lobby` がそれぞれ別方向を向いており、特に `Lobby` が開始導線の主役として弱い。今回の変更では、開始前に読む文字量を減らしつつ、`ゲームを始める` を一番強く見せる。

## Desired Outcome

- 画面を開いた瞬間に、主役が `ゲームを始める` だと分かる
- `Lobby` は説明枠ではなく、開始ステージとして機能する
- `Taiwan Traditional Chinese Trainer` と `Records` は情報を保ちつつ縦幅を詰める
- `Level` は必要な選択と最小限のルールだけを示す
- 画面全体の空気感は `アーケード寄り` に寄せるが、既存の配色とローカルゲームの世界観は壊さない

## Confirmed Decisions

今回のユーザー合意事項は以下。

- 方向性は `アーケード寄り`
- 開始画面レイアウトは比較案 `B. 大型ステージ型` をベースにする
- `Lobby` の主役は大きい `ゲームを始める`
- `Records` は全レベルの記録表示を維持する
- タイトル下の説明文は 1 文だけにする
- `Lobby` 内の補足は `選択レベル + 語数` までに絞る

## Information Architecture

### 1. Top Row

上段は `Taiwan Traditional Chinese Trainer` と `Records` の 2 枠だけにする。

- 左: ブランド枠
- 右: 記録枠

どちらも現状より縦幅を縮め、余白を詰める。ただし窮屈にはせず、情報の読みやすさは維持する。

### 2. Lower Row

下段は `Level` と大型 `Lobby` で構成する。

- `Level` は選択 UI と最小限のルール確認を担う補助枠
- `Lobby` は開始導線の主役枠

視線は `Top Row` から下段右側の `Lobby` へ自然に落ちる構成にする。

## Panel Design

### Taiwan Traditional Chinese Trainer

役割はブランド紹介とゲームの入口提示のみ。

- タイトルサイズは現状維持
- 説明文は 1 文だけにする
- 現在の 2 行説明は廃止する
- `落ち着いたテンポ` のような不自然な表現は使わない
- 説明文は次の文言を採用する

`台湾で使われる繁体字の意味を、日本語4択でテンポよく見抜いていく単語ゲーム。`

ブランド枠のメタ情報は残してよいが、説明文より目立たせない。

### Records

役割は「開始前に実績を確認できること」の維持。

- 情報量は現状維持
- `Level 1 / Level 2 / Level 3` をすべて表示する
- 各レベルの `Best Score / Best Streak` を維持する
- 選択中レベルだけに寄せた要約表示へは変えない
- 高さは `Taiwan Traditional Chinese Trainer` の圧縮後の高さ帯に合わせる

### Level

役割はレベル選択と必要最小限のルール確認。

- レベルボタンの情報量は大きく増やさない
- 各レベルの短い説明は既存の `1-2文字中心` などを活かす
- ルール一覧から `すべて繁体字の単語` は削除する
- ルール一覧には次だけを残す

- `4択のうち正解は1つ`
- `3回続けて間違えると終了`
- `3連続正解からボーナス加点`

### Lobby

ここが今回の主役。

- 旧 `Session` / `Records` の小枠は廃止する
- 大きい見出しや長い説明段落は置かない
- 補足情報は `選択レベル` と `語数` のみ
- CTA は `ゲームを始める` を唯一の主役動詞として見せる

`Lobby` では「読む」より「押したくなる」を優先する。視覚的には大きいボタン、短い一言、勢いのある面構成で作る。

## Copy Rules

### Keep

- `ゲームを始める`
- `Records`
- `Level`
- `Best Score`
- `Best Streak`

### Remove

- `このレベルから始める`
- `同じレベルでもう一度始める`
- `Session`
- `Lobby` を説明見出しとして強調する使い方
- `すべて繁体字の単語`

### Tone

- 文量は短くする
- 説明調よりもゲーム開始前の高揚感を優先する
- 不自然に気取った表現や、日常日本語で使わない表現は避ける

## Visual Direction

- ベース配色は既存の暖色 + ティール系を踏襲する
- `Lobby` だけは他の枠より一段強い視覚密度を持たせる
- `Records` は情報量を維持しつつ、カードの密度を上げて高さを縮める
- `Taiwan Traditional Chinese Trainer` と `Records` は上段の帯として揃えて見せる
- `Level` は主役化せず、主役 `Lobby` の脇役として抑える

## Implementation Boundaries

Primary files:

- `app/pages/index.vue`
- `app/components/SessionStartPanel.vue`
- `app/assets/css/main.css`

Secondary files:

- `app/composables/useTrainerSessionUi.ts`
- `tests/components/session-start-panel.test.ts`
- `tests/components/index-page.test.ts`
- `tests/e2e/game-flow.spec.ts`
- `README.md`

## Component Strategy

- `SessionStartPanel.vue` は実質的に再設計する
- 開始前の補助情報は `選択レベル + 語数 + CTA` を中心に再構成する
- `useTrainerSessionUi.ts` の開始画面向けコピー責務は、今回の新方針に合わせて整理する
- `index.vue` では上段 2 枠と下段 2 枠の情報階層を明確にし、開始画面だけ別の視線誘導を持たせる

## Testing Strategy

component:

- 開始画面で `ゲームを始める` が最も強い主要導線になっていること
- `Records` が全レベル分の `Best Score / Best Streak` を表示すること
- `Taiwan Traditional Chinese Trainer` の説明が 1 文に整理されていること
- `Level` のルール一覧から `すべて繁体字の単語` が消えていること
- `このレベルから始める` などの冗長な開始文言が消えていること

e2e:

- 開始画面から `ゲームを始める` でセッション開始できること
- レベル切替後も開始導線が崩れないこと
- 開始画面で旧 `Session` 補助枠に依存しないこと

## Out of Scope

- プレイ中画面の全面改修
- スコア計算やゲームルールの変更
- 音声機能自体の仕様変更
- 語彙データや辞書生成ロジックの変更

## Acceptance Criteria

- 上段に `Taiwan Traditional Chinese Trainer` と `Records` が並び、どちらも現状より縦幅が縮んでいる
- `Records` は全レベルの記録を維持している
- `Level` から `すべて繁体字の単語` が消えている
- `Lobby` から旧 `Session / Records` の小枠が消えている
- `Lobby` では `ゲームを始める` が最も強い視覚要素になっている
- 開始前の補足情報は `選択レベル + 語数` に絞られている
- ブランド説明文は 1 文で自然な日本語になっている

## Success Criteria

- 開始画面が「読む画面」ではなく「挑戦を始める画面」に見える
- ユーザーが `何を押せばよいか分からない` と感じない
- `Lobby` に対する説明過多と冗長な開始文言が解消される
- 既存の情報価値を落とさず、開始時のワクワク感だけを強められる
