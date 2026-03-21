import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import QuestionStage from '~/components/QuestionStage.vue';

describe('QuestionStage', () => {
  it('繁体字を主役として表示し、読み補助と音声ボタンを補助表示する', () => {
    const wrapper = mount(QuestionStage, {
      props: {
        levelLabel: 'Level 2',
        trad: '捷運站',
        katakanaReading: 'ジエ ユン ヂャン',
        pinyinReading: 'jié yùn zhàn',
        canPlayAudio: true,
        isSpeaking: false,
      },
    });

    expect(wrapper.text()).toContain('Level 2');
    expect(wrapper.text()).toContain('捷運站');
    expect(wrapper.text()).toContain('ジエ ユン ヂャン');
    expect(wrapper.text()).toContain('jié yùn zhàn');
    expect(wrapper.get('.question-stage__trad').classes()).toContain('trad-word');
    expect(wrapper.get('button').text()).toContain('読み上げ');
    expect(wrapper.get('button').attributes('type')).toBe('button');
    expect(wrapper.emitted('toggle-audio')).toBeUndefined();
  });
});
