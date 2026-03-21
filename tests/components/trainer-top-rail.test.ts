import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TrainerTopRail from '~/components/TrainerTopRail.vue';

describe('TrainerTopRail', () => {
  it('プレイ中の集計とレベル情報を表示する', () => {
    const wrapper = mount(TrainerTopRail, {
      props: {
        levelLabel: 'Level 2',
        score: 45,
        streak: 3,
        missesInRow: 1,
        maxMisses: 3,
      },
    });

    expect(wrapper.text()).toContain('Level 2');
    expect(wrapper.text()).toContain('Score');
    expect(wrapper.text()).toContain('45');
    expect(wrapper.text()).toContain('Streak');
    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).toContain('Miss');
    expect(wrapper.text()).toContain('1 / 3');
  });
});
