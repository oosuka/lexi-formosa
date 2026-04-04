import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SessionStartPanel from '~/components/SessionStartPanel.vue';

describe('SessionStartPanel', () => {
  it('開始パネルでは Level 名、説明、CTA、補助メモ 4 項目だけを表示する', async () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        levelLabel: 'Level 3',
        levelSummary: '5–6文字中心。少し長めの複合語に挑戦。',
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

    expect(wrapper.text()).toContain('Level 3');
    expect(wrapper.text()).toContain('5–6文字中心。少し長めの複合語に挑戦。');
    expect(wrapper.text()).toContain('4択から1つ選ぶ');
    expect(wrapper.text()).toContain('正解で10点');
    expect(wrapper.text()).toContain('3回連続ミスで終了');
    expect(wrapper.text()).toContain('3連続正解からボーナス');
    expect(wrapper.text()).toContain('ゲームを始める');
    expect(wrapper.text()).not.toContain('START');
    expect(wrapper.text()).not.toContain('words');

    await wrapper.get('button.session-start-button').trigger('click');

    expect(wrapper.emitted('start')).toHaveLength(1);
  });

  it('開始不可時は CTA を無効化して補足エラーを見せる', () => {
    const wrapper = mount(SessionStartPanel, {
      props: {
        levelLabel: 'Level 2',
        levelSummary: '3–4文字中心。日常表現や施設名がメイン。',
        summaryItems: [
          '4択から1つ選ぶ',
          '正解で10点',
          '3連続正解からボーナス',
          '3回連続ミスで終了',
        ],
        canStartSession: false,
        loadError: 'level 2 missing',
      },
    });

    expect(wrapper.get('button.session-start-button').attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('Level 2');
    expect(wrapper.text()).toContain('level 2 missing');
    expect(wrapper.text()).not.toContain('START');
    expect(wrapper.text()).not.toContain('words');
  });
});
