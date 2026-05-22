const rejectionPatterns = [
  /謙譲表現/,
  /概念/,
  /御前方/,
  /人妻/,
  /長さ/,
  /質問に対する否定的な答え/,
  /台湾のpr\./i,
  /^\(/,
];

const simplifiedChineseGlossPattern =
  /丝|东|亚|联|门|龙|云|广|务|听|汉|观|馆|铁|习|赔|语|图|气|车|动|词|类|这|样|你|妳|您|妈|吗|个|儿|么|荤|葷|颈|谈|阳|视|电|货|汇|诗|经|网|络|镭|赢|份|國|鐵|將/u;
const untranslatedChineseGlossPattern = /什麼|甚麼|東南亞|山東|^[\p{Script=Han}々]+と同じ$/u;
const allHanGlossPattern = /^[\p{Script=Han}々]+$/u;
const conciseHanGlossPattern = /^[\p{Script=Han}々]{1,2}$/u;
const singleKanaGlossPattern = /^[ぁ-んァ-ヶー]$/u;
const transliteratedSurnameGlossPattern = /^[ァ-ヶぁ-んー・]+姓$/u;
const repeatedGlossPattern = /^(.{1,16}?)(?:[、，,]\1){1,}$/u;
const dictionaryMetadataGlossPattern =
  /^(?:see|see also|written|also written|variant of)\b|^(?:polite|formal|informal)?\s*form of\b|(?:^|\s)abbr\.?(?:\s|$)|台湾\s*pr\b|Taiwan\s*pr\b|(?:^|[^A-Za-z])SB(?:[^A-Za-z]|$)|[A-Za-z]+などの分類語|分類(?:語|記号)|の姓|姓[A-Za-z]|のための姓|姓氏|^[啊嗎吗呢吧啦喔哦呀哇嘛]$|[\p{Script=Han}\p{Script=Arabic}][^、，,／/;；。]{0,14}(?:で|に)(?:使われ|使用され)|[\p{Script=Han}][^、，,／/;；。]{0,14}の代わりに使われ|[\p{Script=Han}][^、，,／/;；。]{0,14}に似(?:た|て)|^に(?:似ている|使用される)$|終助詞で|(?:示す|尋ねる|表す).*助詞|モード助詞|(?:\d+|[一二三四五六七八九十百千万萬]+)分の|の(?:通貨|重量|重さ|長さ|面積|光度|輝度|圧力|体積|密度)?単位|(?:通貨|重量|重さ|長さ|面積|光度|輝度|圧力|体積|密度)の?単位|^(?:a\s+)?unit of\b|^one\s+\w+\s+of\b/iu;
const machineTranslatedGlossPattern = /^[ァ-ヶー]{2,}な$/u;
const explanatoryGlossPattern =
  /に相当|を表す|を示す|の一種|の段階|仏教|旧暦|分類子|分類詞|分類器|分類語|クラシファイア|という|である|すること|のこと|を指す|として使|に使う|の意味|によれば|すべき|するのが|を得るため|ために|参照|説明|の略|または|もしくは|あるいは|ときに|際に|場合|分類する/;

export const isDictionaryMetadataJapaneseGloss = (candidate) =>
  dictionaryMetadataGlossPattern.test(candidate);

export const isMachineTranslatedJapaneseGloss = (candidate) =>
  machineTranslatedGlossPattern.test(candidate);

export const classifierOnlyGlosses = new Set([
  '部',
  '個',
  '件',
  '台',
  '輛',
  '名',
  '位',
  '條',
  '張',
  '本',
  '家',
  '把',
  '面',
  '隻',
  '口',
  '頭',
  '瓶',
  '杯',
  '雙',
  '份',
  '粒',
  '棵',
  '艘',
  '支',
  '枚',
  '匹',
]);

const collapseRepeatedSegments = (candidate) => {
  const segments = candidate
    .split(/[、，,]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length > 1 && new Set(segments).size === 1) {
    return segments[0];
  }

  return candidate;
};

const normalizeGlossCandidate = (candidate) =>
  collapseRepeatedSegments(candidate)
    .replace(/\u3000/g, ' ')
    .replace(/\{[^{}]*\}/g, ' ')
    .replace(/<[^<>]*>/g, ' ')
    .replace(/\bI\.D\.\b/gi, 'ID')
    .replace(/\bD\.C\b/gi, 'DC')
    .replace(/\.com\b/gi, '')
    .replace(/\s*[（(][^()（）]{1,24}[)）]\s*/g, ' ')
    .replace(/\s*[（(][^()（）]{0,24}$/g, ' ')
    .replace(/^[^()（）]{1,24}[)）]\s*/g, ' ')
    .replace(/^[()（）]+|[()（）]+$/g, '')
    .replace(/^[「『"'“”]+|[」』"'“”]+$/g, '')
    .replace(/^(fig\.?|lit\.?|figurative|literal|図\.?|フィグ\.?|リット?\.?|比喩的に)\s*/i, '')
    .replace(/^を(?=[ぁ-んァ-ヶ一-龯々])/u, '')
    .replace(/^[\s\-–—:：,，;；/／]+|[\s\-–—:：,，;；/／]+$/g, '')
    .replace(/[。．.!！?？]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const stripClassifierNotes = (gloss) =>
  gloss
    .replace(/\bCL:[^/／;；。]+/gi, '')
    .replace(/\b(?:classifier|measure words?|count(?:er| word)s?)\s*:[^/／;；。]+/gi, '');

const isRejectedGlossCandidate = (candidate) => {
  if (!candidate) {
    return true;
  }

  if (/^[\p{P}\p{S}\s]+$/u.test(candidate)) {
    return true;
  }

  if (/[。{}<>|()（）]|\.\.\.|…|[?？!！]/.test(candidate) || /\(や\)|（や）/.test(candidate)) {
    return true;
  }

  if (repeatedGlossPattern.test(candidate)) {
    return true;
  }

  if (candidate.length > 18) {
    return true;
  }

  if (singleKanaGlossPattern.test(candidate)) {
    return true;
  }

  if (transliteratedSurnameGlossPattern.test(candidate)) {
    return true;
  }

  if (isDictionaryMetadataJapaneseGloss(candidate)) {
    return true;
  }

  if (isMachineTranslatedJapaneseGloss(candidate)) {
    return true;
  }

  if (explanatoryGlossPattern.test(candidate)) {
    return true;
  }

  return false;
};

const extractCandidates = (...glosses) => {
  const candidates = [];

  for (const gloss of glosses) {
    if (!gloss) {
      continue;
    }

    const parts = stripClassifierNotes(gloss.replace(/\uFEFF/g, ''))
      .replace(/\[[^\]]*\]/g, '')
      .replace(/\{[^{}]*\}/g, '')
      .split(/[／/]/)
      .flatMap((part) => part.split(/[;；]/))
      .flatMap((part) => part.split(/[、，,]/))
      .flatMap((part) => part.split(/\.{3,}|…+/))
      .flatMap((part) => part.split('|'))
      .flatMap((part) => part.split(/\(や\)|（や）/))
      .map((part) => part.replace(/^\([^)]*\)/, '').trim())
      .map((part) =>
        part.replace(/^(also|lit\.?|fig\.?|figurative|literal|variant of|図\.?)\s+/i, '').trim()
      )
      .map((part) => normalizeGlossCandidate(part))
      .filter(Boolean);

    for (const part of parts) {
      if (/^(surname|variant|classifier|see also|used in|Taiwan pr\.)/i.test(part)) {
        continue;
      }

      if (isRejectedGlossCandidate(part)) {
        continue;
      }

      candidates.push(part);
    }
  }

  return candidates;
};

const isRejectedJapaneseGlossCandidate = (candidate, source = 'ja') => {
  if (!candidate) {
    return true;
  }

  if (simplifiedChineseGlossPattern.test(candidate)) {
    return true;
  }

  if (untranslatedChineseGlossPattern.test(candidate)) {
    return true;
  }

  if (source !== 'ja' && allHanGlossPattern.test(candidate)) {
    return true;
  }

  return false;
};

export const scoreJapaneseLabel = (candidate, source = 'ja') => {
  if (!candidate || isRejectedJapaneseGlossCandidate(candidate, source)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;

  if (classifierOnlyGlosses.has(candidate)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (singleKanaGlossPattern.test(candidate)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (transliteratedSurnameGlossPattern.test(candidate)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (isDictionaryMetadataJapaneseGloss(candidate)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (isMachineTranslatedJapaneseGloss(candidate)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (/[ぁ-ん]/.test(candidate)) {
    score += 6;
  }

  if (/[ァ-ヶ]/.test(candidate)) {
    score += 4;
  }

  if (/[一-龯々]/u.test(candidate)) {
    score += 2;
  }

  if (conciseHanGlossPattern.test(candidate)) {
    score += 4;
  }

  if (/^[A-Za-z0-9 ?!.,'":;()-]+$/.test(candidate)) {
    score -= 3;
  }

  if (explanatoryGlossPattern.test(candidate)) {
    score -= 6;
  }

  if (rejectionPatterns.some((pattern) => pattern.test(candidate))) {
    score -= 8;
  }

  if (/[|[\]{}<>]/.test(candidate)) {
    score -= 5;
  }

  if (candidate.length <= 10) {
    score += 3;
  } else if (candidate.length <= 14) {
    score += 1;
  } else {
    score -= 6;
  }

  if (/^[\p{Script=Han}々]+$/u.test(candidate) && source === 'fallback') {
    score -= 3;
  }

  return score;
};

const sourcePriority = (source) => {
  if (source === 'preferred') {
    return 3;
  }

  if (source === 'ja') {
    return 2;
  }

  return 1;
};

const toScoredLabels = (rawGlosses) => {
  const candidates = [];

  for (const { meansJa, means } of rawGlosses) {
    candidates.push(
      ...extractCandidates(meansJa).map((candidate) => ({ candidate, source: 'ja' }))
    );
    candidates.push(
      ...extractCandidates(means).map((candidate) => ({ candidate, source: 'fallback' }))
    );
  }

  const deduped = new Map();

  for (const entry of candidates) {
    const existing = deduped.get(entry.candidate);

    if (!existing || sourcePriority(entry.source) > sourcePriority(existing.source)) {
      deduped.set(entry.candidate, entry);
    }
  }

  return [...deduped.values()]
    .map((entry) => ({
      ...entry,
      score: scoreJapaneseLabel(entry.candidate, entry.source),
    }))
    .filter((entry) => Number.isFinite(entry.score))
    .sort(
      (left, right) =>
        right.score - left.score ||
        sourcePriority(right.source) - sourcePriority(left.source) ||
        left.candidate.length - right.candidate.length
    );
};

export const pickBestJapaneseLabel = ({ rawGlosses, preferredLabel }) => {
  const normalizedPreferred =
    typeof preferredLabel === 'string' ? normalizeGlossCandidate(preferredLabel) : null;
  const scoredLabels = toScoredLabels(rawGlosses);

  if (normalizedPreferred) {
    return {
      canonicalJa: normalizedPreferred,
      jaQualityScore: scoreJapaneseLabel(normalizedPreferred, 'preferred'),
      labelCandidates: [
        {
          candidate: normalizedPreferred,
          source: 'preferred',
          score: scoreJapaneseLabel(normalizedPreferred, 'preferred'),
        },
        ...scoredLabels.filter((entry) => entry.candidate !== normalizedPreferred),
      ],
    };
  }

  return {
    canonicalJa: scoredLabels[0]?.candidate ?? null,
    jaQualityScore: scoredLabels[0]?.score ?? Number.NEGATIVE_INFINITY,
    labelCandidates: scoredLabels,
  };
};
