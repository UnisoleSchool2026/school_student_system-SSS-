-- ============================================================================
-- UNISOLE AI SCHOOL: PRODUCTION DATABASE SCHEMA (PostgreSQL 16)
-- Target: Unisole AI School (CBSE, State Boards, JEE, NEET, Olympiads)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing tables if needed
DROP TABLE IF EXISTS dpp_attempts CASCADE;
DROP TABLE IF EXISTS curriculum_content CASCADE;
DROP TABLE IF EXISTS schools CASCADE;
DROP TABLE IF EXISTS weekly_smart_reports CASCADE;
DROP TABLE IF EXISTS handwritten_evaluations CASCADE;
DROP TABLE IF EXISTS student_question_telemetry CASCADE;
DROP TABLE IF EXISTS concept_mastery CASCADE;
DROP TABLE IF EXISTS assessment_questions CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS subtopics CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS & ROLES TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('TEACHER', 'STUDENT', 'PARENT', 'DIRECTOR', 'ADMIN')),
    roll_number VARCHAR(50) UNIQUE, -- For students
    grade VARCHAR(10),             -- e.g., '11', '12', '10'
    section VARCHAR(10),           -- e.g., 'Science-A', 'Science-B'
    board VARCHAR(20) DEFAULT 'CBSE' CHECK (board IN ('CBSE', 'HP_BOARD', 'JEE_NEET', 'OLYMPIAD')),
    target_exam VARCHAR(50),       -- 'JEE_ADVANCED', 'NEET_UG', 'CBSE_BOARDS', 'HP_BOARDS'
    parent_contact VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. ACADEMIC HIERARCHY
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    grade_name VARCHAR(20) NOT NULL, -- 'Class VI' to 'Class XII'
    stream VARCHAR(50) DEFAULT 'Science', -- 'Science (PCM)', 'Science (PCB)', 'General'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(80) NOT NULL, -- 'Physics', 'Chemistry', 'Mathematics', 'Biology'
    code VARCHAR(20) UNIQUE NOT NULL,
    class_id INT REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- e.g., 'Rotational Motion', 'Thermodynamics'
    code VARCHAR(50) NOT NULL
);

CREATE TABLE subtopics (
    id SERIAL PRIMARY KEY,
    topic_id INT REFERENCES topics(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL, -- e.g., 'Moment of Inertia', 'Torque and Angular Momentum'
    code VARCHAR(50) NOT NULL,
    expected_benchmark_seconds INT DEFAULT 120 -- Benchmark time to solve a standard question
);

-- 3. QUESTION BANK WITH LATEX & COMPETITIVE EXAM METADATA
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subtopic_id INT REFERENCES subtopics(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    curriculum_board VARCHAR(30) NOT NULL CHECK (curriculum_board IN ('CBSE', 'HP_BOARD', 'JEE_MAIN', 'JEE_ADVANCED', 'NEET', 'OLYMPIAD')),
    grade VARCHAR(10) NOT NULL,
    question_type VARCHAR(30) NOT NULL CHECK (question_type IN ('MCQ_SINGLE', 'MCQ_MULTIPLE', 'NUMERICAL', 'SUBJECTIVE_DERIVATION', 'ASSERTION_REASON')),
    bloom_level VARCHAR(30) DEFAULT 'APPLICATION' CHECK (bloom_level IN ('REMEMBER', 'UNDERSTAND', 'APPLICATION', 'ANALYZE', 'EVALUATE', 'CREATE')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD', 'OLYMPIAD_LEVEL')),
    
    -- Content in clean LaTeX
    question_latex TEXT NOT NULL,
    options_latex JSONB, -- Array of { "key": "A", "latex": "$...$", "is_correct": boolean, "distractor_trap": "Forgot factor of 1/2" }
    correct_answer_latex TEXT NOT NULL,
    solution_latex TEXT NOT NULL,
    socratic_hints JSONB DEFAULT '[]'::JSONB, -- Progressive hints: ["Recall Newton's 2nd Law", "Express torque as rate of change of angular momentum"]
    
    marking_rubric JSONB, -- For subjective: step-by-step scoring criteria
    benchmark_time_seconds INT DEFAULT 120,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    is_teacher_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. ASSESSMENTS / TESTS / HOMEWORK SETS
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    curriculum_board VARCHAR(30) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    section VARCHAR(20) NOT NULL,
    total_marks NUMERIC(5, 2) NOT NULL,
    duration_minutes INT NOT NULL,
    learning_mode VARCHAR(30) DEFAULT 'JEE_NEET' CHECK (learning_mode IN ('CBSE_EXCELLENCE', 'JEE_NEET', 'OLYMPIAD_ADVANCED')),
    is_published BOOLEAN DEFAULT FALSE,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assessment_questions (
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    question_order INT NOT NULL,
    marks NUMERIC(4, 2) NOT NULL,
    negative_marks NUMERIC(4, 2) DEFAULT 0.00,
    PRIMARY KEY (assessment_id, question_id)
);

-- 5. SUB-SECOND STUDENT QUESTION TELEMETRY (STREAMED VIA KAFKA)
CREATE TABLE student_question_telemetry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- High resolution telemetry
    attempt_status VARCHAR(20) NOT NULL CHECK (attempt_status IN ('CORRECT', 'INCORRECT', 'PARTIAL', 'UNATTEMPTED', 'MARKED_FOR_REVIEW')),
    time_spent_seconds INT NOT NULL,
    hesitation_seconds INT DEFAULT 0, -- Time before student touched pencil/input
    option_flips_count INT DEFAULT 0, -- Toggling between options
    hints_requested_count INT DEFAULT 0,
    selected_option VARCHAR(10),
    student_response_latex TEXT,
    marks_awarded NUMERIC(4, 2) DEFAULT 0.00,
    
    -- Telemetry classification
    telemetry_category VARCHAR(30) CHECK (telemetry_category IN ('FAST_ACCURATE', 'SLOW_ACCURATE', 'FAST_CARELESS_SLIP', 'SLOW_MISCONCEPTION', 'UNTOUCHED')),
    event_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telemetry_student_question ON student_question_telemetry(student_id, question_id);
CREATE INDEX idx_telemetry_assessment ON student_question_telemetry(assessment_id);

-- 6. DYNAMIC CONCEPT MASTERY MATRIX
CREATE TABLE concept_mastery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subtopic_id INT REFERENCES subtopics(id) ON DELETE CASCADE,
    
    mastery_status VARCHAR(30) NOT NULL CHECK (mastery_status IN ('MASTERED', 'NEEDS_RECAP', 'CRITICAL_WEAKNESS')),
    mastery_score NUMERIC(5, 2) NOT NULL, -- 0.00 to 100.00
    accuracy_percentage NUMERIC(5, 2) NOT NULL,
    total_attempts INT DEFAULT 0,
    average_time_spent_seconds INT DEFAULT 0,
    last_evaluated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (student_id, subtopic_id)
);

CREATE INDEX idx_concept_mastery_student ON concept_mastery(student_id);

-- 7. HANDWRITTEN ANSWER SHEET EVALUATION (VISION AI + TEACHER AUDIT)
CREATE TABLE handwritten_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    
    sheet_image_url TEXT NOT NULL,
    ocr_transcription_latex TEXT,
    step_evaluations JSONB NOT NULL, -- [ { "step": 1, "formula_latex": "$...$", "marks_given": 0.5, "max_marks": 0.5, "feedback": "Formula correct" } ]
    total_marks_awarded NUMERIC(4, 2) NOT NULL,
    max_marks NUMERIC(4, 2) NOT NULL,
    error_type VARCHAR(40) CHECK (error_type IN ('NONE', 'CONCEPTUAL_GAP', 'ALGEBRAIC_SLIP', 'UNIT_OMISSION', 'INCOMPLETE_STEPS')),
    
    ai_confidence_score NUMERIC(4, 2) DEFAULT 0.95,
    teacher_verified BOOLEAN DEFAULT FALSE,
    teacher_adjusted_marks NUMERIC(4, 2),
    teacher_comments TEXT,
    evaluated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. WEEKLY SMART REPORT CARDS (DUAL-ACTION DIRECTIVES)
CREATE TABLE weekly_smart_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    overall_score_percentage NUMERIC(5, 2) NOT NULL,
    total_study_hours NUMERIC(4, 1) NOT NULL,
    questions_attempted INT NOT NULL,
    average_velocity_seconds INT NOT NULL, -- Average time per question
    
    -- Deep breakdown
    mastered_concepts JSONB NOT NULL,    -- Array of { "subtopic": "Moment of Inertia", "accuracy": 94 }
    recap_concepts JSONB NOT NULL,       -- Array of { "subtopic": "Work-Energy Theorem", "reason": "Speed lag" }
    weak_concepts JSONB NOT NULL,        -- Array of { "subtopic": "Damped Oscillations", "accuracy": 31 }
    
    -- Smart Dual Directives
    school_hostel_actions JSONB NOT NULL, -- Array of { "action": "15-min 1-on-1 derivation session in evening prep", "subject": "Physics" }
    parent_actions JSONB NOT NULL,        -- Array of { "action": "Ask student to explain damped oscillations (Feynman check)", "target": "Rotational" }
    
    report_pdf_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_weekly_reports_student ON weekly_smart_reports(student_id, week_start_date);

-- Audit Trigger for updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================================
-- MULTI-TENANT DUAL-MODE ARCHITECTURE (Board vs Competitive) - 2026-11-16
-- Source of truth for profiles: src/registry/tenants/*.json
-- Canonical content mirrors src/services/canonicalContentService.js
-- ============================================================================

-- 13. SCHOOL TENANTS (one row per school / franchise profile)
CREATE TABLE schools (
    id VARCHAR(64) PRIMARY KEY,                -- e.g. 'sch_unisole_001'
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(32),
    active_modes VARCHAR(32)[] NOT NULL,       -- ['BOARD'], ['COMPETITIVE'] or both
    default_mode VARCHAR(32) NOT NULL,
    profile JSONB NOT NULL,                    -- full tenant profile (boardConfig, competitiveConfig, features)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (default_mode = ANY(active_modes))
);

CREATE TRIGGER update_schools_timestamp
BEFORE UPDATE ON schools
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 14. CANONICAL CURRICULUM CONTENT (shared by Board and Competitive modes)
CREATE TABLE curriculum_content (
    id VARCHAR(64) PRIMARY KEY,
    school_id VARCHAR(64) REFERENCES schools(id) ON DELETE CASCADE, -- NULL = shared library content
    subject VARCHAR(32) NOT NULL,
    subject_key VARCHAR(32) NOT NULL,              -- PHYSICS, CLASS10_MATHEMATICS, ...
    grade VARCHAR(4) NOT NULL,
    chapter_code VARCHAR(64) NOT NULL,
    chapter_name VARCHAR(255),
    topic VARCHAR(255) NOT NULL,

    -- Dual-mode classification tags
    target_modes VARCHAR(32)[] NOT NULL,           -- ['BOARD'], ['COMPETITIVE'], or ['BOARD','COMPETITIVE']
    board_targets VARCHAR(32)[] DEFAULT '{}',      -- ['CBSE','HP_BOARD','ICSE']
    competitive_targets VARCHAR(32)[] DEFAULT '{}',-- ['JEE_MAIN','JEE_ADVANCED','NEET']
    competitive_source VARCHAR(32),                -- 'NATIVE' | 'DERIVED_BOARD_MCQ'

    -- Content bucket
    content_type VARCHAR(32) NOT NULL CHECK (content_type IN ('PYQ', 'NCERT', 'EXEMPLAR', 'SAMPLE_PATTERN', 'PRACTICE', 'DPP', 'CHEAT_SHEET', 'ROADMAP')),
    question_format VARCHAR(32),
    question_latex TEXT,
    solution_latex TEXT,
    rubric_steps JSONB,                            -- step-by-step marking rubric (Board)
    mcq_options JSONB,                             -- 4 options with distractor explanations (Competitive)
    correct_answer VARCHAR(255),
    difficulty_level VARCHAR(16) CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD', 'CHALLENGER')),
    year_tag VARCHAR(32),                          -- e.g. 'CBSE_2024', 'NEET_2022'
    year_tags VARCHAR(32)[] DEFAULT '{}',
    marks NUMERIC(5,2),
    benchmark_time_seconds INT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (cardinality(target_modes) > 0)
);

-- Fast filtered index for mode / board / stream lookups
CREATE INDEX idx_curriculum_lookup ON curriculum_content
USING GIN (target_modes, board_targets, competitive_targets);
CREATE INDEX idx_curriculum_subject_chapter ON curriculum_content (subject_key, grade, chapter_code);

-- 15. DAILY PRACTICE PROBLEM ATTEMPTS (streak tracking)
CREATE TABLE dpp_attempts (
    id VARCHAR(64) PRIMARY KEY,
    school_id VARCHAR(64) NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL,
    dpp_id VARCHAR(32) NOT NULL,
    mode VARCHAR(32) NOT NULL CHECK (mode IN ('BOARD', 'COMPETITIVE')),
    track VARCHAR(32) NOT NULL,                    -- CBSE / HP_BOARD / ICSE / JEE / NEET
    subject_key VARCHAR(32) NOT NULL,
    dpp_date DATE NOT NULL,
    score NUMERIC(6,2) NOT NULL,
    max_score NUMERIC(6,2) NOT NULL,
    correct_count INT NOT NULL DEFAULT 0,
    wrong_count INT NOT NULL DEFAULT 0,
    unattempted INT NOT NULL DEFAULT 0,
    time_taken_seconds INT,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dpp_attempts_streak ON dpp_attempts (school_id, student_id, track, dpp_date);

-- ==============================================================================
-- APPLICATION DOCUMENT STORE (added 2026-11-17)
-- Used by src/services/persistence.js. The server also creates this table by
-- itself on start, so running this block by hand is optional.
-- One row per record: collection = store name (assessments, submissions,
-- teacherDpps, doubts, notices, mistakeStates, studyProgress, ...), id = record id.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS school_records (
    collection  TEXT        NOT NULL,
    id          TEXT        NOT NULL,
    data        JSONB       NOT NULL,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (collection, id)
);
