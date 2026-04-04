import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import GameOverPanel from '~/components/GameOverPanel.vue';

describe('GameOverPanel', () => {
  it('Game Over を主役にしつつ実績サマリーを整理して表示する', async () => {
    const wrapper = mount(GameOverPanel, {
      props: {
        feedbackBadge: 'Game Over',
        gameOverTitle: '新記録達成',
        gameOverSummary: '今回のプレイで自己ベストを更新しました。',
        celebrationTone: 'single',
        loadError: null,
        score: 45,
        bestRunStreak: 4,
        currentLevelHighScore: { score: 45, streak: 4 },
        gameOverAchievements: [
          {
            key: 'score',
            badge: 'NEW BEST',
            label: 'Score',
            value: 45,
            note: '自己ベストを更新',
            tone: 'new',
          },
        ],
      },
    });

    expect(wrapper.text()).toContain('Game Over');
    expect(wrapper.text()).toContain('New Record');
    expect(wrapper.text()).toContain('新記録達成');
    expect(wrapper.text()).toContain('This Session');
    expect(wrapper.text()).toContain('Score');
    expect(wrapper.text()).toContain('Streak');
    expect(wrapper.text()).toContain('Level Best');
    expect(wrapper.text()).not.toContain('Best Streak');
    expect(wrapper.text()).toContain('45');
    expect(wrapper.text()).toContain('NEW BEST');
    expect(wrapper.text()).toContain('もう一度始める');
    expect(wrapper.text()).toContain('トップへ戻る');
    expect(wrapper.get('.game-over-panel').classes()).toContain('game-over-panel--celebration');

    await wrapper.get('button.primary-button').trigger('click');
    await wrapper.get('button.ghost-button').trigger('click');

    expect(wrapper.emitted('restart')).toHaveLength(1);
    expect(wrapper.emitted('reset')).toHaveLength(1);
  });

  it('loadError があるときは結果サマリー内で補足表示する', () => {
    const wrapper = mount(GameOverPanel, {
      props: {
        feedbackBadge: 'Game Over',
        gameOverTitle: '',
        gameOverSummary: '3回続けて不正解になったため、今回はここで終了です。',
        celebrationTone: 'none',
        loadError: 'restart failed',
        score: 10,
        bestRunStreak: 1,
        currentLevelHighScore: { score: 20, streak: 2 },
        gameOverAchievements: [],
      },
    });

    expect(wrapper.text()).toContain('Game Over');
    expect(wrapper.text()).not.toContain('今回の結果');
    expect(wrapper.text()).toContain('restart failed');
    expect(wrapper.text()).not.toContain('NEW BEST');
    expect(wrapper.text()).not.toContain('New Record');
    expect(wrapper.text()).toContain('This Session');
    expect(wrapper.text()).toContain('Score');
  });
});
