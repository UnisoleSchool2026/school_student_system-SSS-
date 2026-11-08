# Golden Set Evaluation Benchmark Harness

This benchmark evaluates the **Step-wise Answer Sheet Evaluation System** against authentic, human-teacher-verified answer scripts across Mathematics, Physics, and Chemistry.

## Purpose
Before trusting an AI vision model with student marks, we evaluate:
1. **$\pm 1$ Mark Agreement Rate:** Proportion of questions where AI grading matches within $\pm 1$ mark of experienced examiners (Target: $\ge 90\%$).
2. **Step-Level Rubric Agreement:** Precision on formula setup, algebraic substitution, and final units.
3. **Transcription Fidelity:** Character error rate on digits and algebraic symbols.
4. **Flag Rate:** Target $10\% - 15\%$ flagging for human teacher review.
5. **Cost & Latency:** Tracking token cost and turnaround speed per page.

---

## How to Run the Benchmark

```bash
cd backend
# 1. Run standard benchmark using default Gemini Flash Vision
node scripts/evaluate_golden_set.js

# 2. Run benchmark comparing escalation to Gemini Pro
VISION_MODEL_FLASH=gemini-1.5-pro node scripts/evaluate_golden_set.js

# 3. Run benchmark using Groq Vision
VISION_PROVIDER=GROQ node scripts/evaluate_golden_set.js
```

---

## Adding New Test Sheets to the Golden Set
Add new items to `backend/scripts/golden_set/golden_manifest.json`:

```json
{
  "id": "gold_math_04",
  "subject": "Mathematics",
  "topic": "Arithmetic Progressions",
  "question": "Find the sum of the first 20 terms of the AP: 3, 7, 11, ...",
  "maxMarks": 3,
  "teacherMarks": 3,
  "handwritingClarity": "Average",
  "studentWorkingText": "a = 3, d = 7 - 3 = 4\nS_n = (n/2)[2a + (n-1)d]\nS_20 = (20/2)[2(3) + 19(4)] = 10[6 + 76] = 10 * 82 = 820",
  "rubricSteps": [
    { "step": 1, "description": "Identify a = 3, d = 4", "marks": 0.5 },
    { "step": 2, "description": "Sum formula substitution", "marks": 1.5 },
    { "step": 3, "description": "Final sum S_20 = 820", "marks": 1.0 }
  ],
  "teacherStepScores": [0.5, 1.5, 1.0],
  "dominantMistake": "NONE"
}
```
