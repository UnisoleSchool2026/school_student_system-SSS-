# Python script to generate Class 10 Math NCERT Questions (Chapters 1 to 7)
# Solved Examples + Exercise Questions with complete LaTeX formatting and solutions

ncert_chapters_1_to_7 = [
    # ==================== Chapter 1: Real Numbers ====================
    {
        "id": "c10_m_ncert_ch1_ex1", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 1",
        "q": r"Use Euclid’s division algorithm to find the HCF of 135 and 225.",
        "sol": r"Apply Euclid's Lemma: $225 = 135 \times 1 + 90$; $135 = 90 \times 1 + 45$; $90 = 45 \times 2 + 0$. The remainder is 0, divisor is 45. Hence $\text{HCF}(135, 225) = 45$.",
        "ans": r"45"
    },
    {
        "id": "c10_m_ncert_ch1_ex2", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 2",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 2",
        "q": r"Use Euclid’s division algorithm to find the HCF of 196 and 38220.",
        "sol": r"$38220 = 196 \times 195 + 0$. Since remainder is 0 in the first step, $\text{HCF}(196, 38220) = 196$.",
        "ans": r"196"
    },
    {
        "id": "c10_m_ncert_ch1_ex3", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 3",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 3",
        "q": r"Use Euclid’s division algorithm to find the HCF of 867 and 255.",
        "sol": r"$867 = 255 \times 3 + 102$; $255 = 102 \times 2 + 51$; $102 = 51 \times 2 + 0$. Divisor is 51. Hence $\text{HCF}(867, 255) = 51$.",
        "ans": r"51"
    },
    {
        "id": "c10_m_ncert_ch1_ex4", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 4",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Example 4",
        "q": r"Show that any positive odd integer is of the form $6q + 1$, $6q + 3$ or $6q + 5$, where $q$ is some integer.",
        "sol": r"Let $a = 6q + r$, where $0 \le r < 6$. For $r = 0, 2, 4$, $a$ is divisible by 2 (even). For $r = 1, 3, 5$, $a$ is not divisible by 2 (odd). Hence odd integers are of form $6q + 1, 6q + 3, 6q + 5$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_ncert_ch1_ex5", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 5",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 5",
        "q": r"An army contingent of 616 members is to march behind an army band of 32 members in a parade. What is the maximum number of columns in which they can march?",
        "sol": r"Maximum columns $= \text{HCF}(616, 32)$. $616 = 32 \times 19 + 8$; $32 = 8 \times 4 + 0$. Hence $\text{HCF} = 8$ columns.",
        "ans": r"8\text{ columns}"
    },
    {
        "id": "c10_m_ncert_ch1_ex6", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 6",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 6",
        "q": r"Express each number as a product of its prime factors: (i) 140 (ii) 156 (iii) 3825 (iv) 5005 (v) 7429.",
        "sol": r"(i) $140 = 2^2 \times 5 \times 7$. (ii) $156 = 2^2 \times 3 \times 13$. (iii) $3825 = 3^2 \times 5^2 \times 17$. (iv) $5005 = 5 \times 7 \times 11 \times 13$. (v) $7429 = 17 \times 19 \times 23$.",
        "ans": r"(i) 2^2\cdot 5\cdot 7, (ii) 2^2\cdot 3\cdot 13, (iii) 3^2\cdot 5^2\cdot 17, (iv) 5\cdot 7\cdot 11\cdot 13, (v) 17\cdot 19\cdot 23"
    },
    {
        "id": "c10_m_ncert_ch1_ex7", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 7",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Example 7",
        "q": r"Find the LCM and HCF of 26 and 91 and verify that $\text{LCM} \times \text{HCF} = \text{Product of the two numbers}$.",
        "sol": r"$26 = 2 \times 13$, $91 = 7 \times 13$. $\text{HCF} = 13$, $\text{LCM} = 2 \times 7 \times 13 = 182$. $\text{LCM} \times \text{HCF} = 182 \times 13 = 2366$. Product $= 26 \times 91 = 2366$. Verified.",
        "ans": r"\text{HCF} = 13, \text{LCM} = 182"
    },
    {
        "id": "c10_m_ncert_ch1_ex8", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 8",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 8",
        "q": r"Find the LCM and HCF of 12, 15 and 21 by applying the prime factorisation method.",
        "sol": r"$12 = 2^2 \times 3$, $15 = 3 \times 5$, $21 = 3 \times 7$. $\text{HCF} = 3$. $\text{LCM} = 2^2 \times 3 \times 5 \times 7 = 420$.",
        "ans": r"\text{HCF} = 3, \text{LCM} = 420"
    },
    {
        "id": "c10_m_ncert_ch1_ex9", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 9",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 9",
        "q": r"Given that $\text{HCF}(306, 657) = 9$, find $\text{LCM}(306, 657)$.",
        "sol": r"$\text{LCM} = \frac{306 \times 657}{\text{HCF}} = \frac{306 \times 657}{9} = 34 \times 657 = 22338$.",
        "ans": r"22338"
    },
    {
        "id": "c10_m_ncert_ch1_ex10", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 10",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 10",
        "q": r"Check whether $6^n$ can end with the digit 0 for any natural number $n$.",
        "sol": r"A number ends with 0 if its prime factorisation contains both 2 and 5. $6^n = (2 \times 3)^n = 2^n \times 3^n$. Since 5 is not a prime factor of $6^n$, by the Fundamental Theorem of Arithmetic, $6^n$ can never end with digit 0.",
        "ans": r"\text{No, cannot end with 0}"
    },
    {
        "id": "c10_m_ncert_ch1_ex11", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 11",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 11",
        "q": r"Explain why $7 \times 11 \times 13 + 13$ and $7 \times 6 \times 5 \times 4 \times 3 \times 2 \times 1 + 5$ are composite numbers.",
        "sol": r"$7 \times 11 \times 13 + 13 = 13(7 \times 11 + 1) = 13 \times 78$, which has factors other than 1 and itself. Similarly, $5(7 \times 6 \times 4 \times 3 \times 2 \times 1 + 1) = 5 \times 1009$ has factors 5 and 1009. Hence both are composite.",
        "ans": r"Composite numbers"
    },
    {
        "id": "c10_m_ncert_ch1_ex12", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 12",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 12",
        "q": r"Sonia takes 18 minutes to drive one round of the field, while Ravi takes 12 minutes. After how many minutes will they meet again at the starting point?",
        "sol": r"Meeting time $= \text{LCM}(18, 12)$. $18 = 2 \times 3^2$, $12 = 2^2 \times 3$. $\text{LCM} = 2^2 \times 3^2 = 36$ minutes.",
        "ans": r"36\text{ minutes}"
    },
    {
        "id": "c10_m_ncert_ch1_ex13", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 13",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Example 13",
        "q": r"Prove that $\sqrt{5}$ is irrational.",
        "sol": r"Assume $\sqrt{5} = a/b$ ($a, b$ co-prime). $5b^2 = a^2 \implies 5 \mid a$. Let $a = 5c \implies 5b^2 = 25c^2 \implies b^2 = 5c^2 \implies 5 \mid b$. This contradicts co-primality. Hence $\sqrt{5}$ is irrational.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_ncert_ch1_ex14", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 14",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 14",
        "q": r"Prove that $3 + 2\sqrt{5}$ is irrational.",
        "sol": r"Let $3 + 2\sqrt{5} = r$ (rational). Then $\sqrt{5} = \frac{r - 3}{2}$. The RHS is rational since $r$ is rational, but LHS $\sqrt{5}$ is irrational. This contradiction shows $3 + 2\sqrt{5}$ is irrational.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_ncert_ch1_ex15", "ch": 1, "topic": "Real Numbers", "subtopic": "NCERT Example 15",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Example 15",
        "q": r"Prove that the following are irrational: (i) $\frac{1}{\sqrt{2}}$ (ii) $7\sqrt{5}$ (iii) $6 + \sqrt{2}$.",
        "sol": r"(i) $\frac{1}{\sqrt{2}} = \frac{\sqrt{2}}{2}$. Since $\sqrt{2}$ is irrational, $\sqrt{2}/2$ is irrational. (ii) If $7\sqrt{5} = a/b$, then $\sqrt{5} = \frac{a}{7b}$, which contradicts irrationality of $\sqrt{5}$. (iii) If $6 + \sqrt{2} = r$, then $\sqrt{2} = r - 6$, contradiction.",
        "ans": r"Proof"
    },

    # ==================== Chapter 2: Polynomials ====================
    {
        "id": "c10_m_ncert_ch2_ex1", "ch": 2, "topic": "Polynomials", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "NCERT Example 1",
        "q": r"Look at the graphs of $y = p(x)$. State how the number of zeroes of $p(x)$ is determined from the graph.",
        "sol": r"The number of zeroes of $p(x)$ equals the number of distinct points where the graph intersects or touches the x-axis.",
        "ans": r"\text{Number of x-intercepts}"
    },
    {
        "id": "c10_m_ncert_ch2_ex2", "ch": 2, "topic": "Polynomials", "subtopic": "NCERT Example 2",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Example 2",
        "q": r"Find the zeroes of the quadratic polynomial $x^2 + 7x + 10$, and verify the relationship between the zeroes and the coefficients.",
        "sol": r"$x^2 + 7x + 10 = (x + 2)(x + 5) = 0 \implies \alpha = -2, \beta = -5$. Sum $\alpha + \beta = -7 = -\frac{b}{a}$. Product $\alpha \beta = 10 = \frac{c}{a}$. Verified.",
        "ans": r"-2, -5"
    },
    {
        "id": "c10_m_ncert_ch2_ex3", "ch": 2, "topic": "Polynomials", "subtopic": "NCERT Example 3",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 3",
        "q": r"Find the zeroes of the polynomial $x^2 - 3$ and verify the relationship between the zeroes and the coefficients.",
        "sol": r"$x^2 - 3 = (x - \sqrt{3})(x + \sqrt{3}) = 0 \implies \alpha = \sqrt{3}, \beta = -\sqrt{3}$. Sum $= 0 = -0/1$. Product $= -3 = -3/1$. Verified.",
        "ans": r"\sqrt{3}, -\sqrt{3}"
    },
    {
        "id": "c10_m_ncert_ch2_ex4", "ch": 2, "topic": "Polynomials", "subtopic": "NCERT Example 4",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 4",
        "q": r"Find a quadratic polynomial, the sum and product of whose zeroes are –3 and 2, respectively.",
        "sol": r"$p(x) = k[x^2 - (\text{Sum})x + \text{Product}] = k[x^2 - (-3)x + 2] = x^2 + 3x + 2$ (for $k=1$).",
        "ans": r"x^2 + 3x + 2"
    },
    {
        "id": "c10_m_ncert_ch2_e2_2_q1", "ch": 2, "topic": "Polynomials", "subtopic": "Exercise 2.2 Q1",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 2.2 Q1",
        "q": r"Find the zeroes of $4s^2 - 4s + 1$ and verify the relationship between zeroes and coefficients.",
        "sol": r"$4s^2 - 4s + 1 = (2s - 1)^2 = 0 \implies s = 1/2, 1/2$. Sum $= 1/2 + 1/2 = 1 = -(-4)/4$. Product $= (1/2)(1/2) = 1/4 = 1/4$. Verified.",
        "ans": r"s = \frac{1}{2}, \frac{1}{2}"
    },
    {
        "id": "c10_m_ncert_ch2_e2_2_q2", "ch": 2, "topic": "Polynomials", "subtopic": "Exercise 2.2 Q2",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 2.2 Q2",
        "q": r"Find a quadratic polynomial with sum $\sqrt{2}$ and product $\frac{1}{3}$.",
        "sol": r"$p(x) = k[x^2 - \sqrt{2}x + \frac{1}{3}]$. Choosing $k = 3$, we obtain $3x^2 - 3\sqrt{2}x + 1$.",
        "ans": r"3x^2 - 3\sqrt{2}x + 1"
    },

    # ==================== Chapter 3: Pair of Linear Equations ====================
    {
        "id": "c10_m_ncert_ch3_ex1", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Example 1",
        "q": r"Aftab tells his daughter, “Seven years ago, I was seven times as old as you were then. Also, three years from now, I shall be three times as old as you will be.” Represent this situation algebraically.",
        "sol": r"Let Aftab's present age be $x$, daughter's be $y$. Seven years ago: $x - 7 = 7(y - 7) \implies x - 7y = -42$. Three years hence: $x + 3 = 3(y + 3) \implies x - 3y = 6$.",
        "ans": r"x - 7y = -42, x - 3y = 6"
    },
    {
        "id": "c10_m_ncert_ch3_ex2", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "NCERT Example 2",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 2",
        "q": r"The coach of a cricket team buys 3 bats and 6 balls for ₹3900. Later, she buys 1 bat and 3 more balls for ₹1300. Represent algebraically.",
        "sol": r"Let cost of one bat be ₹$x$ and one ball be ₹$y$. Equations are $3x + 6y = 3900$ (or $x + 2y = 1300$) and $x + 3y = 1300$.",
        "ans": r"x + 2y = 1300, x + 3y = 1300"
    },
    {
        "id": "c10_m_ncert_ch3_e3_2_q1", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "Exercise 3.2 Q1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 3.2 Q1",
        "q": r"Solve by substitution: $x + y = 14$ and $x - y = 4$.",
        "sol": r"From second: $x = y + 4$. Substitute in first: $(y + 4) + y = 14 \implies 2y = 10 \implies y = 5$. Then $x = 5 + 4 = 9$.",
        "ans": r"x = 9, y = 5"
    },
    {
        "id": "c10_m_ncert_ch3_e3_2_q2", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "Exercise 3.2 Q2",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 3.2 Q2",
        "q": r"Solve $2x + 3y = 11$ and $2x - 4y = -24$ and hence find the value of $m$ for which $y = mx + 3$.",
        "sol": r"Subtracting: $7y = 35 \implies y = 5$. $2x + 15 = 11 \implies 2x = -4 \implies x = -2$. Substitute into $y = mx + 3$: $5 = m(-2) + 3 \implies 2 = -2m \implies m = -1$.",
        "ans": r"x = -2, y = 5, m = -1"
    },
    {
        "id": "c10_m_ncert_ch3_e3_3_q1", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "Exercise 3.3 Q1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 3.3 Q1",
        "q": r"Solve by elimination: $x + y = 5$ and $2x - 3y = 4$.",
        "sol": r"Multiply first eq by 2: $2x + 2y = 10$. Subtract second eq: $5y = 6 \implies y = 6/5$. Then $x = 5 - 6/5 = 19/5$.",
        "ans": r"x = \frac{19}{5}, y = \frac{6}{5}"
    },

    # ==================== Chapter 4: Quadratic Equations ====================
    {
        "id": "c10_m_ncert_ch4_ex1", "ch": 4, "topic": "Quadratic Equations", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 1",
        "q": r"Check whether $(x + 1)^2 = 2(x - 3)$ is a quadratic equation.",
        "sol": r"$x^2 + 2x + 1 = 2x - 6 \implies x^2 + 7 = 0$. Since it is of the form $ax^2 + bx + c = 0$ with $a \ne 0$, it is a quadratic equation.",
        "ans": r"\text{Yes, quadratic equation}"
    },
    {
        "id": "c10_m_ncert_ch4_ex3", "ch": 4, "topic": "Quadratic Equations", "subtopic": "NCERT Example 3",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 3",
        "q": r"Find the roots of $2x^2 + x - 6 = 0$ by factorisation.",
        "sol": r"$2x^2 + 4x - 3x - 6 = 0 \implies 2x(x + 2) - 3(x + 2) = 0 \implies (2x - 3)(x + 2) = 0 \implies x = 3/2, -2$.",
        "ans": r"x = \frac{3}{2}, -2"
    },
    {
        "id": "c10_m_ncert_ch4_ex4", "ch": 4, "topic": "Quadratic Equations", "subtopic": "NCERT Example 4",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Example 4",
        "q": r"Find two numbers whose sum is 27 and product is 182.",
        "sol": r"Let numbers be $x$ and $27 - x$. $x(27 - x) = 182 \implies x^2 - 27x + 182 = 0 \implies (x - 13)(x - 14) = 0 \implies x = 13$ or $14$. The numbers are 13 and 14.",
        "ans": r"13, 14"
    },
    {
        "id": "c10_m_ncert_ch4_e4_3_q1", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Exercise 4.3 Q1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 4.3 Q1",
        "q": r"Find the discriminant and nature of roots of $2x^2 - 3x + 5 = 0$.",
        "sol": r"$D = b^2 - 4ac = (-3)^2 - 4(2)(5) = 9 - 40 = -31 < 0$. Since $D < 0$, the equation has no real roots.",
        "ans": r"\text{No real roots}"
    },
    {
        "id": "c10_m_ncert_ch4_e4_3_q4", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Exercise 4.3 Q4",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "NCERT Exercise 4.3 Q4",
        "q": r"Find the value of $k$ for which $2x^2 + kx + 3 = 0$ has two equal roots.",
        "sol": r"Equal roots $\implies D = 0 \implies k^2 - 4(2)(3) = 0 \implies k^2 - 24 = 0 \implies k = \pm \sqrt{24} = \pm 2\sqrt{6}$.",
        "ans": r"\pm 2\sqrt{6}"
    },

    # ==================== Chapter 5: Arithmetic Progressions ====================
    {
        "id": "c10_m_ncert_ch5_ex3", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "NCERT Example 3",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 3",
        "q": r"Find the 10th term of the AP: 2, 7, 12, …",
        "sol": r"$a = 2, d = 5$. $a_{10} = 2 + (10 - 1)5 = 2 + 45 = 47$.",
        "ans": r"47"
    },
    {
        "id": "c10_m_ncert_ch5_ex4", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "NCERT Example 4",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 4",
        "q": r"Find the sum of the first 22 terms of the AP: 8, 3, –2, …",
        "sol": r"$a = 8, d = -5$. $S_{22} = \frac{22}{2}[2(8) + 21(-5)] = 11[16 - 105] = 11(-89) = -979$.",
        "ans": r"-979"
    },
    {
        "id": "c10_m_ncert_ch5_e5_2_q4", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Exercise 5.2 Q4",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 5.2 Q4",
        "q": r"Which term of the AP: 3, 8, 13, 18, … is 78?",
        "sol": r"$a = 3, d = 5$. $a_n = 3 + (n - 1)5 = 78 \implies 5(n - 1) = 75 \implies n - 1 = 15 \implies n = 16$.",
        "ans": r"16\text{th term}"
    },
    {
        "id": "c10_m_ncert_ch5_e5_2_q13", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Exercise 5.2 Q13",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 5.2 Q13",
        "q": r"How many three-digit numbers are divisible by 7?",
        "sol": r"Three-digit numbers divisible by 7: 105, 112, …, 994. $a = 105, d = 7, a_n = 994$. $105 + (n - 1)7 = 994 \implies 7(n - 1) = 889 \implies n - 1 = 127 \implies n = 128$.",
        "ans": r"128"
    },
    {
        "id": "c10_m_ncert_ch5_e5_3_q9", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Exercise 5.3 Q9",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 5.3 Q9",
        "q": r"If the sum of first 7 terms of an AP is 49 and that of 17 terms is 289, find the sum of first $n$ terms.",
        "sol": r"$S_7 = \frac{7}{2}(2a + 6d) = 49 \implies a + 3d = 7$. $S_{17} = \frac{17}{2}(2a + 16d) = 289 \implies a + 8d = 17$. Subtracting: $5d = 10 \implies d = 2, a = 1$. $S_n = \frac{n}{2}[2(1) + (n - 1)2] = n^2$.",
        "ans": r"n^2"
    },

    # ==================== Chapter 6: Triangles ====================
    {
        "id": "c10_m_ncert_ch6_ex2", "ch": 6, "topic": "Triangles", "subtopic": "NCERT Example 2",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 2",
        "q": r"In $\triangle ABC$, $DE \parallel BC$. If $AD = 1.5\text{ cm}$, $DB = 3\text{ cm}$, $AE = 1\text{ cm}$, find $EC$.",
        "sol": r"By BPT, $\frac{AD}{DB} = \frac{AE}{EC} \implies \frac{1.5}{3} = \frac{1}{EC} \implies EC = \frac{3}{1.5} = 2\text{ cm}$.",
        "ans": r"2\text{ cm}"
    },
    {
        "id": "c10_m_ncert_ch6_e6_2_q1", "ch": 6, "topic": "Triangles", "subtopic": "Exercise 6.2 Q1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 6.2 Q1",
        "q": r"In $\triangle ABC$, $DE \parallel BC$. If $DB = 7.2\text{ cm}$, $AE = 1.8\text{ cm}$, $EC = 5.4\text{ cm}$, find $AD$.",
        "sol": r"$\frac{AD}{DB} = \frac{AE}{EC} \implies \frac{AD}{7.2} = \frac{1.8}{5.4} = \frac{1}{3} \implies AD = \frac{7.2}{3} = 2.4\text{ cm}$.",
        "ans": r"2.4\text{ cm}"
    },
    {
        "id": "c10_m_ncert_ch6_e6_3_q15", "ch": 6, "topic": "Triangles", "subtopic": "Exercise 6.3 Q15",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 6.3 Q15",
        "q": r"A vertical pole of length 6 m casts a shadow 4 m long on the ground and at the same time a tower casts a shadow 28 m long. Find the height of the tower.",
        "sol": r"Sun's altitude is equal $\implies \triangle \text{Pole} \sim \triangle \text{Tower} \implies \frac{H}{6} = \frac{28}{4} = 7 \implies H = 42\text{ m}$.",
        "ans": r"42\text{ m}"
    },

    # ==================== Chapter 7: Coordinate Geometry ====================
    {
        "id": "c10_m_ncert_ch7_ex1", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 1",
        "q": r"Find the distance between the points $(2, 3)$ and $(4, 1)$.",
        "sol": r"$d = \sqrt{(4 - 2)^2 + (1 - 3)^2} = \sqrt{4 + 4} = \sqrt{8} = 2\sqrt{2}$.",
        "ans": r"2\sqrt{2}"
    },
    {
        "id": "c10_m_ncert_ch7_ex5", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "NCERT Example 5",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 5",
        "q": r"Find the coordinates of the point which divides the join of $(-1, 7)$ and $(4, -3)$ in the ratio $2 : 3$.",
        "sol": r"$x = \frac{2(4) + 3(-1)}{2 + 3} = \frac{8 - 3}{5} = 1$. $y = \frac{2(-3) + 3(7)}{2 + 3} = \frac{-6 + 21}{5} = \frac{15}{5} = 3$. Point is $(1, 3)$.",
        "ans": r"(1, 3)"
    },
    {
        "id": "c10_m_ncert_ch7_e7_1_q7", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Exercise 7.1 Q7",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 7.1 Q7",
        "q": r"Find the point on the x-axis which is equidistant from $(2, -5)$ and $(-2, 9)$.",
        "sol": r"Let point be $(x, 0)$. $(x - 2)^2 + (0 - (-5))^2 = (x - (-2))^2 + (0 - 9)^2 \implies x^2 - 4x + 4 + 25 = x^2 + 4x + 4 + 81 \implies -8x = 56 \implies x = -7$. Point is $(-7, 0)$.",
        "ans": r"(-7, 0)"
    },
    {
        "id": "c10_m_ncert_ch7_e7_2_q4", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Exercise 7.2 Q4",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 7.2 Q4",
        "q": r"Find the ratio in which the line segment joining $(-3, 10)$ and $(6, -8)$ is divided by $(-1, 6)$.",
        "sol": r"Let ratio be $k : 1$. $-1 = \frac{6k - 3}{k + 1} \implies -k - 1 = 6k - 3 \implies 7k = 2 \implies k = 2/7$. Ratio is $2 : 7$.",
        "ans": r"2 : 7"
    }
]

if __name__ == "__main__":
    print(f"Loaded {len(ncert_chapters_1_to_7)} NCERT questions for Chapters 1 to 7.")
