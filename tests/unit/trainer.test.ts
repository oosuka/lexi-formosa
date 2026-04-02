import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildQuestion, getCorrectChoice } from '~/utils/trainer';

import { createEntry, level1Vocabulary } from '../fixtures/vocabulary';

describe('trainer utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('4択を生成し、正解を1件だけ含める', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const question = buildQuestion(level1Vocabulary, 1, []);
    const correctChoices = question.choices.filter((choice) => choice.correct);

    expect(question.questionId).toBe('l1-1');
    expect(question.pronunciation).toBe('ni3 hao3');
    expect(question.choices).toHaveLength(4);
    expect(correctChoices).toHaveLength(1);
    expect(getCorrectChoice(question).label).toBe('こんにちは');
  });

  it('直近出題を避けて次の問題を選ぶ', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const question = buildQuestion(level1Vocabulary, 1, ['l1-1']);

    expect(question.questionId).toBe('l1-2');
  });

  it('直近出題ですべて埋まっていてもプール全体から出題できる', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const question = buildQuestion(
      level1Vocabulary,
      1,
      level1Vocabulary.map((entry) => entry.id)
    );

    expect(level1Vocabulary.map((entry) => entry.id)).toContain(question.questionId);
    expect(question.choices).toHaveLength(4);
  });

  it('同カテゴリの誤答を優先する', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const question = buildQuestion(level1Vocabulary, 1, []);
    const distractorIds = question.choices
      .filter((choice) => !choice.correct)
      .map((choice) => choice.id);

    expect(distractorIds).toEqual(expect.arrayContaining(['l1-2', 'l1-3']));
  });

  it('4件未満では出題を作れない', () => {
    expect(() => buildQuestion(level1Vocabulary.slice(0, 3), 1, [])).toThrow(
      'Level 1 requires at least 4 entries.'
    );
  });

  it('誤答候補の日本語ラベル重複を除外する', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const duplicatedGlossVocabulary = [
      createEntry('l2-1', '機車', 'バイク', 2, 'transport'),
      createEntry('l2-2', '自行車', 'バイク', 2, 'transport'),
      createEntry('l2-3', '腳踏車', 'バイク', 2, 'transport'),
      createEntry('l2-4', '便利商店', 'コンビニ', 2, 'place'),
      createEntry('l2-5', '百貨公司', 'デパート', 2, 'place'),
      createEntry('l2-6', '週末行程', '週末の予定', 2, 'schedule'),
    ];

    const question = buildQuestion(duplicatedGlossVocabulary, 2, []);
    const labels = question.choices.map((choice) => choice.label);

    expect(new Set(labels).size).toBe(labels.length);
  });

  it('重複排除後に誤答候補が足りないときは失敗する', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const insufficientVocabulary = [
      createEntry('l2-1', '機車', 'バイク', 2, 'transport'),
      createEntry('l2-2', '自行車', 'バイク', 2, 'transport'),
      createEntry('l2-3', '腳踏車', 'バイク', 2, 'transport'),
      createEntry('l2-4', '百貨公司', 'デパート', 2, 'place'),
    ];

    expect(() => buildQuestion(insufficientVocabulary, 2, [])).toThrow(
      'Could not build distractors'
    );
  });

  it('出題語は seed と TOCFL レベルを重み付けして選ぶ', () => {
    const weightedVocabulary = [
      createEntry('seed-1', '你好', 'こんにちは', 1, 'greeting'),
      {
        ...createEntry('tocfl-basic', '公車', 'バス', 1, 'transport'),
        sources: ['tocfl'],
        tocflLevel: 2,
      },
      {
        ...createEntry('tocfl-mid', '餐廳', 'レストラン', 1, 'place'),
        sources: ['tocfl'],
        tocflLevel: 4,
      },
      {
        ...createEntry('tocfl-advanced', '風景', '風景', 1, 'nature'),
        sources: ['tocfl'],
        tocflLevel: 6,
      },
      {
        ...createEntry('fallback', '地圖', '地図', 1, 'object'),
        sources: ['mjdic'],
        tocflLevel: undefined,
      },
    ];

    const randomSpy = vi.spyOn(Math, 'random');

    randomSpy.mockReturnValueOnce(0).mockReturnValue(0);
    expect(buildQuestion(weightedVocabulary, 1, []).questionId).toBe('seed-1');

    randomSpy.mockReset();
    randomSpy.mockReturnValueOnce(0.4).mockReturnValue(0);
    expect(buildQuestion(weightedVocabulary, 1, []).questionId).toBe('tocfl-basic');

    randomSpy.mockReset();
    randomSpy.mockReturnValueOnce(0.72).mockReturnValue(0);
    expect(buildQuestion(weightedVocabulary, 1, []).questionId).toBe('tocfl-mid');

    randomSpy.mockReset();
    randomSpy.mockReturnValueOnce(0.95).mockReturnValue(0);
    expect(buildQuestion(weightedVocabulary, 1, []).questionId).toBe('tocfl-advanced');

    randomSpy.mockReset();
    randomSpy.mockReturnValueOnce(0.99).mockReturnValue(0);
    expect(buildQuestion(weightedVocabulary, 1, []).questionId).toBe('fallback');
  });

  it('正解が欠けた問題は取得時に失敗する', () => {
    expect(() =>
      getCorrectChoice({
        questionId: 'broken-1',
        trad: '故障',
        level: 1,
        pronunciation: 'gu4 zhang4',
        choices: [
          { id: 'a', label: 'A', correct: false },
          { id: 'b', label: 'B', correct: false },
          { id: 'c', label: 'C', correct: false },
          { id: 'd', label: 'D', correct: false },
        ],
      })
    ).toThrow('missing a correct choice');
  });
});
