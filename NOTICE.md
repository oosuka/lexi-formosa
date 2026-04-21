# NOTICE

このリポジトリのコード部分は [LICENSE](LICENSE) に記載した MIT License で提供します。辞書データおよびそこから生成される語彙 JSON は第三者データに依存するため、MIT License の対象外です。

## Data Separation

- 生成済み辞書データは再配布リスクを避けるため同梱しません。
- 利用者は `npm run setup:data` を実行し、外部ソースを各自の環境で取得して語彙データを生成します。
- `data/manual-vocabulary.json` は、このリポジトリ側で管理する手入力 seed データです。保持するのは `id / trad / ja / category / pronunciation?` のみで、再計算可能な項目は含めません。
- `MJdic` は日本語候補と発音補完の補助に使いますが、公開デッキの単独採用根拠にはしません。

## Referenced Sources

- TOCFL / TBCL related vocabulary source: `https://raw.githubusercontent.com/PSeitz/tocfl/main/tocfl_words.json`
- MJdic: `https://raw.githubusercontent.com/code4fukui/MJdic/main/cedict_ts.csv`
- CC-CEDICT: `https://cc-cedict.org/`

## Redistribution Caution

生成された `data/vocabulary*.json` および `public/wordlists/*.json` を再配布する場合は、各データソースのライセンス、帰属表示、継承条件、利用条件を利用者自身で確認してください。この文書は法的助言ではありません。
