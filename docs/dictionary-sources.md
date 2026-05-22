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
  - 用途: 日本語訳候補と発音の補助
- `data/manual-vocabulary.json`
  - 用途: 必ず入れたい高品質 seed、発音補完
  - 形式: `id / trad / ja / category / pronunciation?` のみを保持し、`level / length / sources / taiwanPriority` は生成時に再計算
  - 運用: 自動生成で拾いにくいが教材として重要な語はここに追加
- `scripts/lib/vocabulary-candidate-pipeline.mjs` の preferred-label map
  - 用途: ごく少数の基礎語や false friend に対して、日本語ラベルを固定
  - 運用: `data/manual-vocabulary.json` とは別の小さな静的補正層として維持

## Policy

- UI と出題データに簡体字を混入させません。
- Level は `1文字 / 2文字 / 3文字以上` で判定し、Level 3 は実用性の高い語に絞ります。
- 公開デッキは TOCFL/TBCL を根拠にできる候補だけを対象にし、MJdic 単独候補は公開しません。
- 日本語訳は単一ソースをそのまま使わず、複数候補を正規化・採点して選びます。
- 現行の日本語決定は完全自動ではなく、上記 preferred-label map に入っている少数語だけ静的補正を優先します。
- 生成時の hard gate は簡体字混入、記号だけ、参照・略語・分類詞メタ、MJdic 単独根拠など誤爆しにくい条件に絞ります。
- 英字ラベル、説明文風ラベル、姓っぽいラベル、同一訳過多などは自動除外せず、`npm run audit:data` の監査結果でレビューします。
- `data/vocabulary-candidates.json` には publishable 判定と却下理由を残し、落選理由を追跡できるようにします。
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
npm run audit:data
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

`npm run audit:data` は公開語彙を止める検証ではなく、怪しい日本語ラベルをレビューするための補助です。結果は `data/review-batches/vocabulary-audit.json` に出力し、生成物として Git 管理対象にしません。
