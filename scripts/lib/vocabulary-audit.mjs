const DEFAULT_OVERUSED_LABEL_THRESHOLD = 5;

const allHanGlossPattern = /^[\p{Script=Han}々]+$/u;
const asciiLabelPattern = /^[A-Za-z0-9][A-Za-z0-9 +&./-]*$/;
const singleKanaGlossPattern = /^[ぁ-んァ-ヶー]$/u;
const machineTranslatedGlossPattern = /^[ァ-ヶー]{2,}な$/u;
const singleCharacterSurnamePattern = /姓/;
const dictionaryMetadataPattern =
  /分類(?:語|記号)|クラシファイア|(?:^|[^A-Za-z])CL:|の略|略語|(?:使われ|使用され)る?|に似(?:て|た)|助詞|終助詞|モード助詞|(?:通貨|重量|重さ|長さ|面積|光度|輝度|圧力|体積|密度)の?単位|(?:\d+|[一二三四五六七八九十百千万萬]+)分の|姓$|姓[A-Za-z]|のための姓|姓氏/u;
const explanatoryPattern =
  /または|もしくは|あるいは|という|である|すること|のこと|を指す|を表す|を示す|として使|に使う|の場合|場合|ときに|際に|参照|説明/u;
const simplifiedOrChineseLeakPattern =
  /丝|东|亚|联|门|龙|云|广|务|听|汉|观|馆|铁|习|赔|语|图|气|车|动|词|类|这|样|妈|吗|个|儿|么|颈|谈|阳|视|电|货|汇|诗|经|网|络|镭|赢|份|什麼|甚麼/u;

const sortFindings = (findings) =>
  [...findings].sort(
    (left, right) =>
      left.level - right.level ||
      left.ja.localeCompare(right.ja, 'ja') ||
      left.trad.localeCompare(right.trad, 'zh-Hant') ||
      left.id.localeCompare(right.id)
  );

const buildReasonCounts = (findings) => {
  const reasonCounts = {};

  for (const finding of findings) {
    for (const reason of finding.reasons) {
      reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
    }
  }

  return Object.fromEntries(
    Object.entries(reasonCounts).sort(([left], [right]) => left.localeCompare(right))
  );
};

const buildOverusedLabelKeys = (entries, threshold) => {
  const labelsByLevel = new Map();

  for (const entry of entries) {
    const key = `${entry.level}\t${entry.ja}`;
    const values = labelsByLevel.get(key) ?? [];
    values.push(entry);
    labelsByLevel.set(key, values);
  }

  return new Set(
    [...labelsByLevel.entries()]
      .filter(([, values]) => values.length > threshold)
      .map(([key]) => key)
  );
};

const getAuditReasons = (entry, overusedLabelKeys) => {
  const reasons = [];
  const labelKey = `${entry.level}\t${entry.ja}`;

  if (entry.level === 1 && entry.length === 1 && singleCharacterSurnamePattern.test(entry.ja)) {
    reasons.push('single-character-surname-metadata');
  }

  if (dictionaryMetadataPattern.test(entry.ja)) {
    reasons.push('dictionary-metadata');
  }

  if (explanatoryPattern.test(entry.ja)) {
    reasons.push('explanatory-label');
  }

  if (asciiLabelPattern.test(entry.ja)) {
    reasons.push('ascii-label');
  }

  if (singleKanaGlossPattern.test(entry.ja)) {
    reasons.push('single-kana-label');
  }

  if (machineTranslatedGlossPattern.test(entry.ja)) {
    reasons.push('machine-translated-label');
  }

  if (allHanGlossPattern.test(entry.ja) && entry.ja.length >= 3) {
    reasons.push('han-only-long-label');
  }

  if (simplifiedOrChineseLeakPattern.test(entry.ja)) {
    reasons.push('chinese-leak');
  }

  if (overusedLabelKeys.has(labelKey)) {
    reasons.push('overused-label');
  }

  return reasons;
};

export const auditVocabularyEntries = (
  entries,
  { overusedLabelThreshold = DEFAULT_OVERUSED_LABEL_THRESHOLD } = {}
) => {
  const overusedLabelKeys = buildOverusedLabelKeys(entries, overusedLabelThreshold);
  const findings = sortFindings(
    entries
      .map((entry) => ({
        id: entry.id,
        trad: entry.trad,
        ja: entry.ja,
        level: entry.level,
        length: entry.length,
        category: entry.category,
        sources: entry.sources,
        reasons: getAuditReasons(entry, overusedLabelKeys),
      }))
      .filter((entry) => entry.reasons.length > 0)
  );

  return {
    generatedAt: new Date().toISOString(),
    totalEntries: entries.length,
    findingCount: findings.length,
    summary: {
      reasonCounts: buildReasonCounts(findings),
    },
    findings,
  };
};
