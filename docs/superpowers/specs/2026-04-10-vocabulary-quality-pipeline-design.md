# Vocabulary Quality Pipeline Design

Date: 2026-04-10

> Status: 採用・実装済みの設計メモです。主題単語と日本語ラベルの品質改善方針の背景として扱ってください。現行の運用手順は `docs/dictionary-sources.md` と `docs/superpowers/plans/2026-04-11-vocabulary-review-cycle-handoff.md` を優先してください。

## Implementation Snapshot

2026-04-11 時点の実装は、完全な `approved-only` デッキではなく段階移行です。

- `Level 1-2` は `TOCFL/TBCL` を根拠にできる候補を公開対象にし、`editorial-overrides` で reject と日本語ラベル補正を重ねる
- `Level 3` は当面 `MJdic` を根拠にできる 5-6 文字候補を中心に公開する
- `data/vocabulary-candidates.json` を中間候補として生成する
- `data/editorial-overrides.json` を GitHub に載せる小さな編集レコードとして管理する
- `data/review-batches/*`、`data/vocabulary*.json`、`public/wordlists/*.json`、`data/source-snapshots/*` はローカル生成物として GitHub に載せない
- レビューサイクルは `npm run review:vocab:export -- --limit=500` と `npm run review:vocab:apply -- /path/to/review-results.json` で進める

以下の本文には、初期設計時点の将来案も含まれます。

## Goal

有料の学習サイト水準を目標に、主題単語と日本語4択の品質を段階的に引き上げる。

今回の最重要課題は次の 2 点。

- 主題単語に、初級学習カードとして不適切な語が多く混ざっている
- 日本語ラベルが辞書断片や機械翻訳断片のまま使われており、教材品質を満たしていない

## Desired Outcome

- `Level 1-2` は「多い語数」より「外れの少ない承認済みデッキ」を優先する
- 主題単語の採用根拠を `台湾の公式・学習者向けソース` に寄せる
- 日本語ラベルは「辞書訳」ではなく「教材用の短く自然な正解ラベル」として管理する
- 危険な候補は自動で除外し、判断が割れる候補だけレビュー対象に送る
- 実行時構成の軽さと GitHub に上げやすい運用は維持する

## Confirmed Decisions

今回のユーザー合意事項は以下。

- 台湾華語の専門知識がなくても回せる運用にする
- 外部の信頼ソース追加は許容する
- 生成時のみ `LLM` を使う案は許容する
- `Level 1-2` は品質優先で語数を絞る方向を取る
- 実装時は専用ブランチを切って進める

## Rollout Note

この設計の最終目標は `Level 1-2` を承認済みデッキ中心へ寄せることだが、初期実装では次を先に導入する。

- `candidate` 中間成果物の生成
- `editorial-overrides` による採否と日本語ラベル補正
- `LLM` 補助レビューの入出力

公開デッキを `approved-only` に完全移行するのは、十分な editorial record が蓄積した段階で行う。

## Current Problems

### 1. 主題単語の採用基準が弱い

現状は `TOCFL + MJdic + manual-vocabulary` をもとに語を生成しているが、`TOCFL` 採用時の除外条件が弱く、`MJdic` 由来の語義もかなりそのまま通している。

その結果、`Level 1` にも次のような語が大量に混入している。

- 姓や人名要素
- 助数詞・分類語
- 古代制度や歴史語
- 固有名詞由来の語義
- 台湾華語の日常学習より辞書都合が優先された見出し

実データ確認時点で `Level 1` は 12,349 語あり、初級向けデッキとしては過剰である。

### 2. 日本語ラベルが教材用に編集されていない

現状は `MJdic` の訳候補から 1 本選んで `ja` に採用している。これにより、次のようなラベルがそのまま正解や誤答に使われている。

- `pr.数字を一桁ずつ綴るときに`
- `ナインナイン`
- `ねずみ年`
- `他人にIDを使われた人`
- `分類語` や `固有名詞説明` を含む断片

これは辞書断片としても弱く、学習ゲームの正解ラベルとしては成立しない。

### 3. 監査が「壊れた文字列」中心で、教材品質を見ていない

`audit:data` と validation は、主に次を検出している。

- 記号だけ
- 括弧や句点
- 中国語の混入
- 明らかな長文

一方で、次はほぼ検出できていない。

- 姓
- 助数詞・分類語
- 固有名詞寄り語義
- 古語や制度語
- 初級に不向きな抽象語
- 自然な日本語に見えても教材ラベルとして悪い訳

### 4. 正解ラベルと誤答ラベルの設計が分離されていない

今は `entry.ja` がそのまま正解ラベルにも誤答ラベルにも使われている。結果として、主題単語品質と選択肢品質の改善点が混ざり、個別に最適化できない。

## Design Principles

### 方針 A

主題単語の妥当性と、日本語ラベルの自然さを別問題として扱う。

### 方針 B

`台湾華語として自然か` は、個人の記憶ではなく `公式・学習者向けソースの照合` で支える。

### 方針 C

`LLM` は辞書の代替ではなく、編集補助と危険候補の振り分けに限定する。

### 方針 D

`Level 1-2` は承認済みデッキ方式に寄せ、`Level 3` は当面やや緩めに運用する。

### 方針 E

実行時配信は現状どおり `public/wordlists/*.json` の遅延読み込みを維持し、重い品質判定は生成時に閉じ込める。

## Source Strategy

### 主ソース

- `TOCFL`
  - 台湾華語のレベル付き語彙の主軸
- `TBCL`
  - 台湾華語能力基準によるレベル照合用

### 照合ソース

- 教育部 `《國語辭典簡編本》`
  - 初学者・一般利用向けの見出し確認
- 國家教育研究院 `《中小學語文學習詞典》`
  - 学習者向け語彙かどうかの補助確認

### 補助ソース

- 教育部 `《重編國語辭典修訂本》`
  - 広範な語義参照用。初級採用の主根拠にはしない
- `MJdic`
  - 日本語候補の原素材。単独での採用根拠にはしない

## Pipeline Architecture

### 1. Source Collection

各ソースを個別に取得し、正規化済みスナップショットへ保存する。

- `TOCFL`
- `TBCL`
- 教育部辞典
- 国教院学習辞典
- `MJdic`

この段階ではまだ語を採用しない。各ソースの `見出し`, `レベル`, `品詞`, `説明`, `読み`, `頻度・常用度` などを機械処理しやすい形式へそろえる。

### 2. Candidate Synthesis

見出しごとに `candidate` を作る。`candidate` は「将来出題される可能性がある語」であり、まだ公開デッキではない。

候補には少なくとも次を持たせる。

- `trad`
- `length`
- `tocflLevel`
- `tbclLevel`
- `moeStatus`
- `learnerDictStatus`
- `sources`
- `pronunciation`
- `rawGlosses`
- `riskFlags`
- `confidence`

### 3. Rule-Based Screening

まず機械ルールで危険語を大きく落とす。

強く除外する候補:

- 姓、人名要素、地名、組織名
- 助数詞、分類語
- 古語、制度語、歴史用語
- 略語説明や補足説明を前提にしないと意味が立たない語
- 固有名詞由来の意味が優先される語
- 日本語ラベルが短く自然に作れない語

`Level 1` の 1 文字語は特に厳しく扱う。頻出で教育的な価値が明確なものだけを残し、字義が広すぎる語や辞書ノイズは原則落とす。

### 4. Editorial Assistance

ルール通過後の候補に対し、`LLM` を使って編集補助をかける。役割は次に限定する。

- 複数辞書訳から `教材用日本語ラベル候補` を 1-3 個作る
- `説明調`, `辞書調`, `固有名詞寄り`, `不自然日本語`, `曖昧すぎる訳` を検出する
- 初級に不向きな候補へ警告を付ける
- 代表訳が作れない候補を `review required` に送る

`LLM` に最終採用を一任しない。出力は構造化 JSON とし、バッチ処理可能な形で生成する。

### 5. Editorial Review

レビュー対象は全件ではなく、`低信頼候補` のみとする。レビュー画面またはレビュー用 JSON/Markdown では、少なくとも次を確認できるようにする。

- `trad`
- 候補日本語ラベル
- 出典一覧
- 危険フラグ
- 推奨アクション

レビューの責務分担は以下。

- 台湾華語の自然さ: ソース照合と危険フラグで支える
- 日本語の自然さ: 人手で確認する
- 教材カードとしての適切さ: 人手で確認する

### 6. Publishable Deck Build

最終的な `public/wordlists/*.json` は、`approved` になった候補だけから生成する。未承認候補は出題しない。

## Data Model

### Candidate

候補レコードは次の責務を持つ。

- 複数ソースから集めた根拠を保持する
- 危険フラグや信頼スコアを保持する
- まだ採用前の中間状態を表す

推奨フィールド例:

- `trad`
- `length`
- `tocflLevel`
- `tbclLevel`
- `moeStatus`
- `learnerDictStatus`
- `sources`
- `frequencySignals`
- `pronunciation`
- `rawGlosses`
- `riskFlags`
- `confidence`

### Editorial Record

編集レコードは次の責務を持つ。

- 採用状態を持つ
- 教材用の日本語ラベルを持つ
- 人手判断の理由を残す

推奨フィールド例:

- `trad`
- `status`: `approved | pending | rejected`
- `canonicalJa`
- `acceptedJa`
- `senseTag`
- `reviewNotes`
- `reviewReason`
- `reviewedAt`
- `reviewSourceConfidence`

### Published Entry

最終出題用の `VocabEntry` は、表示用ラベルとして `canonicalJa` を使う。必要であれば内部的に `acceptedJa` を残し、将来的な入力拡張や同義判定に備える。

## Acceptance Policy By Level

### Level 1-2

`Level 1-2` は次のいずれかを満たす候補を基本採用条件とする。

1. `TOCFL` 掲載かつ `TBCL` 掲載
2. `TOCFL` 掲載かつ教育部または国教院の学習向け辞典に掲載
3. `seed deck` で明示採用

`MJdic` 単独由来では採用しない。

### Level 3

当面は `TOCFL` と `MJdic` を併用してよいが、危険フラグは `Level 1-2` と同じ基準で付与する。将来的には `TBCL` や学習者向け辞典照合を増やし、`MJdic` 依存を下げる。

## Japanese Label Policy

### 基本原則

- `ja` は辞書訳ではなく教材ラベルとする
- 正解ラベルは短く、自然で、意味が取りやすいものに限る
- 1 語 1 ラベルを基本にするが、内部では複数候補を保持してよい

### 正解ラベルとして避けるもの

- 説明文
- 固有名詞解説
- 文法メモ
- 分類語や辞書記号
- 直訳すぎて日本語になっていない語
- 意味が広すぎて正答判定が曖昧になる語

### 望ましいラベル

- `飲み物`
- `地下鉄`
- `お手洗い`
- `ありがとう`

のように、学習カードとして一目で理解できる短い表現。

## Distractor Policy

選択肢品質は主題単語品質と別に設計する。

誤答候補は次を満たすものを優先する。

- 品詞や意味領域が近い
- 抽象度と文字数が近い
- 初級らしい語である

次は避ける。

- 明らかに異質で一目で消せる語
- 正解と同義に近すぎる語
- 説明調や辞書調が混じる語
- 固有名詞や専門語

このルールに沿って `distractorQuality` のような内部評価軸を持たせる。

## Review Workflow

### Seed Deck

絶対に入れたい語は `seed deck` として別管理する。ここは少量高品質を前提にする。

### Override

自動候補に対する補正は `editorial overrides` として別管理する。主な用途は次。

- `approved / rejected` の明示
- `canonicalJa` の修正
- 読みやカテゴリの補正

今の `manual-vocabulary.json` は、将来的に `seed deck` と `editorial overrides` へ分割する。

## Verification And Quality Gates

生成後の品質チェックは、文字列検証だけでなく教材品質も含める。

最低限の検証項目:

- `Level 1-2` に姓・分類語・固有名詞が混入していないこと
- `approved` でない候補が最終デッキに入っていないこと
- 日本語ラベルが説明文や辞書記号を含まないこと
- 同一レベル内で正解ラベルの重複が過剰でないこと
- 誤答生成に必要な十分な語数とカテゴリ分布があること

品質レポートでは次を出せるようにする。

- レベル別語数
- 承認済み / 保留 / 却下件数
- 危険フラグ内訳
- `seed deck` 採用件数
- `LLM review required` 件数

## Risks

- 外部ソース取得方法によってはメンテナンスコストが上がる
- `TBCL` や辞典側の取得・利用条件は事前確認が必要
- `LLM` 出力を過信すると、もっともらしい誤訳を通す危険がある
- 初期段階では `Level 1-2` の語数が大きく減る可能性がある

## Rollout Strategy

1. 専用ブランチを切る
2. `candidate` と `editorial record` の中間データ構造を追加する
3. `TOCFL + MJdic` 依存の現行生成を `candidate synthesis` へ分解する
4. `TBCL` と学習者向け辞典照合を追加する
5. `LLM` による日本語ラベル補助と危険フラグ付けを追加する
6. `approved deck only` の最終生成へ切り替える
7. 誤答選択ルールを強化する

## Success Criteria

- `Level 1-2` で辞書ノイズや固有名詞ノイズが大幅に減る
- 日本語ラベルが「辞書断片」ではなく「教材ラベル」になる
- 台湾華語知識がなくても、証拠付きレビューで品質改善を継続できる
- 実行時の配信方式と GitHub へ上げやすい運用を維持できる

## References

- TOCFL 準備考試 / 參考詞表
  - <https://tocfl.edu.tw/tocfl/index.php/exam/download>
- TOCFL 測驗類別
  - <https://tocfl.edu.tw/tocfl/index.php/test/reading/list/2>
- 臺灣華語文能力基準 TBCL
  - <https://coct.naer.edu.tw/page.jsp?ID=1>
- 教育部《國語辭典簡編本》
  - <https://dict.concised.moe.edu.tw/page.jsp?ID=3&la=0&powerMode=0>
- 教育部《重編國語辭典修訂本》
  - <https://dict.revised.moe.edu.tw/index.jsp>
- 國家教育研究院《中小學語文學習詞典》
  - <https://dict.learner.naer.edu.tw/page.jsp?ID=7&la=0>
- OpenAI Structured Outputs
  - <https://platform.openai.com/docs/guides/structured-outputs>
- OpenAI Batch API
  - <https://platform.openai.com/docs/api-reference/batch/request-output>
