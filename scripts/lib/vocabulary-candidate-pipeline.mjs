import { classifierOnlyGlosses, pickBestJapaneseLabel } from './vocabulary-ja-quality.mjs';
import { determineLevel } from './vocabulary-levels.mjs';

const importOverrides = new Map([
  ['爸爸', 'お父さん'],
  ['大家', 'みんな'],
  ['大學', '大学'],
  ['多少', 'いくつ'],
  ['今天', '今日'],
  ['可能', 'かもしれない'],
  ['可以', 'できる'],
  ['妹妹', '妹'],
  ['沒有', 'ない'],
  ['哪裡', 'どこ'],
  ['你們', 'あなたたち'],
  ['朋友', '友達'],
  ['請問', 'すみません'],
  ['上午', '午前'],
  ['什麼', 'なに'],
  ['時間', '時間'],
  ['他們', '彼ら'],
  ['太太', '奥さん'],
  ['同學', 'クラスメート'],
  ['晚上', '夜'],
  ['問題', '問題'],
  ['我們', '私たち'],
  ['現在', '今'],
  ['小孩', '子供'],
  ['小時', '時間'],
  ['謝謝', 'ありがとう'],
  ['喜歡', '好き'],
  ['一起', '一緒に'],
  ['英文', '英語'],
  ['怎麼', 'どう'],
  ['中文', '中国語'],
  ['中午', '正午'],
  ['包子', '肉まん'],
  ['不錯', '悪くない'],
  ['常常', 'よく'],
  ['多久', 'どのくらい'],
  ['地方', '場所'],
  ['告訴', '伝える'],
  ['公車', 'バス'],
  ['先生', '先生'],
  ['對不起', 'ごめんなさい'],
  ['名字', '名前'],
  ['時候', 'タイミング'],
  ['學校', '学校'],
  ['學生', '学生'],
  ['老師', '先生'],
  ['哥哥', '兄'],
  ['姊姊', '姉'],
  ['弟弟', '弟'],
  ['媽媽', 'お母さん'],
  ['女兒', '娘'],
  ['兒子', '息子'],
  ['東西', 'もの'],
  ['車子', '車'],
  ['工作', '仕事'],
  ['手機', '携帯'],
  ['睡覺', '寝る'],
  ['早上', '朝'],
  ['下午', '午後'],
  ['早安', 'おはよう'],
  ['晚安', 'おやすみ'],
  ['沒關係', '大丈夫'],
  ['馬上', 'すぐに'],
  ['再見', 'さようなら'],
]);

const trackedTradPattern = /^[\p{Script=Han}]+$/u;
const publicSourceNames = new Set(['tocfl', 'tbcl']);
const advancedTopicPattern =
  /chemical|chemistry|biology|physics|politics|political|administrative|juridical|academic|prefecture|province|county|district|自治區|県級市|地級市|行政|政治|化學|医学|學術|法律/i;
const properNounGlossPattern =
  /city|province|county|district|prefecture|capital|bay|river|mountain|island|自治區|県級市|地級市|地名|行政区/i;
const idiomGlossPattern = /\bidiom\b|成語|ことわざ|故事/u;

const createEmptyCandidate = (trad) => {
  const length = [...trad].length;

  return {
    trad,
    length,
    level: determineLevel(length),
    category: null,
    sources: [],
    tocflLevel: undefined,
    tbclLevel: undefined,
    rawGlosses: [],
    pronunciation: undefined,
    canonicalJa: null,
    senseTag: null,
    distractorTags: null,
    sourceQualityScore: 0,
    jaQualityScore: Number.NEGATIVE_INFINITY,
    qualityScore: Number.NEGATIVE_INFINITY,
    publishable: false,
    rejectionReasons: [],
    status: 'approved',
  };
};

const mergeSourceRow = (candidate, row) => {
  const next = {
    ...candidate,
    sources: candidate.sources.includes(row.source)
      ? candidate.sources
      : [...candidate.sources, row.source],
    category: candidate.category ?? (row.category ? `${row.source}:${row.category}` : null),
    tocflLevel: row.tocflLevel ?? candidate.tocflLevel,
    tbclLevel: row.tbclLevel ?? candidate.tbclLevel,
  };

  if (!next.pronunciation && row.pronunciation?.pinyin) {
    next.pronunciation = row.pronunciation.pinyin;
  }

  return next;
};

const getRawGlossText = (candidate) =>
  candidate.rawGlosses
    .flatMap((gloss) => [gloss.meansJa ?? '', gloss.means ?? ''])
    .filter(Boolean)
    .join(' | ');

const getSourceQualityScore = (candidate) => {
  let score = 0;

  if (candidate.sources.includes('tocfl')) {
    score += 5;
  }

  if (candidate.sources.includes('tbcl')) {
    score += 4;
  }

  if (candidate.sources.includes('tocfl') && candidate.sources.includes('tbcl')) {
    score += 2;
  }

  if (!candidate.sources.some((source) => publicSourceNames.has(source))) {
    score -= 6;
  }

  if (typeof candidate.tocflLevel === 'number') {
    if (candidate.tocflLevel <= 2) {
      score += 2;
    } else if (candidate.tocflLevel <= 4) {
      score += 1;
    } else {
      score -= 3;
    }
  }

  if (typeof candidate.tbclLevel === 'number') {
    if (candidate.tbclLevel <= 2) {
      score += 2;
    } else if (candidate.tbclLevel <= 4) {
      score += 1;
    } else {
      score -= 2;
    }
  }

  return score;
};

const isProperNounLike = (candidate) => {
  if (candidate.length >= 4 && /(市|省|縣|區|州)$/.test(candidate.trad)) {
    return true;
  }

  return properNounGlossPattern.test(getRawGlossText(candidate));
};

const isIdiomLike = (candidate) => {
  if (idiomGlossPattern.test(getRawGlossText(candidate))) {
    return true;
  }

  return candidate.length >= 4 && /之/.test(candidate.trad);
};

const isSpecializedLike = (candidate) => advancedTopicPattern.test(getRawGlossText(candidate));

const deriveSenseTag = (candidate) => {
  const category = candidate.category?.split(':').at(-1)?.trim();

  if (!category) {
    return null;
  }

  return `category.${category}`;
};

const deriveDistractorTags = (candidate) => {
  const tags = new Set();

  const category = candidate.category?.split(':').at(-1)?.trim();

  if (category) {
    tags.add(`category.${category}`);
  }

  tags.add(candidate.level === 3 ? 'length.3plus' : `length.${candidate.level}`);
  return [...tags];
};

const hasClassifierOnlyJapaneseGloss = (candidate) =>
  candidate.rawGlosses.some((gloss) =>
    String(gloss.meansJa ?? '')
      .split(/[／/、，,;；]/)
      .map((part) => part.trim())
      .some((part) => classifierOnlyGlosses.has(part))
  );

const hasSingleCharacterSurnameMetadataLabel = (candidate) =>
  candidate.length === 1 && /姓/.test(candidate.canonicalJa ?? '');

const evaluateCandidate = (candidate) => {
  const preferredLabel = importOverrides.get(candidate.trad);
  const { canonicalJa, jaQualityScore } = pickBestJapaneseLabel({
    rawGlosses: candidate.rawGlosses,
    preferredLabel,
  });
  const sourceQualityScore = getSourceQualityScore(candidate);
  const next = {
    ...candidate,
    status: candidate.status ?? 'approved',
    canonicalJa,
    senseTag: candidate.senseTag ?? deriveSenseTag(candidate),
    distractorTags: candidate.distractorTags ?? deriveDistractorTags(candidate),
    sourceQualityScore,
    jaQualityScore,
    qualityScore:
      sourceQualityScore +
      (Number.isFinite(jaQualityScore) ? jaQualityScore : Number.NEGATIVE_INFINITY),
    rejectionReasons: [],
  };

  if (!next.sources.some((source) => publicSourceNames.has(source))) {
    next.rejectionReasons.push('source:mjdic-only');
  }

  if (!next.canonicalJa) {
    next.rejectionReasons.push('ja:missing');
  } else if (classifierOnlyGlosses.has(next.canonicalJa) || hasClassifierOnlyJapaneseGloss(next)) {
    next.rejectionReasons.push('ja:classifier-only');
  } else if (hasSingleCharacterSurnameMetadataLabel(next)) {
    next.rejectionReasons.push('ja:surname-metadata');
  } else if (!Number.isFinite(next.jaQualityScore) || next.jaQualityScore < 4) {
    next.rejectionReasons.push('ja:low-quality');
  }

  if (next.level === 3 && typeof next.tocflLevel === 'number' && next.tocflLevel > 4) {
    next.rejectionReasons.push('level:too-advanced');
  }

  if (isProperNounLike(next)) {
    next.rejectionReasons.push('word:proper-noun');
  }

  if (isIdiomLike(next)) {
    next.rejectionReasons.push('word:idiom-like');
  }

  if (isSpecializedLike(next)) {
    next.rejectionReasons.push('word:specialized');
  }

  next.publishable = next.rejectionReasons.length === 0;
  return next;
};

export const buildCandidates = ({ tocflRows = [], tbclRows = [], mjdicEntries = [] }) => {
  const candidatesByTrad = new Map();

  for (const row of [...tocflRows, ...tbclRows]) {
    if (!trackedTradPattern.test(row.trad ?? '')) {
      continue;
    }

    const current = candidatesByTrad.get(row.trad) ?? createEmptyCandidate(row.trad);
    candidatesByTrad.set(row.trad, mergeSourceRow(current, row));
  }

  for (const entry of mjdicEntries) {
    if (!trackedTradPattern.test(entry.trad ?? '')) {
      continue;
    }

    const current = candidatesByTrad.get(entry.trad) ?? createEmptyCandidate(entry.trad);
    current.rawGlosses.push({
      source: 'mjdic',
      meansJa: entry.meansJa ?? '',
      means: entry.means ?? '',
    });
    current.pronunciation ??= entry.pronunciation ?? undefined;
    current.sources = current.sources.includes('mjdic')
      ? current.sources
      : [...current.sources, 'mjdic'];
    candidatesByTrad.set(entry.trad, current);
  }

  return [...candidatesByTrad.values()]
    .map((candidate) => evaluateCandidate(candidate))
    .sort(
      (left, right) =>
        left.level - right.level ||
        left.length - right.length ||
        left.trad.localeCompare(right.trad, 'zh-Hant')
    );
};
