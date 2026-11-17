const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORED_DIRS = new Set(['node_modules', 'vendor', '.git']);
const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.html', '.css', '.json']);

function walk(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (CODE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk(ROOT_DIR);
let errors = [];

// Emoji regex range (standard Unicode emoji ranges)
const emojiRegex = /(?:\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]|\uD83E[\uDD00-\uDFFF]|[\u2600-\u26FF\u2700-\u27BF])/g;

// 1. Full codebase scan for Bare API fetches and Sibling Paths
for (const file of files) {
  const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
  if (relPath === 'package-lock.json' || relPath === 'scripts/test_static_guards.js') continue;

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    const lineNum = lineIndex + 1;

    // Guard 1: bare fetch('/api/...')
    if (/fetch\s*\(\s*['"`]\/api\//.test(line)) {
      errors.push(`[BARE_API] ${relPath}:${lineNum}: Found bare fetch('/api/...') -> "${line.trim()}"`);
    }

    // Guard 2: hardcoded ../../ sibling paths
    if (/\.\.\/\.\.\//.test(line)) {
      errors.push(`[SIBLING_PATH] ${relPath}:${lineNum}: Found hardcoded sibling path ("../../") -> "${line.trim()}"`);
    }
  });
}

// 2. Guard 3: Emoji check on new changes (or full codebase if --strict-all)
const strictAll = process.argv.includes('--strict-all');
if (strictAll) {
  for (const file of files) {
    const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
    if (relPath === 'package-lock.json' || relPath === 'scripts/test_static_guards.js') continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, lineIndex) => {
      if (emojiRegex.test(line)) {
        errors.push(`[EMOJI_DETECTED] ${relPath}:${lineIndex + 1}: Source contains emoji -> "${line.trim()}"`);
      }
    });
  }
} else {
  // Check git diff additions for emojis to prevent new emojis in PRs/commits
  try {
    const diff = execSync('git diff --unified=0 HEAD~1 2>/dev/null || git diff --unified=0 2>/dev/null || echo ""', {
      encoding: 'utf8',
      cwd: ROOT_DIR
    });
    const diffLines = diff.split('\n');
    diffLines.forEach((line) => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        const addedContent = line.slice(1);
        if (emojiRegex.test(addedContent)) {
          errors.push(`[EMOJI_DETECTED_IN_DIFF] Added line contains emoji -> "${addedContent.trim()}"`);
        }
      }
    });
  } catch (err) {
    // If not a git repo or no commits yet, diff check gracefully skips
  }
}

console.log('--- FRONTEND STATIC GUARDS AUDIT ---');
console.log(`Scanned ${files.length} source files for Bare API & Sibling paths.`);
console.log(`Emoji inspection mode: ${strictAll ? 'Full scan' : 'Git diff additions only'}`);

if (errors.length > 0) {
  console.error(`FAILED: Found ${errors.length} static guard violation(s):`);
  errors.forEach(err => console.error(`  ${err}`));
  process.exit(1);
} else {
  console.log('PASSED: All static guards verified cleanly (0 bare APIs, 0 sibling paths, 0 added emojis).');
}
