# LexiFormosa

`LexiFormosa` は、台湾で使われる繁体字の単語を日本語4択で学ぶローカル向け Nuxt 4 ゲームです。公開リポジトリ名と npm package 名は `lexi-formosa` で、アプリバージョンは [package.json](package.json) を正とします。

簡体字は表示せず、1問につき繁体字の単語を1つだけ出題します。ピンイン、カタカナ補助、ブラウザ音声による読み上げを使いながら、Level 1 から Level 3 までを1ルート10問で練習できます。

## Features

- 繁体字の単語を日本語4択で回答
- Level 1 は 1文字、Level 2 は 2文字、Level 3 は 3文字以上の実用語を扱う
- ピンイン、カタカナ補助、`SpeechSynthesis` による単語読み上げ
- 日付・レベル・当日の完走数から端末内で再現できる「今日の10語」ルート。完走後は未出題中心の次の10語へ進み、外部 DB やログインは不要
- 間違えた語を `localStorage` の復習リストへ追加し、次のルートで最大4語まで優先出題
- 単語ごとの定着度、当日の最高正解数、完走ルート数、ことば切符（金・銀・銅）を端末内に保存
- 正解時は1〜2連続で10点、3〜4連続で15点、5〜6連続で20点、7連続以上で25点を加算
- 1語の定着度は正解で1上がり、不正解で1下がる。3で定着扱いとなり、間違えたことがあり定着度2未満の語を復習候補にする
- ことば切符はセッション終了時の正解数に応じて、6問以上で銅、8問以上で銀、10問正解で金
- 10問への回答でルート完走。途中で3回連続不正解になるとセッション終了
- Level 1-3 ごとの最高スコアと最高連続数を `localStorage` に保存
- 開始画面でレベル選択、最高記録、復習待ち、定着語数、今日の結果、次のルート番号をまとめて表示
- UI は単色面と直線的なカードを中心にしたモダンなフラットデザイン。楕円ラベルや多用したグラデーションに依存しない
- 390px 前後のスマホ幅を中心に、開始ボタン、10問の進行、スコア、連続数、連続不正解で終了までの回数、4択を追いやすく設計。PC 幅にもレスポンシブ対応
- スマホ版のレベルカードは `基礎 / 日常 / 実用` の短い説明を添え、記録詳細より先に開始操作を案内
- PC 版の最高記録カードはクリックでレベル選択と連動し、スマホ版は選択中レベルの `Level / 語数` と記録・復習状況を省スペース表示
- PC 版の選択肢カードには数字キーに対応する番号を表示し、キーボードでも回答と次問遷移を操作可能
- PC 版の回答後は結果帯と `次の問題` を同じ視野に配置し、スマホ版は回答後の操作を縦積みで案内
- 不正解時は `正解は「xxx」です。残りn回で終了します。` の形で正解と残り回数を表示
- 連続不正解で終了まであと1回の場面では、HUD と問題カードに警告表示・短い警告音を出す
- 進行中の中断は確認を挟み、誤操作でルートを離れないようにする。回答済みの単語別学習履歴と最高記録は保持し、未完走のルート数は加算しない
- 回答後に次の操作と Google 翻訳 / Weblio の外部確認リンクを表示。完走時は `次の10語へ`、途中終了時は `この10語に再挑戦` を主役にし、外部確認リンクは二次情報として表示。スマホ版では回答後に不要な選択肢を隠して縦幅を節約
- ゲーム終了時は最後の単語と正解を結果カード内に残し、再挑戦または次の10語への操作を最初の画面内に表示
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

`npm run setup:data` は TOCFL と MJdic の既定ソースを取得し、ローカルで語彙データを生成して検証します。既定 URL を使う初回実行にはインターネット接続が必要です。TBCL は任意入力で、`TBCL_SOURCE_PATH` または `TBCL_SOURCE_URL` を指定した場合だけ新たに取得・コピーします。既存の `data/source-snapshots/tbcl_words.json` があれば、指定の有無にかかわらず生成時に併用します。各ソースは `*_SOURCE_PATH` でローカルファイルを指定でき、TOCFL と MJdic は `*_SOURCE_URL` で取得先も上書きできます。詳細は [辞書ソースと再生成手順](docs/dictionary-sources.md) を参照してください。

ゲームの進行と学習記録にはブラウザの `localStorage` だけを使います。サーバー DB、アカウント、外部同期サービスは必要ありません。ブラウザのサイトデータを削除すると、最高記録・復習リスト・定着度・当日の結果・完走ルート数も削除されます。

Playwright を初めて使う環境では、必要に応じて次を実行してください。

```bash
npx playwright install chromium
```

## Scripts

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | Nuxt 開発サーバーを起動 |
| `npm run build` | 本番用ビルドを生成 |
| `npm run preview` | 本番用ビルドをローカル確認 |
| `npm run typecheck` | Nuxt / TypeScript の型検査 |
| `npm test` | Unit と E2E を順に実行 |
| `npm run test:unit` | Vitest を1回実行 |
| `npm run test:unit:coverage` | Unit テストのカバレッジを生成 |
| `npm run test:watch` | Vitest を watch モードで起動 |
| `npm run test:e2e` | Playwright の主要導線テストを実行 |
| `npm run setup:data` | 外部ソースの取得またはコピー、生成、検証を一括実行 |
| `npm run generate:data` | ローカルのソーススナップショットから語彙を再生成 |
| `npm run check:data` | 生成済み語彙のスキーマと品質条件を検証 |
| `npm run audit:data` | 要レビューの日本語ラベルを抽出 |
| `npm run lint` | Biome の静的検査を実行 |
| `npm run lint:fix` | Biome で安全に自動修正できる箇所を書き換え |
| `npm run prepare` | Nuxt の型・生成ファイルを準備 |

## Data

生成済み辞書データは Public リポジトリに同梱しません。語彙は TOCFL と `data/manual-vocabulary.json` を必須の土台としてローカル生成します。MJdic は日本語候補と発音補完に必要ですが単独採用の根拠にはせず、TBCL は指定時だけ補助レベル判定に使います。

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
npm run typecheck
npm run build
```

主要導線を変えた場合は `npm run test:e2e` も実行してください。現在の画面・レスポンシブ・アクセシビリティ確認基準は [design-qa.md](design-qa.md) にまとめています。
