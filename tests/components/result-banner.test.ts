import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ResultBanner from '~/components/ResultBanner.vue';

describe('ResultBanner', () => {
  it('正解状態では強い成功表示とメッセージを出す', () => {
    const wrapper = mount(ResultBanner, {
      props: {
        tone: 'correct',
        badge: 'Correct',
        message: '正解です。+12点',
        uiError: null,
      },
    });

    expect(wrapper.text()).toContain('Correct');
    expect(wrapper.text()).toContain('正解です。+12点');
    expect(wrapper.classes()).toContain('result-banner');
    expect(wrapper.classes()).toContain('result-banner--correct');
  });

  it('不正解状態では残り回数とUIエラーを併記する', () => {
    const wrapper = mount(ResultBanner, {
      props: {
        tone: 'incorrect',
        badge: 'Miss',
        message: '不正解です。終了まであと2回',
        uiError: '次の問題への切り替えに失敗しました。',
      },
    });

    expect(wrapper.text()).toContain('Miss');
    expect(wrapper.text()).toContain('不正解です。終了まであと2回');
    expect(wrapper.text()).toContain('次の問題への切り替えに失敗しました。');
    expect(wrapper.classes()).toContain('result-banner--incorrect');
  });

  it('読み込み中は loading 状態を示す', () => {
    const wrapper = mount(ResultBanner, {
      props: {
        tone: 'loading',
        badge: 'Loading',
        message: '問題データを読み込んでいます。',
        uiError: null,
      },
    });

    expect(wrapper.text()).toContain('Loading');
    expect(wrapper.text()).toContain('問題データを読み込んでいます。');
    expect(wrapper.classes()).toContain('result-banner--loading');
  });
});
