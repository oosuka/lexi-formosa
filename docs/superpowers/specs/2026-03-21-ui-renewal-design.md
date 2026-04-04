# UI Renewal Design

Date: 2026-03-21

> Status: この設計は初期 UI 改修の履歴です。多くの方向性は現在の UI に引き継がれていますが、その後の開始画面再設計と `app/` 構成への移行により現行実装とは一致しない箇所があります。現行仕様の一次情報としては扱わないでください。

## Goal

`LexiFormosa` の見た目と体験を、PC 向けの上質な学習プロダクトへ抜本的に更新する。
主軸は `Focused Learning Desk` とし、1問への集中を最優先しつつ、プレイ中の `Score / Streak / Miss` を常時見える位置へ移し、正解 / 不正解の視認性を大きく改善する。

あわせて、体験に直結する UI 文言と、頻出または違和感の強い日本語訳を重点修正する。

## Product Direction

### Core Direction

- PC ファースト
- 1問に集中できる中央主導レイアウト
- 静かで上質な学習体験
- 台湾らしさは控えめなアクセントとして使う
- 派手すぎないが、正誤フィードバックは明快にする

### Visual Positioning

- ベースは `A: Calm Editorial`
- 情報整理は `B: Premium Study App` の明快さを借りる
- 台湾らしさは `C: Taipei Pop Utility` の要素を小さく引用する

## External References

Current references used to shape the direction:

- Quizlet: https://quizlet.com/
  - 参考点: 学習導線の明快さ、進行情報の見やすさ
- Memrise: https://www.memrise.com/
  - 参考点: 学習サービスとしての親しみやすさ、実用学習の雰囲気
- Mochi: https://mochi.cards/
  - 参考点: 静かで上質な学習 UI、整然とした情報構造

This design does **not** aim to imitate these services directly. The intent is to combine:

- Mochi の静かな上質感
- Quizlet の分かりやすい学習導線
- LexiFormosa 固有の台湾華語学習テーマ

## Information Architecture

### 1. Start / Lobby

開始前は「学習デスクに着く」印象へ整理する。

- 主役: 開始カード
- 補助: Level 選択
- 補助: 各 Level の最高記録

現在のように情報が横並びで競合する状態をやめ、視線が `開始 -> レベル -> 記録` の順に流れる構成へ変える。

### 2. Playing

プレイ中は中央集中レイアウトへ切り替える。

- 上部に細い `top rail` を固定
  - `Score`
  - `Streak`
  - `Miss`
  - 必要最小限の補助情報
- 中央に大きい問題カード
- その直下に 4 択

レベル説明、過去記録、開始前向け情報はプレイ中には出さない。

### 3. Answered

回答後は「何が起きたか」を一瞬で理解できる状態にする。

- 正解カード: 強いハイライト
- 自分が選んだ不正解カード: 正解カードと明確に異なるハイライト
- 下部またはカード直下に結果帯
  - `Correct / Miss`
  - 得点加算
  - 残りミス

### 4. Game Over

終了画面は結果サマリーとして見せる。

- `今回の Score`
- `Best Streak`
- `このレベルの最高記録`
- `もう一度始める`
- `トップへ戻る`

情報は整理して見せるが、過度に賑やかなリザルト画面にはしない。

## Visual System

### Color

- 背景: 白ではなく、少し温度のある生成り系
- 主アクセント: 青緑 / 玉石系の落ち着いた色
- 補助アクセント: 控えめな暖色
- Correct: 澄んだ緑
- Miss: 濁りの少ない朱色

台湾らしさはネオン的な派手さではなく、公共空間の色、紙、タイル、街の落ち着いた空気を抽象化して使う。

### Typography

- 繁体字の単語を最も強く見せる
- 読み補助は控えめ
- 本文と補助文は静かに
- 見出しと本文の差を今より大きくする

視線誘導は `単語 -> 選択肢 -> フィードバック` を基本とする。

### Surface / Card

- ふわっとしたガラス感より、紙面に近い整った質感
- 問題カードは一段大きく、主役として扱う
- 選択肢カードは整列感と押しやすさを両立する

### Motion

- 問題切替: 短いフェード / スライド
- 選択時: 軽い押下感
- 回答後: 結果帯の出現
- 正解 / 不正解: 意味のある短い強調だけ

派手な演出は避ける。

## UI Copy Direction

### Goals

- 学習サービスとして自然な日本語に揃える
- 長すぎる説明文を減らす
- プレイ中の文言は短く明快にする

### Scope

- 見出し
- 補助コピー
- 結果メッセージ
- ゲームオーバー時の説明
- 開始前の案内文

英語ラベルは維持する。ただし、周辺の日本語文が不自然にならないよう調整する。

## Vocabulary Copy Cleanup

### Scope

今回は全面監査ではなく、体験への影響が大きいものを重点修正する。

- 頻出単語
- プレイ中に違和感が強い訳
- 日本語として不自然な 4 択
- 学習上誤解を生みやすい訳

### Preferred Fix Path

原則として `data/manual-vocabulary.json` を優先し、生成物の直接修正は避ける。

## Component / Implementation Boundaries

Expected UI units for the renewal:

- `Top Rail`
  - `Score / Streak / Miss`
- `Question Stage`
  - 単語
  - 読み
  - 音声
- `Choice Grid`
  - 4択
  - 正誤状態
- `Result Banner`
  - Correct / Miss
  - 点数加算
  - 残りミス
- `Lobby`
  - Start
  - Level
  - Records
- `Game Over Summary`
  - 今回の記録
  - CTA

`pages/index.vue` はページ構成と接続に寄せ、見た目の再構成は component 側で受ける。

## Error Handling / Behavioral Constraints

- ゲームルールは変えない
- 音声 / 効果音の劣化挙動は維持する
- `metadata.json` 失敗でゲーム本体を止めない
- 現在の開始 / 回答 / 次へ / ゲームオーバー / restart / reset 導線は維持する
- UI 更新によって既存の状態遷移を壊さない

## Testing Strategy

- component:
  - start / playing / answered / game over の表示確認
  - 正誤の視覚状態に対応した class / 文言確認
- e2e:
  - 主要ゲームフロー維持
  - PC 幅でのプレイ中レイアウト確認
  - `Score / Streak / Miss` がプレイ中に見えること
- data:
  - 重点修正した訳語の確認

## Out of Scope

- 新しいゲームモード追加
- スコア計算式変更
- 苦手語復習などの新機能
- 全語彙の全面翻訳監査

## Success Criteria

- PC で見たときに、現在より明確に「問題へ集中しやすい」
- プレイ中に `Score / Streak / Miss` が常時分かる
- 正解 / 不正解が現状より見落としにくい
- 開始前 / 回答後 / 終了時の情報階層が整理されている
- UI 文言の不自然さが減っている
- 目立つ不自然訳が減っている
