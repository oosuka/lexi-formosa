import { describe, expect, it } from 'vitest';

import { LEVELS } from '~~/shared/types/vocabulary';

describe('shared vocabulary types', () => {
  it('shared/types から語彙レベル定義を参照できる', () => {
    expect(LEVELS).toEqual([1, 2, 3]);
  });
});
