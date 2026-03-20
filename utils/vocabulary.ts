import { joinURL } from 'ufo';
import { z } from 'zod';

import type { Level, VocabEntry, VocabularyMetadata } from '~/types/vocabulary';

const vocabEntrySchema = z.object({
  id: z.string().min(1),
  trad: z.string().min(1),
  ja: z.string().min(1),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  length: z.number().int().min(1),
  category: z.string().min(1),
  taiwanPriority: z.literal(true),
  sources: z.array(z.string().min(1)).min(1),
  tocflLevel: z.number().int().positive().optional(),
  pronunciation: z.string().min(1).optional(),
  notes: z.string().optional(),
});

const levelLengthMap: Record<Level, [number, number]> = {
  1: [1, 2],
  2: [3, 4],
  3: [5, 6],
};

const vocabularyCache = new Map<Level, VocabEntry[]>();
let metadataCache: VocabularyMetadata | null = null;

const vocabularyMetadataSchema = z.object({
  total: z.number().int().nonnegative(),
  counts: z.object({
    1: z.number().int().nonnegative(),
    2: z.number().int().nonnegative(),
    3: z.number().int().nonnegative(),
  }),
});

const validateVocabulary = (entries: unknown, level: Level): VocabEntry[] => {
  const parsedVocabulary = z.array(vocabEntrySchema).parse(entries) satisfies VocabEntry[];

  for (const entry of parsedVocabulary) {
    const actualLength = [...entry.trad].length;
    const [minLength, maxLength] = levelLengthMap[entry.level];

    if (entry.level !== level) {
      throw new Error(
        `Level mismatch for ${entry.id}: expected level ${level}, got ${entry.level}.`
      );
    }

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
  }

  return parsedVocabulary;
};

const getNuxtPayloadBaseURL = (): string | null => {
  const nuxtPayload = (globalThis as { __NUXT__?: { config?: { app?: { baseURL?: string } } } })
    .__NUXT__;
  const baseURL = nuxtPayload?.config?.app?.baseURL;

  return typeof baseURL === 'string' && baseURL.length > 0 ? baseURL : null;
};

const getAppBaseURL = (): string => {
  const payloadBaseURL = getNuxtPayloadBaseURL();

  if (payloadBaseURL) {
    return payloadBaseURL;
  }

  try {
    return useRuntimeConfig().app.baseURL || '/';
  } catch {
    return '/';
  }
};

const getWordlistPath = (filename: string): string => {
  return joinURL(getAppBaseURL(), 'wordlists', filename);
};

const setupDataHint =
  '語彙データを読み込めませんでした。初回セットアップとして `npm run setup:data` を実行してください。';

const fetchWordlist = async (filename: string): Promise<unknown> => {
  try {
    return await $fetch(getWordlistPath(filename));
  } catch (error) {
    throw new Error(setupDataHint, {
      cause: error,
    });
  }
};

export const loadVocabularyLevel = async (level: Level): Promise<VocabEntry[]> => {
  if (vocabularyCache.has(level)) {
    return vocabularyCache.get(level) as VocabEntry[];
  }

  const entries = await fetchWordlist(`vocabulary-level-${level}.json`);
  const parsed = validateVocabulary(entries, level);
  vocabularyCache.set(level, parsed);
  return parsed;
};

export const loadVocabularyMetadata = async (): Promise<VocabularyMetadata> => {
  if (metadataCache) {
    return metadataCache;
  }

  const payload = await fetchWordlist('metadata.json');
  const metadata = vocabularyMetadataSchema.parse(payload);
  metadataCache = metadata;
  return metadata;
};
