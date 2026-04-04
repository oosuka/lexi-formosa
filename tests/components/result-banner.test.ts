import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ResultBanner from '~/components/ResultBanner.vue';

describe('ResultBanner', () => {
  it('正解状態では強い成功表示とメッセージを出す', () => {
    const wrapper = mount(ResultBanner, {
      props: {
        tone: 'correct',
        badge: 'Badge',
        message: 'message',
        uiError: null,
      },
    });

    expect(wrapper.get('.result-banner__badge').text()).toBe('Badge');
    expect(wrapper.get('.result-banner__message').text()).toBe('message');
    expect(wrapper.find('.result-banner__error').exists()).toBe(false);
    expect(wrapper.classes()).toContain('result-banner');
    expect(wrapper.classes()).toContain('result-banner--embedded');
    expect(wrapper.classes()).toContain('result-banner--correct');
    expect(wrapper.classes()).toContain('result-banner--correct-impact');
  });

  it('不正解状態では残り回数とUIエラーを併記する', () => {
    const wrapper = mount(ResultBanner, {
      props: {
        tone: 'incorrect',
        badge: 'Badge',
        message: 'message',
        uiError: 'error',
      },
    });

    expect(wrapper.get('.result-banner__badge').text()).toBe('Badge');
    expect(wrapper.get('.result-banner__message').text()).toBe('message');
    expect(wrapper.get('.result-banner__error').text()).toBe('error');
    const copyChildren = Array.from(wrapper.get('.result-banner__copy').element.children);
    expect(copyChildren[1]?.classList.contains('result-banner__message')).toBe(true);
    expect(copyChildren[2]?.classList.contains('result-banner__error')).toBe(true);
    expect(wrapper.classes()).toContain('result-banner--incorrect');
    expect(wrapper.classes()).toContain('result-banner--incorrect-impact');
  });

  it('読み込み中は loading 状態を示す', () => {
    const wrapper = mount(ResultBanner, {
      props: {
        tone: 'loading',
        badge: 'Badge',
        message: 'message',
      },
    });

    expect(wrapper.get('.result-banner__badge').text()).toBe('Badge');
    expect(wrapper.get('.result-banner__message').text()).toBe('message');
    expect(wrapper.classes()).toContain('result-banner--loading');
  });
});
