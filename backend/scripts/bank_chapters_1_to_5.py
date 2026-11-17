# -*- coding: utf-8 -*-
"""
Class 10 Mathematics Question Bank: Chapters 1 to 5 (PYQs + Core Questions)
Chapter 1: Real Numbers (1-25)
Chapter 2: Polynomials (26-45)
Chapter 3: Pair of Linear Equations (86-105)
Chapter 4: Quadratic Equations (46-70)
Chapter 5: Arithmetic Progressions (71-85)
"""

chapters_1_to_5 = [
    # --- CHAPTER 1: REAL NUMBERS ---
    {
        "id": "c10_m_pyq_001", "ch": 1, "topic": "Real Numbers", "subtopic": "Euclid's Division Algorithm",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "Common PYQ / Important",
        "q": r"Find the HCF of 135 and 225 using Euclid’s Division Algorithm.",
        "sol": r"By Euclid's division lemma: $225 = 135 \times 1 + 90$. Next, $135 = 90 \times 1 + 45$. Then $90 = 45 \times 2 + 0$. Since the remainder is 0, $\text{HCF}(135, 225) = 45$.",
        "ans": r"45"
    },
    {
        "id": "c10_m_pyq_002", "ch": 1, "topic": "Real Numbers", "subtopic": "Irrational Numbers",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "Common PYQ",
        "q": r"Show that $\sqrt{7}$ is irrational.",
        "sol": r"Assume $\sqrt{7} = \frac{a}{b}$ where $a, b \in \mathbb{Z}^+$ are coprime. $7b^2 = a^2 \implies 7 \mid a$. Let $a = 7c$, then $7b^2 = 49c^2 \implies b^2 = 7c^2 \implies 7 \mid b$. Thus $a$ and $b$ share a common factor 7, contradicting coprimality. Hence $\sqrt{7}$ is irrational.",
        "ans": r"Proof by contradiction"
    },
    {
        "id": "c10_m_pyq_003", "ch": 1, "topic": "Real Numbers", "subtopic": "Decimal Expansions",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "Important",
        "q": r"Determine whether $\frac{17}{1600}$ has a terminating decimal expansion.",
        "sol": r"Denominator $1600 = 2^6 \times 5^2$. Since the prime factorisation of the denominator is in the form $2^m \times 5^n$, $\frac{17}{1600}$ has a terminating decimal expansion.",
        "ans": r"Terminating decimal expansion"
    },
    {
        "id": "c10_m_pyq_004", "ch": 1, "topic": "Real Numbers", "subtopic": "HCF and LCM Relation",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "HOTS / Important",
        "q": r"Two numbers have HCF 18 and LCM 540. If one number is 90, find the other.",
        "sol": r"$\text{HCF} \times \text{LCM} = a \times b \implies 18 \times 540 = 90 \times b \implies b = \frac{18 \times 540}{90} = 108$.",
        "ans": r"108"
    },
    {
        "id": "c10_m_pyq_005", "ch": 1, "topic": "Real Numbers", "subtopic": "HCF and LCM",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "MEDIUM", "pyq": "2025 / Recent PYQ",
        "q": r"If $\text{HCF}(98, 28) = m$ and $\text{LCM}(98, 28) = n$, then the value of $n - 7m$ is:",
        "opts": [{"key": "A", "latex": "0", "is_correct": False}, {"key": "B", "latex": "28", "is_correct": False}, {"key": "C", "latex": "98", "is_correct": True}, {"key": "D", "latex": "198", "is_correct": False}],
        "sol": r"$98 = 2 \times 7^2$, $28 = 2^2 \times 7$. $m = \text{HCF} = 14$, $n = \text{LCM} = 196$. $n - 7m = 196 - 7(14) = 196 - 98 = 98$.",
        "ans": r"C"
    },
    {
        "id": "c10_m_pyq_006", "ch": 1, "topic": "Real Numbers", "subtopic": "Exponents & Integers",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "EASY", "pyq": "2025 PYQ",
        "q": r"If $(-1)^n + (-1)^8 = 0$, then $n$ is:",
        "opts": [{"key": "A", "latex": "any positive integer", "is_correct": False}, {"key": "B", "latex": "any negative integer", "is_correct": False}, {"key": "C", "latex": "any odd number", "is_correct": True}, {"key": "D", "latex": "any even number", "is_correct": False}],
        "sol": r"$(-1)^8 = 1$, so $(-1)^n + 1 = 0 \implies (-1)^n = -1 \implies n$ is an odd integer.",
        "ans": r"C"
    },
    {
        "id": "c10_m_pyq_007", "ch": 1, "topic": "Real Numbers", "subtopic": "Powers of Integers",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "MEDIUM", "pyq": "2025 PYQ",
        "q": r"Which of the following cannot be the unit digit of $8^n$, where $n$ is a natural number?",
        "opts": [{"key": "A", "latex": "4", "is_correct": False}, {"key": "B", "latex": "2", "is_correct": False}, {"key": "C", "latex": "0", "is_correct": True}, {"key": "D", "latex": "6", "is_correct": False}],
        "sol": r"Units digit cyclicity of $8^n$ is $8, 4, 2, 6$. It never ends in 0 because $8 = 2^3$ does not contain prime factor 5.",
        "ans": r"C"
    },
    {
        "id": "c10_m_pyq_008", "ch": 1, "topic": "Real Numbers", "subtopic": "Greatest Common Divisor with Remainder",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "MEDIUM", "pyq": "PYQ",
        "q": r"The greatest number which divides 70 and 125, leaving remainders 5 and 8 respectively, is:",
        "opts": [{"key": "A", "latex": "13", "is_correct": True}, {"key": "B", "latex": "65", "is_correct": False}, {"key": "C", "latex": "875", "is_correct": False}, {"key": "D", "latex": "1750", "is_correct": False}],
        "sol": r"$\text{HCF}(70 - 5, 125 - 8) = \text{HCF}(65, 117) = 13$.",
        "ans": r"A"
    },
    {
        "id": "c10_m_pyq_009", "ch": 1, "topic": "Real Numbers", "subtopic": "Irrationality Proof",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "Very common PYQ",
        "q": r"Prove that $\sqrt{5}$ is irrational.",
        "sol": r"Let $\sqrt{5} = a/b$ with coprime $a,b$. $5b^2 = a^2 \implies 5 \mid a$. Substituting $a=5c$, $5b^2 = 25c^2 \implies b^2 = 5c^2 \implies 5 \mid b$. Common factor 5 contradicts coprimality.",
        "ans": r"Proof by contradiction"
    },
    {
        "id": "c10_m_pyq_010", "ch": 1, "topic": "Real Numbers", "subtopic": "Irrationality Proof",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "Very common PYQ",
        "q": r"Prove that $\sqrt{3}$ is irrational.",
        "sol": r"Let $\sqrt{3} = p/q$. $3q^2 = p^2 \implies 3 \mid p$. Setting $p = 3k$, $3q^2 = 9k^2 \implies q^2 = 3k^2 \implies 3 \mid q$. Both $p$ and $q$ divisible by 3, contradiction.",
        "ans": r"Proof by contradiction"
    },
    {
        "id": "c10_m_pyq_011", "ch": 1, "topic": "Real Numbers", "subtopic": "LCM & Perfect Squares",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "HARD", "pyq": "PYQ",
        "q": r"The least number which is a perfect square and is divisible by each of 16, 20 and 50 is:",
        "opts": [{"key": "A", "latex": "1200", "is_correct": False}, {"key": "B", "latex": "100", "is_correct": False}, {"key": "C", "latex": "3600", "is_correct": True}, {"key": "D", "latex": "2400", "is_correct": False}],
        "sol": r"$\text{LCM}(16, 20, 50) = 400 = 20^2$. Among the given options, $3600 = 60^2$ is divisible by 400.",
        "ans": r"C"
    },
    {
        "id": "c10_m_pyq_012", "ch": 1, "topic": "Real Numbers", "subtopic": "Prime Factorisation",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "EASY", "pyq": "PYQ",
        "q": r"The sum of the exponents of the prime factors in the prime factorisation of 4004 is:",
        "opts": [{"key": "A", "latex": "5", "is_correct": True}, {"key": "B", "latex": "4", "is_correct": False}, {"key": "C", "latex": "3", "is_correct": False}, {"key": "D", "latex": "2", "is_correct": False}],
        "sol": r"$4004 = 2^2 \times 7^1 \times 11^1 \times 13^1$. Sum of exponents = $2 + 1 + 1 + 1 = 5$.",
        "ans": r"A"
    },
    {
        "id": "c10_m_pyq_013", "ch": 1, "topic": "Real Numbers", "subtopic": "Euclid's Algorithm",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "Older PYQ style",
        "q": r"Use Euclid’s division algorithm to find the HCF of 105 and 252.",
        "sol": r"$252 = 105 \times 2 + 42$; $105 = 42 \times 2 + 21$; $42 = 21 \times 2 + 0 \implies \text{HCF} = 21$.",
        "ans": r"21"
    },
    {
        "id": "c10_m_pyq_014", "ch": 1, "topic": "Real Numbers", "subtopic": "Euclid's Algorithm",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "Older PYQ",
        "q": r"Find the HCF of 196 and 38220 using Euclid’s algorithm.",
        "sol": r"$38220 = 196 \times 195 + 0 \implies \text{HCF} = 196$.",
        "ans": r"196"
    },
    {
        "id": "c10_m_pyq_015", "ch": 1, "topic": "Real Numbers", "subtopic": "Divisibility Proofs",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "Common proof-type",
        "q": r"Show that the product of three consecutive integers is divisible by 6.",
        "sol": r"For three consecutive integers $n(n+1)(n+2)$, at least one is divisible by 2 and one is divisible by 3. Since $\gcd(2,3)=1$, product is divisible by 6.",
        "ans": r"Divisible by 6"
    },
    {
        "id": "c10_m_pyq_016", "ch": 1, "topic": "Real Numbers", "subtopic": "Irrational Numbers",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "Common",
        "q": r"Prove that $2\sqrt{2}$ is irrational.",
        "sol": r"If $2\sqrt{2} = r \in \mathbb{Q}$, then $\sqrt{2} = r/2 \in \mathbb{Q}$, contradicting that $\sqrt{2}$ is irrational.",
        "ans": r"Proof by contradiction"
    },
    {
        "id": "c10_m_pyq_017", "ch": 1, "topic": "Real Numbers", "subtopic": "Euclid's Division Lemma",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "Classic",
        "q": r"Use Euclid’s division lemma to show that any positive integer is of the form $3q$, $3q+1$ or $3q+2$.",
        "sol": r"For any integer $a$ and divisor $b=3$, $a = 3q + r$ with $r \in \{0, 1, 2\}$, giving forms $3q, 3q+1, 3q+2$.",
        "ans": r"Forms: 3q, 3q+1, 3q+2"
    },
    {
        "id": "c10_m_pyq_018", "ch": 1, "topic": "Real Numbers", "subtopic": "HCF",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "PYQ style",
        "q": r"Find the HCF of 65 and 117.",
        "sol": r"$65 = 5 \times 13$, $117 = 9 \times 13 \implies \text{HCF} = 13$.",
        "ans": r"13"
    },
    {
        "id": "c10_m_pyq_019", "ch": 1, "topic": "Real Numbers", "subtopic": "Euclid's Algorithm",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "PYQ",
        "q": r"Find the HCF of 616 and 32 using Euclid’s algorithm.",
        "sol": r"$616 = 32 \times 19 + 8$; $32 = 8 \times 4 + 0 \implies \text{HCF} = 8$.",
        "ans": r"8"
    },
    {
        "id": "c10_m_pyq_020", "ch": 1, "topic": "Real Numbers", "subtopic": "Recurring Decimals",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "MEDIUM", "pyq": "PYQ",
        "q": r"Express $0.0\bar{9}$ as a rational number.",
        "sol": r"$x = 0.0999\dots \implies 100x - 10x = 9 \implies 90x = 9 \implies x = \frac{1}{10}$.",
        "ans": r"1/10"
    },
    {
        "id": "c10_m_pyq_021", "ch": 1, "topic": "Real Numbers", "subtopic": "Irrationality Proof",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "PYQ",
        "q": r"Prove that $\sqrt{2} + \sqrt{5}$ is irrational.",
        "sol": r"Let $\sqrt{2} + \sqrt{5} = r$. Squaring: $7 + 2\sqrt{10} = r^2 \implies \sqrt{10} = \frac{r^2 - 7}{2}$, which is rational, a contradiction.",
        "ans": r"Proof by contradiction"
    },
    {
        "id": "c10_m_pyq_022", "ch": 1, "topic": "Real Numbers", "subtopic": "HCF and LCM",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "PYQ",
        "q": r"Find the HCF and LCM of 650 and 1170 using prime factorisation.",
        "sol": r"$650 = 2 \times 5^2 \times 13$, $1170 = 2 \times 3^2 \times 5 \times 13$. $\text{HCF} = 130$, $\text{LCM} = 5850$.",
        "ans": r"HCF = 130, LCM = 5850"
    },
    {
        "id": "c10_m_pyq_023", "ch": 1, "topic": "Real Numbers", "subtopic": "Recurring Decimals",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "MEDIUM", "pyq": "PYQ",
        "q": r"Convert $7.0\bar{3}$ to a rational number.",
        "sol": r"$7.0\bar{3} = 7 + \frac{3}{90} = 7 + \frac{1}{30} = \frac{211}{30}$.",
        "ans": r"211/30"
    },
    {
        "id": "c10_m_pyq_024", "ch": 1, "topic": "Real Numbers", "subtopic": "Prime and Composite Numbers",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "EASY", "pyq": "2023 PYQ",
        "q": r"The ratio of HCF to LCM of the least composite number and the least prime number is:",
        "opts": [{"key": "A", "latex": "1:2", "is_correct": True}, {"key": "B", "latex": "2:1", "is_correct": False}, {"key": "C", "latex": "1:1", "is_correct": False}, {"key": "D", "latex": "1:3", "is_correct": False}],
        "sol": r"Least prime = 2, least composite = 4. $\text{HCF}(4,2) = 2, \text{LCM}(4,2) = 4$. Ratio $= 2:4 = 1:2$.",
        "ans": r"A"
    },
    {
        "id": "c10_m_pyq_025", "ch": 1, "topic": "Real Numbers", "subtopic": "LCM Calculation",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "EASY", "pyq": "PYQ",
        "q": r"If $\text{HCF}(39, 91) = 13$, then $\text{LCM}(39, 91)$ is:",
        "opts": [{"key": "A", "latex": "91", "is_correct": False}, {"key": "B", "latex": "273", "is_correct": True}, {"key": "C", "latex": "39", "is_correct": False}, {"key": "D", "latex": "3549", "is_correct": False}],
        "sol": r"$\text{LCM} = \frac{39 \times 91}{13} = 3 \times 91 = 273$.",
        "ans": r"B"
    },

    # --- CHAPTER 2: POLYNOMIALS (26-45) ---
    {
        "id": "c10_m_pyq_026", "ch": 2, "topic": "Polynomials", "subtopic": "Zeroes of Polynomial",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the zeroes of $x^2 - 9$.",
        "sol": r"$x^2 - 9 = (x - 3)(x + 3) = 0 \implies x = 3, -3$.",
        "ans": r"x = 3, -3"
    },
    {
        "id": "c10_m_pyq_027", "ch": 2, "topic": "Polynomials", "subtopic": "Relationship between Zeroes and Coefficients",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Verify the relationship between zeroes and coefficients of $x^2 - 8x + 15$.",
        "sol": r"$x^2 - 8x + 15 = (x - 3)(x - 5) \implies \text{zeroes are } \alpha = 3, \beta = 5$. Sum: $\alpha + \beta = 8 = -(-8)/1 = -b/a$. Product: $\alpha\beta = 15 = 15/1 = c/a$. Verified.",
        "ans": r"Verified"
    },
    {
        "id": "c10_m_pyq_028", "ch": 2, "topic": "Polynomials", "subtopic": "Forming Quadratic Polynomial",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Form a quadratic polynomial whose zeroes are 4 and −2.",
        "sol": r"Sum $S = 4 + (-2) = 2$, product $P = 4(-2) = -8$. Polynomial $p(x) = k(x^2 - Sx + P) = x^2 - 2x - 8$.",
        "ans": r"x^2 - 2x - 8"
    },
    {
        "id": "c10_m_pyq_029", "ch": 2, "topic": "Polynomials", "subtopic": "Finding Unknown in Polynomial",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If one zero of $3x^2 - 11x + k$ is 2, find $k$.",
        "sol": r"$p(2) = 3(2)^2 - 11(2) + k = 0 \implies 12 - 22 + k = 0 \implies k = 10$.",
        "ans": r"k = 10"
    },
    {
        "id": "c10_m_pyq_030", "ch": 2, "topic": "Polynomials", "subtopic": "Zeroes & Verification",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the zeroes of the quadratic polynomial $4x^2 - 4x - 15$ and verify the relationship between zeroes and coefficients.",
        "sol": r"$4x^2 - 4x - 15 = 4x^2 - 10x + 6x - 15 = 2x(2x - 5) + 3(2x - 5) = (2x - 5)(2x + 3) = 0 \implies x = 5/2, -3/2$. Sum: $5/2 - 3/2 = 1 = -(-4)/4 = -b/a$. Product: $(5/2)(-3/2) = -15/4 = c/a$. Verified.",
        "ans": r"x = 5/2, -3/2"
    },
    {
        "id": "c10_m_pyq_031", "ch": 2, "topic": "Polynomials", "subtopic": "Sum of Zeroes",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If the sum of the zeroes of the quadratic polynomial $3x^2 - kx + 6$ is 3, find the value of $k$.",
        "sol": r"Sum of zeroes $= -(-k)/3 = k/3 = 3 \implies k = 9$.",
        "ans": r"k = 9"
    },
    {
        "id": "c10_m_pyq_032", "ch": 2, "topic": "Polynomials", "subtopic": "Symmetric Functions of Zeroes",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If $\alpha$ and $\beta$ are the zeroes of the polynomial $ax^2 + bx + c$, find the value of $\alpha^2 + \beta^2$.",
        "sol": r"$\alpha + \beta = -b/a$, $\alpha\beta = c/a$. $\alpha^2 + \beta^2 = (\alpha + \beta)^2 - 2\alpha\beta = \frac{b^2}{a^2} - \frac{2c}{a} = \frac{b^2 - 2ac}{a^2}$.",
        "ans": r"\frac{b^2 - 2ac}{a^2}"
    },
    {
        "id": "c10_m_pyq_033", "ch": 2, "topic": "Polynomials", "subtopic": "Sum of Zeroes",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If the sum of the zeroes of the polynomial $p(x) = (k^2 - 14)x^2 - 2x - 12$ is 1, find the value of $k$.",
        "sol": r"Sum $= \frac{-(-2)}{k^2 - 14} = \frac{2}{k^2 - 14} = 1 \implies k^2 - 14 = 2 \implies k^2 = 16 \implies k = \pm 4$.",
        "ans": r"k = \pm 4"
    },
    {
        "id": "c10_m_pyq_034", "ch": 2, "topic": "Polynomials", "subtopic": "Reciprocal Zeroes Condition",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the condition that the zeroes of the polynomial $p(x) = ax^2 + bx + c$ are reciprocal of each other.",
        "sol": r"If zeroes are $\alpha$ and $1/\alpha$, product of zeroes $\alpha \cdot \frac{1}{\alpha} = 1 = c/a \implies c = a$.",
        "ans": r"c = a"
    },
    {
        "id": "c10_m_pyq_035", "ch": 2, "topic": "Polynomials", "subtopic": "Cubic Polynomial Zeroes",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Verify whether 2, 3 and $\frac{1}{2}$ are the zeroes of the polynomial $p(x) = 2x^3 - 11x^2 + 17x - 6$.",
        "sol": r"$p(2) = 2(8) - 11(4) + 17(2) - 6 = 16 - 44 + 34 - 6 = 0$. $p(3) = 2(27) - 11(9) + 17(3) - 6 = 54 - 99 + 51 - 6 = 0$. $p(1/2) = 2(1/8) - 11(1/4) + 17(1/2) - 6 = 1/4 - 11/4 + 34/4 - 24/4 = 0$. All are zeroes.",
        "ans": r"Verified"
    },
    {
        "id": "c10_m_pyq_036", "ch": 2, "topic": "Polynomials", "subtopic": "Irrational Zeroes",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Zeroes of the polynomial $p(x) = x^2 - 3\sqrt{2}x + 4$ are:",
        "opts": [{"key": "A", "latex": "2, \\sqrt{2}", "is_correct": False}, {"key": "B", "latex": "2\\sqrt{2}, \\sqrt{2}", "is_correct": True}, {"key": "C", "latex": "4\\sqrt{2}, -\\sqrt{2}", "is_correct": False}, {"key": "D", "latex": "\\sqrt{2}, 2", "is_correct": False}],
        "sol": r"$x^2 - 2\sqrt{2}x - \sqrt{2}x + 4 = x(x - 2\sqrt{2}) - \sqrt{2}(x - 2\sqrt{2}) = (x - 2\sqrt{2})(x - \sqrt{2}) = 0 \implies x = 2\sqrt{2}, \sqrt{2}$.",
        "ans": r"B"
    },
    {
        "id": "c10_m_pyq_037", "ch": 2, "topic": "Polynomials", "subtopic": "Zeroes Expression",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $\alpha$ and $\beta$ are the zeroes of the polynomial $p(x) = x^2 - ax - b$, then the value of $(\alpha + \beta + \alpha\beta)$ is equal to:",
        "opts": [{"key": "A", "latex": "a + b", "is_correct": False}, {"key": "B", "latex": "-a - b", "is_correct": False}, {"key": "C", "latex": "a - b", "is_correct": True}, {"key": "D", "latex": "-a + b", "is_correct": False}],
        "sol": r"$\alpha + \beta = -(-a)/1 = a$, $\alpha\beta = -b/1 = -b$. Value $= a + (-b) = a - b$.",
        "ans": r"C"
    },
    {
        "id": "c10_m_pyq_038", "ch": 2, "topic": "Polynomials", "subtopic": "Zeroes Equated",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If $\alpha$ and $\beta$ are zeroes of $p(x) = kx^2 - 30x + 45k$ and $\alpha + \beta = \alpha\beta$, then the value of $k$ is:",
        "opts": [{"key": "A", "latex": "\\frac{2}{3}", "is_correct": True}, {"key": "B", "latex": "\\frac{3}{2}", "is_correct": False}, {"key": "C", "latex": "-\\frac{2}{3}", "is_correct": False}, {"key": "D", "latex": "1", "is_correct": False}],
        "sol": r"$\alpha + \beta = 30/k$, $\alpha\beta = 45k/k = 45$. $30/k = 45 \implies k = 30/45 = 2/3$.",
        "ans": r"A"
    },
    {
        "id": "c10_m_pyq_039", "ch": 2, "topic": "Polynomials", "subtopic": "Forming Polynomial",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Write a quadratic polynomial, the sum of whose zeroes is 2 and product is −8.",
        "sol": r"$p(x) = x^2 - Sx + P = x^2 - 2x - 8$.",
        "ans": r"x^2 - 2x - 8"
    },
    {
        "id": "c10_m_pyq_040", "ch": 2, "topic": "Polynomials", "subtopic": "Polynomial & Zeroes",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find a quadratic polynomial whose sum and product of zeroes are −1 and −20 respectively. Also find the zeroes of the polynomial so obtained.",
        "sol": r"$p(x) = x^2 - (-1)x + (-20) = x^2 + x - 20 = (x + 5)(x - 4) = 0 \implies x = -5, 4$.",
        "ans": r"p(x) = x^2 + x - 20; zeroes: -5, 4"
    },
    {
        "id": "c10_m_pyq_041", "ch": 2, "topic": "Polynomials", "subtopic": "Multiple of Zero",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If one zero of the polynomial $p(x) = ax^2 - 8x + 3$ is 3 times the other, find the value of $a$.",
        "sol": r"Let zeroes be $\alpha$ and $3\alpha$. $\alpha + 3\alpha = 4\alpha = 8/a \implies \alpha = 2/a$. Product $\alpha(3\alpha) = 3\alpha^2 = 3/a \implies \alpha^2 = 1/a$. $(2/a)^2 = 1/a \implies 4/a^2 = 1/a \implies a = 4$.",
        "ans": r"a = 4"
    },
    {
        "id": "c10_m_pyq_042", "ch": 2, "topic": "Polynomials", "subtopic": "Distance Between Zeroes",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the distance between the zeroes of the polynomial $f(x) = 2x^2 - x - 6$.",
        "sol": r"$2x^2 - x - 6 = (2x + 3)(x - 2) = 0 \implies x = -3/2, 2$. Distance $= |2 - (-3/2)| = 2 + 1.5 = 3.5 = 7/2$.",
        "ans": r"7/2"
    },
    {
        "id": "c10_m_pyq_043", "ch": 2, "topic": "Polynomials", "subtopic": "Evaluating Symmetric Expression",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"$p$ and $q$ are zeroes of the polynomial $2x^2 + 5x - 4$. Without finding the actual values of $p$ and $q$, evaluate $(1-p)(1-q)$.",
        "sol": r"$(1-p)(1-q) = 1 - (p+q) + pq$. $p+q = -5/2$, $pq = -4/2 = -2$. Value $= 1 - (-5/2) + (-2) = 1 + 2.5 - 2 = 1.5 = 3/2$.",
        "ans": r"3/2"
    },
    {
        "id": "c10_m_pyq_044", "ch": 2, "topic": "Polynomials", "subtopic": "Cubic Polynomial Zeroes",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"The sum of two zeroes of $q(x) = x^3 - 2x^2 - 9x + k$ is zero. Find the zeroes of $q(x)$ and the value of $k$.",
        "sol": r"Let zeroes be $\alpha, -\alpha, \gamma$. Sum of zeroes $\alpha - \alpha + \gamma = 2 \implies \gamma = 2$. Sum of pairwise products $-\alpha^2 + \alpha\gamma - \alpha\gamma = -\alpha^2 = -9 \implies \alpha = 3$. Product $\alpha(-\alpha)\gamma = -(9)(2) = -18 = -k \implies k = 18$. Zeroes are $3, -3, 2$.",
        "ans": r"Zeroes: 3, -3, 2; k = 18"
    },
    {
        "id": "c10_m_pyq_045", "ch": 2, "topic": "Polynomials", "subtopic": "Factor Theorem",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the value of $k$ such that $x-2$ is a factor of $x^3 + kx^2 - 5x + 6$.",
        "sol": r"$p(2) = 2^3 + k(2^2) - 5(2) + 6 = 8 + 4k - 10 + 6 = 4k + 4 = 0 \implies k = -1$.",
        "ans": r"k = -1"
    },

    # --- CHAPTER 4: QUADRATIC EQUATIONS (46-70) ---
    {
        "id": "c10_m_pyq_046", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Solving Quadratic Equations",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Solve $x^2 - 16 = 0$.",
        "sol": r"$x^2 = 16 \implies x = \pm 4$.",
        "ans": r"x = \pm 4"
    },
    {
        "id": "c10_m_pyq_047", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Factorisation Method",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Solve $x^2 - 7x + 12 = 0$.",
        "sol": r"$(x - 3)(x - 4) = 0 \implies x = 3, 4$.",
        "ans": r"x = 3, 4"
    },
    {
        "id": "c10_m_pyq_048", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Discriminant & Nature of Roots",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the discriminant of $2x^2 + x - 6 = 0$ and comment on the nature of roots.",
        "sol": r"$D = b^2 - 4ac = 1^2 - 4(2)(-6) = 1 + 48 = 49 > 0$. Since $D > 0$ and is a perfect square, roots are real, rational, and distinct.",
        "ans": r"D = 49; Real, rational and distinct roots"
    },
    {
        "id": "c10_m_pyq_049", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Word Problem (Geometry)",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The area of a rectangle is 120 m² and its length exceeds its breadth by 4 m. Find its dimensions.",
        "sol": r"Let breadth $= x$, length $= x + 4$. Area $= x(x + 4) = 120 \implies x^2 + 4x - 120 = 0 \implies (x + 14)(x - 10) = 0 \implies x = 10$. Breadth $= 10\text{ m}$, length $= 14\text{ m}$.",
        "ans": r"Length = 14 m, Breadth = 10 m"
    },
    {
        "id": "c10_m_pyq_050", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Nature of Roots",
        "format": "MCQ_SINGLE", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The quadratic equation $x^2 - 4x + k = 0$ has distinct real roots if:",
        "opts": [{"key": "A", "latex": "k = 4", "is_correct": False}, {"key": "B", "latex": "k > 4", "is_correct": False}, {"key": "C", "latex": "k = 16", "is_correct": False}, {"key": "D", "latex": "k < 4", "is_correct": True}],
        "sol": r"$D = (-4)^2 - 4(1)(k) = 16 - 4k > 0 \implies 4k < 16 \implies k < 4$.",
        "ans": r"D"
    },
    {
        "id": "c10_m_pyq_051", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Discriminant Calculation",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Write the discriminant of the quadratic equation $(x+5)^2 = 2(5x-3)$.",
        "sol": r"$x^2 + 10x + 25 = 10x - 6 \implies x^2 + 31 = 0$. $a = 1, b = 0, c = 31 \implies D = 0^2 - 4(1)(31) = -124$.",
        "ans": r"D = -124"
    },
    {
        "id": "c10_m_pyq_052", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Nature of Roots",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If $b=0$, $c<0$ in the quadratic equation $x^2 + bx + c = 0$, what is the nature of the roots?",
        "sol": r"$x^2 + c = 0 \implies x^2 = -c$. Since $c < 0$, $-c > 0 \implies x = \pm\sqrt{-c}$, so roots are real, equal in magnitude and opposite in sign.",
        "ans": r"Real, equal in magnitude and opposite in sign"
    },
    {
        "id": "c10_m_pyq_053", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Root Substitution",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $x=3$ is one root of the quadratic equation $x^2 - 2kx - 6 = 0$, find the value of $k$.",
        "sol": r"$3^2 - 2k(3) - 6 = 0 \implies 9 - 6k - 6 = 0 \implies 3 = 6k \implies k = 1/2$.",
        "ans": r"k = 1/2"
    },
    {
        "id": "c10_m_pyq_054", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Factorisation",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Solve for $x$: $6x^2 + 11x + 3 = 0$.",
        "sol": r"$6x^2 + 9x + 2x + 3 = 3x(2x + 3) + 1(2x + 3) = (2x + 3)(3x + 1) = 0 \implies x = -3/2, -1/3$.",
        "ans": r"x = -3/2, -1/3"
    },
    {
        "id": "c10_m_pyq_055", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Completing Square",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Using completing the square method, show that the equation $x^2 - 8x + 18 = 0$ has no real solution.",
        "sol": r"$x^2 - 8x + 16 - 16 + 18 = 0 \implies (x - 4)^2 + 2 = 0 \implies (x - 4)^2 = -2$. A square cannot be negative for any real $x$, hence no real solution.",
        "ans": r"No real solution"
    },
    {
        "id": "c10_m_pyq_056", "ch": 4, "topic": "Quadratic Equations", "subtopic": "No Real Roots Condition",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"In the quadratic equation $kx^2 - 6x - 1 = 0$, determine the values of $k$ for which the equation does not have any real root.",
        "sol": r"$D = (-6)^2 - 4(k)(-1) = 36 + 4k < 0 \implies 4k < -36 \implies k < -9$.",
        "ans": r"k < -9"
    },
    {
        "id": "c10_m_pyq_057", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Two Quadratic System",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"If −5 is a root of the quadratic equation $2x^2 + px - 15 = 0$ and the quadratic equation $p(x^2 + x) + k = 0$ has equal roots, find the value of $k$.",
        "sol": r"Substitute $x = -5$ in $2x^2 + px - 15 = 0$: $2(25) - 5p - 15 = 0 \implies 35 = 5p \implies p = 7$. Second equation is $7x^2 + 7x + k = 0$. Equal roots $\implies D = 7^2 - 4(7)(k) = 0 \implies 49 - 28k = 0 \implies k = 49/28 = 7/4$.",
        "ans": r"k = 7/4"
    },
    {
        "id": "c10_m_pyq_058", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Root Finding",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If −5 is a root of the quadratic equation $2x^2 + px - 15 = 0$, find the value of $p$.",
        "sol": r"$2(-5)^2 + p(-5) - 15 = 0 \implies 50 - 5p - 15 = 0 \implies 35 = 5p \implies p = 7$.",
        "ans": r"p = 7"
    },
    {
        "id": "c10_m_pyq_059", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Algebraic Fraction Solving",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE High Frequency",
        "q": r"Solve for $x$: $\frac{1}{a+b+x} = \frac{1}{a} + \frac{1}{b} + \frac{1}{x}$ ($a\ne 0, b\ne 0, x\ne 0, a+b+x\ne 0$).",
        "sol": r"$\frac{1}{a+b+x} - \frac{1}{x} = \frac{1}{a} + \frac{1}{b} \implies \frac{x - (a+b+x)}{x(a+b+x)} = \frac{a+b}{ab} \implies \frac{-(a+b)}{x(a+b+x)} = \frac{a+b}{ab}$. Dividing by $(a+b)$: $-ab = x^2 + (a+b)x \implies x^2 + (a+b)x + ab = 0 \implies (x+a)(x+b) = 0 \implies x = -a, -b$.",
        "ans": r"x = -a, -b"
    },
    {
        "id": "c10_m_pyq_060", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Fraction Decomposition",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"Solve for $x$: $\frac{1}{(x-1)(x-2)} + \frac{1}{(x-2)(x-3)} = \frac{2}{3}$ ($x \ne 1, 2, 3$).",
        "sol": r"$\frac{1}{x-2}\left[\frac{1}{x-1} + \frac{1}{x-3}\right] = \frac{1}{x-2}\left[\frac{x-3+x-1}{(x-1)(x-3)}\right] = \frac{1}{x-2}\left[\frac{2(x-2)}{(x-1)(x-3)}\right] = \frac{2}{(x-1)(x-3)} = \frac{2}{3} \implies (x-1)(x-3) = 3 \implies x^2 - 4x = 0 \implies x(x-4) = 0$. Since $x \ne 0$ restriction not given, $x = 0$ or $x = 4$.",
        "ans": r"x = 0, 4"
    },
    {
        "id": "c10_m_pyq_061", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Pythagoras Word Problem",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The altitude of a right triangle is 7 cm less than its base. If the hypotenuse is 13 cm, find the other two sides.",
        "sol": r"Let base $= x$, altitude $= x - 7$. $x^2 + (x - 7)^2 = 13^2 \implies 2x^2 - 14x + 49 = 169 \implies 2x^2 - 14x - 120 = 0 \implies x^2 - 7x - 60 = 0 \implies (x - 12)(x + 5) = 0 \implies x = 12$. Base $= 12\text{ cm}$, altitude $= 5\text{ cm}$.",
        "ans": r"Base = 12 cm, Altitude = 5 cm"
    },
    {
        "id": "c10_m_pyq_062", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Equal Roots",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"For what value of $a$ does the quadratic equation $9x^2 - 3ax + 1 = 0$ have equal roots?",
        "sol": r"$D = (-3a)^2 - 4(9)(1) = 9a^2 - 36 = 0 \implies a^2 = 4 \implies a = \pm 2$.",
        "ans": r"a = \pm 2"
    },
    {
        "id": "c10_m_pyq_063", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Real Roots",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"For what values of $k$ are the roots of the equation $x^2 + 4x + k = 0$ real?",
        "sol": r"$D = 4^2 - 4(1)(k) = 16 - 4k \ge 0 \implies 4k \le 16 \implies k \le 4$.",
        "ans": r"k \le 4"
    },
    {
        "id": "c10_m_pyq_064", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Surd Factorisation",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the roots of $\sqrt{2}x^2 + 7x + 5\sqrt{2} = 0$ by factorisation.",
        "sol": r"Product $= \sqrt{2} \times 5\sqrt{2} = 10$. Sum $= 7 \implies 5, 2$. $\sqrt{2}x^2 + 2x + 5x + 5\sqrt{2} = \sqrt{2}x(x + \sqrt{2}) + 5(x + \sqrt{2}) = (\sqrt{2}x + 5)(x + \sqrt{2}) = 0 \implies x = -\sqrt{2}, -\frac{5}{\sqrt{2}}$.",
        "ans": r"x = -\sqrt{2}, -\frac{5\sqrt{2}}{2}"
    },
    {
        "id": "c10_m_pyq_065", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Equal Roots",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the value of $p$ so that the quadratic equation $px(x-3) + 9 = 0$ has two equal roots.",
        "sol": r"$px^2 - 3px + 9 = 0$. $D = (-3p)^2 - 4(p)(9) = 9p^2 - 36p = 9p(p - 4) = 0$. Since $p \ne 0$ for a quadratic, $p = 4$.",
        "ans": r"p = 4"
    },
    {
        "id": "c10_m_pyq_066", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Speed, Distance, Time",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE High Frequency",
        "q": r"A train travels a distance of 480 km at a uniform speed. If the speed had been 8 km/h less, it would have taken 3 hours more to cover the same distance. Find the speed of the train.",
        "sol": r"Let speed $= x\text{ km/h}$. $\frac{480}{x-8} - \frac{480}{x} = 3 \implies 480\left[\frac{x - x + 8}{x(x-8)}\right] = 3 \implies \frac{480 \times 8}{x^2 - 8x} = 3 \implies x^2 - 8x - 1280 = 0 \implies (x - 40)(x + 32) = 0 \implies x = 40\text{ km/h}$.",
        "ans": r"40 km/h"
    },
    {
        "id": "c10_m_pyq_067", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Number Problem",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The difference of the squares of two positive numbers is 180. The square of the smaller number is 8 times the greater number. Find the two numbers.",
        "sol": r"Let greater number $= x$. Smaller squared $= 8x$. $x^2 - 8x = 180 \implies x^2 - 8x - 180 = 0 \implies (x - 18)(x + 10) = 0 \implies x = 18$. Smaller squared $= 8(18) = 144 \implies \text{smaller} = 12$. Numbers are 18 and 12.",
        "ans": r"18 and 12"
    },
    {
        "id": "c10_m_pyq_068", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Equal Roots",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the value(s) of $k$ for which the equation $2x^2 + kx + 3 = 0$ has real and equal roots.",
        "sol": r"$D = k^2 - 4(2)(3) = k^2 - 24 = 0 \implies k = \pm 2\sqrt{6}$.",
        "ans": r"k = \pm 2\sqrt{6}"
    },
    {
        "id": "c10_m_pyq_069", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Aviation Speed Problem",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE HOTS",
        "q": r"In a flight of 2800 km, an aircraft was slowed down due to bad weather. Its average speed is reduced by 100 km/h and the time of flight is increased by 30 minutes. Find the original duration of the flight.",
        "sol": r"Let original speed $= x\text{ km/h}$. $\frac{2800}{x-100} - \frac{2800}{x} = \frac{1}{2} \implies 2800(100) \times 2 = x^2 - 100x \implies x^2 - 100x - 560000 = 0 \implies (x - 800)(x + 700) = 0 \implies x = 800\text{ km/h}$. Original time $= \frac{2800}{800} = 3.5\text{ hours} = 3\text{ hrs } 30\text{ mins}$.",
        "ans": r"3.5 hours"
    },
    {
        "id": "c10_m_pyq_070", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Reciprocal Sum",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The sum of two numbers is 15. If the sum of their reciprocals is $\frac{3}{10}$, find the two numbers.",
        "sol": r"Let numbers be $x$ and $15 - x$. $\frac{1}{x} + \frac{1}{15-x} = \frac{3}{10} \implies \frac{15}{x(15-x)} = \frac{3}{10} \implies \frac{5}{15x - x^2} = \frac{1}{10} \implies 15x - x^2 = 50 \implies x^2 - 15x + 50 = 0 \implies (x-10)(x-5) = 0$. Numbers are 10 and 5.",
        "ans": r"10 and 5"
    },

    # --- CHAPTER 5: ARITHMETIC PROGRESSIONS (71-85) ---
    {
        "id": "c10_m_pyq_071", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "nth Term",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the 15th term of the AP: 3, 7, 11, 15, …",
        "sol": r"$a = 3, d = 4$. $a_{15} = a + 14d = 3 + 14(4) = 3 + 56 = 59$.",
        "ans": r"59"
    },
    {
        "id": "c10_m_pyq_072", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Sum of Natural Numbers",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the sum of the first 20 natural numbers.",
        "sol": r"$S_{20} = \frac{20(21)}{2} = 210$.",
        "ans": r"210"
    },
    {
        "id": "c10_m_pyq_073", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Common Difference",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Determine the common difference of the AP: 11, 8, 5, 2, …",
        "sol": r"$d = 8 - 11 = -3$.",
        "ans": r"-3"
    },
    {
        "id": "c10_m_pyq_074", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "nth Term from Sn",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The sum of the first $n$ terms of an AP is $3n^2 + 2n$. Find its $n$th term.",
        "sol": r"$a_n = S_n - S_{n-1} = (3n^2 + 2n) - [3(n-1)^2 + 2(n-1)] = 3n^2 + 2n - [3(n^2 - 2n + 1) + 2n - 2] = 3n^2 + 2n - [3n^2 - 4n + 1] = 6n - 1$.",
        "ans": r"a_n = 6n - 1"
    },
    {
        "id": "c10_m_pyq_075", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "nth Term",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the 10th term of the AP: 2, 7, 12, …",
        "sol": r"$a = 2, d = 5$. $a_{10} = 2 + 9(5) = 47$.",
        "ans": r"47"
    },
    {
        "id": "c10_m_pyq_076", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Finding Number of Terms",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Which term of the AP 3, 8, 13, 18, … is 78?",
        "sol": r"$a = 3, d = 5$. $a_n = 3 + (n-1)5 = 78 \implies 5(n-1) = 75 \implies n-1 = 15 \implies n = 16$.",
        "ans": r"16th term"
    },
    {
        "id": "c10_m_pyq_077", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Sum of Terms",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the sum of the first 22 terms of the AP: 8, 3, −2, …",
        "sol": r"$a = 8, d = -5$. $S_{22} = \frac{22}{2}[2(8) + 21(-5)] = 11[16 - 105] = 11(-89) = -979$.",
        "ans": r"-979"
    },
    {
        "id": "c10_m_pyq_078", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "AP Parameters",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The first term of an AP is 5, the last term is 45 and the sum is 400. Find the number of terms and the common difference.",
        "sol": r"$S_n = \frac{n}{2}(a + l) \implies 400 = \frac{n}{2}(5 + 45) = 25n \implies n = 16$. $l = a + 15d \implies 45 = 5 + 15d \implies 15d = 40 \implies d = 8/3$.",
        "ans": r"n = 16, d = 8/3"
    },
    {
        "id": "c10_m_pyq_079", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Sum Equated",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"How many terms of the AP 9, 17, 25, … must be taken so that their sum is 636?",
        "sol": r"$a = 9, d = 8$. $S_n = \frac{n}{2}[18 + (n-1)8] = n(9 + 4n - 4) = n(4n + 5) = 636 \implies 4n^2 + 5n - 636 = 0 \implies (n - 12)(4n + 53) = 0 \implies n = 12$.",
        "ans": r"n = 12"
    },
    {
        "id": "c10_m_pyq_080", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Two Terms Given",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The 4th term of an AP is 22 and the 15th term is 66. Find the first term and the common difference.",
        "sol": r"$a + 3d = 22$, $a + 14d = 66$. Subtracting: $11d = 44 \implies d = 4$. $a = 22 - 3(4) = 10$.",
        "ans": r"a = 10, d = 4"
    },
    {
        "id": "c10_m_pyq_081", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Divisibility Sum",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the sum of all three-digit numbers which are divisible by 7.",
        "sol": r"First is 105, last is 994. $105 + (n-1)7 = 994 \implies 7(n-1) = 889 \implies n-1 = 127 \implies n = 128$. $S_{128} = \frac{128}{2}(105 + 994) = 64(1099) = 70336$.",
        "ans": r"70336"
    },
    {
        "id": "c10_m_pyq_082", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "nth Term from Sn",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If the sum of the first $n$ terms of an AP is $\frac{n}{2}(3n+1)$, find the 20th term.",
        "sol": r"$a_{20} = S_{20} - S_{19} = \frac{20}{2}(61) - \frac{19}{2}(58) = 10(61) - 19(29) = 610 - 551 = 59$.",
        "ans": r"59"
    },
    {
        "id": "c10_m_pyq_083", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Successive Sums",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"The sum of the first 7 terms of an AP is 63 and the sum of the next 7 terms is 161. Find the 28th term.",
        "sol": r"$S_7 = 63 \implies \frac{7}{2}(2a + 6d) = 63 \implies 2a + 6d = 18 \implies a + 3d = 9$. Sum of first 14 terms $S_{14} = 63 + 161 = 224 \implies \frac{14}{2}(2a + 13d) = 224 \implies 2a + 13d = 32$. Subtracting $2(a+3d=9)$: $7d = 14 \implies d = 2, a = 3$. $a_{28} = a + 27d = 3 + 27(2) = 57$.",
        "ans": r"57"
    },
    {
        "id": "c10_m_pyq_084", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Middle Term",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the middle term of the AP 213, 205, 197, …, 37.",
        "sol": r"$a = 213, d = -8, l = 37$. $213 + (n-1)(-8) = 37 \implies 8(n-1) = 176 \implies n = 23$. Middle term is $\frac{23+1}{2} = 12\text{th}$ term. $a_{12} = 213 + 11(-8) = 213 - 88 = 125$.",
        "ans": r"125"
    },
    {
        "id": "c10_m_pyq_085", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Multiple of Terms Proof",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If 7 times the 7th term of an AP is equal to 11 times its 11th term, show that the 18th term of the AP is zero.",
        "sol": r"$7(a + 6d) = 11(a + 10d) \implies 7a + 42d = 11a + 110d \implies 4a + 68d = 0 \implies 4(a + 17d) = 0 \implies a_{18} = 0$.",
        "ans": r"a_{18} = 0"
    },

    # --- CHAPTER 3: PAIR OF LINEAR EQUATIONS (86-105) ---
    {
        "id": "c10_m_pyq_086", "ch": 3, "topic": "Linear Equations", "subtopic": "Direct Elimination",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Solve: $x+y=7$ and $x-y=3$.",
        "sol": r"Adding both: $2x = 10 \implies x = 5$. Then $y = 7 - 5 = 2$.",
        "ans": r"x = 5, y = 2"
    },
    {
        "id": "c10_m_pyq_087", "ch": 3, "topic": "Linear Equations", "subtopic": "Elimination",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Solve: $2x+3y=13$ and $x-y=1$.",
        "sol": r"From second: $x = y + 1$. $2(y+1) + 3y = 13 \implies 5y = 11 \dots$ wait: $2x + 3y = 13, 2x - 2y = 2 \implies 5y = 11 \implies y = 11/5, x = 16/5$.",
        "ans": r"x = 16/5, y = 11/5"
    },
    {
        "id": "c10_m_pyq_088", "ch": 3, "topic": "Linear Equations", "subtopic": "Consistency & Nature of Solutions",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Determine the nature of the solutions of $2x+3y=5$ and $4x+6y=10$.",
        "sol": r"$\frac{a_1}{a_2} = \frac{2}{4} = \frac{1}{2}$, $\frac{b_1}{b_2} = \frac{3}{6} = \frac{1}{2}$, $\frac{c_1}{c_2} = \frac{5}{10} = \frac{1}{2}$. Lines are coincident; infinitely many solutions.",
        "ans": r"Infinitely many solutions (Consistent)"
    },
    {
        "id": "c10_m_pyq_089", "ch": 3, "topic": "Linear Equations", "subtopic": "Word Problem",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A notebook costs ₹20 and a pen costs ₹10. A student buys 8 items for ₹110. Find the number of notebooks and pens.",
        "sol": r"Let $x$ notebooks, $y$ pens. $x + y = 8$, $20x + 10y = 110 \implies 2x + y = 11$. Subtracting: $x = 3$. Then $y = 5$.",
        "ans": r"3 notebooks, 5 pens"
    },
    {
        "id": "c10_m_pyq_090", "ch": 3, "topic": "Linear Equations", "subtopic": "Substitution Method",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Solve the following pair of linear equations by the substitution method: $x+y=14$, $x-y=4$.",
        "sol": r"$x = y + 4 \implies (y+4) + y = 14 \implies 2y = 10 \implies y = 5, x = 9$.",
        "ans": r"x = 9, y = 5"
    },
    {
        "id": "c10_m_pyq_091", "ch": 3, "topic": "Linear Equations", "subtopic": "Elimination Method",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Solve: $3x-5y=4$ and $9x-2y=7$ by elimination method.",
        "sol": r"Multiply first by 3: $9x - 15y = 12$. Subtract from second: $(9x - 2y) - (9x - 15y) = 7 - 12 \implies 13y = -5 \implies y = -5/13$. $3x = 4 + 5(-5/13) = 27/13 \implies x = 9/13$.",
        "ans": r"x = 9/13, y = -5/13"
    },
    {
        "id": "c10_m_pyq_092", "ch": 3, "topic": "Linear Equations", "subtopic": "Unique Solution Condition",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the value of $k$ for which the system of equations $kx+2y=5$ and $3x+y=1$ has a unique solution.",
        "sol": r"$\frac{k}{3} \ne \frac{2}{1} \implies k \ne 6$.",
        "ans": r"k \ne 6"
    },
    {
        "id": "c10_m_pyq_093", "ch": 3, "topic": "Linear Equations", "subtopic": "Infinite Solutions Condition",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"For what value of $k$ will the following pair of linear equations have infinitely many solutions? $2x+3y=7$, $(k+1)x+(2k-1)y=4k+1$.",
        "sol": r"$\frac{2}{k+1} = \frac{3}{2k-1} = \frac{7}{4k+1}$. $2(2k-1) = 3(k+1) \implies 4k - 2 = 3k + 3 \implies k = 5$. Check: $\frac{2}{6} = \frac{1}{3}$, $\frac{7}{21} = \frac{1}{3}$. Satisfied.",
        "ans": r"k = 5"
    },
    {
        "id": "c10_m_pyq_094", "ch": 3, "topic": "Linear Equations", "subtopic": "Word Problem",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The difference between two numbers is 26 and one number is three times the other. Find the numbers.",
        "sol": r"$x - y = 26$, $x = 3y \implies 3y - y = 26 \implies 2y = 26 \implies y = 13, x = 39$.",
        "ans": r"39 and 13"
    },
    {
        "id": "c10_m_pyq_095", "ch": 3, "topic": "Linear Equations", "subtopic": "Digits Reversal",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The sum of the digits of a two-digit number is 9. If 27 is added to the number, the digits are reversed. Find the number.",
        "sol": r"Let number be $10x + y$. $x + y = 9$. $(10x + y) + 27 = 10y + x \implies 9y - 9x = 27 \implies y - x = 3$. Adding $x+y=9$: $2y = 12 \implies y = 6, x = 3$. Number is 36.",
        "ans": r"36"
    },
    {
        "id": "c10_m_pyq_096", "ch": 3, "topic": "Linear Equations", "subtopic": "Cross-Multiplication Method",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Solve the following system: $2x+3y=11$ and $2x-4y=-24$.",
        "sol": r"Subtracting equations: $7y = 35 \implies y = 5$. $2x + 15 = 11 \implies 2x = -4 \implies x = -2$.",
        "ans": r"x = -2, y = 5"
    },
    {
        "id": "c10_m_pyq_097", "ch": 3, "topic": "Linear Equations", "subtopic": "No Solution Condition",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"For what value of $k$ does the system $x+2y=3$, $5x+ky+7=0$ have no solution?",
        "sol": r"$\frac{1}{5} = \frac{2}{k} \ne \frac{-3}{7} \implies k = 10$.",
        "ans": r"k = 10"
    },
    {
        "id": "c10_m_pyq_098", "ch": 3, "topic": "Linear Equations", "subtopic": "Sum and Difference",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The sum of two numbers is 50 and their difference is 16. Find the numbers.",
        "sol": r"$x + y = 50$, $x - y = 16 \implies 2x = 66 \implies x = 33, y = 17$.",
        "ans": r"33 and 17"
    },
    {
        "id": "c10_m_pyq_099", "ch": 3, "topic": "Linear Equations", "subtopic": "Age Problem",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Five years ago, A was thrice as old as B. Ten years later, A will be twice as old as B. Find their present ages.",
        "sol": r"$A - 5 = 3(B - 5) \implies A - 3B = -10$. $A + 10 = 2(B + 10) \implies A - 2B = 10$. Subtracting: $B = 20$, $A = 50$.",
        "ans": r"A = 50 years, B = 20 years"
    },
    {
        "id": "c10_m_pyq_100", "ch": 3, "topic": "Linear Equations", "subtopic": "Cricket Equipment",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The coach of a cricket team buys 7 bats and 6 balls for ₹3800. Later, he buys 3 bats and 5 balls for ₹1750. Find the cost of each bat and each ball.",
        "sol": r"$7x + 6y = 3800$, $3x + 5y = 1750$. Multiply first by 5, second by 6: $35x + 30y = 19000$, $18x + 30y = 10500$. Subtract: $17x = 8500 \implies x = 500$. $3(500) + 5y = 1750 \implies 5y = 250 \implies y = 50$.",
        "ans": r"Bat = ₹500, Ball = ₹50"
    },
    {
        "id": "c10_m_pyq_101", "ch": 3, "topic": "Linear Equations", "subtopic": "Fraction Coefficients",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Solve: $\frac{x}{2} + \frac{2y}{3} = -1$ and $x - \frac{y}{3} = 3$.",
        "sol": r"Multiply first by 6: $3x + 4y = -6$. Multiply second by 3: $3x - y = 9$. Subtract: $5y = -15 \implies y = -3$. $3x - (-3) = 9 \implies 3x = 6 \implies x = 2$.",
        "ans": r"x = 2, y = -3"
    },
    {
        "id": "c10_m_pyq_102", "ch": 3, "topic": "Linear Equations", "subtopic": "Infinitely Many Solutions",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the value of $k$ for which the equations $3x-y=5$ and $6x-2y=k$ have infinitely many solutions.",
        "sol": r"$\frac{3}{6} = \frac{-1}{-2} = \frac{5}{k} \implies \frac{1}{2} = \frac{5}{k} \implies k = 10$.",
        "ans": r"k = 10"
    },
    {
        "id": "c10_m_pyq_103", "ch": 3, "topic": "Linear Equations", "subtopic": "Fraction Problem",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A fraction becomes $\frac{1}{3}$ when 1 is subtracted from the numerator and it becomes $\frac{1}{4}$ when 8 is added to its denominator. Find the fraction.",
        "sol": r"$\frac{x-1}{y} = \frac{1}{3} \implies 3x - y = 3$. $\frac{x}{y+8} = \frac{1}{4} \implies 4x - y = 8$. Subtracting: $x = 5$, $y = 12$. Fraction is $5/12$.",
        "ans": r"5/12"
    },
    {
        "id": "c10_m_pyq_104", "ch": 3, "topic": "Linear Equations", "subtopic": "Supplementary Angles",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The larger of two supplementary angles exceeds the smaller by 18°. Find the angles.",
        "sol": r"$x + y = 180$, $x - y = 18 \implies 2x = 198 \implies x = 99^\circ, y = 81^\circ$.",
        "ans": r"99° and 81°"
    },
    {
        "id": "c10_m_pyq_105", "ch": 3, "topic": "Linear Equations", "subtopic": "Graphical Solution",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Solve graphically: $x+y=5$ and $2x-y=4$.",
        "sol": r"Line 1 passes through $(0,5), (5,0)$. Line 2 passes through $(0,-4), (2,0)$. Point of intersection is $(3,2)$.",
        "ans": r"x = 3, y = 2"
    }
]

print(f"Loaded {len(chapters_1_to_5)} questions from Chapters 1 to 5.")
