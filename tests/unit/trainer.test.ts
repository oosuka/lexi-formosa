import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildQuestion, getCorrectChoice } from '~/utils/trainer';

import { level1Vocabulary } from '../fixtures/vocabulary';

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
});
