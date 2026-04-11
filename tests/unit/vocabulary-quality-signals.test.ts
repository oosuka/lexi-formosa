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

  it('辞書内参照だけのラベルを検出し、通常の参照動詞は除外しない', async () => {
    const { isReferenceOnlyGloss } = await import(
      '../../scripts/lib/vocabulary-quality-signals.mjs'
    );

    expect(isReferenceOnlyGloss('般乐を参照')).toBe(true);
    expect(isReferenceOnlyGloss('病毒营销も参照')).toBe(true);
    expect(isReferenceOnlyGloss('を参照')).toBe(true);
    expect(isReferenceOnlyGloss('を参照してください 漂洋[piao1 yang2］')).toBe(true);

    expect(isReferenceOnlyGloss('参照する')).toBe(false);
    expect(isReferenceOnlyGloss('参考にする')).toBe(false);
  });

  it('全レベル共通の辞書断片と説明文ラベルを検出する', async () => {
    const { isExplanatoryGloss, isReferenceOnlyGloss } = await import(
      '../../scripts/lib/vocabulary-quality-signals.mjs'
    );

    expect(isReferenceOnlyGloss('般乐を参照')).toBe(true);
    expect(isExplanatoryGloss('鳥の一種')).toBe(true);

    expect(isReferenceOnlyGloss('参照する')).toBe(false);
    expect(isExplanatoryGloss('ありがとう')).toBe(false);
  });

  it('Level 3 の固有名詞・地名・組織名寄りラベルを検出する', async () => {
    const { isLevelThreeProperNounRiskGloss } = await import(
      '../../scripts/lib/vocabulary-quality-signals.mjs'
    );

    expect(isLevelThreeProperNounRiskGloss('オーストリアの都市インスブルック')).toBe(true);
    expect(isLevelThreeProperNounRiskGloss('忠清南道の道庁所在地 忠清南道')).toBe(true);
    expect(isLevelThreeProperNounRiskGloss('国際ミラノサッカークラブ')).toBe(true);

    expect(isLevelThreeProperNounRiskGloss('桃源郷')).toBe(false);
    expect(isLevelThreeProperNounRiskGloss('トランス脂肪酸')).toBe(false);
  });

  it('Level 3 の説明文ラベルを検出し、短い challenge ラベルは除外しない', async () => {
    const { isLevelThreeExplanatoryRiskGloss } = await import(
      '../../scripts/lib/vocabulary-quality-signals.mjs'
    );

    expect(isLevelThreeExplanatoryRiskGloss('中國教育和科研计算机网の略')).toBe(true);
    expect(isLevelThreeExplanatoryRiskGloss('ヘイシャジ島と同じ黑瞎子島')).toBe(true);
    expect(isLevelThreeExplanatoryRiskGloss('西周王朝の初代王として在位')).toBe(true);

    expect(isLevelThreeExplanatoryRiskGloss('でたらめな話')).toBe(false);
    expect(isLevelThreeExplanatoryRiskGloss('歯列矯正器')).toBe(false);
  });

  it('既知の壊れた MJdic 由来ラベルを検出し、通常の糞を含む語義は除外しない', async () => {
    const { isCorruptedJapaneseGloss } = await import(
      '../../scripts/lib/vocabulary-quality-signals.mjs'
    );

    expect(isCorruptedJapaneseGloss('珍糞漢糞')).toBe(true);
    expect(isCorruptedJapaneseGloss('糞尿')).toBe(false);
    expect(isCorruptedJapaneseGloss('馬糞紙')).toBe(false);
  });
});
