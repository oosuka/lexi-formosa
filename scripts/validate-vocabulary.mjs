import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';

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
const invalidChineseGlossPattern =
  /丝|东|亚|联|门|龙|云|广|务|听|汉|观|馆|铁|习|赔|语|图|气|车|动|词|类|这|样|什麼|甚麼|^[\p{Script=Han}々]+と同じ$/u;
const invalidJapaneseGlossPattern = /^[\p{P}\p{S}\s]+$/u;
const classifierLikeGlossPattern =
  /^(部|個|件|台|輛|名|位|條|張|本|家|把|面|隻|口|頭|瓶|杯|雙|份|粒|棵|艘|支|枚|匹)$/u;
export const validateVocabularyEntries = (rawEntries) => {
  const entries = z.array(entrySchema).parse(rawEntries);
  const ids = new Set();
  const trads = new Set();
  const labelsByLevel = new Map([
    [1, new Set()],
    [2, new Set()],
    [3, new Set()],
  ]);

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
        `Length out of range for ${entry.id}: ${entry.trad} (length ${actualLength}) is outside the allowed range [${minLength}, ${maxLength}] for level ${entry.level}.`
      );
    }

    if (simplifiedOnlyPattern.test(entry.trad)) {
      throw new Error(`Possible simplified character detected in ${entry.id}: ${entry.trad}`);
    }

    if (invalidJapaneseGlossPattern.test(entry.ja)) {
      throw new Error(`Invalid Japanese gloss detected in ${entry.id}: ${entry.ja}`);
    }

    if (invalidChineseGlossPattern.test(entry.ja)) {
      throw new Error(
        `Untranslated or simplified Chinese gloss detected in ${entry.id}: ${entry.ja}`
      );
    }

    if (/[。？！…]|\.{3,}/.test(entry.ja)) {
      throw new Error(`Sentence-like Japanese gloss detected in ${entry.id}: ${entry.ja}`);
    }

    if (/[()（）]/.test(entry.ja)) {
      throw new Error(`Parenthetical Japanese gloss detected in ${entry.id}: ${entry.ja}`);
    }

    if (actualLength > 1 && classifierLikeGlossPattern.test(entry.ja)) {
      throw new Error(`Classifier-like Japanese gloss detected in ${entry.id}: ${entry.ja}`);
    }

    labelsByLevel.get(entry.level)?.add(entry.ja);
  }

  for (const [level, labels] of labelsByLevel) {
    if (labels.size < 4) {
      throw new Error(
        `Level ${level} does not have enough distinct Japanese labels to build 4-choice questions.`
      );
    }
  }

  return entries;
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const vocabulary = JSON.parse(
    fs.readFileSync(new URL('../data/vocabulary.json', import.meta.url), 'utf8')
  );
  const entries = validateVocabularyEntries(vocabulary);
  console.log(`Validated ${entries.length} vocabulary entries across 3 levels.`);
}
