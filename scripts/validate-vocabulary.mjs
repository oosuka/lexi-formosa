import { z } from 'zod';

import vocabulary from '../data/vocabulary.json' with { type: 'json' };

const levelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const entrySchema = z.object({
  id: z.string().min(1),
  trad: z.string().min(1),
  ja: z.string().min(1),
  level: levelSchema,
  length: z.number().int().min(1),
  category: z.string().min(1),
  taiwanPriority: z.literal(true),
  sources: z.array(z.string().min(1)).min(1),
  tocflLevel: z.number().int().positive().optional(),
  pronunciation: z.string().min(1).optional(),
  notes: z.string().optional(),
});

const levelLengthMap = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
};

const simplifiedOnlyPattern = /汉|观|气|馆|铁|听|习|国|图|车|广|务/;
const invalidJapaneseGlossPattern = /^[\p{P}\p{S}\s]+$/u;
const entries = z.array(entrySchema).parse(vocabulary);
const ids = new Set();
const trads = new Set();

for (const entry of entries) {
  if (ids.has(entry.id)) {
    throw new Error(`Duplicate id detected: ${entry.id}`);
  }

  ids.add(entry.id);

  if (trads.has(entry.trad)) {
    throw new Error(`Duplicate trad detected: ${entry.trad}`);
  }

  trads.add(entry.trad);

  const actualLength = [...entry.trad].length;
  const [minLength, maxLength] = levelLengthMap[entry.level];

  if (actualLength !== entry.length) {
    throw new Error(
      `Length mismatch for ${entry.id}: expected ${entry.length}, got ${actualLength}.`
    );
  }

  if (actualLength < minLength || actualLength > maxLength) {
    throw new Error(
      `Level mismatch for ${entry.id}: ${entry.trad} does not fit level ${entry.level}.`
    );
  }

  if (simplifiedOnlyPattern.test(entry.trad)) {
    throw new Error(`Possible simplified character detected in ${entry.id}: ${entry.trad}`);
  }

  if (invalidJapaneseGlossPattern.test(entry.ja)) {
    throw new Error(`Invalid Japanese gloss detected in ${entry.id}: ${entry.ja}`);
  }

  if (/[。？！…]|\.{3,}/.test(entry.ja)) {
    throw new Error(`Sentence-like Japanese gloss detected in ${entry.id}: ${entry.ja}`);
  }

  if (/[()（）]/.test(entry.ja)) {
    throw new Error(`Parenthetical Japanese gloss detected in ${entry.id}: ${entry.ja}`);
  }
}

console.log(`Validated ${entries.length} vocabulary entries across 3 levels.`);
