# LexiFormosa

`LexiFormosa` は、台湾で使われる繁体字の単語を日本語4択で学ぶローカル向け Nuxt 4 ゲームです。公開リポジトリ名と npm package 名は `lexi-formosa`、現在のアプリバージョンは `v1.3.1` です。

簡体字は表示せず、1問につき繁体字の単語を1つだけ出題します。ピンイン、カタカナ補助、ブラウザ音声による読み上げを使いながら、Level 1 から Level 3 まで段階的に練習できます。

## Features

- 繁体字の単語を日本語4択で回答
- Level 1 は 1文字、Level 2 は 2文字、Level 3 は 3文字以上の実用語を扱う
- ピンイン、カタカナ補助、`SpeechSynthesis` による単語読み上げ
- 正解で加点し、3連続正解からボーナスを加算
- 3回連続で不正解になるとセッション終了
- Level 1-3 ごとの最高スコアと最高連続数を `localStorage` に保存
- 開始画面でレベル選択、最高記録、ゲーム開始、ルール要約をまとめて表示し、開始ボタン付近に選択中レベルの記録を集約
- UI は単色面と直線的なカードを中心にしたモダンなフラットデザイン。楕円ラベルや多用したグラデーションに依存しない
- PC 版の最高記録カードはクリックでレベル選択と連動し、スマホ版は選択中レベルの `Level / 語数` と `最高スコア / 最高連続数` を省スペース表示
- 不正解時は `正解は「xxx」です。残りn回で終了します。` の形で正解と残り回数を表示
- 残り1ミスで終了する場面では、残り回数と問題カードに警告表示・短い警告音を出す
- 回答後に次の操作と Google 翻訳 / Weblio の外部確認リンクを表示。スマホ版では回答後に不要な選択肢を隠して縦幅を節約
- ゲーム開始、次の問題、再開、トップ復帰の主要遷移ではページ上部へ戻る
- Apple touch icon を同梱し、スマホブラウザの自動アイコン取得にも対応
- `metadata.json` の取得に失敗しても、語彙本体があればゲームは継続

## Stack

- Nuxt 4 / Vue 3
- Node.js 24 LTS / npm / Volta
- TypeScript 5 / Zod
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
npm run audit:data
```

## Data

生成済み辞書データは Public リポジトリに同梱しません。語彙は `TOCFL + TBCL + data/manual-vocabulary.json` を土台にローカル生成し、`MJdic` は日本語候補と発音補完の補助に使います。

- 実行時は `public/wordlists/vocabulary-level-*.json` を必要なレベルだけ遅延読み込みします
- `public/wordlists/metadata.json` は件数表示用の補助データです
- `data/manual-vocabulary.json` は必ず入れたい高品質語の seed と発音補完に使います
- `data/manual-vocabulary.json` に持たせるのは `id / trad / ja / category / pronunciation?` だけで、`level / length / sources / taiwanPriority` は生成時に再計算します
- 自動生成で拾いにくいが教材として入れたい語は `data/manual-vocabulary.json` に追加します
- それとは別に、ごく少数の基礎語だけ [scripts/lib/vocabulary-candidate-pipeline.mjs](scripts/lib/vocabulary-candidate-pipeline.mjs) の preferred-label map で日本語ラベルを固定しています
- 生成時は `data/vocabulary-candidates.json` に publishable 判定と却下理由を残します
- 生成時の hard gate は簡体字混入、記号だけ、ASCII のみ、参照・略語・分類詞メタ、MJdic 単独根拠など誤爆しにくい条件に絞ります
- `npm run audit:data` は説明文風ラベル、姓っぽいラベル、同一訳過多などの怪しい日本語ラベルを `data/review-batches/vocabulary-audit.json` に一覧化します
- 生成物と外部ソーススナップショットは Git 管理対象にしません

辞書ソースと再生成手順の詳細は [docs/dictionary-sources.md](docs/dictionary-sources.md)、権利上の注意は [NOTICE.md](NOTICE.md) を参照してください。

## License And Data Notice

このリポジトリのコード、設定、ドキュメント、テストは [MIT License](LICENSE) で提供します。npm 依存パッケージはそれぞれのライセンスに従います。

生成済み辞書データ、外部ソーススナップショット、生成済み語彙 JSON は MIT License の対象外です。fork / clone してローカルで遊ぶ用途では `npm run setup:data` で各自の環境に生成してください。生成された `data/vocabulary*.json`、`public/wordlists/*.json`、`data/review-batches/*.json`、`data/source-snapshots/*` を再配布する場合は、TOCFL / TBCL / MJdic / CC-CEDICT など各データソースの利用条件、帰属表示、ShareAlike 条件を確認してください。

## Test Policy

テストは、出題ロジック、状態遷移、語彙検証、非同期失敗時の継続、主要なゲーム導線を優先します。CSS の細部や重複した表示構造だけを固定するテストは避けます。現在のデザイン方針として、`tests/unit/design-system.test.ts` でグラデーション背景とフルピル形状の再導入を防いでいます。

通常の確認:

```bash
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

主要導線を変えた場合は `npm run test:e2e` も実行してください。
