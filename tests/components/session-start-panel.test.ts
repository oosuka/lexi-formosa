import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SessionStartPanel from '~/components/SessionStartPanel.vue';

describe('SessionStartPanel', () => {
  it('Premium Launch Pad として level selector / CTA / progress strip をまとめて表示する', async () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        currentLevelLabel: 'Level 1',
        currentLevelSummary: '1-2文字中心の基本語',
        startPanelModeLabel: 'Sound Ready',
        startPanelCopy: 'レベルを選んで、最初の1問から静かに始めます。',
        currentLevelCountLabel: '45語',
        levelOptions: [
          {
            level: 1,
            label: 'Level 1',
            summary: '1-2文字中心の基本語',
            countLabel: '45語',
            active: true,
          },
          {
            level: 2,
            label: 'Level 2',
            summary: '3-4文字中心の日常語',
            countLabel: '78語',
            active: false,
          },
          {
            level: 3,
            label: 'Level 3',
            summary: '5-6文字中心の複合語',
            countLabel: '96語',
            active: false,
          },
        ],
        bestScore: 120,
        bestStreak: 7,
        canStartSession: true,
        loadError: null,
      },
    });

    expect(wrapper.text()).toContain('Ready to Launch');
    expect(wrapper.text()).toContain('Start Session');
    expect(wrapper.text()).toContain('Level 1');
    expect(wrapper.text()).toContain('1-2文字中心の基本語');
    expect(wrapper.text()).toContain('45語');
    expect(wrapper.text()).toContain('Best Score');
    expect(wrapper.text()).toContain('120');
    expect(wrapper.text()).toContain('Best Streak');
    expect(wrapper.text()).toContain('7');
    expect(wrapper.text()).not.toContain('Records');

    await wrapper.get('[data-level-selector="2"]').trigger('click');
    await wrapper.get('button.session-start-button').trigger('click');

    expect(wrapper.emitted('select-level')).toEqual([[2]]);
    expect(wrapper.emitted('start')).toHaveLength(1);
  });

  it('開始不可時は CTA を無効化して補足エラーを見せる', () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        currentLevelLabel: 'Level 2',
        currentLevelSummary: '3-4文字中心の日常語',
        startPanelModeLabel: 'Visual Ready',
        startPanelCopy: 'レベルを選んで、最初の1問から始めます。',
        currentLevelCountLabel: '語数未取得',
        levelOptions: [
          {
            level: 1,
            label: 'Level 1',
            summary: '1-2文字中心の基本語',
            countLabel: '45語',
            active: false,
          },
          {
            level: 2,
            label: 'Level 2',
            summary: '3-4文字中心の日常語',
            countLabel: '語数未取得',
            active: true,
          },
        ],
        bestScore: 0,
        bestStreak: 0,
        canStartSession: false,
        loadError: 'level 2 missing',
      },
    });

    expect(wrapper.get('button.session-start-button').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Visual Ready');
    expect(wrapper.text()).toContain('Level 2');
    expect(wrapper.text()).toContain('level 2 missing');
    expect(wrapper.text()).toContain('Ready to Launch');
  });
});
