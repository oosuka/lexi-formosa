# AGENTS.md

このファイルは、このリポジトリで作業する人間およびエージェント向けの運用ガイドです。
特に断りがない限り、ここに書かれた方針を優先してください。

## 1. 基本方針

- ベース言語は日本語です。
- ユーザー向け説明、提案、進捗報告、レビュー結果、`/review` 相当の出力は日本語で行ってください。
- このプロジェクトは「台湾で使われる繁体字の単語を、日本語4択で学ぶローカル向けWebゲーム」です。
- GitHub の公開リポジトリ名と npm package 名は `lexi-formosa` を前提にしてください。
- UI と出題データには簡体字を表示しないでください。
- 出題対象は単語のみです。文章・例文は出しません。
- 当面の主目的はローカル起動ですが、Public リポジトリとして公開しやすい構成を維持してください。

## 2. プロジェクト概要

- フレームワーク: Nuxt 4 / Vue 3
- ランタイム: Node.js 24 LTS, npm
- ツール: Volta, Biome 2, TypeScript, Zod, Vitest, Playwright
- 学習方式:
  - 繁体字の単語を1つ表示
  - 日本語4択を表示
  - 正しい日本語を1つ選ぶ
  - 正答で加点
- レベル:
  - Level 1: 1-2文字中心
  - Level 2: 3-4文字中心
  - Level 3: 5-6文字中心
  - Level 1 では 1文字語も取り込み対象に含みます

## 3. 現在の実装の考え方

- Public リポジトリには生成済み辞書データを同梱しません。
- 実行時は外部APIではなく、`public/wordlists/*.json` をレベル単位で遅延読み込みします。
- `metadata.json` は補助表示用であり、取得失敗だけでゲーム本体を停止させないでください。
- 語彙生成は `TOCFL + MJdic + 手修正語彙` を合成するスクリプト方式です。
- clone 後の初回辞書セットアップは `npm run setup:data` で行います。
- `setup:data` は validation 失敗で止めますが、`audit:data` の出力は品質確認用の警告として扱います。
- 重要語や訳の修正は `data/manual-vocabulary.json` を優先して行います。
- 問題カードには、可能な範囲でピンインとカタカナ補助を表示します。
- 単語音声はブラウザの `SpeechSynthesis` を使います。外部TTSは前提にしません。
- 回答時の効果音は `Web Audio API` を使います。
- 生成済みの大規模JSONは成果物です。構造変更や再生成方針がない限り、直接の手編集は避けてください。

## 4. 主要ディレクトリ

- `pages/index.vue`
  - 単一画面のゲームUI
- `composables/useTraditionalTrainer.ts`
  - ゲーム状態、出題進行、レベル切替
- `utils/trainer.ts`
  - 出題ロジック、4択生成、出題重み付け
- `utils/pronunciation.ts`
  - ピンイン整形とカタカナ補助生成
- `utils/vocabulary.ts`
  - 語彙ロードと検証
- `types/vocabulary.ts`
  - 型定義
- `scripts/generate-vocabulary.mjs`
  - 大規模辞書生成
- `scripts/setup-data.mjs`
  - Public リポジトリ向けの辞書取得・生成・監査セットアップ
- `scripts/validate-vocabulary.mjs`
  - 語彙整合性チェック
- `data/manual-vocabulary.json`
  - 手修正・優先語彙
- `data/source-snapshots/`
  - ローカル取得した外部辞書ソース
- `data/vocabulary.json`
  - 統合済み全語彙
- `data/vocabulary-metadata.json`
  - レベル別件数を含むメタデータ
- `data/vocabulary-level-*.json`
  - レベル別の生成物
- `public/wordlists/vocabulary-level-*.json`
  - 実行時配信用の語彙ファイル
- `public/wordlists/metadata.json`
  - 実行時に表示用件数を読むための軽量メタデータ
- `tests/unit/`
  - 出題ロジックと状態遷移のテスト
- `tests/components/`
  - 主要UIのテスト
- `tests/e2e/`
  - Playwright の最小E2E
- `vitest.config.ts`
  - unit/UI テスト設定
- `playwright.config.ts`
  - E2E テスト設定
- `docs/dictionary-sources.md`
  - 辞書ソースと再生成手順
- `LICENSE`
  - コード部分のライセンス
- `NOTICE.md`
  - 辞書データと再配布注意事項

## 5. 開発ルール

- 既存の設計意図を崩さず、小さく安全に変更してください。
- 無関係なリファクタや命名変更は避けてください。
- UI は「シンプルでモダン」を維持してください。
- 既存の1ページ構成を崩す場合は、理由が明確なときだけにしてください。
- データ量が大きいので、クライアントバンドル肥大化には注意してください。
- Public リポジトリには生成済み辞書データをコミットしないでください。
- 語彙ロードは、可能な限り「必要なレベルだけ読む」形を維持してください。
- レベル切替や初期化の非同期処理では、古いリクエストが新しい state を上書きしないようにしてください。
- 音声や効果音を変更する場合は、ブラウザ標準APIで完結するかを優先してください。
- 読み方のカタカナ表記は補助情報です。発音の完全再現を前提にしないでください。

## 6. 繁体字・語彙データ方針

- UI や出題データに簡体字を混入させないでください。
- 台湾華語寄りの語彙を優先してください。
- 日本語訳は「辞書として完璧」より「学習ゲームとして自然で分かりやすい」を優先します。
- ただし、意味を誤らせる訳は避けてください。
- 重要語で訳が不自然な場合は、自動生成ロジックだけで無理に直そうとせず、`data/manual-vocabulary.json` に補正を入れてください。
- 生成スクリプトを変えた場合は、再生成後に必ず検証を実行してください。
- コードのライセンスと辞書データの権利は分離してください。辞書生成や再配布に関わる変更では `NOTICE.md` も確認してください。

## 7. 生成物の扱い

- 手で編集してよいファイル:
  - `pages/`
  - `composables/`
  - `utils/`
  - `types/`
  - `scripts/`
  - `docs/`
  - `data/manual-vocabulary.json`
- 原則として手で編集しないファイル:
  - `data/vocabulary.json`
  - `data/vocabulary-metadata.json`
  - `data/vocabulary-level-1.json`
  - `data/vocabulary-level-2.json`
  - `data/vocabulary-level-3.json`
  - `public/wordlists/vocabulary-level-1.json`
  - `public/wordlists/vocabulary-level-2.json`
  - `public/wordlists/vocabulary-level-3.json`
- 上記生成物はローカル生成物であり、Public リポジトリへは含めません。
- 上記生成物を更新する場合は、`npm run setup:data` または `npm run generate:data` を使って再生成してください。

## 8. 実行コマンド

セットアップ:

```bash
npm install
```

開発:

```bash
npm run dev
```

ビルド:

```bash
npm run build
```

型チェック:

```bash
npm run typecheck
```

Lint:

```bash
npm run lint
npm run lint:fix
```

テスト:

```bash
npm run test
npm run test:unit
npm run test:unit:coverage
npm run test:watch
npm run test:e2e
```

語彙生成:

```bash
npm run setup:data
npm run generate:data
```

語彙検証:

```bash
npm run check:data
```

語彙監査:

```bash
npm run audit:data
```

外部ソースを個別指定して再生成する例:

```bash
TOCFL_SOURCE_PATH=/path/to/tocfl_words.json \
MJDIC_SOURCE_PATH=/path/to/mjdic.csv \
npm run generate:data
```

Playwright 初回セットアップ:

```bash
npx playwright install chromium
```

## 9. 作業前に確認すること

- 変更が UI なのか、ロジックなのか、辞書生成なのかを先に切り分ける
- 生成物を直接直すべきか、元データやスクリプトを直すべきかを判断する
- 語彙や訳の問題なら、まず `manual-vocabulary` で解決できるか確認する
- metadata のような補助データが壊れても、ゲーム本体まで巻き込んで停止させない設計を優先する
- Public 公開に関わる変更なら、生成済み辞書データをコミットしていないか確認する
- パフォーマンスに影響する場合、バンドルへ大きいデータを直接含めていないか確認する
- 音声やブラウザAPIに関わる変更なら、SSR 時に安全かを確認する

## 10. ドキュメント同期ルール

- エージェントがコード、設定、コマンド、運用方針、機能仕様を変更した場合、その変更に関連する Markdown 文書も同じ作業内で最新化してください。
- 対象は少なくとも `README.md`、`AGENTS.md`、`docs/` 配下の関連文書です。
- すべての Markdown を毎回機械的に更新するのではなく、変更内容に影響する文書だけを更新してください。
- 文書更新が不要と判断した場合は、その判断が妥当かを一度確認してください。
- ユーザー向けの使い方、セットアップ、コマンド、挙動が変わった場合は `README.md` を更新してください。
- エージェント運用ルール、レビュー方針、検証手順が変わった場合は `AGENTS.md` を更新してください。
- 辞書、生成、データソース、再生成手順が変わった場合は `docs/dictionary-sources.md` を更新してください。
- 実装変更の完了時には、関連する Markdown が最新かを確認してから作業を閉じてください。

## 11. 作業後の必須チェック

通常のコード変更:

```bash
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

語彙や生成スクリプトを変更した場合:

```bash
npm run setup:data
npm run check:data
npm run audit:data
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

ローカルに辞書ソースがすでにある場合は、次でもかまいません。

```bash
TOCFL_SOURCE_PATH=/path/to/tocfl_words.json \
MJDIC_SOURCE_PATH=/path/to/mjdic.csv \
npm run generate:data
npm run check:data
npm run audit:data
```

UI の主要導線や操作フローを変えた場合:

```bash
npm run lint
npm run test:unit
npm run test:e2e
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

`npm run typecheck` は環境によって待ちが長いことがあります。その場合でも、最低限 `npx tsc --noEmit -p .nuxt/tsconfig.json` は通してください。

## 12. レビュー方針

- `/review` を含むレビュー出力は日本語で行ってください。
- `/review` を求められた場合は、まず重大度順に、バグ、回帰リスク、仕様漏れ、テスト不足を指摘してください。
- 指摘には可能な限りファイルパスと行番号を含めてください。
- 語彙関連の変更では、次を重点的に見てください。
  - 簡体字混入
  - レベル長さ不整合
  - 重複語彙
  - 不自然な日本語訳の増加
  - クライアント初期ロードの肥大化
- UI や音声関連の変更では、次を重点的に見てください。
  - 初回表示、リセット、次の問題での音声挙動
  - 回答時の正誤表示と効果音の整合
  - ブラウザ標準API未対応時の劣化挙動
- 問題が見つからなかった場合も、その旨を日本語で明記し、残るリスクや未確認事項があれば添えてください。
- `/review` の後、指摘事項が局所的で、仕様が明確で、低リスクに修正できる場合は、自動で修正まで進めてください。
- `/review` の後、仕様判断が必要なもの、影響範囲が広いもの、後方互換やUI挙動に影響しうるものは、修正前に確認してください。
- 自動修正した場合は、レビュー結果と修正内容を分けて日本語で報告してください。
- 自動修正した場合でも、無関係な変更は行わず、必要な検証を実行してから報告してください。

## 13. 避けること

- 簡体字をそのままUIや出題語彙に出すこと
- 生成JSONを根本原因の確認なしに手修正すること
- 無関係なファイルを広く整形・改変すること
- 大規模辞書を直接 `import` して初期バンドルを肥大化させること
- 外部依存の重い音声サービスを前提に実装すること
- 英語ベースでユーザー向け説明を書くこと

## 14. 変更提案の優先順位

1. 正しさ
2. 繁体字・台湾華語方針の維持
3. 学習体験の分かりやすさ
4. パフォーマンス
5. 実装の単純さ

## 15. 補足

- 辞書ソースの詳細は `docs/dictionary-sources.md` を参照してください。
- 大量語彙化は実現済みですが、日本語訳の品質改善余地はまだあります。
- 読み方表示と音声再生は実装済みですが、音声品質は利用ブラウザとOSの音声環境に依存します。
- 今後の改善は、まず `manual-vocabulary` の拡充と生成ルールの改善で進めるのが安全です。
