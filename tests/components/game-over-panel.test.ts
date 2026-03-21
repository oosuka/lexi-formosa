import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import GameOverPanel from '~/components/GameOverPanel.vue';

describe('GameOverPanel', () => {
  it('結果サマリーとして Score / Best Streak / level best を整理して表示する', async () => {
    const wrapper = mount(GameOverPanel, {
      props: {
        feedbackBadge: 'Game Over',
        gameOverTitle: '新記録達成',
        gameOverSummary: '今回のプレイで自己ベストを更新しました。',
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

    expect(wrapper.text()).toContain('新記録達成');
    expect(wrapper.text()).toContain('Score');
    expect(wrapper.text()).toContain('Best Streak');
    expect(wrapper.text()).toContain('Level Best');
    expect(wrapper.text()).toContain('45');
    expect(wrapper.text()).toContain('NEW BEST');
    expect(wrapper.text()).toContain('もう一度始める');
    expect(wrapper.text()).toContain('トップへ戻る');

    await wrapper.get('button.primary-button').trigger('click');
    await wrapper.get('button.ghost-button').trigger('click');

    expect(wrapper.emitted('restart')).toHaveLength(1);
    expect(wrapper.emitted('reset')).toHaveLength(1);
  });

  it('loadError があるときは結果サマリー内で補足表示する', () => {
    const wrapper = mount(GameOverPanel, {
      props: {
        feedbackBadge: 'Game Over',
        gameOverTitle: '今回の結果',
        gameOverSummary: '3回続けて不正解になったため、ここで終了です。',
        loadError: 'restart failed',
        score: 10,
        bestRunStreak: 1,
        currentLevelHighScore: { score: 20, streak: 2 },
        gameOverAchievements: [],
      },
    });

    expect(wrapper.text()).toContain('restart failed');
    expect(wrapper.text()).not.toContain('NEW BEST');
    expect(wrapper.text()).toContain('Score');
  });
});
