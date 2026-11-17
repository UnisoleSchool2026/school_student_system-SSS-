// ============================================================================
// PHASE 9: EXTRACTION & RECONCILIATION BENCHMARK RUNNER
// Evaluates extraction accuracy and count reconciliation across Golden Papers
// Outputs structured benchmark results to docs/extraction-benchmarks.md
// ============================================================================

const fs = require('fs');
const path = require('path');
const { extractDeclaredManifest, resolvePaperProfile } = require('../src/services/paperProfileRegistry');
const { reconcileExtraction, normalizeQuestionWithManifest } = require('../src/services/extractionReconciler');
const { parseRawTextLocally } = require('../src/services/questionInjectionService');

const FIXTURES_DIR = path.resolve(__dirname, '../tests/fixtures/papers');
// The committed report (docs/) is only rewritten with --update-docs (npm run benchmarks:update-docs).
// Normal runs (npm run test:ingestion) write to backend/data/ so they do not change tracked files.
const REPORT_PATH = process.argv.includes('--update-docs')
  ? path.resolve(__dirname, '../docs/extraction-benchmarks.md')
  : path.join(require('../src/config/dataPaths').ensureDataDir(), 'extraction-benchmarks.md');

async function runBenchmarks() {
  console.log('=== RUNNING INGESTION EXTRACTION & RECONCILIATION BENCHMARKS ===\n');

  if (!fs.existsSync(FIXTURES_DIR)) {
    console.error(`Fixtures directory not found: ${FIXTURES_DIR}`);
    process.exit(1);
  }

  const paperDirs = fs.readdirSync(FIXTURES_DIR).filter(d => {
    return fs.statSync(path.join(FIXTURES_DIR, d)).isDirectory();
  });

  const benchmarkResults = [];

  for (const dir of paperDirs) {
    const paperFolder = path.join(FIXTURES_DIR, dir);
    const paperFile = path.join(paperFolder, 'paper.txt');
    const expectedFile = path.join(paperFolder, 'expected.json');

    if (!fs.existsSync(paperFile) || !fs.existsSync(expectedFile)) {
      continue;
    }

    const paperText = fs.readFileSync(paperFile, 'utf8');
    const expected = JSON.parse(fs.readFileSync(expectedFile, 'utf8'));

    console.log(`Testing Golden Paper: ${expected.paperName} (${dir})...`);
    const startTime = Date.now();

    // 1. Manifest Extraction
    const manifest = extractDeclaredManifest(paperText, {
      mode: expected.mode,
      track: expected.track,
      subject: expected.subject,
      grade: expected.grade
    });

    const manifestQAccuracy = manifest.declaredTotalQuestions === expected.expectedTotalQuestions;
    const manifestMarksAccuracy = manifest.declaredTotalMarks === expected.expectedTotalMarks;

    // 2. Structured Question Parsing
    const parsed = parseRawTextLocally({
      rawText: paperText,
      targetSubject: expected.subject,
      grade: expected.grade,
      category: `${expected.track}_PYQ`
    });

    const rawQuestions = Array.isArray(parsed.questions) && parsed.questions.length > 0
      ? parsed.questions
      : [parsed];

    // 3. Normalization with Manifest
    const normalizedQuestions = rawQuestions.map((q, idx) => {
      return normalizeQuestionWithManifest(q, manifest, idx);
    });

    // 4. Count & Marks Reconciliation
    const reconciliation = reconcileExtraction(manifest, normalizedQuestions, {
      mode: expected.mode,
      track: expected.track
    });

    const durationMs = Date.now() - startTime;

    console.log(`  Expected Q: ${expected.expectedTotalQuestions} | Manifest Q: ${manifest.declaredTotalQuestions} | Extracted Q: ${normalizedQuestions.length}`);
    console.log(`  Reconciliation Status: ${reconciliation.status} | Passed: ${reconciliation.passed} | Duration: ${durationMs}ms\n`);

    benchmarkResults.push({
      id: dir,
      name: expected.paperName,
      mode: expected.mode,
      track: expected.track,
      subject: expected.subject,
      expectedQ: expected.expectedTotalQuestions,
      manifestQ: manifest.declaredTotalQuestions,
      extractedQ: normalizedQuestions.length,
      manifestAccuracy: manifestQAccuracy && manifestMarksAccuracy,
      reconciliationPassed: reconciliation.passed,
      status: reconciliation.status,
      durationMs,
      issues: reconciliation.issues,
      warnings: reconciliation.warnings
    });
  }

  // Generate Markdown Report
  const totalPapers = benchmarkResults.length;
  const manifestPassed = benchmarkResults.filter(r => r.manifestAccuracy).length;
  const reconciledPassed = benchmarkResults.filter(r => r.reconciliationPassed).length;

  const mdReport = `# Ingestion & Reconciliation Engine Benchmark Report
Generated on: ${new Date().toISOString()}

## Executive Summary
- **Golden Papers Tested**: ${totalPapers}
- **Manifest Extraction Accuracy**: ${manifestPassed} / ${totalPapers} (${Math.round((manifestPassed / totalPapers) * 100)}%)
- **Full Count & Marks Reconciliation Passed**: ${reconciledPassed} / ${totalPapers} (${Math.round((reconciledPassed / totalPapers) * 100)}%)

## Benchmark Breakdown Table

| Paper Name | Mode / Track | Expected Q | Extracted Q | Manifest Extraction | Reconciliation | Status | Latency |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${benchmarkResults.map(r => `| **${r.name}** | \`${r.mode} › ${r.track}\` | ${r.expectedQ} | ${r.extractedQ} | ${r.manifestAccuracy ? 'PASS' : 'FAIL'} | ${r.reconciliationPassed ? 'PASS' : 'WARN/FAIL'} | \`${r.status}\` | ${r.durationMs}ms |`).join('\n')}

## Paper Diagnostics & Issue Logs
${benchmarkResults.map(r => `
### ${r.name}
- **Reconciliation Issues**: ${r.issues.length ? r.issues.map(i => `\`${i}\``).join(', ') : 'None (100% matched)'}
- **Pedagogical Warnings**: ${r.warnings.length ? r.warnings.map(w => `\`${w}\``).join(', ') : 'None'}
`).join('\n')}

---
*Validated by HAPS-AI Scholar Assistant Engine*
`;

  fs.writeFileSync(REPORT_PATH, mdReport, 'utf8');
  console.log(`Benchmark report successfully written to ${REPORT_PATH}!`);
}

runBenchmarks().catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});

