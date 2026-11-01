// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: HARDCODED SYLLABUS & CURRICULUM TAXONOMY
// Dedicated Teacher View for Senior Secondary Physics (Class 11 & Class 12)
// Aligned with CBSE Board, HPBOSE, JEE Main & NEET UG
// ============================================================================

window.TEACHER_SYLLABUS_DATA = {
  '11': [
    {
      unit: 'Unit I',
      chapterNum: 1,
      name: 'Units and Measurements',
      ncertRef: 'NCERT Class 11 Physics Part 1 • Chapter 1 (Pages 1–22)',
      weightageMarks: 6,
      status: 'completed',
      statusLabel: 'Completed',
      lecturesPlanned: 12,
      lecturesDelivered: 12,
      hoursDelivered: 14,
      completionRate: 100,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Need for measurement, SI system, dimensions of physical quantities, error propagation.',
      topics: [
        { name: 'Need for measurement; units of measurement; SI base and derived units', done: true },
        { name: 'Dimensions of physical quantities & dimensional analysis applications', done: true },
        { name: 'Principle of homogeneity of dimensions in physical equations', done: true },
        { name: 'Significant figures, rounding off rules, and scientific notation', done: true },
        { name: 'Measurement errors: systematic and random; absolute, relative & percentage errors', done: true }
      ],
      formulas: [
        '[M^a L^b T^c] \\text{ dimensional formulas}',
        '\\frac{\\Delta x}{x} = \\frac{\\Delta a}{a} + \\frac{\\Delta b}{b} \\text{ (Relative error)}'
      ],
      practicals: 'Vernier callipers & screw gauge calibration for volume and density measurements.'
    },
    {
      unit: 'Unit II',
      chapterNum: 2,
      name: 'Motion in a Straight Line',
      ncertRef: 'NCERT Class 11 Physics Part 1 • Chapter 2 (Pages 23–45)',
      weightageMarks: 7,
      status: 'completed',
      statusLabel: 'Completed',
      lecturesPlanned: 14,
      lecturesDelivered: 14,
      hoursDelivered: 16,
      completionRate: 100,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: '1D kinematics, calculus integration for equations of motion, relative velocity, position-time graphs.',
      topics: [
        { name: 'Frame of reference, motion in a straight line, position-time graph, speed and velocity', done: true },
        { name: 'Elementary calculus: differentiation & integration for rectilinear kinematics', done: true },
        { name: 'Uniformly accelerated motion: calculus derivations for v=u+at, s=ut+½at², v²=u²+2as', done: true },
        { name: 'Velocity-time graphs and graphical deduction of acceleration & displacement', done: true },
        { name: 'Free fall under gravity and relative velocity in one dimension', done: true }
      ],
      formulas: [
        'v = u + at, \\quad s = ut + \\frac{1}{2}at^2, \\quad v^2 = u^2 + 2as',
        'v = \\frac{dx}{dt}, \\quad a = \\frac{dv}{dt} = v\\frac{dv}{dx}'
      ],
      practicals: 'Measurement of acceleration due to gravity using a free-fall electronic timer.'
    },
    {
      unit: 'Unit II',
      chapterNum: 3,
      name: 'Motion in a Plane (Vectors & Projectile)',
      ncertRef: 'NCERT Class 11 Physics Part 1 • Chapter 3 (Pages 46–74)',
      weightageMarks: 8,
      status: 'completed',
      statusLabel: 'Completed',
      lecturesPlanned: 16,
      lecturesDelivered: 16,
      hoursDelivered: 18,
      completionRate: 100,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Vectors, projectile trajectory equations, horizontal range, maximum height, centripetal acceleration.',
      topics: [
        { name: 'Scalar and vector quantities; unit vectors; rectangular resolution in a plane', done: true },
        { name: 'Scalar (dot) product and Vector (cross) product with directional properties', done: true },
        { name: 'Motion in a plane with constant acceleration: horizontal and vertical independence', done: true },
        { name: 'Projectile motion derivations: trajectory equation, time of flight, max height, horizontal range', done: true },
        { name: 'Uniform circular motion: centripetal acceleration ac = v²/r derivation', done: true }
      ],
      formulas: [
        'y = x\\tan\\theta - \\frac{g x^2}{2 u^2 \\cos^2\\theta}, \\quad R = \\frac{u^2 \\sin 2\\theta}{g}',
        'T = \\frac{2u\\sin\\theta}{g}, \\quad H = \\frac{u^2\\sin^2\\theta}{2g}, \\quad a_c = \\frac{v^2}{r} = \\omega^2 r'
      ],
      practicals: 'Parabolic trajectory tracing using ball bearing on inclined track.'
    },
    {
      unit: 'Unit III',
      chapterNum: 4,
      name: 'Laws of Motion & Friction',
      ncertRef: 'NCERT Class 11 Physics Part 1 • Chapter 4 (Pages 75–104)',
      weightageMarks: 9,
      status: 'completed',
      statusLabel: 'Completed',
      lecturesPlanned: 18,
      lecturesDelivered: 18,
      hoursDelivered: 20,
      completionRate: 100,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Newton laws of motion, momentum conservation, static and kinetic friction, banking of roads.',
      topics: [
        { name: 'Newton\'s 1st, 2nd & 3rd laws of motion; momentum & impulse-momentum theorem', done: true },
        { name: 'Law of conservation of linear momentum and application to rocket propulsion & recoil', done: true },
        { name: 'Equilibrium of concurrent forces and free body diagrams (FBD)', done: true },
        { name: 'Static friction, limiting friction, kinetic friction and angle of repose', done: true },
        { name: 'Dynamics of circular motion: centripetal force and optimum banking velocity of roads', done: true }
      ],
      formulas: [
        '\\vec{F} = \\frac{d\\vec{p}}{dt} = m\\vec{a}, \\quad f_s \\le \\mu_s N, \\quad f_k = \\mu_k N',
        'v_{\\text{max}} = \\sqrt{\\frac{rg(\\tan\\theta + \\mu_s)}{1 - \\mu_s\\tan\\theta}} \\text{ (Banked Road)}'
      ],
      practicals: 'Determination of coefficient of limiting friction between wood and glass.'
    },
    {
      unit: 'Unit IV',
      chapterNum: 5,
      name: 'Work, Energy and Power',
      ncertRef: 'NCERT Class 11 Physics Part 1 • Chapter 5 (Pages 105–130)',
      weightageMarks: 8,
      status: 'completed',
      statusLabel: 'Completed',
      lecturesPlanned: 15,
      lecturesDelivered: 15,
      hoursDelivered: 16,
      completionRate: 100,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Work-energy theorem, conservative forces, potential energy of springs, 1D & 2D elastic collisions.',
      topics: [
        { name: 'Work done by constant and variable force: W = ∫ F·dx and force-displacement graph', done: true },
        { name: 'Work-Energy Theorem for variable force: W_net = ΔK', done: true },
        { name: 'Conservative vs non-conservative forces; potential energy U(x) where F = -dU/dx', done: true },
        { name: 'Conservation of mechanical energy for a freely falling body and vertical circle', done: true },
        { name: 'Elastic and inelastic collisions in one and two dimensions; coefficient of restitution', done: true }
      ],
      formulas: [
        'W = \\int_{x_i}^{x_f} F(x)\\,dx = \\Delta K, \\quad U(x) = \\frac{1}{2}kx^2',
        'v_1 = \\left(\\frac{m_1 - m_2}{m_1 + m_2}\\right)u_1 + \\left(\\frac{2m_2}{m_1 + m_2}\\right)u_2'
      ],
      practicals: 'Verification of conservation of mechanical energy using Maxwell\'s wheel / spring oscillator.'
    },
    {
      unit: 'Unit V',
      chapterNum: 6,
      name: 'System of Particles & Rotational Motion',
      ncertRef: 'NCERT Class 11 Physics Part 1 • Chapter 6 (Pages 131–168)',
      weightageMarks: 10,
      status: 'in-progress',
      statusLabel: 'Active • 85% Covered',
      lecturesPlanned: 20,
      lecturesDelivered: 17,
      hoursDelivered: 22,
      completionRate: 85,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Centre of mass, torque (τ = Iα), angular momentum, moment of inertia of disc/sphere, pure rolling down incline.',
      topics: [
        { name: 'Centre of mass of 2-particle system and rigid bodies with continuous mass distribution', done: true },
        { name: 'Moment of a force (torque τ = r × F) and angular momentum (L = r × p) conservation', done: true },
        { name: 'Equilibrium of rigid bodies; rotational analogue of Newton\'s second law: τ = I·α', done: true },
        { name: 'Moment of inertia, radius of gyration, parallel and perpendicular axis theorems', done: true },
        { name: 'Calculation of moment of inertia for ring (MR²), disc (½MR²), cylinder, and solid sphere (⅖MR²)', done: true },
        { name: 'Pure rolling motion on inclined plane: linear acceleration a = g·sin θ / (1 + I/MR²)', done: true },
        { name: 'Comparison of rolling velocities and accelerations for sphere vs disc vs ring', done: false }
      ],
      formulas: [
        '\\vec{\\tau} = \\vec{r} \\times \\vec{F} = I\\vec{\\alpha}, \\quad \\vec{L} = I\\vec{\\omega}',
        'a_{\\text{cm}} = \\frac{g\\sin\\theta}{1 + \\frac{I}{MR^2}}, \\quad v_{\\text{bottom}} = \\sqrt{\\frac{2gh}{1 + \\frac{I}{MR^2}}}',
        'I_{\\text{solid sphere}} = \\frac{2}{5}MR^2 \\implies a = \\frac{5}{7}g\\sin\\theta'
      ],
      practicals: 'Moment of inertia determination of flywheel and rolling cylinder down an inclined track.',
      teacherNote: 'Currently teaching on AI Voice Smartboard: Dr. Vikram Sharma walking students through pure rolling FBD and torque substitutions.'
    },
    {
      unit: 'Unit VI',
      chapterNum: 7,
      name: 'Gravitation',
      ncertRef: 'NCERT Class 11 Physics Part 1 • Chapter 7 (Pages 169–196)',
      weightageMarks: 7,
      status: 'upcoming',
      statusLabel: 'Scheduled: Nov 15 – Nov 28',
      lecturesPlanned: 12,
      lecturesDelivered: 0,
      hoursDelivered: 0,
      completionRate: 0,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Kepler laws, Newton universal law, variation of g with altitude & depth, orbital & escape velocity.',
      topics: [
        { name: 'Kepler\'s three laws of planetary motion; areal velocity conservation', done: false },
        { name: 'Universal law of gravitation; gravitational field intensity and potential', done: false },
        { name: 'Variation of acceleration due to gravity (g) with altitude (h) and depth (d)', done: false },
        { name: 'Gravitational potential energy U = -GMm/r and escape speed ve = √(2gR)', done: false },
        { name: 'Orbital velocity of a satellite, period of revolution and geostationary orbits', done: false }
      ],
      formulas: [
        'F = G\\frac{m_1 m_2}{r^2}, \\quad g\' = g\\left(1 - \\frac{2h}{R}\\right), \\quad g\' = g\\left(1 - \\frac{d}{R}\\right)',
        'v_e = \\sqrt{\\frac{2GM}{R}} = \\sqrt{2gR} \\approx 11.2\\,\\text{km/s}'
      ],
      practicals: 'Measurement of acceleration due to gravity using a simple pendulum and L-T² graph.'
    },
    {
      unit: 'Unit VII',
      chapterNum: 8,
      name: 'Mechanical Properties of Solids & Fluids',
      ncertRef: 'NCERT Class 11 Physics Part 2 • Chapters 8 & 9 (Pages 197–242)',
      weightageMarks: 9,
      status: 'upcoming',
      statusLabel: 'Scheduled: Dec 1 – Dec 18',
      lecturesPlanned: 16,
      lecturesDelivered: 0,
      hoursDelivered: 0,
      completionRate: 0,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Stress-strain curves, Hooke law, Young modulus, Pascal law, Bernoulli theorem, Stokes law, surface tension.',
      topics: [
        { name: 'Stress-strain relationship; Hooke\'s law; Young\'s, Bulk and Shear modulus of rigidity', done: false },
        { name: 'Pressure in a fluid; Pascal\'s law and its applications in hydraulic lift', done: false },
        { name: 'Viscosity, Stokes\' law, terminal velocity, streamline and turbulent flow', done: false },
        { name: 'Bernoulli\'s theorem and its applications (Venturi meter, dynamic lift on airplane wing)', done: false },
        { name: 'Surface energy and surface tension, angle of contact, capillary rise derivation', done: false }
      ],
      formulas: [
        'Y = \\frac{\\text{Stress}}{\\text{Strain}} = \\frac{F/A}{\\Delta L/L}, \\quad P + \\frac{1}{2}\\rho v^2 + \\rho g h = \\text{const}',
        'F_v = 6\\pi\\eta r v, \\quad v_t = \\frac{2r^2(\\rho - \\sigma)g}{9\\eta}, \\quad h = \\frac{2T\\cos\\theta}{r\\rho g}'
      ],
      practicals: 'Searle\'s apparatus for Young\'s modulus and capillary rise for surface tension of water.'
    },
    {
      unit: 'Unit VIII',
      chapterNum: 9,
      name: 'Thermal Properties of Matter & Thermodynamics',
      ncertRef: 'NCERT Class 11 Physics Part 2 • Chapters 10 & 11 (Pages 243–288)',
      weightageMarks: 9,
      status: 'upcoming',
      statusLabel: 'Scheduled: Jan 5 – Jan 18',
      lecturesPlanned: 14,
      lecturesDelivered: 0,
      hoursDelivered: 0,
      completionRate: 0,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Calorimetry, heat transfer, 1st & 2nd laws of thermodynamics, isothermal & adiabatic processes, heat engines.',
      topics: [
        { name: 'Heat and temperature; thermal expansion of solids, liquids and gases; anomalous water expansion', done: false },
        { name: 'Specific heat capacity; calorimetry; change of state & latent heat', done: false },
        { name: 'Thermal equilibrium and zeroth law of thermodynamics; definition of temperature', done: false },
        { name: 'First law of thermodynamics: dQ = dU + dW; work done in isothermal and adiabatic expansion', done: false },
        { name: 'Second law of thermodynamics: reversible and irreversible processes; Carnot cycle efficiency', done: false }
      ],
      formulas: [
        '\\Delta Q = mc\\Delta T = mL, \\quad dQ = dU + dW = nC_v dT + P dV',
        'W_{\\text{iso}} = nRT\\ln\\left(\\frac{V_f}{V_i}\\right), \\quad P V^\\gamma = \\text{const}, \\quad \\eta = 1 - \\frac{T_2}{T_1}'
      ],
      practicals: 'Determine specific heat capacity of a solid using the method of mixtures (Calorimeter).'
    },
    {
      unit: 'Unit IX & X',
      chapterNum: 10,
      name: 'Oscillations and Waves',
      ncertRef: 'NCERT Class 11 Physics Part 2 • Chapters 12 & 13 (Pages 289–340)',
      weightageMarks: 10,
      status: 'upcoming',
      statusLabel: 'Scheduled: Jan 20 – Feb 8',
      lecturesPlanned: 18,
      lecturesDelivered: 0,
      hoursDelivered: 0,
      completionRate: 0,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Simple harmonic motion, simple pendulum, resonance, wave equation, sound waves, Doppler effect.',
      topics: [
        { name: 'Periodic and oscillatory motion; simple harmonic motion equation x(t) = A·cos(ωt + φ)', done: false },
        { name: 'Energy in S.H.M.: kinetic and potential energy variation with time and position', done: false },
        { name: 'Simple pendulum and loaded spring oscillator time period derivations', done: false },
        { name: 'Free, damped and forced oscillations; resonance conditions', done: false },
        { name: 'Wave motion; progressive wave equation; standing waves in strings and organ pipes; beats', done: false }
      ],
      formulas: [
        '\\frac{d^2 x}{dt^2} + \\omega^2 x = 0, \\quad T = 2\\pi\\sqrt{\\frac{L}{g}}, \\quad T = 2\\pi\\sqrt{\\frac{m}{k}}',
        'y(x,t) = A\\sin(kx - \\omega t), \\quad f_{\\text{beat}} = |f_1 - f_2|'
      ],
      practicals: 'Resonance tube apparatus to find speed of sound in air at room temperature.'
    }
  ],
  '12': [
    {
      unit: 'Unit I',
      chapterNum: 1,
      name: 'Electric Charges and Fields',
      ncertRef: 'NCERT Class 12 Physics Part 1 • Chapter 1',
      weightageMarks: 8,
      status: 'completed',
      statusLabel: 'Board Revision Done',
      lecturesPlanned: 14,
      lecturesDelivered: 14,
      hoursDelivered: 16,
      completionRate: 100,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Coulomb law, electric field lines, electric dipole, Gauss theorem and applications.',
      topics: [
        { name: 'Conservation and quantization of electric charge; Coulomb\'s law in vector form', done: true },
        { name: 'Electric field due to point charge and electric dipole on axial and equatorial lines', done: true },
        { name: 'Electric flux and Gauss\'s law proof', done: true },
        { name: 'Applications of Gauss\'s law: infinite wire, infinite plane sheet, spherical shell', done: true }
      ],
      formulas: [
        'F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{q_1 q_2}{r^2}, \\quad E_{\\text{axial}} = \\frac{2kp}{r^3}, \\quad \\oint \\vec{E}\\cdot d\\vec{A} = \\frac{q_{\\text{in}}}{\\varepsilon_0}'
      ],
      practicals: 'Equipotential surface mapping for dipole and line charges.'
    },
    {
      unit: 'Unit II',
      chapterNum: 2,
      name: 'Current Electricity & Drift Velocity',
      ncertRef: 'NCERT Class 12 Physics Part 1 • Chapter 3',
      weightageMarks: 9,
      status: 'completed',
      statusLabel: 'Board Revision Done',
      lecturesPlanned: 15,
      lecturesDelivered: 15,
      hoursDelivered: 16,
      completionRate: 100,
      boardAligned: ['CBSE', 'HPBOSE', 'JEE', 'NEET'],
      summary: 'Ohm law, microscopic drift velocity, resistivity, Kirchhoff laws, Wheatstone bridge.',
      topics: [
        { name: 'Electric current, drift velocity vd = (eEτ)/m and microscopic relation I = n·e·A·vd', done: true },
        { name: 'Deduction of Ohm\'s law and microscopic formula for resistivity ρ = m / (n·e²·τ)', done: true },
        { name: 'Temperature dependence of resistivity and internal resistance of cells', done: true },
        { name: 'Kirchhoff\'s loop and junction rules; Wheatstone bridge condition derivation', done: true }
      ],
      formulas: [
        'I = n e A v_d, \\quad v_d = \\frac{e E \\tau}{m}, \\quad \\rho = \\frac{m}{n e^2 \\tau}, \\quad \\frac{P}{Q} = \\frac{R}{S}'
      ],
      practicals: 'Measurement of resistance using Metre Bridge and internal resistance via potentiometer.'
    }
  ]
};

window.renderTeacherSyllabusChapters = function(targetGrade = '11', filterTrack = 'ALL') {
  const container = document.getElementById('syllabusChaptersList');
  if (!container) return;

  const chapters = window.TEACHER_SYLLABUS_DATA[targetGrade] || window.TEACHER_SYLLABUS_DATA['11'] || [];
  
  let filtered = chapters;
  if (filterTrack && filterTrack !== 'ALL') {
    filtered = chapters.filter(c => c.boardAligned && c.boardAligned.includes(filterTrack));
  }

  container.innerHTML = filtered.map(ch => {
    const isCompleted = ch.status === 'completed';
    const isInProgress = ch.status === 'in-progress';
    const badgeClass = isCompleted ? 'chapter-badge-completed' : (isInProgress ? 'chapter-badge-active' : 'chapter-badge-upcoming');
    const statusPillClass = isCompleted ? 'status-completed' : (isInProgress ? 'status-inprogress' : 'status-upcoming');
    const borderClass = isCompleted ? 'completed' : (isInProgress ? 'in-progress' : '');
    const fillGradient = isCompleted ? '#10b981' : (isInProgress ? 'linear-gradient(90deg, #f59e0b, #eab308)' : '#64748b');

    const topicsHtml = (ch.topics || []).map(t => `
      <div class="chapter-topic-item">
        <i data-lucide="${t.done ? 'check-circle-2' : 'circle'}" style="width:14px; height:14px; color:${t.done ? '#34d399' : '#94a3b8'};"></i>
        <span style="${t.done ? 'color:#e2e8f0;' : 'color:#94a3b8;'}">${t.name}</span>
      </div>
    `).join('');

    const formulasHtml = (ch.formulas || []).map(f => `
      <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); padding:4px 8px; border-radius:6px; font-size:0.75rem; color:#38bdf8; font-family:monospace;">
        ${f}
      </div>
    `).join('');

    const teacherNoteHtml = ch.teacherNote ? `
      <div style="margin-top:10px; padding:8px 12px; background:rgba(245, 158, 11, 0.12); border-left:3px solid #fbbf24; border-radius:4px; font-size:0.78rem; color:#fde68a;">
        <strong>👨‍🏫 Live Classroom Focus:</strong> ${ch.teacherNote}
      </div>
    ` : '';

    return `
      <div class="syllabus-chapter-card ${borderClass}" id="syllabus_ch_${ch.chapterNum}">
        <div class="chapter-header-row">
          <div class="chapter-title-box">
            <div class="chapter-number-badge ${badgeClass}">
              ${ch.chapterNum}
            </div>
            <div>
              <div class="chapter-unit-name">${ch.unit} &bull; ${ch.ncertRef}</div>
              <h3 class="chapter-name">${ch.name}</h3>
            </div>
          </div>

          <div class="chapter-meta-badges">
            <span class="chapter-status-pill ${statusPillClass}">${ch.statusLabel}</span>
            <span style="font-size:0.72rem; color:#94a3b8; background:rgba(255,255,255,0.06); padding:3px 8px; border-radius:6px;">
              ⏱️ ${ch.lecturesDelivered} / ${ch.lecturesPlanned} Lectures (${ch.hoursDelivered} hrs)
            </span>
            <span style="font-size:0.72rem; color:#38bdf8; background:rgba(56,189,248,0.1); padding:3px 8px; border-radius:6px; font-weight:700;">
              Weightage: ${ch.weightageMarks} Marks
            </span>
          </div>
        </div>

        <!-- Progress bar for this chapter -->
        <div class="chapter-progress-track">
          <div class="chapter-progress-fill" style="width:${ch.completionRate}%; background:${fillGradient};"></div>
        </div>

        <p style="font-size:0.82rem; color:#94a3b8; margin:6px 0 10px 0; line-height:1.4;">
          ${ch.summary}
        </p>

        <!-- Topic Breakdown -->
        <div class="chapter-topics-grid">
          ${topicsHtml}
        </div>

        ${formulasHtml ? `
          <div style="margin-top:12px; display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
            <span style="font-size:0.7rem; text-transform:uppercase; font-weight:700; color:#94a3b8;">Key Governing Formulas:</span>
            ${formulasHtml}
          </div>
        ` : ''}

        ${ch.practicals ? `
          <div style="margin-top:10px; font-size:0.75rem; color:#a7f3d0; background:rgba(16, 185, 129, 0.08); padding:6px 10px; border-radius:6px;">
            🔬 <strong>Prescribed Lab Practical:</strong> ${ch.practicals}
          </div>
        ` : ''}

        ${teacherNoteHtml}
      </div>
    `;
  }).join('');

  if (window.lucide) {
    window.lucide.createIcons();
  }
};
