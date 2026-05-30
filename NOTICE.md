# NOTICE

この文書は、`lexi-formosa` を fork / clone してローカルで遊ぶ人が、コードと辞書データの扱いを混同しないための注意書きです。法的助言ではありません。

## License Scope

- このリポジトリのソースコード、設定、ドキュメント、テストは、特記がない限り [LICENSE](LICENSE) に記載した MIT License で提供します。
- npm 依存パッケージはこのリポジトリに再ライセンスされません。各パッケージのライセンスに従ってください。
- 辞書データ、外部ソーススナップショット、生成済み語彙 JSON は、第三者データに依存するため MIT License の対象外です。
- `data/manual-vocabulary.json` はこのリポジトリ側で管理する手入力 seed データです。ただし、生成済み語彙に混ぜた出力物は外部ソース由来データと一体になるため、出力物全体については下記の第三者データ条件を確認してください。

## Data Separation

- 生成済み辞書データは再配布リスクを避けるため同梱しません。
- 外部ソーススナップショットは `data/source-snapshots/` にローカル保存されますが、Git 管理対象にしません。
- 利用者は `npm run setup:data` を実行し、外部ソースを各自の環境で取得して語彙データを生成します。
- `data/review-batches/*.json` は生成済み語彙から作るレビュー補助データであり、生成済み辞書データと同じく同梱しません。
- `data/manual-vocabulary.json` は、このリポジトリ側で管理する手入力 seed データです。保持するのは `id / trad / ja / category / pronunciation?` のみで、再計算可能な項目は含めません。
- `MJdic` は日本語候補と発音補完の補助に使いますが、公開デッキの単独採用根拠にはしません。

## Referenced Sources

- TOCFL / TBCL related vocabulary source
  - Default URL: `https://raw.githubusercontent.com/PSeitz/tocfl/main/tocfl_words.json`
  - Upstream repository: `https://github.com/PSeitz/tocfl`
  - The upstream repository describes the dataset as based on files linked from the official TOCFL / COCT / NAER site. No repository-level license file was found when this notice was last checked.
  - Treat this source as third-party reference data with redistribution terms that must be checked separately before publishing generated outputs.
- TBCL
  - Optional input: `TBCL_SOURCE_PATH` / `TBCL_SOURCE_URL`
  - Official site: `https://bcoct.naer.edu.tw/TBCL/`
  - The official TBCL page states that the system includes word lists and displays a National Academy for Educational Research copyright notice. Do not assume generated TBCL-derived data is freely redistributable without confirming the applicable terms or permission.
- MJdic
  - Default URL: `https://raw.githubusercontent.com/code4fukui/MJdic/main/cedict_ts.csv`
  - Upstream repository: `https://github.com/code4fukui/MJdic`
  - The repository license file is MIT for the MJdic project code, but the README states that dictionary data is from CC-CEDICT and that Japanese translations were added using DeepLAPI.
- CC-CEDICT
  - Official wiki: `https://cc-cedict.org/wiki/`
  - The CC-CEDICT wiki states that CC-CEDICT is licensed under Creative Commons Attribution-ShareAlike 3.0.
  - If generated outputs include CC-CEDICT-derived content, redistribution may require attribution, license notice, change indication where applicable, and ShareAlike-compatible distribution terms.

## Redistribution Caution

fork / clone してローカルで実行するだけなら、通常はこのリポジトリが生成済み辞書データを配布しない方針で足ります。一方で、次の行為をする場合は追加確認が必要です。

- 生成された `data/vocabulary*.json`、`data/review-batches/*.json`、`public/wordlists/*.json` を GitHub、npm、Web サイト、アプリ配布物などへ含める
- `data/source-snapshots/*` や外部から取得した元データを再配布する
- 生成済み語彙を改変して別ライセンスで配布する
- 商用サービスや公開 API で生成済み語彙を提供する

再配布する場合は、少なくとも各データソースのライセンス、帰属表示、継承条件、利用条件、変更表示、無保証表示を利用者自身で確認してください。特に CC-CEDICT 由来データが含まれる場合は ShareAlike 条件に注意してください。

## Practical Guidance

- Public リポジトリには生成済み辞書データをコミットしないでください。
- `npm run setup:data` はローカル実行用の取得・生成コマンドとして扱ってください。
- 生成済み語彙を配布したい場合は、配布物に第三者データの帰属表示とライセンス情報を同梱し、必要に応じて権利者または専門家に確認してください。
- 外部ソースの URL、ライセンス、利用条件は変更される可能性があります。配布前に必ず最新の一次情報を確認してください。
