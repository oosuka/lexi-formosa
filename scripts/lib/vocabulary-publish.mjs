const toPublishedVocabularyEntry = (candidate) => ({
  id: candidate.id,
  trad: candidate.trad,
  ja: candidate.canonicalJa,
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
  taiwanPriority: true,
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

export const buildPublishedVocabulary = ({ candidates, seedEntries }) => {
  const approvedCandidates = candidates.filter(
    (candidate) => candidate.status === 'approved' && candidate.publishable !== false
  );

  return dedupePublishedEntries([
    ...seedEntries.map(toPublishedSeedEntry),
    ...approvedCandidates.map(toPublishedVocabularyEntry),
  ]);
};
