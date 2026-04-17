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
const allHanGlossPattern = /^[\p{Script=Han}々]+$/u;
const simplifiedChineseGlossPattern =
  /丝|东|亚|联|门|龙|云|广|务|听|汉|观|馆|铁|习|赔|语|图|气|车|动|词|类|这|样/u;
const untranslatedChineseGlossPattern = /什麼|甚麼|東南亞|山東|^[\p{Script=Han}々]+と同じ$/u;
const repeatedGlossPattern = /^(.{1,16}?)(?:[、，,]\1){1,}$/u;
const explanatoryGlossPattern =
  /に相当|を表す|の一種|の段階|仏教|旧暦|分類子|という|である|すること|のこと|を指す|として使|に使う|の意味|によれば|すべき|するのが|を得るため|ために/;
const determineLevel = (length) => {
  if (length <= 2) {
    return 1;
  }

  if (length <= 4) {
    return 2;
  }

  return 3;
};

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

const scoreCandidate = (candidate, source = 'ja') => {
  let score = 0;

  if (isRejectedJapaneseGlossCandidate(candidate, source)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (/[ぁ-んァ-ヶ]/.test(candidate)) {
    score += 6;
  }

  if (/[一-龯々]/u.test(candidate)) {
    score += 2;
  }

  if (/^[A-Za-z0-9 ?!.,'":;()-]+$/.test(candidate)) {
    score -= 2;
  }

  if (/CL:|surname|variant|classifier|abbr\.|old variant|Taiwan pr\./i.test(candidate)) {
    score -= 6;
  }

  if (explanatoryGlossPattern.test(candidate)) {
    score -= 5;
  }

  if (/\||\[|\]|pr\./.test(candidate)) {
    score -= 4;
  }

  if (candidate.length <= 12) {
    score += 2;
  }

  if (candidate.length > 18) {
    score -= 6;
  }

  if (rejectionPatterns.some((pattern) => pattern.test(candidate))) {
    score -= 8;
  }

  return score;
};

const pickBestGloss = (rawGlosses) => {
  const candidates = [];

  for (const { meansJa, means } of rawGlosses) {
    candidates.push(
      ...extractCandidates(meansJa).map((candidate) => ({ candidate, source: 'ja' }))
    );
    candidates.push(
      ...extractCandidates(means).map((candidate) => ({ candidate, source: 'fallback' }))
    );
  }

  const candidateMap = new Map();

  for (const entry of candidates) {
    if (!candidateMap.has(entry.candidate) || entry.source === 'ja') {
      candidateMap.set(entry.candidate, entry);
    }
  }

  const uniqueCandidates = [...candidateMap.values()]
    .map((entry) => ({
      candidate: entry.candidate,
      score: scoreCandidate(entry.candidate, entry.source),
    }))
    .filter((entry) => entry.score >= 1)
    .sort(
      (left, right) => right.score - left.score || left.candidate.length - right.candidate.length
    );

  return uniqueCandidates[0]?.candidate ?? null;
};

const createEmptyCandidate = (trad) => ({
  trad,
  length: [...trad].length,
  level: determineLevel([...trad].length),
  category: null,
  sources: [],
  tocflLevel: undefined,
  tbclLevel: undefined,
  rawGlosses: [],
  pronunciation: undefined,
  canonicalJa: null,
});

const toEditorialMap = (editorialOverrides) =>
  editorialOverrides instanceof Map
    ? editorialOverrides
    : new Map(editorialOverrides.map((record) => [record.trad, record]));

const isApprovedLabelOverride = (override) =>
  override?.status === 'approved' && typeof override.canonicalJa === 'string';

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

const shouldRejectCandidate = (candidate) => {
  if (candidate.status === 'rejected') {
    return true;
  }

  if (!candidate.trad || !/^[\p{Script=Han}]+$/u.test(candidate.trad)) {
    return true;
  }

  if (candidate.length < 1 || candidate.length > 6) {
    return true;
  }

  if (!candidate.canonicalJa) {
    return true;
  }

  return false;
};

export const buildCandidates = ({
  tocflRows = [],
  tbclRows = [],
  mjdicEntries = [],
  editorialOverrides = [],
}) => {
  const candidatesByTrad = new Map();
  const editorialMap = toEditorialMap(editorialOverrides);

  for (const row of [...tocflRows, ...tbclRows]) {
    const current = candidatesByTrad.get(row.trad) ?? createEmptyCandidate(row.trad);
    candidatesByTrad.set(row.trad, mergeSourceRow(current, row));
  }

  for (const entry of mjdicEntries) {
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
    .map((candidate) => {
      const override = editorialMap.get(candidate.trad);
      const canonicalJa =
        (isApprovedLabelOverride(override) ? override.canonicalJa : undefined) ??
        importOverrides.get(candidate.trad) ??
        pickBestGloss(candidate.rawGlosses);
      return {
        candidate: {
          ...candidate,
          status: override?.status ?? candidate.status ?? 'approved',
          canonicalJa,
          acceptedJa: override?.acceptedJa ?? candidate.acceptedJa ?? [],
          senseTag: override?.senseTag ?? candidate.senseTag ?? null,
        },
      };
    })
    .filter(({ candidate }) => !shouldRejectCandidate(candidate))
    .map(({ candidate }) => candidate);
};
