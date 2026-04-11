# Vocabulary Review Cycle Handoff

Status: 採用中

この文書は、別コンテキストでユーザーが「改善を再開してください」または「次のサイクルを進めてください」と依頼したときの再開手順です。

## 現在地

- 作業ブランチ: `feat/vocabulary-quality-pipeline`
- 最新の公開語彙数: `15680`
- `data/editorial-overrides.json`: `1297` 件
- 内訳: `approved 1246`、`rejected 51`
- 残レビュー対象: `14336` 件
- 次の先頭候補: `發炎=>炎症を起こす`, `犯=>を犯す`, `反正=>どんな場合でも`, `犯罪=>犯罪を犯す`, `放鬆=>緩める`
- 直近の実機確認で、選択肢に `珍糞漢糞` のような壊れた日本語ラベルがまだ出た。

## 次に優先すること

通常の 500 件順次レビューを続ける前に、公開済み選択肢プール全体の「地雷ラベル」横断除去を優先する。

理由:

- 選択肢は同じレベルの公開語彙全体から作られる。
- 主題語として未出題でも、未レビュー語の `ja` が誤答候補として画面に出る。
- `review:vocab:export -- --limit=500` の順次レビューだけでは、未レビュー領域の壊れたラベルが長く残り、改善効果が断片的に見える。

確認済みの例:

- `無稽之談` の `ja` が `珍糞漢糞` になっている。
- これは `data/vocabulary-level-2.json` と `public/wordlists/vocabulary-level-2.json` に出ていた。
- 根本原因は `MJdic` の壊れた `meansJa` が `canonicalJa` に採用され、公開デッキと誤答候補プールに残っていること。

## 優先サイクル手順

1. 公開済み `data/vocabulary.json` と `data/vocabulary-level-*.json` から、壊れた `ja` を横断抽出する。
2. 次のようなラベルを高優先で検出する。
   - 不快語や明らかな誤変換を含むもの
   - `〜を参照`、辞書説明文、固有名詞説明
   - 日本語として不自然な漢字羅列
   - 長すぎる説明ラベル
   - Level 1-2 の助数詞、感嘆詞、代名詞、文脈依存語
3. 抽出結果を `data/editorial-overrides.json` へ反映する。
   - 明確な教材ラベルに直せるものは `approved`
   - 単語4択に不向きなものは `rejected`
4. 同種の壊れ方を今後検出できるよう、`scripts/audit-vocabulary-quality.mjs` と `scripts/lib/vocabulary-quality-signals.mjs` に監査ルールを追加する。
5. 可能なら `app/utils/trainer.ts` 側で、危険ラベルを誤答候補として選ばない防御も検討する。ただし根本対応は生成時の除去を優先する。
6. 再生成と検証を実行する。

```bash
npm run generate:data
npm run check:data
npm run audit:data
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

この横断除去が一段落した後で、次の通常 500 件レビューに戻る。

## 通常500件サイクル手順

1. `npm run review:vocab:export -- --limit=500` を実行する。
2. `data/review-batches/vocabulary-review-batch.jsonl` の 500 件を確認する。
3. 明確な誤訳は自然な教材向け日本語へ直す。
4. 感嘆詞、助数詞、代名詞、文脈依存が強すぎる語、単語4択に不向きな語は `rejected` にする。
5. 判断できない語を台湾華語の専門知識で無理に承認しない。現訳が不自然でなければ保守的に承認してよい。
6. レビュー結果 JSON を `data/review-batches/vocabulary-review-results.json` に作る。
7. `npm run review:vocab:apply -- data/review-batches/vocabulary-review-results.json` を実行する。
8. `npm run generate:data` を実行する。
9. 検証を実行する。

```bash
npm run check:data
npm run audit:data
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

## バッチサイズ

`--limit=500` は技術的な上限ではない。`--limit=1000` や `--limit=2000` も指定できる。
ただし、品質を落とさずに誤訳・不自然訳・reject 対象を見分けるには 500 件が安全な単位。
ユーザーが速度を優先すると明示した場合だけ、1000 件以上に増やす。

現時点では速度より体感品質を優先する。次回は通常 500 件サイクルではなく、上記の横断地雷除去を先に行う。

## GitHub 公開ポリシー

- GitHub に載せる主な語彙レビュー成果物は `data/editorial-overrides.json`。
- `data/review-batches/*` はレビュー作業用の生成物で、GitHub に載せない。
- `data/vocabulary*.json` と `public/wordlists/*.json` は生成物で、GitHub に載せない。
- `data/source-snapshots/*` は外部ソースのローカルスナップショットで、GitHub に載せない。
- clone した人は `npm install`, `npm run setup:data`, `npm run dev` で開始できる状態を維持する。

## 注意

`data/review-batches/` 配下に残っている JSONL、結果 JSON、一時スクリプトは前回サイクルの作業物である可能性がある。
次サイクルでは必ず新しく `review:vocab:export` して、現在の batch に対応する結果 JSON を作る。
