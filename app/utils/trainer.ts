import type { Level, QuestionChoice, QuestionRound, VocabEntry } from '~~/shared/types/vocabulary';

export const RECENT_WINDOW_SIZE = 5;
export const DAILY_ROUTE_LENGTH = 10;

export const LEVEL_COPY: Record<Level, { label: string; shortSummary: string; summary: string }> = {
  1: {
    label: 'Level 1',
    shortSummary: '基礎',
    summary: '1文字。基礎の単語から始める。',
  },
  2: {
    label: 'Level 2',
    shortSummary: '日常',
    summary: '2文字。日常でよく見る単語。',
  },
  3: {
    label: 'Level 3',
    shortSummary: '実用',
    summary: '3文字以上。実用的な複合語。',
  },
};

const getEntryWeight = (entry: VocabEntry): number => {
  if (entry.sources.includes('seed')) {
    return 10;
  }

  if (typeof entry.tocflLevel === 'number') {
    if (entry.tocflLevel <= 2) {
      return 8;
    }

    if (entry.tocflLevel <= 4) {
      return 5;
    }

    return 2;
  }

  return 1;
};

const hashText = (value: string): number => {
  let hash = 2166136261;

  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

export const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const takeCircularSlice = <T>(items: T[], startIndex: number, count: number): T[] => {
  if (items.length === 0 || count <= 0) {
    return [];
  }

  return Array.from(
    { length: Math.min(count, items.length) },
    (_, index) => items[(startIndex + index) % items.length] as T
  );
};

export const buildDailyRouteQuestionIds = (
  pool: VocabEntry[],
  level: Level,
  dateKey: string,
  reviewQuestionIds: string[] = [],
  routeLength = DAILY_ROUTE_LENGTH,
  routeIndex = 0
): string[] => {
  if (pool.length === 0 || routeLength <= 0) {
    return [];
  }

  const entriesById = new Map(pool.map((entry) => [entry.id, entry]));
  const safeRouteIndex = Math.max(0, Math.floor(routeIndex));
  const reviewCandidates = [...new Set(reviewQuestionIds)]
    .map((id) => entriesById.get(id))
    .filter((entry): entry is VocabEntry => Boolean(entry))
    .sort(
      (left, right) =>
        hashText(`${dateKey}:${level}:review:${left.id}`) -
        hashText(`${dateKey}:${level}:review:${right.id}`)
    );
  const reviewEntries = takeCircularSlice(
    reviewCandidates,
    safeRouteIndex * 4,
    Math.min(4, routeLength)
  );
  const reviewIds = new Set(reviewCandidates.map((entry) => entry.id));
  const freshEntries = pool
    .filter((entry) => !reviewIds.has(entry.id))
    .map((entry) => ({
      entry,
      rank:
        (hashText(`${dateKey}:${level}:fresh:${entry.id}`) + 1) /
        (getEntryWeight(entry) * 4_294_967_296),
    }))
    .sort((left, right) => left.rank - right.rank)
    .map(({ entry }) => entry);
  const freshRouteEntries = takeCircularSlice(
    freshEntries,
    safeRouteIndex * Math.max(0, routeLength - reviewEntries.length),
    routeLength - reviewEntries.length
  );
  const orderedEntries = [...reviewEntries, ...freshRouteEntries];

  if (orderedEntries.length === 0) {
    return [];
  }

  const routeIds: string[] = [];

  while (routeIds.length < routeLength) {
    const entry = orderedEntries[routeIds.length % orderedEntries.length];

    if (!entry) {
      break;
    }

    routeIds.push(entry.id);
  }

  return routeIds;
};

const shuffle = <T>(items: T[]): T[] => {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const current = result[index] as T;
    const random = result[randomIndex] as T;

    result[index] = random;
    result[randomIndex] = current;
  }

  return result;
};

const pickWeightedEntry = (items: VocabEntry[]): VocabEntry => {
  const weightedItems = items.map((item) => ({
    item,
    weight: getEntryWeight(item),
  }));
  const totalWeight = weightedItems.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = Math.random() * totalWeight;

  for (const entry of weightedItems) {
    cursor -= entry.weight;

    if (cursor <= 0) {
      return entry.item;
    }
  }

  return weightedItems[weightedItems.length - 1]?.item as VocabEntry;
};

const uniqueByIdAndLabel = (items: VocabEntry[]): VocabEntry[] => {
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();

  return items.filter((item) => {
    if (seenIds.has(item.id) || seenLabels.has(item.ja)) {
      return false;
    }

    seenIds.add(item.id);
    seenLabels.add(item.ja);
    return true;
  });
};

const getSharedDistractorTagCount = (correctEntry: VocabEntry, entry: VocabEntry): number => {
  if (!correctEntry.distractorTags?.length || !entry.distractorTags?.length) {
    return 0;
  }

  const correctTags = new Set(correctEntry.distractorTags);

  return entry.distractorTags.filter((tag) => correctTags.has(tag)).length;
};

const getDistractorPriority = (correctEntry: VocabEntry, entry: VocabEntry): number => {
  if (entry.senseTag && entry.senseTag === correctEntry.senseTag) {
    return 4;
  }

  const sharedTagCount = getSharedDistractorTagCount(correctEntry, entry);

  if (sharedTagCount > 0) {
    return 3;
  }

  if (entry.category === correctEntry.category) {
    return 2;
  }

  if (entry.length === correctEntry.length) {
    return 1;
  }

  return 0;
};

export const buildQuestion = (
  pool: VocabEntry[],
  level: Level,
  recentQuestionIds: string[],
  preferredQuestionId?: string
): QuestionRound => {
  if (pool.length < 4) {
    throw new Error(`Level ${level} requires at least 4 entries.`);
  }

  const recentQuestionIdSet = new Set(recentQuestionIds);
  const availablePool = pool.filter((entry) => !recentQuestionIdSet.has(entry.id));
  const preferredEntry = preferredQuestionId
    ? pool.find((entry) => entry.id === preferredQuestionId)
    : undefined;
  const correctEntry =
    preferredEntry ?? pickWeightedEntry(availablePool.length > 0 ? availablePool : pool);

  const allDistractors = pool.filter(
    (entry) => entry.id !== correctEntry.id && entry.ja !== correctEntry.ja
  );

  const distractorsByPriority = new Map<number, VocabEntry[]>();

  for (const entry of allDistractors) {
    const priority = getDistractorPriority(correctEntry, entry);
    const bucket = distractorsByPriority.get(priority) ?? [];
    bucket.push(entry);
    distractorsByPriority.set(priority, bucket);
  }

  const prioritizedDistractors = [...distractorsByPriority.entries()]
    .sort(([left], [right]) => right - left)
    .flatMap(([, entries]) => shuffle(entries));

  const distractors = uniqueByIdAndLabel(prioritizedDistractors).slice(0, 3);

  if (distractors.length < 3) {
    throw new Error(`Could not build distractors for ${correctEntry.id}.`);
  }

  const choices = shuffle<QuestionChoice>([
    {
      id: correctEntry.id,
      label: correctEntry.ja,
      correct: true,
    },
    ...distractors.map((entry) => ({
      id: entry.id,
      label: entry.ja,
      correct: false,
    })),
  ]);

  return {
    questionId: correctEntry.id,
    trad: correctEntry.trad,
    level,
    pronunciation: correctEntry.pronunciation,
    choices,
  };
};

export const getCorrectChoice = (question: QuestionRound): QuestionChoice => {
  const choice = question.choices.find((candidate) => candidate.correct);

  if (!choice) {
    throw new Error(`Question ${question.questionId} is missing a correct choice.`);
  }

  return choice;
};
