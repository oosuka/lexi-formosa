# LexiFormosa

`LexiFormosa` は、臺灣で使われる繁體字の単語を日本語4択で学ぶローカル向けの Nuxt 4 ゲームです。
読み方の補助表示と音声再生を備え、短い単語から少し長めの複合語まで 3 レベルで練習できます。
GitHub の公開リポジトリ名と npm package 名は `lexi-formosa` を前提にしています。
現在のアプリバージョンは `v1.2.0` です。

台湾華語寄りの語彙だけを対象にし、簡体字は表示しません。4択でテンポよく反復しながら、繁體字の形、意味、読みをまとめて確認できます。

## Features

- 繁體字の単語を 1 問 1 語で出題
- 日本語 4 択で意味を答える学習ゲーム
- Level 1 から Level 3 までの段階的な難易度
- Level 1 では 1-2文字語を扱い、TOCFL 由来の 1文字語も対象に含む
- ピンインとカタカナ補助の読み表示
- ブラウザ音声による単語再生
- リセット、次の問題、レベル切替での自動読み上げ
- 開始画面は上段にタイトルと全レベル Records、下段に `PLAY` モジュールを配置
- `PLAY` モジュール内で、左にレベル選択、右に開始導線を表示
- `ゲームを始める` からセッション開始
- PC では Apple HIG を参考にした静かなカードレイアウト
- プレイ中はタイトル枠や Session 枠を出さず、問題カード 1 枚に情報を集約
- `Score / Streak / Miss` は問題カード上部の細い情報列に表示
- 開始前は `PLAY`、終了時は結果サマリーとして情報を整理
- ゲームオーバー画面では `Game Over` を主見出しにして終了状態を強調
- 通常状態の card / button / label / spacing は開始画面、プレイ中、ゲームオーバーで同じ文法に統一
- 正解 / 不正解をカード状態と結果帯で見分けやすく表示
- 音を消していても、正解 / 不正解が色・動き・カード状態で見分けやすい
- キーボードでは `1-4` で回答し、`Enter` で開始や次の問題へ進行可能
- 開始画面に Level 1-3 ごとの最高 `Score / Streak` を表示し、`localStorage` に保存
- 正解で10点
- 3連続正解から段階的なボーナス加点
- 3回連続で不正解になるとそのセッションは終了
- ゲーム終了後は同じレベルで即再開する `もう一度始める` と、開始画面へ戻る `トップへ戻る` を表示
- 正解音、不正解音、ゲームオーバー専用の下降音による即時フィードバック
- `Best Score` または `Best Streak` を更新したゲームオーバーでは、専用の祝福演出と専用音を出す
- `Score` と `Streak` の両方を更新した場合は、単独更新より強い演出にする
- レベルごとの登録語数の可視化
- `metadata.json` が欠けていても、語彙本体があればゲームは継続可能
- 解答後に下部から Google 翻訳と Weblio を別タブで開ける外部確認リンク

開発運用ルールは `AGENTS.md` を参照してください。
コードのライセンスと辞書データの扱いは `LICENSE` と `NOTICE.md` を参照してください。

## Release

- `v1.2.0` は語彙品質パイプライン、editorial override、レビュー用バッチ処理を導入したリリースです
- `v1.1.0` はリリース準備として版番号と関連文書を更新したリリースです
- `v1.0.1` はゲーム挙動や見た目を変えないメンテナンスリリースです
- `v1.0.0` を初回安定リリースとして扱います

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

## Directory Layout

- Nuxt 4 標準構成に合わせて、アプリ本体は `app/` 配下に配置しています
- 主要画面は `app/pages/index.vue`、UI コンポーネントは `app/components/`、状態管理は `app/composables/`、補助ロジックは `app/utils/` にあります
- 共有型は `shared/types/vocabulary.ts` に集約しています
- 実行時配信ファイルは `public/wordlists/`、生成用スクリプトは `scripts/`、語彙生成物と手修正データは `data/` にあります

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
npm run review:vocab:export -- --level=3 --risk-only --limit=200
npm run review:vocab:export -- --limit=500
npm run review:vocab:apply -- /path/to/review-results.json
```

## Current Scope

- 3 levels
  - Level 1: 1-2文字
  - Level 2: 3-4文字
  - Level 3: 5-6文字
- 繁體字の単語のみ出題
- 日本語4択
- 正解で10点
- 3連続正解からボーナス加点
- カタカナ補助とピンイン表示
- ブラウザ音声による単語再生
- リセット時、レベル切替時、次の問題で自動読み上げ
- 開始画面は上段にタイトルと全レベル Records、下段に `PLAY` モジュールを配置
- `PLAY` モジュール内で、左にレベル選択、右に開始導線を表示
- `ゲームを始める` からセッション開始
- PC では Apple HIG を参考にした静かなカードレイアウト
- プレイ中はタイトル枠や Session 枠を出さず、問題カード 1 枚に情報を集約
- プレイ中の `Score / Streak / Miss` を問題カード上部の情報列に常設
- `PLAY` / Answered / Game Over で情報階層を整理
- ゲームオーバーでは `Game Over` を主役にし、汎用見出しは置かない
- 通常状態の card / button / label / spacing は開始画面、プレイ中、ゲームオーバーで同じ文法に統一
- 正解 / 不正解をカード状態と結果帯で明確に表示
- 音なしでも、正解 / 不正解が色・動き・カード状態で分かりやすい
- `1-4` キーで回答し、`Enter` キーで開始や次の問題へ進める
- 開始パネルにレベル別の最高 `Score / Streak` を表示
- 3回連続で不正解になるとゲーム終了
- ゲーム終了後は即リトライか開始画面へ戻るかを選べる
- 正解音、不正解音、ゲームオーバー専用音
- 新記録のゲームオーバーでは専用の祝福演出と専用音
- 解答後に下部へ表示される Google 翻訳と Weblio への外部確認リンク
- ローカル起動前提
- 学習履歴の永続保存なし

## Data

- Public リポジトリには、生成済み辞書データを同梱しません
- 語彙は `TOCFL + TBCL + MJdic + data/manual-vocabulary.json + data/editorial-overrides.json` をもとにローカル生成します
- 初回は `npm run setup:data` で外部ソース取得と生成をまとめて実行できます
- TOCFL ソースは JSON 配列形式と JSONL 形式の両方を受け付けます
- `TBCL` や追加辞書ソースは `*_SOURCE_PATH` を優先し、URL が安定している場合だけ `*_SOURCE_URL` を使います
- `data/manual-vocabulary.json` は seed deck として使い、`data/editorial-overrides.json` で採否と日本語ラベル補正を管理します
- 生成時には `data/vocabulary-candidates.json` も出力し、低信頼候補のレビュー入力として使えます
- 公開デッキは、`Level 1-2` では `TOCFL/TBCL` を根拠にできる候補だけ、`Level 3` では `MJdic` を根拠にできる 5-6 文字候補を主に採用します
- 生成済み全語彙は `data/vocabulary.json` に出力されます
- レベル別件数を含むメタデータは `data/vocabulary-metadata.json` に出力されます
- 実行時は `public/wordlists/vocabulary-level-*.json` をレベル単位で遅延読み込みします
- 実行時の `wordlists` 読み込みは Nuxt の `app.baseURL` を考慮するため、サブパス配信でも動作します
- `public/wordlists/metadata.json` が欠けていても、件数表示だけを省略してゲーム本体は動作します
- `npm run generate:data` で語彙を再生成し、`npm run check:data` で基本整合性を確認します
- `npm run audit:data` で、不自然な日本語カード候補を監査できます
- 語彙レビューを進める場合は、Level 3 の地名・組織名・説明文寄り候補を先に `npm run review:vocab:export -- --level=3 --risk-only --limit=200` で書き出し、その後に通常の Level 1-2 batch を `npm run review:vocab:export -- --limit=500` で書き出します
- review 結果の反映には `npm run review:vocab:apply -- /path/to/review-results.json` を使います
- `--limit=500` は上限ではありませんが、品質を落とさず確認する単位として推奨しています
- 既定の review batch は `Level 1-2` の未レビュー候補と低信頼候補を対象にし、既に `data/editorial-overrides.json` にある語は除外します
- Level 3 は Truth-first Challenge Deck として残し、`--level=3 --risk-only` では固有名詞・説明文ラベル・13文字以上のラベルを優先してレビューします
- review batch、外部ソーススナップショット、生成済み wordlist は Git 管理対象にしません
- 生成された辞書データはコードとは別の権利関係を持つため、再配布時は `NOTICE.md` を確認してください

## Testing

- unit / UI: `Vitest + @nuxt/test-utils + Vue Test Utils`
- coverage: `npm run test:unit:coverage`
- E2E: `Playwright`
- `npm run test:e2e` はビルド済みアプリを使って順次実行し、Nuxt の初回起動競合を避けています
- `npm run test:e2e` は `app.baseURL=/lexi-formosa/` のサブパス配信でも主要導線が崩れないことを確認します
- E2E 実行は Node ラッパースクリプト経由にしており、`NO_COLOR` や `HOST/PORT` の扱いで POSIX シェルに依存しません
- 現在は、出題ロジック、状態遷移、主要画面表示、最小限のゲームフロー、辞書ソース解析、`app.baseURL` 配下での語彙ロードをテストしています
