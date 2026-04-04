import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SessionStartPanel from '~/components/SessionStartPanel.vue';

describe('SessionStartPanel', () => {
  it('開始パネルでは Level 名、確認メタ、CTA、補助メモ 4 項目だけを表示する', async () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        levelLabel: 'Level test',
        levelSummary: '要約1。要約2。',
        summaryItems: ['項目1', '項目2', '項目3', '項目4'],
        canStartSession: true,
        loadError: null,
      },
    });

    expect(wrapper.get('.session-start-title').text()).toBe('Level test');
    expect(wrapper.get('.session-start-button').attributes('type')).toBe('button');
    expect(wrapper.get('.session-start-button').attributes('disabled')).toBeUndefined();
    expect(wrapper.findAll('.session-start-meta-item').map((item) => item.text())).toEqual([
      '要約1',
      '要約2',
    ]);
    expect(wrapper.findAll('.session-start-list li').map((item) => item.text())).toEqual([
      '項目1',
      '項目2',
      '項目3',
      '項目4',
    ]);
    expect(wrapper.find('.session-start-error').exists()).toBe(false);

    await wrapper.get('button.session-start-button').trigger('click');

    expect(wrapper.emitted('start')).toHaveLength(1);
  });

  it('開始不可時は CTA を無効化して補足エラーを見せる', () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        levelLabel: 'Level error',
        levelSummary: '要約A。要約B。',
        summaryItems: ['項目A', '項目B', '項目C', '項目D'],
        canStartSession: false,
        loadError: 'level 2 missing',
      },
    });

    expect(wrapper.get('button.session-start-button').attributes('disabled')).toBeDefined();
    expect(wrapper.get('.session-start-title').text()).toBe('Level error');
    expect(wrapper.findAll('.session-start-meta-item')).toHaveLength(2);
    expect(wrapper.findAll('.session-start-list li')).toHaveLength(4);
    expect(wrapper.get('.session-start-error').text()).toBe('level 2 missing');
  });
});
