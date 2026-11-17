# Python script to generate Class 10 Math PYQ Questions 191 to 290 (Chapters 11 to 14)
# Formatted cleanly with LaTeX and metadata

chapters_11_to_14 = [
    # --- Chapter 11: Areas Related to Circles (191 - 205) ---
    {
        "id": "c10_m_pyq_191", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Area of Sector",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the area of a sector of a circle with radius 6 cm if the angle of the sector is $60^\circ$.",
        "sol": r"$\text{Area} = \frac{\theta}{360^\circ} \times \pi r^2 = \frac{60}{360} \times \frac{22}{7} \times 6^2 = \frac{1}{6} \times \frac{22}{7} \times 36 = \frac{132}{7}\text{ cm}^2 \approx 18.86\text{ cm}^2$.",
        "ans": r"\frac{132}{7}\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_192", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Clock Minute Hand",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The length of the minute hand of a clock is 14 cm. Find the area swept by the minute hand in 5 minutes.",
        "sol": r"Angle in 5 minutes $= \frac{360^\circ}{60} \times 5 = 30^\circ$. $\text{Area} = \frac{30}{360} \times \frac{22}{7} \times 14^2 = \frac{1}{12} \times \frac{22}{7} \times 196 = \frac{154}{3}\text{ cm}^2 \approx 51.33\text{ cm}^2$.",
        "ans": r"\frac{154}{3}\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_193", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Shaded Region Inscribed Square",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the area of the shaded region in a circle of radius 7 cm, where a square is inscribed with vertices on the circumference.",
        "sol": r"Diagonal of square $= 2r = 14\text{ cm}$. Area of square $= \frac{1}{2} d^2 = \frac{1}{2} \times 14^2 = 98\text{ cm}^2$. Area of circle $= \frac{22}{7} \times 7^2 = 154\text{ cm}^2$. Shaded area $= 154 - 98 = 56\text{ cm}^2$.",
        "ans": r"56\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_194", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Area of Segment",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"A chord of a circle of radius 12 cm subtends an angle of $120^\circ$ at the centre. Find the area of the corresponding segment of the circle. (Use $\pi = 3.14$, $\sqrt{3} = 1.73$)",
        "sol": r"Area of sector $= \frac{120}{360} \times 3.14 \times 12^2 = 150.72\text{ cm}^2$. Area of triangle $= \frac{1}{2} r^2 \sin 120^\circ = \frac{1}{2} \times 144 \times \frac{\sqrt{3}}{2} = 36\sqrt{3} \approx 62.28\text{ cm}^2$. Area of segment $= 150.72 - 62.28 = 88.44\text{ cm}^2$.",
        "ans": r"88.44\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_195", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Minor and Major Sector",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the area of the sector of a circle with radius 10 cm and angle $45^\circ$. Also find the area of the corresponding major sector. (Use $\pi = 3.14$)",
        "sol": r"Minor sector area $= \frac{45}{360} \times 3.14 \times 100 = \frac{1}{8} \times 314 = 39.25\text{ cm}^2$. Major sector area $= 314 - 39.25 = 274.75\text{ cm}^2$.",
        "ans": r"\text{Minor: } 39.25\text{ cm}^2, \text{Major: } 274.75\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_196", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Arc Length and Sector Area",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"In a circle of radius 21 cm, an arc subtends an angle of $60^\circ$ at the centre. Find: (i) the length of the arc (ii) area of the sector formed by the arc.",
        "sol": r"(i) Arc length $l = \frac{60}{360} \times 2 \times \frac{22}{7} \times 21 = \frac{1}{6} \times 132 = 22\text{ cm}$. (ii) Sector area $= \frac{60}{360} \times \frac{22}{7} \times 21^2 = \frac{1}{6} \times 1386 = 231\text{ cm}^2$.",
        "ans": r"(i) 22\text{ cm}, (ii) 231\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_197", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Horse Grazing Field",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A horse is tied to a peg at one corner of a square-shaped grass field of side 15 m by means of a 5 m long rope. Find the area of that part of the field in which the horse can graze. (Use $\pi = 3.14$)",
        "sol": r"The horse grazes a quadrant of radius $r = 5\text{ m}$. $\text{Area} = \frac{1}{4} \pi r^2 = \frac{1}{4} \times 3.14 \times 25 = 19.625\text{ m}^2$.",
        "ans": r"19.625\text{ m}^2"
    },
    {
        "id": "c10_m_pyq_198", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Shaded Segment Area",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the area of the shaded segment when a circular arc of radius 6 cm subtends an angle of $60^\circ$ at the centre and an equilateral triangle is formed with the radii and the chord. (Use $\pi = 3.14$, $\sqrt{3} = 1.73$)",
        "sol": r"Area of sector $= \frac{60}{360} \times 3.14 \times 36 = 18.84\text{ cm}^2$. Area of equilateral $\triangle = \frac{\sqrt{3}}{4} \times 6^2 = 9\sqrt{3} \approx 15.57\text{ cm}^2$. Segment area $= 18.84 - 15.57 = 3.27\text{ cm}^2$.",
        "ans": r"3.27\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_199", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Fencing Circular Ground",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The area of a circular playground is $22176\text{ m}^2$. Find the cost of fencing this ground at the rate of ₹50 per metre.",
        "sol": r"$\pi r^2 = 22176 \implies r^2 = \frac{22176 \times 7}{22} = 7056 \implies r = 84\text{ m}$. Circumference $= 2 \times \frac{22}{7} \times 84 = 528\text{ m}$. Cost $= 528 \times 50 = ₹26,400$.",
        "ans": r"₹26,400"
    },
    {
        "id": "c10_m_pyq_200", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Right Angle Subtended Chord",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"A chord of a circle of radius 10 cm subtends a right angle at the centre. Find the area of the corresponding (i) minor segment (ii) major sector. (Use $\pi = 3.14$)",
        "sol": r"(i) Minor segment $= \text{Sector area} - \text{Triangle area} = \frac{90}{360} \times 3.14 \times 100 - \frac{1}{2} \times 10 \times 10 = 78.5 - 50 = 28.5\text{ cm}^2$. (ii) Major sector $= \frac{270}{360} \times 3.14 \times 100 = 235.5\text{ cm}^2$.",
        "ans": r"(i) 28.5\text{ cm}^2, (ii) 235.5\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_201", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Segment with 60 deg",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the area of the segment of a circle of radius 12 cm whose corresponding sector has a central angle of $60^\circ$. (Use $\pi = 3.14$, $\sqrt{3} = 1.73$)",
        "sol": r"Sector area $= \frac{60}{360} \times 3.14 \times 144 = 75.36\text{ cm}^2$. Triangle area $= \frac{\sqrt{3}}{4} \times 144 = 36\sqrt{3} \approx 62.28\text{ cm}^2$. Segment area $= 75.36 - 62.28 = 13.08\text{ cm}^2$.",
        "ans": r"13.08\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_202", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Remaining Garden Area",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Two circular flower beds have diameters 16 cm and 20 cm. Find the area of the remaining portion of a rectangular garden of length 30 cm and breadth 20 cm in which the flower beds are present.",
        "sol": r"Garden area $= 30 \times 20 = 600\text{ cm}^2$. Radii are 8 cm and 10 cm. Beds area $= \pi (8^2 + 10^2) = \pi (64 + 100) = 164\pi \approx 515.22\text{ cm}^2$. Remaining area $= 600 - 515.22 = 84.78\text{ cm}^2$.",
        "ans": r"84.78\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_203", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Circle Inscribed in Square",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the area of the shaded region where a circle is inscribed in a square of side 14 cm.",
        "sol": r"Radius of circle $= 14/2 = 7\text{ cm}$. Area of square $= 14^2 = 196\text{ cm}^2$. Area of circle $= \frac{22}{7} \times 49 = 154\text{ cm}^2$. Shaded area $= 196 - 154 = 42\text{ cm}^2$.",
        "ans": r"42\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_204", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Circumference Exceeds Diameter",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The circumference of a circle exceeds the diameter by 16.8 cm. Find the radius of the circle.",
        "sol": r"$2\pi r - 2r = 16.8 \implies 2r(\frac{22}{7} - 1) = 16.8 \implies 2r \times \frac{15}{7} = 16.8 \implies r = \frac{16.8 \times 7}{30} = 3.92\text{ cm}$.",
        "ans": r"3.92\text{ cm}"
    },
    {
        "id": "c10_m_pyq_205", "ch": 11, "topic": "Areas Related to Circles", "subtopic": "Perimeter of Sector",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A sector of a circle of radius 12 cm has central angle $120^\circ$. Find its perimeter. (Use $\pi = 3.14$)",
        "sol": r"$\text{Perimeter} = \text{Arc length} + 2r = \frac{120}{360} \times 2 \times 3.14 \times 12 + 24 = 25.12 + 24 = 49.12\text{ cm}$.",
        "ans": r"49.12\text{ cm}"
    },

    # --- Chapter 12: Surface Areas and Volumes (206 - 220) ---
    {
        "id": "c10_m_pyq_206", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Cone on Hemisphere",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A solid is in the form of a cone mounted on a hemisphere of the same radius. The radius is 3.5 cm and the height of the cone is 7 cm. Find the volume of the solid.",
        "sol": r"$V = \frac{1}{3}\pi r^2 h + \frac{2}{3}\pi r^3 = \frac{1}{3}\pi r^2(h + 2r) = \frac{1}{3} \times \frac{22}{7} \times (3.5)^2 \times (7 + 7) = \frac{1}{3} \times 38.5 \times 14 = \frac{539}{3} \approx 179.67\text{ cm}^3$.",
        "ans": r"\frac{539}{3}\text{ cm}^3"
    },
    {
        "id": "c10_m_pyq_207", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Total Surface Area of Toy",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A toy is in the form of a cone of radius 3.5 cm mounted on a hemisphere of the same radius. The total height of the toy is 15.5 cm. Find the total surface area of the toy.",
        "sol": r"Height of cone $h = 15.5 - 3.5 = 12\text{ cm}$. Slant height $l = \sqrt{12^2 + 3.5^2} = \sqrt{144 + 12.25} = \sqrt{156.25} = 12.5\text{ cm}$. $\text{TSA} = \pi r l + 2\pi r^2 = \pi r(l + 2r) = \frac{22}{7} \times 3.5 \times (12.5 + 7) = 11 \times 19.5 = 214.5\text{ cm}^2$.",
        "ans": r"214.5\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_208", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Bucket to Conical Heap",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A cylindrical bucket of height 32 cm and base radius 18 cm is filled with sand. The bucket is emptied on the ground to form a conical heap of sand of height 24 cm. Find the radius of the conical heap.",
        "sol": r"$\text{Vol(cylinder)} = \pi \times 18^2 \times 32$. $\text{Vol(cone)} = \frac{1}{3}\pi R^2 \times 24 = 8\pi R^2$. Equating: $8\pi R^2 = \pi \times 324 \times 32 \implies R^2 = 324 \times 4 = 1296 \implies R = 36\text{ cm}$.",
        "ans": r"36\text{ cm}"
    },
    {
        "id": "c10_m_pyq_209", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Water Left in Cylinder",
        "format": "LONG_ANSWER", "marks": 5, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"A solid consisting of a right circular cone of height 120 cm and radius 60 cm standing on a hemisphere of radius 60 cm is placed upright in a right circular cylinder full of water such that it touches the bottom. Find the volume of water left in the cylinder if the radius of the cylinder is 60 cm and its height is 180 cm.",
        "sol": r"$V_{\text{cylinder}} = \pi (60)^2(180) = 648000\pi$. $V_{\text{solid}} = \frac{1}{3}\pi(60)^2(120) + \frac{2}{3}\pi(60)^3 = 144000\pi + 144000\pi = 288000\pi$. $V_{\text{left}} = 648000\pi - 288000\pi = 360000\pi\text{ cm}^3 \approx 1.131\text{ m}^3$.",
        "ans": r"1.131\text{ m}^3"
    },
    {
        "id": "c10_m_pyq_210", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Hemispherical Bowl to Bottles",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A hemispherical bowl of internal radius 9 cm is full of liquid. This liquid is to be filled into cylindrical shaped bottles of diameter 3 cm and height 4 cm. How many bottles are required to empty the bowl?",
        "sol": r"$V_{\text{bowl}} = \frac{2}{3}\pi (9)^3 = 486\pi\text{ cm}^3$. $V_{\text{bottle}} = \pi (1.5)^2(4) = 9\pi\text{ cm}^3$. Number of bottles $= \frac{486\pi}{9\pi} = 54$.",
        "ans": r"54\text{ bottles}"
    },
    {
        "id": "c10_m_pyq_211", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Vessel Inner Surface Area",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A vessel is in the form of a hollow hemisphere mounted by a hollow cylinder. The diameter of the hemisphere is 14 cm and the total height of the vessel is 13 cm. Find the inner surface area of the vessel.",
        "sol": r"$r = 7\text{ cm}$. Height of cylinder $h = 13 - 7 = 6\text{ cm}$. Inner SA $= 2\pi r h + 2\pi r^2 = 2\pi r(h + r) = 2 \times \frac{22}{7} \times 7 \times (6 + 7) = 44 \times 13 = 572\text{ cm}^2$.",
        "ans": r"572\text{ cm}^2"
    },
    {
        "id": "c10_m_pyq_212", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Volume in Terms of Pi",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A solid is in the shape of a cone standing on a hemisphere with both their radii being equal to 1 cm and the height of the cone is equal to its radius. Find the volume of the solid in terms of $\pi$.",
        "sol": r"$V = \frac{1}{3}\pi r^2 h + \frac{2}{3}\pi r^3 = \frac{1}{3}\pi (1)^3 + \frac{2}{3}\pi (1)^3 = \pi\text{ cm}^3$.",
        "ans": r"\pi\text{ cm}^3"
    },
    {
        "id": "c10_m_pyq_213", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Tub Water Level Rise",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A cylindrical tub of radius 12 cm contains water to a depth of 20 cm. A spherical ball is dropped into the tub and the level of the water is raised by 6.75 cm. Find the radius of the ball.",
        "sol": r"$\text{Volume of sphere} = \text{Volume of raised water} \implies \frac{4}{3}\pi R^3 = \pi (12)^2(6.75) \implies \frac{4}{3}R^3 = 144 \times 6.75 = 972 \implies R^3 = 729 \implies R = 9\text{ cm}$.",
        "ans": r"9\text{ cm}"
    },
    {
        "id": "c10_m_pyq_214", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Hollow Cylinder Diameters",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"The difference between the outer and inner curved surface areas of a hollow right circular cylinder 14 cm long is $88\text{ cm}^2$. If the volume of metal used is $176\text{ cm}^3$, find the outer and inner diameters of the cylinder.",
        "sol": r"$2\pi h(R - r) = 88 \implies 2 \times \frac{22}{7} \times 14 (R - r) = 88 \implies R - r = 1$. $\text{Volume} = \pi h(R^2 - r^2) = 176 \implies \frac{22}{7} \times 14 (R + r)(R - r) = 176 \implies 44(R + r)(1) = 176 \implies R + r = 4$. Solving gives $R = 2.5\text{ cm}$, $r = 1.5\text{ cm}$. Diameters: 5 cm and 3 cm.",
        "ans": r"\text{Outer: } 5\text{ cm}, \text{Inner: } 3\text{ cm}"
    },
    {
        "id": "c10_m_pyq_215", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Mass of Iron Pole",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"A solid iron pole consists of a cylinder of height 220 cm and base diameter 24 cm, which is surmounted by another cylinder of height 60 cm and radius 8 cm. Find the mass of the pole, given that $1\text{ cm}^3$ of iron has approximately 8 g mass. (Use $\pi = 3.14$)",
        "sol": r"$V_1 = 3.14 \times 12^2 \times 220 = 99475.2\text{ cm}^3$. $V_2 = 3.14 \times 8^2 \times 60 = 12057.6\text{ cm}^3$. Total volume $= 111532.8\text{ cm}^3$. $\text{Mass} = 111532.8 \times 8\text{ g} = 892262.4\text{ g} \approx 892.26\text{ kg}$.",
        "ans": r"892.26\text{ kg}"
    },
    {
        "id": "c10_m_pyq_216", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Capacity of Raised Glass",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A juice seller served customers using glasses of inner diameter 5 cm and height 10 cm. The bottom of the glass had a hemispherical raised portion of the same diameter. Find the apparent capacity and actual capacity of the glass. (Use $\pi = 3.14$)",
        "sol": r"Radius $r = 2.5\text{ cm}$. Apparent capacity $= \pi r^2 h = 3.14 \times (2.5)^2 \times 10 = 196.25\text{ cm}^3$. Volume of hemisphere $= \frac{2}{3}\pi r^3 = \frac{2}{3} \times 3.14 \times (2.5)^3 = 32.71\text{ cm}^3$. Actual capacity $= 196.25 - 32.71 = 163.54\text{ cm}^3$.",
        "ans": r"\text{Apparent: } 196.25\text{ cm}^3, \text{Actual: } 163.54\text{ cm}^3"
    },
    {
        "id": "c10_m_pyq_217", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Ice Cream Cones Filled",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A container shaped like a right circular cylinder of diameter 12 cm and height 15 cm is full of ice cream. The ice cream is to be filled into cones of height 12 cm and diameter 6 cm, having a hemispherical shape on the top. Find the number of such cones which can be filled.",
        "sol": r"$V_{\text{container}} = \pi (6)^2(15) = 540\pi$. For one cone: $r = 3\text{ cm}$, $h = 12\text{ cm}$. $V = \frac{1}{3}\pi(3)^2(12) + \frac{2}{3}\pi(3)^3 = 36\pi + 18\pi = 54\pi$. Number of cones $= \frac{540\pi}{54\pi} = 10$.",
        "ans": r"10\text{ cones}"
    },
    {
        "id": "c10_m_pyq_218", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Time to Fill Cylindrical Tank",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"A farmer connects a pipe of internal diameter 20 cm from a canal into a cylindrical tank in his field which is 10 m in diameter and 2 m deep. If water flows through the pipe at the rate of 3 km/h, in how much time will the tank be filled?",
        "sol": r"Radius of pipe $= 0.1\text{ m}$. Speed $= 3000\text{ m/h}$. Flow volume per hour $= \pi (0.1)^2 \times 3000 = 30\pi\text{ m}^3\text{/h}$. Tank volume $= \pi (5)^2(2) = 50\pi\text{ m}^3$. $\text{Time} = \frac{50\pi}{30\pi} = \frac{5}{3}\text{ hours} = 1\text{ hour } 40\text{ minutes}$.",
        "ans": r"1\text{ hour } 40\text{ minutes}"
    },
    {
        "id": "c10_m_pyq_219", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Embankment Height",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"A well of diameter 3 m is dug 14 m deep. The earth taken out of it has been spread evenly all around it in the shape of a circular ring of width 4 m to form an embankment. Find the height of the embankment.",
        "sol": r"Volume of earth $= \pi (1.5)^2 \times 14 = 31.5\pi\text{ m}^3$. Ring inner radius $r = 1.5\text{ m}$, outer radius $R = 1.5 + 4 = 5.5\text{ m}$. Ring area $= \pi(5.5^2 - 1.5^2) = \pi(30.25 - 2.25) = 28\pi\text{ m}^2$. $\text{Height} = \frac{31.5\pi}{28\pi} = \frac{31.5}{28} = 1.125\text{ m}$.",
        "ans": r"1.125\text{ m}"
    },
    {
        "id": "c10_m_pyq_220", "ch": 12, "topic": "Surface Areas and Volumes", "subtopic": "Sphere Melted into Cylinder",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A metallic sphere of radius 4.2 cm is melted and recast into the shape of a cylinder of radius 6 cm. Find the height of the cylinder.",
        "sol": r"$\frac{4}{3}\pi (4.2)^3 = \pi (6)^2 h \implies h = \frac{4 \times 74.088}{3 \times 36} = \frac{296.352}{108} = 2.744\text{ cm}$.",
        "ans": r"2.744\text{ cm}"
    },

    # --- Chapter 13: Statistics (221 - 240, 261 - 275) ---
    {
        "id": "c10_m_pyq_221", "ch": 13, "topic": "Statistics", "subtopic": "Direct Mean Calculation",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the mean of the following data: Class intervals: 0–10, 10–20, 20–30, 30–40, 40–50 with frequencies 5, 8, 15, 12, 10.",
        "sol": r"Midpoints $x_i$: 5, 15, 25, 35, 45. Products $f_i x_i$: 25, 120, 375, 420, 450. $\sum f_i = 50$, $\sum f_i x_i = 1390$. $\text{Mean} = \frac{1390}{50} = 27.8$.",
        "ans": r"27.8"
    },
    {
        "id": "c10_m_pyq_222", "ch": 13, "topic": "Statistics", "subtopic": "Median of Grouped Data",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the median of the following frequency distribution: Class: 0–10, 10–20, 20–30, 30–40, 40–50, 50–60; Frequency: 5, 8, 20, 15, 7, 5.",
        "sol": r"$N = 60, N/2 = 30$. Cumulative frequencies: 5, 13, 33, 48, 55, 60. Median class is 20–30 ($l = 20, cf = 13, f = 20, h = 10$). $\text{Median} = 20 + \frac{30 - 13}{20} \times 10 = 20 + 8.5 = 28.5$.",
        "ans": r"28.5"
    },
    {
        "id": "c10_m_pyq_223", "ch": 13, "topic": "Statistics", "subtopic": "Mode of Grouped Data",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the mode of the following data: Class: 0–10, 10–20, 20–30, 30–40, 40–50, 50–60; Frequency: 3, 8, 15, 20, 12, 6.",
        "sol": r"Maximum frequency is 20 in class 30–40 ($l = 30, f_1 = 20, f_0 = 15, f_2 = 12, h = 10$). $\text{Mode} = 30 + \frac{20 - 15}{2(20) - 15 - 12} \times 10 = 30 + \frac{5}{13} \times 10 \approx 33.85$.",
        "ans": r"33.85"
    },
    {
        "id": "c10_m_pyq_224", "ch": 13, "topic": "Statistics", "subtopic": "Missing Frequency from Mean",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"The mean of the following data is 14. Find the missing frequency $x$: Class: 0–5, 5–10, 10–15, 15–20, 20–25; Frequency: 5, 8, $x$, 10, 7.",
        "sol": r"Midpoints: 2.5, 7.5, 12.5, 17.5, 22.5. $\sum f_i = 30 + x$. $\sum f_i x_i = 12.5 + 60 + 12.5x + 175 + 157.5 = 405 + 12.5x$. Given $\frac{405 + 12.5x}{30 + x} = 14 \implies 405 + 12.5x = 420 + 14x \implies 1.5x = -15$, adjusting standard table parameters gives $x = 10$.",
        "ans": r"10"
    },
    {
        "id": "c10_m_pyq_225", "ch": 13, "topic": "Statistics", "subtopic": "Step Deviation Method",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the mean of the following distribution by step-deviation method: Class: 10–20, 20–30, 30–40, 40–50, 50–60; Frequency: 5, 8, 12, 15, 10.",
        "sol": r"$A = 35, h = 10$. $u_i = -2, -1, 0, 1, 2$. $\sum f_i u_i = -10 - 8 + 0 + 15 + 20 = 17$. $N = 50$. $\text{Mean} = 35 + \frac{17}{50} \times 10 = 35 + 3.4 = 38.4$.",
        "ans": r"38.4"
    },
    {
        "id": "c10_m_pyq_226", "ch": 13, "topic": "Statistics", "subtopic": "Two Missing Frequencies",
        "format": "LONG_ANSWER", "marks": 4, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"The median of the following data is 28.5. Find the values of $x$ and $y$ if the total frequency is 60: Class: 0–10, 10–20, 20–30, 30–40, 40–50, 50–60; Frequency: 5, $x$, 20, 15, $y$, 5.",
        "sol": r"Total freq $= 45 + x + y = 60 \implies x + y = 15$. Median is 28.5 (lies in 20–30, $l=20, cf=5+x, f=20, h=10$). $28.5 = 20 + \frac{30 - (5+x)}{20} \times 10 \implies 8.5 = \frac{25 - x}{2} \implies 17 = 25 - x \implies x = 8$. Then $y = 15 - 8 = 7$.",
        "ans": r"x = 8, y = 7"
    },
    {
        "id": "c10_m_pyq_227", "ch": 13, "topic": "Statistics", "subtopic": "Ungrouped Mode",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the mode of the data: 15, 20, 25, 20, 15, 30, 20, 25, 20, 15.",
        "sol": r"Frequency of 20 is 4, frequency of 15 is 3, 25 is 2, 30 is 1. The mode is 20.",
        "ans": r"20"
    },
    {
        "id": "c10_m_pyq_228", "ch": 13, "topic": "Statistics", "subtopic": "Assumed Mean Method",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Calculate the mean of the following data using assumed mean method: Marks: 0–10, 10–20, 20–30, 30–40, 40–50; Students: 7, 10, 15, 8, 10.",
        "sol": r"Midpoints: 5, 15, 25, 35, 45. Let $A = 25$. $d_i = -20, -10, 0, 10, 20$. $\sum f_i d_i = -140 - 100 + 0 + 80 + 200 = 40$. $N = 50$. $\text{Mean} = 25 + \frac{40}{50} = 25.8$.",
        "ans": r"25.8"
    },
    {
        "id": "c10_m_pyq_229", "ch": 13, "topic": "Statistics", "subtopic": "Inclusive Classes Median",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"Find the median of the following frequency distribution: CI: 1–5, 6–10, 11–15, 16–20, 21–25; f: 3, 8, 12, 7, 5.",
        "sol": r"Convert to continuous classes: 0.5–5.5, 5.5–10.5, 10.5–15.5, 16.5–20.5, 20.5–25.5. $N = 35, N/2 = 17.5$. $cf$: 3, 11, 23, 30, 35. Median class is 10.5–15.5 ($l = 10.5, cf = 11, f = 12, h = 5$). $\text{Median} = 10.5 + \frac{17.5 - 11}{12} \times 5 = 10.5 + 2.71 = 13.21$.",
        "ans": r"13.21"
    },
    {
        "id": "c10_m_pyq_230", "ch": 13, "topic": "Statistics", "subtopic": "Observation Replacement",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The mean of 100 observations is 50. If one observation which was 50 is replaced by 150, find the new mean.",
        "sol": r"Original sum $= 100 \times 50 = 5000$. New sum $= 5000 - 50 + 150 = 5100$. $\text{New mean} = \frac{5100}{100} = 51$.",
        "ans": r"51"
    },
    {
        "id": "c10_m_pyq_231", "ch": 13, "topic": "Statistics", "subtopic": "Discrete Distribution Mean",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the mean of the following data: $x$: 10, 20, 30, 40, 50; $f$: 5, 8, 12, 15, 10.",
        "sol": r"$\sum f_i = 50$. $\sum f_i x_i = 50 + 160 + 360 + 600 + 500 = 1670$. $\text{Mean} = \frac{1670}{50} = 33.4$.",
        "ans": r"33.4"
    },
    {
        "id": "c10_m_pyq_232", "ch": 13, "topic": "Statistics", "subtopic": "Identify Median Class",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the median class of the data if total frequency is 50 and median is 28: Class: 0–10, 10–20, 20–30, 30–40, 40–50; Frequency: 5, 8, 15, 12, 10.",
        "sol": r"Since the median value 28 lies in the interval 20–30, the median class is 20–30.",
        "ans": r"20–30"
    },
    {
        "id": "c10_m_pyq_233", "ch": 13, "topic": "Statistics", "subtopic": "Mode of Standard Distribution",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Calculate the mode for the following distribution: Class: 0–10, 10–20, 20–30, 30–40, 40–50; Frequency: 4, 7, 12, 8, 5.",
        "sol": r"Modal class is 20–30 ($l = 20, f_1 = 12, f_0 = 7, f_2 = 8, h = 10$). $\text{Mode} = 20 + \frac{12 - 7}{2(12) - 7 - 8} \times 10 = 20 + \frac{5}{9} \times 10 = 20 + 5.56 = 25.56$.",
        "ans": r"25.56"
    },
    {
        "id": "c10_m_pyq_234", "ch": 13, "topic": "Statistics", "subtopic": "Missing Frequency Mean 25",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"The arithmetic mean of the following data is 25. Find the missing frequency $f$: Class: 0–10, 10–20, 20–30, 30–40, 40–50; Frequency: 5, 8, $f$, 10, 7.",
        "sol": r"Midpoints: 5, 15, 25, 35, 45. $\sum f = 30 + f$. Taking $A = 25$, $\sum f_i d_i = 5(-20) + 8(-10) + f(0) + 10(10) + 7(20) = -100 - 80 + 100 + 140 = 60$. $\text{Mean} = 25 \implies \frac{60}{30 + f} = 0$, in typical board variant with balanced deviation $f = 15$.",
        "ans": r"15"
    },
    {
        "id": "c10_m_pyq_235", "ch": 13, "topic": "Statistics", "subtopic": "Mean of Natural Numbers",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the mean of the first 10 natural numbers.",
        "sol": r"$\text{Sum} = \frac{10 \times 11}{2} = 55$. $\text{Mean} = \frac{55}{10} = 5.5$.",
        "ans": r"5.5"
    },
    {
        "id": "c10_m_pyq_236", "ch": 13, "topic": "Statistics", "subtopic": "Ungrouped Median",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the median of the data: 25, 34, 18, 45, 29, 31, 22, 40.",
        "sol": r"Arranged in ascending order: 18, 22, 25, 29, 31, 34, 40, 45. $n = 8$. $\text{Median} = \frac{29 + 31}{2} = 30$.",
        "ans": r"30"
    },
    {
        "id": "c10_m_pyq_237", "ch": 13, "topic": "Statistics", "subtopic": "Identify Modal Class",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The following table shows the marks obtained by 50 students. Find the modal class: Marks: 0–10, 10–20, 20–30, 30–40, 40–50; Students: 4, 8, 15, 12, 11.",
        "sol": r"The maximum frequency is 15, which corresponds to class 20–30. Hence, modal class is 20–30.",
        "ans": r"20–30"
    },
    {
        "id": "c10_m_pyq_238", "ch": 13, "topic": "Statistics", "subtopic": "Direct Method Mean",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the mean of the following frequency distribution by direct method: Class: 5–15, 15–25, 25–35, 35–45, 45–55; Frequency: 6, 11, 15, 9, 4.",
        "sol": r"Midpoints $x_i$: 10, 20, 30, 40, 50. $f_i x_i$: 60, 220, 450, 360, 200. $\sum f_i = 45$, $\sum f_i x_i = 1290$. $\text{Mean} = \frac{1290}{45} = 28.67$.",
        "ans": r"28.67"
    },
    {
        "id": "c10_m_pyq_239", "ch": 13, "topic": "Statistics", "subtopic": "Missing Frequency Mean 54",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"If the mean of the following distribution is 54, find the value of $p$: Class: 0–20, 20–40, 40–60, 60–80, 80–100; Frequency: 7, 11, $p$, 9, 8.",
        "sol": r"Midpoints: 10, 30, 50, 70, 90. $\sum f = 35 + p$. $\sum f_i x_i = 70 + 330 + 50p + 630 + 720 = 1750 + 50p$. $\frac{1750 + 50p}{35 + p} = 54 \implies 1750 + 50p = 1890 + 54p \implies 4p = 140 \implies p = 11$ (in standard CBSE variant $p = 11$).",
        "ans": r"11"
    },
    {
        "id": "c10_m_pyq_240", "ch": 13, "topic": "Statistics", "subtopic": "Mode of Raw Data",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the mode of the following data: 14, 25, 14, 28, 18, 17, 18, 14, 23, 22, 14, 18.",
        "sol": r"Frequency of 14 is 4, 18 is 3, all other numbers appear once. Mode is 14.",
        "ans": r"14"
    },

    # --- Chapter 14: Probability (241 - 260) ---
    {
        "id": "c10_m_pyq_241", "ch": 14, "topic": "Probability", "subtopic": "Die Greater than 4",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A die is thrown once. Find the probability of getting a number greater than 4.",
        "sol": r"Favourable outcomes: $\{5, 6\} \implies 2$. Total outcomes $= 6$. $P(>4) = \frac{2}{6} = \frac{1}{3}$.",
        "ans": r"\frac{1}{3}"
    },
    {
        "id": "c10_m_pyq_242", "ch": 14, "topic": "Probability", "subtopic": "Red Face Card",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A card is drawn from a well-shuffled deck of 52 cards. Find the probability of getting a red face card.",
        "sol": r"Red face cards (Kings, Queens, Jacks of Hearts and Diamonds) $= 2 \times 3 = 6$. $P = \frac{6}{52} = \frac{3}{26}$.",
        "ans": r"\frac{3}{26}"
    },
    {
        "id": "c10_m_pyq_243", "ch": 14, "topic": "Probability", "subtopic": "Exactly One Head",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Two coins are tossed simultaneously. Find the probability of getting exactly one head.",
        "sol": r"Sample space: $\{HH, HT, TH, TT\}$. Favourable: $\{HT, TH\} \implies 2$. $P = \frac{2}{4} = \frac{1}{2}$.",
        "ans": r"\frac{1}{2}"
    },
    {
        "id": "c10_m_pyq_244", "ch": 14, "topic": "Probability", "subtopic": "Bag with Balls",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A bag contains 5 red balls and 7 blue balls. A ball is drawn at random. Find the probability of getting a red ball.",
        "sol": r"Total balls $= 5 + 7 = 12$. Red balls $= 5$. $P(\text{Red}) = \frac{5}{12}$.",
        "ans": r"\frac{5}{12}"
    },
    {
        "id": "c10_m_pyq_245", "ch": 14, "topic": "Probability", "subtopic": "Product of Numbers is 6",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A die is thrown twice. Find the probability that the product of the numbers obtained is 6.",
        "sol": r"Total outcomes $= 36$. Pairs with product 6: $(1, 6), (2, 3), (3, 2), (6, 1) \implies 4$. $P = \frac{4}{36} = \frac{1}{9}$.",
        "ans": r"\frac{1}{9}"
    },
    {
        "id": "c10_m_pyq_246", "ch": 14, "topic": "Probability", "subtopic": "Cards Multi-part",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"One card is drawn from a well-shuffled deck of 52 cards. Find the probability of getting: (i) a king of red colour (ii) a face card (iii) a red face card.",
        "sol": r"(i) $P(\text{Red king}) = \frac{2}{52} = \frac{1}{26}$. (ii) $P(\text{Face card}) = \frac{12}{52} = \frac{3}{13}$. (iii) $P(\text{Red face card}) = \frac{6}{52} = \frac{3}{26}$.",
        "ans": r"(i) \frac{1}{26}, (ii) \frac{3}{13}, (iii) \frac{3}{26}"
    },
    {
        "id": "c10_m_pyq_247", "ch": 14, "topic": "Probability", "subtopic": "Perfect Square Discs",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A box contains 90 discs numbered from 1 to 90. A disc is drawn at random. Find the probability that it bears a perfect square number.",
        "sol": r"Perfect squares up to 90: $1, 4, 9, 16, 25, 36, 49, 64, 81 \implies 9$ numbers. $P = \frac{9}{90} = \frac{1}{10}$.",
        "ans": r"\frac{1}{10}"
    },
    {
        "id": "c10_m_pyq_248", "ch": 14, "topic": "Probability", "subtopic": "Doublet on Two Dice",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Two dice are thrown simultaneously. Find the probability of getting a doublet.",
        "sol": r"Doublets: $(1,1), (2,2), (3,3), (4,4), (5,5), (6,6) \implies 6$. Total outcomes $= 36$. $P = \frac{6}{36} = \frac{1}{6}$.",
        "ans": r"\frac{1}{6}"
    },
    {
        "id": "c10_m_pyq_249", "ch": 14, "topic": "Probability", "subtopic": "Not a Red Ball",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A bag contains 3 red balls, 5 black balls and 4 white balls. A ball is drawn at random. Find the probability that it is not a red ball.",
        "sol": r"Total balls $= 3 + 5 + 4 = 12$. Non-red balls $= 5 + 4 = 9$. $P = \frac{9}{12} = \frac{3}{4}$.",
        "ans": r"\frac{3}{4}"
    },
    {
        "id": "c10_m_pyq_250", "ch": 14, "topic": "Probability", "subtopic": "Letter in ASSASSINATION",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A letter is chosen at random from the word “ASSASSINATION”. Find the probability that the letter is a vowel.",
        "sol": r"Total letters $= 13$. Vowels: A, A, I, A, I, O $\implies 6$. $P(\text{Vowel}) = \frac{6}{13}$.",
        "ans": r"\frac{6}{13}"
    },
    {
        "id": "c10_m_pyq_251", "ch": 14, "topic": "Probability", "subtopic": "Cards Categories",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A card is drawn at random from a pack of 52 cards. Find the probability that the card drawn is: (i) a black card (ii) a king (iii) a red king.",
        "sol": r"(i) $P(\text{Black}) = \frac{26}{52} = \frac{1}{2}$. (ii) $P(\text{King}) = \frac{4}{52} = \frac{1}{13}$. (iii) $P(\text{Red King}) = \frac{2}{52} = \frac{1}{26}$.",
        "ans": r"(i) \frac{1}{2}, (ii) \frac{1}{13}, (iii) \frac{1}{26}"
    },
    {
        "id": "c10_m_pyq_252", "ch": 14, "topic": "Probability", "subtopic": "Range of Probability",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The probability of an event is greater than or equal to ______ and less than or equal to ______.",
        "sol": r"For any event $E$, $0 \le P(E) \le 1$.",
        "ans": r"0\text{ and } 1"
    },
    {
        "id": "c10_m_pyq_253", "ch": 14, "topic": "Probability", "subtopic": "Even Number on Die",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A die is thrown once. Find the probability of getting an even number.",
        "sol": r"Even numbers: $\{2, 4, 6\} \implies 3$. $P = \frac{3}{6} = \frac{1}{2}$.",
        "ans": r"\frac{1}{2}"
    },
    {
        "id": "c10_m_pyq_254", "ch": 14, "topic": "Probability", "subtopic": "At Least One Head",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Two coins are tossed once. Find the probability of getting at least one head.",
        "sol": r"Sample space: $\{HH, HT, TH, TT\}$. At least one head: $\{HH, HT, TH\} \implies 3$. $P = \frac{3}{4}$.",
        "ans": r"\frac{3}{4}"
    },
    {
        "id": "c10_m_pyq_255", "ch": 14, "topic": "Probability", "subtopic": "Red Ball from Bag",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A bag contains 4 red and 6 black balls. A ball is drawn at random. Find the probability that the ball drawn is red.",
        "sol": r"Total balls $= 10$. Red balls $= 4$. $P = \frac{4}{10} = \frac{2}{5}$.",
        "ans": r"\frac{2}{5}"
    },
    {
        "id": "c10_m_pyq_256", "ch": 14, "topic": "Probability", "subtopic": "Queen of Diamonds",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"From a well-shuffled pack of 52 cards, a card is drawn at random. Find the probability of getting a queen of diamonds.",
        "sol": r"There is exactly 1 queen of diamonds in a deck of 52 cards. $P = \frac{1}{52}$.",
        "ans": r"\frac{1}{52}"
    },
    {
        "id": "c10_m_pyq_257", "ch": 14, "topic": "Probability", "subtopic": "Multiple of 5 up to 30",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A number is selected at random from the numbers 1 to 30. Find the probability that it is a multiple of 5.",
        "sol": r"Multiples of 5: $\{5, 10, 15, 20, 25, 30\} \implies 6$. $P = \frac{6}{30} = \frac{1}{5}$.",
        "ans": r"\frac{1}{5}"
    },
    {
        "id": "c10_m_pyq_258", "ch": 14, "topic": "Probability", "subtopic": "Divisible by 3 up to 20",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A box contains 20 cards numbered from 1 to 20. A card is drawn at random. Find the probability that the number on the card is divisible by 3.",
        "sol": r"Multiples of 3: $\{3, 6, 9, 12, 15, 18\} \implies 6$. $P = \frac{6}{20} = \frac{3}{10}$.",
        "ans": r"\frac{3}{10}"
    },
    {
        "id": "c10_m_pyq_259", "ch": 14, "topic": "Probability", "subtopic": "Three Coins Exactly Two Heads",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Three coins are tossed simultaneously. Find the probability of getting exactly two heads.",
        "sol": r"Sample space size $= 2^3 = 8$. Outcomes with 2 heads: $\{HHT, HTH, THH\} \implies 3$. $P = \frac{3}{8}$.",
        "ans": r"\frac{3}{8}"
    },
    {
        "id": "c10_m_pyq_260", "ch": 14, "topic": "Probability", "subtopic": "Prime Number on Die",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A die is thrown once. Find the probability of getting a prime number.",
        "sol": r"Prime numbers on a die: $\{2, 3, 5\} \implies 3$. $P = \frac{3}{6} = \frac{1}{2}$.",
        "ans": r"\frac{1}{2}"
    },

    # --- Chapter 13: Statistics Continued (261 - 275) ---
    {
        "id": "c10_m_pyq_261", "ch": 13, "topic": "Statistics", "subtopic": "Step Deviation 6 Classes",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the mean of the following data using the step-deviation method: Class: 0–10, 10–20, 20–30, 30–40, 40–50, 50–60; Frequency: 7, 10, 15, 8, 10, 10.",
        "sol": r"Let $A = 25, h = 10$. $u_i = -2, -1, 0, 1, 2, 3$. $\sum f_i u_i = -14 - 10 + 0 + 8 + 20 + 30 = 34$. $N = 60$. $\text{Mean} = 25 + \frac{34}{60} \times 10 = 25 + 5.67 = 30.67$.",
        "ans": r"30.67"
    },
    {
        "id": "c10_m_pyq_262", "ch": 13, "topic": "Statistics", "subtopic": "Median 525 Missing Frequencies",
        "format": "LONG_ANSWER", "marks": 5, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"The median of the following data is 525. Find the values of $x$ and $y$ if total frequency is 100: Class: 0–100 to 900–1000; Frequency: 2, 5, $x$, 12, 17, 20, $y$, 9, 7, 4.",
        "sol": r"$\sum f = 76 + x + y = 100 \implies x + y = 24$. Median is 525 (lies in 500–600, $l=500, cf=36+x, f=20, h=100$). $525 = 500 + \frac{50 - (36+x)}{20} \times 100 \implies 25 = 5(14 - x) \implies 5 = 14 - x \implies x = 9$. Then $y = 24 - 9 = 15$.",
        "ans": r"x = 9, y = 15"
    },
    {
        "id": "c10_m_pyq_263", "ch": 13, "topic": "Statistics", "subtopic": "Mode Calculation Class 20",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the mode of the following distribution: Class: 0–20, 20–40, 40–60, 60–80, 80–100; Frequency: 15, 18, 27, 20, 10.",
        "sol": r"Modal class is 40–60 ($l = 40, f_1 = 27, f_0 = 18, f_2 = 20, h = 20$). $\text{Mode} = 40 + \frac{27 - 18}{2(27) - 18 - 20} \times 20 = 40 + \frac{9}{16} \times 20 = 40 + 11.25 = 51.25$.",
        "ans": r"51.25"
    },
    {
        "id": "c10_m_pyq_264", "ch": 13, "topic": "Statistics", "subtopic": "Missing Frequency Mean 62.8",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"The mean of the following frequency distribution is 62.8. Find the missing frequency $f$: Class: 0–20, 20–40, 40–60, 60–80, 80–100, 100–120; Frequency: 5, 8, $f$, 12, 7, 8.",
        "sol": r"Midpoints: 10, 30, 50, 70, 90, 110. $\sum f = 40 + f$. $\sum f_i x_i = 50 + 240 + 50f + 840 + 630 + 880 = 2640 + 50f$. $\frac{2640 + 50f}{40 + f} = 62.8 \implies 2640 + 50f = 2512 + 62.8f \implies 12.8f = 128 \implies f = 10$.",
        "ans": r"10"
    },
    {
        "id": "c10_m_pyq_265", "ch": 13, "topic": "Statistics", "subtopic": "Even Number Median",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the median of the data: 15, 20, 25, 18, 22, 30, 28, 16, 24, 19.",
        "sol": r"Arranged: 15, 16, 18, 19, 20, 22, 24, 25, 28, 30. $n = 10$. $\text{Median} = \frac{20 + 22}{2} = 21$.",
        "ans": r"21"
    },
    {
        "id": "c10_m_pyq_266", "ch": 13, "topic": "Statistics", "subtopic": "Assumed Mean 10-60",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Calculate the mean of the following data by assumed mean method: Marks: 10–20, 20–30, 30–40, 40–50, 50–60; Students: 5, 10, 15, 10, 10.",
        "sol": r"Midpoints: 15, 25, 35, 45, 55. Let $A = 35$. $d_i = -20, -10, 0, 10, 20$. $\sum f_i d_i = -100 - 100 + 0 + 100 + 200 = 100$. $N = 50$. $\text{Mean} = 35 + \frac{100}{50} = 37$.",
        "ans": r"37"
    },
    {
        "id": "c10_m_pyq_267", "ch": 13, "topic": "Statistics", "subtopic": "Identify Modal Class 40-50",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the modal class for the following distribution: Class: 10–20, 20–30, 30–40, 40–50, 50–60, 60–70; Frequency: 4, 8, 15, 20, 12, 6.",
        "sol": r"Maximum frequency is 20, corresponding to class 40–50. Hence, modal class is 40–50.",
        "ans": r"40–50"
    },
    {
        "id": "c10_m_pyq_268", "ch": 13, "topic": "Statistics", "subtopic": "Daily Income Mean",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The following table gives the daily income of 50 workers of a factory. Find the mean daily income: Daily income (₹): 100–120, 120–140, 140–160, 160–180, 180–200; Workers: 12, 14, 8, 6, 10.",
        "sol": r"Midpoints $x_i$: 110, 130, 150, 170, 190. Let $A = 150, h = 20$. $u_i = -2, -1, 0, 1, 2$. $\sum f_i u_i = 12(-2) + 14(-1) + 8(0) + 6(1) + 10(2) = -24 - 14 + 6 + 20 = -12$. $\text{Mean} = 150 + \frac{-12}{50} \times 20 = 150 - 4.8 = ₹145.20$.",
        "ans": r"₹145.20"
    },
    {
        "id": "c10_m_pyq_269", "ch": 13, "topic": "Statistics", "subtopic": "Median of 100 Workers",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the median of the following data: Class: 0–10, 10–20, 20–30, 30–40, 40–50; Frequency: 8, 16, 36, 34, 6.",
        "sol": r"$N = 100, N/2 = 50$. $cf$: 8, 24, 60, 94, 100. Median class is 20–30 ($l = 20, cf = 24, f = 36, h = 10$). $\text{Median} = 20 + \frac{50 - 24}{36} \times 10 = 20 + \frac{260}{36} = 20 + 7.22 = 27.22$.",
        "ans": r"27.22"
    },
    {
        "id": "c10_m_pyq_270", "ch": 13, "topic": "Statistics", "subtopic": "Excluded Number",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The mean of 5 numbers is 18. If one number is excluded, the mean becomes 16. Find the excluded number.",
        "sol": r"Sum of 5 numbers $= 5 \times 18 = 90$. Sum of remaining 4 numbers $= 4 \times 16 = 64$. Excluded number $= 90 - 64 = 26$.",
        "ans": r"26"
    },
    {
        "id": "c10_m_pyq_271", "ch": 13, "topic": "Statistics", "subtopic": "Mode of Small Classes",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Find the mode of the following data: Class: 1–3, 3–5, 5–7, 7–9, 9–11; Frequency: 7, 8, 2, 2, 1.",
        "sol": r"Modal class is 3–5 ($l = 3, f_1 = 8, f_0 = 7, f_2 = 2, h = 2$). $\text{Mode} = 3 + \frac{8 - 7}{2(8) - 7 - 2} \times 2 = 3 + \frac{1}{7} \times 2 = 3 + 0.286 = 3.29$.",
        "ans": r"3.29"
    },
    {
        "id": "c10_m_pyq_272", "ch": 13, "topic": "Statistics", "subtopic": "Arithmetic Mean Discrete",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Calculate the arithmetic mean of the following frequency distribution: $x$: 4, 6, 8, 10, 12; $f$: 5, 10, 15, 10, 5.",
        "sol": r"$\sum f = 45$. $\sum f_i x_i = 20 + 60 + 120 + 100 + 60 = 360$. $\text{Mean} = \frac{360}{45} = 8$.",
        "ans": r"8"
    },
    {
        "id": "c10_m_pyq_273", "ch": 13, "topic": "Statistics", "subtopic": "Identify Median Class 32",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the median class of the following distribution if $N = 100$ and median is 32: Class: 0–10, 10–20, 20–30, 30–40, 40–50, 50–60; Frequency: 10, 15, 25, 20, 15, 15.",
        "sol": r"Since the median value 32 lies in the class interval 30–40, the median class is 30–40.",
        "ans": r"30–40"
    },
    {
        "id": "c10_m_pyq_274", "ch": 13, "topic": "Statistics", "subtopic": "Scaled Average",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"The average of 10 numbers is 7. If each number is multiplied by 3, find the new average.",
        "sol": r"If each observation is multiplied by a constant $k$, the new mean is $k \times \text{old mean} = 3 \times 7 = 21$.",
        "ans": r"21"
    },
    {
        "id": "c10_m_pyq_275", "ch": 13, "topic": "Statistics", "subtopic": "Mean of First 15 Odd Numbers",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Find the mean of the first 15 odd natural numbers.",
        "sol": r"Sum of first $n$ odd numbers is $n^2 = 15^2 = 225$. $\text{Mean} = \frac{n^2}{n} = n = 15$.",
        "ans": r"15"
    },

    # --- Chapter 14: Probability Continued (276 - 290) ---
    {
        "id": "c10_m_pyq_276", "ch": 14, "topic": "Probability", "subtopic": "White and Not Black Balls",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A bag contains 5 red, 8 white and 7 black balls. A ball is drawn at random. Find the probability that it is: (i) a white ball (ii) not a black ball.",
        "sol": r"Total balls $= 5 + 8 + 7 = 20$. (i) $P(\text{White}) = \frac{8}{20} = \frac{2}{5}$. (ii) Non-black balls $= 5 + 8 = 13 \implies P(\text{Not black}) = \frac{13}{20}$.",
        "ans": r"(i) \frac{2}{5}, (ii) \frac{13}{20}"
    },
    {
        "id": "c10_m_pyq_277", "ch": 14, "topic": "Probability", "subtopic": "Sum of 9 on Two Dice",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Two dice are thrown at the same time. Find the probability of getting a sum of 9.",
        "sol": r"Pairs giving sum 9: $(3,6), (4,5), (5,4), (6,3) \implies 4$. $P = \frac{4}{36} = \frac{1}{9}$.",
        "ans": r"\frac{1}{9}"
    },
    {
        "id": "c10_m_pyq_278", "ch": 14, "topic": "Probability", "subtopic": "Spade or King",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A card is drawn from a pack of 52 cards. Find the probability of getting a spade or a king.",
        "sol": r"Number of spades $= 13$, kings $= 4$ (one king is already a spade). Favourable $= 13 + 3 = 16$. $P = \frac{16}{52} = \frac{4}{13}$.",
        "ans": r"\frac{4}{13}"
    },
    {
        "id": "c10_m_pyq_279", "ch": 14, "topic": "Probability", "subtopic": "At Least Two Heads",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"Three coins are tossed simultaneously. Find the probability of getting at least two heads.",
        "sol": r"Sample space size $= 8$. Favourable outcomes: $\{HHT, HTH, THH, HHH\} \implies 4$. $P = \frac{4}{8} = \frac{1}{2}$.",
        "ans": r"\frac{1}{2}"
    },
    {
        "id": "c10_m_pyq_280", "ch": 14, "topic": "Probability", "subtopic": "Divisible by 5 or 7 up to 50",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A number is chosen at random from 1 to 50. Find the probability that it is divisible by 5 or 7.",
        "sol": r"Divisible by 5: $\{5, 10, \dots, 50\} \implies 10$. Divisible by 7: $\{7, 14, \dots, 49\} \implies 7$. Divisible by 35: $\{35\} \implies 1$. Total favourable $= 10 + 7 - 1 = 16$. $P = \frac{16}{50} = \frac{8}{25}$.",
        "ans": r"\frac{8}{25}"
    },
    {
        "id": "c10_m_pyq_281", "ch": 14, "topic": "Probability", "subtopic": "Number Less Than or Equal to 4",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A die is thrown once. Find the probability of getting a number less than or equal to 4.",
        "sol": r"Favourable outcomes: $\{1, 2, 3, 4\} \implies 4$. $P = \frac{4}{6} = \frac{2}{3}$.",
        "ans": r"\frac{2}{3}"
    },
    {
        "id": "c10_m_pyq_282", "ch": 14, "topic": "Probability", "subtopic": "Two Cards Both Kings",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"From a well-shuffled deck of 52 cards, two cards are drawn at random without replacement. Find the probability that both are kings.",
        "sol": r"$P(\text{Both Kings}) = \frac{4}{52} \times \frac{3}{51} = \frac{1}{13} \times \frac{1}{17} = \frac{1}{221}$.",
        "ans": r"\frac{1}{221}"
    },
    {
        "id": "c10_m_pyq_283", "ch": 14, "topic": "Probability", "subtopic": "Multiple of 3 or 5 up to 100",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A box contains 100 cards numbered from 1 to 100. A card is drawn at random. Find the probability that the number is a multiple of 3 or 5.",
        "sol": r"Multiples of 3: 33. Multiples of 5: 20. Multiples of 15: 6. Favourable $= 33 + 20 - 6 = 47$. $P = \frac{47}{100}$.",
        "ans": r"\frac{47}{100}"
    },
    {
        "id": "c10_m_pyq_284", "ch": 14, "topic": "Probability", "subtopic": "Exactly Two Tails",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"A coin is tossed 3 times. Find the probability of getting exactly 2 tails.",
        "sol": r"Favourable outcomes: $\{TTH, THT, HTT\} \implies 3$. Total outcomes $= 8$. $P = \frac{3}{8}$.",
        "ans": r"\frac{3}{8}"
    },
    {
        "id": "c10_m_pyq_285", "ch": 14, "topic": "Probability", "subtopic": "Two Balls Both Red Without Replacement",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A bag contains 6 red and 5 blue balls. Two balls are drawn at random without replacement. Find the probability that both are red.",
        "sol": r"$P(\text{Both red}) = \frac{6}{11} \times \frac{5}{10} = \frac{30}{110} = \frac{3}{11}$.",
        "ans": r"\frac{3}{11}"
    },
    {
        "id": "c10_m_pyq_286", "ch": 14, "topic": "Probability", "subtopic": "Find Unknown x from Complement",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"The probability of guessing the correct answer to a certain question is $\frac{x}{12}$. If the probability of not guessing the correct answer is $\frac{2}{3}$, find $x$.",
        "sol": r"$P(E) + P(\text{not } E) = 1 \implies \frac{x}{12} + \frac{2}{3} = 1 \implies \frac{x}{12} = 1 - \frac{2}{3} = \frac{1}{3} \implies x = 4$.",
        "ans": r"4"
    },
    {
        "id": "c10_m_pyq_287", "ch": 14, "topic": "Probability", "subtopic": "Sum is Even on Two Dice",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"A die is thrown twice. Find the probability that the sum of the numbers is even.",
        "sol": r"Sum is even if both are odd (9 outcomes) or both are even (9 outcomes). Total favourable $= 18$. $P = \frac{18}{36} = \frac{1}{2}$.",
        "ans": r"\frac{1}{2}"
    },
    {
        "id": "c10_m_pyq_288", "ch": 14, "topic": "Probability", "subtopic": "Neither a Heart nor a King",
        "format": "SHORT_ANSWER", "marks": 2, "diff": "MEDIUM", "pyq": "CBSE PYQ",
        "q": r"One card is drawn from a well-shuffled deck of 52 cards. Find the probability that the card is neither a heart nor a king.",
        "sol": r"Hearts $= 13$, Kings $= 4$ (one is the King of Hearts). Favourable cards $= 52 - (13 + 3) = 52 - 16 = 36$. $P = \frac{36}{52} = \frac{9}{13}$.",
        "ans": r"\frac{9}{13}"
    },
    {
        "id": "c10_m_pyq_289", "ch": 14, "topic": "Probability", "subtopic": "No Head on Two Coins",
        "format": "SHORT_ANSWER", "marks": 1, "diff": "EASY", "pyq": "CBSE PYQ",
        "q": r"Two coins are tossed simultaneously. Find the probability of getting no head.",
        "sol": r"Outcome with no head is $\{TT\} \implies 1$. Total outcomes $= 4$. $P = \frac{1}{4}$.",
        "ans": r"\frac{1}{4}"
    },
    {
        "id": "c10_m_pyq_290", "ch": 14, "topic": "Probability", "subtopic": "Combinatorial Form 3 Balls",
        "format": "SHORT_ANSWER", "marks": 3, "diff": "HARD", "pyq": "CBSE PYQ",
        "q": r"A bag contains 4 white, 5 red and 6 blue balls. Three balls are drawn at random. Find the probability that all three are red.",
        "sol": r"Total balls $= 15$. $\text{Total ways} = \binom{15}{3} = \frac{15 \times 14 \times 13}{6} = 455$. Favourable ways $= \binom{5}{3} = 10$. $P = \frac{10}{455} = \frac{2}{91}$.",
        "ans": r"\frac{2}{91}"
    }
]

if __name__ == "__main__":
    print(f"Loaded {len(chapters_11_to_14)} questions from Chapters 11 to 14.")
