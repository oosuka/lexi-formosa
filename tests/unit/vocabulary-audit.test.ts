// @vitest-environment node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const createEntry = (overrides = {}) => ({
  id: 'seed-1',
  trad: '茶',
  ja: 'お茶',
  level: 1,
  length: 1,
  category: 'food',
  taiwanPriority: true,
  sources: ['seed'],
  ...overrides,
});

const tempDirectories = [];
const workspaceRoot = fileURLToPath(new URL('../..', import.meta.url));
const auditVocabularyScriptPath = fileURLToPath(
  new URL('../../scripts/audit-vocabulary.mjs', import.meta.url)
);
const vocabularyAuditScriptPath = fileURLToPath(
  new URL('../../scripts/lib/vocabulary-audit.mjs', import.meta.url)
);

const createTempRepo = () => {
  const directory = fs.mkdtempSync(path.join(workspaceRoot, '.tmp-lexi-formosa-audit-'));
  tempDirectories.push(directory);
  return directory;
};

afterEach(() => {
  for (const directory of tempDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('vocabulary audit', () => {
  it('怪しい日本語ラベルを理由付きで一覧化する', async () => {
    const { auditVocabularyEntries } = await import('../../scripts/lib/vocabulary-audit.mjs');

    const report = auditVocabularyEntries([
      createEntry({ id: 'safe-1', trad: '茶', ja: 'お茶' }),
      createEntry({ id: 'bad-surname', trad: '朱', ja: '朱姓' }),
      createEntry({ id: 'bad-description', trad: '檔', ja: 'ショーの分類記号' }),
      createEntry({ id: 'bad-unit', trad: '錢幣單位', ja: '中国の通貨単位', level: 3, length: 4 }),
      createEntry({ id: 'bad-machine', trad: '細緻', ja: 'トリフな', level: 2, length: 2 }),
      createEntry({ id: 'bad-duplicate-1', trad: '守衛', ja: '守る', level: 2, length: 2 }),
      createEntry({ id: 'bad-duplicate-2', trad: '守護', ja: '守る', level: 2, length: 2 }),
      createEntry({ id: 'bad-duplicate-3', trad: '防守', ja: '守る', level: 2, length: 2 }),
      createEntry({ id: 'bad-duplicate-4', trad: '保護', ja: '守る', level: 2, length: 2 }),
      createEntry({ id: 'bad-duplicate-5', trad: '維護', ja: '守る', level: 2, length: 2 }),
      createEntry({ id: 'bad-duplicate-6', trad: '防護', ja: '守る', level: 2, length: 2 }),
      createEntry({ id: 'bad-english', trad: '提款機', ja: 'ATM', level: 3, length: 3 }),
    ]);

    expect(report.totalEntries).toBe(12);
    expect(report.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'bad-surname',
          trad: '朱',
          ja: '朱姓',
          reasons: expect.arrayContaining(['single-character-surname-metadata']),
        }),
        expect.objectContaining({
          id: 'bad-description',
          reasons: expect.arrayContaining(['dictionary-metadata']),
        }),
        expect.objectContaining({
          id: 'bad-english',
          reasons: expect.arrayContaining(['ascii-label']),
        }),
        expect.objectContaining({
          id: 'bad-unit',
          reasons: expect.arrayContaining(['dictionary-metadata']),
        }),
        expect.objectContaining({
          id: 'bad-machine',
          reasons: expect.arrayContaining(['machine-translated-label']),
        }),
        expect.objectContaining({
          id: 'bad-duplicate-1',
          reasons: expect.arrayContaining(['overused-label']),
        }),
      ])
    );
    expect(report.summary.reasonCounts).toMatchObject({
      'single-character-surname-metadata': 1,
      'dictionary-metadata': 3,
      'ascii-label': 1,
      'machine-translated-label': 1,
      'overused-label': 6,
    });
  });

  it('CLI は監査結果を review-batches に保存できる', () => {
    const repoRoot = createTempRepo();
    const scriptDirectory = path.join(repoRoot, 'scripts');
    const scriptLibDirectory = path.join(scriptDirectory, 'lib');
    const dataDirectory = path.join(repoRoot, 'data');

    fs.mkdirSync(scriptDirectory, { recursive: true });
    fs.mkdirSync(scriptLibDirectory, { recursive: true });
    fs.mkdirSync(dataDirectory, { recursive: true });
    fs.copyFileSync(auditVocabularyScriptPath, path.join(scriptDirectory, 'audit-vocabulary.mjs'));
    fs.copyFileSync(
      vocabularyAuditScriptPath,
      path.join(scriptLibDirectory, 'vocabulary-audit.mjs')
    );
    fs.writeFileSync(
      path.join(dataDirectory, 'vocabulary.json'),
      `${JSON.stringify(
        [
          createEntry({ id: 'safe-1', trad: '茶', ja: 'お茶' }),
          createEntry({ id: 'bad-surname', trad: '朱', ja: '朱姓' }),
        ],
        null,
        2
      )}\n`
    );

    const result = spawnSync(
      process.execPath,
      [path.join(scriptDirectory, 'audit-vocabulary.mjs')],
      {
        cwd: repoRoot,
        encoding: 'utf8',
      }
    );

    const reportPath = path.join(dataDirectory, 'review-batches', 'vocabulary-audit.json');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Audited 2 entries and found 1 suspicious entries.');
    expect(fs.existsSync(reportPath)).toBe(true);
    expect(JSON.parse(fs.readFileSync(reportPath, 'utf8')).findings).toEqual([
      expect.objectContaining({ id: 'bad-surname' }),
    ]);
  });
});
