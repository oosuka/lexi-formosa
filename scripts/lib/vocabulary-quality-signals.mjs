const classifierLikePattern = /分類語|分類器|クラシファイア|助数詞|CL:/i;
const allowedAsciiLabelPattern = /^[A-Z0-9-]{2,8}$/;
const explanatoryGlossPattern =
  /に相当|を表す|の一種|の段階|仏教|旧暦|分類子|という(?:意味|語|表現|名称|名|ことば)|である|すること|のこと|を指す|として使|に使う|の意味|によれば|するのが|を得るため|ために/;
const properNounLikePatterns = [
  /日本の略/,
  /日本の天皇/,
  /古代中国/,
  /古代の行政単位/,
  /戦国時代/,
  /市名の接尾辞/,
  /県級市/,
  /自治区/,
  /論理学派/,
  /コンパスポイント/,
  /内モンゴル/,
  /新疆/,
  /チベット自治区/,
];

export const isClassifierLikeGloss = (gloss) => classifierLikePattern.test(gloss);

export const isAsciiOnlyGloss = (gloss) =>
  /^[A-Za-z0-9 ?!.,'":;()/-]+$/.test(gloss) && !allowedAsciiLabelPattern.test(gloss);

export const isExplanatoryGloss = (gloss) => explanatoryGlossPattern.test(gloss);

export const isProperNounLikeGloss = (gloss) =>
  properNounLikePatterns.some((pattern) => pattern.test(gloss));
