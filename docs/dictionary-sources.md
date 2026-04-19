# Dictionary Sources

大量語彙は公開データをローカルで加工して生成します。生成済みの `data/vocabulary*.json`、`public/wordlists/*.json`、外部ソーススナップショットは Git 管理対象にしません。

## Sources

- TOCFL word list
  - URL: `https://raw.githubusercontent.com/PSeitz/tocfl/main/tocfl_words.json`
  - 用途: 台湾華語寄りの出題候補を確保
- TBCL
  - 指定: `TBCL_SOURCE_PATH` / `TBCL_SOURCE_URL`
  - 用途: 台湾華語能力基準による補助レベル判定
- MJdic / CC-CEDICT Japanese translation
  - URL: `https://raw.githubusercontent.com/code4fukui/MJdic/main/cedict_ts.csv`
  - 用途: 日本語訳候補の補完
- `data/manual-vocabulary.json`
  - 用途: 初級重要語、訳の微修正、発音補完
- `data/editorial-overrides.json`
  - 用途: 自動候補の採否と教材用日本語ラベル補正

## Policy

- UI と出題データに簡体字を混入させません。
- TOCFL 由来データは 1-4文字を取り込み、Level 1 の 1文字語も対象にします。
- 公開デッキは、Level 1-2 では TOCFL/TBCL を根拠にできる候補を優先し、Level 3 では MJdic を根拠にできる 5-6文字候補を中心にします。
- 日本語訳は、学習ゲームとして自然で分かりやすい表現を優先します。
- 発音情報は取得できるものだけ保持し、UI ではピンインとカタカナ補助を表示します。
- 単語音声は辞書データに同梱せず、ブラウザの `SpeechSynthesis` で再生します。
- データ再配布の扱いは [NOTICE.md](../NOTICE.md) を確認してください。

## Rebuild

初回セットアップ:

```bash
npm run setup:data
```

ローカルソースを指定して再生成する例:

```bash
TOCFL_SOURCE_PATH=/path/to/tocfl_words.json \
MJDIC_SOURCE_PATH=/path/to/mjdic.csv \
TBCL_SOURCE_PATH=/path/to/tbcl_words.json \
npm run generate:data
```

再生成後の確認:

```bash
npm run check:data
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```
