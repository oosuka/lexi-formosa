// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary review batch', () => {
  it('Level 1-2 の未レビュー候補と低信頼候補を LLM review batch へ書き出す', async () => {
    const { buildReviewBatch } = await import('../../scripts/export-vocabulary-review-batch.mjs');

    const batch = buildReviewBatch(
      [
        {
          trad: '爸爸',
          level: 1,
          canonicalJa: 'お父さん',
          confidence: 'high',
          sources: ['tocfl', 'tbcl'],
          rawGlosses: [{ source: 'mjdic', meansJa: 'お父さん', means: 'dad' }],
        },
        {
          trad: '上手',
          level: 1,
          canonicalJa: '上手',
          confidence: 'medium',
          sources: ['tocfl', 'mjdic'],
          rawGlosses: [
            {
              source: 'mjdic',
              meansJa: '主賓の右隣の席に手を置く',
              means: 'take the seat at the right',
            },
          ],
        },
        {
          trad: '百科全書',
          level: 2,
          canonicalJa: '百科事典',
          confidence: 'high',
          sources: ['tocfl', 'tbcl'],
          rawGlosses: [{ source: 'mjdic', meansJa: '百科事典', means: 'encyclopedia' }],
        },
        {
          trad: '阿拉善右旗',
          level: 3,
          canonicalJa: '内モンゴル',
          confidence: 'low',
          sources: ['mjdic'],
          rawGlosses: [
            {
              source: 'mjdic',
              meansJa: '内モンゴル',
              means: 'Alxa Right Banner',
            },
          ],
        },
        {
          trad: '便利商店',
          level: 2,
          canonicalJa: 'コンビニ',
          confidence: 'medium',
          sources: ['tocfl', 'mjdic'],
          rawGlosses: [
            {
              source: 'mjdic',
              meansJa: 'コンビニ',
              means: 'convenience store',
            },
          ],
        },
        {
          trad: '科學方法',
          level: 3,
          canonicalJa: '科学的方法',
          confidence: 'medium',
          sources: ['mjdic'],
          rawGlosses: [
            {
              source: 'mjdic',
              meansJa: '科学的方法',
              means: 'scientific method',
            },
          ],
        },
      ],
      [
        {
          trad: '爸爸',
          status: 'approved',
          canonicalJa: 'お父さん',
        },
        {
          trad: '便利商店',
          status: 'approved',
          canonicalJa: 'コンビニ',
        },
      ]
    );

    expect(batch.map((entry) => entry.trad)).toEqual(['上手', '百科全書']);
    expect(batch[0]).toMatchObject({
      trad: '上手',
      level: 1,
      currentCanonicalJa: '上手',
      requestedFields: ['canonicalJa', 'acceptedJa', 'riskFlags', 'recommendedStatus'],
    });
    expect(batch[1]).toMatchObject({
      trad: '百科全書',
      level: 2,
    });
  });

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

  it('review batch は最大件数で切れる', async () => {
    const { buildReviewBatch } = await import('../../scripts/export-vocabulary-review-batch.mjs');

    const batch = buildReviewBatch(
      [
        {
          trad: '上手',
          level: 1,
          canonicalJa: '上手',
          confidence: 'medium',
          sources: ['tocfl', 'mjdic'],
          rawGlosses: [
            {
              source: 'mjdic',
              meansJa: '主賓の右隣の席に手を置く',
              means: 'take the seat at the right',
            },
          ],
        },
        {
          trad: '百科全書',
          level: 2,
          canonicalJa: '百科事典',
          confidence: 'high',
          sources: ['tocfl', 'tbcl'],
          rawGlosses: [{ source: 'mjdic', meansJa: '百科事典', means: 'encyclopedia' }],
        },
      ],
      [],
      { limit: 1 }
    );

    expect(batch).toHaveLength(1);
    expect(batch[0]?.trad).toBe('上手');
  });

  it('公開デッキに入らない MJdic 単独の短い候補は review batch へ出さない', async () => {
    const { buildReviewBatch } = await import('../../scripts/export-vocabulary-review-batch.mjs');

    const batch = buildReviewBatch([
      {
        trad: '圍棋',
        level: 1,
        canonicalJa: '囲碁',
        confidence: 'low',
        sources: ['mjdic'],
        rawGlosses: [{ source: 'mjdic', meansJa: '囲碁', means: 'go game' }],
      },
    ]);

    expect(batch).toEqual([]);
  });

  it('review 結果を editorial override へマージする', async () => {
    const { mergeReviewResults } = await import(
      '../../scripts/apply-vocabulary-review-results.mjs'
    );

    expect(
      mergeReviewResults({
        existingOverrides: [{ trad: '爸爸', status: 'approved', canonicalJa: 'お父さん' }],
        reviewResults: [
          {
            trad: '上手',
            recommendedStatus: 'pending',
            canonicalJa: '上手',
            acceptedJa: ['得意'],
          },
        ],
      })
    ).toEqual([
      { trad: '上手', status: 'pending', canonicalJa: '上手', acceptedJa: ['得意'] },
      { trad: '爸爸', status: 'approved', canonicalJa: 'お父さん' },
    ]);
  });
});
