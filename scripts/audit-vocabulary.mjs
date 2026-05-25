import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { auditVocabularyEntries } from './lib/vocabulary-audit.mjs';

const repoRoot = process.cwd();
const vocabularyPath = path.join(repoRoot, 'data', 'vocabulary.json');
const outputPath = path.join(repoRoot, 'data', 'review-batches', 'vocabulary-audit.json');

export const auditVocabularyFile = ({
  inputPath = vocabularyPath,
  reportPath = outputPath,
} = {}) => {
  const vocabulary = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const report = auditVocabularyEntries(vocabulary);

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  return { report, reportPath };
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const { report, reportPath } = auditVocabularyFile();

  console.log(
    `Audited ${report.totalEntries} entries and found ${report.findingCount} suspicious entries.`
  );
  console.log(`Wrote ${path.relative(repoRoot, reportPath)}.`);
}
