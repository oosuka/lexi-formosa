// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('vocabulary quality signals', () => {
  it('一般的な大文字略称を ascii_only 警告から除外する', async () => {
    const { isAsciiOnlyGloss } = await import('../../scripts/lib/vocabulary-quality-signals.mjs');

    expect(isAsciiOnlyGloss('hello')).toBe(true);
    expect(isAsciiOnlyGloss('SF')).toBe(false);
    expect(isAsciiOnlyGloss('ATM')).toBe(false);
  });

  it('説明文らしい日本語を検出し、短い教材ラベルは除外しない', async () => {
    const { isExplanatoryGloss } = await import('../../scripts/lib/vocabulary-quality-signals.mjs');

    expect(isExplanatoryGloss('鳥の一種')).toBe(true);
    expect(isExplanatoryGloss('〜のこと')).toBe(true);

    expect(isExplanatoryGloss('すべき')).toBe(false);
    expect(isExplanatoryGloss('必要')).toBe(false);
    expect(isExplanatoryGloss('あっという間に')).toBe(false);
  });

  it('分類語らしい日本語を検出する', async () => {
    const { isClassifierLikeGloss } = await import(
      '../../scripts/lib/vocabulary-quality-signals.mjs'
    );

    expect(isClassifierLikeGloss('洞窟住居の分類器')).toBe(true);
    expect(isClassifierLikeGloss('お父さん')).toBe(false);
  });

  it('固有名詞・歴史語寄りの説明を検出し、通常の普通名詞は除外しない', async () => {
    const { isProperNounLikeGloss } = await import(
      '../../scripts/lib/vocabulary-quality-signals.mjs'
    );

    expect(isProperNounLikeGloss('日本の略')).toBe(true);
    expect(isProperNounLikeGloss('古代中国のコンパスポイント：210度')).toBe(true);
    expect(isProperNounLikeGloss('25世帯の古代の行政単位')).toBe(true);
    expect(isProperNounLikeGloss('市名の接尾辞として')).toBe(true);

    expect(isProperNounLikeGloss('会社')).toBe(false);
    expect(isProperNounLikeGloss('市民')).toBe(false);
    expect(isProperNounLikeGloss('旅行会社')).toBe(false);
    expect(isProperNounLikeGloss('大統領')).toBe(false);
    expect(isProperNounLikeGloss('漫画')).toBe(false);
  });
});
