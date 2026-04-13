# Truth-First Vocabulary Quality Implementation Plan

> Status: 採用中。この文書だけを、語彙品質改善の現行 plan として扱う。`docs/superpowers/plans/` 配下の過去 plan はすべて破棄済みの履歴であり、再開手順として使わない。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 全レベルで間違った単語・間違った日本語訳・辞書断片を減らし続けながら、Level 3 は「長い繁体字を楽しむ Challenge Deck」として残す。

**Architecture:** 語彙品質改善を `Global Guardrail -> Level 1-2 Core Review -> Level 3 Challenge Review -> Regenerate/Verify -> State Update` の走行レーンに分ける。MJdic は候補供給源として残すが、公開の正しさは監査、review batch、`data/editorial-overrides.json` で制御する。既存の `generate:data -> check:data -> audit:data` の生成導線は維持し、採否と訳修正は生成物ではなく editorial override に集約する。

**Tech Stack:** Node.js 24, npm, Nuxt 4, Vue 3, TypeScript, Vitest, Zod, Biome

---

## Non-Negotiable Policy

- 全レベルの改善を続ける。
- Level 1-2 は基本語・実用語としての正確さと自然な日本語ラベルを優先する。
- Level 3 は Challenge 寄りでよいが、嘘は出さない。
- 正しいか確認できない語は `approved` にしない。
- MJdic の `meansJa` は候補素材であり、公開訳として無条件採用しない。
- `data/vocabulary*.json` と `public/wordlists/*.json` は生成物なので直接編集しない。
- 採否と訳修正は `data/editorial-overrides.json` に入れる。
- 古い plan は参照しない。背景確認が必要な場合だけ `docs/superpowers/specs/` と `docs/dictionary-sources.md` を読む。

## Current State

- 作業ブランチ: `feat/vocabulary-quality-pipeline`
- 最新作業: `2026-04-13 Level 1-2 normal batch 500 件を追加処理（承認 481 件、却下 19 件）`
- 公開語彙数: `15146`
- `data/editorial-overrides.json`: `11530` 件
- 内訳: `approved 10940`、`rejected 590`
- Level 1: `10759` 件、reviewed `9893`、unreviewed `866`
- Level 2: `1115` 件、reviewed `877`、unreviewed `238`
- Level 3: `3272` 件、reviewed `170`、unreviewed `3102`
- Level 3 内訳: 5文字 `2327`、6文字 `945`
- Level 3 MJdic 単独: `3253`
- Level 3 の日本語ラベル 13文字以上: `0`
- `audit:data` の現状: global guardrail はすべて `0`、Level 3 risk は `level3_proper_noun_risk: 0`、`level3_explanatory_risk: 0`、`level3_too_long_label: 0`
- 次の推奨 batch: `npm run review:vocab:export -- --limit=500`

## Operating Model

語彙改善は、次の 3 レーンを順番に走らせる。

### Lane A: Global Guardrail

全レベル共通で、公開選択肢プールに出してはいけない地雷を先に除去する。

対象:

- 壊れた日本語ラベル
- `〜を参照` など辞書内リンク残骸
- 記号だけ、括弧・句点入り、説明文、長すぎるラベル
- 簡体字混入
- 明らかな誤訳

次回以降も、選択肢に地雷が見つかったら通常レビューより先にこのレーンへ戻る。

### Lane B: Level 1-2 Core Review

基本語・実用語として、短く自然な日本語4択に耐える品質へ上げる。

優先するもの:

- TOCFL/TBCL を根拠にできる語
- 日常語・基本語・学習価値が高い語
- 日本語ラベルが 3-10 文字程度で自然な語

落とすもの:

- 助数詞・感嘆詞・代名詞など単独4択に不向きな語
- 文脈依存が強く、短い正解ラベルにできない語
- 姓・固有名詞・制度語・歴史語
- 日本語訳が説明文や辞書断片になる語

通常の `npm run review:vocab:export -- --limit=500` はこのレーンを進める。

### Lane C: Level 3 Truth-First Challenge Review

Level 3 は「長い繁体字を楽しむ」ために残す。ただし、嘘は出さない。

残すもの:

- 成語、慣用句、ことわざ
- 意味が明確な 5-6 文字の複合語
- 難しいが訳が正確で、4択ゲームとして成立する語
- 専門語でも日本語ラベルが一般的で短い語
- 台湾で使われる繁体字表記として不自然でない語

落とす、または quarantine するもの:

- 地名、行政区、大学名、企業名、組織名、事件名、作品名などの固有名詞クイズ
- `〜の略`、`〜と同じ`、`〜とも呼ばれる` のような説明ラベル
- `〜として`、`〜の一種`、`〜を指す`、`〜である` を含む説明文ラベル
- 日本語ラベルが 13 文字以上で、単語ラベルではなく説明文になっているもの
- 中国大陸固有の制度・地名・組織に寄りすぎ、台湾華語学習ゲームとして筋が弱いもの
- MJdic の訳が機械翻訳臭く、原語との対応を確認できないもの
- 日本語として自然でも、原語の意味からずれているもの

## Next Priority

通常レビューと Level 3 high-risk review を分けて走らせるための監査・export 強化は実装済み。
2026-04-12 の再開サイクルで Level 3 high-risk queue は `0` まで処理済み。
2026-04-12 の継続サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `497` 件、却下 `3` 件。
2026-04-12 の追加サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `494` 件、却下 `6` 件。
2026-04-12 の再追加サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `495` 件、却下 `5` 件。
2026-04-12 の追加継続サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `500` 件、却下 `0` 件。
2026-04-12 のさらに継続サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `496` 件、却下 `4` 件。
2026-04-12 の継続追加サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `485` 件、却下 `15` 件。
2026-04-12 の最新継続サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `492` 件、却下 `8` 件。
2026-04-12 の今回再開サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `486` 件、却下 `14` 件。
2026-04-12 の追加再開サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `494` 件、却下 `6` 件。
2026-04-13 の再開サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `495` 件、却下 `5` 件。
2026-04-13 の追加再開サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `495` 件、却下 `5` 件。
2026-04-13 の継続再開サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `496` 件、却下 `4` 件。
2026-04-13 の追加継続サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `495` 件、却下 `5` 件。
2026-04-13 の今回継続サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `499` 件、却下 `1` 件。
2026-04-13 の追加改善サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `500` 件、却下 `0` 件。
2026-04-13 の継続改善サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `500` 件、却下 `0` 件。
2026-04-13 の今回再開改善サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `497` 件、却下 `3` 件。
2026-04-13 の追加再開改善サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `494` 件、却下 `6` 件。
2026-04-13 の継続再開改善サイクルで Level 1-2 normal batch `500` 件を処理済み。承認 `481` 件、却下 `19` 件。
次に進めるのは Level 1-2 Core Review の継続。

最初の実装サイクルでは、以下を作る。

1. Level 3 専用の high-risk signal
2. `audit:data` の Level 3 risk 出力
3. `review:vocab:export -- --level=3 --risk-only --limit=200`
4. 全レベル通常レビューを壊さないテスト

その後の運用は、次の順番を基本にする。

1. Global Guardrail が `0` であることを確認
2. Level 3 high-risk batch が非ゼロなら 200 件単位で処理
3. Level 3 high-risk batch が `0` なら Level 1-2 通常 batch を 500 件単位で処理
4. 再生成・検証
5. この plan の Current State を更新

## File Structure

### Modify

- `scripts/lib/vocabulary-quality-signals.mjs`
  - 全レベル共通シグナルと Level 3 専用シグナルを管理する。
- `scripts/audit-vocabulary-quality.mjs`
  - Global Guardrail と Level 3 risk queue を出力する。
- `scripts/export-vocabulary-review-batch.mjs`
  - 通常 review batch と Level 3 high-risk batch を分けられるようにする。
- `tests/unit/vocabulary-quality-signals.test.ts`
  - 新シグナルの RED/GREEN テストを追加する。
- `tests/unit/vocabulary-review-batch.test.ts`
  - 通常 export と Level 3 high-risk export の両方を固定する。
- `data/editorial-overrides.json`
  - 全レベルの採否と短い日本語ラベル補正を反映する。
- `docs/dictionary-sources.md`
  - 全レベル改善と Level 3 Truth-first Challenge の運用を記録する。
- `AGENTS.md`
  - 次回再開時にこの plan を見るように更新する。

## Task 1: Shared And Level 3 Quality Signals

**Files:**
- Modify: `scripts/lib/vocabulary-quality-signals.mjs`
- Test: `tests/unit/vocabulary-quality-signals.test.ts`

- [x] **Step 1: Write failing tests**

Add tests that express both all-level and Level 3 policy:

```ts
it('全レベル共通の辞書断片と説明文ラベルを検出する', async () => {
  const { isReferenceOnlyGloss, isExplanatoryGloss } = await import(
    '../../scripts/lib/vocabulary-quality-signals.mjs'
  );

  expect(isReferenceOnlyGloss('般乐を参照')).toBe(true);
  expect(isExplanatoryGloss('鳥の一種')).toBe(true);

  expect(isReferenceOnlyGloss('参照する')).toBe(false);
  expect(isExplanatoryGloss('ありがとう')).toBe(false);
});

it('Level 3 の固有名詞・地名・組織名寄りラベルを検出する', async () => {
  const { isLevelThreeProperNounRiskGloss } = await import(
    '../../scripts/lib/vocabulary-quality-signals.mjs'
  );

  expect(isLevelThreeProperNounRiskGloss('オーストリアの都市インスブルック')).toBe(true);
  expect(isLevelThreeProperNounRiskGloss('忠清南道の道庁所在地 忠清南道')).toBe(true);
  expect(isLevelThreeProperNounRiskGloss('国際ミラノサッカークラブ')).toBe(true);

  expect(isLevelThreeProperNounRiskGloss('桃源郷')).toBe(false);
  expect(isLevelThreeProperNounRiskGloss('トランス脂肪酸')).toBe(false);
});

it('Level 3 の説明文ラベルを検出し、短い challenge ラベルは除外しない', async () => {
  const { isLevelThreeExplanatoryRiskGloss } = await import(
    '../../scripts/lib/vocabulary-quality-signals.mjs'
  );

  expect(isLevelThreeExplanatoryRiskGloss('中國教育和科研计算机网の略')).toBe(true);
  expect(isLevelThreeExplanatoryRiskGloss('ヘイシャジ島と同じ黑瞎子島')).toBe(true);
  expect(isLevelThreeExplanatoryRiskGloss('西周王朝の初代王として在位')).toBe(true);

  expect(isLevelThreeExplanatoryRiskGloss('でたらめな話')).toBe(false);
  expect(isLevelThreeExplanatoryRiskGloss('歯列矯正器')).toBe(false);
});
```

- [x] **Step 2: Run tests and confirm RED**

Run:

```bash
npm run test:unit -- tests/unit/vocabulary-quality-signals.test.ts
```

Expected: FAIL because the new Level 3 functions are not exported.

- [x] **Step 3: Implement minimal signal functions**

Add exported functions in `scripts/lib/vocabulary-quality-signals.mjs`:

```js
const levelThreeProperNounRiskPattern =
  /(?:都市|道庁所在地|自治区|自治州|省|市|大学|公司|有限公司|クラブ|王朝|初代王|事件|戦役|番組|組織|省庁|運輸省)/u;
const levelThreeExplanatoryRiskPattern =
  /(?:の略|への略称|と同じ|とも呼ばれる|として|の一種|を指す|である|公式見解|所在地)/u;

export const isLevelThreeProperNounRiskGloss = (gloss) =>
  levelThreeProperNounRiskPattern.test(gloss);

export const isLevelThreeExplanatoryRiskGloss = (gloss) =>
  levelThreeExplanatoryRiskPattern.test(gloss);
```

- [x] **Step 4: Run tests and confirm GREEN**

Run:

```bash
npm run test:unit -- tests/unit/vocabulary-quality-signals.test.ts
```

Expected: PASS.

## Task 2: Audit Output For All Lanes

**Files:**
- Modify: `scripts/audit-vocabulary-quality.mjs`

- [x] **Step 1: Add audit categories**

Import the new functions and add checks that preserve existing all-level checks while adding Level 3 risk queues:

```js
{
  name: 'level3_proper_noun_risk',
  test: (entry) => entry.level === 3 && isLevelThreeProperNounRiskGloss(entry.ja),
},
{
  name: 'level3_explanatory_risk',
  test: (entry) => entry.level === 3 && isLevelThreeExplanatoryRiskGloss(entry.ja),
},
{
  name: 'level3_too_long_label',
  test: (entry) => entry.level === 3 && entry.ja.length >= 13,
},
```

- [x] **Step 2: Run audit**

Run:

```bash
npm run audit:data
```

Expected: global broken-label checks remain `0`; new Level 3 risk categories may be non-zero and are review queues, not automatic failures.

## Task 3: Review Batch Routing

**Files:**
- Modify: `scripts/export-vocabulary-review-batch.mjs`
- Test: `tests/unit/vocabulary-review-batch.test.ts`

- [x] **Step 1: Write failing test for Level 3 high-risk routing**

Add a test that exports high-risk Level 3 entries while keeping already reviewed words out:

```ts
it('Level 3 high-risk batch は固有名詞・説明文ラベルを優先して出す', async () => {
  const { buildReviewBatch } = await import('../../scripts/export-vocabulary-review-batch.mjs');

  const batch = buildReviewBatch(
    [
      {
        trad: '世外桃花源',
        level: 3,
        canonicalJa: '桃源郷',
        confidence: 'low',
        sources: ['mjdic'],
        rawGlosses: [{ source: 'mjdic', meansJa: '桃源郷', means: 'utopia' }],
      },
      {
        trad: '大田廣域市',
        level: 3,
        canonicalJa: '忠清南道の道庁所在地 忠清南道',
        confidence: 'low',
        sources: ['mjdic'],
        rawGlosses: [
          {
            source: 'mjdic',
            meansJa: '忠清南道の道庁所在地 忠清南道',
            means: 'Daejeon',
          },
        ],
      },
    ],
    [],
    { level: 3, riskOnly: true, limit: 10 }
  );

  expect(batch.map((entry) => entry.trad)).toEqual(['大田廣域市']);
});
```

- [x] **Step 2: Write regression test for Level 1-2 normal routing**

Keep the existing behavior explicit:

```ts
it('既定の review batch は Level 1-2 の未レビュー候補を優先する', async () => {
  const { buildReviewBatch } = await import('../../scripts/export-vocabulary-review-batch.mjs');

  const batch = buildReviewBatch([
    {
      trad: '發炎',
      level: 1,
      canonicalJa: '炎症を起こす',
      confidence: 'medium',
      sources: ['tocfl', 'mjdic'],
      rawGlosses: [{ source: 'mjdic', meansJa: '炎症を起こす', means: 'to become inflamed' }],
    },
    {
      trad: '世外桃花源',
      level: 3,
      canonicalJa: '桃源郷',
      confidence: 'low',
      sources: ['mjdic'],
      rawGlosses: [{ source: 'mjdic', meansJa: '桃源郷', means: 'utopia' }],
    },
  ]);

  expect(batch.map((entry) => entry.trad)).toEqual(['發炎']);
});
```

- [x] **Step 3: Run tests and confirm RED**

Run:

```bash
npm run test:unit -- tests/unit/vocabulary-review-batch.test.ts
```

Expected: FAIL until `level` and `riskOnly` options exist.

- [x] **Step 4: Implement batch options**

Extend `buildReviewBatch` options:

- `level?: 1 | 2 | 3`
- `riskOnly?: boolean`
- `limit?: number`

Default behavior remains Level 1-2 review. For `level: 3, riskOnly: true`, include entries when one of the Level 3 risk functions matches `canonicalJa` or when `canonicalJa.length >= 13`.

- [x] **Step 5: Run tests and confirm GREEN**

Run:

```bash
npm run test:unit -- tests/unit/vocabulary-review-batch.test.ts
```

Expected: PASS.

## Task 4: Review Passes

**Files:**
- Modify: `data/editorial-overrides.json`
- Generated locally: `data/review-batches/vocabulary-review-batch.jsonl`

- [x] **Step 1: Export a focused Level 3 high-risk batch**

Run:

```bash
npm run review:vocab:export -- --level=3 --risk-only --limit=200
```

Expected: JSONL contains only Level 3 candidates with high-risk labels.

- [x] **Step 2: Review Level 3 with Truth-first Challenge rules**

Use these decisions:

- If the word and label are clearly correct and fun as a long-word challenge, set `recommendedStatus: "approved"` and use a short `canonicalJa`.
- If the word is a solid challenge word but current Japanese is wrong or too explanatory, set `recommendedStatus: "approved"` with a corrected `canonicalJa`.
- If it is a place, organization, event, company, person, opaque abbreviation, or unverified encyclopedia item, set `recommendedStatus: "rejected"`.
- If correctness cannot be determined from evidence, set `recommendedStatus: "pending"` or leave it out of the apply file.

- [x] **Step 3: Export the normal Level 1-2 batch**

Run:

```bash
npm run review:vocab:export -- --limit=500
```

Expected: JSONL begins with Level 1-2 unreviewed candidates such as `發炎`, `犯`, `反正`, `犯罪`, `放鬆` unless they were already reviewed.

- [x] **Step 4: Review Level 1-2 with Core rules**

Use these decisions:

- Keep daily-use and learning-value words with short natural Japanese labels.
- Fix false friends and awkward labels with `recommendedStatus: "approved"` and corrected `canonicalJa`.
- Reject standalone function words, classifiers, interjections, pronouns, and context-dependent words that do not work as 4-choice cards.
- Do not approve entries where the source evidence does not support the Japanese label.

- [x] **Step 5: Apply review results**

Create `data/review-batches/vocabulary-review-results.json` with reviewed entries and run:

```bash
npm run review:vocab:apply -- data/review-batches/vocabulary-review-results.json
```

Expected: only `data/editorial-overrides.json` changes among tracked data files.

## Task 5: Regenerate And Verify

**Files:**
- Generated locally: `data/vocabulary*.json`
- Generated locally: `public/wordlists/*.json`

- [x] **Step 1: Regenerate data**

Run:

```bash
npm run generate:data
```

Expected: generation completes without errors.

- [x] **Step 2: Validate data**

Run:

```bash
npm run check:data
```

Expected: validation passes.

- [x] **Step 3: Audit data**

Run:

```bash
npm run audit:data
```

Expected: global broken-label checks stay at `0`. Level 3 risk categories should decrease after each Level 3 high-risk review pass.

- [x] **Step 4: Run code verification**

Run:

```bash
npm run lint
npm run test:unit
npx tsc --noEmit -p .nuxt/tsconfig.json
npm run build
```

Expected: all commands exit `0`.

## Task 6: Documentation Sync

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/dictionary-sources.md`
- Modify: `docs/superpowers/plans/2026-04-11-truth-first-vocabulary-quality.md`

- [x] **Step 1: Update current state**

After each review pass, update this plan:

- public vocabulary count
- editorial override count and status breakdown
- Level 1 reviewed/unreviewed count
- Level 2 reviewed/unreviewed count
- Level 3 reviewed/unreviewed count
- remaining high-risk audit counts
- next recommended batch command

- [x] **Step 2: Confirm old plans stay discarded**

Run:

```bash
rg -n "Status: 採用中|Status: 破棄" docs/superpowers/plans
```

Expected: only this plan is `採用中`; all older plan files are `破棄済み`.

## Completion Criteria

- Level 1-2 normal review continues.
- Level 3 remains available.
- Level 3 still contains 5-6 文字 challenge words.
- Public `ja` labels do not include known broken labels or dictionary reference leftovers.
- High-risk Level 3 entries are exported before low-risk Level 3 review.
- `data/editorial-overrides.json` is the only tracked data file used for review decisions.
- `npm run check:data`, `npm run audit:data`, `npm run lint`, `npm run test:unit`, `npx tsc --noEmit -p .nuxt/tsconfig.json`, and `npm run build` pass before reporting completion.
