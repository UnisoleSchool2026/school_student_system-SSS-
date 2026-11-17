// ==============================================================================
// HAPS-AI SCHOLAR ASSISTANT: PERSONALIZED REMEDIAL ASSIGNMENT ENGINE
// Generates individualized remedial assignments based on student test telemetry,
// exact wrong answers, hesitation lag, distractor traps, and formula misconceptions.
// STRICT CONTEXT PRESERVATION: Biology -> Biology, Chemistry -> Chemistry, etc.
// ==============================================================================

const FORMULA_REPOSITORY = {
  // ============================================================================
  // SENIOR BIOLOGY (CLASS 12 & NEET)
  // ============================================================================
  'Verhulst-Pearl Logistic Growth Equation': {
    subject: 'Biology',
    name: 'Verhulst-Pearl Logistic Growth Differential Equation',
    latex: '\\frac{dN}{dt} = rN\\left(\\frac{K - N}{K}\\right)',
    prompt: 'Write the differential equation for Verhulst-Pearl Logistic Growth with carrying capacity K, intrinsic rate r, and population N:',
    canonicalPattern: /(dN\s*\/\s*dt\s*=\s*r\s*\*?N\s*\*?\(\s*\(?\s*K\s*-\s*N\s*\)?\s*\/\s*K\s*\))|(\\frac\{dN\}\{dt\}\s*=\s*rN\s*\\left\(\\frac\{K\s*-\s*N\}\{K\}\\right\))|(dN\/dt\s*=\s*rN\s*\(\s*1\s*-\s*N\/K\s*\))/i,
    signRules: 'Environmental resistance factor is (K - N)/K. When N << K, growth is near exponential. When N = K, dN/dt = 0 (asymptote). Logistic curve is S-shaped (Sigmoid).',
    practiceQuestion: {
      id: 'rem_q_bio_log_01',
      subject: 'Biology',
      topic: 'Organisms and Populations',
      subtopic: 'Verhulst-Pearl Logistic Growth Equation',
      questionLatex: 'A natural population of field mice has carrying capacity $K = 1000$ individuals and intrinsic rate $r = 0.1\\,\\text{month}^{-1}$. If current density is $N = 500$, calculate population growth rate $\\frac{dN}{dt}$.',
      options: [
        { key: 'A', latex: '$\\frac{dN}{dt} = 25\\,\\text{individuals/month}$', isCorrect: true },
        { key: 'B', latex: '$\\frac{dN}{dt} = 50\\,\\text{individuals/month}$', isCorrect: false, trap: 'Omitted the environmental resistance factor $(K-N)/K = 0.5$' },
        { key: 'C', latex: '$\\frac{dN}{dt} = 100\\,\\text{individuals/month}$', isCorrect: false, trap: 'Assumed exponential growth with $rN = 0.1 \\times 1000$' },
        { key: 'D', latex: '$\\frac{dN}{dt} = 0$', isCorrect: false, trap: 'Confused mid-capacity inflection point with asymptotic saturation ($N = K$)' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Using $$\\frac{dN}{dt} = rN\\left(\\frac{K - N}{K}\\right) = (0.1)(500)\\left(\\frac{1000 - 500}{1000}\\right) = 50 \\times 0.5 = 25\\,\\text{individuals/month}$$. Growth rate is maximized at $N = K/2$.'
    }
  },

  'Population Attributes & Growth Models': {
    subject: 'Biology',
    name: 'Verhulst-Pearl Logistic Growth Differential Equation',
    latex: '\\frac{dN}{dt} = rN\\left(\\frac{K - N}{K}\\right)',
    prompt: 'Write the Verhulst-Pearl logistic growth differential equation relating dN/dt with r, N, and carrying capacity K:',
    canonicalPattern: /(dN\s*\/\s*dt\s*=\s*r\s*\*?N\s*\*?\(\s*\(?\s*K\s*-\s*N\s*\)?\s*\/\s*K\s*\))|(\\frac\{dN\}\{dt\}\s*=\s*rN\s*\\left\(\\frac\{K\s*-\s*N\}\{K\}\\right\))/i,
    signRules: 'Resources in nature are finite and limiting. The carrying capacity K determines the maximum sustainable population ceiling.',
    practiceQuestion: {
      id: 'rem_q_bio_pop_01',
      subject: 'Biology',
      topic: 'Organisms and Populations',
      subtopic: 'Population Attributes & Growth Models',
      questionLatex: 'Why is the logistic growth model considered more realistic in ecology than the geometric exponential model?',
      options: [
        { key: 'A', latex: 'Natural environmental resources (food, space) are limiting, so populations face carrying capacity $K$', isCorrect: true },
        { key: 'B', latex: 'Natural populations never experience mortality under environmental pressures', isCorrect: false, trap: 'Incorrect: mortality increases as resources become limiting' },
        { key: 'C', latex: 'Exponential growth predicts instantaneous population extinction', isCorrect: false, trap: 'Exponential growth predicts infinite runaway population explosion, not extinction' },
        { key: 'D', latex: 'Logistic growth requires immigration to equal emigration continuously', isCorrect: false, trap: 'Logistic growth depends on intrinsic rate r and carrying capacity K, not equal migration' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Because no population in nature has unlimited resources at its disposal, competition for finite resources leads to an environmental carrying capacity $K$.'
    }
  },

  'Species-Area Relationship & Z-value Significance': {
    subject: 'Biology',
    name: 'Alexander von Humboldt Species-Area Power Law',
    latex: 'S = C A^Z \\quad \\text{and} \\quad \\log S = \\log C + Z \\log A',
    prompt: 'Write the logarithmic equation for Alexander von Humboldt species-area relationship relating species richness S, area A, and regression coefficient Z:',
    canonicalPattern: /(log\s*S\s*=\s*log\s*C\s*\+\s*Z\s*\*?\s*log\s*A)|(S\s*=\s*C\s*\*?\s*A\^?Z)|(\\log\s*S\s*=\s*\\log\s*C\s*\+\s*Z\s*\\log\s*A)/i,
    signRules: 'Z is the slope of line (regression coefficient). For local/regional areas, Z = 0.1 to 0.2. For very large areas like entire continents, the slope is much steeper with Z = 0.6 to 1.2.',
    practiceQuestion: {
      id: 'rem_q_bio_spec_01',
      subject: 'Biology',
      topic: 'Biodiversity and Conservation',
      subtopic: 'Species-Area Relationship & Z-value Significance',
      questionLatex: 'If you analyze the species-area relationship among frugivorous birds across large continents, what expected value will the slope $Z$ assume?',
      options: [
        { key: 'A', latex: '$Z = 1.15$ (Steep slope between $0.6\\text{--}1.2$ for continental scales)', isCorrect: true },
        { key: 'B', latex: '$Z = 0.15$ (Standard slope for small local woodland patches)', isCorrect: false, trap: 'Used local scale Z-value (0.1 to 0.2) instead of continental scale' },
        { key: 'C', latex: '$Z = 0.0$ (Species richness is completely independent of area)', isCorrect: false, trap: 'Z cannot be zero; larger areas provide more habitats and microclimates' },
        { key: 'D', latex: '$Z = -1.0$ (Inverse area relationship)', isCorrect: false, trap: 'Species richness increases with area, slope cannot be negative' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'For large areas like entire continents, the slope of the regression line $Z$ is much steeper, typically falling in the range of $0.6$ to $1.2$ (e.g. $1.15$ for frugivorous birds and mammals in tropical forests).'
    }
  },

  'Biodiversity Patterns and Loss': {
    subject: 'Biology',
    name: 'Alexander von Humboldt Species-Area Power Law',
    latex: 'S = C A^Z \\quad \\text{and} \\quad \\log S = \\log C + Z \\log A',
    prompt: 'Write the logarithmic species-area equation log S = log C + Z log A:',
    canonicalPattern: /(log\s*S\s*=\s*log\s*C\s*\+\s*Z\s*\*?\s*log\s*A)|(S\s*=\s*C\s*\*?\s*A\^?Z)/i,
    signRules: 'S = Species richness, A = Area, Z = regression coefficient (slope), C = Y-intercept.',
    practiceQuestion: {
      id: 'rem_q_bio_bio_01',
      subject: 'Biology',
      topic: 'Biodiversity and Conservation',
      subtopic: 'Biodiversity Patterns and Loss',
      questionLatex: 'Which of the "Evil Quartet" causes is the most important driver accelerating global animal and plant extinction?',
      options: [
        { key: 'A', latex: 'Habitat loss and fragmentation (e.g. clearing of Amazonian tropical rainforest)', isCorrect: true },
        { key: 'B', latex: 'Over-exploitation of commercial timber and fisheries', isCorrect: false, trap: 'Major secondary cause, but habitat loss is the primary driver' },
        { key: 'C', latex: 'Alien species invasion (e.g. Nile perch, Eichhornia)', isCorrect: false, trap: 'Significant threat to endemic species, but habitat loss ranks first' },
        { key: 'D', latex: 'Co-extinction of obligate host-parasite pairs', isCorrect: false, trap: 'Cascading secondary consequence of host species loss' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Habitat loss and fragmentation is the single most important factor driving animals and plants to extinction (e.g., clearing of the Amazon rainforest for soybean cultivation).'
    }
  },

  'Hardy-Weinberg Principle & Carrier Frequency': {
    subject: 'Biology',
    name: 'Hardy-Weinberg Genetic Equilibrium Law',
    latex: 'p^2 + 2pq + q^2 = 1 \\quad \\text{and} \\quad p + q = 1',
    prompt: 'Write the binomial expansion equation for Hardy-Weinberg equilibrium relating allele frequencies p and q:',
    canonicalPattern: /(p\^?2\s*\+\s*2\s*\*?p\s*\*?q\s*\+\s*q\^?2\s*=\s*1)|(p\s*\+\s*q\s*=\s*1)/i,
    signRules: 'p = frequency of dominant allele, q = frequency of recessive allele. p^2 = homozygous dominant, 2pq = heterozygous carriers, q^2 = homozygous recessive individuals.',
    practiceQuestion: {
      id: 'rem_q_bio_hw_01',
      subject: 'Biology',
      topic: 'Evolution',
      subtopic: 'Hardy-Weinberg Principle & Carrier Frequency',
      questionLatex: 'In a human population at Hardy-Weinberg equilibrium, cystic fibrosis (autosomal recessive) occurs in $1$ in $2500$ individuals ($q^2 = 0.0004$). What is the carrier frequency ($2pq$)?',
      options: [
        { key: 'A', latex: 'Carrier frequency $2pq \\approx 3.92\\%$ ($2 \\times 0.98 \\times 0.02 = 0.0392$)', isCorrect: true },
        { key: 'B', latex: 'Carrier frequency $= 2.00\\%$ ($q = 0.02$)', isCorrect: false, trap: 'Substituted recessive allele frequency q instead of carrier frequency 2pq' },
        { key: 'C', latex: 'Carrier frequency $= 0.04\\%$ ($q^2$ directly)', isCorrect: false, trap: 'Reported affected homozygous individual frequency instead of heterozygous carriers' },
        { key: 'D', latex: 'Carrier frequency $= 96.04\\%$ ($p^2$ frequency)', isCorrect: false, trap: 'Calculated homozygous dominant healthy frequency $p^2$' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Given $q^2 = 0.0004 \\implies q = \\sqrt{0.0004} = 0.02$. Therefore $p = 1 - 0.02 = 0.98$. Heterozygous carrier frequency $2pq = 2(0.98)(0.02) = 0.0392 = 3.92\\%$.'
    }
  },

  'Hardy-Weinberg Frequency Calculation': {
    subject: 'Biology',
    name: 'Hardy-Weinberg Genetic Equilibrium Law',
    latex: 'p^2 + 2pq + q^2 = 1 \\quad \\text{and} \\quad p + q = 1',
    prompt: 'Write the Hardy-Weinberg binomial equation p^2 + 2pq + q^2 = 1:',
    canonicalPattern: /(p\^?2\s*\+\s*2\s*\*?p\s*\*?q\s*\+\s*q\^?2\s*=\s*1)|(p\s*\+\s*q\s*=\s*1)/i,
    signRules: 'Sum of all allelic frequencies is 1 (p + q = 1). In absence of evolutionary forces, genotypic frequencies remain constant across generations.',
    practiceQuestion: {
      id: 'rem_q_bio_hw_02',
      subject: 'Biology',
      topic: 'Evolution',
      subtopic: 'Hardy-Weinberg Frequency Calculation',
      questionLatex: 'In a randomly mating population, recessive allele frequency $q = 0.2$. What is the percentage of heterozygous carriers ($Aa$)?',
      options: [
        { key: 'A', latex: '$32\\%$ ($2pq = 2 \\times 0.8 \\times 0.2 = 0.32$)', isCorrect: true },
        { key: 'B', latex: '$16\\%$ ($pq = 0.16$)', isCorrect: false, trap: 'Forgot factor of 2 in binomial expansion ($pq$ instead of $2pq$)' },
        { key: 'C', latex: '$64\\%$ ($p^2 = 0.64$)', isCorrect: false, trap: 'Reported homozygous dominant frequency $AA$' },
        { key: 'D', latex: '$4\\%$ ($q^2 = 0.04$)', isCorrect: false, trap: 'Reported homozygous recessive frequency $aa$' }
      ],
      correctAnswer: 'A',
      solutionLatex: '$p = 1 - q = 1 - 0.2 = 0.8$. Heterozygous frequency $2pq = 2(0.8)(0.2) = 0.32 \\implies 32\\%$.'
    }
  },

  'Lac Operon Regulation & Inducer Mechanism': {
    subject: 'Biology',
    name: 'Lac Operon Negative Inducible Regulatory Model',
    latex: '\\text{Inducer (Allolactose)} + \\text{Repressor} \\rightarrow \\text{Inactive Complex} \\implies \\text{Transcription ON}',
    prompt: 'State the molecular mechanism by which allolactose triggers Lac Operon transcription:',
    canonicalPattern: /(allolactose|inducer|repressor|operator|beta-galactosidase|permease)/i,
    signRules: 'The repressor protein binds operator to block RNA polymerase (switched OFF). Allolactose acts as inducer, binding and inactivating repressor, freeing operator (switched ON).',
    practiceQuestion: {
      id: 'rem_q_bio_lac_01',
      subject: 'Biology',
      topic: 'Molecular Basis of Inheritance',
      subtopic: 'Lac Operon Regulation & Inducer Mechanism',
      questionLatex: 'Which enzyme is encoded by the structural gene $lac\\,z$ in the Lac Operon of $E. coli$?',
      options: [
        { key: 'A', latex: '$\\beta$-galactosidase (hydrolyzes lactose into glucose and galactose)', isCorrect: true },
        { key: 'B', latex: 'Permease (increases membrane permeability to $\\beta$-galactosides)', isCorrect: false, trap: 'Permease is encoded by the lac y gene' },
        { key: 'C', latex: 'Transacetylase (transfers acetyl group from acetyl-CoA)', isCorrect: false, trap: 'Transacetylase is encoded by the lac a gene' },
        { key: 'D', latex: 'RNA polymerase core enzyme', isCorrect: false, trap: 'RNA polymerase is a cellular housekeeping enzyme, not encoded by lac structural genes' }
      ],
      correctAnswer: 'A',
      solutionLatex: '$lac\\,z$ encodes $\\beta$-galactosidase, $lac\\,y$ encodes permease, and $lac\\,a$ encodes transacetylase.'
    }
  },

  'Lac Operon Induction & Regulatory Mechanism': {
    subject: 'Biology',
    name: 'Lac Operon Negative Inducible Regulatory Model',
    latex: '\\text{Inducer (Allolactose)} + \\text{Repressor} \\rightarrow \\text{Inactive Complex}',
    prompt: 'State the regulatory role of the repressor protein in the Lac Operon:',
    canonicalPattern: /(repressor|operator|allolactose|inducer|promoter)/i,
    signRules: 'Regulation of the lac operon by repressor is termed negative regulation because the active repressor turns transcription off.',
    practiceQuestion: {
      id: 'rem_q_bio_lac_02',
      subject: 'Biology',
      topic: 'Molecular Basis of Inheritance',
      subtopic: 'Lac Operon Induction & Regulatory Mechanism',
      questionLatex: 'Why is the regulation of the lac operon in $E. coli$ characterized as "negative regulation"?',
      options: [
        { key: 'A', latex: 'Because transcription is constitutively blocked by the binding of an active repressor protein to the operator', isCorrect: true },
        { key: 'B', latex: 'Because lactose inhibits glucose metabolism in bacterial cells', isCorrect: false, trap: 'Confused operon regulation with catabolite repression' },
        { key: 'C', latex: 'Because the repressor degrades mRNA molecules immediately after synthesis', isCorrect: false, trap: 'Repressor prevents transcription initiation, does not degrade mRNA' },
        { key: 'D', latex: 'Because RNA polymerase acts as a transcription terminator', isCorrect: false, trap: 'RNA polymerase initiates and elongates transcription' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Regulation is negative because transcription is normally kept switched off by the binding of the active repressor protein to the operator sequence.'
    }
  },

  'Insertional Inactivation in pBR322 Vector': {
    subject: 'Biology',
    name: 'Insertional Inactivation of Selectable Marker in pBR322',
    latex: '\\text{Foreign DNA inserted at } Bam\\text{HI} \\implies tet^R \\text{ Inactivated (Loss of Resistance)}',
    prompt: 'State the antibiotic resistance consequence when foreign DNA is spliced into the BamHI site of plasmid pBR322:',
    canonicalPattern: /(tet|tetracycline|inactivat|ampicillin|bamhi)/i,
    signRules: 'pBR322 has two selectable antibiotic markers: amp^R and tet^R. BamHI site is located in tet^R. Foreign gene insertion in BamHI inactivates tet^R (recombinants grow on ampicillin but die on tetracycline).',
    practiceQuestion: {
      id: 'rem_q_bio_pbr_01',
      subject: 'Biology',
      topic: 'Biotechnology: Principles and Processes',
      subtopic: 'Insertional Inactivation in pBR322 Vector',
      questionLatex: 'A recombinant plasmid pBR322 with an insert in its $Bam\\text{HI}$ restriction site will demonstrate which growth profile on antibiotic agar plates?',
      options: [
        { key: 'A', latex: 'Grows on ampicillin plate, but fails to grow (dies) on tetracycline plate', isCorrect: true },
        { key: 'B', latex: 'Grows on tetracycline plate, but dies on ampicillin plate', isCorrect: false, trap: 'Confused BamHI (tetR) with PstI/PvuI (ampR)' },
        { key: 'C', latex: 'Grows on both ampicillin and tetracycline plates equally', isCorrect: false, trap: 'Non-recombinant plasmids grow on both; recombinants lose tetracycline resistance' },
        { key: 'D', latex: 'Fails to grow on both ampicillin and tetracycline plates', isCorrect: false, trap: 'ampR gene remains intact, so cells still survive on ampicillin' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'The $Bam\\text{HI}$ site lies inside the $tet^R$ gene. Insertion disrupts $tet^R$ (insertional inactivation), so recombinants retain intact $amp^R$ (grow on ampicillin) but lose $tet^R$ (die on tetracycline).'
    }
  },

  'RNA Interference (RNAi) in Pest-Resistant Plants': {
    subject: 'Biology',
    name: 'RNA Interference (RNAi) Cellular Gene Silencing',
    latex: '\\text{Sense} + \\text{Anti-sense RNA} \\rightarrow \\text{dsRNA} \\implies \\text{Silences Specific Nematode mRNA}',
    prompt: 'State the role of double-stranded RNA (dsRNA) in protecting transgenic tobacco against Meloidogyne incognita:',
    canonicalPattern: /(dsrna|silenc|mrna|sense|anti-sense|nematode|rnai)/i,
    signRules: 'Vector Agrobacterium introduces nematode-specific genes producing both sense and anti-sense RNA. These hybridize into dsRNA which triggers cellular RNAi, post-transcriptionally silencing nematode mRNA.',
    practiceQuestion: {
      id: 'rem_q_bio_rnai_01',
      subject: 'Biology',
      topic: 'Biotechnology and its Applications',
      subtopic: 'RNA Interference (RNAi) in Pest-Resistant Plants',
      questionLatex: 'Which vector was utilized to introduce nematode-specific genes into host tobacco plants to trigger RNA interference?',
      options: [
        { key: 'A', latex: '$Agrobacterium\\,tumefaciens$ disarmed Ti plasmid vector', isCorrect: true },
        { key: 'B', latex: '$Bacillus\\,thuringiensis$ bacteriophage vector', isCorrect: false, trap: 'Bt is the source of Cry endotoxin, not the vector for RNAi plant transformation' },
        { key: 'C', latex: 'Retroviral oncogene vector', isCorrect: false, trap: 'Retroviruses are used in animal gene therapy, not plant transformation' },
        { key: 'D', latex: 'Thermus aquaticus vector', isCorrect: false, trap: 'T. aquaticus is the source of Taq polymerase for PCR' }
      ],
      correctAnswer: 'A',
      solutionLatex: '$Agrobacterium\\,tumefaciens$ vectors were used to introduce nematode-specific genes producing sense and anti-sense RNA into the host tobacco plant.'
    }
  },

  'Inverted Biomass Pyramid in Ocean vs Always Upright Energy Pyramid': {
    subject: 'Biology',
    name: 'Ecological Pyramid Principles & Thermodynamic Energy Law',
    latex: '\\text{Energy Pyramid is ALWAYS Upright (Lindeman 10\\% Law)}',
    prompt: 'State why the pyramid of energy can never be inverted in any ecosystem:',
    canonicalPattern: /(10%|thermodynamic|energy|unidirectional|heat|loss)/i,
    signRules: 'Energy transfer is strictly unidirectional and obeys Second Law of Thermodynamics (approx 90% lost as heat at each step). In aquatic ecosystems, biomass pyramid is inverted because phytoplankton have rapid turnover and small standing crop.',
    practiceQuestion: {
      id: 'rem_q_bio_pyr_01',
      subject: 'Biology',
      topic: 'Ecosystem',
      subtopic: 'Inverted Biomass Pyramid in Ocean vs Always Upright Energy Pyramid',
      questionLatex: 'Why is the pyramid of biomass in a deep lake or sea ecosystem inverted?',
      options: [
        { key: 'A', latex: 'The standing crop biomass of short-lived phytoplankton is smaller than that of long-lived predatory fishes', isCorrect: true },
        { key: 'B', latex: 'Primary producers consume zooplankton biomass during darkness', isCorrect: false, trap: 'Producers are autotrophs photosynthesizing, not consuming zooplankton' },
        { key: 'C', latex: 'Sunlight cannot penetrate aquatic ecosystems beyond $1\\,\\text{meter}$', isCorrect: false, trap: 'Sunlight penetrates euphotic zone up to 200m' },
        { key: 'D', latex: 'Energy flows backwards from fishes to phytoplankton', isCorrect: false, trap: 'Energy flow can NEVER be reversed in any ecosystem' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'In open sea and lakes, tiny phytoplankton reproduce rapidly and have high turnover with small standing biomass at any instant, supporting a larger biomass of long-lived zooplankton and fishes.'
    }
  },

  'Sickle-cell Anemia vs Thalassemia': {
    subject: 'Biology',
    name: 'Point Mutation vs Chain Synthesis Defect in Hemoglobinopathies',
    latex: 'GAG \\rightarrow GUG \\quad (\\text{Glutamic Acid} \\rightarrow \\text{Valine at Codon 6 of } \\beta\\text{-globin})',
    prompt: 'State the exact point mutation transversion causing sickle-cell anemia at codon 6 of beta-globin gene:',
    canonicalPattern: /(GAG\s*->\s*GUG|glutamic|valine|codon\s*6|point\s*mutation)/i,
    signRules: 'Sickle cell anemia is a qualitative defect (synthesizes defective HbS). Thalassemia is a quantitative defect (reduced or absent synthesis of alpha or beta globin chains).',
    practiceQuestion: {
      id: 'rem_q_bio_sca_01',
      subject: 'Biology',
      topic: 'Principles of Inheritance and Variation',
      subtopic: 'Sickle-cell Anemia vs Thalassemia',
      questionLatex: 'What structural substitution occurs at the 6th position of the $\\beta$-globin polypeptide chain in sickle-cell anemia?',
      options: [
        { key: 'A', latex: 'Glutamic acid (hydrophilic) is replaced by Valine (hydrophobic) due to a $GAG \\rightarrow GUG$ point mutation', isCorrect: true },
        { key: 'B', latex: 'Valine is replaced by Glutamic acid due to a $GUG \\rightarrow GAG$ mutation', isCorrect: false, trap: 'Inverted the mutant and normal amino acids' },
        { key: 'C', latex: 'Lysine is deleted causing a frameshift alteration of 40 codons', isCorrect: false, trap: 'Sickle-cell is a single base substitution, not a deletion' },
        { key: 'D', latex: 'Histidine replaces Leucine causing spontaneous globin cleavage', isCorrect: false, trap: 'Histidine/Leucine is not involved at codon 6' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Sickle-cell anemia results from a transversion replacing Adenine with Thymine in codon 6 ($GAG \\to GUG$), substituting hydrophilic Glutamic acid with hydrophobic Valine.'
    }
  },

  'Filiform Apparatus & Sporopollenin in Exine': {
    subject: 'Biology',
    name: 'Synergid Filiform Guidance & Pollen Sporopollenin Resilience',
    latex: '\\text{Exine contains Sporopollenin (Non-degradable by any known enzyme)}',
    prompt: 'State the function of the filiform apparatus located in synergids of angiosperm embryo sac:',
    canonicalPattern: /(filiform|pollen\s*tube|synergid|sporopollenin|exine|entry)/i,
    signRules: 'Filiform apparatus has finger-like cellular thickenings at synergid micropylar tip that guide pollen tube entry. Sporopollenin is the most resistant organic material known, making pollen fossilizable.',
    practiceQuestion: {
      id: 'rem_q_bio_fili_01',
      subject: 'Biology',
      topic: 'Sexual Reproduction in Flowering Plants',
      subtopic: 'Filiform Apparatus & Sporopollenin in Exine',
      questionLatex: 'Why can pollen grains remain preserved for thousands of years as fossils without degradation?',
      options: [
        { key: 'A', latex: 'The outer pollen exine contains sporopollenin, which resists high temperatures, strong acids/alkalis, and enzymatic breakdown', isCorrect: true },
        { key: 'B', latex: 'The inner intine layer contains impervious crystalline silica', isCorrect: false, trap: 'Intine consists of pectin and cellulose, which degrade readily' },
        { key: 'C', latex: 'Pollen grains produce antibacterial antibodies continuously', isCorrect: false, trap: 'Plants do not synthesize antibodies' },
        { key: 'D', latex: 'The generative cell nucleus undergoes complete dehydration and calcification', isCorrect: false, trap: 'Exine sporopollenin provides physical/chemical resistance, not calcification' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'The outer exine wall is composed of sporopollenin, one of the most resistant biological substances known, enabling fossilization.'
    }
  },

  'Ovarian & Pituitary Hormones during Menstrual Cycle': {
    subject: 'Biology',
    name: 'Hormonal Feedback & LH Surge in Human Menstrual Cycle',
    latex: '\\text{Estrogen Peak} \\rightarrow \\text{LH Surge (Day 14)} \\implies \\text{Ovulation of Secondary Oocyte}',
    prompt: 'State which hormone induces the LH surge on Day 14 and which structure secretes progesterone during the luteal phase:',
    canonicalPattern: /(estrogen|lh\s*surge|progesterone|corpus\s*luteum|ovulation)/i,
    signRules: 'Rising estrogen from developing follicles triggers positive feedback LH surge -> ovulation. Ruptured Graafian follicle becomes Corpus Luteum -> secretes progesterone to maintain vascular endometrium.',
    practiceQuestion: {
      id: 'rem_q_bio_mens_01',
      subject: 'Biology',
      topic: 'Human Reproduction',
      subtopic: 'Ovarian & Pituitary Hormones during Menstrual Cycle',
      questionLatex: 'What hormonal event triggers the breakdown of the endometrium leading to menstrual bleeding in the absence of fertilization?',
      options: [
        { key: 'A', latex: 'Degeneration of the corpus luteum causing a steep decline in progesterone levels', isCorrect: true },
        { key: 'B', latex: 'A sudden surge in anterior pituitary prolactin', isCorrect: false, trap: 'Prolactin stimulates milk production, not endometrial breakdown' },
        { key: 'C', latex: 'Massive secretion of human chorionic gonadotropin (hCG)', isCorrect: false, trap: 'hCG is secreted by trophoblast only if fertilization occurs' },
        { key: 'D', latex: 'Rupture of the Graafian follicle on Day 14', isCorrect: false, trap: 'Follicle rupture causes ovulation on Day 14, not menstruation' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'If fertilization does not occur, the corpus luteum degenerates into corpus albicans. Progesterone levels fall sharply, causing endometrial disintegration and menstruation.'
    }
  },

  'Intrauterine Devices (IUDs) Classification and Action': {
    subject: 'Biology',
    name: 'Intrauterine Contraceptive Mechanisms & Copper Ion Kinetics',
    latex: 'Cu^{2+} \\text{ Ions} \\implies \\text{Suppress Sperm Motility and Fertilizing Capacity}',
    prompt: 'State the cellular mechanism by which copper-releasing IUDs (e.g. CuT) prevent pregnancy:',
    canonicalPattern: /(copper|cu2\+|motility|sperm|phagocytosis|fertiliz)/i,
    signRules: 'Copper-releasing IUDs (CuT, Cu7, Multiload 375) release Cu2+ ions that suppress sperm motility and fertilizing ability, while stimulating uterine phagocytosis of sperms.',
    practiceQuestion: {
      id: 'rem_q_bio_iud_01',
      subject: 'Biology',
      topic: 'Reproductive Health',
      subtopic: 'Intrauterine Devices (IUDs) Classification and Action',
      questionLatex: 'Which of the following is an example of a hormone-releasing Intrauterine Device (IUD)?',
      options: [
        { key: 'A', latex: 'LNG-20 (Progestasert)', isCorrect: true },
        { key: 'B', latex: 'Lippes loop (Non-medicated IUD)', isCorrect: false, trap: 'Lippes loop is non-medicated' },
        { key: 'C', latex: 'Multiload 375 (Copper-releasing IUD)', isCorrect: false, trap: 'Multiload 375 is copper-releasing, not hormone-releasing' },
        { key: 'D', latex: 'Copper T (CuT)', isCorrect: false, trap: 'CuT is a copper-releasing IUD' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'LNG-20 and Progestasert are hormone-releasing IUDs that make the uterus unsuitable for implantation and cervix hostile to sperms.'
    }
  },

  // ============================================================================
  // CHEMISTRY (SENIOR & CLASS 12)
  // ============================================================================
  'Chemical Thermodynamics': {
    subject: 'Chemistry',
    name: 'Standard Gibbs Free Energy & Cell Potential',
    latex: '\\Delta G^\\circ = -n F E^\\circ_{\\text{cell}}',
    prompt: 'Write the relation between standard Gibbs free energy change ΔG°, electron transfer n, Faraday constant F, and cell potential E°:',
    canonicalPattern: /(delta\s*G\s*=\s*-?\s*n\s*\*?\s*F\s*\*?\s*E)|(\\Delta\s*G\s*=\s*-nFE)/i,
    signRules: 'Spontaneous galvanic cell processes require E° > 0 and ΔG° < 0. Don\'t forget the negative sign in ΔG° = -nFE°!',
    practiceQuestion: {
      id: 'rem_q_thermo_01',
      subject: 'Chemistry',
      topic: 'Chemical Thermodynamics',
      subtopic: 'Chemical Thermodynamics',
      questionLatex: 'For a galvanic cell reaction with $n = 2$ electrons transferred, $E^\\circ_{\\text{cell}} = +1.10\\,\\text{V}$. Taking $F = 96500\\,\\text{C/mol}$, calculate $\\Delta G^\\circ$ in $\\text{kJ/mol}$.',
      options: [
        { key: 'A', latex: '$\\Delta G^\\circ = -212.3\\,\\text{kJ/mol}$', isCorrect: true },
        { key: 'B', latex: '$\\Delta G^\\circ = +212.3\\,\\text{kJ/mol}$', isCorrect: false, trap: 'Forgot the negative sign in $\\Delta G^\\circ = -nFE^\\circ$' },
        { key: 'C', latex: '$\\Delta G^\\circ = -106.15\\,\\text{kJ/mol}$', isCorrect: false, trap: 'Used $n = 1$ instead of $n = 2$ electrons transferred' },
        { key: 'D', latex: '$\\Delta G^\\circ = -424.6\\,\\text{kJ/mol}$', isCorrect: false, trap: 'Multiplied by 4 instead of 2' }
      ],
      correctAnswer: 'A',
      solutionLatex: '$$\\Delta G^\\circ = -n F E^\\circ = -(2) \\times (96500) \\times (1.10) = -212300\\,\\text{J/mol} = -212.3\\,\\text{kJ/mol}$$.'
    }
  },

  'Standard Gibbs Free Energy & Cell Potential': {
    subject: 'Chemistry',
    name: 'Standard Gibbs Free Energy & Cell Potential',
    latex: '\\Delta G^\\circ = -n F E^\\circ_{\\text{cell}}',
    prompt: 'Write the relation between standard Gibbs free energy change ΔG°, electron transfer n, Faraday constant F, and cell potential E°:',
    canonicalPattern: /(delta\s*G\s*=\s*-?\s*n\s*\*?\s*F\s*\*?\s*E)|(\\Delta\s*G\s*=\s*-nFE)/i,
    signRules: 'Spontaneous galvanic cell processes require E° > 0 and ΔG° < 0.',
    practiceQuestion: {
      id: 'rem_q_chem_gibbs_01',
      subject: 'Chemistry',
      topic: 'Electrochemistry',
      subtopic: 'Standard Gibbs Free Energy & Cell Potential',
      questionLatex: 'If a Daniell cell has standard potential $E^\\circ = 1.10\\,\\text{V}$, what is the value of $\\Delta G^\\circ$?',
      options: [
        { key: 'A', latex: '$-212.3\\,\\text{kJ/mol}$', isCorrect: true },
        { key: 'B', latex: '$+212.3\\,\\text{kJ/mol}$', isCorrect: false, trap: 'Forgot negative sign' },
        { key: 'C', latex: '$-106.1\\,\\text{kJ/mol}$', isCorrect: false, trap: 'Used n=1' },
        { key: 'D', latex: '$-424.6\\,\\text{kJ/mol}$', isCorrect: false, trap: 'Used n=4' }
      ],
      correctAnswer: 'A',
      solutionLatex: '$$\\Delta G^\\circ = -n F E^\\circ = -2 \\times 96500 \\times 1.10 = -212.3\\,\\text{kJ/mol}$$.'
    }
  },

  // ============================================================================
  // MATHEMATICS (CLASS 10 & 12)
  // ============================================================================
  'Quadratic Equations': {
    subject: 'Mathematics',
    name: 'Quadratic Discriminant & Nature of Roots',
    latex: 'D = b^2 - 4ac \\quad \\text{and} \\quad x = \\frac{-b \\pm \\sqrt{D}}{2a}',
    prompt: 'Write the discriminant formula D for the quadratic equation ax² + bx + c = 0:',
    canonicalPattern: /(D\s*=\s*b\^?2\s*-\s*4\s*\*?\s*a\s*\*?\s*c)|(b\^?2\s*-\s*4ac)/i,
    signRules: 'If D > 0: two distinct real roots. If D = 0: two equal real roots. If D < 0: no real roots (complex conjugates).',
    practiceQuestion: {
      id: 'rem_q_quad_01',
      subject: 'Mathematics',
      topic: 'Mathematics',
      subtopic: 'Quadratic Equations',
      questionLatex: 'Find the discriminant $D$ for the quadratic equation $2x^2 - 4x + 3 = 0$ and state the nature of its roots.',
      options: [
        { key: 'A', latex: '$D = -8$ (No real roots)', isCorrect: true },
        { key: 'B', latex: '$D = +8$ (Two distinct real roots)', isCorrect: false, trap: 'Subtracted in reverse: $4ac - b^2$' },
        { key: 'C', latex: '$D = 40$', isCorrect: false, trap: 'Added $4ac$ instead of subtracting: $b^2 + 4ac$' },
        { key: 'D', latex: '$D = 0$ (Equal roots)', isCorrect: false, trap: 'Sign error in calculation' }
      ],
      correctAnswer: 'A',
      solutionLatex: '$$D = b^2 - 4ac = (-4)^2 - 4(2)(3) = 16 - 24 = -8$$. Since $D < 0$, the equation has no real roots.'
    }
  },

  // ============================================================================
  // PHYSICS (CLASS 10 & 12)
  // ============================================================================
  'Spherical Mirrors': {
    subject: 'Physics',
    name: 'Mirror Formula & New Cartesian Sign Conventions',
    latex: '\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u}',
    magnificationLatex: 'm = -\\frac{v}{u} = \\frac{h_i}{h_o}',
    prompt: 'Write the Mirror Formula relating focal length f, image distance v, and object distance u:',
    canonicalPattern: /(1\s*\/\s*f\s*=\s*1\s*\/\s*v\s*\+\s*1\s*\/\s*u)|(1\s*\/\s*v\s*\+\s*1\s*\/\s*u\s*=\s*1\s*\/\s*f)|(\\frac\{1\}\{f\}\s*=\s*\\frac\{1\}\{v\}\s*\+\s*\\frac\{1\}\{u\})/i,
    signRules: 'Concave mirror: f is always NEGATIVE (f < 0). Object distance u is always NEGATIVE (u < 0). Real image: v is NEGATIVE (v < 0).',
    practiceQuestion: {
      id: 'rem_q_mirror_01',
      subject: 'Physics',
      topic: 'Light – Reflection and Refraction',
      subtopic: 'Spherical Mirrors',
      questionLatex: 'An object is placed at $u = -20\\,\\text{cm}$ in front of a concave mirror of focal length $f = -10\\,\\text{cm}$. Calculate the position $v$ of the image formed.',
      options: [
        { key: 'A', latex: '$v = -20\\,\\text{cm}$ (at Center of Curvature $C$)', isCorrect: true },
        { key: 'B', latex: '$v = +20\\,\\text{cm}$ (behind mirror)', isCorrect: false, trap: 'Forgot negative sign for real image in front of mirror' },
        { key: 'C', latex: '$v = -10\\,\\text{cm}$ (at focus)', isCorrect: false, trap: 'Confused object location with focal point' },
        { key: 'D', latex: '$v = -6.67\\,\\text{cm}$', isCorrect: false, trap: 'Added focal length instead of subtracting in formula inversion' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Using mirror formula: $$\\frac{1}{f} = \\frac{1}{v} + \\frac{1}{u} \\implies \\frac{1}{-10} = \\frac{1}{v} + \\frac{1}{-20}$$ isolates to: $$\\frac{1}{v} = -\\frac{1}{10} + \\frac{1}{20} = -\\frac{1}{20} \\implies v = -20\\,\\text{cm}.$$ The image is real, inverted, and located at $C$.'
    }
  },

  'Refraction & Snell Law': {
    subject: 'Physics',
    name: "Snell's Law & Refractive Index Velocity Equation",
    latex: 'n = \\frac{c}{v} \\quad \\text{and} \\quad n_1 \\sin(i) = n_2 \\sin(r)',
    prompt: 'Write the formula for refractive index n of a medium in terms of speed of light in vacuum c and speed in medium v:',
    canonicalPattern: /(n\s*=\s*c\s*\/\s*v)|(n\s*=\s*\\frac\{c\}\{v\})|(v\s*=\s*c\s*\/\s*n)/i,
    signRules: 'Refractive index is dimensionless (n > 1 for dense optical media). As n increases, speed of light v decreases proportionally.',
    practiceQuestion: {
      id: 'rem_q_snell_01',
      subject: 'Physics',
      topic: 'Light – Reflection and Refraction',
      subtopic: 'Refraction & Snell Law',
      questionLatex: 'A beam of light travels from vacuum into dense flint glass of refractive index $n = 1.5$. If $c = 3.0 \\times 10^8\\,\\text{m/s}$, what is the speed of light in the glass?',
      options: [
        { key: 'A', latex: '$v = 2.0 \\times 10^8\\,\\text{m/s}$', isCorrect: true },
        { key: 'B', latex: '$v = 4.5 \\times 10^8\\,\\text{m/s}$', isCorrect: false, trap: 'Multiplied by n instead of dividing by n' },
        { key: 'C', latex: '$v = 1.5 \\times 10^8\\,\\text{m/s}$', isCorrect: false, trap: 'Substituted refractive index directly as velocity' },
        { key: 'D', latex: '$v = 2.25 \\times 10^8\\,\\text{m/s}$', isCorrect: false, trap: 'Used water refractive index (1.33) calculation' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Using $n = \\frac{c}{v} \\implies v = \\frac{c}{n} = \\frac{3.0 \\times 10^8\\,\\text{m/s}}{1.5} = 2.0 \\times 10^8\\,\\text{m/s}$.'
    }
  },

  'Joule Heating & Resistance': {
    subject: 'Physics',
    name: "Joule's Heating Law with SI Units Transformation",
    latex: 'H = I^2 R t = \\frac{V^2}{R} t = V I t',
    prompt: "Write Joule's Heating formula relating heat energy H with voltage V, resistance R, and time t:",
    canonicalPattern: /(H\s*=\s*I\^?2\s*\*?\s*R\s*\*?\s*t)|(H\s*=\s*V\^?2\s*\/\s*R\s*\*?\s*t)|(H\s*=\s*V\s*\*?\s*I\s*\*?\s*t)|(\\frac\{V\^?2\}\{R\}\s*\*?\s*t)/i,
    signRules: 'CRITICAL RULE: Time t MUST be converted to seconds (1 hour = 3600 seconds, 1 minute = 60 seconds). Never leave time in hours or minutes!',
    practiceQuestion: {
      id: 'rem_q_joule_01',
      subject: 'Physics',
      topic: 'Electricity',
      subtopic: 'Joule Heating & Resistance',
      questionLatex: 'An electric immersion heater of resistance $R = 100\\,\\Omega$ is operated at $V = 200\\,\\text{V}$ for $t = 10\\,\\text{minutes}$. Calculate the heat dissipated in Joules.',
      options: [
        { key: 'A', latex: '$H = 2.4 \\times 10^5\\,\\text{J}$', isCorrect: true },
        { key: 'B', latex: '$H = 4.0 \\times 10^3\\,\\text{J}$', isCorrect: false, trap: 'Forgot to convert 10 minutes to seconds ($600\\,\\text{s}$)' },
        { key: 'C', latex: '$H = 4.0 \\times 10^5\\,\\text{J}$', isCorrect: false, trap: 'Used $t = 1000\\,\\text{s}$ instead of $600\\,\\text{s}$' },
        { key: 'D', latex: '$H = 2.4 \\times 10^6\\,\\text{J}$', isCorrect: false, trap: 'Extra factor of 10 in voltage squared multiplication' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'First convert time to seconds: $t = 10 \\times 60 = 600\\,\\text{s}$. Then: $$H = \\frac{V^2}{R} t = \\frac{(200)^2}{100} \\times 600 = \\frac{40000}{100} \\times 600 = 400 \\times 600 = 240,000\\,\\text{J} = 2.4 \\times 10^5\\,\\text{J}$$.'
    }
  },

  'Rotational Motion': {
    subject: 'Physics',
    name: "Centripetal Torque & Angular Acceleration Relation",
    latex: '\\vec{\\tau} = \\vec{r} \\times \\vec{F} = I \\vec{\\alpha} \\quad \\text{and} \\quad \\tau_{\\text{centripetal}} = 0',
    prompt: 'Write the torque formula relating position vector r and force vector F:',
    canonicalPattern: /(tau\s*=\s*r\s*x\s*F)|(\\tau\s*=\s*\\vec\{r\}\s*\\times\s*\\vec\{F\})|(\\tau\s*=\s*I\s*\\alpha)|(tau\s*=\s*I\s*\*?\s*alpha)/i,
    signRules: 'Torque requires perpendicular distance: \\tau = r F \\sin(\\theta). For centripetal forces directed towards center, angle \\theta = 180^\\circ \\implies \\sin(180^\\circ) = 0, so centripetal torque is identically zero.',
    practiceQuestion: {
      id: 'rem_q_rot_01',
      subject: 'Physics',
      topic: 'Rotational Motion',
      subtopic: 'Rotational Motion',
      questionLatex: 'A solid uniform cylinder of mass $M$ and radius $R$ is rotated by an applied tangential force $F$ at its rim. What is its angular acceleration $\\alpha$ if $I = \\frac{1}{2} M R^2$?',
      options: [
        { key: 'A', latex: '$\\alpha = \\frac{2F}{MR}$', isCorrect: true },
        { key: 'B', latex: '$\\alpha = \\frac{F}{MR}$', isCorrect: false, trap: 'Treated cylinder as hollow thin shell ($I=MR^2$)' },
        { key: 'C', latex: '$\\alpha = \\frac{F}{2MR}$', isCorrect: false, trap: 'Multiplied instead of dividing by moment of inertia constant' },
        { key: 'D', latex: '$\\alpha = \\frac{4F}{MR}$', isCorrect: false, trap: 'Incorrectly squared the radius factor' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Torque $\\tau = F R$. Using $\\tau = I \\alpha \\implies F R = \\left(\\frac{1}{2} M R^2\\right) \\alpha \\implies \\alpha = \\frac{2F}{MR}$.'
    }
  },

  'Ampere Circuital Law & Solenoid Field': {
    subject: 'Physics',
    name: "Ampere's Circuital Law & Long Solenoid Magnetic Field",
    latex: '\\oint \\vec{B} \\cdot d\\vec{l} = \\mu_0 I_{\\text{enc}}, \\quad B_{\\text{axis}} = \\mu_0 n I, \\quad B_{\\text{end}} = \\frac{1}{2}\\mu_0 n I',
    prompt: 'Write the magnetic field formula inside a long solenoid and at its open ends in terms of turn density n and current I:',
    canonicalPattern: /(B\s*=\s*mu_0\s*\*?\s*n\s*\*?\s*I)|(\\mu_0\s*n\s*I)/i,
    signRules: 'Turn density $n = N/L$ (turns per unit length). At the exact end face of a long solenoid, symmetry cuts the contributing half-infinite section in half: $B_{\\text{end}} = \\frac{1}{2}\\mu_0 n I$.',
    practiceQuestion: {
      id: 'rem_q_solenoid_01',
      subject: 'Physics',
      topic: 'Moving Charges and Magnetism',
      subtopic: 'Ampere Circuital Law & Solenoid Field',
      questionLatex: 'A long solenoid with $n = 1000\\,\\text{turns/m}$ carries current $I = 2\\,\\text{A}$. What is the magnetic field right at one of its open circular ends? ($\\mu_0 = 4\\pi \\times 10^{-7}\\,\\text{T}\\cdot\\text{m/A}$)',
      options: [
        { key: 'A', latex: '$B_{\\text{end}} = 4\\pi \\times 10^{-4}\\,\\text{T}$', isCorrect: true },
        { key: 'B', latex: '$B_{\\text{end}} = 8\\pi \\times 10^{-4}\\,\\text{T}$', isCorrect: false, trap: 'Used interior formula $B = \\mu_0 n I$ instead of $B_{\\text{end}} = \\frac{1}{2}\\mu_0 n I$' },
        { key: 'C', latex: '$B_{\\text{end}} = 2\\pi \\times 10^{-4}\\,\\text{T}$', isCorrect: false, trap: 'Divided interior field by 4 instead of 2' },
        { key: 'D', latex: '$B_{\\text{end}} = 0\\,\\text{T}$', isCorrect: false, trap: 'Incorrectly assumed Ampere loop encloses zero current' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Interior field is $B = \\mu_0 n I = (4\\pi \\times 10^{-7})(1000)(2) = 8\\pi \\times 10^{-4}\\,\\text{T}$. At the open end: $$B_{\\text{end}} = \\frac{1}{2} B = 4\\pi \\times 10^{-4}\\,\\text{T}$$.'
    }
  },

  'Kirchhoff Loop Rule & Internal Resistance': {
    subject: 'Physics',
    name: "Kirchhoff's Voltage Law (KVL) & Terminal Potential Difference",
    latex: '\\sum \\Delta V = 0, \\quad V = \\mathcal{E} - I r \\quad \\text{(discharging)}',
    prompt: "Write the terminal potential difference V of a cell of emf E and internal resistance r delivering current I:",
    canonicalPattern: /(V\s*=\s*E\s*-\s*I\s*\*?\s*r)|(sum\s*delta\s*V\s*=\s*0)/i,
    signRules: 'Crossing a resistor IN the direction of assumed current drops potential ($-IR$); crossing from $-$ to $+$ terminal of a cell adds emf ($+\\mathcal{E}$).',
    practiceQuestion: {
      id: 'rem_q_kvl_01',
      subject: 'Physics',
      topic: 'Current Electricity',
      subtopic: 'Kirchhoff Loop Rule & Internal Resistance',
      questionLatex: 'A battery of emf $\\mathcal{E} = 12\\,\\text{V}$ and internal resistance $r = 1\\,\\Omega$ supplies current $I = 2\\,\\text{A}$ to an external load. Find the terminal voltage $V$ across the battery.',
      options: [
        { key: 'A', latex: '$V = 10\\,\\text{V}$', isCorrect: true },
        { key: 'B', latex: '$V = 14\\,\\text{V}$', isCorrect: false, trap: 'Used charging relation $V = \\mathcal{E} + Ir$ instead of discharging' },
        { key: 'C', latex: '$V = 12\\,\\text{V}$', isCorrect: false, trap: 'Ignored potential drop $Ir$ across internal resistance' },
        { key: 'D', latex: '$V = 6\\,\\text{V}$', isCorrect: false, trap: 'Halved emf incorrectly' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'During discharge, $V = \\mathcal{E} - I r = 12 - (2)(1) = 10\\,\\text{V}$.'
    }
  },

  'Dielectric Slab & Energy Stored': {
    subject: 'Physics',
    name: 'Capacitor Energy with Dielectric Slab & Charge Conservation',
    latex: 'U = \\frac{Q^2}{2C} = \\frac{1}{2}CV^2, \\quad C\' = K C_0 \\implies U\' = \\frac{U_0}{K}\\text{ (isolated)}',
    prompt: 'Write the electrostatic energy U stored in an isolated charged capacitor in terms of frozen charge Q and capacitance C:',
    canonicalPattern: /(U\s*=\s*Q\^?2\s*\/\s*\(?\s*2\s*\*?\s*C\s*\)?)|(U\s*=\s*0\.5\s*\*?\s*C\s*\*?\s*V\^?2)/i,
    signRules: 'Battery DISCONNECTED: Charge $Q$ remains constant; use $U = \\frac{Q^2}{2C}$ ($U$ decreases by factor $K$). Battery CONNECTED: Potential $V$ stays constant; use $U = \\frac{1}{2}CV^2$ ($U$ increases by factor $K$).',
    practiceQuestion: {
      id: 'rem_q_cap_01',
      subject: 'Physics',
      topic: 'Electrostatic Potential and Capacitance',
      subtopic: 'Dielectric Slab & Energy Stored',
      questionLatex: 'An isolated parallel-plate capacitor stores energy $U_0 = 12\\,\\mu\\text{J}$. A dielectric slab ($K = 3$) is inserted while disconnected from the battery. Find the new energy $U\'$.',
      options: [
        { key: 'A', latex: '$U\' = 4\\,\\mu\\text{J}$', isCorrect: true },
        { key: 'B', latex: '$U\' = 36\\,\\mu\\text{J}$', isCorrect: false, trap: 'Applied constant-voltage formula $\\frac{1}{2}CV^2$ while battery was disconnected' },
        { key: 'C', latex: '$U\' = 12\\,\\mu\\text{J}$', isCorrect: false, trap: 'Assumed energy stays conserved despite slab pull' },
        { key: 'D', latex: '$U\' = 1.33\\,\\mu\\text{J}$', isCorrect: false, trap: 'Divided by $K^2$ instead of $K$' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Since the capacitor is isolated, $Q$ is constant and $C\' = 3C_0$: $$U\' = \\frac{Q^2}{2C\'} = \\frac{Q^2}{2(3C_0)} = \\frac{U_0}{3} = \\frac{12}{3} = 4\\,\\mu\\text{J}$$.'
    }
  },

  'Damped Harmonic Oscillations & Quality Factor': {
    subject: 'Physics',
    name: 'Damped Angular Frequency & Quality Factor',
    latex: '\\omega_d = \\sqrt{\\omega_0^2 - \\gamma^2}, \\quad \\gamma = \\frac{b}{2m}, \\quad Q = \\frac{\\omega_0}{2\\gamma}',
    prompt: 'Write the damped angular frequency formula in terms of natural angular frequency omega_0 and damping factor gamma:',
    canonicalPattern: /(omega_d|sqrt|omega_0|Q\s*=\s*omega_0)/i,
    signRules: 'In underdamped motion ($\\gamma < \\omega_0$), amplitude decays exponentially as $A(t) = A_0 e^{-\\gamma t}$. Higher $Q$ implies sharper resonance.',
    practiceQuestion: {
      id: 'rem_q_damped_01',
      subject: 'Physics',
      topic: 'Oscillations',
      subtopic: 'Damped Harmonic Oscillations & Quality Factor',
      questionLatex: 'A damped oscillator has natural frequency $\\omega_0 = 20\\,\\text{rad/s}$ and damping factor $\\gamma = 0.1\\,\\text{s}^{-1}$. Calculate the quality factor $Q$.',
      options: [
        { key: 'A', latex: '$Q = 100$', isCorrect: true },
        { key: 'B', latex: '$Q = 200$', isCorrect: false, trap: 'Forgot factor of 2 in $Q = \\omega_0/(2\\gamma)$' },
        { key: 'C', latex: '$Q = 2$', isCorrect: false, trap: 'Multiplied $\\omega_0$ and $\\gamma$ instead of dividing' },
        { key: 'D', latex: '$Q = 50$', isCorrect: false, trap: 'Used $\\gamma = b/m$ instead of $b/(2m)$' }
      ],
      correctAnswer: 'A',
      solutionLatex: 'Quality factor is $Q = \\frac{\\omega_0}{2\\gamma} = \\frac{20}{2 \\times 0.1} = 100$.'
    }
  }
};

/**
 * Returns a guaranteed fallback formula entry matching the canonical subject.
 * NEVER allows cross-subject contamination (e.g. Biology -> Spherical Mirrors).
 */
function getSubjectDefaultEntry(canonicalSubject = 'Physics') {
  const s = (canonicalSubject || '').toLowerCase();
  if (s.includes('bio')) return FORMULA_REPOSITORY['Verhulst-Pearl Logistic Growth Equation'];
  if (s.includes('chem')) return FORMULA_REPOSITORY['Standard Gibbs Free Energy & Cell Potential'];
  if (s.includes('math')) return FORMULA_REPOSITORY['Quadratic Equations'];
  return FORMULA_REPOSITORY['Spherical Mirrors'];
}

/**
 * Normalizes subject string into canonical display name
 */
function inferSubjectName(subject, subjectKey, contextText = '') {
  const explicit = `${subject || ''} ${subjectKey || ''}`.toLowerCase().trim();
  if (explicit) {
    if (explicit.includes('bio') || explicit.includes('botany') || explicit.includes('zoology')) return 'Biology';
    if (explicit.includes('chem')) return 'Chemistry';
    if (explicit.includes('math')) return 'Mathematics';
    if (explicit.includes('phys')) return 'Physics';
    if (explicit.includes('sci')) return 'Science';
  }

  const text = (contextText || '').toLowerCase();
  if (text.includes('bio') || text.includes('botany') || text.includes('zoology') || text.includes('reproduction') || text.includes('genetics') || text.includes('population') || text.includes('organism') || text.includes('ecosystem') || text.includes('operon') || text.includes('plasmodium')) return 'Biology';
  if (text.includes('chem') || text.includes('thermodynamics') || text.includes('electrochemistry') || text.includes('gibbs') || text.includes('haloalkane')) return 'Chemistry';
  if (text.includes('math') || text.includes('quadratic') || text.includes('integral') || text.includes('matrix') || text.includes('probability')) return 'Mathematics';
  if (text.includes('light') || text.includes('mirror') || text.includes('refraction') || text.includes('electricity') || text.includes('joule') || text.includes('phys') || text.includes('rotational')) return 'Physics';
  if (text.includes('science')) return 'Science';

  return 'Biology';
}

/**
 * Generate a personalized remedial assignment tailored specifically to
 * what the student got wrong, their time-lag, distractor trap, and formula errors.
 * Strictly preserves the subject and chapter context of the assessment.
 */
function generatePersonalizedRemedialAssignment({
  studentId = 'b0000000-0000-0000-0000-000000000001',
  studentName = 'Aryan Sharma',
  rollNumber = '11-S-24',
  assessmentId = 'asgn_01',
  assessmentTitle = 'Classroom Assessment',
  subject = null,
  subjectKey = null,
  grade = '12',
  chapterName = '',
  questionBreakdown = []
}) {
  const timestamp = Date.now();
  const assignmentId = `rem_${assessmentId}_${studentId}_${timestamp}`;
  const allContext = [
    assessmentTitle,
    chapterName,
    ...questionBreakdown.map(q => `${q.topic || ''} ${q.subtopic || ''}`)
  ].join(' ');
  const canonicalSubject = inferSubjectName(subject, subjectKey, allContext);

  // 1. Separate questions into correct and wrong/unattempted
  const correctQuestions = questionBreakdown.filter(q => q.isCorrect === true);
  const wrongQuestions = questionBreakdown.filter(q => !q.isCorrect);

  const totalQuestions = questionBreakdown.length || 3;
  const wrongCount = wrongQuestions.length;
  const correctCount = correctQuestions.length;
  const accuracyPercentage = Math.round((correctCount / totalQuestions) * 100);

  // 2. Identify Weak Concepts and Formula Gaps strictly within this subject
  const formulaDrills = [];
  const remedialQuestions = [];
  const conceptGaps = [];

  // Default subject entry for strict isolation fallback
  const defaultEntry = getSubjectDefaultEntry(canonicalSubject);

  if (wrongQuestions.length > 0) {
    for (const wq of wrongQuestions) {
      const subtopic = wq.subtopic || wq.topic || chapterName || defaultEntry.practiceQuestion.subtopic;
      
      // Look up exact match, or keyword + subject-bound fallback (never map Physics/Class 10 Science topics to Biology)
      let repoEntry = FORMULA_REPOSITORY[subtopic];
      const isAllowedSubject = (entry) => {
        if (!entry) return false;
        if (canonicalSubject === 'Science') return entry.subject !== 'Mathematics';
        return entry.subject === canonicalSubject;
      };

      if (!isAllowedSubject(repoEntry)) {
        const subjectEntries = Object.values(FORMULA_REPOSITORY).filter(e => isAllowedSubject(e));
        const kwText = `${subtopic} ${wq.topic || ''} ${chapterName || ''} ${assessmentTitle || ''} ${wq.mistakeClassification?.explanation || ''}`.toLowerCase();
        repoEntry = subjectEntries.find(e =>
          kwText.includes((e.practiceQuestion?.subtopic || '').toLowerCase()) ||
          (e.practiceQuestion?.subtopic || '').toLowerCase().includes(subtopic.toLowerCase())
        );
        if (!repoEntry) {
          if (kwText.includes('solenoid') || kwText.includes('ampere') || kwText.includes('magnet')) repoEntry = FORMULA_REPOSITORY['Ampere Circuital Law & Solenoid Field'];
          else if (kwText.includes('kirchhoff') || kwText.includes('internal resistance') || kwText.includes('loop rule')) repoEntry = FORMULA_REPOSITORY['Kirchhoff Loop Rule & Internal Resistance'];
          else if (kwText.includes('capacitor') || kwText.includes('dielectric')) repoEntry = FORMULA_REPOSITORY['Dielectric Slab & Energy Stored'];
          else if (kwText.includes('damped') || kwText.includes('quality factor') || kwText.includes('oscillat')) repoEntry = FORMULA_REPOSITORY['Damped Harmonic Oscillations & Quality Factor'];
          else if (kwText.includes('mirror') || kwText.includes('concave') || kwText.includes('convex') || kwText.includes('optic') || kwText.includes('light')) repoEntry = FORMULA_REPOSITORY['Spherical Mirrors'];
          else if (kwText.includes('refract') || kwText.includes('snell') || kwText.includes('glass')) repoEntry = FORMULA_REPOSITORY['Refraction & Snell Law'];
          else if (kwText.includes('joule') || kwText.includes('heater') || kwText.includes('ohm') || kwText.includes('elect') || kwText.includes('watt')) repoEntry = FORMULA_REPOSITORY['Joule Heating & Resistance'];
          else if (kwText.includes('rotat') || kwText.includes('torque') || kwText.includes('inertia')) repoEntry = FORMULA_REPOSITORY['Rotational Motion'];
          else if (kwText.includes('gibbs') || kwText.includes('electrochem') || kwText.includes('cell')) repoEntry = FORMULA_REPOSITORY['Standard Gibbs Free Energy & Cell Potential'];
          else if (kwText.includes('kinetics') || kwText.includes('rate constant') || kwText.includes('half life')) repoEntry = FORMULA_REPOSITORY['First Order Reaction Kinetics'];
        }
        if (!isAllowedSubject(repoEntry)) {
          repoEntry = defaultEntry || subjectEntries[0];
        }
      }

      conceptGaps.push({
        questionIndex: wq.questionIndex || 1,
        subtopic: repoEntry.practiceQuestion.subtopic || subtopic,
        topic: wq.topic || chapterName || canonicalSubject,
        subject: canonicalSubject,
        studentAnswer: wq.selectedOption || 'Unattempted',
        correctAnswer: wq.correctAnswer || 'A',
        timeSpentSeconds: wq.timeSpentSeconds || 45,
        benchmarkSeconds: wq.benchmarkSeconds || 90,
        diagnosedTrap: wq.mistakeClassification?.explanation || `Misunderstanding of core ${canonicalSubject} principle.`,
        recommendedRemedy: `Master formula / concept: ${repoEntry.name}`
      });

      // Avoid duplicate formula drills for the same subtopic
      if (!formulaDrills.some(f => f.subtopic === repoEntry.practiceQuestion.subtopic)) {
        formulaDrills.push({
          drillId: `fdrill_${repoEntry.practiceQuestion.subtopic.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}`,
          subject: canonicalSubject,
          subtopic: repoEntry.practiceQuestion.subtopic,
          formulaName: repoEntry.name,
          prompt: repoEntry.prompt,
          expectedLatex: repoEntry.latex,
          canonicalPattern: repoEntry.canonicalPattern.toString(),
          rulesAndTraps: repoEntry.signRules,
          status: 'PENDING_SUBMISSION'
        });

        remedialQuestions.push({
          ...repoEntry.practiceQuestion,
          drillOrigin: `Targeted practice for ${repoEntry.practiceQuestion.subtopic} missed in Q${wq.questionIndex || 1}`
        });
      }
    }
  } else {
    // Student scored 100%! Provide High-Yield Extension Drill strictly from the SAME subject
    conceptGaps.push({
      subtopic: `Advanced ${canonicalSubject} Olympiad & Entrance Extension`,
      diagnosedTrap: 'None - Perfect Score Achieved!',
      recommendedRemedy: `Stretch potential with advanced multi-concept ${canonicalSubject} derivations.`
    });

    const extensionEntry = defaultEntry;
    formulaDrills.push({
      drillId: `fdrill_advanced_${canonicalSubject.toLowerCase()}_${timestamp}`,
      subject: canonicalSubject,
      subtopic: extensionEntry.practiceQuestion.subtopic,
      formulaName: extensionEntry.name,
      prompt: extensionEntry.prompt,
      expectedLatex: extensionEntry.latex,
      canonicalPattern: extensionEntry.canonicalPattern.toString(),
      rulesAndTraps: extensionEntry.signRules,
      status: 'PENDING_SUBMISSION'
    });
    remedialQuestions.push(extensionEntry.practiceQuestion);
  }

  // 3. Faculty proctor mapping strictly aligned with the subject
  const facultyMap = {
    'Biology': 'Residential Biology & NEET Medical Faculty Proctor',
    'Chemistry': 'Residential Chemistry & NEET/JEE Faculty Proctor',
    'Mathematics': 'Residential Mathematics & JEE Faculty Proctor',
    'Physics': 'Residential Physics & JEE Faculty Proctor',
    'Science': 'Residential Class 10 Science Foundation Faculty Proctor'
  };
  const faculty = facultyMap[canonicalSubject] || 'Residential Academic Proctor';

  const dualActionPlan = {
    hostelPrepAction: {
      faculty,
      timeSlot: '7:30 PM – 8:00 PM Evening Study',
      directive: wrongCount > 0 
        ? `Have ${studentName.split(' ')[0]} write out ${formulaDrills.map(f => f.formulaName).join(' & ')} on whiteboard and solve the targeted ${canonicalSubject} practice questions.`
        : `Introduce advanced Olympiad and NEET/JEE extension to stretch ${studentName.split(' ')[0]}'s mastery in ${canonicalSubject}.`,
      priority: wrongCount > 1 ? 'HIGH' : 'NORMAL'
    },
    parentHomeAction: {
      directive: wrongCount > 0
        ? `Ask ${studentName.split(' ')[0]} to explain the principles of ${formulaDrills[0].formulaName} during Sunday call (Feynman technique).`
        : `Celebrate ${studentName.split(' ')[0]}'s 100% score in ${canonicalSubject} and encourage consistent revision routine.`,
      focusConcept: formulaDrills[0]?.subtopic || `${canonicalSubject} Core Principles`
    }
  };

  return {
    success: true,
    assignmentId,
    title: `Personalized Remedial Assignment (${canonicalSubject}): ${formulaDrills.map(f => f.subtopic).join(' & ')}`,
    subject: canonicalSubject,
    subjectKey: subjectKey || canonicalSubject.toUpperCase(),
    grade: String(grade),
    student: {
      id: studentId,
      name: studentName,
      rollNumber,
      sourceAssessmentId: assessmentId,
      sourceAssessmentTitle: assessmentTitle
    },
    performanceSummary: {
      totalQuestions,
      correctCount,
      wrongCount,
      accuracyPercentage,
      totalTimeSpentSeconds: questionBreakdown.reduce((acc, q) => acc + (q.timeSpentSeconds || 0), 0)
    },
    conceptGaps,
    formulaDrills,
    remedialQuestions,
    dualActionPlan,
    createdAt: new Date().toISOString()
  };
}

/**
 * Validates a student's written formula string against canonical patterns
 */
function verifyStudentFormula(subtopic, studentInput, subject = 'Biology') {
  if (!studentInput || typeof studentInput !== 'string') {
    return {
      isValid: false,
      message: 'Please write the formula or principle in the input box before verifying.',
      modelFormulaLatex: null
    };
  }

  const cleanInput = studentInput.trim().replace(/\s+/g, ' ');
  const defaultEntry = getSubjectDefaultEntry(subject);
  const repoEntry = FORMULA_REPOSITORY[subtopic] || defaultEntry;

  const isMatch = repoEntry.canonicalPattern.test(cleanInput);

  if (isMatch) {
    return {
      isValid: true,
      message: `Verified: Correct. You have accurately stated the ${repoEntry.name}.`,
      modelFormulaLatex: repoEntry.latex,
      signRules: repoEntry.signRules
    };
  }

  return {
    isValid: false,
    message: `Not quite right. Check key variables or biological/chemical/physical terms for ${repoEntry.name}.`,
    hint: `Correct scientific structure: ${repoEntry.latex}`,
    modelFormulaLatex: repoEntry.latex,
    signRules: repoEntry.signRules
  };
}

module.exports = {
  FORMULA_REPOSITORY,
  generatePersonalizedRemedialAssignment,
  verifyStudentFormula,
  getSubjectDefaultEntry,
  inferSubjectName
};
