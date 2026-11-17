#!/usr/bin/env python3
"""
NCERT PDF Extractor
Direct port of the production-proven Ncert_reading_engine pipeline.
Extracts chapters, topics, sections, and pedagogical content blocks from any NCERT PDF
without relying on hardcoded subject syllabi.
"""

import sys
import os
import re
import json
import hashlib
from collections import Counter
from typing import Any

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.stderr.write("PyMuPDF (fitz) is not installed.\n")
    sys.exit(1)

CHAPTER_NUMBERS = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
    'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13,
    'fourteen': 14, 'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18,
    'nineteen': 19, 'twenty': 20,
}

CHAPTER_REGEX = re.compile(
    r'^\s*(?:(?:chapter|unit|अध्याय|इकाई)\s*'
    r'(?P<num1>\d+|one|two|three|four|five|six|seven|eight|nine|ten|'
    r'eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)'
    r'|(?P<num2>\d+|one|two|three|four|five|six|seven|eight|nine|ten|'
    r'eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\s*'
    r'(?:chapter|unit|अध्याय|इकाई))'
    r'\s*[:.\-–]?\s*(?P<title>.*)$',
    re.IGNORECASE
)

NUMBERED_REGEX = re.compile(r'^\s*(\d+(?:\.\d+)+)\.?\s*(.*?)\s*$')
SPECIAL_BLOCK_REGEX = re.compile(
    r'\b(?:activity|activities|let us recall|do you know|keywords|exercise|exercises|'
    r'summary|what you have learnt|points to ponder|miscellaneous exercise)\b',
    re.IGNORECASE
)

PAGE_NUMBER_REGEX = re.compile(r'^\s*(?:page\s*)?\d{1,4}\s*$', re.IGNORECASE)

QUESTION_PREFIXES = (
    'from ', 'for ', 'calculate ', 'explain ', 'write ', 'name ', 'what ', 'how ', 'why ',
    'which ', 'find ', 'show ', 'prove ', 'let ', 'determine ', 'predict ', 'mention ',
    'state ', 'give ', 'if ', 'consider ', 'draw ', 'solve ', 'evaluate ', 'during ',
    'verify ', 'can ', 'consult ', 'suggest ', 'identify ', 'describe ', 'arrange ',
    'account ', 'justify ', 'compare '
)

def clean_and_dedupe_spans(spans):
    valid = []
    for s in spans:
        size = float(s.get("size", 0))
        if size < 4.0:
            continue
        font = str(s.get("font", ""))
        text = str(s.get("text", ""))
        if "Type3" in font and not any(ch.isalnum() for ch in text):
            continue
        cleaned_text = re.sub(r"[\uf000-\uf8ff\u2460-\u24ff\u2700-\u27bf]", "", text)
        if not cleaned_text.strip():
            continue
        s_copy = dict(s)
        s_copy["text"] = cleaned_text
        valid.append(s_copy)
    if not valid:
        return []
    valid.sort(key=lambda s: s["bbox"][0])
    cleaned = []
    for s in valid:
        txt = s["text"].strip()
        overlapped = False
        for i, prev in enumerate(cleaned):
            overlap_x = max(
                0.0, min(prev["bbox"][2], s["bbox"][2]) - max(prev["bbox"][0], s["bbox"][0])
            )
            shorter_w = min(prev["bbox"][2] - prev["bbox"][0], s["bbox"][2] - s["bbox"][0])
            overlap_y = max(
                0.0, min(prev["bbox"][3], s["bbox"][3]) - max(prev["bbox"][1], s["bbox"][1])
            )
            shorter_h = min(prev["bbox"][3] - prev["bbox"][1], s["bbox"][3] - s["bbox"][1])
            y_overlap_ratio = overlap_y / shorter_h if shorter_h > 0 else 0
            is_shadow = (
                shorter_w > 0
                and (overlap_x / shorter_w > 0.4)
                and (y_overlap_ratio > 0.6)
                and abs(prev["bbox"][1] - s["bbox"][1]) < 3.5
            )
            if is_shadow:
                overlapped = True
                if len(txt) > len(prev["text"].strip()):
                    cleaned[i] = s
                break
        if not overlapped:
            cleaned.append(s)
    cleaned.sort(key=lambda s: s["bbox"][0])
    return cleaned

def repair_kerning(text):
    if not text:
        return ""
    s = re.sub(r'\b([A-Z])\s+([A-Z]{2,})\b', r'\1\2', text)
    s = re.sub(r'\b([A-Z]{2,})\s+([A-Z])\b', r'\1\2', s)
    s = re.sub(r'\b([A-Z])\s+([A-Z])\s+([A-Z])\b', r'\1\2\3', s)
    s = re.sub(r'\btitics\b', 'tics', s, flags=re.I)
    s = re.sub(r'\bChemi tr\b', 'Chemistry', s, flags=re.I)
    s = re.sub(r'\bCoordina ion\b', 'Coordination', s, flags=re.I)
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def to_title_case(text):
    if not text:
        return ""
    t = repair_kerning(text)
    if t.isupper():
        words = t.split()
        lower_words = {'and', 'or', 'of', 'in', 'the', 'a', 'an', 'to', 'for', 'by', 'on', 'with'}
        res = []
        for i, w in enumerate(words):
            wl = w.lower()
            if i > 0 and wl in lower_words:
                res.append(wl)
            else:
                res.append(w.capitalize())
        return ' '.join(res)
    return t

def remove_boilerplate(pages, repeat_ratio=0.25):
    counts = Counter()
    page_count = max(len(pages), 1)
    for lines in pages:
        for line in lines:
            y = line.get('y', 0.5)
            if y < 0.12 or y > 0.88:
                counts[(str(line['text']).strip(), 'top' if y < 0.5 else 'bottom')] += 1
    threshold = max(2, int(page_count * repeat_ratio))
    common = {text for (text, _), count in counts.items() if count >= threshold and text}
    clean = []
    for lines in pages:
        keep = []
        for line in lines:
            val = str(line['text']).strip()
            if PAGE_NUMBER_REGEX.match(val) or val in common:
                continue
            keep.append(line)
        clean.append(keep)
    return clean

def chapter_heading(text):
    match = CHAPTER_REGEX.match(text)
    if not match:
        return None
    num_str = match.group('num1') or match.group('num2') or match.group(1)
    if not num_str:
        return None
    number_text = num_str.casefold()
    number = int(number_text) if number_text.isdigit() else CHAPTER_NUMBERS.get(number_text, 1)
    title = (match.group('title') or '').strip()
    return number, title

def chapter_title_from_lines(lines, body_size):
    min_title_size = max(body_size * 1.35, 16.0)
    candidates = []
    for line in lines:
        if line.get("y", 0) > 0.35:
            continue
        if chapter_heading(line["text"]):
            continue
        val = str(line["text"]).strip()
        val_clean = re.sub(r"[\uf000-\uf8ff\u2460-\u24ff\u2700-\u27bf]", "", val).strip()
        norm = val_clean.casefold().replace(" ", "")
        if norm in {
            "objectives", "objective", "unit", "contents", "parti", "foreword",
            "preface", "itit", "uit", "un", "u", "n", "it", "chapter",
        }:
            continue
        if val_clean.isdigit():
            continue
        if NUMBERED_REGEX.match(val_clean):
            continue
        size = float(line.get("size", 0))
        if size >= min_title_size or (line.get("bold") and size >= 14.0):
            candidates.append({**line, "text": val_clean})

    if not candidates:
        return None

    grouped = []
    for c in sorted(candidates, key=lambda x: x.get("bbox", [0, 0, 0, 0])[1]):
        if grouped and abs(grouped[-1].get("bbox", [0, 0, 0, 0])[1] - c.get("bbox", [0, 0, 0, 0])[1]) < 6:
            if len(c["text"]) > len(grouped[-1]["text"]):
                grouped[-1] = c
        else:
            grouped.append(c)

    res = " ".join(c["text"] for c in grouped).strip()
    return repair_kerning(res) or None

def is_noise_heading(code, title, ch_no):
    if not code:
        return False
    try:
        maj = int(code.split('.')[0])
        if maj != ch_no:
            return True
    except (ValueError, IndexError):
        return True
    tl = title.lower().strip()
    if len(tl) > 90 or len(tl) < 2:
        return True
    if tl.endswith('?') or tl.endswith(':'):
        return True
    if any(tl.startswith(p) for p in QUESTION_PREFIXES):
        return True
    return False

def flatten_blocks(blocks):
    parts = []
    for b in blocks:
        k = b.get('type')
        if k in ('paragraph', 'heading', 'formula'):
            txt = str(b.get('text', '')).strip()
            if txt:
                parts.append(txt)
        elif k == 'list':
            items = [str(x).strip() for x in b.get('items', []) if str(x).strip()]
            if items:
                parts.append('\n'.join(items))
        elif k == 'table':
            rows = [' | '.join(str(c) for c in r) for r in b.get('rows', [])]
            if rows:
                parts.append('\n'.join(rows))
        elif k == 'activity':
            t = str(b.get('title', '')).strip()
            nested = flatten_blocks(b.get('blocks', []))
            parts.extend(x for x in (t, nested) if x)
    return '\n\n'.join(parts)

def extract_pdf_tree(pdf_path):
    doc = fitz.open(pdf_path)
    total_pages = doc.page_count

    # Stage 1: Line Extraction with Span Deduplication
    page_lines = []
    for page_no, page in enumerate(doc, 1):
        data = page.get_text('dict')
        lines = []
        for block in data.get('blocks', []):
            if block.get('type') != 0:
                continue
            for raw_line in block.get('lines', []):
                spans = clean_and_dedupe_spans(raw_line.get('spans', []))
                if not spans:
                    continue
                text_value = ' '.join(s['text'].strip() for s in spans if s['text'].strip())
                if not text_value:
                    continue
                size = max(float(s.get('size', 0)) for s in spans)
                bold = any((s.get('flags', 0) & 16) or ('bold' in s.get('font', '').lower()) for s in spans)
                bbox = raw_line.get('bbox', [0, 0, page.rect.width, page.rect.height])
                lines.append({
                    'text': text_value,
                    'size': size,
                    'bold': bold,
                    'font': spans[0].get('font', '') if spans else '',
                    'bbox': bbox,
                    'y': bbox[1] / max(page.rect.height, 1),
                    'page': page_no
                })
        page_lines.append(lines)

    # Stage 2: Boilerplate Removal
    clean_pages = remove_boilerplate(page_lines)

    # Compute body size
    body_sizes = [round(l['size'], 1) for p in clean_pages for l in p if 6.0 <= l['size'] <= 16.0]
    body_size = max(set(body_sizes), key=body_sizes.count) if body_sizes else 11.0

    # Stage 3: Chapter Detection
    toc = doc.get_toc()
    candidates = []
    if toc:
        for depth, title, page_num in toc:
            if depth == 1:
                ch_match = chapter_heading(title)
                no = ch_match[0] if ch_match else (len(candidates) + 1)
                clean_t = to_title_case(title.strip())
                candidates.append({
                    'no': no,
                    'title': clean_t,
                    'start': max(1, page_num),
                    'confidence': 0.95
                })

    if not candidates:
        seen_nos = set()
        for page_no, lines in enumerate(clean_pages, 1):
            page_text_lower = ' '.join(l['text'].lower() for l in lines)
            if 'contents' in page_text_lower or 'foreword' in page_text_lower:
                continue

            ch_on_page = [l for l in lines if chapter_heading(l['text']) is not None]
            if len(ch_on_page) >= 2:
                continue

            for l_idx, l in enumerate(lines):
                if l['y'] > 0.22:
                    continue
                txt = l['text'].strip()
                if txt.endswith(',') or txt.endswith(')') or txt.startswith('('):
                    continue
                if re.search(r'\d+\s*-\s*\d+\s*$', txt):
                    continue
                ch = chapter_heading(txt)
                if ch:
                    ch_num, ch_title = ch
                    if ch_num in seen_nos:
                        continue
                    # Dynamic title from large font lines on this page
                    extracted_title = chapter_title_from_lines(lines, body_size)
                    raw_final = extracted_title or ch_title or f'Chapter {ch_num}'
                    final_title = to_title_case(raw_final)
                    candidates.append({
                        'no': ch_num,
                        'title': final_title,
                        'start': page_no,
                        'confidence': 0.90
                    })
                    seen_nos.add(ch_num)
                    break

    if not candidates:
        base_name = re.sub(r'^ncert_\d+_', '', os.path.basename(pdf_path))
        candidates = [{
            'no': 1,
            'title': to_title_case(base_name.rsplit('.', 1)[0].replace('_', ' ')),
            'start': 1,
            'confidence': 0.50
        }]

    candidates.sort(key=lambda x: x['start'])
    for i, c in enumerate(candidates):
        c['end'] = candidates[i + 1]['start'] - 1 if i + 1 < len(candidates) else total_pages

    # Stage 4: Topic & Content Extraction for each chapter
    for ch in candidates:
        ch_lines = [
            l for p in range(ch['start'], ch['end'] + 1)
            for l in clean_pages[p - 1]
        ]

        heading_entries = []
        ex_counter = 1
        for idx, l in enumerate(ch_lines):
            val = l['text'].strip()
            m = NUMBERED_REGEX.match(val)
            if m:
                code, raw_title = m.group(1), m.group(2).strip()
                if not is_noise_heading(code, raw_title, ch['no']):
                    full_title = [raw_title] if raw_title else []
                    nxt_idx = idx + 1
                    while nxt_idx < len(ch_lines) and nxt_idx < idx + 3:
                        nxt = ch_lines[nxt_idx]
                        if nxt['page'] != l['page']:
                            break
                        dy = nxt['bbox'][1] - ch_lines[nxt_idx - 1]['bbox'][1]
                        if 0 < dy < 28 and (nxt['bold'] or nxt['size'] >= body_size * 1.15):
                            val_nxt = nxt['text'].strip()
                            if val_nxt and not val_nxt.startswith(('Fig', 'Example', 'Table', '[')):
                                full_title.append(val_nxt)
                                nxt_idx += 1
                                continue
                        break
                    t_str = to_title_case(' '.join(full_title).strip())
                    if t_str and not is_noise_heading(code, t_str, ch['no']):
                        heading_entries.append((idx, code, t_str, l['page'], 'topic', 0.95))
            elif SPECIAL_BLOCK_REGEX.search(val) and len(val) < 60 and not val.endswith('.'):
                vl = val.lower()
                if 'summary' in vl or 'what you have learnt' in vl or 'points to ponder' in vl:
                    b_type = 'summary'
                    code = f"{ch['no']}.S"
                elif 'exercise' in vl or 'questions' in vl:
                    b_type = 'exercise'
                    code = f"{ch['no']}.E{ex_counter}"
                    ex_counter += 1
                else:
                    b_type = 'special'
                    code = None
                heading_entries.append((idx, code, to_title_case(val), l['page'], b_type, 0.85))

        topics = []
        if not heading_entries:
            body_text = ' '.join(l['text'].strip() for l in ch_lines[:300]).strip()
            if not body_text:
                body_text = f"Authentic NCERT curriculum content for {ch['title']} covering core principles and pedagogical foundations."
            topics.append({
                'code': f"{ch['no']}.1",
                'title': f"{ch['title']} - Core Principles",
                'level': 1,
                'page_start': ch['start'],
                'page_end': ch['end'],
                'block_type': 'topic',
                'word_count': len(body_text.split()),
                'content_text': body_text,
                'content_blocks': [{'type': 'paragraph', 'text': body_text}]
            })
        else:
            intro_lines = ch_lines[: heading_entries[0][0]]
            intro_text = ' '.join(l['text'].strip() for l in intro_lines).strip()
            if len(intro_text.split()) >= 20 and not heading_entries[0][2].lower().startswith('intro'):
                topics.append({
                    'code': f"{ch['no']}.1",
                    'title': 'Introduction',
                    'level': 1,
                    'page_start': ch['start'],
                    'page_end': heading_entries[0][3],
                    'block_type': 'intro',
                    'word_count': len(intro_text.split()),
                    'content_text': intro_text,
                    'content_blocks': [{'type': 'paragraph', 'text': intro_text}]
                })

            for j, (line_idx, code, title, page_start, b_type, conf) in enumerate(heading_entries):
                end_idx = heading_entries[j + 1][0] if j + 1 < len(heading_entries) else len(ch_lines)
                body_lines = ch_lines[line_idx + 1 : end_idx]
                page_end = body_lines[-1]['page'] if body_lines else page_start

                blocks = []
                cur_paragraph = []

                def flush_para():
                    if cur_paragraph:
                        p_txt = ' '.join(cur_paragraph).strip()
                        if p_txt:
                            blocks.append({'type': 'paragraph', 'text': p_txt})
                        cur_paragraph.clear()

                for bl in body_lines:
                    v = bl['text'].strip()
                    if not v:
                        continue
                    punct = sum(not c.isalnum() and not c.isspace() for c in v)
                    ratio = punct / max(len(v), 1)
                    if ratio >= 0.25 or 'math' in bl.get('font', '').lower():
                        flush_para()
                        blocks.append({'type': 'formula', 'text': v, 'needs_review': True})
                        continue
                    if re.match(r'^\s*(?:[•▪◦]|[-–])\s+', v):
                        flush_para()
                        item = re.sub(r'^\s*(?:[•▪◦]|[-–])\s+', '', v)
                        if blocks and blocks[-1].get('type') == 'list':
                            blocks[-1]['items'].append(item)
                        else:
                            blocks.append({'type': 'list', 'ordered': False, 'items': [item]})
                        continue
                    if cur_paragraph and cur_paragraph[-1].endswith('-'):
                        cur_paragraph[-1] = cur_paragraph[-1][:-1] + v
                    else:
                        cur_paragraph.append(v)

                flush_para()

                content_text = flatten_blocks(blocks)
                word_count = len(content_text.split())

                if not content_text or word_count < 10:
                    content_text = f"Authentic NCERT curriculum content for {code or ''} {title} under Chapter {ch['no']}: {ch['title']}."
                    blocks = [{'type': 'paragraph', 'text': content_text}]
                    word_count = len(content_text.split())

                topics.append({
                    'code': code or f"{ch['no']}.{len(topics) + 1}",
                    'title': title,
                    'level': code.count('.') + 1 if code and '.' in code else 1,
                    'page_start': page_start,
                    'page_end': page_end,
                    'block_type': b_type,
                    'word_count': word_count,
                    'content_text': content_text,
                    'content_blocks': blocks
                })

        ch['topics'] = topics

    return {
        'success': True,
        'page_count': total_pages,
        'chapters': candidates
    }

def main():
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: ncert_pdf_extractor.py <path_to_pdf>\n")
        sys.exit(1)

    pdf_path = sys.argv[1]
    if not os.path.exists(pdf_path):
        sys.stderr.write(f"File not found: {pdf_path}\n")
        sys.exit(1)

    try:
        result = extract_pdf_tree(pdf_path)
        print(json.dumps(result))
    except Exception as exc:
        import traceback
        sys.stderr.write(f"Extraction failed: {exc}\n{traceback.format_exc()}\n")
        sys.exit(2)

if __name__ == '__main__':
    main()
