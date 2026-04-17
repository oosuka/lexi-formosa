# Dictionary Sources

大量語彙は、公開データをローカルで加工して生成します。
Public リポジトリには生成済み辞書データを同梱しません。
実行時は `public/wordlists/vocabulary-level-*.json` と `public/wordlists/metadata.json` を読み込み、元の統合データは `data/` 配下に保持します。
ただし、`data/vocabulary*.json`、`public/wordlists/*.json`、外部ソーススナップショットはローカル生成物であり、Git 管理対象にはしません。

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

- `npm run setup:data` は、外部ソース取得、語彙生成、基本整合性チェックまでをまとめて行う Public リポジトリ向け初回セットアップです。
- `TBCL` や辞典ソースは `*_SOURCE_PATH` を優先し、取得 URL が安定している場合のみ `*_SOURCE_URL` を使います。
- TOCFL ソースは通常の JSON 配列形式と JSONL 形式の両方を受け付けます。
- 自動生成データでは、簡体字や記号混じりの見出しは除外します。
- TOCFL 由来データは 1-4文字を取り込み対象にし、Level 1 の 1文字語も含めます。
- 公開デッキは `Level 1-2` で `TOCFL/TBCL` を根拠にできる候補を優先し、`Level 3` は `MJdic` を根拠にできる 5-6文字候補を中心に組み立てます。
- 日本語訳は機械翻訳起源のため、完全ではありません。
- 重要語の seed は `data/manual-vocabulary.json`、既存候補の採否や日本語ラベル補正は `data/editorial-overrides.json` で管理します。
- `data/vocabulary-candidates.json` は語彙生成時の中間成果物です。
- 発音情報は取得できるものだけを保持します。UI ではピンインとカタカナ補助を表示します。
- 単語音声は辞書データに音声ファイルを同梱せず、ブラウザの `SpeechSynthesis` を使って再生します。
- `data/vocabulary*.json` と `public/wordlists/*.json` は生成物なので、直接編集しないでください。
- `data/vocabulary*.json` と `public/wordlists/*.json` は Git 管理対象にせず、各環境で生成してください。
- `metadata.json` はレベルごとの登録語数表示に使います。
- 実行時の `public/wordlists/*.json` 取得は Nuxt の `app.baseURL` を考慮します。
- `metadata.json` が欠けている場合でも、語彙ファイルがあればゲーム本体は動く設計です。
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

再生成後は、少なくとも次を実行してください。

```bash
npm run check:data
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```
