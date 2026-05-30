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

  it('BOM 付き JSONL と空ファイルを source row 入力として扱える', async () => {
    const { parseJsonOrJsonl, readTocflRows, readTbclRows } = await import(
      '../../scripts/lib/vocabulary-source-readers.mjs'
    );

    expect(parseJsonOrJsonl('  \n')).toEqual([]);
    expect(readTocflRows('\uFEFF{"text":"茶","tocfl_level":1}\n')).toEqual([
      expect.objectContaining({
        trad: '茶',
        source: 'tocfl',
        tocflLevel: 1,
        category: '',
        pronunciation: {
          pinyin: '',
          zhuyin: '',
        },
      }),
    ]);
    expect(readTbclRows('[{"text":"公車","level":2}]')).toEqual([
      expect.objectContaining({
        trad: '公車',
        source: 'tbcl',
        tbclLevel: 2,
        category: '',
      }),
    ]);
  });

  it('複数行 JSONL を source row 配列として読む', async () => {
    const { parseJsonOrJsonl } = await import('../../scripts/lib/vocabulary-source-readers.mjs');

    expect(parseJsonOrJsonl('{"text":"茶"}\n{"text":"公車"}')).toEqual([
      { text: '茶' },
      { text: '公車' },
    ]);
  });
});
