# LexiFormosa

`LexiFormosa` は、臺灣で使われる繁體字の単語を日本語4択で学ぶローカル向けの Nuxt 4 ゲームです。
読み方の補助表示と音声再生を備え、短い単語から少し長めの複合語まで 3 レベルで練習できます。
GitHub の公開リポジトリ名と npm package 名は `lexi-formosa` を前提にしています。
現在のアプリバージョンは `v1.1.0` です。

台湾華語寄りの語彙だけを対象にし、簡体字は表示しません。4択でテンポよく反復しながら、繁體字の形、意味、読みをまとめて確認できます。

## Features

- 繁體字の単語を 1 問 1 語で出題
- 日本語 4 択で意味を答える学習ゲーム
- Level 1 から Level 3 までの段階的な難易度
- Level 1 では 1-2文字語を扱い、TOCFL 由来の 1文字語も対象に含む
- ピンインとカタカナ補助の読み表示
- ブラウザ音声による単語再生
- リセット、次の問題、レベル切替での自動読み上げ
- 初回表示とリセット後は `ゲームを始める` からセッション開始
- PC 向けの `Focused Learning Desk` レイアウト
- プレイ中は quiz panel 上部に `Score / Streak / Miss` を常時表示
- 開始前は Lobby、終了時は結果サマリーとして情報を整理
- 正解 / 不正解をカード状態と結果帯で見分けやすく表示
- 音を消していても、正解 / 不正解が色・動き・カード状態で見分けやすい
- キーボードでは `1-4` で回答し、`Enter` で開始や次の問題へ進行可能
- 開始画面に Level 1-3 ごとの最高 `Score / Streak` を表示し、`localStorage` に保存
- 正解で10点、3連続正解から段階的なボーナス加点
- 3回連続で不正解になるとそのセッションは終了
- ゲーム終了後は同じレベルで即再開する `もう一度始める` と、開始画面へ戻る `トップに戻る` を表示
- 正解音と不正解音による即時フィードバック
- レベルごとの登録語数の可視化
- `metadata.json` が欠けていても、語彙本体があればゲームは継続可能
- 解答後に下部から Google 翻訳と Weblio を別タブで開ける外部確認リンク

開発運用ルールは `AGENTS.md` を参照してください。
コードのライセンスと辞書データの扱いは `LICENSE` と `NOTICE.md` を参照してください。

## Release

- `v1.1.0` はリリース準備として版番号と関連文書を更新したリリースです
- `v1.0.1` はゲーム挙動や見た目を変えないメンテナンスリリースです
- `v1.0.0` を初回安定リリースとして扱います
- リリース内容の要約は `CHANGELOG.md` を参照してください

## Stack

- Nuxt 4
- Vue 3
- Node.js 24 LTS
- npm
- Volta
- Biome 2
- TypeScript
- Zod
- Vitest
- Playwright

## Setup

```bash
npm install
npm run setup:data
npm run dev
```

`npm run setup:data` は、辞書ソースをローカルへ取得して語彙データを生成し、基本整合性チェックとカード品質監査まで行う初回セットアップ用コマンドです。インターネット接続が必要です。監査は警告用途で、説明的すぎる訳候補が残っていても自動では失敗しません。

E2E テストを初回実行する場合は、必要に応じて次を一度実行してください。

```bash
npx playwright install chromium
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run typecheck
npm run lint
npm run test
npm run test:unit
npm run test:unit:coverage
npm run test:watch
npm run test:e2e
npm run setup:data
npm run generate:data
npm run check:data
npm run audit:data
```

## Current Scope

- 3 levels
  - Level 1: 1-2文字
  - Level 2: 3-4文字
  - Level 3: 5-6文字
- 繁體字の単語のみ出題
- 日本語4択
- 正解で10点、3連続正解からボーナス加点
- カタカナ補助とピンイン表示
- ブラウザ音声による単語再生
- リセット時、レベル切替時、次の問題で自動読み上げ
- 初回表示とリセット後は開始パネルからセッション開始
- PC では `Focused Learning Desk` の中央集中レイアウト
- プレイ中の `Score / Streak / Miss` を quiz panel 上部に常設
- Lobby / Answered / Game Over で情報階層を整理
- 正解 / 不正解をカード状態と結果帯で明確に表示
- 音なしでも、正解 / 不正解が色・動き・カード状態で分かりやすい
- `1-4` キーで回答し、`Enter` キーで開始や次の問題へ進める
- 開始パネルにレベル別の最高 `Score / Streak` を表示
- 3回連続で不正解になるとゲーム終了
- ゲーム終了後は即リトライか開始画面へ戻るかを選べる
- 正解音と不正解音
- 解答後に下部へ表示される Google 翻訳と Weblio への外部確認リンク
- ローカル起動前提
- 学習履歴の永続保存なし

## Data

- Public リポジトリには、生成済み辞書データを同梱しません
- 語彙は `TOCFL + MJdic + data/manual-vocabulary.json` からローカル生成します
- 初回は `npm run setup:data` で外部ソース取得と生成をまとめて実行できます
- TOCFL ソースは JSON 配列形式と JSONL 形式の両方を受け付けます
- 生成済み全語彙は `data/vocabulary.json` に出力されます
- レベル別件数を含むメタデータは `data/vocabulary-metadata.json` に出力されます
- 実行時は `public/wordlists/vocabulary-level-*.json` をレベル単位で遅延読み込みします
- 実行時の `wordlists` 読み込みは Nuxt の `app.baseURL` を考慮するため、サブパス配信でも動作します
- `public/wordlists/metadata.json` が欠けていても、件数表示だけを省略してゲーム本体は動作します
- 手修正の重要語、訳、発音補完は `data/manual-vocabulary.json` で管理します
- `npm run generate:data` で語彙を再生成し、`npm run check:data` で基本整合性を確認します
- `npm run audit:data` で、不自然な日本語カード候補を監査できます
- 生成された辞書データはコードとは別の権利関係を持つため、再配布時は `NOTICE.md` を確認してください

## Testing

- unit / UI: `Vitest + @nuxt/test-utils + Vue Test Utils`
- coverage: `npm run test:unit:coverage`
- E2E: `Playwright`
- `npm run test:e2e` はビルド済みアプリを使って順次実行し、Nuxt の初回起動競合を避けています
- `npm run test:e2e` は `app.baseURL=/lexi-formosa/` のサブパス配信でも主要導線が崩れないことを確認します
- E2E 実行は Node ラッパースクリプト経由にしており、`NO_COLOR` や `HOST/PORT` の扱いで POSIX シェルに依存しません
- 現在は、出題ロジック、状態遷移、主要画面表示、最小限のゲームフロー、辞書ソース解析、`app.baseURL` 配下での語彙ロードをテストしています
