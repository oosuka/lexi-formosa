import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getRouteMedal,
  LEARNING_PROGRESS_STORAGE_KEY,
  useLearningProgress,
} from '~/composables/useLearningProgress';

describe('useLearningProgress', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('不正解語を復習対象にし、正解を重ねると復習対象から外す', () => {
    const learning = useLearningProgress();
    learning.loadLearningProgress('2026-07-13');

    learning.recordAnswer('word-1', 2, false);
    expect(learning.getReviewQuestionIds(2)).toEqual(['word-1']);

    learning.recordAnswer('word-1', 2, true);
    expect(learning.getReviewQuestionIds(2)).toEqual(['word-1']);

    learning.recordAnswer('word-1', 2, true);
    expect(learning.getReviewQuestionIds(2)).toEqual([]);
    expect(window.localStorage.getItem(LEARNING_PROGRESS_STORAGE_KEY)).toContain('word-1');
  });

  it('日付が変わると今日の結果だけをリセットし、単語の定着記録は残す', () => {
    const firstSession = useLearningProgress();
    firstSession.loadLearningProgress('2026-07-13');
    firstSession.recordAnswer('word-1', 1, false);
    firstSession.recordRouteResult(1, {
      score: 120,
      correctAnswers: 8,
      bestStreak: 5,
      completed: true,
    });

    const nextDay = useLearningProgress();
    nextDay.loadLearningProgress('2026-07-14');

    expect(nextDay.todayResults.value).toEqual({});
    expect(nextDay.getReviewQuestionIds(1)).toEqual(['word-1']);
  });

  it('同じ日の結果は良い記録だけを残し、正解数から切符を決める', () => {
    const learning = useLearningProgress();
    learning.loadLearningProgress('2026-07-13');
    learning.recordRouteResult(3, {
      score: 90,
      correctAnswers: 7,
      bestStreak: 4,
      completed: true,
    });
    learning.recordRouteResult(3, {
      score: 80,
      correctAnswers: 6,
      bestStreak: 3,
      completed: false,
    });

    expect(learning.todayResults.value[3]).toEqual({
      score: 90,
      correctAnswers: 7,
      bestStreak: 4,
      completed: true,
      completedRoutes: 1,
      medal: 'bronze',
    });
    expect(getRouteMedal(5)).toBe('none');
    expect(getRouteMedal(8)).toBe('silver');
    expect(getRouteMedal(10)).toBe('gold');
  });

  it('完走回数をレベル別に保存し、次のルート番号へ進める', () => {
    const learning = useLearningProgress();
    learning.loadLearningProgress('2026-07-13');

    learning.recordRouteResult(2, {
      score: 190,
      correctAnswers: 10,
      bestStreak: 10,
      completed: true,
    });
    learning.recordRouteResult(2, {
      score: 160,
      correctAnswers: 9,
      bestStreak: 6,
      completed: true,
    });

    expect(learning.completedRouteCounts.value[2]).toBe(2);

    const restored = useLearningProgress();
    restored.loadLearningProgress('2026-07-13');
    expect(restored.completedRouteCounts.value[2]).toBe(2);

    restored.loadLearningProgress('2026-07-14');
    expect(restored.completedRouteCounts.value[2]).toBe(0);
  });

  it('localStorage が使えなくても学習状態の更新を継続する', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });
    const learning = useLearningProgress();
    learning.loadLearningProgress('2026-07-13');

    expect(() => learning.recordAnswer('word-1', 1, false)).not.toThrow();
    expect(learning.reviewCounts.value[1]).toBe(1);
  });
});
