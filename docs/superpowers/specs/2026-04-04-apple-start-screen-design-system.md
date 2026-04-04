# Apple-Informed Top And Play Screen Design System

Date: 2026-04-04

> Status: トップ画面の視覚ルールと開始導線を Apple HIG 参照で再定義する仕様。`docs/superpowers/specs/2026-04-04-start-screen-arcade-refresh-design.md` の `アーケード寄り` 方針は採用せず、本仕様を優先する。

## Goal

トップ画面を「ゲームらしい勢いのある入口」ではなく、「静かで上質な学習アプリの入口」として再設計する。

現状は上部 2 枠に比べて下部の `Level` と `Arcade Lobby` が別々に成立しており、情報階層、余白、文言トーンが揃っていない。今回の変更では、Apple HIG の `Hierarchy` `Harmony` `Consistency` を参照しつつ、下部を 1 つの開始モジュールへ再統合する。

## Desired Outcome

- 上部 2 枠と下部モジュールが同じ視覚文法で統一される
- 下部が `選択 UI` と `開始 UI` の寄せ集めではなく、1 つの開始体験に見える
- ゲーム感は抑え、学習アプリとしての静けさと信頼感を優先する
- `Best Score / Best Streak` の英語トーンは維持しつつ、他の実用文言との整合が取れる
- 余白、角丸、影、選択状態、CTA の強弱が一貫する
- プレイ中画面もトップ画面と同じ Apple 寄りの文法へ揃える
- プレイ中は不要な上部枠を消し、問題カードを唯一の主役にする

## Confirmed Decisions

今回のユーザー合意事項は以下。

- 方向性は `学習アプリ寄り`
- 最優先は `上品で整った見た目の完成度`
- 下部レイアウトは `B案` を採用する
- 左上の小見出し `Taiwan Traditional Chinese Trainer` は維持する
- `Best Score / Best Streak` は英語のまま維持する
- 下部のモジュール小見出しは `PLAY` を採用する
- `LEVELS` `START` `自分に合った難度を選ぶ` は使わない
- 下部の `出題を始める` `準備OK。` のような説明的な開始見出しは使わない
- 右カラムの `words` 表示は削除し、語数は左レベルカード側だけに残す
- 右下の補助情報は `無題の補助メモ` として 4 項目を置く
- 上部 2 枠の構造は維持し、右上は `RECORDS` と 3 枚の record card だけで構成する
- `レベルごとの最高記録` は削除する
- プレイ中は `Taiwan Traditional Chinese Trainer` 枠と `Session` 枠を表示しない
- プレイ中の `Score / Streak / Miss` は独立帯ではなく、問題カード上部の細い情報列へ統合する
- プレイ中の情報ラベルは `Score / Streak / Miss` の Title Case で統一する
- ゲームオーバー画面では `Game Over` を主役にし、`今回の結果` のような汎用見出しは置かない
- ゲームオーバー時は通常の不正解音と別に、下降する専用終了音を使う
- `Best Score` または `Best Streak` を更新したゲームオーバーでは、専用の祝福演出と専用音を追加する
- `Score` と `Streak` の両方を更新した場合は、単独更新より強い祝福演出を使う
- 通常状態の UI はトップ画面、プレイ中画面、ゲームオーバー画面で同じ design token と component rule にそろえる
- `正解 / 不正解 / Game Over` のフィードバックだけは、通常状態より少し強い色と影を許容する

## Information Architecture

### 1. Top Row

上段は現行どおり 2 枠構成とする。

- 左: ブランド枠
- 右: 記録枠

ただし、小見出し、角丸、影、内側余白、色の使い方は下部モジュールと統一する。

右上 `RECORDS` 枠では、説明見出しを置かず、3 枚の record card 自体を主役にする。

### 2. Play Module

下段は `2 つのカード` ではなく、`1 つの開始モジュール` として扱う。

- モジュール小見出し: `PLAY`

左はレベル選択だけを担当し、右は選択中レベルの確認と開始だけを担当する。

### 3. Left Column: Levels

左カラムは補助パネルではなく、開始モジュール内の選択ナビゲーション。

- 3 つのレベルカードを縦並び
- 各カードは `Level 名 / 語数 / 1 行説明`
- 各カードは今より縦に大きくし、全体のバランスを取る
- 旧 `ルール` ブロックは削除する

### 4. Right Column: Start

右カラムは開始判断に必要な情報だけを持つ。

- 大見出しは選択中レベルそのもの
- 日本語の短い説明文
- 主要 CTA `ゲームを始める`
- 無題の補助メモ 4 項目

旧 `Arcade Lobby` と `準備OK。` は廃止する。右カラム全体は中央寄せではなく上寄せで使う。

## Copy System

### Keep

- `Taiwan Traditional Chinese Trainer`
- `RECORDS`
- `Best Score`
- `Best Streak`
- `ゲームを始める`

### Add

- `PLAY`

### Remove

- `Arcade Lobby`
- `準備OK。`
- `出題を始める`
- `LEVELS`
- `START`
- `自分に合った難度を選ぶ`

### Start Copy

右カラムで使う文言は次を基準にする。

- Title
  - `Level 1`
  - `Level 2`
  - `Level 3`
- Description
  - Level 1: `1–2文字中心。生活や旅行でよく使う単語。`
  - Level 2: `3–4文字中心。日常表現や施設名がメイン。`
  - Level 3: `5–6文字中心。少し長めの複合語に挑戦。`
- Supporting memo
  - `4択から1つ選ぶ`
  - `正解で10点`
  - `3連続正解からボーナス`
  - `3回連続ミスで終了`

### Tone

- 実用文言は日本語中心
- 小見出しとメタ情報は英語を許容
- 雰囲気ワードで盛らず、選択に必要な情報だけを見せる

## Visual Design Rules

### 1. Color System

暖色寄りの淡いニュートラル背景と、青緑アクセント 1 色で構成する。

- 背景は真っ白ではなく柔らかいニュートラル
- 大面積の面は半透明白に近い `surface`
- 選択状態と primary CTA だけアクセント色を使う
- カードごとの色キャラクターは作りすぎない
- 通常状態の card / panel / button はトップ画面とプレイ中画面で同じ surface と border を使う
- `correct / incorrect / game over` の状態色だけは例外として強めに使う

Design tokens:

```css
:root {
  --bg-canvas: #f6f3ee;
  --bg-subtle: #fbfaf7;
  --surface: rgba(255, 255, 255, 0.78);
  --surface-strong: rgba(255, 255, 255, 0.92);
  --line-soft: rgba(32, 32, 32, 0.08);
  --line-mid: rgba(32, 32, 32, 0.14);

  --text-primary: #1f1f1f;
  --text-secondary: #5c5c5c;
  --text-tertiary: #7a7a7a;

  --accent: #117a72;
  --accent-strong: #0d655f;
  --accent-soft: rgba(17, 122, 114, 0.10);

  --success: #1d8f68;
  --error: #c84d4d;
}
```

### 2. Typography

- 実用テキストは `system-ui, -apple-system, BlinkMacSystemFont, sans-serif`
- 小見出しは全枠で共通ルールにする
- 数字は tabular figure を使う
- ロゴ `LexiFormosa` の個性は維持する

小見出し共通ルール:

```css
.section-kicker {
  font-size: 12px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
```

Type scale:

```css
:root {
  --font-kicker: 12px;
  --font-title-hero: clamp(56px, 6vw, 80px);
  --font-title-section: clamp(28px, 3.2vw, 36px);
  --font-title-card: 24px;
  --font-body: 17px;
  --font-caption: 13px;
}
```

### 3. Spacing

8pt グリッドを採用する。

- 外側余白: 32px
- 主要カード内余白: 24px
- 要素間: 16px
- セクション間: 32px 以上
- 近接した補助情報: 12px

下部は左の情報密度を少し下げ、右の空白を減らして、中密度でそろえる。

追加ルール:

- 左の各レベルカードは最小高さ `110px` 前後
- 左カードの内側余白は `24px`
- 右上の見出し群と右下の補助メモの間は `28px` 前後
- 右下補助メモは上罫線 + 上余白 `20px` で区切る
- 右下補助メモの項目間は `10px` 前後
- `surface-card / question-stage / game-over-panel` の基本 padding は同一トークンで管理する
- `record-card / level-card / choice-card / game-over-stat / lookup-panel` の card padding は同一トークンで管理する

### 4. Corner Radius

- 外側大型カード: 32px
- 通常カード: 24px
- 内部カード: 18px
- ボタンとチップ: pill

親より子の角丸を少しだけ小さくし、全体の調和を保つ。

### 5. Shadow

影は薄く、常時は 1 段だけにする。

```css
:root {
  --shadow-rest:
    0 1px 2px rgba(0, 0, 0, 0.04),
    0 10px 30px rgba(0, 0, 0, 0.05);

  --shadow-raised:
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 16px 40px rgba(0, 0, 0, 0.08);
}
```

- 通常状態は `--shadow-rest`
- 選択中レベルカードと hover のみ `--shadow-raised`
- 情報の区切りは影よりも境界線と面差で作る
- 通常状態の panel / card / button shadow はトップ画面とプレイ中画面で同じ強さにそろえる
- 正誤フィードバック時だけ個別の shadow を許容する

## In-Game Layout

### 1. Overall Structure

プレイ中は開始画面と構造を切り替える。

- `hero-panel` は表示しない
- 画面の主役は `quiz-panel` 1 枚だけ
- `quiz-panel` を中央寄せし、横に広がりすぎないようにする
- `level-panel` と `hint-block` はプレイ中に出さない

### 2. Top Info Row

`Score / Streak / Miss` は独立した大きい帯ではなく、問題カード上部へ統合する。

- 左: `Level 2` のような現在レベル
- 右: `Score / Streak / Miss`
- ラベルは Title Case
- 数字を主役にし、ラベルは一段静かに見せる
- `Level n`、補助ラベル、数値、主要 CTA のサイズ体系は開始画面と共通トークンで管理する

### 3. Question Card

- 繁体字の単語を最大の主役にする
- 読み表示はその下に静かに配置する
- 情報列の下余白は `20px` 前後
- 繁体字と読みの間は `12px`
- 読みと選択肢グリッドの間は `24px`

### 4. Choice Grid and Feedback

- 4択カードはトップ画面と同じ角丸、境界、影の文法を使う
- 正解 / 不正解の色は使いすぎず、背景差は薄く保つ
- `次の問題` を唯一の primary button にする
- `トップへ戻る` は secondary に保つ

### 5. Copy Tone

- 開始画面の一覧ラベルは `Best Score / Best Streak`
- プレイ中のリアルタイム指標は `Score / Streak / Miss`
- プレイ中の不要な見出し `Question` `Summary` は可能な限り消す

### 6. Game Over

- `Game Over` を終了画面の最大見出しにする
- 新記録やタイ記録は小さな補助見出しで添える
- 新記録がない場合は `今回の結果` のような汎用見出しを置かない
- 今回の成績ブロックには `This Session`、レベル内自己ベストには `Level Best` を使う
- ゲームオーバー画面内の統計ラベルは `Score / Streak` に統一し、`Best Streak` は使わない
- 終了要約は `3回続けて不正解になったため、今回はここで終了です。` を基準にする
- ゲームオーバー時は通常の不正解音ではなく、短い下降音を再生する
- `Best Score` または `Best Streak` を更新した場合は、ゲームオーバー音のあとに上昇する祝福音を追加する
- `Score` と `Streak` の両方更新時は、単独更新より強い visual state と音を使う

## Component Rules

### 1. Play Module

下部全体は 1 枚の `surface-card` に見せる。

- 左右に視覚上の区切りはあってよい
- ただし別カードに分断して見せない
- 見出し `PLAY` の下に 2 カラムを並べる

### 2. Level Card

構成:

- 1 行目: `Level X` と `X words`
- 2 行目: 短い日本語説明

寸法:

- 最小高さ `110px` 前後
- 左右余白 `24px`
- 上下余白 `24px`

状態:

- selected
  - 背景: `--accent-soft`
  - 境界: アクセントを混ぜた 1px 線
  - 影: `--shadow-raised`
- default
  - 背景: `--surface-strong`
  - 境界: `1px solid var(--line-soft)`
- hover
  - 未選択でも軽く浮く

### 3. Start Panel

構成順:

1. `Level X`
2. 日本語説明文
3. `ゲームを始める`
4. 無題の補助メモ 4 項目
5. 必要ならエラー文言

ルール:

- 空白で広く見せるが、上部ブロックと下部補助メモで役割を分ける
- チップ濫用は避ける
- CTA は横幅いっぱいにしない
- `X words` は右カラムへ置かない
- 補助メモにタイトルは置かない
- 補助メモは本文より 1 段小さい文字サイズで静かに見せる

### 4. Primary Button

- 高さ 48px 前後
- pill
- 背景は `--accent`
- 文字は白、700
- この画面で一番強い操作要素にする

```css
.primary-button {
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  background: var(--accent);
  color: white;
  font-size: 16px;
  font-weight: 700;
  box-shadow: var(--shadow-rest);
}
```

### 5. Record Card

- `Best Score / Best Streak` は英語維持
- `レベルごとの最高記録` のような説明見出しは置かない
- アクティブカードの背景色は少し弱める
- 数字の強さで見せる
- 上部と下部で同じ角丸、影、ラベルルールを使う
- 3 枚の record card は現状より少し大きく使い、上下余白と数字サイズを増やす

### 6. In-Game Info Row

- `Level X` は左に配置
- `Score / Streak / Miss` は右に配置
- ラベルは Title Case
- 数値は tabular figure
- 太い帯ではなく、問題カードに溶け込む細い情報列にする

## Accessibility Rules

- 本文のコントラストは 4.5:1 以上
- 補助ラベルも 3:1 を下回らない
- 選択状態は色だけで示さない
- タップ領域は 44x44px 以上
- `focus-visible` を全インタラクティブ要素に付与
- `prefers-reduced-motion` を尊重する
- 語数やスコアは桁区切りと tabular figure で読みやすくする

推奨フォーカスリング:

```css
:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--accent) 70%, white);
  outline-offset: 3px;
}
```

## Layout Specification

デスクトップの概形は以下。

```text
PLAY
┌──────────────────────────────────────────────────────────────┐
│ [Level 1] 12,349 words       │ Level 1                       │
│ 1–2文字中心。生活や旅行でよく使う単語。 │ 1–2文字中心。生活や旅行で     │
│                              │ よく使う単語。                │
│ [Level 2] 1,198 words        │                                │
│ 3–4文字中心。日常表現や施設名がメイン。 │ [ ゲームを始める ]            │
│                              │                                │
│ [Level 3] 3,763 words        │ ──────────────────────────── │
│ 5–6文字中心。少し長めの複合語に挑戦。   │ ・4択から1つ選ぶ              │
│                              │ ・正解で10点                  │
│                              │ ・3連続正解からボーナス        │
│                              │ ・3回連続ミスで終了            │
└──────────────────────────────────────────────────────────────┘
```

モバイルでは縦積みに切り替える。

- 左のレベル一覧
- 右の開始内容

の順に並べ、CTA は下端に固定しすぎず自然な流れの中に置く。

プレイ中の概形は以下。

```text
┌──────────────────────────────────────────────────────────────┐
│ Level 2                         Score 240  Streak 4  Miss 1/3 │
│                                                            │
│                           謝謝                              │
│                    シエシエ / xie4 xie5                    │
│                                                            │
│         [選択肢]                   [選択肢]                 │
│         [選択肢]                   [選択肢]                 │
│                                                            │
│     フィードバック + 次の問題 / トップへ戻る                │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Boundaries

Primary files:

- `app/pages/index.vue`
- `app/components/SessionStartPanel.vue`
- `app/components/QuestionStage.vue`
- `app/assets/css/main.css`

Secondary files:

- `app/utils/trainer.ts`
- `app/composables/useTrainerSessionUi.ts`
- `app/components/TrainerTopRail.vue`
- `tests/components/session-start-panel.test.ts`
- `tests/components/index-page.test.ts`
- `tests/e2e/game-flow.spec.ts`
- `README.md`

## Testing Strategy

component:

- 開始画面で `PLAY` モジュールが表示されること
- `Arcade Lobby` と `準備OK。` が消えていること
- `Best Score / Best Streak` が上部で維持されること
- レベル切替で右カラムの `Level X` と説明文が更新されること
- `ゲームを始める` が唯一の primary CTA として残ること
- 左のレベルカードが従来より大きく見えること
- 右下補助メモが 4 項目で表示されること
- プレイ中は `hero-panel` が表示されないこと
- プレイ中は `Score / Streak / Miss` が問題カード上部へ統合されること

e2e:

- 開始画面から `ゲームを始める` でセッションを開始できること
- レベル切替後も開始導線が崩れないこと
- モバイル幅でも下部が縦積みで成立すること
- プレイ中もモバイル幅で横にはみ出さないこと

visual review:

- 上部と下部の小見出しサイズ、色、ウェイトが一致していること
- 選択中レベルカードだけが明確に強調されること
- 右カラムが空白過多でも説明過多でもないこと
- 右上 `RECORDS` 枠で 3 枚の card 自体が主役に見えること

## Out of Scope

- スコア計算やゲームルールの変更
- 音声機能自体の仕様変更
- 語彙データや辞書生成ロジックの変更

## Acceptance Criteria

- 左上の `Taiwan Traditional Chinese Trainer` は維持される
- 上部右では `Best Score / Best Streak` が英語のまま表示される
- 上部右から `レベルごとの最高記録` が消える
- 下部は `PLAY` を見出しとする 1 つの開始モジュールに再構成される
- 左カラムから旧 `ルール` ブロックが消える
- 右カラムから `Arcade Lobby` と `準備OK。` が消える
- 右カラムには `Level X`、説明文、CTA、補助メモ 4 項目が表示される
- 上部 2 枠と下部モジュールで小見出しの視覚ルールが一致する
- `LEVELS` `START` `自分に合った難度を選ぶ` が出ない

## Success Criteria

- 画面全体が「ゲームっぽい勢い」ではなく「静かな高品質アプリの入口」に見える
- 下部が 2 つの独立カードではなく、1 つの開始体験として読める
- 余白、角丸、影、選択状態の文法が統一される
- 実装後に上部と下部の完成度差が目立たなくなる
- プレイ中画面でもトップ画面と同じ素材感と文字ルールが維持される

## References

- Apple Human Interface Guidelines
  - https://developer.apple.com/design/human-interface-guidelines
- Apple Design
  - https://developer.apple.com/design
- Apple Design Resources
  - https://developer.apple.com/design/resources/
