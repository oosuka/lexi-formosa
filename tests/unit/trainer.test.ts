import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  buildDailyRouteQuestionIds,
  buildQuestion,
  getCorrectChoice,
  LEVEL_COPY,
} from '~/utils/trainer';

import { createEntry, level1Vocabulary } from '../fixtures/vocabulary';

describe('trainer utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('開始画面のレベル説明は 1文字 / 2文字 / 3文字以上 に合わせる', () => {
    expect(LEVEL_COPY).toEqual({
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
    });
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

  it('日付とレベルから10問ルートを再現し、復習語を先頭側へ入れる', () => {
    const route = buildDailyRouteQuestionIds(level1Vocabulary, 1, '2026-07-13', ['l1-4']);
    const repeatedRoute = buildDailyRouteQuestionIds(level1Vocabulary, 1, '2026-07-13', ['l1-4']);

    expect(route).toHaveLength(10);
    expect(route).toEqual(repeatedRoute);
    expect(route.slice(0, 4)).toContain('l1-4');
    expect(route.every((id) => level1Vocabulary.some((entry) => entry.id === id))).toBe(true);
  });

  it('完走後の次ルートでは未出題の10語へ進む', () => {
    const routeVocabulary = Array.from({ length: 24 }, (_, index) =>
      createEntry(`route-${index}`, String.fromCodePoint(0x4e00 + index), `訳${index}`, 1, 'daily')
    );
    const firstRoute = buildDailyRouteQuestionIds(routeVocabulary, 1, '2026-07-13', [], 10, 0);
    const nextRoute = buildDailyRouteQuestionIds(routeVocabulary, 1, '2026-07-13', [], 10, 1);

    expect(firstRoute).toHaveLength(10);
    expect(nextRoute).toHaveLength(10);
    expect(nextRoute.filter((id) => firstRoute.includes(id))).toEqual([]);
  });

  it('復習語を含む次ルートでも未出題枠を飛ばさない', () => {
    const routeVocabulary = Array.from({ length: 28 }, (_, index) =>
      createEntry(`route-${index}`, String.fromCodePoint(0x4e00 + index), `訳${index}`, 1, 'daily')
    );
    const reviewQuestionIds = ['route-0', 'route-1', 'route-2', 'route-3'];
    const firstRoute = buildDailyRouteQuestionIds(
      routeVocabulary,
      1,
      '2026-07-13',
      reviewQuestionIds,
      10,
      0
    );
    const nextRoute = buildDailyRouteQuestionIds(
      routeVocabulary,
      1,
      '2026-07-13',
      reviewQuestionIds,
      10,
      1
    );
    const freshOnlyRoute = buildDailyRouteQuestionIds(
      routeVocabulary.filter((entry) => !reviewQuestionIds.includes(entry.id)),
      1,
      '2026-07-13',
      [],
      12,
      0
    );
    const freshRouteIds = (route: string[]) =>
      route.filter((questionId) => !reviewQuestionIds.includes(questionId));

    expect([...freshRouteIds(firstRoute), ...freshRouteIds(nextRoute)]).toEqual(freshOnlyRoute);
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

  it('senseTag と distractorTags が近い誤答をカテゴリ一致より優先する', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const taggedVocabulary = [
      {
        ...createEntry('family-1', '爸爸', 'お父さん', 1, 'people'),
        senseTag: 'people.family',
        distractorTags: ['people', 'family'],
      },
      {
        ...createEntry('family-2', '媽媽', 'お母さん', 1, 'family'),
        senseTag: 'people.family',
        distractorTags: ['people', 'family'],
      },
      {
        ...createEntry('people-1', '老師', '先生', 1, 'people'),
        senseTag: 'people.profession',
        distractorTags: ['people', 'profession'],
      },
      {
        ...createEntry('people-2', '學生', '学生', 1, 'people'),
        senseTag: 'people.profession',
        distractorTags: ['people', 'profession'],
      },
      {
        ...createEntry('people-3', '朋友', '友達', 1, 'people'),
        senseTag: 'people.social',
        distractorTags: ['people', 'social'],
      },
    ];

    const question = buildQuestion(taggedVocabulary, 1, []);
    const distractorLabels = question.choices
      .filter((choice) => !choice.correct)
      .map((choice) => choice.label);

    expect(distractorLabels).toContain('お母さん');
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
