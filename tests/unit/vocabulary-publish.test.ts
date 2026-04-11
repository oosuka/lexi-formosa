// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary publish', () => {
  it('Level 1-2 は approved の候補だけを公開デッキへ出す', async () => {
    const { buildPublishedVocabulary } = await import('../../scripts/lib/vocabulary-publish.mjs');

    const published = buildPublishedVocabulary({
      candidates: [
        {
          id: 'cand-1',
          trad: '爸爸',
          level: 1,
          length: 2,
          category: 'people',
          status: 'approved',
          canonicalJa: 'お父さん',
          sources: ['tocfl', 'mjdic'],
          taiwanPriority: true,
        },
        {
          id: 'cand-2',
          trad: '三',
          level: 1,
          length: 1,
          category: 'number',
          status: 'pending',
          canonicalJa: '三',
          sources: ['tocfl', 'mjdic'],
          taiwanPriority: true,
        },
      ],
      editorialRecords: [],
      seedEntries: [],
    });

    expect(published.map((entry) => entry.trad)).toEqual(['爸爸']);
  });
});
