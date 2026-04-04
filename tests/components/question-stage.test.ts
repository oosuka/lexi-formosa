import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import QuestionStage from '~/components/QuestionStage.vue';

describe('QuestionStage', () => {
  it('プレイ中の情報列と問題表示を同じカード内で表示する', () => {
    const wrapper = mount(QuestionStage, {
      props: {
        levelLabel: 'Level test',
        score: 45,
        streak: 3,
        missesInRow: 1,
        maxMisses: 3,
        trad: '題目',
        katakanaReading: 'カタカナ',
        pinyinReading: 'pin yin',
        canPlayAudio: true,
        isSpeaking: false,
      },
    });

    expect(wrapper.get('.question-stage__level').text()).toBe('Level test');
    expect(wrapper.findAll('.question-stage__stat').map((item) => item.text())).toEqual([
      'Score45',
      'Streak3',
      'Miss1 / 3',
    ]);
    expect(wrapper.get('.question-stage__trad').text()).toBe('題目');
    expect(wrapper.findAll('.question-stage__reading').map((item) => item.text())).toEqual([
      'カタカナ',
      'pin yin',
    ]);
    expect(wrapper.get('.question-stage__trad').classes()).toContain('trad-word');
    expect(wrapper.get('.question-stage__readings-bar .audio-button').text()).toBe('読み上げ');
    expect(wrapper.get('.question-stage__readings-bar .audio-button').attributes('type')).toBe(
      'button'
    );
    expect(wrapper.emitted('toggle-audio')).toBeUndefined();
  });
});
