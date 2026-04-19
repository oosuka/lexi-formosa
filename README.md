# LexiFormosa

`LexiFormosa` は、台湾で使われる繁体字の単語を日本語4択で学ぶローカル向け Nuxt 4 ゲームです。公開リポジトリ名と npm package 名は `lexi-formosa`、現在のアプリバージョンは `v1.2.1` です。

簡体字は表示せず、1問につき繁体字の単語を1つだけ出題します。ピンイン、カタカナ補助、ブラウザ音声による読み上げを使いながら、Level 1 から Level 3 まで段階的に練習できます。

## Features

- 繁体字の単語を日本語4択で回答
- Level 1 は 1-2文字、Level 2 は 3-4文字、Level 3 は 5-6文字が中心
- ピンイン、カタカナ補助、`SpeechSynthesis` による単語読み上げ
- 正解で加点し、3連続正解からボーナスを加算
- 3回連続で不正解になるとセッション終了
- Level 1-3 ごとの最高 `Score / Streak` を `localStorage` に保存
- 開始画面でレベル選択、最高記録、ゲーム開始、ルール要約をまとめて表示
- 不正解時は `正解は「xxx」です。残りn回で終了します。` の形で正解と残り回数を表示
- 回答後に次の操作と Google 翻訳 / Weblio の外部確認リンクを表示
- `metadata.json` の取得に失敗しても、語彙本体があればゲームは継続

## Stack

- Nuxt 4 / Vue 3
- Node.js 24 LTS / npm / Volta
- TypeScript / Zod
- Biome 2
- Vitest / Playwright

## Setup

```bash
npm install
npm run setup:data
npm run dev
```

`npm run setup:data` は辞書ソースを取得し、ローカルで語彙データを生成して検証します。初回実行にはインターネット接続が必要です。

Playwright を初めて使う環境では、必要に応じて次を実行してください。

```bash
npx playwright install chromium
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run test:unit
npm run test:e2e
npm run setup:data
npm run generate:data
npm run check:data
```

## Data

生成済み辞書データは Public リポジトリに同梱しません。語彙は `TOCFL + TBCL + MJdic + data/manual-vocabulary.json + data/editorial-overrides.json` からローカル生成します。

- 実行時は `public/wordlists/vocabulary-level-*.json` を必要なレベルだけ遅延読み込みします
- `public/wordlists/metadata.json` は件数表示用の補助データです
- 重要語の追加や発音補完は `data/manual-vocabulary.json` に入れます
- 自動候補の採否や日本語ラベル補正は `data/editorial-overrides.json` に入れます
- 生成物と外部ソーススナップショットは Git 管理対象にしません

辞書ソースと再生成手順の詳細は [docs/dictionary-sources.md](docs/dictionary-sources.md)、権利上の注意は [NOTICE.md](NOTICE.md) を参照してください。

## Test Policy

テストは、出題ロジック、状態遷移、語彙検証、非同期失敗時の継続、主要なゲーム導線を優先します。CSS の細部や重複した表示構造だけを固定するテストは避けます。

通常の確認:

```bash
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

主要導線を変えた場合は `npm run test:e2e` も実行してください。
