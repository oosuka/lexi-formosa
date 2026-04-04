import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import QuestionStage from '~/components/QuestionStage.vue';

describe('QuestionStage', () => {
  it('プレイ中の情報列と問題表示を同じカード内で表示する', () => {
    const wrapper = mount(QuestionStage, {
      props: {
        levelLabel: 'Level 2',
        score: 45,
        streak: 3,
        missesInRow: 1,
        maxMisses: 3,
        trad: '捷運站',
        katakanaReading: 'ジエ ユン ヂャン',
        pinyinReading: 'jié yùn zhàn',
        canPlayAudio: true,
        isSpeaking: false,
      },
    });

    expect(wrapper.text()).toContain('Level 2');
    expect(wrapper.text()).toContain('Score');
    expect(wrapper.text()).toContain('45');
    expect(wrapper.text()).toContain('Streak');
    expect(wrapper.text()).toContain('3');
    expect(wrapper.text()).toContain('Miss');
    expect(wrapper.text()).toContain('1 / 3');
    expect(wrapper.text()).toContain('捷運站');
    expect(wrapper.text()).toContain('ジエ ユン ヂャン');
    expect(wrapper.text()).toContain('jié yùn zhàn');
    expect(wrapper.get('.question-stage__trad').classes()).toContain('trad-word');
    expect(wrapper.get('.question-stage__readings-bar .audio-button').text()).toContain('読み上げ');
    expect(wrapper.get('.question-stage__readings-bar .audio-button').attributes('type')).toBe(
      'button'
    );
    expect(wrapper.emitted('toggle-audio')).toBeUndefined();
  });
});
