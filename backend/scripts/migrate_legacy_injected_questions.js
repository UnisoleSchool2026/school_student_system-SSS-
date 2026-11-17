// ============================================================================
// PHASE 8: LEGACY INJECTED QUESTIONS MIGRATION SCRIPT
// Safely upgrades custom_injected_questions.json to canonical schema
// Usage:
//   node scripts/migrate_legacy_injected_questions.js           (--dry-run by default)
//   node scripts/migrate_legacy_injected_questions.js --apply   (creates backup & applies)
// ============================================================================

const fs = require('fs');
const path = require('path');
const { computeContentHash, validateQuestionInvariants, STATUS_LIFECYCLE } = require('../src/services/questionCanonicalSchema');
const examPatterns = require('../src/services/examPatternRegistry');

const TARGET_FILE = path.resolve(__dirname, '../src/database/custom_injected_questions.json');
const isApply = process.argv.includes('--apply');

function migrateLegacyQuestions() {
  console.log(`=== MIGRATION: LEGACY INJECTED QUESTIONS (${isApply ? 'APPLY MODE' : 'DRY RUN'}) ===`);

  if (!fs.existsSync(TARGET_FILE)) {
    console.log(`Target file not found: ${TARGET_FILE}`);
    return;
  }

  const raw = fs.readFileSync(TARGET_FILE, 'utf8');
  let list = [];
  try {
    list = JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to parse ${TARGET_FILE}:`, err.message);
    process.exit(1);
  }

  if (!Array.isArray(list) || list.length === 0) {
    console.log('No questions found in dataset to migrate.');
    return;
  }

  console.log(`Loaded ${list.length} questions from ${TARGET_FILE}`);

  const seenHashes = new Map();
  const migrated = [];
  let duplicateCount = 0;
  let reclassifiedCount = 0;
  let pendingReviewCount = 0;

  for (let i = 0; i < list.length; i++) {
    const q = list[i];
    const marks = Number(q.marks_weightage || q.marks || 1);

    const hash = q.contentHash || q.content_hash || computeContentHash({
      question_latex: q.question_latex,
      options_latex: q.options_latex || q.options,
      marks
    });

    if (seenHashes.has(hash)) {
      duplicateCount++;
      console.log(`  [DEDUPLICATE] Duplicate question ${q.id} (matches ${seenHashes.get(hash).id}).`);
      continue;
    }

    // Determine target modes and tracks
    const textSignature = [
      q.target_exam,
      q.curriculum_board,
      q.pyq_appearance,
      q.question_source,
      q.source_category
    ].filter(Boolean).join(' | ').toUpperCase();

    let targetModes = Array.isArray(q.target_modes) && q.target_modes.length ? q.target_modes.slice() : [];
    let boardTargets = Array.isArray(q.board_targets) ? q.board_targets.slice() : [];
    let competitiveTargets = Array.isArray(q.competitive_targets) ? q.competitive_targets.slice() : [];

    const isCompetitiveKeyword = /JEE|NEET|AIPMT|IIT/.test(textSignature);
    const isBoardKeyword = /CBSE|HPBOSE|HP_BOARD|ICSE|BOARD/.test(textSignature);

    if (targetModes.length === 0) {
      if (isCompetitiveKeyword && !isBoardKeyword) {
        targetModes = ['COMPETITIVE'];
        if (/NEET/.test(textSignature)) competitiveTargets = ['NEET'];
        else competitiveTargets = ['JEE_MAIN'];
        reclassifiedCount++;
      } else if (isBoardKeyword && !isCompetitiveKeyword) {
        targetModes = ['BOARD'];
        if (/HP/.test(textSignature)) boardTargets = ['HP_BOARD'];
        else if (/ICSE/.test(textSignature)) boardTargets = ['ICSE'];
        else boardTargets = ['CBSE'];
        reclassifiedCount++;
      } else {
        // Dual or legacy defaulted
        targetModes = ['BOARD'];
        boardTargets = ['CBSE'];
        if (isCompetitiveKeyword) {
          targetModes.push('COMPETITIVE');
          competitiveTargets.push(q.subjectKey === 'BIOLOGY' ? 'NEET' : 'JEE_MAIN');
        }
      }
    }

    // Ensure invariants: non-empty arrays
    if (targetModes.includes('BOARD') && boardTargets.length === 0) {
      boardTargets = ['CBSE'];
    }
    if (targetModes.includes('COMPETITIVE') && competitiveTargets.length === 0) {
      competitiveTargets = [q.subjectKey === 'BIOLOGY' ? 'NEET' : 'JEE_MAIN'];
    }

    // Determine status
    let status = q.status || STATUS_LIFECYCLE.APPROVED;
    const isAmbiguous = isCompetitiveKeyword && isBoardKeyword && !q.status;
    if (isAmbiguous) {
      status = STATUS_LIFECYCLE.PENDING_REVIEW;
      pendingReviewCount++;
    }

    const upgraded = {
      ...q,
      contentHash: hash,
      target_modes: targetModes,
      board_targets: boardTargets,
      competitive_targets: competitiveTargets,
      status: status
    };

    // Remove forbidden negative marking on question
    delete upgraded.negative_marks;
    delete upgraded.negativeMarks;
    delete upgraded.negative_marking;

    // Validate invariant
    try {
      validateQuestionInvariants(upgraded);
    } catch (invErr) {
      console.warn(`  [WARNING] Question ${upgraded.id} invariant issue: ${invErr.message}. Marking DRAFT.`);
      upgraded.status = STATUS_LIFECYCLE.DRAFT;
    }

    seenHashes.set(hash, upgraded);
    migrated.push(upgraded);
  }

  console.log('\n--- MIGRATION SUMMARY ---');
  console.log(`Original Questions:      ${list.length}`);
  console.log(`Deduplicated Removed:    ${duplicateCount}`);
  console.log(`Reclassified to Modes:   ${reclassifiedCount}`);
  console.log(`Flagged Pending Review:  ${pendingReviewCount}`);
  console.log(`Final Migrated Count:    ${migrated.length}`);

  if (isApply) {
    const backupPath = `${TARGET_FILE}.bak_${Date.now()}`;
    fs.writeFileSync(backupPath, raw, 'utf8');
    console.log(`\nCreated backup at: ${backupPath}`);
    fs.writeFileSync(TARGET_FILE, JSON.stringify(migrated, null, 2), 'utf8');
    console.log(`Successfully wrote ${migrated.length} canonical questions to ${TARGET_FILE}!`);
  } else {
    console.log('\nDRY RUN complete. No files were modified.');
    console.log('To apply changes and create a backup, run: node scripts/migrate_legacy_injected_questions.js --apply');
  }
}

migrateLegacyQuestions();

