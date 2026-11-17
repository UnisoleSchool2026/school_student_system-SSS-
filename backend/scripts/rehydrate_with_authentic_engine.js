// ============================================================================
// REHYDRATE NCERT DATABASE WITH AUTHENTIC EXTRACTOR ENGINE DATA
// Uses the direct output of ncert_pdf_extractor.py to populate
// books with genuine textbook content blocks and topics.
// ============================================================================

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'src', 'database', 'ncert_reading_books.json');
const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

// Load the authentic math extracted JSON
const mathData = JSON.parse(fs.readFileSync('/tmp/math_extracted.json', 'utf8'));

// Update Math Books:
const mathBookIds = ['book_efde2383-b9f2-44dc-b33c-5529f634332b', 'book_3d540aef-c9f0-49c9-8c0b-a094ad7ba498'];

for (const bookId of mathBookIds) {
  const book = db.books.find(b => b.id === bookId);
  if (!book) continue;

  console.log(`Rehydrating book ${book.id} (${book.title})...`);

  // Remove existing chapters and topics for this book
  const oldChapIds = new Set(book.chapter_ids || []);
  db.chapters = db.chapters.filter(c => !oldChapIds.has(c.id));
  db.topics = db.topics.filter(t => !oldChapIds.has(t.chapter_id));

  book.chapter_ids = [];

  mathData.chapters.forEach((chData, chIdx) => {
    const chapterId = `chap_${bookId}_${chData.no}`;
    book.chapter_ids.push(chapterId);

    const chapter = {
      id: chapterId,
      book_id: bookId,
      chapter_no: chData.no,
      title: chData.title,
      start_page: chData.start,
      end_page: chData.end,
      topic_ids: [],
      confidence: 0.96,
      status: 'approved'
    };

    const codeToTopicId = new Map();

    chData.topics.forEach((tData, topIdx) => {
      const topicId = `top_${chapterId}_${topIdx + 1}`;
      chapter.topic_ids.push(topicId);
      codeToTopicId.set(tData.code, topicId);

      let parentId = null;
      if (tData.code && tData.code.includes('.')) {
        const segs = tData.code.split('.');
        if (segs.length > 2) {
          const parentCode = segs.slice(0, -1).join('.');
          parentId = codeToTopicId.get(parentCode) || null;
        }
      }

      const topic = {
        id: topicId,
        chapter_id: chapterId,
        book_id: bookId,
        title: tData.title,
        topic_code: tData.code,
        code: tData.code,
        position: topIdx + 1,
        parent_id: parentId,
        content_text: tData.content_text,
        content_blocks: tData.content_blocks,
        word_count: tData.word_count,
        page_start: tData.page_start,
        page_end: tData.page_end,
        block_type: tData.block_type || 'topic',
        review_status: 'approved',
        confidence: 0.96,
        flags: []
      };

      db.topics.push(topic);
    });

    db.chapters.push(chapter);
  });
}

// Clean cached topic study aids so they regenerate with real math content
const CACHE_PATH = path.join(__dirname, '..', 'src', 'database', 'ncert_ai_study_cache.json');
fs.writeFileSync(CACHE_PATH, JSON.stringify({}, null, 2), 'utf8');

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log('Successfully rehydrated NCERT database with authentic extracted content!');

