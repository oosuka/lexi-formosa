import { describe, expect, it } from 'vitest';

import type { VocabEntry } from '~~/shared/types/vocabulary';
import { LEVELS } from '~~/shared/types/vocabulary';

describe('shared vocabulary types', () => {
  it('shared/types から語彙レベル定義を参照できる', () => {
    expect(LEVELS).toEqual([1, 2, 3]);
  });

  it('公開デッキ用の拡張フィールドを持つ語彙エントリを扱える', () => {
    const entry: VocabEntry = {
      id: 'seed-1',
      trad: '爸爸',
      ja: 'お父さん',
      acceptedJa: ['父親'],
      senseTag: 'people.family',
      distractorTags: ['people', 'family'],
      level: 1,
      length: 2,
      category: 'people',
      taiwanPriority: true,
      sources: ['seed'],
    };

    expect(entry.acceptedJa).toEqual(['父親']);
    expect(entry.senseTag).toBe('people.family');
    expect(entry.distractorTags).toEqual(['people', 'family']);
  });
});
