import type { Level, QuestionRound, VocabEntry } from '~~/shared/types/vocabulary';

export const createEntry = (
  id: string,
  trad: string,
  ja: string,
  level: Level,
  category: string,
  pronunciation?: string
): VocabEntry => ({
  id,
  trad,
  ja,
  level,
  length: [...trad].length,
  category,
  taiwanPriority: true,
  sources: ['seed'],
  pronunciation,
});

export const level1Vocabulary: VocabEntry[] = [
  createEntry('l1-1', '你好', 'こんにちは', 1, 'greeting', 'ni3 hao3'),
  createEntry('l1-2', '謝謝', 'ありがとう', 1, 'greeting', 'xie4 xie'),
  createEntry('l1-3', '早安', 'おはよう', 1, 'greeting', 'zao3 an1'),
  createEntry('l1-4', '牛奶', '牛乳', 1, 'food', 'niu2 nai3'),
  createEntry('l1-5', '地圖', '地図', 1, 'object', 'di4 tu2'),
];

export const level2Vocabulary: VocabEntry[] = [
  createEntry('l2-1', '便利商店', 'コンビニ', 2, 'place', 'bian4 li4 shang1 dian4'),
  createEntry('l2-2', '悠遊卡片', 'ICカード', 2, 'object', 'you1 you2 ka3 pian4'),
  createEntry('l2-3', '咖啡杯套', 'カップスリーブ', 2, 'object', 'ka1 fei1 bei1 tao4'),
  createEntry('l2-4', '週末行程', '週末の予定', 2, 'schedule', 'zhou1 mo4 xing2 cheng2'),
];

export const questionOne: QuestionRound = {
  questionId: 'l1-1',
  trad: '你好',
  level: 1,
  pronunciation: 'ni3 hao3',
  choices: [
    { id: 'l1-1', label: 'こんにちは', correct: true },
    { id: 'l1-2', label: 'ありがとう', correct: false },
    { id: 'l1-4', label: '牛乳', correct: false },
    { id: 'l1-5', label: '地図', correct: false },
  ],
};

export const questionTwo: QuestionRound = {
  questionId: 'l1-2',
  trad: '謝謝',
  level: 1,
  pronunciation: 'xie4 xie',
  choices: [
    { id: 'l1-2', label: 'ありがとう', correct: true },
    { id: 'l1-1', label: 'こんにちは', correct: false },
    { id: 'l1-4', label: '牛乳', correct: false },
    { id: 'l1-5', label: '地図', correct: false },
  ],
};
