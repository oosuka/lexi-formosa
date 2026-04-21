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
});
