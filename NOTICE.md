# NOTICE

このリポジトリのコード部分は [LICENSE](LICENSE) に記載した MIT License で提供します。

ただし、辞書データおよびそこから生成される語彙 JSON はコードと別扱いです。これらは第三者データに依存しており、MIT License の対象外です。

## Data Separation

- リポジトリには、再配布リスクを避けるため生成済み辞書データを同梱しません。
- 利用者は `npm run setup:data` を実行して、外部ソースを各自の環境へ取得し、ローカルで語彙データを生成してください。
- `data/manual-vocabulary.json` はこのリポジトリ側で管理する手修正語彙です。
- `data/editorial-overrides.json` はこのリポジトリ側で管理する採否・日本語ラベル補正データです。

## Referenced Sources

- TOCFL / TBCL related vocabulary source
  - Current fetch target: `https://raw.githubusercontent.com/PSeitz/tocfl/main/tocfl_words.json`
  - The repository does not currently expose a GitHub-detected license.
  - The upstream dataset is described there as being based on official TOCFL / TBCL resources.
- MJdic
  - Current fetch target: `https://raw.githubusercontent.com/code4fukui/MJdic/main/cedict_ts.csv`
  - The repository README states that the dictionary data is based on CC-CEDICT and that Japanese translations were added there.
- CC-CEDICT
  - Upstream site: `https://cc-cedict.org/`
  - CC-CEDICT is distributed under CC BY-SA.

## Redistribution Caution

- 生成された `data/vocabulary*.json` および `public/wordlists/*.json` を再配布する場合は、利用者自身で各データソースのライセンス、帰属表示、継承条件、利用条件を確認してください。
- このリポジトリは法的助言を提供するものではありません。公開配布や商用利用の最終判断が必要な場合は、適切な法務確認を行ってください。
