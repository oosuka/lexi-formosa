import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import GameOverPanel from '~/components/GameOverPanel.vue';

describe('GameOverPanel', () => {
  it('Game Over を主役にしつつ実績サマリーを整理して表示する', async () => {
    const wrapper = mount(GameOverPanel, {
      props: {
        feedbackBadge: 'Badge',
        gameOverTitle: 'Title',
        gameOverSummary: 'Summary',
        celebrationTone: 'single',
        loadError: null,
        score: 45,
        bestRunStreak: 4,
        currentLevelHighScore: { score: 45, streak: 4 },
        gameOverAchievements: [
          {
            key: 'score',
            badge: 'ACHIEVEMENT',
            label: 'Label',
            value: 45,
            note: 'Note',
            tone: 'new',
          },
        ],
      },
    });

    expect(wrapper.get('.game-over-title').text()).toBe('Badge');
    expect(wrapper.get('.game-over-kicker').text()).toBe('Title');
    expect(wrapper.get('.game-over-summary').text()).toBe('Summary');
    expect(wrapper.get('.game-over-panel').classes()).toContain('game-over-panel--celebration');
    expect(wrapper.findAll('.game-over-stat')).toHaveLength(4);
    expect(wrapper.findAll('.game-over-achievement')).toHaveLength(1);
    expect(wrapper.findAll('.game-over-celebration-badge')).toHaveLength(1);
    expect(wrapper.get('.achievement-badge').text()).toBe('ACHIEVEMENT');
    expect(wrapper.findAll('.game-over-actions button')).toHaveLength(2);

    await wrapper.get('button.primary-button').trigger('click');
    await wrapper.get('button.ghost-button').trigger('click');

    expect(wrapper.emitted('restart')).toHaveLength(1);
    expect(wrapper.emitted('reset')).toHaveLength(1);
  });

  it('loadError があるときは結果サマリー内で補足表示する', () => {
    const wrapper = mount(GameOverPanel, {
      props: {
        feedbackBadge: 'Badge',
        gameOverTitle: '',
        gameOverSummary: 'Summary',
        celebrationTone: 'none',
        loadError: 'load-error',
        score: 10,
        bestRunStreak: 1,
        currentLevelHighScore: { score: 20, streak: 2 },
        gameOverAchievements: [],
      },
    });

    expect(wrapper.get('.game-over-title').text()).toBe('Badge');
    expect(wrapper.get('.game-over-summary').text()).toBe('Summary');
    expect(wrapper.get('.game-over-error').text()).toBe('load-error');
    expect(wrapper.find('.game-over-kicker').exists()).toBe(false);
    expect(wrapper.find('.game-over-celebration-badge').exists()).toBe(false);
    expect(wrapper.find('.game-over-achievement-grid').exists()).toBe(false);
  });
});
