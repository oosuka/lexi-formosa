const parseJsonOrJsonl = (sourceText) => {
  const trimmed = sourceText.trim().replace(/^\uFEFF/, '');

  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed);

    if (!Array.isArray(parsed)) {
      throw new Error('Source must be a JSON array or JSONL.');
    }

    return parsed;
  }

  return trimmed
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
};

export const readTocflRows = (sourceText) =>
  parseJsonOrJsonl(sourceText).map((item) => ({
    trad: String(item.text ?? '').trim(),
    source: 'tocfl',
    tocflLevel: Number(item.tocfl_level),
    category: String(item.category ?? '').trim(),
    pronunciation: {
      pinyin: item.pinyin ?? '',
      zhuyin: item.zhuyin ?? '',
    },
  }));

export const readTbclRows = (sourceText) =>
  parseJsonOrJsonl(sourceText).map((item) => ({
    trad: String(item.word ?? item.text ?? '').trim(),
    source: 'tbcl',
    tbclLevel: Number(item.level),
    category: String(item.category ?? '').trim(),
  }));

export { parseJsonOrJsonl };
