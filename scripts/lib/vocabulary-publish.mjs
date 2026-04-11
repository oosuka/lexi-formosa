import { mergeEditorialState } from './vocabulary-editorial-records.mjs';

const toEditorialMap = (editorialRecords) =>
  editorialRecords instanceof Map
    ? editorialRecords
    : new Map(editorialRecords.map((record) => [record.trad, record]));

const toPublishedVocabularyEntry = (candidate) => ({
  id: candidate.id,
  trad: candidate.trad,
  ja: candidate.canonicalJa,
  acceptedJa: candidate.acceptedJa?.length ? candidate.acceptedJa : undefined,
  senseTag: candidate.senseTag ?? undefined,
  distractorTags: candidate.distractorTags?.length ? candidate.distractorTags : undefined,
  level: candidate.level,
  length: candidate.length,
  category: candidate.category,
  taiwanPriority: true,
  sources: candidate.sources,
  tocflLevel: candidate.tocflLevel,
  pronunciation: candidate.pronunciation,
  notes: candidate.notes,
});

const toPublishedSeedEntry = (entry) => ({
  ...entry,
  acceptedJa: entry.acceptedJa?.length ? entry.acceptedJa : undefined,
  senseTag: entry.senseTag ?? undefined,
  distractorTags: entry.distractorTags?.length ? entry.distractorTags : undefined,
});

const dedupePublishedEntries = (entries) => {
  const seenTrad = new Set();

  return entries.filter((entry) => {
    if (seenTrad.has(entry.trad)) {
      return false;
    }

    seenTrad.add(entry.trad);
    return true;
  });
};

export const buildPublishedVocabulary = ({ candidates, editorialRecords, seedEntries }) => {
  const editorialMap = toEditorialMap(editorialRecords);
  const approvedCandidates = candidates
    .map((candidate) =>
      mergeEditorialState({
        candidate,
        override: editorialMap.get(candidate.trad),
      })
    )
    .filter((candidate) => candidate.level === 3 || candidate.status === 'approved');

  return dedupePublishedEntries([
    ...seedEntries.map(toPublishedSeedEntry),
    ...approvedCandidates.map(toPublishedVocabularyEntry),
  ]);
};
