import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEmptyHighScores,
  HIGH_SCORE_STORAGE_KEY,
  useHighScores,
} from '~/composables/useHighScores';

describe('useHighScores', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('旧形式の最高記録を読み込める', () => {
    window.localStorage.setItem(
      HIGH_SCORE_STORAGE_KEY,
      JSON.stringify({
        1: 50,
        2: 90,
        3: 30,
      })
    );

    const { highScores, loadHighScores } = useHighScores();
    loadHighScores();

    expect(highScores.value).toEqual({
      1: { score: 50, streak: 0 },
      2: { score: 90, streak: 0 },
      3: { score: 30, streak: 0 },
    });
  });

  it('localStorage の読み込みに失敗したときは空記録へフォールバックする', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    const { highScores, loadHighScores } = useHighScores();
    highScores.value = {
      1: { score: 99, streak: 9 },
      2: { score: 88, streak: 8 },
      3: { score: 77, streak: 7 },
    };

    loadHighScores();

    expect(highScores.value).toEqual(createEmptyHighScores());
  });

  it('自己ベストだけを更新して保存する', () => {
    const { highScores, updateLevelRecord } = useHighScores();

    expect(updateLevelRecord(1, 10, 1)).toBe(true);
    expect(highScores.value[1]).toEqual({ score: 10, streak: 1 });

    expect(updateLevelRecord(1, 5, 1)).toBe(false);
    expect(highScores.value[1]).toEqual({ score: 10, streak: 1 });

    expect(updateLevelRecord(1, 10, 3)).toBe(true);
    expect(highScores.value[1]).toEqual({ score: 10, streak: 3 });

    expect(window.localStorage.getItem(HIGH_SCORE_STORAGE_KEY)).toBe(
      '{"1":{"score":10,"streak":3},"2":{"score":0,"streak":0},"3":{"score":0,"streak":0}}'
    );
  });

  it('保存に失敗しても state の更新は継続する', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });

    const { highScores, updateLevelRecord } = useHighScores();

    expect(() => updateLevelRecord(2, 120, 6)).not.toThrow();
    expect(highScores.value[2]).toEqual({ score: 120, streak: 6 });
  });

  it('壊れた保存値は読める範囲だけ使い、残りは 0 に戻す', () => {
    window.localStorage.setItem(
      HIGH_SCORE_STORAGE_KEY,
      JSON.stringify({
        1: { score: 'bad', streak: 4 },
        2: null,
        3: { score: 20 },
      })
    );

    const { highScores, loadHighScores } = useHighScores();
    loadHighScores();

    expect(highScores.value).toEqual({
      1: { score: 0, streak: 4 },
      2: { score: 0, streak: 0 },
      3: { score: 20, streak: 0 },
    });
  });
});
