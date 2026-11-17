-- ============================================================================
-- HAPS-AI SCHOLAR ASSISTANT: SEED DATA
-- Him Academy Public School (HAPS), Vikas Nagar, Hamirpur (HP)
-- Class XI & XII Science Sections (CBSE, HPBOSE, JEE Main, NEET)
-- ============================================================================

-- 1. Insert Classes
INSERT INTO classes (id, grade_name, stream) VALUES
(1, 'Class XI', 'Science (PCM/PCB)'),
(2, 'Class XII', 'Science (PCM/PCB)'),
(3, 'Class X', 'Secondary (HP Board & CBSE)'),
(4, 'Class IX', 'Foundation (Olympiad / CBSE)')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Subjects
INSERT INTO subjects (id, name, code, class_id) VALUES
(1, 'Physics', 'PHY-11', 1),
(2, 'Chemistry', 'CHEM-11', 1),
(3, 'Mathematics', 'MATH-11', 1),
(4, 'Biology', 'BIO-11', 1),
(5, 'Physics', 'PHY-12', 2)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Topics & Subtopics
INSERT INTO topics (id, subject_id, name, code) VALUES
(1, 1, 'Rotational Motion & Rigid Body Dynamics', 'PHY-11-ROT'),
(2, 1, 'Work, Energy and Power', 'PHY-11-WEP'),
(3, 1, 'Oscillations & Simple Harmonic Motion', 'PHY-11-SHM'),
(4, 3, 'Calculus & Limits', 'MATH-11-CALC')
ON CONFLICT (id) DO NOTHING;

INSERT INTO subtopics (id, topic_id, name, code, expected_benchmark_seconds) VALUES
(1, 1, 'Moment of Inertia & Parallel Axis Theorem', 'SUB-MOI-01', 90),
(2, 1, 'Torque and Conservation of Angular Momentum', 'SUB-ANG-02', 150),
(3, 2, 'Work-Energy Theorem & Variable Forces', 'SUB-WEP-01', 120),
(4, 3, 'Damped & Forced Oscillations (Resonance)', 'SUB-SHM-03', 180),
(5, 4, 'Limits & L''Hôpital''s Rule Applications', 'SUB-LIM-01', 90)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Users (Teachers, Students, Leadership)
INSERT INTO users (id, full_name, email, password_hash, role, roll_number, grade, section, board, target_exam) VALUES
('a0000000-0000-0000-0000-000000000001', 'Dr. Pankaj Sharma', 'director@himacademy.com', 'argon2id$mock$hash1', 'DIRECTOR', NULL, NULL, NULL, 'CBSE', NULL),
('a0000000-0000-0000-0000-000000000002', 'Er. Rajesh Kumar', 'rajesh.phy@himacademy.com', 'argon2id$mock$hash2', 'TEACHER', NULL, '11', 'Science-A', 'CBSE', 'JEE_ADVANCED'),
('a0000000-0000-0000-0000-000000000003', 'Mrs. Sunita Verma', 'sunita.chem@himacademy.com', 'argon2id$mock$hash3', 'TEACHER', NULL, '12', 'Science-A', 'HP_BOARD', 'NEET_UG'),
('b0000000-0000-0000-0000-000000000001', 'Aryan Sharma', 'aryan.s@student.haps.ac.in', 'argon2id$mock$hash4', 'STUDENT', '11-S-24', '11', 'Science-A', 'CBSE', 'JEE_ADVANCED'),
('b0000000-0000-0000-0000-000000000002', 'Ananya Thakur', 'ananya.t@student.haps.ac.in', 'argon2id$mock$hash5', 'STUDENT', '11-S-25', '11', 'Science-A', 'HP_BOARD', 'NEET_UG'),
('b0000000-0000-0000-0000-000000000003', 'Rohit Negi', 'rohit.n@student.haps.ac.in', 'argon2id$mock$hash6', 'STUDENT', '11-S-26', '11', 'Science-A', 'CBSE', 'OLYMPIAD')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Rich LaTeX Questions
INSERT INTO questions (
    id, subtopic_id, created_by, curriculum_board, grade, question_type, bloom_level, difficulty,
    question_latex, options_latex, correct_answer_latex, solution_latex, socratic_hints, benchmark_time_seconds, is_ai_generated
) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    1,
    'a0000000-0000-0000-0000-000000000002',
    'JEE_MAIN',
    '11',
    'MCQ_SINGLE',
    'APPLICATION',
    'MEDIUM',
    'A solid uniform cylinder of mass $M$ and radius $R$ is free to rotate about its geometric axis. A light string is wound around its circumference and pulled with a constant tension $T$. Find the angular acceleration $\alpha$ of the cylinder.',
    '[
        {"key": "A", "latex": "$\\alpha = \\frac{T}{MR}$", "is_correct": false, "distractor_trap": "Treated the cylinder as a hollow thin cylindrical shell ($I=MR^2$)"},
        {"key": "B", "latex": "$\\alpha = \\frac{2T}{MR}$", "is_correct": true, "distractor_trap": null},
        {"key": "C", "latex": "$\\alpha = \\frac{T}{2MR}$", "is_correct": false, "distractor_trap": "Multiplied instead of dividing by moment of inertia constant"},
        {"key": "D", "latex": "$\\alpha = \\frac{4T}{MR}$", "is_correct": false, "distractor_trap": "Calculation error in radius factor"}
    ]'::JSONB,
    'B',
    'Torque about the central axis is $\tau = T \\cdot R$. The moment of inertia of a solid cylinder is $I = \\frac{1}{2} M R^2$. Using $\\tau = I \\alpha$, we have: $$T R = \\left(\\frac{1}{2} M R^2\\right) \\alpha \\implies \\alpha = \\frac{2T}{MR}$$',
    '["What is the formula for torque exerted by a tension force tangent to the perimeter?", "What is the moment of inertia $I$ of a solid cylinder about its central axis? Compare it with a hollow hoop.", "Apply Newton''s rotational second law $\\tau = I \\alpha$."]'::JSONB,
    90,
    TRUE
),
(
    'c0000000-0000-0000-0000-000000000002',
    3,
    'a0000000-0000-0000-0000-000000000002',
    'CBSE',
    '11',
    'NUMERICAL',
    'APPLICATION',
    'MEDIUM',
    'A variable force $F(x) = (3x^2 - 2x + 5)\\,\\text{N}$ acts on a particle of mass $m = 2\\,\\text{kg}$ moving along the $x$-axis. Calculate the net work done by this force in moving the particle from $x = 1\\,\\text{m}$ to $x = 3\\,\\text{m}$. Express your answer in Joules (J).',
    '[]'::JSONB,
    '28 J',
    'Work done by a 1D variable force is given by: $$W = \\int_{x_1}^{x_2} F(x)\\,dx = \\int_{1}^{3} (3x^2 - 2x + 5)\\,dx$$ Integrating term by term: $$W = \\left[ x^3 - x^2 + 5x \\right]_{1}^{3} = (27 - 9 + 15) - (1 - 1 + 5) = 33 - 5 = 28\\,\\text{J}$$',
    '["Recall that work done by a variable force is the definite integral of force with respect to position.", "Integrate $\\int 3x^2 dx$, $\\int 2x dx$, and $\\int 5 dx$ carefully.", "Evaluate $[F(3) - F(1)]$."]'::JSONB,
    120,
    FALSE
),
(
    'c0000000-0000-0000-0000-000000000003',
    4,
    'a0000000-0000-0000-0000-000000000002',
    'JEE_ADVANCED',
    '11',
    'MCQ_SINGLE',
    'ANALYZE',
    'HARD',
    'An oscillator of mass $m$ undergoes damped harmonic oscillations with damping coefficient $b$. If the mechanical energy of the oscillator decays to $\\frac{1}{e}$ of its initial value in time $t_0$, what is the value of $t_0$ in terms of $m$ and $b$?',
    '[
        {"key": "A", "latex": "$t_0 = \\frac{m}{b}$", "is_correct": true, "distractor_trap": null},
        {"key": "B", "latex": "$t_0 = \\frac{2m}{b}$", "is_correct": false, "distractor_trap": "Confused the decay time constant of amplitude with the decay time constant of total energy"},
        {"key": "C", "latex": "$t_0 = \\frac{m}{2b}$", "is_correct": false, "distractor_trap": "Inverted damping ratio factor"},
        {"key": "D", "latex": "$t_0 = \\frac{b}{m}$", "is_correct": false, "distractor_trap": "Dimensional analysis error; inverted units"}
    ]'::JSONB,
    'A',
    'The mechanical energy of a damped oscillator decays as $E(t) = E_0 e^{-\\frac{b}{m} t}$ (since amplitude $A(t) = A_0 e^{-\\frac{b}{2m} t}$ and $E \\propto A^2$). For $E(t_0) = E_0 e^{-1}$: $$e^{-\\frac{b}{m} t_0} = e^{-1} \\implies \\frac{b}{m} t_0 = 1 \\implies t_0 = \\frac{m}{b}$$',
    '["Write down the time-dependent formula for the amplitude of a damped oscillator.", "Remember that total mechanical energy is proportional to the square of amplitude: $E \\propto A^2$.", "Observe how squaring the exponential changes the exponent from $-b/(2m)$ to $-b/m$."]'::JSONB,
    180,
    TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Pilot Assessment
INSERT INTO assessments (
    id, title, description, teacher_id, curriculum_board, grade, section, total_marks, duration_minutes, learning_mode, is_published
) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'Class XI Science - Weekly Diagnostic Test #04',
    'Evaluation on Rotational Dynamics, Work-Energy, and Damped SHM for Class XI-Science Section A.',
    'a0000000-0000-0000-0000-000000000002',
    'CBSE / JEE Main',
    '11',
    'Science-A',
    30.00,
    45,
    'JEE_NEET',
    TRUE
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO assessment_questions (assessment_id, question_id, question_order, marks, negative_marks) VALUES
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, 4.00, -1.00),
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 2, 4.00, 0.00),
('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 3, 4.00, -1.00)
ON CONFLICT (assessment_id, question_id) DO NOTHING;

-- 7. Insert Real-Time Telemetry for Aryan Sharma
INSERT INTO student_question_telemetry (
    id, assessment_id, question_id, student_id, attempt_status, time_spent_seconds, hesitation_seconds, option_flips_count, hints_requested_count, selected_option, marks_awarded, telemetry_category
) VALUES
(
    'e0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'CORRECT',
    54,
    8,
    0,
    0,
    'B',
    4.00,
    'FAST_ACCURATE'
),
(
    'e0000000-0000-0000-0000-000000000002',
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'CORRECT',
    210,
    35,
    2,
    1,
    '28 J',
    4.00,
    'SLOW_ACCURATE'
),
(
    'e0000000-0000-0000-0000-000000000003',
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'INCORRECT',
    195,
    42,
    3,
    2,
    'B',
    -1.00,
    'SLOW_MISCONCEPTION'
)
ON CONFLICT (id) DO NOTHING;

-- 8. Insert Aggregated Concept Mastery for Aryan Sharma
INSERT INTO concept_mastery (
    id, student_id, subtopic_id, mastery_status, mastery_score, accuracy_percentage, total_attempts, average_time_spent_seconds
) VALUES
('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 1, 'MASTERED', 92.50, 95.00, 18, 52),
('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 3, 'NEEDS_RECAP', 68.00, 75.00, 12, 180),
('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 4, 'CRITICAL_WEAKNESS', 34.00, 30.00, 8, 220)
ON CONFLICT (student_id, subtopic_id) DO NOTHING;

-- 9. Insert Evaluated Handwritten Sheet Record
INSERT INTO handwritten_evaluations (
    id, assessment_id, student_id, question_id, sheet_image_url, ocr_transcription_latex, step_evaluations, total_marks_awarded, max_marks, error_type, ai_confidence_score, teacher_verified, teacher_comments
) VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    'Step 1: $W = \\int_{1}^{3} (3x^2 - 2x + 5) dx$\nStep 2: $[x^3 - x^2 + 5x]_{1}^{3}$\nStep 3: $(27 - 9 + 15) - (1 - 1 + 5) = 33 - 5 = 28\\text{ Joules}$',
    '[
        {"step": 1, "description": "Formulation of definite integral", "formula_latex": "W = \\int_{1}^{3} F(x) dx", "marks_awarded": 1.0, "max_marks": 1.0, "status": "CORRECT"},
        {"step": 2, "description": "Analytical antiderivative evaluation", "formula_latex": "[x^3 - x^2 + 5x]_{1}^{3}", "marks_awarded": 1.5, "max_marks": 1.5, "status": "CORRECT"},
        {"step": 3, "description": "Boundary substitution and arithmetic", "formula_latex": "33 - 5 = 28 \\text{ J}", "marks_awarded": 1.5, "max_marks": 1.5, "status": "CORRECT"}
    ]'::JSONB,
    4.00,
    4.00,
    'NONE',
    0.98,
    TRUE,
    'Neat step-by-step presentation. Correct units specified.'
)
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Sample Weekly Smart Report Card
INSERT INTO weekly_smart_reports (
    id, student_id, week_start_date, week_end_date, overall_score_percentage, total_study_hours, questions_attempted, average_velocity_seconds,
    mastered_concepts, recap_concepts, weak_concepts, school_hostel_actions, parent_actions
) VALUES
(
    '20000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    '2026-10-18',
    '2026-10-24',
    76.50,
    14.5,
    64,
    115,
    '[
        {"topic": "Rotational Motion", "subtopic": "Moment of Inertia", "accuracy": 92, "avg_time_sec": 52, "status": "MASTERED"}
    ]'::JSONB,
    '[
        {"topic": "Work-Energy", "subtopic": "Work-Energy Theorem", "accuracy": 75, "avg_time_sec": 180, "status": "NEEDS_RECAP", "insight": "Accurate on concepts, but takes 2.5x benchmark time due to algebra checks."}
    ]'::JSONB,
    '[
        {"topic": "Oscillations", "subtopic": "Damped & Forced Oscillations", "accuracy": 30, "avg_time_sec": 220, "status": "CRITICAL_WEAKNESS", "insight": "Confusing energy decay rate factor ($b/m$) with amplitude decay ($b/2m$)."}
    ]'::JSONB,
    '[
        {"directive": "Conduct a 15-minute 1-on-1 derivation during 7:30 PM residential evening prep on damped oscillation differential equations.", "responsible_faculty": "Er. Rajesh Kumar", "target_date": "2026-10-26"},
        {"directive": "Assign Remedial Drill #SHM-04 (5 targeted numericals focused on energy vs amplitude decay constants).", "responsible_faculty": "Physics Dept", "target_date": "2026-10-27"}
    ]'::JSONB,
    '[
        {"directive": "Ask Aryan to explain the difference between ''underdamped'' and ''critically damped'' car shock absorbers (Feynman technique) for 5 minutes during Sunday call.", "purpose": "Solidifies intuitive physical grasp without pressure."},
        {"directive": "Ensure 45 minutes of quiet time on Sunday morning for the short 5-question recap quiz.", "purpose": "Reinforces concept retention before Monday''s school lecture."}
    ]'::JSONB
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MULTI-TENANT DUAL-MODE SEED (2026-11-16)
-- Minimal school rows. The JSON profiles in src/registry/tenants/ are the source
-- of truth; scripts/sync_curriculum_content.js upserts full profiles and the
-- canonical curriculum_content rows from the subject banks.
-- ============================================================================
INSERT INTO schools (id, name, short_name, active_modes, default_mode, profile) VALUES
('sch_unisole_001', 'Unisole AI School (HIM Academy Public School, Hamirpur)', 'HAPS', ARRAY['BOARD','COMPETITIVE'], 'BOARD', '{"source": "src/registry/tenants/sch_unisole_001.json"}'::jsonb),
('sch_demo_board_only', 'Sample Tenant: Board-Only Day School', 'DEMO', ARRAY['BOARD'], 'BOARD', '{"source": "src/registry/tenants/sch_demo_board_only.json"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

