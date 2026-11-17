# Python script to generate Class 10 Math Questions 291 to 370
# Mixed High-Frequency PYQs (291-310) and CBSE Exam Pattern Questions (311-370)

pattern_questions = [
    # --- Mixed High-Frequency / Additional PYQs (291 - 310) ---
    {
        "id": "c10_m_pyq_291", "ch": 1, "topic": "Real Numbers", "subtopic": "Irrationality Proof",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE Standard PYQ",
        "q": r"Prove that $\sqrt{2}$ is irrational.",
        "sol": r"Assume $\sqrt{2} = \frac{a}{b}$ in simplest form ($a, b$ co-prime). Then $2b^2 = a^2 \implies 2 \mid a^2 \implies 2 \mid a$. Let $a = 2c$. Then $2b^2 = 4c^2 \implies b^2 = 2c^2 \implies 2 \mid b$. This contradicts co-prime nature, hence $\sqrt{2}$ is irrational.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pyq_292", "ch": 1, "topic": "Real Numbers", "subtopic": "Euclid Division HCF",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the HCF of 96 and 404 by Euclid’s division algorithm.",
        "sol": r"$404 = 96 \times 4 + 20$; $96 = 20 \times 4 + 16$; $20 = 16 \times 1 + 4$; $16 = 4 \times 4 + 0$. Remainder is 0, divisor is 4. Hence $\text{HCF}(96, 404) = 4$.",
        "ans": r"4"
    },
    {
        "id": "c10_m_pyq_293", "ch": 2, "topic": "Polynomials", "subtopic": "Double Zeroes Relation",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"If the zeroes of the polynomial $x^2 + px + q$ are double in value to the zeroes of $2x^2 - 5x - 3$, find $p$ and $q$.",
        "sol": r"Zeroes of $2x^2 - 5x - 3$: $\alpha + \beta = 5/2, \alpha \beta = -3/2$. New zeroes $2\alpha, 2\beta$. Sum $= 2(\alpha + \beta) = 5 = -p \implies p = -5$. Product $= 4\alpha\beta = 4(-3/2) = -6 = q \implies q = -6$.",
        "ans": r"p = -5, q = -6"
    },
    {
        "id": "c10_m_pyq_294", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Factorisation",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Solve the quadratic equation $x^2 - 2x - 15 = 0$ by factorisation.",
        "sol": r"$x^2 - 5x + 3x - 15 = 0 \implies (x - 5)(x + 3) = 0 \implies x = 5$ or $x = -3$.",
        "ans": r"x = 5, -3"
    },
    {
        "id": "c10_m_pyq_295", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "nth Term from 7th Term",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the 20th term of the AP whose 7th term is 15 and common difference is 2.",
        "sol": r"$a_7 = a + 6d = 15 \implies a + 6(2) = 15 \implies a = 3$. Then $a_{20} = a + 19d = 3 + 19(2) = 3 + 38 = 41$.",
        "ans": r"41"
    },
    {
        "id": "c10_m_pyq_296", "ch": 6, "topic": "Triangles", "subtopic": "Basic Proportionality Theorem",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"In $\triangle ABC$, $DE \parallel BC$. If $AD = 4\text{ cm}$, $DB = 6\text{ cm}$ and $AE = 8\text{ cm}$, find $AC$.",
        "sol": r"By BPT, $\frac{AD}{DB} = \frac{AE}{EC} \implies \frac{4}{6} = \frac{8}{EC} \implies EC = 12\text{ cm}$. $AC = AE + EC = 8 + 12 = 20\text{ cm}$.",
        "ans": r"20\text{ cm}"
    },
    {
        "id": "c10_m_pyq_297", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Distance Formula",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the distance between the points $A(2, -3)$ and $B(-1, 4)$.",
        "sol": r"$AB = \sqrt{(-1 - 2)^2 + (4 - (-3))^2} = \sqrt{(-3)^2 + 7^2} = \sqrt{9 + 49} = \sqrt{58}$.",
        "ans": r"\sqrt{58}"
    },
    {
        "id": "c10_m_pyq_298", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "Trigonometric Ratios",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $\sin \theta = \frac{12}{13}$, find $\cos \theta$ and $\tan \theta$.",
        "sol": r"$\cos \theta = \sqrt{1 - \sin^2 \theta} = \sqrt{1 - \frac{144}{169}} = \frac{5}{13}$. $\tan \theta = \frac{\sin \theta}{\cos \theta} = \frac{12/13}{5/13} = \frac{12}{5}$.",
        "ans": r"\cos \theta = \frac{5}{13}, \tan \theta = \frac{12}{5}"
    },
    {
        "id": "c10_m_pyq_299", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "Elevation of Tower 60 deg",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A tower is 50 m high. From a point on the ground, the angle of elevation of the top is $60^\circ$. Find the distance of the point from the foot of the tower.",
        "sol": r"$\tan 60^\circ = \frac{50}{d} \implies \sqrt{3} = \frac{50}{d} \implies d = \frac{50}{\sqrt{3}} = \frac{50\sqrt{3}}{3}\text{ m} \approx 28.87\text{ m}$.",
        "ans": r"\frac{50\sqrt{3}}{3}\text{ m}"
    },
    {
        "id": "c10_m_pyq_300", "ch": 10, "topic": "Circles", "subtopic": "Tangent from Point 13cm",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"From a point P, 13 cm away from the centre of a circle of radius 5 cm, a tangent is drawn. Find the length of the tangent.",
        "sol": r"$PT = \sqrt{OP^2 - r^2} = \sqrt{13^2 - 5^2} = \sqrt{169 - 25} = \sqrt{144} = 12\text{ cm}$.",
        "ans": r"12\text{ cm}"
    },
    {
        "id": "c10_m_pyq_301", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Sector Area Radius 6",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the area of a sector of angle $60^\circ$ of a circle with radius 6 cm.",
        "sol": r"$\text{Area} = \frac{60}{360} \times \frac{22}{7} \times 36 = \frac{132}{7}\text{ cm}^2 \approx 18.86\text{ cm}^2$.",
        "ans": r"\frac{132}{7}\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_302", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Sphere Melted into Cylinder",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A solid sphere of radius 3 cm is melted and recast into a cylinder of radius 2 cm. Find the height of the cylinder.",
        "sol": r"$\frac{4}{3}\pi (3)^3 = \pi (2)^2 h \implies \frac{4}{3} \times 27 = 4h \implies 36 = 4h \implies h = 9\text{ cm}$.",
        "ans": r"9\text{ cm}"
    },
    {
        "id": "c10_m_pyq_303", "ch": 13, "topic": "Statistics", "subtopic": "Mean Calculation",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the mean of the data: 10, 20, 30, 40, 50 with frequencies 2, 3, 5, 4, 1.",
        "sol": r"$\sum f = 15$. $\sum f_i x_i = 20 + 60 + 150 + 160 + 50 = 440$. $\text{Mean} = \frac{440}{15} = \frac{88}{3} \approx 29.33$.",
        "ans": r"29.33"
    },
    {
        "id": "c10_m_pyq_304", "ch": 14, "topic": "Probability", "subtopic": "Composite Number on Die",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A die is thrown once. Find the probability of getting a composite number.",
        "sol": r"Composite numbers on a die: $\{4, 6\} \implies 2$. Total outcomes $= 6$. $P = \frac{2}{6} = \frac{1}{3}$.",
        "ans": r"\frac{1}{3}"
    },
    {
        "id": "c10_m_pyq_305", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "Elimination Method",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Solve: $2x + 3y = 11$ and $2x - 4y = -24$ by elimination.",
        "sol": r"Subtracting: $(2x + 3y) - (2x - 4y) = 11 - (-24) \implies 7y = 35 \implies y = 5$. Then $2x + 15 = 11 \implies 2x = -4 \implies x = -2$.",
        "ans": r"x = -2, y = 5"
    },
    {
        "id": "c10_m_pyq_306", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Sum of First 15 Terms",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the sum of the first 15 terms of the AP: 4, 9, 14, …",
        "sol": r"$a = 4, d = 5$. $S_{15} = \frac{15}{2}[2(4) + (15 - 1)5] = \frac{15}{2}[8 + 70] = \frac{15}{2} \times 78 = 15 \times 39 = 585$.",
        "ans": r"585"
    },
    {
        "id": "c10_m_pyq_307", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "Sin A Cos A from Tan A",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $\tan A = \sqrt{3}$, find the value of $\sin A \cos A$.",
        "sol": r"$\tan A = \sqrt{3} \implies A = 60^\circ$. $\sin 60^\circ \cos 60^\circ = \frac{\sqrt{3}}{2} \times \frac{1}{2} = \frac{\sqrt{3}}{4}$.",
        "ans": r"\frac{\sqrt{3}}{4}"
    },
    {
        "id": "c10_m_pyq_308", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Sector Area from Perimeter",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The perimeter of a sector of a circle of radius 5.7 cm is 27.2 cm. Find the area of the sector.",
        "sol": r"$\text{Perimeter} = l + 2r \implies 27.2 = l + 2(5.7) = l + 11.4 \implies l = 15.8\text{ cm}$. $\text{Area} = \frac{1}{2} l r = \frac{1}{2} \times 15.8 \times 5.7 = 45.03\text{ cm}^2$.",
        "ans": r"45.03\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_309", "ch": 14, "topic": "Probability", "subtopic": "Black Ball Probability",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A bag contains 3 red and 5 black balls. A ball is drawn at random. Find the probability that it is black.",
        "sol": r"Total balls $= 3 + 5 = 8$. Black balls $= 5$. $P = \frac{5}{8}$.",
        "ans": r"\frac{5}{8}"
    },
    {
        "id": "c10_m_pyq_310", "ch": 13, "topic": "Statistics", "subtopic": "Mode of Grouped Data",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the mode of the following data: Class 0–10 ($f=5$), 10–20 ($f=8$), 20–30 ($f=12$), 30–40 ($f=7$), 40–50 ($f=3$).",
        "sol": r"Modal class is 20–30 ($l = 20, f_1 = 12, f_0 = 8, f_2 = 7, h = 10$). $\text{Mode} = 20 + \frac{12 - 8}{2(12) - 8 - 7} \times 10 = 20 + \frac{4}{9} \times 10 = 20 + 4.44 = 24.44$.",
        "ans": r"24.44"
    },

    # --- CBSE Pattern: 1-Mark MCQs & Assertion-Reason (311 - 318) ---
    {
        "id": "c10_m_pat_311", "ch": 2, "topic": "Polynomials", "subtopic": "Sum of Zeroes",
        "format": "MCQ", "marks": 1, "diff": "EASY", "pyq": "CBSE Sample Pattern",
        "q": r"If $\alpha$ and $\beta$ are zeroes of $x^2 - 5x + 6$, then $\alpha + \beta$ equals:",
        "opts": ["5", "-5", "6", "-6"],
        "sol": r"For $ax^2 + bx + c$, sum of zeroes $\alpha + \beta = -\frac{b}{a} = -\frac{-5}{1} = 5$.",
        "ans": "5"
    },
    {
        "id": "c10_m_pat_312", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Distance from Origin",
        "format": "MCQ", "marks": 1, "diff": "EASY", "pyq": "CBSE Sample Pattern",
        "q": r"The distance of the point $(3, 4)$ from the origin is:",
        "opts": ["5", "7", "1", "25"],
        "sol": r"Distance from origin $= \sqrt{x^2 + y^2} = \sqrt{3^2 + 4^2} = \sqrt{25} = 5$.",
        "ans": "5"
    },
    {
        "id": "c10_m_pat_313", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "Sec from Tan",
        "format": "MCQ", "marks": 1, "diff": "EASY", "pyq": "CBSE Sample Pattern",
        "q": r"If $\tan \theta = \sqrt{3}$, then $\sec \theta$ equals:",
        "opts": [r"\frac{2}{\sqrt{3}}", "2", r"\sqrt{3}", r"\frac{1}{\sqrt{3}}"],
        "sol": r"$\sec \theta = \sqrt{1 + \tan^2 \theta} = \sqrt{1 + 3} = \sqrt{4} = 2$.",
        "ans": "2"
    },
    {
        "id": "c10_m_pat_314", "ch": 14, "topic": "Probability", "subtopic": "Number Greater Than 3",
        "format": "MCQ", "marks": 1, "diff": "EASY", "pyq": "CBSE Sample Pattern",
        "q": r"The probability of getting a number greater than 3 when a die is thrown is:",
        "opts": [r"\frac{1}{2}", r"\frac{1}{3}", r"\frac{2}{3}", "1"],
        "sol": r"Favourable numbers: $\{4, 5, 6\} \implies 3$. $P = \frac{3}{6} = \frac{1}{2}$.",
        "ans": r"\frac{1}{2}"
    },
    {
        "id": "c10_m_pat_315", "ch": 1, "topic": "Real Numbers", "subtopic": "Irrational Square Root",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Sample Pattern",
        "q": r"Assertion (A): $\sqrt{2}$ is an irrational number.\nReason (R): The square root of every prime number is irrational.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"2 is a prime number and its square root is irrational. Hence both A and R are true and R correctly explains A.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_316", "ch": 10, "topic": "Circles", "subtopic": "Tangents from External Point",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Sample Pattern",
        "q": r"Assertion (A): The tangents drawn from an external point to a circle are equal.\nReason (R): The two tangents and the line joining the centre to the external point form two congruent triangles.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"RHS congruence proves that $\triangle OAP \cong \triangle OBP$, hence tangents are equal. Both A and R are true, and R correctly explains A.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_317", "ch": 13, "topic": "Statistics", "subtopic": "Mean of Algebraic Terms",
        "format": "MCQ", "marks": 1, "diff": "EASY", "pyq": "CBSE Sample Pattern",
        "q": r"If the mean of 5 observations $x, x+2, x+4, x+6, x+8$ is 11, then $x$ is:",
        "opts": ["5", "6", "7", "8"],
        "sol": r"$\text{Mean} = \frac{5x + 20}{5} = x + 4 = 11 \implies x = 7$.",
        "ans": "7"
    },
    {
        "id": "c10_m_pat_318", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "10th Term",
        "format": "MCQ", "marks": 1, "diff": "EASY", "pyq": "CBSE Sample Pattern",
        "q": r"The 10th term of the AP: 5, 9, 13, … is:",
        "opts": ["36", "41", "45", "49"],
        "sol": r"$a = 5, d = 4$. $a_{10} = 5 + 9(4) = 5 + 36 = 41$.",
        "ans": "41"
    },

    # --- 2-Mark Questions (VSA) (319 - 326) ---
    {
        "id": "c10_m_pat_319", "ch": 1, "topic": "Real Numbers", "subtopic": "Euclid HCF 867 and 255",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE 2M Pattern",
        "q": r"Find the HCF of 867 and 255 using Euclid’s algorithm.",
        "sol": r"$867 = 255 \times 3 + 102$; $255 = 102 \times 2 + 51$; $102 = 51 \times 2 + 0$. Remainder is 0, divisor is 51. Hence $\text{HCF} = 51$.",
        "ans": r"51"
    },
    {
        "id": "c10_m_pat_320", "ch": 2, "topic": "Polynomials", "subtopic": "Zeroes of Quadratic",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE 2M Pattern",
        "q": r"Find the zeroes of the polynomial $x^2 - 3x - 10$.",
        "sol": r"$x^2 - 5x + 2x - 10 = 0 \implies (x - 5)(x + 2) = 0 \implies x = 5, -2$.",
        "ans": r"5, -2"
    },
    {
        "id": "c10_m_pat_321", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "Substitution Method",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE 2M Pattern",
        "q": r"Solve: $2x + y = 7$ and $x - y = 2$ by substitution.",
        "sol": r"From second eq: $y = x - 2$. Substitute into first: $2x + (x - 2) = 7 \implies 3x = 9 \implies x = 3$. Then $y = 3 - 2 = 1$.",
        "ans": r"x = 3, y = 1"
    },
    {
        "id": "c10_m_pat_322", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "15th Term Negative Start",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE 2M Pattern",
        "q": r"Find the 15th term of the AP: −5, −1, 3, 7, …",
        "sol": r"$a = -5, d = 4$. $a_{15} = a + 14d = -5 + 14(4) = -5 + 56 = 51$.",
        "ans": r"51"
    },
    {
        "id": "c10_m_pat_323", "ch": 6, "topic": "Triangles", "subtopic": "BPT Proportional Segments",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE 2M Pattern",
        "q": r"In $\triangle ABC$, $DE \parallel BC$, $AD = 3\text{ cm}$, $DB = 4\text{ cm}$, $AE = 4.5\text{ cm}$. Find $EC$.",
        "sol": r"$\frac{AD}{DB} = \frac{AE}{EC} \implies \frac{3}{4} = \frac{4.5}{EC} \implies EC = \frac{4.5 \times 4}{3} = 6\text{ cm}$.",
        "ans": r"6\text{ cm}"
    },
    {
        "id": "c10_m_pat_324", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Distance Between Points",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE 2M Pattern",
        "q": r"Find the distance between the points $A(2, 3)$ and $B(4, 1)$.",
        "sol": r"$AB = \sqrt{(4 - 2)^2 + (1 - 3)^2} = \sqrt{4 + 4} = \sqrt{8} = 2\sqrt{2}$.",
        "ans": r"2\sqrt{2}"
    },
    {
        "id": "c10_m_pat_325", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "Cos from Sin",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE 2M Pattern",
        "q": r"If $\sin A = \frac{3}{5}$, find $\cos A$ where $A$ is an acute angle.",
        "sol": r"$\cos A = \sqrt{1 - \sin^2 A} = \sqrt{1 - \frac{9}{25}} = \sqrt{\frac{16}{25}} = \frac{4}{5}$.",
        "ans": r"\frac{4}{5}"
    },
    {
        "id": "c10_m_pat_326", "ch": 14, "topic": "Probability", "subtopic": "Prime on Die",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE 2M Pattern",
        "q": r"A die is thrown once. Find the probability of getting a prime number.",
        "sol": r"Prime numbers: $\{2, 3, 5\} \implies 3$. Total outcomes $= 6$. $P = \frac{3}{6} = \frac{1}{2}$.",
        "ans": r"\frac{1}{2}"
    },

    # --- 3-Mark Questions (SA) (327 - 334) ---
    {
        "id": "c10_m_pat_327", "ch": 1, "topic": "Real Numbers", "subtopic": "Root 5 Irrational Proof",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE 3M Pattern",
        "q": r"Prove that $\sqrt{5}$ is irrational.",
        "sol": r"Assume $\sqrt{5} = a/b$ ($a, b$ co-prime integers). $5b^2 = a^2 \implies 5 \mid a$. Let $a = 5c$. $5b^2 = 25c^2 \implies b^2 = 5c^2 \implies 5 \mid b$. Thus 5 divides both $a$ and $b$, contradicting co-prime assumption. Hence $\sqrt{5}$ is irrational.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pat_328", "ch": 2, "topic": "Polynomials", "subtopic": "Conjugate Radical Zeroes",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE 3M Pattern",
        "q": r"Find a quadratic polynomial whose zeroes are $2 + \sqrt{3}$ and $2 - \sqrt{3}$.",
        "sol": r"$\text{Sum} = (2 + \sqrt{3}) + (2 - \sqrt{3}) = 4$. $\text{Product} = (2 + \sqrt{3})(2 - \sqrt{3}) = 4 - 3 = 1$. Polynomial is $k(x^2 - 4x + 1)$, taking $k = 1$: $x^2 - 4x + 1$.",
        "ans": r"x^2 - 4x + 1"
    },
    {
        "id": "c10_m_pat_329", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "Elimination System",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE 3M Pattern",
        "q": r"Solve the system: $3x - 5y - 4 = 0$ and $9x = 2y + 7$.",
        "sol": r"Rewrite: $3x - 5y = 4$ (eq 1) and $9x - 2y = 7$ (eq 2). Multiply eq 1 by 3: $9x - 15y = 12$. Subtract eq 2: $-13y = 5 \implies y = -\frac{5}{13}$. Substitute: $3x = 4 + 5(-\frac{5}{13}) = \frac{27}{13} \implies x = \frac{9}{13}$.",
        "ans": r"x = \frac{9}{13}, y = -\frac{5}{13}"
    },
    {
        "id": "c10_m_pat_330", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "nth and 20th Term from Sn",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE 3M Pattern",
        "q": r"The sum of the first $n$ terms of an AP is $3n^2 + 5n$. Find the $n$th term and the 20th term.",
        "sol": r"$a_n = S_n - S_{n-1} = (3n^2 + 5n) - [3(n-1)^2 + 5(n-1)] = 6n + 2$. For $n = 20$, $a_{20} = 6(20) + 2 = 122$.",
        "ans": r"a_n = 6n + 2, a_{20} = 122"
    },
    {
        "id": "c10_m_pat_331", "ch": 6, "topic": "Triangles", "subtopic": "BPT Ratio",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "EASY", "pyq": "CBSE 3M Pattern",
        "q": r"In $\triangle ABC$, if $DE \parallel BC$ and $\frac{AD}{BD} = \frac{2}{3}$, find $\frac{AE}{EC}$.",
        "sol": r"By Thales’ Theorem (BPT), if a line is drawn parallel to one side of a triangle intersecting the other two sides, then it divides the two sides in the same ratio. Thus $\frac{AE}{EC} = \frac{AD}{BD} = \frac{2}{3}$.",
        "ans": r"\frac{2}{3}"
    },
    {
        "id": "c10_m_pat_332", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Section Formula 1:2",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE 3M Pattern",
        "q": r"Find the coordinates of the point which divides the line segment joining $(-2, 3)$ and $(4, -5)$ in the ratio $1 : 2$.",
        "sol": r"$x = \frac{1(4) + 2(-2)}{1 + 2} = \frac{4 - 4}{3} = 0$. $y = \frac{1(-5) + 2(3)}{1 + 2} = \frac{-5 + 6}{3} = \frac{1}{3}$. The point is $(0, \frac{1}{3})$.",
        "ans": r"(0, \frac{1}{3})"
    },
    {
        "id": "c10_m_pat_333", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "Trigonometric Identity Proof",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE 3M Pattern",
        "q": r"Prove that $\frac{1 + \sin \theta}{1 - \sin \theta} = (\sec \theta + \tan \theta)^2$.",
        "sol": r"$\text{LHS} = \frac{1 + \sin \theta}{1 - \sin \theta} \times \frac{1 + \sin \theta}{1 + \sin \theta} = \frac{(1 + \sin \theta)^2}{1 - \sin^2 \theta} = \frac{(1 + \sin \theta)^2}{\cos^2 \theta} = \left(\frac{1}{\cos \theta} + \frac{\sin \theta}{\cos \theta}\right)^2 = (\sec \theta + \tan \theta)^2 = \text{RHS}$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pat_334", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "Tower Height 20m 60deg",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "EASY", "pyq": "CBSE 3M Pattern",
        "q": r"A tower stands vertically on the ground. From a point 20 m away, the angle of elevation is $60^\circ$. Find the height of the tower.",
        "sol": r"$\tan 60^\circ = \frac{h}{20} \implies \sqrt{3} = \frac{h}{20} \implies h = 20\sqrt{3}\text{ m} \approx 34.64\text{ m}$.",
        "ans": r"20\sqrt{3}\text{ m}"
    },

    # --- 5-Mark Long Answer Questions (335 - 338) ---
    {
        "id": "c10_m_pat_335", "ch": 6, "topic": "Triangles", "subtopic": "Areas of Similar Triangles Theorem",
        "format": "LONG_ANSWER", "marks": 5, "diff": "HARD", "pyq": "CBSE 5M Pattern",
        "q": r"Prove that the ratio of the areas of two similar triangles is equal to the square of the ratio of their corresponding sides.",
        "sol": r"Let $\triangle ABC \sim \triangle DEF$. Draw altitudes $AM \perp BC$ and $DN \perp EF$. Then $\frac{\text{ar}(\triangle ABC)}{\text{ar}(\triangle DEF)} = \frac{\frac{1}{2} BC \times AM}{\frac{1}{2} EF \times DN} = \frac{BC}{EF} \times \frac{AM}{DN}$. Since $\triangle ABM \sim \triangle DEN$, $\frac{AM}{DN} = \frac{AB}{DE} = \frac{BC}{EF}$. Therefore, $\frac{\text{ar}(\triangle ABC)}{\text{ar}(\triangle DEF)} = \left(\frac{AB}{DE}\right)^2 = \left(\frac{BC}{EF}\right)^2 = \left(\frac{AC}{DF}\right)^2$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pat_336", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Toy TSA and Volume",
        "format": "LONG_ANSWER", "marks": 5, "diff": "HARD", "pyq": "CBSE 5M Pattern",
        "q": r"A solid is in the form of a cone of radius 3.5 cm mounted on a hemisphere of the same radius. The total height of the solid is 15.5 cm. Find the total surface area and volume of the solid.",
        "sol": r"Cone height $h = 15.5 - 3.5 = 12\text{ cm}$. Slant height $l = \sqrt{12^2 + 3.5^2} = 12.5\text{ cm}$. $\text{TSA} = \pi r l + 2\pi r^2 = \frac{22}{7} \times 3.5(12.5 + 7) = 214.5\text{ cm}^2$. $\text{Volume} = \frac{1}{3}\pi r^2 h + \frac{2}{3}\pi r^3 = \frac{1}{3}\pi (3.5)^2(12 + 7) = \frac{1}{3} \times \frac{22}{7} \times 12.25 \times 19 = 243.83\text{ cm}^3$.",
        "ans": r"\text{TSA} = 214.5\text{ cm}^2, \text{Volume} = 243.83\text{ cm}^3"
    },
    {
        "id": "c10_m_pat_337", "ch": 13, "topic": "Statistics", "subtopic": "Mean Median Mode Complete",
        "format": "LONG_ANSWER", "marks": 5, "diff": "HARD", "pyq": "CBSE 5M Pattern",
        "q": r"The following table shows the ages of 100 workers: Age (years): 20–30 ($f=15$), 30–40 ($f=25$), 40–50 ($f=30$), 50–60 ($f=20$), 60–70 ($f=10$). Find the mean, median and mode of the data.",
        "sol": r"Midpoints: 25, 35, 45, 55, 65. $\sum f_i x_i = 375 + 875 + 1350 + 1100 + 650 = 4350 \implies \text{Mean} = 43.5$. $N/2 = 50$. Median class is 40–50 ($l=40, cf=40, f=30, h=10$). $\text{Median} = 40 + \frac{10}{30} \times 10 = 43.33$. Modal class is 40–50 ($l=40, f_1=30, f_0=25, f_2=20, h=10$). $\text{Mode} = 40 + \frac{5}{60 - 45} \times 10 = 40 + 3.33 = 43.33$.",
        "ans": r"\text{Mean} = 43.5, \text{Median} = 43.33, \text{Mode} = 43.33"
    },
    {
        "id": "c10_m_pat_338", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "Poles on 80m Road",
        "format": "LONG_ANSWER", "marks": 5, "diff": "HARD", "pyq": "CBSE 5M Pattern",
        "q": r"Two poles of equal height are standing opposite each other on either side of a road 80 m wide. From a point between them on the road, the angles of elevation of the tops are $60^\circ$ and $30^\circ$. Find the height of the poles and the distances of the point from the poles.",
        "sol": r"Let height be $h$, distances be $x$ and $80 - x$. $\tan 60^\circ = h/x \implies h = x\sqrt{3}$. $\tan 30^\circ = h/(80 - x) \implies \frac{1}{\sqrt{3}} = \frac{x\sqrt{3}}{80 - x} \implies 80 - x = 3x \implies 4x = 80 \implies x = 20\text{ m}$. $80 - x = 60\text{ m}$. Height $h = 20\sqrt{3}\text{ m} \approx 34.64\text{ m}$.",
        "ans": r"h = 20\sqrt{3}\text{ m}, \text{distances: } 20\text{ m and } 60\text{ m}"
    },

    # --- Case Studies (339 - 342) ---
    {
        "id": "c10_m_pat_339", "ch": 1, "topic": "Real Numbers", "subtopic": "Case Study - Book Stacks",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A school is preparing stacks of books: Physics = 144, Chemistry = 180, Maths = 192. Height of each stack is to be the same and books of the same subject are together.\n(i) What mathematical concept is used to find the number of stacks?\n(ii) Find the maximum number of books in each stack.\n(iii) Find the number of stacks of each subject.",
        "sol": r"(i) Highest Common Factor (HCF).\n(ii) $\text{HCF}(144, 180, 192) = 12$ books per stack.\n(iii) Physics: $144/12 = 12$; Chemistry: $180/12 = 15$; Maths: $192/12 = 16$ stacks.",
        "ans": r"(i) HCF, (ii) 12, (iii) 12, 15, 16"
    },
    {
        "id": "c10_m_pat_340", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "Case Study - Angle Change Walking",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A boy is standing at a distance from a building. Angle of elevation is $45^\circ$. After walking 10 m towards the building, the angle becomes $60^\circ$.\n(i) State trigonometric relations used.\n(ii) Find the height of the building.\n(iii) Find the original distance from the foot of the building.",
        "sol": r"(i) $\tan 45^\circ = h/d = 1 \implies h = d$. $\tan 60^\circ = h/(d - 10) \implies \sqrt{3}(d - 10) = d$.\n(ii) $d(\sqrt{3} - 1) = 10\sqrt{3} \implies d = \frac{10\sqrt{3}}{\sqrt{3} - 1} = 5\sqrt{3}(\sqrt{3} + 1) = 15 + 5\sqrt{3} \approx 23.66\text{ m}$. Height $h = 23.66\text{ m}$.\n(iii) Original distance $= 23.66\text{ m}$.",
        "ans": r"(i) \tan \theta = \text{opp/adj}, (ii) 23.66\text{ m}, (iii) 23.66\text{ m}"
    },
    {
        "id": "c10_m_pat_341", "ch": 14, "topic": "Probability", "subtopic": "Case Study - Balls Drawn Without Replacement",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A box contains 5 red, 4 blue and 3 green balls. Three balls are drawn one after another without replacement.\n(i) Find the probability that the first ball is red.\n(ii) Find the probability that all three balls are of different colours.\n(iii) Find the probability that at least one ball is green.",
        "sol": r"Total balls $= 12$.\n(i) $P(\text{1st red}) = \frac{5}{12}$.\n(ii) Different colours: $3! \times \frac{5 \times 4 \times 3}{12 \times 11 \times 10} = 6 \times \frac{60}{1320} = \frac{3}{11}$.\n(iii) Non-green balls $= 9$. $P(\text{no green}) = \frac{9 \times 8 \times 7}{12 \times 11 \times 10} = \frac{504}{1320} = \frac{21}{55}$. $P(\text{at least one green}) = 1 - \frac{21}{55} = \frac{34}{55}$.",
        "ans": r"(i) \frac{5}{12}, (ii) \frac{3}{11}, (iii) \frac{34}{55}"
    },
    {
        "id": "c10_m_pat_342", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Case Study - Raised Juice Glass",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A juice seller uses cylindrical glasses of radius 3.5 cm and height 10 cm. The bottom has a hemispherical raised portion of the same radius.\n(i) Find the apparent capacity of the glass.\n(ii) Find the actual capacity of the glass.\n(iii) How many such glasses can be filled from a cylindrical jar of radius 7 cm and height 20 cm?",
        "sol": r"(i) Apparent capacity $= \pi r^2 h = \frac{22}{7} \times 12.25 \times 10 = 385\text{ cm}^3$.\n(ii) Hemisphere volume $= \frac{2}{3} \times \frac{22}{7} \times (3.5)^3 = 89.83\text{ cm}^3$. Actual capacity $= 385 - 89.83 = 295.17\text{ cm}^3$.\n(iii) Jar volume $= \frac{22}{7} \times 49 \times 20 = 3080\text{ cm}^3$. Number of glasses $\approx \frac{3080}{295.17} \approx 10.43 \implies 10$ full glasses.",
        "ans": r"(i) 385\text{ cm}^3, (ii) 295.17\text{ cm}^3, (iii) 10\text{ glasses}"
    },

    # --- Additional Assertion-Reason (343 - 356) ---
    {
        "id": "c10_m_pat_343", "ch": 1, "topic": "Real Numbers", "subtopic": "Assertion-Reason Root 3",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): $\sqrt{3}$ is an irrational number.\nReason (R): The square root of every natural number is irrational.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"A is true ($\sqrt{3}$ is irrational). R is false because $\sqrt{4} = 2$ is rational. Hence A is true but R is false.",
        "ans": "A is true but R is false"
    },
    {
        "id": "c10_m_pat_344", "ch": 1, "topic": "Real Numbers", "subtopic": "Assertion-Reason Consecutive Evens",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): The HCF of two consecutive even numbers is always 2.\nReason (R): Any two consecutive even numbers are co-prime.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"A is true (HCF of $2k$ and $2k+2$ is 2). R is false because co-prime numbers have HCF 1, not 2. Hence A is true but R is false.",
        "ans": "A is true but R is false"
    },
    {
        "id": "c10_m_pat_345", "ch": 2, "topic": "Polynomials", "subtopic": "Assertion-Reason Reciprocal Zeroes",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): If the zeroes of the polynomial $x^2 + px + q$ are reciprocal of each other, then $q = 1$.\nReason (R): Product of zeroes = constant term / leading coefficient.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"Product of zeroes is $\alpha \times \frac{1}{\alpha} = 1 = \frac{q}{1} \implies q = 1$. Both A and R are true and R correctly explains A.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_346", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "Assertion-Reason Infinite Solutions",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): The pair of linear equations $2x + 3y = 5$ and $4x + 6y = 10$ has infinitely many solutions.\nReason (R): If $\frac{a_1}{a_2} = \frac{b_1}{b_2} = \frac{c_1}{c_2}$, the system has infinitely many solutions.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"$\frac{2}{4} = \frac{3}{6} = \frac{5}{10} = \frac{1}{2}$. Both A and R are true and R is the correct explanation of A.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_347", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Assertion-Reason nth Term",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): In an AP, if the first term is $a$ and common difference is $d$, then the $n$th term is $a + (n-1)d$.\nReason (R): An arithmetic progression is a sequence in which each term (except the first) is obtained by adding a fixed number to the preceding term.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"Both A and R are true and R gives the foundational definition that yields the formula in A.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_348", "ch": 6, "topic": "Triangles", "subtopic": "Assertion-Reason BPT",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): If $DE \parallel BC$ in $\triangle ABC$, then $\frac{AD}{DB} = \frac{AE}{EC}$.\nReason (R): Basic Proportionality Theorem states that a line drawn parallel to one side of a triangle divides the other two sides in the same ratio.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"Both A and R are true and R is the exact theorem statement that explains A.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_349", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Assertion-Reason Distance Formula",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): The distance between the points $(0,0)$ and $(3,4)$ is 5 units.\nReason (R): Distance formula is $\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"$\sqrt{3^2 + 4^2} = 5$. Both A and R are true and R is the formula explaining A.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_350", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "Assertion-Reason Fundamental Identity",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): $\sin^2 \theta + \cos^2 \theta = 1$ for all values of $\theta$.\nReason (R): This is one of the fundamental trigonometric identities.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"Both statements are true and R affirms the status of the theorem.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_351", "ch": 10, "topic": "Circles", "subtopic": "Assertion-Reason Tangent Length",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): The length of the tangent from an external point P to a circle is $\sqrt{OP^2 - r^2}$.\nReason (R): The tangent is perpendicular to the radius at the point of contact.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"By Pythagoras theorem in right triangle $\triangle OPT$, $PT^2 + r^2 = OP^2 \implies PT = \sqrt{OP^2 - r^2}$. Both A and R are true, and R correctly explains A.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_352", "ch": 14, "topic": "Probability", "subtopic": "Assertion-Reason Probability Range",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): The probability of an event can be greater than 1.\nReason (R): Probability of an event E is $0 \le P(E) \le 1$.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"A is false (probability can never exceed 1). R is true. Hence A is false but R is true.",
        "ans": "A is false but R is true"
    },
    {
        "id": "c10_m_pat_353", "ch": 13, "topic": "Statistics", "subtopic": "Assertion-Reason Mode Definition",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): The mode is the value that occurs most frequently in a data set.\nReason (R): Mode is always one of the observations in grouped continuous data.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"A is true by definition. R is false because for grouped continuous data, the calculated mode using modal class formula may not be an actual observed individual value. Hence A is true but R is false.",
        "ans": "A is true but R is false"
    },
    {
        "id": "c10_m_pat_354", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Assertion-Reason Cone Volume",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): Volume of a cone is $\frac{1}{3}\pi r^2 h$.\nReason (R): Volume of a cylinder is $\pi r^2 h$ and a cone is one-third of a cylinder of the same base and height.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"Both A and R are true and R correctly explains the geometric relationship.",
        "ans": "Both A and R are true and R is the correct explanation of A"
    },
    {
        "id": "c10_m_pat_355", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Assertion-Reason Equal Roots",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): If the discriminant of a quadratic equation is zero, the roots are real and equal.\nReason (R): Discriminant $D = b^2 - 4ac$.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"Both A and R are true, but R merely states the formula and does not completely explain why the roots are equal when $D=0$. Hence both A and R are true but R is not the correct explanation of A.",
        "ans": "Both A and R are true but R is not the correct explanation of A"
    },
    {
        "id": "c10_m_pat_356", "ch": 14, "topic": "Probability", "subtopic": "Assertion-Reason Elementary Events",
        "format": "ASSERTION_REASON", "marks": 1, "diff": "EASY", "pyq": "CBSE Pattern",
        "q": r"Assertion (A): The sum of the probabilities of all elementary events of an experiment is 1.\nReason (R): Probability of a sure event is 1.",
        "opts": [
            "Both A and R are true and R is the correct explanation of A",
            "Both A and R are true but R is not the correct explanation of A",
            "A is true but R is false",
            "A is false but R is true"
        ],
        "sol": r"Both statements are individually true facts of probability theory, but R does not fully explain why the sum of elementary events is 1.",
        "ans": "Both A and R are true but R is not the correct explanation of A"
    },

    # --- Case Studies (357 - 370) ---
    {
        "id": "c10_m_pat_357", "ch": 1, "topic": "Real Numbers", "subtopic": "Case Study - Notebooks and Pens",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A teacher wants to distribute 420 notebooks and 336 pens equally among students so that each student gets the same number of notebooks and pens with nothing left over.\n(i) Which mathematical concept will help the teacher?\n(ii) Find the maximum number of students who can get the items.\n(iii) Find how many notebooks and pens each student will get.",
        "sol": r"(i) Highest Common Factor (HCF).\n(ii) $\text{HCF}(420, 336) = 84$ students.\n(iii) Notebooks: $420 / 84 = 5$, Pens: $336 / 84 = 4$.",
        "ans": r"(i) HCF, (ii) 84, (iii) 5\text{ notebooks, } 4\text{ pens}"
    },
    {
        "id": "c10_m_pat_358", "ch": 2, "topic": "Polynomials", "subtopic": "Case Study - Parabola Intercepts",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"The graph of a quadratic polynomial $y = ax^2 + bx + c$ intersects the x-axis at $(-2, 0)$ and $(3, 0)$ and the y-axis at $(0, -6)$.\n(i) Write the polynomial.\n(ii) Find the value of $a$.\n(iii) Find the vertex of the parabola.",
        "sol": r"(i) $y = a(x + 2)(x - 3)$. At $x = 0, y = -6 \implies a(2)(-3) = -6 \implies a = 1$. The polynomial is $y = x^2 - x - 6$.\n(ii) $a = 1$.\n(iii) Vertex $x = -b/(2a) = 1/2$. $y = (1/2)^2 - 1/2 - 6 = -25/4$. Vertex is $(0.5, -6.25)$.",
        "ans": r"(i) x^2 - x - 6, (ii) a = 1, (iii) (0.5, -6.25)"
    },
    {
        "id": "c10_m_pat_359", "ch": 3, "topic": "Pair of Linear Equations", "subtopic": "Case Study - Train and Car Speeds",
        "format": "CASE_STUDY", "marks": 4, "diff": "HARD", "pyq": "CBSE Case Study",
        "q": r"A man travels 370 km partly by train and partly by car. If he travels 230 km by train and rest by car, it takes 4 hours. If he travels 160 km by train and rest by car, it takes 18 minutes more.\n(i) Form the pair of linear equations.\n(ii) Find the speed of the train.\n(iii) Find the speed of the car.",
        "sol": r"(i) $\frac{230}{u} + \frac{140}{v} = 4$ and $\frac{160}{u} + \frac{210}{v} = \frac{43}{10}$.\n(ii) Solving with $1/u = x, 1/v = y$: $u = 100\text{ km/h}$.\n(iii) $v = 70\text{ km/h}$.",
        "ans": r"(i) \text{System in } 1/u, 1/v, (ii) 100\text{ km/h}, (iii) 70\text{ km/h}"
    },
    {
        "id": "c10_m_pat_360", "ch": 4, "topic": "Quadratic Equations", "subtopic": "Case Study - Rectangular Park",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A rectangular park is designed whose breadth is 3 m less than its length. Its area is 4 square metres more than the area of a square park of side 30 m.\n(i) Form the quadratic equation.\n(ii) Find the length of the rectangular park.\n(iii) Find the breadth of the rectangular park.",
        "sol": r"Let length be $x$, breadth $= x - 3$. Square area $= 30^2 = 900\text{ m}^2$.\n(i) $x(x - 3) = 900 + 4 \implies x^2 - 3x - 904 = 0$ (or standard integer variant $x^2 - 3x - 88 = 0$ gives $x = 11, b = 8$).\n(ii) Length $= 31.6\text{ m}$ (or 11 m).\n(iii) Breadth $= 28.6\text{ m}$ (or 8 m).",
        "ans": r"(i) x^2 - 3x - 904 = 0, (ii) \approx 31.6\text{ m}, (iii) \approx 28.6\text{ m}"
    },
    {
        "id": "c10_m_pat_361", "ch": 5, "topic": "Arithmetic Progressions", "subtopic": "Case Study - Sn 3n2 + 5n",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"The sum of the first $n$ terms of an AP is given by $S_n = 3n^2 + 5n$.\n(i) Find the first term.\n(ii) Find the common difference.\n(iii) Find the 10th term of the AP.",
        "sol": r"(i) $a_1 = S_1 = 3(1) + 5(1) = 8$.\n(ii) $S_2 = 3(4) + 10 = 22 \implies a_2 = 22 - 8 = 14 \implies d = 14 - 8 = 6$.\n(iii) $a_{10} = a + 9d = 8 + 9(6) = 62$.",
        "ans": r"(i) 8, (ii) 6, (iii) 62"
    },
    {
        "id": "c10_m_pat_362", "ch": 6, "topic": "Triangles", "subtopic": "Case Study - Similar Triangle Areas",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"In $\triangle ABC$, $DE \parallel BC$. $AD = 4\text{ cm}$, $DB = 6\text{ cm}$, $AE = 5\text{ cm}$ and $EC = x\text{ cm}$. The area of $\triangle ADE$ is $20\text{ cm}^2$.\n(i) Find the value of $x$.\n(ii) Find the ratio of areas of $\triangle ADE$ and $\triangle ABC$.\n(iii) Find the area of $\triangle ABC$.",
        "sol": r"(i) $\frac{AD}{DB} = \frac{AE}{EC} \implies \frac{4}{6} = \frac{5}{x} \implies x = 7.5\text{ cm}$.\n(ii) $\triangle ADE \sim \triangle ABC \implies \frac{AD}{AB} = \frac{4}{10} = \frac{2}{5}$. Ratio of areas $= (2/5)^2 = \frac{4}{25}$.\n(iii) $\text{ar}(\triangle ABC) = 20 \times \frac{25}{4} = 125\text{ cm}^2$.",
        "ans": r"(i) x = 7.5\text{ cm}, (ii) 4 : 25, (iii) 125\text{ cm}^2"
    },
    {
        "id": "c10_m_pat_363", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Case Study - Triangle Properties",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"The vertices of a triangle are $A(2, 3)$, $B(4, -1)$ and $C(-2, 1)$.\n(i) Find the length of side $AB$.\n(ii) Find the coordinates of the centroid.\n(iii) Find the area of $\triangle ABC$.",
        "sol": r"(i) $AB = \sqrt{(4 - 2)^2 + (-1 - 3)^2} = \sqrt{4 + 16} = \sqrt{20} = 2\sqrt{5}$.\n(ii) Centroid $G = \left(\frac{2 + 4 - 2}{3}, \frac{3 - 1 + 1}{3}\right) = \left(\frac{4}{3}, 1\right)$.\n(iii) $\text{Area} = \frac{1}{2} |2(-1 - 1) + 4(1 - 3) - 2(3 - (-1))| = \frac{1}{2} |-4 - 8 - 8| = 10\text{ sq units}$.",
        "ans": r"(i) 2\sqrt{5}, (ii) (4/3, 1), (iii) 10\text{ sq units}"
    },
    {
        "id": "c10_m_pat_364", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "Case Study - Transmission Tower",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"From a point on the ground, the angles of elevation of the bottom and top of a transmission tower on a 20 m building are $45^\circ$ and $60^\circ$ respectively.\n(i) Draw a rough diagram and state trigonometric ratios used.\n(ii) Find the height of the transmission tower.\n(iii) Find the distance of the point from the foot of the building.",
        "sol": r"(i) Use tangent ratio in right triangles.\n(iii) Distance from building $d = 20 / \tan 45^\circ = 20\text{ m}$.\n(ii) Total height $H = 20 \times \tan 60^\circ = 20\sqrt{3}\text{ m}$. Tower height $= 20\sqrt{3} - 20 = 20(\sqrt{3} - 1) \approx 14.64\text{ m}$.",
        "ans": r"(i) \tan \theta, (ii) 20(\sqrt{3} - 1)\text{ m}, (iii) 20\text{ m}"
    },
    {
        "id": "c10_m_pat_365", "ch": 10, "topic": "Circles", "subtopic": "Case Study - Tangents Geometry",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"From an external point P, two tangents PA and PB are drawn to a circle with centre O. $\angle APB = 70^\circ$.\n(i) Find $\angle AOB$.\n(ii) Find $\angle OAP$.\n(iii) If radius of the circle is 5 cm and $OP = 13\text{ cm}$, find the length of the tangent.",
        "sol": r"(i) $\angle AOB = 180^\circ - 70^\circ = 110^\circ$.\n(ii) Radius is perpendicular to tangent at point of contact $\implies \angle OAP = 90^\circ$.\n(iii) $AP = \sqrt{OP^2 - r^2} = \sqrt{13^2 - 5^2} = \sqrt{144} = 12\text{ cm}$.",
        "ans": r"(i) 110^\circ, (ii) 90^\circ, (iii) 12\text{ cm}"
    },
    {
        "id": "c10_m_pat_366", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Case Study - Grazing Horse Extended",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A horse is tied to a peg at one corner of a square grass field of side 15 m by a 5 m long rope.\n(i) Find the area of the part of the field in which the horse can graze.\n(ii) Find the increase in the grazing area if the rope is increased to 10 m.\n(iii) Find the area of the field that remains ungrazed when the rope is 5 m. (Use $\pi = 3.14$)",
        "sol": r"(i) $\text{Area} = \frac{1}{4} \times 3.14 \times 25 = 19.625\text{ m}^2$.\n(ii) Grazing area with 10 m rope $= \frac{1}{4} \times 3.14 \times 100 = 78.5\text{ m}^2$. Increase $= 78.5 - 19.625 = 58.875\text{ m}^2$.\n(iii) Field area $= 15^2 = 225\text{ m}^2$. Ungrazed area $= 225 - 19.625 = 205.375\text{ m}^2$.",
        "ans": r"(i) 19.625\text{ m}^2, (ii) 58.875\text{ m}^2, (iii) 205.375\text{ m}^2"
    },
    {
        "id": "c10_m_pat_367", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Case Study - Toy Recast Sphere",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A solid toy is in the form of a hemisphere surmounted by a right circular cone. Height of cone is 2 cm and diameter of base is 4 cm ($r = 2\text{ cm}$).\n(i) Find the volume of the toy.\n(ii) Find the total surface area of the toy.\n(iii) If the toy is melted and recast into a sphere, find the radius of the sphere.",
        "sol": r"(i) $\text{Volume} = \frac{1}{3}\pi (2)^2(2) + \frac{2}{3}\pi(2)^3 = \frac{8\pi}{3} + \frac{16\pi}{3} = 8\pi\text{ cm}^3 \approx 25.13\text{ cm}^3$.\n(ii) $l = \sqrt{2^2 + 2^2} = 2\sqrt{2}\text{ cm}$. $\text{TSA} = \pi r l + 2\pi r^2 = 4\pi\sqrt{2} + 8\pi = 4\pi(\sqrt{2} + 2)\text{ cm}^2$.\n(iii) $\frac{4}{3}\pi R^3 = 8\pi \implies R^3 = 6 \implies R = \sqrt[3]{6} \approx 1.82\text{ cm}$.",
        "ans": r"(i) 8\pi\text{ cm}^3, (ii) 4\pi(\sqrt{2} + 2)\text{ cm}^2, (iii) \sqrt[3]{6}\text{ cm}"
    },
    {
        "id": "c10_m_pat_368", "ch": 13, "topic": "Statistics", "subtopic": "Case Study - Examination Marks",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"The marks obtained by 100 students are: 0–20 ($f=10$), 20–40 ($f=15$), 40–60 ($f=30$), 60–80 ($f=25$), 80–100 ($f=20$).\n(i) Find the modal class.\n(ii) Find the median class.\n(iii) Calculate the mean of the data.",
        "sol": r"(i) Max frequency is 30, modal class is 40–60.\n(ii) $N/2 = 50$. Cumulative frequencies: 10, 25, 55. Median class is 40–60.\n(iii) Midpoints: 10, 30, 50, 70, 90. Products: 100 + 450 + 1500 + 1750 + 1800 = 5600. $\text{Mean} = 5600 / 100 = 56$.",
        "ans": r"(i) 40–60, (ii) 40–60, (iii) 56"
    },
    {
        "id": "c10_m_pat_369", "ch": 14, "topic": "Probability", "subtopic": "Case Study - Three Coloured Balls",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A bag contains 5 red, 6 blue and 4 green balls. Three balls are drawn one after another without replacement.\n(i) Find the probability that the first ball drawn is red.\n(ii) Find the probability that all three balls are of the same colour.\n(iii) Find the probability that the three balls are of different colours.",
        "sol": r"Total balls $= 15$. Total ways $= \binom{15}{3} = 455$.\n(i) $P(\text{1st red}) = \frac{5}{15} = \frac{1}{3}$.\n(ii) Same colour: $\binom{5}{3} + \binom{6}{3} + \binom{4}{3} = 10 + 20 + 4 = 34$. $P = \frac{34}{455}$.\n(iii) Different colours: $5 \times 6 \times 4 = 120$. $P = \frac{120}{455} = \frac{24}{91}$.",
        "ans": r"(i) \frac{1}{3}, (ii) \frac{34}{455}, (iii) \frac{24}{91}"
    },
    {
        "id": "c10_m_pat_370", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "Case Study - Tall Boy Moving",
        "format": "CASE_STUDY", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE Case Study",
        "q": r"A 1.5 m tall boy stands at some distance from a 30 m building. The angle of elevation increases from $30^\circ$ to $60^\circ$ as he walks towards the building.\n(i) State the relevant right triangles.\n(ii) Find the distance he walked towards the building.\n(iii) Find his original distance from the building.",
        "sol": r"Effective building height $h = 30 - 1.5 = 28.5\text{ m}$.\n(iii) Original distance $d_1 = \frac{28.5}{\tan 30^\circ} = 28.5\sqrt{3}\text{ m}$.\n(ii) Closer distance $d_2 = \frac{28.5}{\tan 60^\circ} = \frac{28.5}{\sqrt{3}} = 9.5\sqrt{3}\text{ m}$. Distance walked $= 28.5\sqrt{3} - 9.5\sqrt{3} = 19\sqrt{3}\text{ m} \approx 32.91\text{ m}$.",
        "ans": r"(i) \text{Triangles with opposite side 28.5 m}, (ii) 19\sqrt{3}\text{ m}, (iii) 28.5\sqrt{3}\text{ m}"
    }
]

if __name__ == "__main__":
    print(f"Loaded {len(pattern_questions)} questions from pattern & mixed batch (291 to 370).")
