// @vitest-environment node
import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

type ManualVocabularyEntry = {
  trad: string;
  ja: string;
  level: number;
};

const manualVocabulary = JSON.parse(
  fs.readFileSync(new URL('../../data/manual-vocabulary.json', import.meta.url), 'utf8')
) as ManualVocabularyEntry[];

describe('manual vocabulary', () => {
  it('同じ level で日本語訳が衝突しない', () => {
    const translationsByLevel = new Map<string, string[]>();

    for (const entry of manualVocabulary) {
      const key = `${entry.level}:${entry.ja}`;

      if (!translationsByLevel.has(key)) {
        translationsByLevel.set(key, []);
      }

      translationsByLevel.get(key)?.push(entry.trad);
    }

    const collisions = [...translationsByLevel.entries()].filter(([, trads]) => trads.length > 1);

    expect(collisions).toEqual([]);
  });
});
