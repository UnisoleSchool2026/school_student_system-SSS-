# -*- coding: utf-8 -*-
"""
Class 10 Mathematics Question Bank: Chapters 6 to 10 (PYQs + Core Questions)
Chapter 6: Triangles (106-125)
Chapter 7: Coordinate Geometry (126-145)
Chapter 8: Introduction to Trigonometry (146-165)
Chapter 9: Some Applications of Trigonometry (166-175)
Chapter 10: Circles (176-190)
"""

chapters_6_to_10 = [
    # --- CHAPTER 6: TRIANGLES (106-125) ---
    {
        "id": "c10_m_pyq_106", "ch": 6, "topic": "Triangles", "subtopic": "Basic Proportionality Theorem",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"State the Basic Proportionality Theorem (Thales’ theorem).",
        "sol": r"If a line is drawn parallel to one side of a triangle to intersect the other two sides in distinct points, the other two sides are divided in the same ratio.",
        "ans": r"Statement of Thales' Theorem"
    },
    {
        "id": "c10_m_pyq_107", "ch": 6, "topic": "Triangles", "subtopic": "BPT Application",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"In $\triangle ABC$, $DE \parallel BC$, $AD = 4\text{ cm}$, $DB = 6\text{ cm}$, $AE = 5\text{ cm}$. Find $EC$.",
        "sol": r"By BPT, $\frac{AD}{DB} = \frac{AE}{EC} \implies \frac{4}{6} = \frac{5}{EC} \implies EC = \frac{30}{4} = 7.5\text{ cm}$.",
        "ans": r"7.5 cm"
    },
    {
        "id": "c10_m_pyq_108", "ch": 6, "topic": "Triangles", "subtopic": "Area of Similar Triangles",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"Prove that the areas of two similar triangles are proportional to the squares of the corresponding sides.",
        "sol": r"Let $\triangle ABC \sim \triangle PQR$. Draw altitudes $AM \perp BC$ and $PN \perp QR$. $\frac{\text{area}(ABC)}{\text{area}(PQR)} = \frac{\frac{1}{2}BC \cdot AM}{\frac{1}{2}QR \cdot PN} = \frac{BC}{QR} \cdot \frac{AM}{PN}$. Since $\triangle ABM \sim \triangle PQN$, $\frac{AM}{PN} = \frac{AB}{PQ} = \frac{BC}{QR}$. Thus ratio of areas $= \left(\frac{BC}{QR}\right)^2$.",
        "ans": r"Proof of Area Theorem"
    },
    {
        "id": "c10_m_pyq_109", "ch": 6, "topic": "Triangles", "subtopic": "Area Ratio to Side Ratio",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Two similar triangles have areas 49 cm² and 81 cm². Find the ratio of their corresponding sides.",
        "sol": r"$\frac{\text{Side}_1}{\text{Side}_2} = \sqrt{\frac{49}{81}} = \frac{7}{9} = 7 : 9$.",
        "ans": r"7 : 9"
    },
    {
        "id": "c10_m_pyq_110", "ch": 6, "topic": "Triangles", "subtopic": "BPT Ratio",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"In $\triangle ABC$, if $DE \parallel BC$ and $AD/DB = 3/5$, find $AE/EC$.",
        "sol": r"By BPT, $\frac{AE}{EC} = \frac{AD}{DB} = \frac{3}{5}$.",
        "ans": r"3/5"
    },
    {
        "id": "c10_m_pyq_111", "ch": 6, "topic": "Triangles", "subtopic": "AAA Similarity Criterion",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"If in two triangles the corresponding angles are equal, prove that the triangles are similar.",
        "sol": r"Given $\angle A = \angle D, \angle B = \angle E, \angle C = \angle F$. Cut $DP = AB$ and $DQ = AC$. Join $PQ$. $\triangle ABC \cong \triangle DPQ \implies \angle B = \angle DPQ = \angle E \implies PQ \parallel EF$. By BPT on $\triangle DEF$, $\frac{DP}{PE} = \frac{DQ}{QF} \implies \frac{AB}{DE} = \frac{AC}{DF}$. Similarly $= \frac{BC}{EF}$. Hence $\triangle ABC \sim \triangle DEF$.",
        "ans": r"AAA Similarity Proof"
    },
    {
        "id": "c10_m_pyq_112", "ch": 6, "topic": "Triangles", "subtopic": "Pythagoras Theorem",
        "format": "LONG_ANSWER", "marks": 5, "diff": "HARD", "pyq": "CBSE Classic Theorem",
        "q": r"In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides. Prove it (Pythagoras theorem).",
        "sol": r"In right $\triangle ABC$ ($\angle B = 90^\circ$), draw $BD \perp AC$. $\triangle ADB \sim \triangle ABC \implies \frac{AD}{AB} = \frac{AB}{AC} \implies AB^2 = AD \cdot AC$. $\triangle BDC \sim \triangle ABC \implies \frac{CD}{BC} = \frac{BC}{AC} \implies BC^2 = CD \cdot AC$. Adding: $AB^2 + BC^2 = AC(AD + CD) = AC^2$.",
        "ans": r"Pythagoras Theorem Proof"
    },
    {
        "id": "c10_m_pyq_113", "ch": 6, "topic": "Triangles", "subtopic": "Altitudes in Isosceles Triangle",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"ABC is an isosceles triangle with $AB = AC$. If $BD$ and $CE$ are altitudes from B and C to the opposite sides, prove that $BD = CE$.",
        "sol": r"In $\triangle BDC$ and $\triangle CEB$: $\angle BDC = \angle CEB = 90^\circ$, $\angle DCB = \angle EBC$ (angles opposite to equal sides), $BC = BC$ (common). By AAS congruence, $\triangle BDC \cong \triangle CEB \implies BD = CE$ (CPCTC).",
        "ans": r"BD = CE"
    },
    {
        "id": "c10_m_pyq_114", "ch": 6, "topic": "Triangles", "subtopic": "BPT Line Ratios",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"In $\triangle ABC$, D and E are points on AB and AC such that $DE \parallel BC$. If $AD = 2.4\text{ cm}$, $AE = 3.2\text{ cm}$ and $EC = 4.8\text{ cm}$, find $AD/AB$.",
        "sol": r"$AC = AE + EC = 3.2 + 4.8 = 8.0\text{ cm}$. Since $DE \parallel BC$, $\frac{AD}{AB} = \frac{AE}{AC} = \frac{3.2}{8.0} = \frac{2}{5}$.",
        "ans": r"2/5"
    },
    {
        "id": "c10_m_pyq_115", "ch": 6, "topic": "Triangles", "subtopic": "Perimeter Ratio",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The perimeters of two similar triangles are 30 cm and 20 cm. If one side of the first triangle is 12 cm, find the corresponding side of the second triangle.",
        "sol": r"Ratio of sides = Ratio of perimeters $\implies \frac{12}{x} = \frac{30}{20} = \frac{3}{2} \implies 3x = 24 \implies x = 8\text{ cm}$.",
        "ans": r"8 cm"
    },
    {
        "id": "c10_m_pyq_116", "ch": 6, "topic": "Triangles", "subtopic": "Similarity Proof",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"In $\triangle PQR$, if $ST \parallel QR$ and $\frac{PS}{SQ} = \frac{PT}{TR}$, prove that $\triangle PST \sim \triangle PQR$.",
        "sol": r"Since $ST \parallel QR$, corresponding angles $\angle PST = \angle PQR$ and $\angle PTS = \angle PRQ$. Angle $\angle P$ is common. By AAA similarity criterion, $\triangle PST \sim \triangle PQR$.",
        "ans": r"Proved"
    },
    {
        "id": "c10_m_pyq_117", "ch": 6, "topic": "Triangles", "subtopic": "Equal Areas Congruence",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If the areas of two similar triangles are equal, prove that the triangles are congruent.",
        "sol": r"$\triangle ABC \sim \triangle DEF \implies \frac{\text{area}(ABC)}{\text{area}(DEF)} = \left(\frac{AB}{DE}\right)^2 = \left(\frac{BC}{EF}\right)^2 = \left(\frac{AC}{DF}\right)^2 = 1 \implies AB = DE, BC = EF, AC = DF$. By SSS, $\triangle ABC \cong \triangle DEF$.",
        "ans": r"Proved"
    },
    {
        "id": "c10_m_pyq_118", "ch": 6, "topic": "Triangles", "subtopic": "Midpoint Theorem Converse",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"In a triangle, the line drawn from the mid-point of one side parallel to another side bisects the third side. Prove it.",
        "sol": r"In $\triangle ABC$, $D$ is midpoint of $AB$ ($AD/DB = 1$) and $DE \parallel BC$. By Thales theorem, $\frac{AE}{EC} = \frac{AD}{DB} = 1 \implies AE = EC$. Hence $E$ bisects $AC$.",
        "ans": r"Proved"
    },
    {
        "id": "c10_m_pyq_119", "ch": 6, "topic": "Triangles", "subtopic": "Right Triangle Property",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"ABC is a right triangle right-angled at C. Let $BC = a, AB = c, AC = b$. Prove that $a^2 + b^2 = c^2$.",
        "sol": r"By Pythagoras theorem, $(\text{hypotenuse})^2 = (\text{base})^2 + (\text{perpendicular})^2 \implies c^2 = a^2 + b^2$.",
        "ans": r"a^2 + b^2 = c^2"
    },
    {
        "id": "c10_m_pyq_120", "ch": 6, "topic": "Triangles", "subtopic": "BPT Section",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"In $\triangle ABC$, $DE \parallel BC$ and $\frac{AD}{BD} = \frac{3}{5}$. If $AC = 5.6\text{ cm}$, find $AE$.",
        "sol": r"$\frac{AE}{AC} = \frac{AD}{AB} = \frac{3}{3+5} = \frac{3}{8}$. $AE = \frac{3}{8} \times 5.6 = 3 \times 0.7 = 2.1\text{ cm}$.",
        "ans": r"2.1 cm"
    },
    {
        "id": "c10_m_pyq_121", "ch": 6, "topic": "Triangles", "subtopic": "Ratio of Areas",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The ratio of the areas of two similar triangles is equal to the square of the ratio of their corresponding sides. Prove.",
        "sol": r"Using altitude construction in $\triangle ABC \sim \triangle DEF$, $\frac{\text{area}(ABC)}{\text{area}(DEF)} = \frac{BC \cdot h_1}{EF \cdot h_2} = \frac{BC}{EF} \cdot \frac{AB}{DE} = \left(\frac{AB}{DE}\right)^2$.",
        "ans": r"Proved"
    },
    {
        "id": "c10_m_pyq_122", "ch": 6, "topic": "Triangles", "subtopic": "AA Similarity",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"In two triangles ABC and DEF, if $\angle A = \angle D$, $\angle B = \angle E$, then prove $\triangle ABC \sim \triangle DEF$.",
        "sol": r"Sum of angles of triangle is $180^\circ \implies \angle C = 180^\circ - (\angle A + \angle B) = 180^\circ - (\angle D + \angle E) = \angle F$. All corresponding angles are equal, so $\triangle ABC \sim \triangle DEF$ by AAA.",
        "ans": r"Proved"
    },
    {
        "id": "c10_m_pyq_123", "ch": 6, "topic": "Triangles", "subtopic": "Converse of BPT",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If a line divides any two sides of a triangle in the same ratio, then the line is parallel to the third side (converse of BPT). Prove.",
        "sol": r"Assume line $DE$ is not parallel to $BC$. Draw $DE' \parallel BC$. By BPT, $\frac{AD}{DB} = \frac{AE'}{E'C}$. Given $\frac{AD}{DB} = \frac{AE}{EC} \implies \frac{AE}{EC} = \frac{AE'}{E'C} \implies \frac{AE+EC}{EC} = \frac{AE'+E'C}{E'C} \implies \frac{AC}{EC} = \frac{AC}{E'C} \implies EC = E'C$. Thus $E$ and $E'$ coincide, so $DE \parallel BC$.",
        "ans": r"Proved"
    },
    {
        "id": "c10_m_pyq_124", "ch": 6, "topic": "Triangles", "subtopic": "Apollonius Theorem",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE HOTS",
        "q": r"In $\triangle ABC$, if AD is the median, prove that $AB^2 + AC^2 = 2AD^2 + 2BD^2$.",
        "sol": r"Draw altitude $AM \perp BC$. In $\triangle ABM$, $AB^2 = AM^2 + BM^2$. In $\triangle ACM$, $AC^2 = AM^2 + CM^2$. In $\triangle ADM$, $AM^2 = AD^2 - DM^2$. $BM = BD - DM$, $CM = CD + DM = BD + DM$. Adding expressions: $AB^2 + AC^2 = 2AM^2 + (BD-DM)^2 + (BD+DM)^2 = 2(AD^2 - DM^2) + 2BD^2 + 2DM^2 = 2AD^2 + 2BD^2$.",
        "ans": r"AB^2 + AC^2 = 2(AD^2 + BD^2)"
    },
    {
        "id": "c10_m_pyq_125", "ch": 6, "topic": "Triangles", "subtopic": "Sides to Area Ratio",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The sides of two similar triangles are in the ratio 4 : 9. Find the ratio of their areas.",
        "sol": r"Ratio of areas $= (4/9)^2 = 16 : 81$.",
        "ans": r"16 : 81"
    },

    # --- CHAPTER 7: COORDINATE GEOMETRY (126-145) ---
    {
        "id": "c10_m_pyq_126", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Distance from Origin",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the distance between the points (3, 4) and (0, 0).",
        "sol": r"$d = \sqrt{3^2 + 4^2} = \sqrt{9 + 16} = \sqrt{25} = 5$.",
        "ans": r"5 units"
    },
    {
        "id": "c10_m_pyq_127", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Midpoint Formula",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the midpoint of the line segment joining (2, 6) and (8, 4).",
        "sol": r"$M = \left(\frac{2+8}{2}, \frac{6+4}{2}\right) = (5, 5)$.",
        "ans": r"(5, 5)"
    },
    {
        "id": "c10_m_pyq_128", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Area of Right Triangle",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the area of the triangle with vertices (0,0), (4,0) and (0,3).",
        "sol": r"Vertices lie along axes forming a right triangle with base 4 and height 3. $\text{Area} = \frac{1}{2} \times 4 \times 3 = 6\text{ sq units}$.",
        "ans": r"6 sq units"
    },
    {
        "id": "c10_m_pyq_129", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Section Formula",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the coordinates of the point which divides the line segment joining (2,3) and (8,9) in the ratio 1 : 2.",
        "sol": r"$x = \frac{1(8) + 2(2)}{1+2} = \frac{12}{3} = 4$. $y = \frac{1(9) + 2(3)}{1+2} = \frac{15}{3} = 5$. Point is $(4, 5)$.",
        "ans": r"(4, 5)"
    },
    {
        "id": "c10_m_pyq_130", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Distance Formula",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the distance between the points A(2, 3) and B(4, 1).",
        "sol": r"$d = \sqrt{(4-2)^2 + (1-3)^2} = \sqrt{4 + 4} = \sqrt{8} = 2\sqrt{2}$.",
        "ans": r"2\sqrt{2}"
    },
    {
        "id": "c10_m_pyq_131", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Centroid Formula",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the coordinates of the centroid of the triangle whose vertices are (1,2), (3,4) and (5,0).",
        "sol": r"$G = \left(\frac{1+3+5}{3}, \frac{2+4+0}{3}\right) = (9/3, 6/3) = (3, 2)$.",
        "ans": r"(3, 2)"
    },
    {
        "id": "c10_m_pyq_132", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Collinear Points",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the value of $k$ if the points (1,2), (3,4) and (5,k) are collinear.",
        "sol": r"Slope of AB = Slope of BC $\implies \frac{4-2}{3-1} = \frac{k-4}{5-3} \implies 1 = \frac{k-4}{2} \implies k - 4 = 2 \implies k = 6$.",
        "ans": r"k = 6"
    },
    {
        "id": "c10_m_pyq_133", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Area of Triangle",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the area of the triangle formed by the points (2,3), (−1,0) and (2,−4).",
        "sol": r"$\\text{Area} = \\frac{1}{2}|2(0 - (-4)) + (-1)(-4 - 3) + 2(3 - 0)| = \\frac{1}{2}|8 + 7 + 6| = \\frac{21}{2} = 10.5\\text{ sq units}$.",
        "ans": r"10.5 sq units"
    },
    {
        "id": "c10_m_pyq_134", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Section Formula",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the coordinates of the point which divides the join of (−1,7) and (4,−3) in the ratio 2 : 3.",
        "sol": r"$x = \frac{2(4) + 3(-1)}{2+3} = \frac{8-3}{5} = 1$. $y = \frac{2(-3) + 3(7)}{2+3} = \frac{-6+21}{5} = 3$. Point is $(1, 3)$.",
        "ans": r"(1, 3)"
    },
    {
        "id": "c10_m_pyq_135", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Finding Abscissa",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If the distance between the points (x, 2) and (3, 4) is 5, find the value(s) of $x$.",
        "sol": r"$(x-3)^2 + (4-2)^2 = 5^2 \implies (x-3)^2 + 4 = 25 \implies (x-3)^2 = 21 \implies x = 3 \pm \sqrt{21}$.",
        "ans": r"x = 3 \pm \sqrt{21}"
    },
    {
        "id": "c10_m_pyq_136", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Internal Section",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the coordinates of the point which divides the line segment joining the points (4, −3) and (8, 5) in the ratio 3 : 1 internally.",
        "sol": r"$x = \frac{3(8) + 1(4)}{3+1} = \frac{28}{4} = 7$. $y = \frac{3(5) + 1(-3)}{3+1} = \frac{12}{4} = 3$. Coordinates: $(7, 3)$.",
        "ans": r"(7, 3)"
    },
    {
        "id": "c10_m_pyq_137", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Distance",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the distance between the points P(−6, 7) and Q(−1, −5).",
        "sol": r"$d = \sqrt{(-1 - (-6))^2 + (-5 - 7)^2} = \sqrt{5^2 + (-12)^2} = \sqrt{25 + 144} = \sqrt{169} = 13$.",
        "ans": r"13 units"
    },
    {
        "id": "c10_m_pyq_138", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Area of Triangle",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the area of the triangle whose vertices are (1, −1), (−4, 6) and (−3, −5).",
        "sol": r"$\text{Area} = \frac{1}{2}|1(6 - (-5)) + (-4)(-5 - (-1)) + (-3)(-1 - 6)| = \frac{1}{2}|1(11) + (-4)(-4) + (-3)(-7)| = \frac{1}{2}|11 + 16 + 21| = \frac{48}{2} = 24\text{ sq units}$.",
        "ans": r"24 sq units"
    },
    {
        "id": "c10_m_pyq_139", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Collinearity Condition",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the value of $k$ such that the points A(2, 3), B(4, $k$) and C(6, −3) are collinear.",
        "sol": r"$\text{Area} = 0 \implies 2(k - (-3)) + 4(-3 - 3) + 6(3 - k) = 0 \implies 2k + 6 - 24 + 18 - 6k = 0 \implies -4k = 0 \implies k = 0$.",
        "ans": r"k = 0"
    },
    {
        "id": "c10_m_pyq_140", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Centroid",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the coordinates of the centroid of the triangle whose vertices are A(−1, 0), B(5, −2) and C(8, 2).",
        "sol": r"$G = \left(\frac{-1+5+8}{3}, \frac{0-2+2}{3}\right) = (12/3, 0/3) = (4, 0)$.",
        "ans": r"(4, 0)"
    },
    {
        "id": "c10_m_pyq_141", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Parallelogram Diagonals",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If the points A(6, 1), B(8, 2), C(9, 4) and D(p, 3) are the vertices of a parallelogram, find the value of $p$.",
        "sol": r"Diagonals bisect each other $\implies \text{Midpoint of AC} = \text{Midpoint of BD}$. $\frac{6+9}{2} = \frac{8+p}{2} \implies 15 = 8 + p \implies p = 7$.",
        "ans": r"p = 7"
    },
    {
        "id": "c10_m_pyq_142", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Ratio of Division",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the ratio in which the line segment joining the points (−3, 10) and (6, −8) is divided by the point (−1, 6).",
        "sol": r"Let ratio be $k : 1$. $x = \frac{6k - 3}{k + 1} = -1 \implies 6k - 3 = -k - 1 \implies 7k = 2 \implies k = 2/7$. Ratio is $2 : 7$.",
        "ans": r"2 : 7"
    },
    {
        "id": "c10_m_pyq_143", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Points of Trisection",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the coordinates of the points of trisection of the line segment joining (2, −2) and (−7, 4).",
        "sol": r"First point P divides in 1:2: $P = \left(\frac{1(-7)+2(2)}{3}, \frac{1(4)+2(-2)}{3}\right) = (-1, 0)$. Second point Q divides in 2:1: $Q = \left(\frac{2(-7)+1(2)}{3}, \frac{2(4)+1(-2)}{3}\right) = (-4, 2)$.",
        "ans": r"(-1, 0) and (-4, 2)"
    },
    {
        "id": "c10_m_pyq_144", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Area of Quadrilateral",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"Find the area of the quadrilateral whose vertices are (1, 1), (7, −3), (12, 2) and (7, 21).",
        "sol": r"Divide into $\triangle ABC$ and $\triangle ACD$. $\text{Area}(\triangle ABC) = \frac{1}{2}|1(-3-2) + 7(2-1) + 12(1-(-3))| = \frac{1}{2}|-5 + 7 + 48| = 25$. $\text{Area}(\triangle ACD) = \frac{1}{2}|1(2-21) + 12(21-1) + 7(1-2)| = \frac{1}{2}|-19 + 240 - 7| = 107$. Total area $= 25 + 107 = 132\text{ sq units}$.",
        "ans": r"132 sq units"
    },
    {
        "id": "c10_m_pyq_145", "ch": 7, "topic": "Coordinate Geometry", "subtopic": "Midpoint Condition",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If the midpoint of the line segment joining the points A(3, 4) and B(k, 6) is P(x, y) and $x+y=10$, find the value of $k$.",
        "sol": r"$x = \frac{3+k}{2}$, $y = \frac{4+6}{2} = 5$. Since $x + y = 10 \implies x + 5 = 10 \implies x = 5 \implies \frac{3+k}{2} = 5 \implies 3 + k = 10 \implies k = 7$.",
        "ans": r"k = 7"
    },

    # --- CHAPTER 8: INTRODUCTION TO TRIGONOMETRY (146-165) ---
    {
        "id": "c10_m_pyq_146", "ch": 8, "topic": "Trigonometry", "subtopic": "Basic Ratios",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $\sin A = \frac{3}{5}$, find $\cos A$ and $\tan A$ (A is acute).",
        "sol": r"$\cos A = \sqrt{1 - \sin^2 A} = \sqrt{1 - 9/25} = 4/5$. $\tan A = \sin A / \cos A = 3/4$.",
        "ans": r"\cos A = 4/5, \tan A = 3/4"
    },
    {
        "id": "c10_m_pyq_147", "ch": 8, "topic": "Trigonometry", "subtopic": "Ratio Manipulation",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $\tan \theta = \frac{4}{3}$, find the value of $\frac{\sin \theta + \cos \theta}{\sin \theta - \cos \theta}$.",
        "sol": r"Divide numerator and denominator by $\cos\theta$: $\frac{\tan\theta + 1}{\tan\theta - 1} = \frac{4/3 + 1}{4/3 - 1} = \frac{7/3}{1/3} = 7$.",
        "ans": r"7"
    },
    {
        "id": "c10_m_pyq_148", "ch": 8, "topic": "Trigonometry", "subtopic": "Evaluation",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Evaluate: $\sin 60^\circ \cos 30^\circ + \sin 30^\circ \cos 60^\circ$.",
        "sol": r"$\left(\frac{\sqrt{3}}{2}\right)\left(\frac{\sqrt{3}}{2}\right) + \left(\frac{1}{2}\right)\left(\frac{1}{2}\right) = \frac{3}{4} + \frac{1}{4} = 1$.",
        "ans": r"1"
    },
    {
        "id": "c10_m_pyq_149", "ch": 8, "topic": "Trigonometry", "subtopic": "Simultaneous Angle Equations",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If $\sin(A+B) = 1$ and $\cos(A-B) = 1$, find A and B ($0^\circ < A, B < 90^\circ$).",
        "sol": r"$\sin(A+B) = 1 \implies A+B = 90^\circ$. $\cos(A-B) = 1 \implies A-B = 0^\circ$. Thus $A = B = 45^\circ$.",
        "ans": r"A = 45°, B = 45°"
    },
    {
        "id": "c10_m_pyq_150", "ch": 8, "topic": "Trigonometry", "subtopic": "Fundamental Identity Proof",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Prove that $\sin^2 A + \cos^2 A = 1$.",
        "sol": r"In right $\triangle ABC$ at B: $AB^2 + BC^2 = AC^2$. Divide by $AC^2$: $\left(\frac{AB}{AC}\right)^2 + \left(\frac{BC}{AC}\right)^2 = 1 \implies \cos^2 A + \sin^2 A = 1$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pyq_151", "ch": 8, "topic": "Trigonometry", "subtopic": "Basic Ratios",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $\cos \theta = \frac{7}{25}$, find $\sin \theta$ and $\tan \theta$ ($\theta$ acute).",
        "sol": r"$\sin\theta = \sqrt{1 - 49/625} = 24/25$. $\tan\theta = 24/7$.",
        "ans": r"\sin\theta = 24/25, \tan\theta = 24/7"
    },
    {
        "id": "c10_m_pyq_152", "ch": 8, "topic": "Trigonometry", "subtopic": "Complex Evaluation",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"Evaluate: $\frac{\sin 30^\circ + \tan 45^\circ - \cos 60^\circ}{\sec 30^\circ + \cos 45^\circ + \cot 60^\circ}$.",
        "sol": r"Numerator: $1/2 + 1 - 1/2 = 1$. Denominator: $\frac{2}{\sqrt{3}} + \frac{1}{\sqrt{2}} + \frac{1}{\sqrt{3}} = \frac{3}{\sqrt{3}} + \frac{1}{\sqrt{2}} = \sqrt{3} + \frac{1}{\sqrt{2}} = \frac{\sqrt{6}+1}{\sqrt{2}}$. Value $= \frac{\sqrt{2}}{\sqrt{6}+1}$.",
        "ans": r"\frac{\sqrt{2}}{\sqrt{6}+1}"
    },
    {
        "id": "c10_m_pyq_153", "ch": 8, "topic": "Trigonometry", "subtopic": "Identity Application",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $\tan A = \frac{5}{12}$, find the value of $\sec A$.",
        "sol": r"$\sec A = \sqrt{1 + \tan^2 A} = \sqrt{1 + 25/144} = \sqrt{169/144} = 13/12$.",
        "ans": r"13/12"
    },
    {
        "id": "c10_m_pyq_154", "ch": 8, "topic": "Trigonometry", "subtopic": "Algebraic Identity",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Prove that $(\sin A + \cos A)^2 + (\sin A - \cos A)^2 = 2$.",
        "sol": r"$\text{LHS} = (\sin^2 A + \cos^2 A + 2\sin A\cos A) + (\sin^2 A + \cos^2 A - 2\sin A\cos A) = 1 + 1 = 2 = \text{RHS}$.",
        "ans": r"2"
    },
    {
        "id": "c10_m_pyq_155", "ch": 8, "topic": "Trigonometry", "subtopic": "Triple Angle Value",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If $\sin A = \frac{1}{2}$, find the value of $3\cos A - 4\cos^3 A$.",
        "sol": r"$\sin A = 1/2 \implies A = 30^\circ$. $\cos 30^\circ = \sqrt{3}/2$. $3(\sqrt{3}/2) - 4(3\sqrt{3}/8) = \frac{3\sqrt{3}}{2} - \frac{3\sqrt{3}}{2} = 0$.",
        "ans": r"0"
    },
    {
        "id": "c10_m_pyq_156", "ch": 8, "topic": "Trigonometry", "subtopic": "Evaluation",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Evaluate: $2\tan^2 45^\circ + \cos^2 30^\circ - \sin^2 60^\circ$.",
        "sol": r"$2(1)^2 + (\sqrt{3}/2)^2 - (\sqrt{3}/2)^2 = 2 + 3/4 - 3/4 = 2$.",
        "ans": r"2"
    },
    {
        "id": "c10_m_pyq_157", "ch": 8, "topic": "Trigonometry", "subtopic": "Fraction Identity",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $\cot \theta = \frac{7}{8}$, evaluate $\frac{(1+\sin \theta)(1-\sin \theta)}{(1+\cos \theta)(1-\cos \theta)}$.",
        "sol": r"$\frac{1 - \sin^2\theta}{1 - \cos^2\theta} = \frac{\cos^2\theta}{\sin^2\theta} = \cot^2\theta = (7/8)^2 = 49/64$.",
        "ans": r"49/64"
    },
    {
        "id": "c10_m_pyq_158", "ch": 8, "topic": "Trigonometry", "subtopic": "Identity Proof",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE Classic",
        "q": r"Prove that $\frac{\sin A}{1 + \cos A} + \frac{1 + \cos A}{\sin A} = 2\csc A$.",
        "sol": r"$\text{LHS} = \frac{\sin^2 A + (1+\cos A)^2}{\sin A(1+\cos A)} = \frac{\sin^2 A + 1 + 2\cos A + \cos^2 A}{\sin A(1+\cos A)} = \frac{2 + 2\cos A}{\sin A(1+\cos A)} = \frac{2(1+\cos A)}{\sin A(1+\cos A)} = \frac{2}{\sin A} = 2\csc A$.",
        "ans": r"2\csc A"
    },
    {
        "id": "c10_m_pyq_159", "ch": 8, "topic": "Trigonometry", "subtopic": "Linear Ratios",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If $\sec \theta = \frac{13}{5}$, find the value of $\frac{2\sin \theta - 3\cos \theta}{4\sin \theta - 9\cos \theta}$.",
        "sol": r"$\cos\theta = 5/13 \implies \sin\theta = 12/13, \tan\theta = 12/5$. Divide numerator and denominator by $\cos\theta$: $\frac{2\tan\theta - 3}{4\tan\theta - 9} = \frac{2(12/5) - 3}{4(12/5) - 9} = \frac{24/5 - 15/5}{48/5 - 45/5} = \frac{9/5}{3/5} = 3$.",
        "ans": r"3"
    },
    {
        "id": "c10_m_pyq_160", "ch": 8, "topic": "Trigonometry", "subtopic": "Angle Difference",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Evaluate: $\sin 60^\circ \cos 30^\circ - \sin 30^\circ \cos 60^\circ$.",
        "sol": r"$(\sqrt{3}/2)(\sqrt{3}/2) - (1/2)(1/2) = 3/4 - 1/4 = 2/4 = 1/2$.",
        "ans": r"1/2"
    },
    {
        "id": "c10_m_pyq_161", "ch": 8, "topic": "Trigonometry", "subtopic": "Tangent Angle System",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If $\tan(A+B) = \sqrt{3}$ and $\tan(A-B) = \frac{1}{\sqrt{3}}$, find A and B.",
        "sol": r"$A+B = 60^\circ, A-B = 30^\circ \implies 2A = 90^\circ \implies A = 45^\circ, B = 15^\circ$.",
        "ans": r"A = 45°, B = 15°"
    },
    {
        "id": "c10_m_pyq_162", "ch": 8, "topic": "Trigonometry", "subtopic": "Radical Identity",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Prove that $\sqrt{\frac{1-\cos A}{1+\cos A}} = \frac{\sin A}{1+\cos A}$.",
        "sol": r"Multiply inside radical by $\frac{1+\cos A}{1+\cos A}$: $\sqrt{\frac{1-\cos^2 A}{(1+\cos A)^2}} = \sqrt{\frac{\sin^2 A}{(1+\cos A)^2}} = \frac{\sin A}{1+\cos A}$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pyq_163", "ch": 8, "topic": "Trigonometry", "subtopic": "Sum to Tangent",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If $\sin \theta + \cos \theta = \sqrt{2}$, find $\tan \theta$.",
        "sol": r"Divide by $\sqrt{2}$: $\frac{1}{\sqrt{2}}\sin\theta + \frac{1}{\sqrt{2}}\cos\theta = 1 \implies \cos(\theta - 45^\circ) = 1 \implies \theta = 45^\circ \implies \tan 45^\circ = 1$.",
        "ans": r"1"
    },
    {
        "id": "c10_m_pyq_164", "ch": 8, "topic": "Trigonometry", "subtopic": "Value Substitution",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"Evaluate: $\frac{\cos 45^\circ}{\sec 30^\circ + \csc 30^\circ}$.",
        "sol": r"$\frac{1/\sqrt{2}}{2/\sqrt{3} + 2} = \frac{1/\sqrt{2}}{(2 + 2\sqrt{3})/\sqrt{3}} = \frac{\sqrt{3}}{\sqrt{2}(2\sqrt{3} + 2)} = \frac{\sqrt{3}}{2\sqrt{6} + 2\sqrt{2}} = \frac{3\sqrt{2} - \sqrt{6}}{8}$.",
        "ans": r"\frac{3\sqrt{2} - \sqrt{6}}{8}"
    },
    {
        "id": "c10_m_pyq_165", "ch": 8, "topic": "Trigonometry", "subtopic": "Identity Evaluation",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If $\csc \theta = 2$, find the value of $\frac{1}{\tan \theta} + \frac{\sin \theta}{1 - \cos \theta}$.",
        "sol": r"$\csc\theta = 2 \implies \theta = 30^\circ$. $\tan 30^\circ = 1/\sqrt{3} \implies 1/\tan 30^\circ = \sqrt{3}$. $\frac{\sin 30^\circ}{1 - \cos 30^\circ} = \frac{1/2}{1 - \sqrt{3}/2} = \frac{1}{2 - \sqrt{3}} = 2 + \sqrt{3}$. Sum $= \sqrt{3} + 2 + \sqrt{3} = 2 + 2\sqrt{3}$.",
        "ans": r"2 + 2\sqrt{3}"
    },

    # --- CHAPTER 9: APPLICATIONS OF TRIGONOMETRY (166-175) ---
    {
        "id": "c10_m_pyq_166", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Height of Tower",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A tower stands vertically on the ground. From a point on the ground which is 20 m away from the foot of the tower, the angle of elevation of the top of the tower is 60°. Find the height of the tower.",
        "sol": r"$\tan 60^\circ = h / 20 \implies \sqrt{3} = h / 20 \implies h = 20\sqrt{3}\text{ m}$.",
        "ans": r"20\sqrt{3} m"
    },
    {
        "id": "c10_m_pyq_167", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Distance from Tower",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The angle of elevation of the top of a tower from a point on the ground is 30°. If the height of the tower is 30 m, find the distance of the point from the foot of the tower.",
        "sol": r"$\tan 30^\circ = 30 / d \implies 1/\sqrt{3} = 30 / d \implies d = 30\sqrt{3}\text{ m}$.",
        "ans": r"30\sqrt{3} m"
    },
    {
        "id": "c10_m_pyq_168", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Transmission Tower",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"From a point on the ground, the angles of elevation of the bottom and the top of a transmission tower fixed at the top of a 20 m high building are 45° and 60° respectively. Find the height of the tower.",
        "sol": r"Let distance be $x$. $\tan 45^\circ = 20 / x \implies x = 20\text{ m}$. Total height $H = x \tan 60^\circ = 20\sqrt{3}\text{ m}$. Tower height $= 20\sqrt{3} - 20 = 20(\sqrt{3} - 1)\text{ m} \approx 14.64\text{ m}$.",
        "ans": r"20(\sqrt{3}-1) m"
    },
    {
        "id": "c10_m_pyq_169", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Ladder Angle",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A ladder 15 m long just reaches the top of a vertical wall. If the ladder makes an angle of 60° with the wall, find the height of the wall.",
        "sol": r"Angle with wall is $60^\circ \implies \cos 60^\circ = h / 15 \implies 1/2 = h / 15 \implies h = 7.5\text{ m}$.",
        "ans": r"7.5 m"
    },
    {
        "id": "c10_m_pyq_170", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Cloud & Reflection",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE Classic HOTS",
        "q": r"The angle of elevation of a cloud from a point 60 m above a lake is 30° and the angle of depression of its reflection in the lake is 60°. Find the height of the cloud.",
        "sol": r"Let cloud height be $H$. Distance of cloud above observation $= H - 60$. Distance of reflection below observation $= H + 60$. $\tan 30^\circ = \frac{H-60}{x} \implies x = \sqrt{3}(H-60)$. $\tan 60^\circ = \frac{H+60}{x} \implies x = \frac{H+60}{\sqrt{3}}$. Equating: $3(H-60) = H + 60 \implies 2H = 240 \implies H = 120\text{ m}$.",
        "ans": r"120 m"
    },
    {
        "id": "c10_m_pyq_171", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Two Equal Poles",
        "format": "LONG_ANSWER", "marks": 4, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Two poles of equal heights are standing opposite each other on either side of a road 80 m wide. From a point between them on the road, the angles of elevation of the top of the poles are 60° and 30° respectively. Find the height of the poles and the distance of the point from the poles.",
        "sol": r"Let distances be $x$ and $80-x$. $h = x\tan 60^\circ = x\sqrt{3}$. $h = (80-x)\tan 30^\circ = \frac{80-x}{\sqrt{3}}$. $3x = 80 - x \implies 4x = 80 \implies x = 20\text{ m}$. Distances are $20\text{ m}$ and $60\text{ m}$. Height $h = 20\sqrt{3}\text{ m}$.",
        "ans": r"Height = 20\sqrt{3} m; Distances: 20 m and 60 m"
    },
    {
        "id": "c10_m_pyq_172", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Moving Observer",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A 1.5 m tall boy is standing at some distance from a 30 m tall building. The angle of elevation from his eye to the top of the building increases from 30° to 60° as he walks towards the building. Find the distance he walked.",
        "sol": r"Effective building height $= 30 - 1.5 = 28.5\text{ m}$. $d_1 = \frac{28.5}{\tan 30^\circ} = 28.5\sqrt{3}$. $d_2 = \frac{28.5}{\tan 60^\circ} = \frac{28.5}{\sqrt{3}} = 9.5\sqrt{3}$. Distance walked $= 28.5\sqrt{3} - 9.5\sqrt{3} = 19\sqrt{3}\text{ m}$.",
        "ans": r"19\sqrt{3} m"
    },
    {
        "id": "c10_m_pyq_173", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Tower and Building",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The angle of elevation of the top of a building from the foot of a tower is 30° and the angle of elevation of the top of the tower from the foot of the building is 60°. If the tower is 50 m high, find the height of the building.",
        "sol": r"Distance between them $d = \frac{50}{\tan 60^\circ} = \frac{50}{\sqrt{3}}$. Building height $h = d \tan 30^\circ = \frac{50}{\sqrt{3}} \times \frac{1}{\sqrt{3}} = \frac{50}{3} = 16\frac{2}{3}\text{ m}$.",
        "ans": r"16.67 m (50/3 m)"
    },
    {
        "id": "c10_m_pyq_174", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Building and Cable Tower",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"From the top of a 7 m high building, the angle of elevation of the top of a cable tower is 60° and the angle of depression of its foot is 45°. Determine the height of the tower.",
        "sol": r"Horizontal distance $x = 7 / \tan 45^\circ = 7\text{ m}$. Additional height of cable tower $= 7 \tan 60^\circ = 7\sqrt{3}$. Total tower height $= 7 + 7\sqrt{3} = 7(\sqrt{3} + 1)\text{ m}$.",
        "ans": r"7(\sqrt{3} + 1) m"
    },
    {
        "id": "c10_m_pyq_175", "ch": 9, "topic": "Applications of Trigonometry", "subtopic": "Chimney Height",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"An observer 1.5 m tall is 28.5 m away from a chimney. The angle of elevation of the top of the chimney from her eyes is 45°. What is the height of the chimney?",
        "sol": r"$h_{\text{top}} = 28.5 \tan 45^\circ = 28.5\text{ m}$. Total chimney height $= 28.5 + 1.5 = 30\text{ m}$.",
        "ans": r"30 m"
    },

    # --- CHAPTER 10: CIRCLES (176-190) ---
    {
        "id": "c10_m_pyq_176", "ch": 10, "topic": "Circles", "subtopic": "Tangent Radius Perpendicularity",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE Theorem",
        "q": r"Prove that the tangent at any point of a circle is perpendicular to the radius through the point of contact.",
        "sol": r"Take any point $Q$ on tangent $XY$ other than contact point $P$. $Q$ lies outside the circle, so $OQ > OP$ (radius). Thus $OP$ is the shortest distance from $O$ to line $XY$. Since the shortest distance is perpendicular, $OP \perp XY$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pyq_177", "ch": 10, "topic": "Circles", "subtopic": "Equal Tangents Theorem",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE Standard Theorem",
        "q": r"Prove that the lengths of tangents drawn from an external point to a circle are equal.",
        "sol": r"In $\triangle OPA$ and $\triangle OPB$: $\angle OAP = \angle OBP = 90^\circ$, $OP = OP$ (common hypotenuse), $OA = OB$ (radii). By RHS, $\triangle OPA \cong \triangle OPB \implies PA = PB$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pyq_178", "ch": 10, "topic": "Circles", "subtopic": "Supplementary Angles",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"From a point P outside a circle with centre O, two tangents touch the circle at A and B. If $\angle APB = 60^\circ$, find $\angle AOB$.",
        "sol": r"$\angle AOB + \angle APB = 180^\circ \implies \angle AOB = 180^\circ - 60^\circ = 120^\circ$.",
        "ans": r"120°"
    },
    {
        "id": "c10_m_pyq_179", "ch": 10, "topic": "Circles", "subtopic": "Angles Subtended at Centre",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If two tangents are drawn to a circle from an external point, prove that they subtend equal angles at the centre.",
        "sol": r"From $\triangle OPA \cong \triangle OPB$, $\angle AOP = \angle BOP$ by CPCTC.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pyq_180", "ch": 10, "topic": "Circles", "subtopic": "Tangent Length by Pythagoras",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A tangent PQ at a point P of a circle of radius 5 cm meets a line through the centre O at a point Q so that $OQ = 12\text{ cm}$. Find the length of PQ.",
        "sol": r"$OP \perp PQ \implies PQ = \sqrt{OQ^2 - OP^2} = \sqrt{12^2 - 5^2} = \sqrt{144 - 25} = \sqrt{119}\text{ cm}$.",
        "ans": r"\sqrt{119} cm"
    },
    {
        "id": "c10_m_pyq_181", "ch": 10, "topic": "Circles", "subtopic": "Concentric Circles Chord",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Two concentric circles are of radii 5 cm and 3 cm. Find the length of the chord of the larger circle which touches the smaller circle.",
        "sol": r"Half chord length $= \sqrt{5^2 - 3^2} = \sqrt{16} = 4\text{ cm}$. Total chord $= 2 \times 4 = 8\text{ cm}$.",
        "ans": r"8 cm"
    },
    {
        "id": "c10_m_pyq_182", "ch": 10, "topic": "Circles", "subtopic": "Parallelogram to Rhombus",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Prove that the parallelogram circumscribing a circle is a rhombus.",
        "sol": r"Let $ABCD$ circumscribe circle. Tangents from vertices: $AP=AS, BP=BQ, CR=CQ, DR=DS \implies AB + CD = AD + BC$. Since $ABCD$ is parallelogram, $AB=CD$ and $AD=BC \implies 2AB = 2AD \implies AB = AD$. Adjacent sides equal $\implies ABCD$ is a rhombus.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pyq_183", "ch": 10, "topic": "Circles", "subtopic": "Angle Subtended",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"If from an external point P of a circle with centre O, two tangents PT and PS are drawn such that $\angle TPS = 60^\circ$, find $\angle TOP$ and $\angle OSP$.",
        "sol": r"$OP$ bisects $\angle TPS \implies \angle TPO = 30^\circ$. In right $\triangle OTP$, $\angle TOP = 90^\circ - 30^\circ = 60^\circ$. Radius $OS \perp PS \implies \angle OSP = 90^\circ$.",
        "ans": r"\angle TOP = 60°, \angle OSP = 90°"
    },
    {
        "id": "c10_m_pyq_184", "ch": 10, "topic": "Circles", "subtopic": "Angle Between Tangents",
        "format": "VERY_SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"In the given figure, if TP and TQ are the two tangents to a circle with centre O so that $\angle POQ = 110^\circ$, find $\angle PTQ$.",
        "sol": r"$\angle PTQ = 180^\circ - 110^\circ = 70^\circ$.",
        "ans": r"70°"
    },
    {
        "id": "c10_m_pyq_185", "ch": 10, "topic": "Circles", "subtopic": "Supplementary Proof",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Prove that the angle between the two tangents drawn from an external point to a circle is supplementary to the angle subtended by the line segment joining the points of contact at the centre.",
        "sol": r"In quadrilateral $OAPB$, $\angle OAP = \angle OBP = 90^\circ$. Sum of angles is $360^\circ \implies \angle APB + \angle AOB + 180^\circ = 360^\circ \implies \angle APB + \angle AOB = 180^\circ$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pyq_186", "ch": 10, "topic": "Circles", "subtopic": "Inscribed Triangle Tangents",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A circle is inscribed in a triangle ABC with sides $AB = 12\text{ cm}$, $BC = 8\text{ cm}$ and $CA = 10\text{ cm}$. Find the lengths of the tangents from the vertices to the points of contact.",
        "sol": r"Semiperimeter $s = (12+8+10)/2 = 15\text{ cm}$. Tangent from A $= s - a = 15 - 8 = 7\text{ cm}$. Tangent from B $= s - b = 15 - 10 = 5\text{ cm}$. Tangent from C $= s - c = 15 - 12 = 3\text{ cm}$.",
        "ans": r"From A: 7 cm, From B: 5 cm, From C: 3 cm"
    },
    {
        "id": "c10_m_pyq_187", "ch": 10, "topic": "Circles", "subtopic": "Trigonometry with Tangent",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"If the angle between two tangents drawn from an external point P to a circle of radius a and centre O is 60°, find OP.",
        "sol": r"$\angle APO = 30^\circ$. In right $\triangle OAP$, $\sin 30^\circ = OA / OP = a / OP \implies 1/2 = a / OP \implies OP = 2a$.",
        "ans": r"2a"
    },
    {
        "id": "c10_m_pyq_188", "ch": 10, "topic": "Circles", "subtopic": "Concentric Bisected Chord",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Prove that in two concentric circles, the chord of the larger circle which touches the smaller circle is bisected at the point of contact.",
        "sol": r"Radius of smaller circle to point of contact $P$ is perpendicular to chord $AB$. The perpendicular from the centre to a chord bisects the chord $\implies AP = PB$.",
        "ans": r"Proof"
    },
    {
        "id": "c10_m_pyq_189", "ch": 10, "topic": "Circles", "subtopic": "Angle Calculation",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Two tangents PA and PB are drawn from an external point P to a circle with centre O. If $\angle APB = 80^\circ$, find $\angle AOB$ and $\angle OAP$.",
        "sol": r"$\angle AOB = 180^\circ - 80^\circ = 100^\circ$. Radius is perpendicular to tangent $\implies \angle OAP = 90^\circ$.",
        "ans": r"\angle AOB = 100°, \angle OAP = 90°"
    },
    {
        "id": "c10_m_pyq_190", "ch": 10, "topic": "Circles", "subtopic": "Tangent Length",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"From a point P, 10 cm away from the centre of a circle of radius 6 cm, a tangent PT is drawn. Find the length of the tangent.",
        "sol": r"$PT = \sqrt{10^2 - 6^2} = \sqrt{100 - 36} = \sqrt{64} = 8\text{ cm}$.",
        "ans": r"8 cm"
    }
]

print(f"Loaded {len(chapters_6_to_10)} questions from Chapters 6 to 10.")
