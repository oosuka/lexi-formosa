const GENERATED_ONLY_FIELDS = new Set(['level', 'length', 'sources', 'taiwanPriority']);
const ALLOWED_FIELDS = new Set(['id', 'trad', 'ja', 'category', 'pronunciation']);
const REQUIRED_STRING_FIELDS = ['id', 'trad', 'ja', 'category'];

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatEntryLabel = (entry, index) => {
  if (isPlainObject(entry) && typeof entry.id === 'string' && entry.id.trim()) {
    return entry.id.trim();
  }

  return `entry-${index + 1}`;
};

const normalizeRequiredField = (entry, key, index) => {
  if (typeof entry[key] !== 'string' || !entry[key].trim()) {
    throw new Error(
      `manual-vocabulary.json entry ${index + 1} (${formatEntryLabel(entry, index)}) must include a non-empty ${key}`
    );
  }

  return entry[key].trim();
};

export const parseManualVocabularySeeds = (value) => {
  if (!Array.isArray(value)) {
    throw new Error('manual-vocabulary.json must be an array');
  }

  return value.map((entry, index) => {
    if (!isPlainObject(entry)) {
      throw new Error(`manual-vocabulary.json entry ${index + 1} must be an object`);
    }

    const generatedFields = Object.keys(entry).filter((key) => GENERATED_ONLY_FIELDS.has(key));

    if (generatedFields.length > 0) {
      throw new Error(
        `manual-vocabulary.json entry ${index + 1} (${formatEntryLabel(entry, index)}) must not include generated fields: ${generatedFields.join(', ')}`
      );
    }

    const unsupportedFields = Object.keys(entry).filter((key) => !ALLOWED_FIELDS.has(key));

    if (unsupportedFields.length > 0) {
      throw new Error(
        `manual-vocabulary.json entry ${index + 1} (${formatEntryLabel(entry, index)}) must not include unsupported fields: ${unsupportedFields.join(', ')}`
      );
    }

    const normalizedEntry = {};

    for (const key of REQUIRED_STRING_FIELDS) {
      normalizedEntry[key] = normalizeRequiredField(entry, key, index);
    }

    if (Object.hasOwn(entry, 'pronunciation')) {
      if (typeof entry.pronunciation !== 'string' || !entry.pronunciation.trim()) {
        throw new Error(
          `manual-vocabulary.json entry ${index + 1} (${formatEntryLabel(entry, index)}) must use a non-empty pronunciation when present`
        );
      }

      normalizedEntry.pronunciation = entry.pronunciation.trim();
    }

    return normalizedEntry;
  });
};
