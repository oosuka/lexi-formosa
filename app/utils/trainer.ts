import type { Level, QuestionChoice, QuestionRound, VocabEntry } from '~~/shared/types/vocabulary';

export const RECENT_WINDOW_SIZE = 5;

export const LEVEL_COPY: Record<Level, { label: string; summary: string }> = {
  1: {
    label: 'Level 1',
    summary: '1–2文字中心。生活や旅行でよく使う単語。',
  },
  2: {
    label: 'Level 2',
    summary: '3–4文字中心。日常表現や施設名がメイン。',
  },
  3: {
    label: 'Level 3',
    summary: '5–6文字中心。少し長めの複合語に挑戦。',
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

export const buildQuestion = (
  pool: VocabEntry[],
  level: Level,
  recentQuestionIds: string[]
): QuestionRound => {
  if (pool.length < 4) {
    throw new Error(`Level ${level} requires at least 4 entries.`);
  }

  const recentQuestionIdSet = new Set(recentQuestionIds);
  const availablePool = pool.filter((entry) => !recentQuestionIdSet.has(entry.id));
  const correctEntry = pickWeightedEntry(availablePool.length > 0 ? availablePool : pool);

  const allDistractors = pool.filter(
    (entry) => entry.id !== correctEntry.id && entry.ja !== correctEntry.ja
  );

  const prioritizedDistractors = [
    allDistractors.filter((entry) => entry.category === correctEntry.category),
    allDistractors.filter(
      (entry) => entry.category !== correctEntry.category && entry.length === correctEntry.length
    ),
    allDistractors.filter(
      (entry) => entry.category !== correctEntry.category && entry.length !== correctEntry.length
    ),
  ].flatMap((entries) => shuffle(entries));

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
