import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SessionStartPanel from '~/components/SessionStartPanel.vue';

describe('SessionStartPanel', () => {
  it('開始パネルでは CTA とルールだけを表示し、選択中レベル表示は出さない', async () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        summaryItems: [
          '4択から1つ選ぶ',
          '正解で10点',
          '3連続正解からボーナス',
          '3回連続ミスで終了',
        ],
        canStartSession: true,
        loadError: null,
      },
    });

    expect(wrapper.get('.session-start-button').attributes('type')).toBe('button');
    expect(wrapper.get('.session-start-button').attributes('disabled')).toBeUndefined();
    expect(wrapper.find('.session-start-title').exists()).toBe(false);
    expect(wrapper.find('.session-start-meta').exists()).toBe(false);
    expect(wrapper.findAll('.session-start-list li').map((item) => item.text())).toEqual([
      '4択から1つ選ぶ',
      '正解で10点',
      '3連続正解からボーナス',
      '3回連続ミスで終了',
    ]);
    expect(wrapper.text()).not.toContain('Level test');
    expect(wrapper.text()).not.toContain('要約1');
    expect(wrapper.find('.session-start-error').exists()).toBe(false);

    await wrapper.get('button.session-start-button').trigger('click');

    expect(wrapper.emitted('start')).toHaveLength(1);
  });

  it('開始不可時は CTA を無効化して補足エラーを見せる', () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        summaryItems: ['項目A', '項目B', '項目C', '項目D'],
        canStartSession: false,
        loadError: 'level 2 missing',
      },
    });

    expect(wrapper.get('button.session-start-button').attributes('disabled')).toBeDefined();
    expect(wrapper.find('.session-start-title').exists()).toBe(false);
    expect(wrapper.find('.session-start-meta').exists()).toBe(false);
    expect(wrapper.findAll('.session-start-list li').map((item) => item.text())).toEqual([
      '項目A',
      '項目B',
      '項目C',
      '項目D',
    ]);
    expect(wrapper.get('.session-start-error').text()).toBe('level 2 missing');
  });
});
