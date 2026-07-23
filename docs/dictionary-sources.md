# Dictionary Sources

最終確認日: 2026-07-24

大量語彙は第三者データをローカルで加工して生成します。生成済みの `data/vocabulary*.json`、`public/wordlists/*.json`、レビュー補助 JSON、外部ソーススナップショットは Git 管理対象にしません。権利上の注意は [NOTICE.md](../NOTICE.md) を確認してください。

## 入力ソース

### TOCFL 語彙

- 必須入力
- 既定 URL: `https://raw.githubusercontent.com/PSeitz/tocfl/main/tocfl_words.json`
- upstream: [PSeitz/tocfl](https://github.com/PSeitz/tocfl)
- 用途: 台湾華語寄りの自動生成候補とレベル情報
- 指定方法: `TOCFL_SOURCE_PATH` または `TOCFL_SOURCE_URL`
- 注意: upstream は公式 TOCFL サイトからリンクされたファイルに基づくと説明していますが、2026-07-24 時点でリポジトリ直下にライセンスファイルは確認できません。

### MJdic / CC-CEDICT

- 必須入力。ただし MJdic 単独の語は公開候補にしません
- 既定 URL: `https://raw.githubusercontent.com/code4fukui/MJdic/main/cedict_ts.csv`
- upstream: [code4fukui/MJdic](https://github.com/code4fukui/MJdic)
- 用途: 日本語訳候補、発音候補、ピンイン正規化の補助
- 指定方法: `MJDIC_SOURCE_PATH` または `MJDIC_SOURCE_URL`
- 注意: MJdic プロジェクトは MIT ですが、README は辞書データを CC-CEDICT 由来と説明しています。CC-CEDICT の公式 wiki は CC BY-SA 3.0 と明記しています。

### TBCL

- 任意入力
- 公式サイト: [臺灣華語文能力基準 TBCL](https://bcoct.naer.edu.tw/TBCL/)
- 用途: 自動生成候補と補助レベル判定
- 指定方法: `TBCL_SOURCE_PATH` または `TBCL_SOURCE_URL`
- 未指定時: 新たな取得・コピーは行いません。既定の `data/source-snapshots/tbcl_words.json` が存在すれば生成時に読み、存在しなければ TOCFL、MJdic、手入力 seed だけで生成を継続します
- 注意: 公式ページには國家教育研究院の copyright 表示があります。TBCL 由来データを含む生成物の再配布条件は別途確認してください。

### リポジトリ内の手入力データ

- `data/manual-vocabulary.json`
  - 必ず入れたい高品質な seed と発音補完
  - 許可するフィールドは `id / trad / ja / category / pronunciation?` だけ
  - `level / length / sources / taiwanPriority` は生成時に再計算
- `scripts/lib/vocabulary-candidate-pipeline.mjs` の preferred-label map
  - ごく少数の基礎語や false friend の日本語ラベルを固定する静的補正層
  - 原則は manual vocabulary を使い、ここへ個別語を増やし続けない

## 取得と再生成

初回セットアップでは、TOCFL と MJdic を既定 URL から取得し、`data/source-snapshots/` へ保存してから生成と検証を行います。TBCL は指定した場合だけ新たに取得またはコピーし、既存の既定スナップショットがあれば生成時に併用します。

```bash
npm run setup:data
```

ローカルファイルを使う例:

```bash
TOCFL_SOURCE_PATH=/path/to/tocfl_words.json \
MJDIC_SOURCE_PATH=/path/to/mjdic.csv \
TBCL_SOURCE_PATH=/path/to/tbcl_words.json \
npm run setup:data
```

取得 URL を上書きする場合は、対応する `TOCFL_SOURCE_URL`、`MJDIC_SOURCE_URL`、`TBCL_SOURCE_URL` を指定します。`*_SOURCE_PATH` があるソースではローカルファイルを優先します。

`npm run generate:data` はネットワークから取得しません。既定では `data/source-snapshots/` の TOCFL と MJdic を必須入力として読み、TBCL のスナップショットが存在すれば併用します。別ファイルを読む場合は `TOCFL_SOURCE_PATH`、`MJDIC_SOURCE_PATH`、`TBCL_SOURCE_PATH` を指定してください。

## 生成物

- `data/vocabulary-candidates.json`: publishable 判定と却下理由を含む候補一覧
- `data/vocabulary.json`: 公開対象をまとめた全レベル一覧
- `data/vocabulary-level-{1,2,3}.json`: レベル別一覧
- `data/vocabulary-metadata.json`: レベル別件数
- `public/wordlists/vocabulary-level-{1,2,3}.json`: 実行時に遅延読み込みするレベル別一覧
- `public/wordlists/metadata.json`: 件数表示用の補助データ
- `data/review-batches/vocabulary-audit.json`: `npm run audit:data` が作るレビュー補助一覧

これらは生成物として直接手編集しません。入力または生成ロジックを修正し、再生成してください。

## 選定方針

- UI と出題データに簡体字を混入させません。
- 出題対象は単語だけとし、文章や例文を含めません。
- Level は `1文字 / 2文字 / 3文字以上` で判定し、Level 3 は実用性の高い語に絞ります。
- TOCFL または TBCL を根拠にできる自動生成候補を対象とし、MJdic 単独候補は公開しません。手入力 seed は別の明示的な採用経路です。
- 日本語訳候補は正規化・採点して選び、preferred-label map の少数語だけ静的補正を優先します。
- hard gate は簡体字混入、記号だけ、ASCII のみ、参照・略語・分類詞メタ、MJdic 単独根拠など、誤爆しにくい条件に絞ります。
- 説明文風ラベル、姓らしいラベル、同一訳過多などは自動除外せず、`npm run audit:data` の結果で確認します。
- 発音は取得できるものだけ保持し、UI ではピンインとカタカナ補助として表示します。
- 単語音声は辞書データへ同梱せず、ブラウザの `SpeechSynthesis` で再生します。

## 検証

語彙または生成ロジックを変更した場合:

```bash
npm run setup:data
npm run check:data
npm run audit:data
npm run lint
npm run test:unit
npm run typecheck
npm run build
```

`npm run audit:data` は生成を止める検証ではなく、怪しい日本語ラベルをレビューするための補助です。生成済み語彙と同じく、監査結果も Git 管理対象にしません。

## 再配布

生成済みの `data/vocabulary*.json`、`public/wordlists/*.json`、`data/review-batches/*.json`、`data/source-snapshots/*` は Public リポジトリへ同梱しません。配布する場合は、TOCFL、TBCL、MJdic、CC-CEDICT の最新の一次情報を確認し、必要な帰属表示、ライセンス表示、変更表示、ShareAlike 条件を配布物側に明記してください。
