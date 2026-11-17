# Python script to generate Class 10 Math NCERT Questions (Chapters 8 to 14)
# Solved Examples + Exercise Questions with complete LaTeX formatting and solutions

ncert_chapters_8_to_14 = [
    # ==================== Chapter 8: Introduction to Trigonometry ====================
    {
        "id": "c10_m_ncert_ch8_ex1", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 1",
        "q": r"In $\triangle ABC$, right-angled at B, $AB = 24\text{ cm}$, $BC = 7\text{ cm}$. Determine: (i) $\sin A, \cos A$ (ii) $\sin C, \cos C$.",
        "sol": r"$AC = \sqrt{24^2 + 7^2} = \sqrt{576 + 49} = \sqrt{625} = 25\text{ cm}$. (i) $\sin A = \frac{BC}{AC} = \frac{7}{25}$, $\cos A = \frac{AB}{AC} = \frac{24}{25}$. (ii) $\sin C = \frac{AB}{AC} = \frac{24}{25}$, $\cos C = \frac{BC}{AC} = \frac{7}{25}$.",
        "ans": r"(i) \sin A = \frac{7}{25}, \cos A = \frac{24}{25}; (ii) \sin C = \frac{24}{25}, \cos C = \frac{7}{25}"
    },
    {
        "id": "c10_m_ncert_ch8_ex3", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "NCERT Example 3",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 3",
        "q": r"If $\sin A = \frac{3}{4}$, calculate $\cos A$ and $\tan A$.",
        "sol": r"$\cos A = \sqrt{1 - \sin^2 A} = \sqrt{1 - \frac{9}{16}} = \frac{\sqrt{7}}{4}$. $\tan A = \frac{\sin A}{\cos A} = \frac{3/4}{\sqrt{7}/4} = \frac{3}{\sqrt{7}}$.",
        "ans": r"\cos A = \frac{\sqrt{7}}{4}, \tan A = \frac{3}{\sqrt{7}}"
    },
    {
        "id": "c10_m_ncert_ch8_ex6", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "NCERT Example 6",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 6",
        "q": r"Evaluate: $\sin 60^\circ \cos 30^\circ + \sin 30^\circ \cos 60^\circ$.",
        "sol": r"$\left(\frac{\sqrt{3}}{2}\right)\left(\frac{\sqrt{3}}{2}\right) + \left(\frac{1}{2}\right)\left(\frac{1}{2}\right) = \frac{3}{4} + \frac{1}{4} = 1$.",
        "ans": r"1"
    },
    {
        "id": "c10_m_ncert_ch8_e8_2_q3", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "Exercise 8.2 Q3",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 8.2 Q3",
        "q": r"If $\tan (A + B) = \sqrt{3}$ and $\tan (A - B) = \frac{1}{\sqrt{3}}$ ($0^\circ < A + B \le 90^\circ, A > B$), find $A$ and $B$.",
        "sol": r"$A + B = 60^\circ$ and $A - B = 30^\circ$. Adding: $2A = 90^\circ \implies A = 45^\circ$. Subtracting: $2B = 30^\circ \implies B = 15^\circ$.",
        "ans": r"A = 45^\circ, B = 15^\circ"
    },
    {
        "id": "c10_m_ncert_ch8_e8_3_q3", "ch": 8, "topic": "Introduction to Trigonometry", "subtopic": "Exercise 8.3 Q3",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "NCERT Exercise 8.3 Q3",
        "q": r"If $\tan 2A = \cot (A - 18^\circ)$, where $2A$ is an acute angle, find the value of $A$.",
        "sol": r"$\tan 2A = \cot(90^\circ - 2A) = \cot(A - 18^\circ) \implies 90^\circ - 2A = A - 18^\circ \implies 3A = 108^\circ \implies A = 36^\circ$.",
        "ans": r"36^\circ"
    },

    # ==================== Chapter 9: Some Applications of Trigonometry ====================
    {
        "id": "c10_m_ncert_ch9_ex1", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 1",
        "q": r"A circus artist is climbing a 20 m long rope, which is tightly stretched and tied from the top of a vertical pole to the ground. Find the height of the pole, if the angle made by the rope with the ground level is $30^\circ$.",
        "sol": r"$\sin 30^\circ = \frac{h}{20} \implies \frac{1}{2} = \frac{h}{20} \implies h = 10\text{ m}$.",
        "ans": r"10\text{ m}"
    },
    {
        "id": "c10_m_ncert_ch9_ex2", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "NCERT Example 2",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Example 2",
        "q": r"A tree breaks due to storm and the broken part bends so that the top touches the ground making an angle $30^\circ$. The distance from the foot to the point where the top touches the ground is 8 m. Find the height of the tree.",
        "sol": r"Let standing part be $h$ and broken part be $l$. $\tan 30^\circ = \frac{h}{8} \implies h = \frac{8}{\sqrt{3}}$. $\cos 30^\circ = \frac{8}{l} \implies \frac{\sqrt{3}}{2} = \frac{8}{l} \implies l = \frac{16}{\sqrt{3}}$. Total tree height $= h + l = \frac{24}{\sqrt{3}} = 8\sqrt{3}\text{ m}$.",
        "ans": r"8\sqrt{3}\text{ m}"
    },
    {
        "id": "c10_m_ncert_ch9_e9_1_q7", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "Exercise 9.1 Q7",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 9.1 Q7",
        "q": r"From a point on the ground, the angles of elevation of the bottom and the top of a transmission tower fixed at the top of a 20 m high building are $45^\circ$ and $60^\circ$ respectively. Find the height of the tower.",
        "sol": r"Distance to building $d = 20 / \tan 45^\circ = 20\text{ m}$. Total height $= 20 \times \tan 60^\circ = 20\sqrt{3}\text{ m}$. Tower height $= 20\sqrt{3} - 20 = 20(\sqrt{3} - 1)\text{ m} \approx 14.64\text{ m}$.",
        "ans": r"20(\sqrt{3} - 1)\text{ m}"
    },
    {
        "id": "c10_m_ncert_ch9_e9_1_q10", "ch": 9, "topic": "Some Applications of Trigonometry", "subtopic": "Exercise 9.1 Q10",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "NCERT Exercise 9.1 Q10",
        "q": r"Two poles of equal heights are standing opposite each other on either side of the road, which is 80 m wide. From a point between them on the road, the angles of elevation are $60^\circ$ and $30^\circ$. Find the height of the poles and distances from poles.",
        "sol": r"Let height be $h$, distances be $x$ and $80 - x$. $\tan 60^\circ = h/x \implies h = x\sqrt{3}$. $\tan 30^\circ = h/(80 - x) \implies \frac{1}{\sqrt{3}} = \frac{x\sqrt{3}}{80 - x} \implies 80 - x = 3x \implies x = 20\text{ m}$. $h = 20\sqrt{3}\text{ m}$, distances: 20 m and 60 m.",
        "ans": r"h = 20\sqrt{3}\text{ m}, \text{distances: } 20\text{ m, } 60\text{ m}"
    },

    # ==================== Chapter 10: Circles ====================
    {
        "id": "c10_m_ncert_ch10_ex4", "ch": 10, "topic": "Circles", "subtopic": "NCERT Theorem / Example 4",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Theorem 10.2",
        "q": r"Prove that the lengths of tangents drawn from an external point to a circle are equal.",
        "sol": r"In right triangles $\triangle OAP$ and $\triangle OBP$: $OA = OB$ (radii), $OP = OP$ (common), $\angle OAP = \angle OBP = 90^\circ$. By RHS congruence criterion, $\triangle OAP \cong \triangle OBP \implies AP = BP$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_ncert_ch10_e10_2_q1", "ch": 10, "topic": "Circles", "subtopic": "Exercise 10.2 Q1",
        "format": "MCQ", "marks": 1, "diff": "EASY", "pyq": "NCERT Exercise 10.2 Q1",
        "q": r"From a point Q, the length of the tangent to a circle is 24 cm and the distance of Q from the centre is 25 cm. The radius of the circle is:",
        "opts": ["7 cm", "12 cm", "15 cm", "24.5 cm"],
        "sol": r"$r = \sqrt{OQ^2 - PQ^2} = \sqrt{25^2 - 24^2} = \sqrt{625 - 576} = \sqrt{49} = 7\text{ cm}$.",
        "ans": "7 cm"
    },
    {
        "id": "c10_m_ncert_ch10_e10_2_q8", "ch": 10, "topic": "Circles", "subtopic": "Exercise 10.2 Q8",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 10.2 Q8",
        "q": r"A quadrilateral ABCD is drawn to circumscribe a circle. Prove that $AB + CD = AD + BC$.",
        "sol": r"Tangents from external points are equal: $AP = AS, BP = BQ, CR = CQ, DR = DS$. Adding all equations: $(AP + BP) + (CR + DR) = (AS + DS) + (BQ + CQ) \implies AB + CD = AD + BC$.",
        "ans": r"Proof"
    },

    # ==================== Chapter 11: Areas Related to Circles ====================
    {
        "id": "c10_m_ncert_ch11_ex1", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 1",
        "q": r"Find the area of a sector of a circle with radius 6 cm if the angle of the sector is $60^\circ$.",
        "sol": r"$\text{Area} = \frac{60}{360} \times \frac{22}{7} \times 6^2 = \frac{1}{6} \times \frac{22}{7} \times 36 = \frac{132}{7}\text{ cm}^2 \approx 18.86\text{ cm}^2$.",
        "ans": r"\frac{132}{7}\text{ cm}^2"
    },
    {
        "id": "c10_m_ncert_ch11_e11_1_q2", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Exercise 11.1 Q2",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 11.1 Q2",
        "q": r"Find the area of a quadrant of a circle whose circumference is 22 cm.",
        "sol": r"$2\pi r = 22 \implies 2 \times \frac{22}{7} \times r = 22 \implies r = \frac{7}{2}\text{ cm}$. Area of quadrant $= \frac{1}{4}\pi r^2 = \frac{1}{4} \times \frac{22}{7} \times \frac{49}{4} = \frac{77}{8}\text{ cm}^2 = 9.625\text{ cm}^2$.",
        "ans": r"\frac{77}{8}\text{ cm}^2"
    },
    {
        "id": "c10_m_ncert_ch11_e11_1_q3", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Exercise 11.1 Q3",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 11.1 Q3",
        "q": r"The length of the minute hand of a clock is 14 cm. Find the area swept by the minute hand in 5 minutes.",
        "sol": r"Angle $\theta = 30^\circ$. $\text{Area} = \frac{30}{360} \times \frac{22}{7} \times 14^2 = \frac{1}{12} \times 616 = \frac{154}{3}\text{ cm}^2 \approx 51.33\text{ cm}^2$.",
        "ans": r"\frac{154}{3}\text{ cm}^2"
    },

    # ==================== Chapter 12: Surface Areas and Volumes ====================
    {
        "id": "c10_m_ncert_ch12_ex1", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Example 1",
        "q": r"2 cubes each of volume $64\text{ cm}^3$ are joined end to end. Find the surface area of the resulting cuboid.",
        "sol": r"Edge of cube $a = \sqrt[3]{64} = 4\text{ cm}$. Joined cuboid: $l = 8\text{ cm}, b = 4\text{ cm}, h = 4\text{ cm}$. $\text{Surface Area} = 2(lb + bh + hl) = 2(32 + 16 + 32) = 2(80) = 160\text{ cm}^2$.",
        "ans": r"160\text{ cm}^2"
    },
    {
        "id": "c10_m_ncert_ch12_e12_1_q2", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Exercise 12.1 Q2",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 12.1 Q2",
        "q": r"A vessel is in the form of a hollow hemisphere mounted by a hollow cylinder. The diameter of the hemisphere is 14 cm and total height is 13 cm. Find inner surface area.",
        "sol": r"$r = 7\text{ cm}$. Height of cylinder $h = 13 - 7 = 6\text{ cm}$. Inner $\text{SA} = 2\pi r h + 2\pi r^2 = 2\pi r(h + r) = 2 \times \frac{22}{7} \times 7 \times 13 = 44 \times 13 = 572\text{ cm}^2$.",
        "ans": r"572\text{ cm}^2"
    },
    {
        "id": "c10_m_ncert_ch12_e12_2_q1", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Exercise 12.2 Q1",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 12.2 Q1",
        "q": r"A solid is in the shape of a cone standing on a hemisphere with both their radii being equal to 1 cm and the height of the cone is equal to its radius. Find the volume of the solid in terms of $\pi$.",
        "sol": r"$V = \frac{1}{3}\pi (1)^2(1) + \frac{2}{3}\pi (1)^3 = \frac{1}{3}\pi + \frac{2}{3}\pi = \pi\text{ cm}^3$.",
        "ans": r"\pi\text{ cm}^3"
    },

    # ==================== Chapter 13: Statistics ====================
    {
        "id": "c10_m_ncert_ch13_ex1", "ch": 13, "topic": "Statistics", "subtopic": "NCERT Example 1",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Example 1",
        "q": r"Find the mean number of plants per house: 0–2(1), 2–4(2), 4–6(1), 6–8(5), 8–10(6), 10–12(2), 12–14(3).",
        "sol": r"Midpoints $x_i$: 1, 3, 5, 7, 9, 11, 13. Products $f_i x_i$: 1, 6, 5, 35, 54, 22, 39. $\sum f = 20, \sum f_i x_i = 162$. $\text{Mean} = 162/20 = 8.1\text{ plants}$.",
        "ans": r"8.1\text{ plants}"
    },
    {
        "id": "c10_m_ncert_ch13_e13_1_q3", "ch": 13, "topic": "Statistics", "subtopic": "Exercise 13.1 Q3",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "NCERT Exercise 13.1 Q3",
        "q": r"Daily pocket allowance mean is ₹18. Class: 11–13(7), 13–15(6), 15–17(9), 17–19(13), 19–21(f), 21–23(5), 23–25(4). Find $f$.",
        "sol": r"Midpoints: 12, 14, 16, 18, 20, 22, 24. Let $A = 18$. $d_i = -6, -4, -2, 0, 2, 4, 6$. $\sum f_i d_i = 7(-6) + 6(-4) + 9(-2) + 0 + f(2) + 5(4) + 4(6) = -42 - 24 - 18 + 2f + 20 + 24 = 2f - 40$. Since mean is 18, $\sum f_i d_i = 0 \implies 2f - 40 = 0 \implies f = 20$.",
        "ans": r"20"
    },
    {
        "id": "c10_m_ncert_ch13_e13_3_q2", "ch": 13, "topic": "Statistics", "subtopic": "Exercise 13.3 Q2",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "NCERT Exercise 13.3 Q2",
        "q": r"If the median of the distribution is 28.5, find $x$ and $y$: 0–10(5), 10–20(x), 20–30(20), 30–40(15), 40–50(y), 50–60(5); Total = 60.",
        "sol": r"$5 + x + 20 + 15 + y + 5 = 60 \implies x + y = 15$. Median 28.5 is in 20–30 ($l=20, cf=5+x, f=20, h=10$). $28.5 = 20 + \frac{30 - (5+x)}{20} \times 10 \implies 8.5 = \frac{25 - x}{2} \implies 17 = 25 - x \implies x = 8$. Then $y = 15 - 8 = 7$.",
        "ans": r"x = 8, y = 7"
    },

    # ==================== Chapter 14: Probability ====================
    {
        "id": "c10_m_ncert_ch14_ex4", "ch": 14, "topic": "Probability", "subtopic": "NCERT Example 4",
        "format": "MCQ", "marks": 1, "diff": "EASY", "pyq": "NCERT Example 4",
        "q": r"Which of the following cannot be the probability of an event?",
        "opts": ["2/3", "-1.5", "15%", "0.7"],
        "sol": r"Probability of an event can never be negative. Hence $-1.5$ cannot be a probability.",
        "ans": "-1.5"
    },
    {
        "id": "c10_m_ncert_ch14_ex5", "ch": 14, "topic": "Probability", "subtopic": "NCERT Example 5",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "NCERT Example 5",
        "q": r"If $P(E) = 0.05$, what is the probability of ‘not E’?",
        "sol": r"$P(\text{not } E) = 1 - P(E) = 1 - 0.05 = 0.95$.",
        "ans": r"0.95"
    },
    {
        "id": "c10_m_ncert_ch14_e14_1_q8", "ch": 14, "topic": "Probability", "subtopic": "Exercise 14.1 Q8",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "NCERT Exercise 14.1 Q8",
        "q": r"A bag contains 3 red balls and 5 black balls. A ball is drawn at random. What is the probability that it is (i) red? (ii) not red?",
        "sol": r"Total balls $= 8$. (i) $P(\text{Red}) = \frac{3}{8}$. (ii) $P(\text{Not red}) = 1 - \frac{3}{8} = \frac{5}{8}$.",
        "ans": r"(i) \frac{3}{8}, (ii) \frac{5}{8}"
    },
    {
        "id": "c10_m_ncert_ch14_e14_1_q14", "ch": 14, "topic": "Probability", "subtopic": "Exercise 14.1 Q14",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "NCERT Exercise 14.1 Q14",
        "q": r"One card is drawn from a well-shuffled deck of 52 cards. Find the probability of getting: (i) a king of red colour (ii) a face card (iii) the queen of diamonds.",
        "sol": r"(i) $P(\text{Red king}) = \frac{2}{52} = \frac{1}{26}$. (ii) $P(\text{Face card}) = \frac{12}{52} = \frac{3}{13}$. (iii) $P(\text{Queen of diamonds}) = \frac{1}{52}$.",
        "ans": r"(i) \frac{1}{26}, (ii) \frac{3}{13}, (iii) \frac{1}{52}"
    }
]

if __name__ == "__main__":
    print(f"Loaded {len(ncert_chapters_8_to_14)} NCERT questions for Chapters 8 to 14.")
