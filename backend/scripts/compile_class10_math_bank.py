#!/usr/bin/env python3
import json
import os
import sys

# Ensure current dir is in sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from bank_chapters_1_to_5 import chapters_1_to_5
from bank_chapters_6_to_10 import chapters_6_to_10
from bank_chapters_11_to_14 import chapters_11_to_14
from bank_pattern_questions import pattern_questions
from bank_ncert_chapters_1_to_7 import ncert_chapters_1_to_7
from bank_ncert_chapters_8_to_14 import ncert_chapters_8_to_14

CHAPTER_NAMES = {
    1: "Real Numbers",
    2: "Polynomials",
    3: "Pair of Linear Equations in Two Variables",
    4: "Quadratic Equations",
    5: "Arithmetic Progressions",
    6: "Triangles",
    7: "Coordinate Geometry",
    8: "Introduction to Trigonometry",
    9: "Some Applications of Trigonometry",
    10: "Circles",
    11: "Areas Related to Circles",
    12: "Surface Areas and Volumes",
    13: "Statistics",
    14: "Probability"
}

def format_options(opts, ans):
    if not opts:
        return []
    res = []
    keys = ["A", "B", "C", "D"]
    for i, opt in enumerate(opts):
        k = keys[i] if i < len(keys) else chr(65 + i)
        if isinstance(opt, dict):
            k = opt.get("key", k)
            latex = opt.get("latex", "")
            is_corr = opt.get("is_correct", False) or (k == str(ans).strip()) or (latex.strip() == str(ans).strip())
            distractor = opt.get("distractor_trap", None if is_corr else "Conceptual distractor")
            res.append({
                "key": k,
                "latex": latex,
                "is_correct": is_corr,
                "distractor_trap": distractor
            })
        else:
            opt_str = str(opt).strip()
            is_corr = (opt_str == str(ans).strip()) or (k == str(ans).strip())
            res.append({
                "key": k,
                "latex": opt_str,
                "is_correct": is_corr,
                "distractor_trap": None if is_corr else "Conceptual distractor"
            })
    return res

def normalize_question(raw, source_category):
    ch_num = raw.get("ch", 1)
    ch_name = CHAPTER_NAMES.get(ch_num, f"Chapter {ch_num}")
    marks = raw.get("marks", 2)
    fmt = raw.get("format", "SHORT_ANSWER")
    
    # Map format to standard enum
    if fmt == "MCQ":
        q_format = "MCQ_SINGLE"
    elif fmt == "ASSERTION_REASON":
        q_format = "ASSERTION_REASON"
    elif fmt == "CASE_STUDY":
        q_format = "CASE_BASED"
    elif fmt in ["LONG_ANSWER", "LONG_DERIVATION"]:
        q_format = "LONG_DERIVATION"
    else:
        q_format = "VERY_SHORT_ANSWER" if marks == 1 else "SHORT_ANSWER"

    opts = raw.get("opts", [])
    ans = raw.get("ans", "")
    formatted_opts = format_options(opts, ans) if opts else []

    # Socratic hints
    hints = [
        f"Recall the key theorems and formulas of {ch_name}.",
        f"Apply the foundational step for {raw.get('subtopic', raw.get('topic', 'this concept'))}.",
        "Substitute the given numerical values and simplify step by step."
    ]

    benchmark_seconds = marks * 45 if marks > 1 else 60

    return {
        "id": raw["id"],
        "grade": "10",
        "stream": "FOUNDATION",
        "subject": "Mathematics",
        "chapter_number": ch_num,
        "chapter_name": ch_name,
        "topic": raw.get("topic", ch_name),
        "subtopic": raw.get("subtopic", "Core Problems"),
        "curriculum_board": "CBSE_CLASS_10",
        "question_source": source_category,
        "pyq_appearance": raw.get("pyq", "CBSE PYQ"),
        "difficulty": raw.get("diff", "MEDIUM"),
        "question_format": q_format,
        "benchmark_time_seconds": benchmark_seconds,
        "marks_weightage": marks,
        "question_latex": raw["q"],
        "options_latex": formatted_opts,
        "correct_answer_latex": str(ans),
        "solution_latex": raw.get("sol", ""),
        "socratic_hints": hints
    }

def main():
    all_normalized = []
    
    # 1. PYQs 1 to 105
    for q in chapters_1_to_5:
        all_normalized.append(normalize_question(q, "CBSE_PYQ"))
        
    # 2. PYQs 106 to 190
    for q in chapters_6_to_10:
        all_normalized.append(normalize_question(q, "CBSE_PYQ"))
        
    # 3. PYQs 191 to 290
    for q in chapters_11_to_14:
        all_normalized.append(normalize_question(q, "CBSE_PYQ"))
        
    # 4. Pattern questions 291 to 370
    for q in pattern_questions:
        src = "CBSE_SAMPLE_PATTERN" if "pat" in q["id"] else "CBSE_PYQ"
        all_normalized.append(normalize_question(q, src))
        
    # 5. NCERT Chapters 1 to 7
    for q in ncert_chapters_1_to_7:
        all_normalized.append(normalize_question(q, "NCERT_TEXTBOOK"))
        
    # 6. NCERT Chapters 8 to 14
    for q in ncert_chapters_8_to_14:
        all_normalized.append(normalize_question(q, "NCERT_TEXTBOOK"))
        
    total_count = len(all_normalized)
    print(f"Total compiled questions: {total_count}")

    # Build chapter breakdown
    ch_counts = {}
    source_counts = {}
    for q in all_normalized:
        c = q["chapter_number"]
        ch_counts[c] = ch_counts.get(c, 0) + 1
        s = q["question_source"]
        source_counts[s] = source_counts.get(s, 0) + 1

    print("Breakdown by Chapter:")
    for c in sorted(ch_counts.keys()):
        print(f"  Ch {c:2d} ({CHAPTER_NAMES[c]}): {ch_counts[c]} questions")
    print("Breakdown by Source:")
    for s, count in source_counts.items():
        print(f"  {s}: {count} questions")

    # Generate backend JS service: src/services/class10MathQuestionBank.js
    service_path = os.path.abspath(os.path.join(
        os.path.dirname(__file__), "..", "src", "services", "class10MathQuestionBank.js"
    ))
    
    js_content = """/**
 * CLASS 10 MATHEMATICS COMPREHENSIVE QUESTION BANK SERVICE
 * Contains Board PYQs (Past 10 Years + 2025/2024/2023), NCERT Solved Examples,
 * NCERT Exercises, and CBSE Exam Pattern questions (MCQs, Assertion-Reason, Case Studies, 2M, 3M, 5M).
 * Total verified entries: """ + str(total_count) + """
 */

const class10MathQuestions = """ + json.dumps(all_normalized, indent=2) + """;

/**
 * Filter questions by chapter number (1 to 14)
 */
function getQuestionsByChapter(chapterNumber) {
  const ch = Number(chapterNumber);
  return class10MathQuestions.filter(q => q.chapter_number === ch);
}

/**
 * Filter questions by source: 'CBSE_PYQ', 'NCERT_TEXTBOOK', 'CBSE_SAMPLE_PATTERN'
 */
function getQuestionsBySource(source) {
  const sUpper = String(source).toUpperCase();
  return class10MathQuestions.filter(q => q.question_source.toUpperCase().includes(sUpper));
}

/**
 * Filter questions by format: 'MCQ_SINGLE', 'SHORT_ANSWER', 'LONG_DERIVATION', 'ASSERTION_REASON', 'CASE_BASED'
 */
function getQuestionsByFormat(format) {
  const fUpper = String(format).toUpperCase();
  return class10MathQuestions.filter(q => q.question_format.toUpperCase() === fUpper);
}

/**
 * Search questions by keyword across question, topic, subtopic, or solution
 */
function searchQuestions(query, limit = 50) {
  if (!query || !query.trim()) return class10MathQuestions.slice(0, limit);
  const qLower = query.toLowerCase();
  return class10MathQuestions.filter(q => 
    q.question_latex.toLowerCase().includes(qLower) ||
    q.topic.toLowerCase().includes(qLower) ||
    q.subtopic.toLowerCase().includes(qLower) ||
    q.solution_latex.toLowerCase().includes(qLower) ||
    (q.pyq_appearance && q.pyq_appearance.toLowerCase().includes(qLower))
  ).slice(0, limit);
}

/**
 * Returns metadata summary of the question bank
 */
function getBankSummary() {
  const chapters = {};
  const sources = {};
  const formats = {};

  class10MathQuestions.forEach(q => {
    chapters[q.chapter_number] = (chapters[q.chapter_number] || 0) + 1;
    sources[q.question_source] = (sources[q.question_source] || 0) + 1;
    formats[q.question_format] = (formats[q.question_format] || 0) + 1;
  });

  return {
    totalQuestions: class10MathQuestions.length,
    grade: '10',
    subject: 'Mathematics',
    chaptersBreakdown: chapters,
    sourcesBreakdown: sources,
    formatsBreakdown: formats
  };
}

module.exports = {
  class10MathQuestions,
  getQuestionsByChapter,
  getQuestionsBySource,
  getQuestionsByFormat,
  searchQuestions,
  getBankSummary
};
"""

    with open(service_path, "w", encoding="utf-8") as f:
        f.write(js_content)
    print(f"Generated JS service at: {service_path}")

    # Generate SQL seed file: src/database/seed_class10_maths_pyq_ncert.sql
    sql_path = os.path.abspath(os.path.join(
        os.path.dirname(__file__), "..", "src", "database", "seed_class10_maths_pyq_ncert.sql"
    ))

    sql_lines = [
        "-- ============================================================================",
        "-- SEED SCRIPT FOR CLASS 10 MATHEMATICS QUESTION BANK (PYQ & NCERT)",
        f"-- Total Entries: {total_count}",
        "-- ============================================================================\n",
        "INSERT INTO bank_class10_math_pyq_ncert (",
        "    id, grade, stream, subject, chapter_number, chapter_name, topic, subtopic,",
        "    question_source, curriculum_board, pyq_appearance, difficulty, question_format,",
        "    benchmark_time_seconds, marks_weightage, question_latex, options_latex,",
        "    correct_answer_latex, solution_latex, socratic_hints",
        ") VALUES"
    ]

    value_rows = []
    for q in all_normalized:
        q_id = q["id"].replace("'", "''")
        ch_num = q["chapter_number"]
        ch_name = q["chapter_name"].replace("'", "''")
        top = q["topic"].replace("'", "''")
        subtop = q["subtopic"].replace("'", "''")
        src = q["question_source"].replace("'", "''")
        board = q["curriculum_board"].replace("'", "''")
        pyq = q["pyq_appearance"].replace("'", "''")
        diff = q["difficulty"].replace("'", "''")
        q_fmt = q["question_format"].replace("'", "''")
        b_time = q["benchmark_time_seconds"]
        marks = q["marks_weightage"]
        q_text = q["question_latex"].replace("'", "''")
        opts_json = json.dumps(q["options_latex"]).replace("'", "''")
        ans = q["correct_answer_latex"].replace("'", "''")
        sol = q["solution_latex"].replace("'", "''")
        hints_json = json.dumps(q["socratic_hints"]).replace("'", "''")

        row = (
            f"  ('{q_id}', '10', 'FOUNDATION', 'Mathematics', {ch_num}, '{ch_name}', '{top}', '{subtop}', "
            f"'{src}', '{board}', '{pyq}', '{diff}', '{q_fmt}', {b_time}, {marks}, '{q_text}', "
            f"'{opts_json}'::jsonb, '{ans}', '{sol}', '{hints_json}'::jsonb)"
        )
        value_rows.append(row)

    sql_lines.append(",\n".join(value_rows) + "\nON CONFLICT (id) DO UPDATE SET")
    sql_lines.append("    question_latex = EXCLUDED.question_latex,")
    sql_lines.append("    solution_latex = EXCLUDED.solution_latex,")
    sql_lines.append("    options_latex = EXCLUDED.options_latex,")
    sql_lines.append("    updated_at = NOW();\n")

    with open(sql_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))
    print(f"Generated SQL seed file at: {sql_path}")

if __name__ == "__main__":
    main()
