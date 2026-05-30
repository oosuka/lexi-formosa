// @vitest-environment node
import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

type ManualVocabularyEntry = {
  id: string;
  trad: string;
  ja: string;
  category: string;
  pronunciation?: string;
};

const manualVocabulary = JSON.parse(
  fs.readFileSync(new URL('../../data/manual-vocabulary.json', import.meta.url), 'utf8')
) as ManualVocabularyEntry[];

const determineLevel = (trad: string) => {
  const length = [...trad].length;

  if (length <= 1) {
    return 1;
  }

  if (length === 2) {
    return 2;
  }

  return 3;
};

describe('manual vocabulary', () => {
  it('seed 専用の手入力項目だけを持つ', () => {
    const allowedKeys = new Set(['id', 'trad', 'ja', 'category', 'pronunciation']);
    const legacyFields = [];

    for (const entry of manualVocabulary) {
      for (const key of Object.keys(entry)) {
        if (!allowedKeys.has(key)) {
          legacyFields.push(`${entry.id}:${key}`);
        }
      }
    }

    expect(legacyFields).toEqual([]);
  });

  it('同じ level で日本語訳が衝突しない', () => {
    const translationsByLevel = new Map<string, string[]>();

    for (const entry of manualVocabulary) {
      const key = `${determineLevel(entry.trad)}:${entry.ja}`;

      if (!translationsByLevel.has(key)) {
        translationsByLevel.set(key, []);
      }

      translationsByLevel.get(key)?.push(entry.trad);
    }

    const collisions = [...translationsByLevel.entries()].filter(([, trads]) => trads.length > 1);

    expect(collisions).toEqual([]);
  });

  it('Level 3 の手動 seed を約300語到達に必要な件数まで持つ', () => {
    const levelThreeEntries = manualVocabulary.filter((entry) => determineLevel(entry.trad) === 3);

    expect(levelThreeEntries.length).toBeGreaterThanOrEqual(196);
  });

  it('manual-vocabulary seed を正規化し、生成専用フィールドを拒否する', async () => {
    const { parseManualVocabularySeeds } = await import(
      '../../scripts/lib/manual-vocabulary-seeds.mjs'
    );

    expect(
      parseManualVocabularySeeds([
        {
          id: ' greeting-1 ',
          trad: ' 你好 ',
          ja: ' こんにちは ',
          category: ' greeting ',
          pronunciation: ' ニ ハオ ',
        },
      ])
    ).toEqual([
      {
        id: 'greeting-1',
        trad: '你好',
        ja: 'こんにちは',
        category: 'greeting',
        pronunciation: 'ニ ハオ',
      },
    ]);

    expect(() =>
      parseManualVocabularySeeds([
        {
          id: 'generated-field',
          trad: '茶',
          ja: 'お茶',
          category: 'food',
          level: 1,
        },
      ])
    ).toThrow('must not include generated fields: level');
  });

  it('manual-vocabulary seed の必須フィールドと任意発音は空文字を拒否する', async () => {
    const { parseManualVocabularySeeds } = await import(
      '../../scripts/lib/manual-vocabulary-seeds.mjs'
    );

    expect(() => parseManualVocabularySeeds({})).toThrow('must be an array');
    expect(() => parseManualVocabularySeeds(['茶'])).toThrow('entry 1 must be an object');
    expect(() =>
      parseManualVocabularySeeds([
        {
          id: 'missing-ja',
          trad: '茶',
          category: 'food',
        },
      ])
    ).toThrow('must include a non-empty ja');
    expect(() =>
      parseManualVocabularySeeds([
        {
          id: 'empty-pronunciation',
          trad: '茶',
          ja: 'お茶',
          category: 'food',
          pronunciation: ' ',
        },
      ])
    ).toThrow('must use a non-empty pronunciation');
  });

  it('単語長からレベルを判定し、レベルごとの許容長を検証する', async () => {
    const { determineLevel, isLengthAllowedForLevel, levelLengthMap } = await import(
      '../../scripts/lib/vocabulary-levels.mjs'
    );

    expect([determineLevel(1), determineLevel(2), determineLevel(3)]).toEqual([1, 2, 3]);
    expect(levelLengthMap).toEqual({
      1: [1, 1],
      2: [2, 2],
      3: [3, Number.POSITIVE_INFINITY],
    });
    expect(isLengthAllowedForLevel(1, 1)).toBe(true);
    expect(isLengthAllowedForLevel(1, 2)).toBe(false);
    expect(isLengthAllowedForLevel(2, 2)).toBe(true);
    expect(isLengthAllowedForLevel(3, 3)).toBe(true);
  });
});
