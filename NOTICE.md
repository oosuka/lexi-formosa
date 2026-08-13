# NOTICE

この文書は、`lexi-formosa` を fork / clone してローカルで遊ぶ人が、コードと辞書データの扱いを混同しないための注意書きです。法的助言ではありません。

外部ソースの記載内容と公開状態の最終確認日: 2026-08-13

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

- TOCFL 関連語彙ソース
  - 既定の取得先: `https://raw.githubusercontent.com/PSeitz/tocfl/main/tocfl_words.json`
  - upstream: [PSeitz/tocfl](https://github.com/PSeitz/tocfl)
  - upstream の README は、公式 TOCFL サイトからリンクされたファイルを基にしたデータセットであると説明しています。
  - 2026-08-13 時点で upstream リポジトリ直下にライセンスファイルは確認できません。生成物を公開する前に、参照元を含む適用条件を別途確認してください。
- TBCL
  - 任意入力: `TBCL_SOURCE_PATH` / `TBCL_SOURCE_URL`
  - 公式サイト: [臺灣華語文能力基準 TBCL](https://bcoct.naer.edu.tw/TBCL/)
  - 公式ページは7等級の語彙リストを案内し、國家教育研究院の copyright 表示を掲載しています。TBCL 由来データを含む生成物を、条件確認なしで自由に再配布できるとは扱わないでください。
- MJdic
  - 既定の取得先: `https://raw.githubusercontent.com/code4fukui/MJdic/main/cedict_ts.csv`
  - upstream: [code4fukui/MJdic](https://github.com/code4fukui/MJdic)
  - MJdic プロジェクトのライセンスファイルは MIT ですが、README は辞書データを CC-CEDICT 由来、日本語訳を DeepLAPI で追加したものと説明しています。
- CC-CEDICT
  - 公式 wiki: [CC-CEDICT](https://cc-cedict.org/wiki/)
  - 公式 wiki は CC-CEDICT を Creative Commons Attribution-ShareAlike 3.0 と明記しています。
  - 生成物に CC-CEDICT 由来の内容が含まれる場合、再配布には帰属表示、ライセンス表示、適用される変更表示、ShareAlike と両立する配布条件が必要になる可能性があります。

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
