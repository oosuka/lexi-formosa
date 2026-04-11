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
  - 3回連続で不正解になるとそのセッションは終了
- レベル:
  - Level 1: 1-2文字中心
  - Level 2: 3-4文字中心
  - Level 3: 5-6文字中心
  - Level 1 では 1文字語も取り込み対象に含みます

## 3. 現在の実装の考え方

- Public リポジトリには生成済み辞書データを同梱しません。
- 実行時は外部APIではなく、`public/wordlists/*.json` をレベル単位で遅延読み込みします。
- `metadata.json` は補助表示用であり、取得失敗だけでゲーム本体を停止させないでください。
- 語彙生成は `TOCFL + TBCL + MJdic + 手修正語彙 + editorial override` を合成するスクリプト方式です。
- 公開デッキは `Level 1-2` で `TOCFL/TBCL` を根拠にできる候補を優先し、`Level 3` は `MJdic` を根拠にできる 5-6文字候補を中心に組み立ててください。
- clone 後の初回辞書セットアップは `npm run setup:data` で行います。
- `setup:data` は validation 失敗で止めますが、`audit:data` の出力は品質確認用の警告として扱います。
- 重要語の seed 追加や発音補完は `data/manual-vocabulary.json`、自動候補の採否や日本語ラベル補正は `data/editorial-overrides.json` を優先して行います。
- `npm run review:vocab:export -- --limit=500` は `Level 1-2` の未レビュー候補と低信頼候補をレビュー用 JSONL に書き出します。
- `npm run review:vocab:apply -- /path/to/review-results.json` はレビュー結果を `data/editorial-overrides.json` に反映します。
- 語彙品質改善の継続手順は `docs/superpowers/plans/2026-04-11-truth-first-vocabulary-quality.md` を参照してください。
- 次回「改善を再開してください」と言われた場合は、古い plan ではなく現行 plan を読み、全レベルの言語品質改善を継続してください。Level 3 は Truth-first Challenge Deck として残してください。
- 問題カードには、可能な範囲でピンインとカタカナ補助を表示します。
- 単語音声はブラウザの `SpeechSynthesis` を使います。外部TTSは前提にしません。
- 回答時の効果音は `Web Audio API` を使います。
- 初回表示とリセット後は開始パネルを表示し、`ゲームを始める` からセッションを開始します。
- 開始パネルでは、`localStorage` に保存した Level 1-3 ごとの最高 `Score / Streak` を表示します。
- スコアは正解時の基本点に加え、3連続正解以降は連続正解数に応じたボーナスを加算します。
- ゲーム終了時は、同じレベルで即再開する `もう一度始める` と、開始画面へ戻る `トップへ戻る` を表示します。
- ゲーム終了時に `Best Score` または `Best Streak` を更新した場合は、専用の祝福演出と専用音を表示します。
- `Best Score` と `Best Streak` の両方を更新した場合は、単独更新より強い演出にします。
- ゲーム開始後は Question 枠を優先し、レベル選択とルール表示は隠します。
- Google 翻訳と Weblio の外部確認リンクは、回答後に下部表示し別タブで開きます。
- 生成済みの大規模JSONは成果物です。構造変更や再生成方針がない限り、直接の手編集は避けてください。

## 4. 主要ディレクトリ

- Nuxt 4 標準構成に合わせて、アプリ本体は `app/`、共有型は `shared/` を基準に扱います。

- `app/pages/index.vue`
  - 単一画面のゲームUI
- `app/composables/useTraditionalTrainer.ts`
  - ゲーム状態、出題進行、レベル切替
- `app/utils/trainer.ts`
  - 出題ロジック、4択生成、出題重み付け
- `app/utils/pronunciation.ts`
  - ピンイン整形とカタカナ補助生成
- `app/utils/vocabulary.ts`
  - 語彙ロードと検証
- `shared/types/vocabulary.ts`
  - 型定義
- `scripts/generate-vocabulary.mjs`
  - 大規模辞書生成
- `scripts/setup-data.mjs`
  - Public リポジトリ向けの辞書取得・生成・監査セットアップ
- `scripts/lib/`
  - 辞書ソース読み込み、候補合成、editorial record 統合、公開デッキ生成、品質シグナル判定
- `scripts/validate-vocabulary.mjs`
  - 語彙整合性チェック
- `scripts/audit-vocabulary-quality.mjs`
  - 教材ラベル品質の粗い監査
- `scripts/export-vocabulary-review-batch.mjs`
  - レビュー対象候補の JSONL 書き出し
- `scripts/apply-vocabulary-review-results.mjs`
  - レビュー結果の `editorial-overrides` 反映
- `data/manual-vocabulary.json`
  - seed deck と発音補完
- `data/editorial-overrides.json`
  - 自動候補の採否と教材ラベル補正
- `data/review-batches/`
  - ローカルレビュー用の一時生成物
- `data/source-snapshots/`
  - ローカル取得した外部辞書ソース
- `data/vocabulary-candidates.json`
  - レビュー用の中間候補
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
- 今後の UI 変更は、Apple の Human Interface Guidelines と Apple Design の方針を参照し、その文法をできる限り踏襲してください。
  - https://developer.apple.com/design/human-interface-guidelines
  - https://developer.apple.com/design
- UI を新規追加または改修する場合は、少なくとも以下の要素を既存画面と統一してください。
  - カラーシステム
  - タイポグラフィ
  - 余白・間隔
  - 角丸
  - 影の効果
  - ボタンやカードなどのコンポーネント設計
  - アクセシビリティ配慮
- Apple 寄りの UI 方針として、以下を守ってください。
  - 色は少数の design token で管理し、通常状態の panel / card / button で同じトーンを共有する
  - タイポグラフィは階層を明確にし、見出し・補助ラベル・数値・本文の役割を混ぜない
  - 余白は 8pt 系のリズムを基本にし、近接・関連・区切りを余白で表現する
  - 角丸は token 化し、親より子を少し小さくして調和を保つ
  - 影は薄く抑え、情報の区切りは影よりも面差と境界線で作る
  - primary / secondary button の役割差を常に明確にする
  - card は情報整理の単位として扱い、不要な装飾で性格を増やしすぎない
  - `focus-visible`、十分なコントラスト、44px 以上の操作領域、`prefers-reduced-motion` を前提にする
- ただし、ゲーム中の正誤フィードバックのような状態変化は例外です。通常状態より少し強い色・影・アニメーションを使ってよいですが、通常時の文法を壊さない範囲に留めてください。
- 既存の1ページ構成を崩す場合は、理由が明確なときだけにしてください。
- データ量が大きいので、クライアントバンドル肥大化には注意してください。
- Public リポジトリには生成済み辞書データをコミットしないでください。
- このリポジトリのコミットメッセージは、要点が分かる日本語1行で記述してください。
- 語彙ロードは、可能な限り「必要なレベルだけ読む」形を維持してください。
- レベル切替や初期化の非同期処理では、古いリクエストが新しい state を上書きしないようにしてください。
- 音声や効果音を変更する場合は、ブラウザ標準APIで完結するかを優先してください。
- 読み方のカタカナ表記は補助情報です。発音の完全再現を前提にしないでください。

## 6. 繁体字・語彙データ方針

- UI や出題データに簡体字を混入させないでください。
- 台湾華語寄りの語彙を優先してください。
- 日本語訳は「辞書として完璧」より「学習ゲームとして自然で分かりやすい」を優先します。
- ただし、意味を誤らせる訳は避けてください。
- 重要語の追加や発音補完は `data/manual-vocabulary.json` に入れ、既存候補の採否や日本語ラベル補正は `data/editorial-overrides.json` に入れてください。
- 生成スクリプトを変えた場合は、再生成後に必ず検証を実行してください。
- コードのライセンスと辞書データの権利は分離してください。辞書生成や再配布に関わる変更では `NOTICE.md` も確認してください。

## 7. 生成物の扱い

- 手で編集してよいファイル:
  - `app/pages/`
  - `app/components/`
  - `app/composables/`
  - `app/utils/`
  - `app/assets/`
  - `shared/types/`
  - `scripts/`
  - `docs/`
  - `data/manual-vocabulary.json`
  - `data/editorial-overrides.json`
- 原則として手で編集しないファイル:
  - `data/vocabulary-candidates.json`
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

語彙レビュー:

```bash
npm run review:vocab:export -- --limit=500
npm run review:vocab:apply -- /path/to/review-results.json
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
- 語彙や訳の問題なら、seed 追加は `manual-vocabulary`、既存候補の採否や訳修正は `editorial-overrides` で解決できるか確認する
- 語彙品質改善の続きなら、`docs/superpowers/plans/2026-04-11-truth-first-vocabulary-quality.md` で現在地を確認する
- 選択肢に壊れた日本語が出る問題なら、まず公開済み `data/vocabulary*.json` 全体の `ja` を横断監査し、誤答候補プールの地雷を先に除去する
- metadata のような補助データが壊れても、ゲーム本体まで巻き込んで停止させない設計を優先する
- Public 公開に関わる変更なら、生成済み辞書データをコミットしていないか確認する
- パフォーマンスに影響する場合、バンドルへ大きいデータを直接含めていないか確認する
- 音声やブラウザAPIに関わる変更なら、SSR 時に安全かを確認する

## 10. ドキュメント同期ルール

- エージェントがコード、設定、コマンド、運用方針、機能仕様を変更した場合、その変更に関連する Markdown 文書も同じ作業内で最新化してください。
- 対象は少なくとも `README.md`、`AGENTS.md`、`docs/` 配下の関連文書です。
- すべての Markdown を毎回機械的に更新するのではなく、変更内容に影響する文書だけを更新してください。
- 文書更新が不要と判断した場合は、その判断が妥当かを一度確認してください。
- `docs/superpowers/` は作業計画と設計メモを置く場所です。採用中の文書は詳細仕様や作業再開手順として参照しますが、現行仕様の確認ではコード、`README.md`、`AGENTS.md`、`docs/dictionary-sources.md` を優先してください。
- `docs/superpowers/` 配下に履歴文書や不採用案を残す場合は、各ファイル冒頭の `Status` 表記で `採用中` `実装済み` `履歴` `不採用` `revert 済み` などを明示し、現行文書と混同されないようにしてください。
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

語彙レビュー結果だけを反映した場合:

```bash
npm run generate:data
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
- `/review` の既定動作は「レビュー結果の提示」で終わりではなく、「レビュー -> 修正判断 -> 実装修正 -> 検証 -> 報告」までを同一ターンで完了することです。
- ユーザーがレビュー結果を貼り付けて修正可否を尋ねた場合も、これは `/review` の継続処理として扱ってください。
- `/review` の後、指摘事項が具体的に修正可能である限り、原則として確認待ちにせず自動で修正まで進めてください。
- `/review` の後、軽微・局所的・低リスクに見える指摘は、必ず自動で修正まで進めてください。
- `/review` の後、複数件の指摘がある場合も、「1件ずつ確認を取る」運用を禁止します。修正可能なものはまとめて修正してください。
- `/review` の後、ユーザーが「修正すべきか判断して必要であれば修正してください」と求めている場合、これは自動修正の明示許可です。追加確認なしで修正まで完了してください。
- `/review` の後、修正可能な指摘があるのに、レビューコメントの転載や要約だけで応答を終えることを禁止します。少なくとも、修正着手か、修正不能理由の具体説明のどちらかまで進めてください。
- `/review` の後、実装修正方針が一意に決まり、既存仕様から自然に導ける場合は、ユーザー確認を挟かずにそのまま修正してください。
- `/review` の後、以下に当てはまる場合に限り、修正前の確認を許可します。
  - 仕様変更が複数案あり、どれを選ぶかでユーザー体験が変わる
  - 既存データの破壊、互換性喪失、公開API変更、永続データ移行が発生しうる
  - 指摘内容がレビュー本文だけでは不十分で、実装修正方針を一意に決められない
  - ユーザーの既存変更と衝突しており、どちらを優先するか判断できない
- 上記の確認条件に当てはまらない限り、「影響範囲が広そう」「UI挙動に関わる」だけを理由に確認へ逃げてはいけません。まず安全な修正案を実装してください。
- `/review` の後、確認を求める場合は「どの条件に該当するため確認が必要なのか」を明示してください。条件名なしの確認要求を禁止します。
- `/review` の指摘を自動修正しなかった場合は、なぜ自動修正できなかったのかを具体的に説明してください。「仕様判断が必要」の一言だけで終えてはいけません。
- `/review` の指摘を一部だけ修正した場合は、「修正した項目」と「未修正の項目」を分け、未修正側には具体理由と次の判断条件を書いてください。
- `/review` の修正では、必要なコード変更、テスト追加、関連ドキュメント更新をまとめて実施してください。途中で止めないでください。
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
- 今後の品質改善は、`data/editorial-overrides.json` のレビューサイクル、`data/manual-vocabulary.json` の重要語 seed 追加、生成ルールの改善の順で進めるのが安全です。
