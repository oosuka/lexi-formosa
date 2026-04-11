// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary source readers', () => {
  it('TOCFL と TBCL を共通の source row 形式へ正規化する', async () => {
    const { readTocflRows, readTbclRows } = await import(
      '../../scripts/lib/vocabulary-source-readers.mjs'
    );

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
});
