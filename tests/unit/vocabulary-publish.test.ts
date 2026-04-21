// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary publish', () => {
  it('publishable かつ approved の候補だけを公開デッキへ出し、unused な acceptedJa は公開しない', async () => {
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
          acceptedJa: ['父親'],
          publishable: true,
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
          publishable: true,
          sources: ['tocfl', 'mjdic'],
          taiwanPriority: true,
        },
        {
          id: 'cand-3',
          trad: '便利商店',
          level: 3,
          length: 4,
          category: 'place',
          status: 'approved',
          canonicalJa: 'コンビニ',
          publishable: false,
          sources: ['tocfl', 'mjdic'],
          taiwanPriority: true,
        },
      ],
      seedEntries: [],
    });

    expect(published.map((entry) => entry.trad)).toEqual(['爸爸']);
    expect(published[0]).not.toHaveProperty('acceptedJa');
  });

  it('publishable な候補は override なしでも公開デッキへ残る', async () => {
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
          publishable: true,
          sources: ['mjdic'],
          taiwanPriority: true,
        },
      ],
      seedEntries: [],
    });

    expect(published).toHaveLength(1);
  });

  it('manual seed は公開時に taiwanPriority を補完する', async () => {
    const { buildPublishedVocabulary } = await import('../../scripts/lib/vocabulary-publish.mjs');

    const published = buildPublishedVocabulary({
      candidates: [],
      seedEntries: [
        {
          id: 'seed-1',
          trad: '你好',
          ja: 'こんにちは',
          level: 2,
          length: 2,
          category: 'greeting',
          sources: ['seed'],
        },
      ],
    });

    expect(published).toEqual([
      expect.objectContaining({
        trad: '你好',
        taiwanPriority: true,
      }),
    ]);
  });
});
