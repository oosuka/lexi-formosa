import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SessionStartPanel from '~/components/SessionStartPanel.vue';

describe('SessionStartPanel', () => {
  it('開始ステージでは CTA を主役にし、選択中の開始条件だけを表示する', async () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        currentLevelLabel: 'Level 1',
        currentLevelCountLabel: '45語',
        canStartSession: true,
        loadError: null,
      },
    });

    expect(wrapper.text()).toContain('準備OK。');
    expect(wrapper.text()).toContain('Level 1');
    expect(wrapper.text()).toContain('45語');
    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.text()).toContain('Arcade Lobby');
    expect(wrapper.text()).not.toContain('Session');
    expect(wrapper.text()).not.toContain('Records');

    await wrapper.get('button.session-start-button').trigger('click');

    expect(wrapper.emitted('start')).toHaveLength(1);
  });

  it('開始不可時は CTA を無効化して補足エラーを見せる', () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        currentLevelLabel: 'Level 2',
        currentLevelCountLabel: '38語',
        canStartSession: false,
        loadError: 'level 2 missing',
      },
    });

    expect(wrapper.get('button.session-start-button').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('準備OK。');
    expect(wrapper.text()).toContain('38語');
    expect(wrapper.text()).toContain('level 2 missing');
    expect(wrapper.text()).toContain('Arcade Lobby');
  });
});
