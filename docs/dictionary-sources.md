# Dictionary Sources

大量語彙は、公開データをローカルで加工して生成します。
Public リポジトリには生成済み辞書データを同梱しません。
実行時は `public/wordlists/vocabulary-level-*.json` と `public/wordlists/metadata.json` を読み込み、元の統合データは `data/` 配下に保持します。
ただし、`data/vocabulary*.json`、`public/wordlists/*.json`、外部ソーススナップショット、レビュー用バッチはローカル生成物であり、Git 管理対象にはしません。

## Current Sources

- TOCFL word list
  - URL: `https://raw.githubusercontent.com/PSeitz/tocfl/main/tocfl_words.json`
  - Role: 台湾華語寄りの出題対象を広く確保
- TBCL
  - File or URL: `TBCL_SOURCE_PATH` / `TBCL_SOURCE_URL`
  - Role: 台湾華語能力基準による補助レベル判定
- MJdic / CC-CEDICT Japanese translation
  - URL: `https://raw.githubusercontent.com/code4fukui/MJdic/main/cedict_ts.csv`
  - Role: 日本語訳候補を補完
- Manual seed
  - File: `data/manual-vocabulary.json`
  - Role: 初級の重要語、訳の微修正、発音補完
- Editorial override
  - File: `data/editorial-overrides.json`
  - Role: 自動候補の採否と教材用日本語ラベルの補正

## Notes

- `npm run setup:data` は、外部ソース取得、語彙生成、基本整合性チェック、カード品質監査までをまとめて行う Public リポジトリ向け初回セットアップです。
- `setup:data` では validation エラーは失敗扱いですが、`audit:data` の出力は品質改善候補の警告として扱います。
- `TBCL` や辞典ソースは `*_SOURCE_PATH` を優先し、取得 URL が安定している場合のみ `*_SOURCE_URL` を使います。
- TOCFL ソースは通常の JSON 配列形式と JSONL 形式の両方を受け付けます。
- 自動生成データは品質優先でフィルタし、簡体字や記号混じりの見出しは除外します。
- TOCFL 由来データは 1-4文字を取り込み対象にし、Level 1 の 1文字語も含めます。
- 公開デッキは `Level 1-2` で `TOCFL/TBCL` を根拠にできる候補を優先し、`Level 3` は `MJdic` を根拠にできる 5-6文字候補を中心に組み立てます。
- 日本語訳は機械翻訳起源のため、完全ではありません。
- 重要語の seed は `data/manual-vocabulary.json`、既存候補の採否や日本語ラベル補正は `data/editorial-overrides.json` で管理します。
- `data/vocabulary-candidates.json` はレビュー用の中間成果物で、`npm run review:vocab:export -- --limit=500`、`npm run review:vocab:export -- --level=3 --risk-only --limit=200`、`npm run review:vocab:export -- --level=3 --limit=50` の入力になります。
- 既定の review batch は `Level 1-2` の未レビュー候補と低信頼候補を対象にし、既に `data/editorial-overrides.json` にある語は除外します。
- `data/manual-vocabulary.json` 由来の seed 語彙は curated seed として扱い、通常の review batch には出しません。
- Level 3 は Truth-first Challenge Deck として残し、`--level=3 --risk-only` では固有名詞・説明文ラベル・13文字以上の日本語ラベルを優先して書き出します。
- review batch の結果は `npm run review:vocab:apply -- /path/to/review-results.json` で `data/editorial-overrides.json` に反映します。
- 語彙品質改善の現在地は `AGENTS.md`、`README.md`、この文書の現行記述を優先して確認します。ローカルに `docs/superpowers/` がある場合だけ、作業メモとして参照して構いません。
- 選択肢に壊れた日本語が出る場合は、通常の 500 件順次レビューより先に、公開済み `data/vocabulary*.json` 全体の `ja` を横断監査して `editorial-overrides` へ反映してください。
- 発音情報は取得できるものだけを保持します。UI ではピンインとカタカナ補助を表示します。
- 単語音声は辞書データに音声ファイルを同梱せず、ブラウザの `SpeechSynthesis` を使って再生します。
- `data/vocabulary*.json` と `public/wordlists/*.json` は生成物なので、直接編集しないでください。
- `data/vocabulary*.json` と `public/wordlists/*.json` は Git 管理対象にせず、各環境で生成してください。
- `metadata.json` はレベルごとの登録語数表示に使います。
- 実行時の `public/wordlists/*.json` 取得は Nuxt の `app.baseURL` を考慮します。
- `metadata.json` が欠けている場合でも、語彙ファイルがあればゲーム本体は動く設計です。
- 日本語カード品質の粗い候補は `npm run audit:data` で確認できます。
- `audit:data` は、辞書内リンクの残骸である `〜を参照` 系ラベルと、確認済みの壊れた MJdic 由来ラベルも検出します。
- `audit:data` は Level 3 の固有名詞寄りラベル、説明文ラベル、13文字以上のラベルも review queue として出力します。これらは即時失敗ではなく、Truth-first review の優先順位付けに使います。固有名詞寄りシグナルは、地名・大学・企業・事件などを優先し、`夜市`、`市場`、`クラブサンド`、`組織委員会` のような一般語は過検出しないように調整します。
- データ再配布の扱いは [NOTICE.md](../NOTICE.md) を確認してください。

## Rebuild

初回は次の 1 コマンドで取得と生成をまとめて実行できます。

```bash
npm run setup:data
```

ソースファイルを手元に置いて個別に再生成したい場合は、次を実行します。

```bash
TOCFL_SOURCE_PATH=/path/to/tocfl_words.json \
MJDIC_SOURCE_PATH=/path/to/mjdic.csv \
npm run generate:data
```

`TBCL` や将来追加する辞典系ソースをローカルに置く場合も同じ考え方で扱います。

```bash
TOCFL_SOURCE_PATH=/path/to/tocfl_words.json \
MJDIC_SOURCE_PATH=/path/to/mjdic.csv \
TBCL_SOURCE_PATH=/path/to/tbcl_words.json \
npm run setup:data
```

低信頼候補や未レビュー候補をレビューする場合は、生成後に次を実行します。

```bash
npm run review:vocab:export -- --level=3 --risk-only --limit=200
npm run review:vocab:export -- --limit=500
npm run review:vocab:export -- --level=3 --limit=50
npm run review:vocab:apply -- /path/to/review-results.json
```

Level 3 high-risk batch は、固有名詞クイズ、説明文ラベル、長すぎる日本語ラベルを通常レビューより先に除去・補正するための queue です。
Level 1-2 通常レビューが空になった後は、`--level=3 --limit=50` で Level 3 low-risk Challenge 候補を少量ずつ確認します。
`--limit=500` は技術上の上限ではありません。`1000` 件以上も指定できますが、誤訳や reject 対象を安全に確認する単位としては Level 3 high-risk は 200 件、Level 1-2 通常レビューは 500 件、Level 3 low-risk は 50 件を推奨します。
レビュー作業の現在地と再開手順は `AGENTS.md`、`README.md`、この文書の現行記述を参照してください。

再生成後は、少なくとも次を実行してください。

```bash
npm run check:data
npm run audit:data
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```
