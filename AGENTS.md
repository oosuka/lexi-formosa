# AGENTS.md

このリポジトリで作業する人間およびエージェント向けの運用ガイドです。ユーザー向け説明、進捗報告、レビュー結果は日本語で行ってください。

## プロジェクト方針

- `lexi-formosa` は、台湾で使われる繁体字の単語を日本語4択で学ぶローカル向け Web ゲームです。
- UI と出題データに簡体字を表示しないでください。
- 出題対象は単語のみです。文章・例文は出しません。
- Public リポジトリには生成済み辞書データを同梱しません。
- 実行時は `public/wordlists/*.json` をレベル単位で遅延読み込みします。
- `metadata.json` は補助表示用です。取得失敗だけでゲーム本体を止めないでください。

## 実装メモ

- フレームワーク: Nuxt 4 / Vue 3
- ランタイム: Node.js 24 LTS / npm
- ツール: Volta / Biome 2 / TypeScript / Zod / Vitest / Playwright
- 主要画面: `app/pages/index.vue`
- ゲーム状態: `app/composables/useTraditionalTrainer.ts`
- UI 派生状態: `app/composables/useTrainerSessionUi.ts`
- 出題ロジック: `app/utils/trainer.ts`
- 語彙ロード: `app/utils/vocabulary.ts`
- 語彙生成: `scripts/generate-vocabulary.mjs` と `scripts/lib/`
- 共有型: `shared/types/vocabulary.ts`

## ゲーム仕様

- Level 1 は 1-2文字、Level 2 は 3-4文字、Level 3 は 5-6文字を中心にします。
- Level 1 では 1文字語も対象に含めます。
- 正解で基本点を加算し、3連続正解以降はボーナスを加算します。
- 3回連続で不正解になるとセッションを終了します。
- 不正解時の結果帯は `正解は「xxx」です。残りn回で終了します。` の形にします。
- 開始画面には Level 1-3 ごとの最高 `Score / Streak` を表示し、`localStorage` に保存します。
- ゲーム終了後は `もう一度始める` と `トップへ戻る` を表示します。
- Google 翻訳と Weblio の外部確認リンクは、回答後に別タブで開きます。
- 単語音声はブラウザの `SpeechSynthesis`、効果音は `Web Audio API` を使います。外部 TTS は前提にしません。

## UI 方針

- 既存の1ページ構成と「シンプルでモダン」な文法を維持してください。
- 色、タイポグラフィ、余白、角丸、影、ボタンの役割を既存画面と揃えてください。
- `focus-visible`、十分なコントラスト、44px 以上の操作領域、`prefers-reduced-motion` を前提にしてください。
- 正誤フィードバックは通常状態より強くしてよいですが、通常時の文法を壊さない範囲に留めてください。
- UI 変更では Apple Human Interface Guidelines と Apple Design の考え方を参照してください。

## 開発ルール

- 既存の設計意図を崩さず、小さく安全に変更してください。
- 無関係なリファクタ、命名変更、広範な整形を混ぜないでください。
- GitHub の公開リポジトリ名と npm package 名は `lexi-formosa` を前提にしてください。
- Public リポジトリとして公開しやすい構成を維持してください。
- このリポジトリのコミットメッセージは、要点が分かる日本語1行で記述してください。
- 語彙ロードは、可能な限り必要なレベルだけ読む形を維持してください。
- レベル切替や初期化の非同期処理では、古いリクエストが新しい state を上書きしないようにしてください。
- 音声や効果音を変更する場合は、ブラウザ標準 API で完結するか、SSR 時に安全かを確認してください。
- 読み方のカタカナ表記は補助情報です。発音の完全再現を前提にしないでください。

変更提案の優先順位:

1. 正しさ
2. 繁体字・台湾華語方針の維持
3. 学習体験の分かりやすさ
4. パフォーマンス
5. 実装の単純さ

## 語彙データ

- 語彙生成は `TOCFL + TBCL + MJdic + manual vocabulary + editorial override` を合成する方式です。
- `data/manual-vocabulary.json` は seed deck と発音補完に使います。
- `data/editorial-overrides.json` は自動候補の採否と教材用日本語ラベル補正に使います。
- 日本語訳は、辞書としての完全性より学習ゲームとして自然で分かりやすいことを優先します。ただし誤解を招く訳は避けてください。
- 生成物の直接手編集は避け、`npm run setup:data` または `npm run generate:data` で再生成してください。
- 辞書や再配布に関わる変更では [NOTICE.md](NOTICE.md) と [docs/dictionary-sources.md](docs/dictionary-sources.md) を確認してください。

原則として手で編集しない生成物:

- `data/vocabulary-candidates.json`
- `data/vocabulary.json`
- `data/vocabulary-metadata.json`
- `data/vocabulary-level-*.json`
- `public/wordlists/vocabulary-level-*.json`
- `public/wordlists/metadata.json`

## テスト方針

- 本質テストを優先してください。出題ロジック、状態遷移、語彙検証、非同期失敗時の継続、主要なゲーム導線を守ります。
- CSS クラス、細かな配置、重複した表示構造だけを固定するテストは避けてください。
- UI の主要導線を変えた場合は Playwright で最小 E2E を確認してください。

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
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

UI の主要導線や E2E を変更した場合:

```bash
npm run lint
npm run test:unit
npm run test:e2e
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

## ドキュメント同期

コード、設定、コマンド、運用方針、機能仕様を変えた場合は、関連する Markdown も同じ作業内で更新してください。

- 使い方や挙動が変わる場合: `README.md`
- 作業ルールや検証手順が変わる場合: `AGENTS.md`
- 辞書、生成、データソースが変わる場合: `docs/dictionary-sources.md`
- 権利や再配布注意が変わる場合: `NOTICE.md`

## レビュー方針

- `/review` 相当の出力は日本語で行い、重大度順にバグ、回帰リスク、仕様漏れ、テスト不足を指摘してください。
- 指摘には可能な限りファイルパスと行番号を含めてください。
- 具体的に修正可能な指摘は、確認待ちにせず修正、検証、報告まで進めてください。
- 仕様選択、互換性喪失、データ破壊、ユーザー変更との衝突がある場合だけ、理由を明示して確認してください。

## 避けること

- 簡体字を UI や出題語彙に出すこと
- 生成 JSON を根本原因の確認なしに手修正すること
- 大規模辞書を直接 `import` して初期バンドルを肥大化させること
- 外部依存の重い音声サービスを前提にすること
- 英語ベースでユーザー向け説明を書くこと
