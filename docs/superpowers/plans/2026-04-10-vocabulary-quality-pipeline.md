# Vocabulary Quality Pipeline Implementation Plan

> Status: 破棄済み。現行 plan ではありません。語彙品質パイプライン導入時の履歴としてのみ扱い、今後の語彙品質改善は `docs/superpowers/plans/2026-04-11-truth-first-vocabulary-quality.md` を優先してください。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 主題単語と日本語ラベルの品質を、`公式台湾ソース照合 + 編集レコード + LLM 補助 + 承認済みデッキ生成` に置き換えて、有料学習サイトに近い品質へ段階的に引き上げる。

**Architecture:** 既存の `scripts/generate-vocabulary.mjs` 一枚の処理を、`source reading -> candidate synthesis -> editorial merge -> publishable deck build` の 4 段階へ分解する。`data/manual-vocabulary.json` は seed deck として維持しつつ、追加入力は `data/editorial-overrides.json` に分離し、`Level 1-2` は承認済み候補だけを公開デッキへ流す。`LLM` は辞書の代替ではなく、レビュー候補の整理・日本語ラベル候補生成・危険語のタグ付けに限定する。

**Tech Stack:** Node.js 24, npm, Nuxt 4, Vue 3, TypeScript, Vitest, Zod, Biome

---

## File Structure

### Create

- `data/editorial-overrides.json`
  - 候補語に対する `approved | pending | rejected` と日本語ラベル補正を保持する追加入力
- `scripts/lib/vocabulary-source-readers.mjs`
  - `TOCFL` `TBCL` 教育部辞典 国教院学習辞典 `MJdic` の読み込みと正規化
- `scripts/lib/vocabulary-candidate-pipeline.mjs`
  - 候補語の合成、危険フラグ付与、信頼スコア計算
- `scripts/lib/vocabulary-editorial-records.mjs`
  - `manual-vocabulary` と `editorial-overrides` を seed / override として解決する
- `scripts/lib/vocabulary-publish.mjs`
  - 承認済み候補から `data/vocabulary*.json` と `public/wordlists/*.json` を生成する
- `scripts/export-vocabulary-review-batch.mjs`
  - 低信頼候補を `LLM` 向け JSONL または JSON に書き出す
- `scripts/apply-vocabulary-review-results.mjs`
  - `LLM` の構造化出力を `editorial-overrides` へ反映する
- `tests/unit/vocabulary-source-readers.test.ts`
  - 新規ソース正規化の単体テスト
- `tests/unit/vocabulary-candidate-pipeline.test.ts`
  - 候補合成と危険語除外ルールのテスト
- `tests/unit/vocabulary-editorial-records.test.ts`
  - 承認レコード統合のテスト
- `tests/unit/vocabulary-review-batch.test.ts`
  - `LLM` レビュー用エクスポート/インポートのテスト

### Modify

- `.gitignore`
  - 中間生成物やレビュー出力の ignore を追加する
- `scripts/generate-vocabulary.mjs`
  - オーケストレーターに縮小し、新しいライブラリ群を呼び出す
- `scripts/setup-data.mjs`
  - 新しいソースパス / URL の受け口と、レビュー前提の生成フローを追加する
- `scripts/validate-vocabulary.mjs`
  - 承認済みデッキ専用の品質検証へ更新する
- `scripts/audit-vocabulary-quality.mjs`
  - 教材品質に近い監査項目を追加する
- `shared/types/vocabulary.ts`
  - `acceptedJa` `senseTag` `distractorTags` など公開デッキで使う最小追加フィールドを定義する
- `app/utils/trainer.ts`
  - `senseTag` や `distractorTags` を使った誤答選択の改善
- `tests/unit/generate-vocabulary.test.ts`
  - 既存の生成テストを新しいオーケストレーションへ寄せる
- `tests/unit/validate-vocabulary.test.ts`
  - 承認済みデッキ前提の検証へ更新する
- `tests/unit/manual-vocabulary.test.ts`
  - seed deck と override の責務分離に合わせる
- `tests/unit/trainer.test.ts`
  - 誤答選択の新ルールを固定する
- `README.md`
  - 新しいデータ生成フロー、追加ソース、`LLM` 補助フローを反映する
- `AGENTS.md`
  - `manual-vocabulary` と `editorial-overrides` の使い分けを反映する
- `docs/dictionary-sources.md`
  - 新ソースと再生成手順を反映する
- `docs/superpowers/specs/2026-04-10-vocabulary-quality-pipeline-design.md`
  - 実装差分が出た場合に同期する

### Notes

- 実装開始時は、ユーザー依頼どおり最初に専用ブランチを切る
- このリポジトリではコミットは明示依頼時のみなので、この計画ではコミット手順を含めない
- `TBCL` や辞典ソースは URL 直接取得が不安定でも回せるよう、`*_SOURCE_PATH` 優先で設計する
- `public/wordlists/*.json` の遅延読み込み構造は維持し、ランタイム依存は増やさない

## Task 1: ブランチ作成と新しいデータ契約を先に固定する

**Files:**
- Modify: `.gitignore`
- Create: `data/editorial-overrides.json`
- Modify: `shared/types/vocabulary.ts`
- Modify: `tests/unit/shared-types-vocabulary.test.ts`
- Create: `tests/unit/vocabulary-editorial-records.test.ts`

- [ ] **Step 1: 実装用ブランチを作成する**

Run: `git switch -c feat/vocabulary-quality-pipeline`
Expected: `Switched to a new branch 'feat/vocabulary-quality-pipeline'`

- [ ] **Step 2: `editorial-overrides` の空ファイルと ignore 対象を表す failing test を追加する**

```ts
it('editorial override は status と canonicalJa を持てる', async () => {
  const { parseEditorialOverrides } = await import('../../scripts/lib/vocabulary-editorial-records.mjs');

  expect(
    parseEditorialOverrides([
      {
        trad: '爸爸',
        status: 'approved',
        canonicalJa: 'お父さん',
        acceptedJa: ['父親'],
        senseTag: 'people.family',
      },
    ])
  ).toEqual([
    expect.objectContaining({
      trad: '爸爸',
      status: 'approved',
      canonicalJa: 'お父さん',
    }),
  ]);
});
```

- [ ] **Step 3: `data/editorial-overrides.json` の初期内容を追加する**

```json
[]
```

- [ ] **Step 4: `shared/types/vocabulary.ts` に公開デッキ用の最小拡張を加える**

```ts
export interface VocabEntry {
  id: string;
  trad: string;
  ja: string;
  acceptedJa?: string[];
  senseTag?: string;
  distractorTags?: string[];
  level: Level;
  length: number;
  category: string;
  taiwanPriority: true;
  sources: string[];
  tocflLevel?: number;
  pronunciation?: string;
  notes?: string;
}
```

- [ ] **Step 5: 型テストと override テストを実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/unit/shared-types-vocabulary.test.ts tests/unit/vocabulary-editorial-records.test.ts`
Expected: PASS

## Task 2: ソース読み込みを `generate-vocabulary` から切り離す

**Files:**
- Create: `scripts/lib/vocabulary-source-readers.mjs`
- Modify: `scripts/setup-data.mjs`
- Modify: `tests/unit/generate-vocabulary.test.ts`
- Create: `tests/unit/vocabulary-source-readers.test.ts`
- Modify: `docs/dictionary-sources.md`

- [ ] **Step 1: 新ソース読込 API の failing test を追加する**

```ts
it('TOCFL と TBCL を共通の source row 形式へ正規化する', async () => {
  const { readTocflRows, readTbclRows } = await import('../../scripts/lib/vocabulary-source-readers.mjs');

  expect(readTocflRows('{"id":1,"text":"爸爸","tocfl_level":1,"category":"people"}\n')).toEqual([
    expect.objectContaining({
      trad: '爸爸',
      source: 'tocfl',
      tocflLevel: 1,
    }),
  ]);

  expect(
    readTbclRows(JSON.stringify([{ word: '爸爸', level: 1, category: 'people.family' }]))
  ).toEqual([
    expect.objectContaining({
      trad: '爸爸',
      source: 'tbcl',
      tbclLevel: 1,
    }),
  ]);
});
```

- [ ] **Step 2: `vocabulary-source-readers.mjs` を追加し、ソースごとの正規化関数を実装する**

```js
export const readTocflRows = (sourceText) =>
  parseJsonOrJsonl(sourceText).map((item) => ({
    trad: String(item.text).trim(),
    source: 'tocfl',
    tocflLevel: Number(item.tocfl_level),
    category: String(item.category ?? '').trim(),
    pronunciation: {
      pinyin: item.pinyin ?? '',
      zhuyin: item.zhuyin ?? '',
    },
  }));

export const readTbclRows = (sourceText) =>
  JSON.parse(sourceText).map((item) => ({
    trad: String(item.word).trim(),
    source: 'tbcl',
    tbclLevel: Number(item.level),
    category: String(item.category ?? '').trim(),
  }));
```

- [ ] **Step 3: `setup-data.mjs` に新ソースの path / URL 受け口を足す**

```js
const sources = [
  {
    label: 'TOCFL source',
    envPath: process.env.TOCFL_SOURCE_PATH,
    envUrl: process.env.TOCFL_SOURCE_URL,
    outputPath: path.join(snapshotDir, 'tocfl_words.json'),
  },
  {
    label: 'TBCL source',
    envPath: process.env.TBCL_SOURCE_PATH,
    envUrl: process.env.TBCL_SOURCE_URL,
    outputPath: path.join(snapshotDir, 'tbcl_words.json'),
    optional: true,
  },
];
```

- [ ] **Step 4: 新しいソース読込テストと既存生成テストの関連ケースを実行する**

Run: `npm run test:unit -- --run tests/unit/vocabulary-source-readers.test.ts tests/unit/generate-vocabulary.test.ts`
Expected: PASS

- [ ] **Step 5: `docs/dictionary-sources.md` に `TBCL_SOURCE_PATH` などの入力経路を追記する**

```md
- `TBCL` や辞典ソースは `*_SOURCE_PATH` を優先し、取得 URL が安定している場合のみ `*_SOURCE_URL` を使う
```

## Task 3: 候補語合成と危険語除外ルールを独立モジュールにする

**Files:**
- Create: `scripts/lib/vocabulary-candidate-pipeline.mjs`
- Modify: `scripts/generate-vocabulary.mjs`
- Create: `tests/unit/vocabulary-candidate-pipeline.test.ts`
- Modify: `tests/unit/generate-vocabulary.test.ts`
- Modify: `scripts/audit-vocabulary-quality.mjs`

- [ ] **Step 1: 危険語除外の failing test を追加する**

```ts
it('姓・分類語・固有名詞寄り語義を Level 1 候補から落とす', async () => {
  const { buildCandidates } = await import('../../scripts/lib/vocabulary-candidate-pipeline.mjs');

  const candidates = buildCandidates({
    tocflRows: [{ trad: '三', tocflLevel: 1, category: '基礎', source: 'tocfl' }],
    tbclRows: [],
    mjdicEntries: [
      {
        trad: '三',
        meansJa: 'サン姓',
        means: 'surname San',
        pronunciation: 'san1',
      },
    ],
  });

  expect(candidates).toEqual([]);
});
```

- [ ] **Step 2: `buildCandidates` を実装し、ソース照合と危険フラグ付与を行う**

```js
export const buildCandidates = ({ tocflRows, tbclRows, mjdicEntries, seedEntries = [] }) => {
  const candidatesByTrad = new Map();

  for (const row of [...tocflRows, ...tbclRows]) {
    const current = candidatesByTrad.get(row.trad) ?? createEmptyCandidate(row.trad);
    candidatesByTrad.set(row.trad, mergeSourceRow(current, row));
  }

  for (const entry of mjdicEntries) {
    const current = candidatesByTrad.get(entry.trad) ?? createEmptyCandidate(entry.trad);
    current.rawGlosses.push({
      source: 'mjdic',
      meansJa: entry.meansJa,
      means: entry.means,
    });
    candidatesByTrad.set(entry.trad, current);
  }

  return [...candidatesByTrad.values()].filter((candidate) => !shouldRejectCandidate(candidate));
};
```

- [ ] **Step 3: `generate-vocabulary.mjs` をオーケストレーターへ縮小する**

```js
const { tocflRows, tbclRows, mjdicEntries } = readAllVocabularySources();
const candidates = buildCandidates({ tocflRows, tbclRows, mjdicEntries, seedEntries: manualVocabulary });
const editorialRecords = loadEditorialRecords();
const publishedVocabulary = buildPublishedVocabulary({ candidates, editorialRecords, seedEntries: manualVocabulary });
writeVocabularyOutputs(publishedVocabulary);
```

- [ ] **Step 4: `audit-vocabulary-quality.mjs` に教材品質寄りの監査項目を追加する**

```js
{
  name: 'classifier_like',
  test: (entry) => /分類語|助数詞|クラシファイア/.test(entry.notes ?? ''),
},
{
  name: 'proper_noun_like',
  test: (entry) => /人名|地名|組織名/.test(entry.notes ?? ''),
}
```

- [ ] **Step 5: 候補生成テストと既存生成テストを実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/unit/vocabulary-candidate-pipeline.test.ts tests/unit/generate-vocabulary.test.ts`
Expected: PASS

## Task 4: `approved deck only` と編集レコード統合へ切り替える

**Files:**
- Create: `scripts/lib/vocabulary-editorial-records.mjs`
- Create: `scripts/lib/vocabulary-publish.mjs`
- Modify: `scripts/generate-vocabulary.mjs`
- Modify: `scripts/validate-vocabulary.mjs`
- Modify: `tests/unit/vocabulary-editorial-records.test.ts`
- Modify: `tests/unit/validate-vocabulary.test.ts`
- Modify: `tests/unit/manual-vocabulary.test.ts`

- [ ] **Step 1: 承認状態ごとの公開可否を表す failing test を追加する**

```ts
it('Level 1-2 は approved の候補だけを公開デッキへ出す', async () => {
  const { buildPublishedVocabulary } = await import('../../scripts/lib/vocabulary-publish.mjs');

  const published = buildPublishedVocabulary({
    candidates: [
      { trad: '爸爸', level: 1, status: 'approved', canonicalJa: 'お父さん', category: 'people' },
      { trad: '三', level: 1, status: 'pending', canonicalJa: '三', category: 'number' },
    ],
    editorialRecords: [],
    seedEntries: [],
  });

  expect(published.map((entry) => entry.trad)).toEqual(['爸爸']);
});
```

- [ ] **Step 2: `parseEditorialOverrides` と `mergeEditorialState` を実装する**

```js
export const parseEditorialOverrides = (rawValue) => editorialOverrideSchema.array().parse(rawValue);

export const mergeEditorialState = ({ candidate, override }) => ({
  ...candidate,
  status: override?.status ?? candidate.status ?? 'pending',
  canonicalJa: override?.canonicalJa ?? candidate.canonicalJa ?? null,
  acceptedJa: override?.acceptedJa ?? candidate.acceptedJa ?? [],
  senseTag: override?.senseTag ?? candidate.senseTag ?? null,
});
```

- [ ] **Step 3: `buildPublishedVocabulary` を実装し、seed deck と override を統合する**

```js
export const buildPublishedVocabulary = ({ candidates, editorialRecords, seedEntries }) => {
  const approvedCandidates = candidates
    .map((candidate) => mergeEditorialState({ candidate, override: editorialRecords.get(candidate.trad) }))
    .filter((candidate) => candidate.level === 3 || candidate.status === 'approved');

  const publishedEntries = [
    ...seedEntries.map(toPublishedSeedEntry),
    ...approvedCandidates.map(toPublishedVocabularyEntry),
  ];

  return dedupePublishedEntries(publishedEntries);
};
```

- [ ] **Step 4: `validate-vocabulary.mjs` を新フィールドと承認済みデッキ前提へ更新する**

```js
const entrySchema = z.object({
  id: z.string().min(1),
  trad: z.string().min(1),
  ja: z.string().min(1),
  acceptedJa: z.array(z.string().min(1)).optional(),
  senseTag: z.string().min(1).optional(),
  distractorTags: z.array(z.string().min(1)).optional(),
  level: levelSchema,
  length: z.number().int().min(1),
  category: z.string().min(1),
  taiwanPriority: z.literal(true),
  sources: z.array(z.string().min(1)).min(1),
});
```

- [ ] **Step 5: 編集レコード・validation・manual seed の関連テストを実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/unit/vocabulary-editorial-records.test.ts tests/unit/validate-vocabulary.test.ts tests/unit/manual-vocabulary.test.ts`
Expected: PASS

## Task 5: `LLM` 補助用のレビュー出力と取り込み口を作る

**Files:**
- Create: `scripts/export-vocabulary-review-batch.mjs`
- Create: `scripts/apply-vocabulary-review-results.mjs`
- Create: `tests/unit/vocabulary-review-batch.test.ts`
- Modify: `README.md`
- Modify: `docs/dictionary-sources.md`

- [ ] **Step 1: レビュー候補の export 形式を固定する failing test を追加する**

```ts
it('低信頼候補だけを LLM review batch へ書き出す', async () => {
  const { buildReviewBatch } = await import('../../scripts/export-vocabulary-review-batch.mjs');

  const batch = buildReviewBatch([
    {
      trad: '爸爸',
      confidence: 'high',
      rawGlosses: [{ source: 'mjdic', meansJa: 'お父さん', means: 'dad' }],
    },
    {
      trad: '上手',
      confidence: 'low',
      rawGlosses: [{ source: 'mjdic', meansJa: '主賓の右隣の席に手を置く', means: 'take the seat at the right' }],
    },
  ]);

  expect(batch).toHaveLength(1);
  expect(batch[0]).toMatchObject({
    trad: '上手',
    requestedFields: ['canonicalJa', 'acceptedJa', 'riskFlags', 'recommendedStatus'],
  });
});
```

- [ ] **Step 2: export スクリプトで構造化 JSONL を出力する**

```js
export const buildReviewBatch = (candidates) =>
  candidates
    .filter((candidate) => candidate.confidence === 'low' || candidate.riskFlags.length > 0)
    .map((candidate) => ({
      trad: candidate.trad,
      sourceEvidence: candidate.sources,
      glossEvidence: candidate.rawGlosses,
      requestedFields: ['canonicalJa', 'acceptedJa', 'riskFlags', 'recommendedStatus'],
    }));
```

- [ ] **Step 3: import スクリプトで `editorial-overrides.json` を安全に更新する**

```js
export const mergeReviewResults = ({ existingOverrides, reviewResults }) => {
  const merged = new Map(existingOverrides.map((item) => [item.trad, item]));

  for (const result of reviewResults) {
    merged.set(result.trad, {
      trad: result.trad,
      status: result.recommendedStatus,
      canonicalJa: result.canonicalJa,
      acceptedJa: result.acceptedJa ?? [],
      reviewReason: 'llm-assisted review',
    });
  }

  return [...merged.values()].sort((left, right) => left.trad.localeCompare(right.trad, 'zh-Hant'));
};
```

- [ ] **Step 4: `README.md` と `docs/dictionary-sources.md` にレビュー用コマンドを追記する**

```md
LLM 補助レビューを使う場合:

```bash
node scripts/export-vocabulary-review-batch.mjs
node scripts/apply-vocabulary-review-results.mjs /path/to/review-results.json
```
```

- [ ] **Step 5: レビュー関連テストを実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/unit/vocabulary-review-batch.test.ts`
Expected: PASS

## Task 6: 誤答選択を `senseTag` ベースで改善する

**Files:**
- Modify: `app/utils/trainer.ts`
- Modify: `tests/unit/trainer.test.ts`
- Modify: `shared/types/vocabulary.ts`
- Modify: `scripts/lib/vocabulary-publish.mjs`

- [ ] **Step 1: 誤答選択の期待値を表す failing test を追加する**

```ts
it('誤答は同じ意味領域を優先しつつ、同義語に寄りすぎる候補は避ける', () => {
  const question = buildQuestion(
    [
      { id: '1', trad: '爸爸', ja: 'お父さん', level: 1, length: 2, category: 'people', taiwanPriority: true, sources: ['seed'], senseTag: 'people.family', distractorTags: ['people', 'family'] },
      { id: '2', trad: '媽媽', ja: 'お母さん', level: 1, length: 2, category: 'people', taiwanPriority: true, sources: ['seed'], senseTag: 'people.family', distractorTags: ['people', 'family'] },
      { id: '3', trad: '老師', ja: '先生', level: 1, length: 2, category: 'people', taiwanPriority: true, sources: ['seed'], senseTag: 'people.profession', distractorTags: ['people', 'profession'] },
      { id: '4', trad: '學生', ja: '学生', level: 1, length: 2, category: 'people', taiwanPriority: true, sources: ['seed'], senseTag: 'people.profession', distractorTags: ['people', 'profession'] },
    ],
    1,
    []
  );

  const labels = question.choices.map((choice) => choice.label);
  expect(labels).toContain('お母さん');
  expect(labels).toContain('先生');
});
```

- [ ] **Step 2: `trainer.ts` に `senseTag` / `distractorTags` ベースの優先度を追加する**

```ts
const getDistractorPriority = (correctEntry: VocabEntry, entry: VocabEntry): number => {
  if (entry.senseTag && entry.senseTag === correctEntry.senseTag) {
    return 3;
  }

  if (
    entry.distractorTags?.some((tag) => correctEntry.distractorTags?.includes(tag))
  ) {
    return 2;
  }

  if (entry.category === correctEntry.category && entry.length === correctEntry.length) {
    return 1;
  }

  return 0;
};
```

- [ ] **Step 3: 公開デッキ生成時に `senseTag` と `distractorTags` を引き継ぐ**

```js
const toPublishedVocabularyEntry = (candidate) => ({
  id: candidate.id,
  trad: candidate.trad,
  ja: candidate.canonicalJa,
  acceptedJa: candidate.acceptedJa,
  senseTag: candidate.senseTag ?? undefined,
  distractorTags: candidate.distractorTags ?? undefined,
  level: candidate.level,
  length: candidate.length,
  category: candidate.category,
  taiwanPriority: true,
  sources: candidate.sources,
});
```

- [ ] **Step 4: `trainer` テストを実行して GREEN を確認する**

Run: `npm run test:unit -- --run tests/unit/trainer.test.ts`
Expected: PASS

## Task 7: ドキュメント同期と関連コマンドの検証を完了する

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/dictionary-sources.md`
- Modify: `docs/superpowers/specs/2026-04-10-vocabulary-quality-pipeline-design.md`
- Modify: `docs/superpowers/plans/2026-04-10-vocabulary-quality-pipeline.md`

- [ ] **Step 1: `README.md` を新フローに同期する**

```md
- `data/manual-vocabulary.json` は seed deck として扱う
- `data/editorial-overrides.json` で承認状態と日本語ラベル補正を管理する
- `Level 1-2` は承認済み候補だけを出題デッキへ含める
```

- [ ] **Step 2: `AGENTS.md` に運用更新を反映する**

```md
- 重要語の追加は `data/manual-vocabulary.json`
- 自動候補の採否や日本語ラベル補正は `data/editorial-overrides.json`
```

- [ ] **Step 3: 変更に関係する検証を実行する**

Run: `npm run lint`
Expected: PASS

Run: `npm run test:unit`
Expected: PASS

Run: `npx tsc --noEmit -p .nuxt/tsconfig.json`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: 語彙生成フローの検証を実行する**

Run: `npm run generate:data`
Expected: exits 0 and `data/vocabulary.json` `data/vocabulary-level-1.json` `data/vocabulary-level-2.json` `data/vocabulary-level-3.json` `public/wordlists/metadata.json` が更新される

Run: `npm run check:data`
Expected: exits 0 and `Validated ` で始まる検証完了メッセージが表示される

Run: `npm run audit:data`
Expected: exits 0 and `classifier_like` `proper_noun_like` を含む監査結果が表示される

- [ ] **Step 5: spec と plan の差分を確認し、実装内容に合わせて文言を同期する**

Run: `git diff -- README.md AGENTS.md docs/dictionary-sources.md docs/superpowers/specs/2026-04-10-vocabulary-quality-pipeline-design.md docs/superpowers/plans/2026-04-10-vocabulary-quality-pipeline.md`
Expected: 実装結果と説明文が一致している
