# Dictionary Sources

大量語彙は、公開データをローカルで加工して生成します。
Public リポジトリには生成済み辞書データを同梱しません。
実行時は `public/wordlists/vocabulary-level-*.json` と `public/wordlists/metadata.json` を読み込み、元の統合データは `data/` 配下に保持します。

## Current Sources

- TOCFL word list
  - URL: `https://raw.githubusercontent.com/PSeitz/tocfl/main/tocfl_words.json`
  - Role: 台湾華語寄りの出題対象を広く確保
- MJdic / CC-CEDICT Japanese translation
  - URL: `https://raw.githubusercontent.com/code4fukui/MJdic/main/cedict_ts.csv`
  - Role: 日本語訳候補を補完
- Manual seed
  - File: `data/manual-vocabulary.json`
  - Role: 初級の重要語、訳の微修正、発音補完

## Notes

- `npm run setup:data` は、外部ソース取得、語彙生成、基本整合性チェック、カード品質監査までをまとめて行う Public リポジトリ向け初回セットアップです。
- `setup:data` では validation エラーは失敗扱いですが、`audit:data` の出力は品質改善候補の警告として扱います。
- 自動生成データは品質優先でフィルタし、簡体字や記号混じりの見出しは除外します。
- TOCFL 由来データは 1-4文字を取り込み対象にし、Level 1 の 1文字語も含めます。
- 日本語訳は機械翻訳起源のため、完全ではありません。
- 重要語は `data/manual-vocabulary.json` で上書きして品質を補います。
- 発音情報は取得できるものだけを保持します。UI ではピンインとカタカナ補助を表示します。
- 単語音声は辞書データに音声ファイルを同梱せず、ブラウザの `SpeechSynthesis` を使って再生します。
- `data/vocabulary*.json` と `public/wordlists/*.json` は生成物なので、直接編集しないでください。
- `data/vocabulary*.json` と `public/wordlists/*.json` は Git 管理対象にせず、各環境で生成してください。
- `metadata.json` はレベルごとの登録語数表示に使います。
- `metadata.json` が欠けている場合でも、語彙ファイルがあればゲーム本体は動く設計です。
- 日本語カード品質の粗い候補は `npm run audit:data` で確認できます。
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

再生成後は、少なくとも次を実行してください。

```bash
npm run check:data
npm run audit:data
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```
