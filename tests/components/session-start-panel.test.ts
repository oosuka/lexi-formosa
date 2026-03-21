import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SessionStartPanel from '~/components/SessionStartPanel.vue';

describe('SessionStartPanel', () => {
  it('学習デスクの開始案内として level / count / sound をまとめて表示する', async () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        currentLevelLabel: 'Level 1',
        startPanelModeLabel: 'Sound Ready',
        startPanelTitle: 'このレベルで始める',
        startPanelCopy: '始めると、最初の問題を表示して読み上げも始まります。',
        currentLevelCountLabel: '45語',
        speechSupported: true,
        canStartSession: true,
        loadError: null,
        hasPreviousRounds: false,
      },
    });

    expect(wrapper.text()).toContain('Focused Learning Desk');
    expect(wrapper.text()).toContain('このレベルで始める');
    expect(wrapper.text()).toContain('45語');
    expect(wrapper.text()).toContain('ブラウザ音声あり');
    expect(wrapper.text()).toContain('Session');
    expect(wrapper.text()).toContain('Records');

    await wrapper.get('button.session-start-button').trigger('click');

    expect(wrapper.emitted('start')).toHaveLength(1);
  });

  it('開始不可時は CTA を無効化して補足エラーを見せる', () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        currentLevelLabel: 'Level 2',
        startPanelModeLabel: 'Visual Ready',
        startPanelTitle: '同じレベルでもう一度始める',
        startPanelCopy: '始めると、最初の問題を表示します。',
        currentLevelCountLabel: '語数未取得',
        speechSupported: false,
        canStartSession: false,
        loadError: 'level 2 missing',
        hasPreviousRounds: true,
      },
    });

    expect(wrapper.get('button.session-start-button').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('音声なしで開始');
    expect(wrapper.text()).toContain('同じレベルで最初からやり直す');
    expect(wrapper.text()).toContain('level 2 missing');
    expect(wrapper.text()).toContain('Focused Learning Desk');
  });
});
