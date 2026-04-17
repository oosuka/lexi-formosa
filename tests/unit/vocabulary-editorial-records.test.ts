// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary editorial records', () => {
  it('editorial override は status と canonicalJa を持てる', async () => {
    const { parseEditorialOverrides } = await import(
      '../../scripts/lib/vocabulary-editorial-records.mjs'
    );

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
});
