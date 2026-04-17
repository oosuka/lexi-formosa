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

  it('Level 3 でも rejected override の候補は公開デッキへ出さない', async () => {
    const { buildPublishedVocabulary } = await import('../../scripts/lib/vocabulary-publish.mjs');

    const published = buildPublishedVocabulary({
      candidates: [
        {
          id: 'cand-level-3',
          trad: '八一建軍節',
          level: 3,
          length: 5,
          category: 'extended:八',
          status: 'approved',
          canonicalJa: '建軍節を参照',
          sources: ['mjdic'],
          taiwanPriority: true,
        },
      ],
      editorialRecords: [{ trad: '八一建軍節', status: 'rejected' }],
      seedEntries: [],
    });

    expect(published).toEqual([]);
  });
});
