// ============================================================================
// HAPS-AI SCHOLAR ASSISTANT: MASTER CURRICULUM TAXONOMY
// Granular breakdown: Subject -> Chapter -> Topic / Subtopic
// Covering:
//   - Senior Biology (Botany & Zoology: Class 11 & Class 12) -> NEET UG & Boards
//   - Senior Physics (Class 11 & Class 12) -> JEE Main / NEET / Boards
//   - Senior Chemistry (Physical, Inorganic, Organic) -> JEE Main / NEET / Boards
//   - Senior Mathematics (Calculus, Algebra, Coordinate, Vectors) -> JEE Main & Boards
//   - Class 10 Foundation Science (Physics, Chemistry, Biology) -> CBSE & HP Board
//   - Class 10 Foundation Mathematics -> CBSE & HP Board
// ============================================================================

const CURRICULUM_TAXONOMY = {
  // ==========================================================================
  // 1. BIOLOGY (Class 11 & Class 12) - NEET UG & Board Specialization
  // ==========================================================================
  'BIOLOGY': {
  "subjectName": "Class 12 Biology",
  "stream": "MEDICAL",
  "grades": [
    "12"
  ],
  "targetExams": [
    "CBSE_CLASS_12",
    "HP_BOARD_CLASS_12",
    "NEET_UG"
  ],
  "units": [
    {
      "unitNumber": "Unit VI",
      "unitName": "Reproduction (Chapters 1 to 3)",
      "weightageMarks": 16,
      "chapters": [
        1,
        2,
        3
      ]
    },
    {
      "unitNumber": "Unit VII",
      "unitName": "Genetics and Evolution (Chapters 4 to 6)",
      "weightageMarks": 20,
      "chapters": [
        4,
        5,
        6
      ]
    },
    {
      "unitNumber": "Unit VIII",
      "unitName": "Biology in Human Welfare (Chapters 7 & 8)",
      "weightageMarks": 12,
      "chapters": [
        7,
        8
      ]
    },
    {
      "unitNumber": "Unit IX",
      "unitName": "Biotechnology: Principles & Applications (Chapters 9 & 10)",
      "weightageMarks": 12,
      "chapters": [
        9,
        10
      ]
    },
    {
      "unitNumber": "Unit X",
      "unitName": "Ecology and Environment (Chapters 11 to 13)",
      "weightageMarks": 10,
      "chapters": [
        11,
        12,
        13
      ]
    }
  ],
  "boardHighYieldSummary": {
    "examBoard": "CBSE / HPBOSE Class 12 Biology (70 Marks Theory)",
    "fiveMarkGuarantees": [
      {
        "rank": 1,
        "topic": "Menstrual Cycle & Gametogenesis Pathways",
        "detail": "Hormone tracking plots (FSH, LH, Estrogen, Progesterone) across the 28-day cycle, spermatogenesis vs oogenesis stage comparison, or 7-celled 8-nucleate embryo sac structure and double fertilization.",
        "chapter": "Chapter 1: Flowering Plants & Chapter 2: Human Reproduction"
      },
      {
        "rank": 2,
        "topic": "Molecular Genetics & Gene Regulation Pathways",
        "detail": "DNA replication fork mechanisms (continuous leading vs discontinuous lagging Okazaki fragments), transcription unit with split-gene processing (splicing, capping, tailing), and Lac Operon switched-on vs switched-off states.",
        "chapter": "Chapter 5: Molecular Basis of Inheritance"
      },
      {
        "rank": 3,
        "topic": "Recombinant DNA Technology & Applications",
        "detail": "Vector pBR322 architecture with selectable markers and insertional inactivation, step-by-step PCR thermal cycle (denaturation, annealing, extension), and recombinant human insulin (Humulin) / ADA gene therapy.",
        "chapter": "Chapter 9: Biotechnology Principles & Chapter 10: Biotechnology Applications"
      }
    ],
    "caseStudyFourMark": [
      {
        "topic": "Genetics: Pedigree Analysis & Mendelian Disorders",
        "detail": "Deducing inheritance pattern from family pedigrees (Autosomal Recessive vs Dominant vs X-linked) and molecular causes of Sickle-cell anemia (GAG→GUG transversion), Thalassemia, and Hemophilia.",
        "chapter": "Chapter 4: Principles of Inheritance and Variation"
      },
      {
        "topic": "Ecology: Population Growth & Species-Area Relationship",
        "detail": "Verhulst-Pearl Logistic vs Exponential growth curves (dN/dt = rN(K-N)/K) and Alexander von Humboldt's species-area rectangular hyperbola / log-log relationship (log S = log C + Z log A).",
        "chapter": "Chapter 11: Organisms and Populations & Chapter 13: Biodiversity and Conservation"
      },
      {
        "topic": "Human Health: Retrovirus & Plasmodium Life Cycles",
        "detail": "Replication mechanism of HIV in macrophages and helper T-cells, or sequential stages of Plasmodium from human liver cells (haemozoin release) to mosquito gut and salivary glands.",
        "chapter": "Chapter 7: Human Health and Diseases"
      }
    ],
    "threeMarkCorePool": [
      {
        "topic": "Outbreeding Devices & Double Fertilization",
        "detail": "Mechanisms preventing inbreeding depression (dichogamy, self-incompatibility, dioecy) and triple fusion yielding triploid primary endosperm nucleus (PEN).",
        "chapter": "Chapter 1: Flowering Plants"
      },
      {
        "topic": "Hardy-Weinberg Equilibrium & Organ Evolution",
        "detail": "Allelic frequency numericals (p² + 2pq + q² = 1) and differentiating Homologous (divergent evolution) vs Analogous organs (convergent evolution).",
        "chapter": "Chapter 6: Evolution"
      },
      {
        "topic": "Microbes: Bioactive Molecules & Sewage Treatment",
        "detail": "Match-the-following industrial products (Statins from Monascus purpureus, Cyclosporin A from Trichoderma polysporum, Streptokinase) and STP aeration flocs with BOD reduction.",
        "chapter": "Chapter 8: Microbes in Human Welfare"
      },
      {
        "topic": "Ecology: The Evil Quartet & In-Situ vs Ex-Situ",
        "detail": "Four major causes of biodiversity loss (habitat fragmentation, over-exploitation, alien invasion, co-extinctions) and Sacred Groves vs Cryopreservation.",
        "chapter": "Chapter 13: Biodiversity and Conservation"
      }
    ]
  },
  "chapters": [
    {
      "id": "bio_12_ch01",
      "grade": "12",
      "discipline": "BOTANY",
      "unit": "Unit VI: Reproduction (16 Marks)",
      "chapterNumber": 1,
      "chapterName": "Sexual Reproduction in Flowering Plants",
      "boardExamFocus": {
        "highYield": "7-celled, 8-nucleate female gametophyte structure; L.S. of anatropous ovule; Double fertilization (syngamy + triple fusion); Outbreeding devices to prevent self-pollination.",
        "standardTrap": "Confusing perisperm (persistent nucellus, e.g. black pepper) with pericarp (fruit wall); assuming cleistogamous flowers require insect pollinators (they are autogamous and set seeds without pollinators).",
        "questionType": "5-mark developmental cycle of embryo sac or microsporogenesis; 3-mark outbreeding devices; 2-mark apomixis vs polyembryony."
      },
      "topics": [
        {
          "id": "bio_12_ch01_t1",
          "topicName": "Pre-Fertilization: Structures and Events",
          "ncertSection": "1.1",
          "highYield": true,
          "subtopics": [
            "Anatomy of anther: Bilobed, dithecous, tetrasporangiate",
            "Microsporangium wall layers: Epidermis, Endothecium, Middle layers, Tapetum (nourishes pollen, secretes sporopollenin)",
            "Microsporogenesis: Microspore mother cell (2n) → Microspore tetrad (n) → Pollen grains",
            "Pollen Grain: Exine (Sporopollenin & Germ pores), Intine (cellulose & pectin), Vegetative & Generative cells (60% shed at 2-celled stage)",
            "Megasporangium (Ovule): Funicle, Hilum, Integuments, Micropyle, Chalaza, Nucellus",
            "Megasporogenesis & Monosporic development: Functional chalazal megaspore undergoes 3 mitotic divisions",
            "Mature 7-celled, 8-nucleate Embryo Sac: Egg apparatus (2 synergids with filiform apparatus + 1 egg cell), central cell with 2 polar nuclei, 3 antipodal cells"
          ]
        },
        {
          "id": "bio_12_ch01_t2",
          "topicName": "Pollination Mechanisms & Adaptations",
          "ncertSection": "1.2",
          "highYield": true,
          "subtopics": [
            "Autogamy (cleistogamous flowers: Viola, Oxalis, Commelina guarantee seed set without pollinators)",
            "Geitonogamy (functionally cross-pollination via agent, genetically autogamous)",
            "Xenogamy (genetically and functionally cross-pollination)",
            "Outbreeding devices: Dichogamy, spatial separation, self-incompatibility, dioecious vs monoecious plants",
            "Pollen-pistil interaction: Dynamic chemical dialogue guided by filiform apparatus",
            "Artificial hybridization: Emasculation (removal of anthers) and Bagging (butter paper)"
          ]
        },
        {
          "id": "bio_12_ch01_t3",
          "topicName": "Double Fertilization & Post-Fertilization Events",
          "ncertSection": "1.3",
          "highYield": true,
          "subtopics": [
            "Double Fertilization: Syngamy (male gamete n + egg n → zygote 2n) and Triple Fusion (male gamete n + 2 polar nuclei 2n → PEN 3n)",
            "Endosperm development: Free-nuclear (coconut water) vs Cellular endosperm (white kernel)",
            "Non-albuminous seeds (pea, groundnut, beans) vs Albuminous seeds (wheat, maize, castor, sunflower)",
            "Dicot embryo vs Monocot embryo (Scutellum single cotyledon, Coleoptile, Coleorhiza)",
            "Apomixis (seed production without fertilization, e.g. Asteraceae, grasses) and Polyembryony (Citrus, mango)"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch02",
      "grade": "12",
      "discipline": "ZOOLOGY",
      "unit": "Unit VI: Reproduction (16 Marks)",
      "chapterNumber": 2,
      "chapterName": "Human Reproduction",
      "boardExamFocus": {
        "highYield": "Menstrual cycle hormone tracking graphs (FSH, LH surge, Estrogen, Progesterone); Spermatogenesis vs Oogenesis pathway with chromosome ploidy; Blastocyst implantation and placental hormones (hCG, hPL, Relaxin).",
        "standardTrap": "Confusing primary oocyte (arrested at Prophase-I) with secondary oocyte (arrested at Metaphase-II until fertilization); placing LH surge on day 1 instead of day 14.",
        "questionType": "5-mark menstrual cycle with graphs; 3-mark spermatogenesis vs oogenesis comparison; 3-mark parturition oxytocin reflex."
      },
      "topics": [
        {
          "id": "bio_12_ch02_t1",
          "topicName": "The Male and Female Reproductive Systems",
          "ncertSection": "2.1",
          "highYield": true,
          "subtopics": [
            "Male System: Scrotum (2-2.5°C lower temperature), Seminiferous tubules, Sertoli cells (nourish germ cells), Leydig cells (testosterone)",
            "Accessory ducts: Rete testis, Vasa efferentia, Epididymis (sperm maturation), Vas deferens, Ejaculatory duct",
            "Accessory glands: Seminal vesicles (fructose, calcium), Prostate gland (alkaline fluid), Bulbourethral/Cowper's glands (lubrication)",
            "Female System: Ovaries (follicles and medulla), Fallopian tubes (Infundibulum with Fimbriae, Ampulla site of fertilization, Isthmus)",
            "Uterus layers: Perimetrium, Myometrium (vigorous parturition contractions), Endometrium (cyclic changes)"
          ]
        },
        {
          "id": "bio_12_ch02_t2",
          "topicName": "Gametogenesis",
          "ncertSection": "2.2",
          "highYield": true,
          "subtopics": [
            "Spermatogenesis: Spermatogonia (2n) → 1° spermatocyte (2n) → 2° spermatocyte (n) → Spermatids (n) → Spermatozoa (n)",
            "Spermiogenesis vs Spermiation (release of spermatozoa from Sertoli cells into lumen)",
            "Hormonal control: GnRH → LH (stimulates Leydig cells → Testosterone) & FSH (stimulates Sertoli cells)",
            "Sperm anatomy: Head (haploid nucleus + Acrosome with hyaluronidase), Neck, Middle piece (mitochondria), Tail",
            "Oogenesis: Oogonia (2n) arrested at Prophase-I as primary oocytes; tertiary follicle with Antrum cavity",
            "Secondary oocyte (n) and First Polar Body; arrest at Metaphase-II until sperm entry triggers completion of Meiosis-II"
          ]
        },
        {
          "id": "bio_12_ch02_t3",
          "topicName": "The Menstrual Cycle",
          "ncertSection": "2.3",
          "highYield": true,
          "subtopics": [
            "Menstrual Phase (Days 1–5): Endometrial breakdown due to withdrawal of progesterone and estrogen",
            "Follicular / Proliferative Phase (Days 6–13): FSH stimulates follicle maturation and Estrogen secretion; endometrial proliferation",
            "Ovulatory Phase (Day 14): LH Surge induces rupture of Graafian follicle and release of secondary oocyte (ovulation)",
            "Luteal / Secretory Phase (Days 15–28): Ruptured follicle transforms into Corpus Luteum; secretes Progesterone to maintain endometrium"
          ]
        },
        {
          "id": "bio_12_ch02_t4",
          "topicName": "Fertilization, Pregnancy & Parturition",
          "ncertSection": "2.4",
          "highYield": true,
          "subtopics": [
            "Fertilization: Acrosomal reaction, penetration of Zona Pellucida, cortical block to polyspermy",
            "Cleavage & Implantation: Zygote → Morula (8-16 blastomeres) → Blastocyst (Trophoblast outer + Inner cell mass)",
            "Placenta: Structural and functional unit; secretes pregnancy-specific hCG, hPL, and Relaxin (from ovary)",
            "Parturition: Foetal-ejection reflex triggers maternal pituitary to release Oxytocin (positive feedback contraction)",
            "Lactation: Regulated by Prolactin; Colostrum rich in IgA antibodies conferring passive immunity"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch03",
      "grade": "12",
      "discipline": "ZOOLOGY",
      "unit": "Unit VI: Reproduction (16 Marks)",
      "chapterNumber": 3,
      "chapterName": "Reproductive Health",
      "boardExamFocus": {
        "highYield": "Classification and mechanism of IUDs (CuT, LNG-20, Lippes loop); Assisted Reproductive Technologies (ZIFT vs IUT vs GIFT vs ICSI); MTP legal conditions and STIs.",
        "standardTrap": "Confusing ZIFT (transferred into fallopian tube up to 8 blastomeres) with IUT (transferred into uterus > 8 blastomeres); forgetting Hepatitis-B, Genital herpes, and HIV are incurable.",
        "questionType": "3-mark IUD classification with examples; 3-mark ART techniques comparison; 2-mark Saheli non-steroidal pill."
      },
      "topics": [
        {
          "id": "bio_12_ch03_t1",
          "topicName": "Population Explosion and Contraceptive Methods",
          "ncertSection": "3.1",
          "highYield": true,
          "subtopics": [
            "Contraceptive criteria: User-friendly, available, effective, reversible, minimal side effects",
            "Natural methods: Periodic abstinence (days 10-17), Coitus interruptus, Lactational amenorrhea (up to 6 months)",
            "Barrier methods: Condoms (STI protection), Diaphragms, Cervical caps, Vaults",
            "Intrauterine Devices (IUDs): Non-medicated (Lippes loop), Copper-releasing (CuT, Cu7, Multiload 375 suppress motility), Hormone-releasing (Progestasert, LNG-20 make uterus hostile)",
            "Oral Contraceptives: Progestogen-estrogen combinations; Saheli (non-steroidal, selective estrogen receptor modulator, once a week, CDRI)",
            "Emergency contraception: Progestogens or combos within 72 hours of unprotected coitus",
            "Surgical / Permanent methods: Vasectomy (vas deferens tied/cut) and Tubectomy (fallopian tubes tied/cut)"
          ]
        },
        {
          "id": "bio_12_ch03_t2",
          "topicName": "MTP, STIs, and Infertility Interventions (ART)",
          "ncertSection": "3.2",
          "highYield": true,
          "subtopics": [
            "Medical Termination of Pregnancy (MTP): Legalized in India 1971; safest during first trimester (up to 12 weeks)",
            "Sexually Transmitted Infections (STIs): Gonorrhoea, Syphilis, Genital herpes, Chlamydiasis, Hepatitis-B, HIV (Hepatitis-B, herpes, HIV not curable)",
            "IVF - In Vitro Fertilization (\"Test Tube Baby\"): ZIFT (up to 8 blastomeres into fallopian tube) and IUT (more than 8 blastomeres into uterus)",
            "GIFT (Gamete Intra-Fallopian Transfer): Transfer of unfertilized ovum into fallopian tube for female who cannot produce ovum",
            "ICSI (Intra-Cytoplasmic Sperm Injection): Direct micro-injection of single sperm into ovum",
            "Artificial Insemination (AI) / IUI: Semen introduced into vagina/uterus for low sperm count (oligozoospermia)"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch04",
      "grade": "12",
      "discipline": "BOTANY",
      "unit": "Unit VII: Genetics and Evolution (20 Marks)",
      "chapterNumber": 4,
      "chapterName": "Principles of Inheritance and Variation",
      "boardExamFocus": {
        "highYield": "Pedigree analysis charts (Autosomal Recessive vs Dominant vs X-linked); Molecular basis of Sickle-cell anemia (GAG→GUG transversion at codon 6 of β-globin); Morgan’s linkage and recombination in Drosophila; Haplodiploidy in honeybees.",
        "standardTrap": "Classifying Thalassemia as qualitative (it is quantitative defect of globin synthesis, whereas Sickle-cell is qualitative defect); assuming male honeybees have a father (males develop parthenogenetically and have no father).",
        "questionType": "5-mark dihybrid cross with independent assortment or Morgan linkage; 4-mark Case Study with Pedigree tree; 3-mark genetic disorder comparison (Down vs Klinefelter vs Turner)."
      },
      "topics": [
        {
          "id": "bio_12_ch04_t1",
          "topicName": "Mendelian Principles",
          "ncertSection": "4.1",
          "highYield": true,
          "subtopics": [
            "Mendel experimental model: Pisum sativum, 7 pairs of contrasting traits",
            "Monohybrid cross: Phenotypic ratio 3:1, Genotypic ratio 1:2:1; Law of Segregation (universal, no blending); Law of Dominance",
            "Test cross: Crossing dominant phenotype with homozygous recessive parent (1:1 confirms heterozygous)",
            "Incomplete Dominance: Antirrhinum majus / Snapdragon (1:2:1 phenotypic and genotypic ratio)",
            "Co-dominance: ABO Blood Groups in humans (IA and IB codominant over i; 3 alleles, 6 genotypes, 4 phenotypes)",
            "Pleiotropy: Single gene influencing multiple traits (Phenylketonuria, starch synthesis in pea seeds)",
            "Dihybrid cross: 9:3:3:1 ratio; Law of Independent Assortment"
          ]
        },
        {
          "id": "bio_12_ch04_t2",
          "topicName": "Chromosomal Theory, Linkage & Sex Determination",
          "ncertSection": "4.2",
          "highYield": true,
          "subtopics": [
            "Chromosomal Theory of Inheritance (Sutton and Boveri): Parallelism between chromosomes and genes",
            "Morgan experiment with Drosophila melanogaster: Advantages of fruit fly, Linkage vs Recombination",
            "Alfred Sturtevant genetic mapping: 1% recombination frequency = 1 map unit / centimorgan",
            "Sex determination systems: XX-XY (human, Drosophila), XX-XO (grasshopper), ZZ-ZW (birds)",
            "Haplodiploidy in Honeybees: Drones develop parthenogenetically (n=16, mitosis), females from fertilized eggs (2n=32)"
          ]
        },
        {
          "id": "bio_12_ch04_t3",
          "topicName": "Genetic Disorders and Pedigree Analysis",
          "ncertSection": "4.3",
          "highYield": true,
          "subtopics": [
            "Pedigree analysis symbols and deducing autosomal dominant, autosomal recessive, and X-linked traits",
            "Sickle-cell anaemia: Point mutation (transversion GAG → GUG at 6th codon of β-globin gene; Glutamic acid → Valine; HbS polymerizes)",
            "Phenylketonuria (PKU): Lack of phenylalanine hydroxylase; accumulation of phenylpyruvic acid causing mental retardation",
            "Thalassemia: Quantitative defect in globin chain synthesis (α-thalassemia on chr 16, β-thalassemia on chr 11)",
            "X-linked recessive disorders: Haemophilia (criss-cross inheritance), Colour blindness (8% males, 0.4% females)",
            "Aneuploidy: Down syndrome (Trisomy 21, 47 chromosomes), Klinefelter syndrome (47, XXY), Turner syndrome (45, X0)"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch05",
      "grade": "12",
      "discipline": "BOTANY",
      "unit": "Unit VII: Genetics and Evolution (20 Marks)",
      "chapterNumber": 5,
      "chapterName": "Molecular Basis of Inheritance",
      "boardExamFocus": {
        "highYield": "DNA replication fork mechanisms and Meselson-Stahl experiment; Transcription in eukaryotes (splicing, capping, tailing); Lac Operon switched-on vs switched-off states; Properties of genetic code; DNA fingerprinting using VNTRs.",
        "standardTrap": "Writing RNA transcript polarity backwards (mRNA is synthesized 5'→3' complementary to 3'→5' template strand); forgetting that Lac operon regulation is negative.",
        "questionType": "Guaranteed 5-mark long answer on Lac operon, Replication fork, or Transcription; 3-mark Hershey-Chase / Meselson-Stahl experimental proofs; 3-mark DNA fingerprinting steps."
      },
      "topics": [
        {
          "id": "bio_12_ch05_t1",
          "topicName": "DNA Structure and Packaging",
          "ncertSection": "5.1",
          "highYield": true,
          "subtopics": [
            "Polynucleotide chain: N-glycosidic bond, phosphoester bond, 3'-5' phosphodiester bonds",
            "Watson-Crick Double Helix: Antiparallel strands, pitch = 3.4 nm, 10 bp/turn, base pair distance = 0.34 nm, A=T (2 H-bonds), G≡C (3 H-bonds)",
            "Chargaff’s rules: A=T, G=C, (A+G)/(T+C) = 1 in dsDNA",
            "Packaging: Total human DNA length ~2.2 m; Nucleosome (histone octamer with Lysine & Arginine wrapped by ~200 bp DNA, H1 linker)",
            "Euchromatin (loosely packed, transcriptionally active) vs Heterochromatin (densely packed, inactive)"
          ]
        },
        {
          "id": "bio_12_ch05_t2",
          "topicName": "Identifying Genetic Material & Replication",
          "ncertSection": "5.2",
          "highYield": true,
          "subtopics": [
            "Transforming Principle (Griffith 1928): S-strain and R-strain Streptococcus pneumoniae",
            "Biochemical characterization (Avery, MacLeod, McCarty 1944): Transformation abolished by DNase",
            "Hershey and Chase proof (1952): ³⁵S (protein coat) vs ³²P (DNA) in T2 bacteriophage",
            "DNA vs RNA stability: DNA lacks 2'-OH, has Thymine instead of Uracil, double-stranded",
            "Semiconservative replication proof (Meselson and Stahl 1958): ¹⁵NH₄Cl shifted to ¹⁴NH₄Cl, CsCl gradient",
            "Replication fork machinery: DNA-dependent DNA polymerase (5'→3'), leading strand continuous, lagging strand Okazaki fragments sealed by DNA ligase"
          ]
        },
        {
          "id": "bio_12_ch05_t3",
          "topicName": "Transcription and Processing",
          "ncertSection": "5.3",
          "highYield": true,
          "subtopics": [
            "Transcription unit: Promoter, Structural gene, Terminator; Template (3'→5') vs Coding strand (5'→3')",
            "Transcription in Prokaryotes: Single RNA polymerase, Initiation factor (sigma σ), Termination factor (rho ρ)",
            "Transcription in Eukaryotes: RNA Pol I (rRNAs), RNA Pol II (hnRNA), RNA Pol III (tRNA, 5S rRNA)",
            "Post-transcriptional processing of hnRNA: Splicing (snRNPs remove introns), Capping (methyl guanosine triphosphate at 5'), Tailing (poly-A at 3')"
          ]
        },
        {
          "id": "bio_12_ch05_t4",
          "topicName": "Genetic Code, Translation & Regulation",
          "ncertSection": "5.4",
          "highYield": true,
          "subtopics": [
            "Genetic Code properties: Triplet (61 sense, 3 stop: UAA, UAG, UGA), Degenerate, Unambiguous, Commaless, Universal, Initiator AUG (Methionine)",
            "tRNA adapter: Cloverleaf 2D, inverted L-shape 3D, Anticodon loop, 3'-CCA amino acid acceptor end",
            "Translation: Aminoacylation of tRNA, Ribosome P-site and A-site, peptidyl transferase 23S rRNA ribozyme",
            "Lac Operon (Jacob and Monod): Regulatory i gene, promoter p, operator o, structural genes z (β-galactosidase), y (permease), a (transacetylase)",
            "Repressor mechanism: Absence of inducer (repressor binds operator = OFF) vs Presence of Lactose (inactivates repressor = ON)"
          ]
        },
        {
          "id": "bio_12_ch05_t5",
          "topicName": "Human Genome Project (HGP) & DNA Fingerprinting",
          "ncertSection": "5.5",
          "highYield": true,
          "subtopics": [
            "HGP milestones: 3 billion bp, average gene 3000 bases, Dystrophin 2.4 million bases, chromosome 1 most genes (2968), Y fewest (231), 1.4 million SNPs",
            "ESTs (Expressed Sequence Tags) vs Sequence Annotation",
            "DNA Fingerprinting (Alec Jeffreys): Satellite DNA polymorphism, VNTRs (Variable Number of Tandem Repeats)",
            "Steps: DNA extraction → Restriction endonuclease digestion → Gel electrophoresis → Southern blotting → Radiolabeled VNTR probe hybridization → Autoradiography"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch06",
      "grade": "12",
      "discipline": "ZOOLOGY",
      "unit": "Unit VII: Genetics and Evolution (20 Marks)",
      "chapterNumber": 6,
      "chapterName": "Evolution",
      "boardExamFocus": {
        "highYield": "Hardy-Weinberg equilibrium numericals (p² + 2pq + q² = 1); Homologous vs Analogous organs (divergent vs convergent evolution); Industrial melanism; Human evolution timeline with cranial capacities.",
        "standardTrap": "Confusing saltation (single-step large mutation by de Vries) with Darwinian gradualism; mixing up Homo habilis (650-800 cc, vegetarian) and Homo erectus (900 cc, meat eater).",
        "questionType": "3-mark Hardy-Weinberg calculation; 3-mark homologous vs analogous organ categorization; 2-mark natural selection graphs (stabilizing, directional, disruptive)."
      },
      "topics": [
        {
          "id": "bio_12_ch06_t1",
          "topicName": "Origin of Life & Evidences for Evolution",
          "ncertSection": "6.1",
          "highYield": true,
          "subtopics": [
            "Origin of Life: Big Bang, Oparin-Haldane chemical evolution hypothesis",
            "Miller-Urey experiment: Spark discharge (CH₄, NH₃, H₂O, H₂ at 800°C) producing amino acids (alanine, glycine, aspartic acid)",
            "Homologous organs (Divergent Evolution: whale/bat/cheetah/human forelimbs, Bougainvillea thorns & Cucurbita tendrils)",
            "Analogous organs (Convergent Evolution: bird/butterfly wings, octopus/mammal eye, penguin/dolphin flippers, sweet potato & potato)",
            "Industrial melanism in Biston betularia (peppered moth) and anthropogenic selection (antibiotic resistance)",
            "Adaptive radiation: Darwin's finches in Galapagos, Australian marsupials"
          ]
        },
        {
          "id": "bio_12_ch06_t2",
          "topicName": "Biological Evolution & Hardy-Weinberg Principle",
          "ncertSection": "6.2",
          "highYield": true,
          "subtopics": [
            "Theories: Lamarckism (use/disuse disproved), Darwinism (reproductive fitness), Mutation theory (Hugo de Vries saltation)",
            "Hardy-Weinberg Principle: p + q = 1 ⇒ p² + 2pq + q² = 1",
            "Factors affecting equilibrium: Gene flow, Genetic drift (Founder effect, Bottleneck), Mutation, Recombination, Natural Selection",
            "Natural selection curves: Stabilizing (favors average), Directional (favors one extreme), Disruptive (two peaks)"
          ]
        },
        {
          "id": "bio_12_ch06_t3",
          "topicName": "Human Evolution",
          "ncertSection": "6.3",
          "highYield": true,
          "subtopics": [
            "Dryopithecus & Ramapithecus (15 mya, Ramapithecus more man-like)",
            "Australopithecines (2 mya, East Africa, stone weapons, fruit eaters)",
            "Homo habilis (650–800 cc, handy man, did not eat meat)",
            "Homo erectus (1.5 mya, Java fossils, 900 cc, ate meat)",
            "Homo neanderthalensis (100,000–40,000 ya, 1400 cc, cave dweller, buried dead)",
            "Homo sapiens (75,000–10,000 ya, modern human, cave art 18,000 ya, agriculture 10,000 ya)"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch07",
      "grade": "12",
      "discipline": "ZOOLOGY",
      "unit": "Unit VIII: Biology in Human Welfare (12 Marks)",
      "chapterNumber": 7,
      "chapterName": "Human Health and Diseases",
      "boardExamFocus": {
        "highYield": "Life cycle schematic of Plasmodium (sporozoite injection to mosquito transmission); Retrovirus (HIV) replication cycle in helper T-cells; Structure of an antibody molecule (H₂L₂); Innate vs Acquired immunity.",
        "standardTrap": "Assuming Common Cold infects lungs (it infects nose and upper respiratory tract, whereas Pneumonia infects lung alveoli); confusing Benign tumors with Malignant tumors (only malignant show metastasis).",
        "questionType": "5-mark Plasmodium life cycle or HIV replication; 3-mark Innate immunity barriers with examples; 3-mark Drug classes (Opioids vs Cannabinoids vs Coca alkaloids)."
      },
      "topics": [
        {
          "id": "bio_12_ch07_t1",
          "topicName": "Pathogens and Common Infectious Diseases",
          "ncertSection": "7.1",
          "highYield": true,
          "subtopics": [
            "Bacterial: Typhoid (Salmonella typhi, sustained 39-40°C fever, Widal test); Pneumonia (Streptococcus pneumoniae, lung alveoli fluid, lips/nails turn gray)",
            "Viral: Common Cold (Rhinoviruses, infects nose/passage but not lungs, 3-7 days)",
            "Protozoan: Malaria (Plasmodium vivax, falciparum; sporozoites → liver cells → RBCs burst releasing Haemozoin chills/fever; gametocytes in blood, fertilization in mosquito gut)",
            "Protozoan: Amoebiasis (Entamoeba histolytica, large intestine, housefly mechanical carrier)",
            "Helminthic & Fungal: Ascariasis (Ascaris lumbricoides); Filariasis (Wuchereria bancrofti, Culex vector, lymphatic swelling); Ringworm (Microsporum, Trichophyton)"
          ]
        },
        {
          "id": "bio_12_ch07_t2",
          "topicName": "Immunity and Immune Responses",
          "ncertSection": "7.2",
          "highYield": true,
          "subtopics": [
            "Innate Immunity: Physical (skin, mucus), Physiological (acid, saliva, lysozyme tears), Cellular (PMNL, monocytes, NK cells), Cytokine (Interferons)",
            "Acquired Immunity: B-lymphocytes (humoral antibodies), T-lymphocytes (Cell-Mediated Immunity CMI, graft rejection)",
            "Antibody Structure: H₂L₂ held by disulfide bonds (IgG, IgM, IgA colostrum, IgE allergy, IgD)",
            "Active vs Passive immunity (colostrum IgA, anti-tetanus serum, anti-venom)",
            "Allergy (IgE mediated, mast cells release histamine/serotonin) & Autoimmunity (Rheumatoid arthritis)",
            "Lymphoid Organs: Primary (Bone marrow & Thymus) vs Secondary (Spleen, Lymph nodes, MALT ~50% of lymphoid tissue)"
          ]
        },
        {
          "id": "bio_12_ch07_t3",
          "topicName": "AIDS and Cancer",
          "ncertSection": "7.3",
          "highYield": true,
          "subtopics": [
            "AIDS: HIV retrovirus, ssRNA genome, reverse transcriptase; infects macrophages (\"HIV factory\") and attacks TH helper T-cells; ELISA diagnosis",
            "Cancer: Loss of contact inhibition; Benign vs Malignant tumors (Metastasis); Carcinogens (physical UV/X-rays, chemical tobacco, oncogenic viruses); α-interferon immunotherapy"
          ]
        },
        {
          "id": "bio_12_ch07_t4",
          "topicName": "Drug and Alcohol Abuse",
          "ncertSection": "7.4",
          "highYield": true,
          "subtopics": [
            "Opioids: Morphine (sedative/analgesic from Papaver somniferum latex) and Heroin (\"smack\", diacetylmorphine depressant)",
            "Cannabinoids: Cannabis sativa inflorescence (marijuana, hashish, charas, ganja; cardiovascular receptors)",
            "Coca alkaloids / Cocaine: Erythroxylum coca, dopamine transport interference, euphoria/hallucinations",
            "Hallucinogens: Atropa belladonna, Datura; Dependence and withdrawal syndrome"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch08",
      "grade": "12",
      "discipline": "BOTANY",
      "unit": "Unit VIII: Biology in Human Welfare (12 Marks)",
      "chapterNumber": 8,
      "chapterName": "Microbes in Human Welfare",
      "boardExamFocus": {
        "highYield": "Match-the-following bioactive molecules (Statins, Cyclosporin A, Streptokinase, Citric acid); Steps of Sewage Treatment Plant (aeration tank, flocs, BOD concept, anaerobic sludge digester); Biocontrol agents and Mycorrhiza.",
        "standardTrap": "Confusing Cyclosporin A (immunosuppressant from fungus Trichoderma polysporum) with Statins (blood cholesterol lowering from yeast Monascus purpureus); assuming primary sewage treatment uses microbes (it is purely physical filtration & sedimentation).",
        "questionType": "3-mark microbe and commercial product matching; 3-mark STP primary vs secondary biological treatment flow; 2-mark Biogas plant working."
      },
      "topics": [
        {
          "id": "bio_12_ch08_t1",
          "topicName": "Microbes in Household, Industrial & Energy Production",
          "ncertSection": "8.1",
          "highYield": true,
          "subtopics": [
            "Household: Curd (Lactobacillus / LAB, Vitamin B₁₂ enrichment), Baker's yeast (Saccharomyces cerevisiae), Toddy, Swiss cheese (Propionibacterium sharmanii CO₂ holes), Roquefort cheese (Penicillium roqueforti)",
            "Industrial: Brewer's yeast (ethanol fermentation), Penicillin (Alexander Fleming, Penicillium notatum)",
            "Bioactive molecules: Aspergillus niger (Citric acid), Acetobacter aceti (Acetic acid), Clostridium butylicum (Butyric acid), Lactobacillus (Lactic acid)",
            "Streptococcus → Streptokinase (clot buster for myocardial infarction)",
            "Trichoderma polysporum → Cyclosporin A (immunosuppressant in organ transplant)",
            "Monascus purpureus → Statins (blood cholesterol lowering competitive inhibitor)",
            "Biogas: Methanogens (Methanobacterium), cattle dung (Gobar gas: CH₄ 50-70%, CO₂ 30-40%, H₂S); IARI and KVIC digester tank"
          ]
        },
        {
          "id": "bio_12_ch08_t2",
          "topicName": "Sewage Treatment & Biocontrol Agents",
          "ncertSection": "8.2",
          "highYield": true,
          "subtopics": [
            "STP Primary Treatment (Physical): Sequential filtration and sedimentation → primary sludge and primary effluent",
            "STP Secondary Treatment (Biological): Aeration tanks, aerobic microbes form Flocs (bacteria + fungal filaments), BOD reduction",
            "Settling tank: Activated sludge; part as inoculum, major part to Anaerobic Sludge Digesters (produces biogas CH₄, CO₂, H₂S)",
            "Biocontrol agents: Ladybird (aphids), Dragonflies (mosquitoes), Bacillus thuringiensis Bt (caterpillars), Trichoderma (root pathogens), Baculoviruses (Nucleopolyhedrovirus, narrow-spectrum IPM)",
            "Biofertilizers: Rhizobium, Azotobacter, Azospirillum; Mycorrhiza (Glomus absorbs phosphorus); Cyanobacteria (Anabaena, Nostoc, Oscillatoria in paddy)"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch09",
      "grade": "12",
      "discipline": "BOTANY",
      "unit": "Unit IX: Biotechnology (12 Marks)",
      "chapterNumber": 9,
      "chapterName": "Biotechnology: Principles and Processes",
      "boardExamFocus": {
        "highYield": "Vector pBR322 diagram with restriction sites, ori, rop, ampR, tetR; Insertional inactivation vs Blue-white selection; Steps of PCR (Denaturation, Annealing, Extension with Taq polymerase); Gel electrophoresis with Ethidium bromide and elution.",
        "standardTrap": "Forgetting that Taq polymerase is isolated from thermophilic bacterium Thermus aquaticus and functions at 72°C; misplacing BamHI/SalI in ampR instead of tetR.",
        "questionType": "5-mark recombinant DNA technology workflow; 3-mark pBR322 vector diagram with insertional inactivation; 3-mark PCR cycle diagram."
      },
      "topics": [
        {
          "id": "bio_12_ch09_t1",
          "topicName": "Core Principles and Tools",
          "ncertSection": "9.1",
          "highYield": true,
          "subtopics": [
            "Core techniques: Genetic Engineering and Bioprocess Engineering",
            "Restriction Enzymes (Molecular scissors): Palindromic recognition sequences, EcoRI (5'-GAATTC-3') sticky ends, nomenclature rules",
            "Cloning Vectors: Origin of replication (ori controls copy number), Selectable markers (ampR, tetR in E. coli), Cloning sites",
            "Vector pBR322: ori, rop, ampR (PstI, PvuI), tetR (BamHI, SalI)",
            "Insertional inactivation: Insertion at BamHI site in tetR gene inactivates tetracycline resistance",
            "Blue-White screening: Insertional inactivation of β-galactosidase (lacZ gene); recombinants remain white on X-gal",
            "Plant and animal vectors: Agrobacterium tumefaciens Ti-plasmid, disarmed Retroviruses"
          ]
        },
        {
          "id": "bio_12_ch09_t2",
          "topicName": "Competent Hosts & Processes of r-DNA Technology",
          "ncertSection": "9.2",
          "highYield": true,
          "subtopics": [
            "Competent host transformation: Divalent cation (Ca²⁺) + heat shock at 42°C; Micro-injection (animals) and Biolistics / Gene gun (gold/tungsten for plants)",
            "Isolation of DNA: Lysozyme, Cellulase, Chitinase; Protease and RNase; chilled ethanol precipitation (spooling)",
            "Gel Electrophoresis: Agarose gel, migration toward anode by size, Ethidium bromide UV staining (orange bands), Elution",
            "Polymerase Chain Reaction (PCR): Denaturation (94°C), Annealing (54°C), Extension (72°C via Taq polymerase from Thermus aquaticus)",
            "Bioreactors: Simple stirred-tank vs Sparged stirred-tank (air bubbles increase oxygen transfer area)",
            "Downstream processing: Separation, purification, quality testing"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch10",
      "grade": "12",
      "discipline": "BOTANY",
      "unit": "Unit IX: Biotechnology (12 Marks)",
      "chapterNumber": 10,
      "chapterName": "Biotechnology and its Applications",
      "boardExamFocus": {
        "highYield": "Manufacturing of genetically engineered Insulin (Humulin by Eli Lilly); RNA interference (RNAi) mechanism against Meloidogyne incognita in tobacco; Bt Cotton mode of action and specific cry genes; ADA deficiency gene therapy.",
        "standardTrap": "Confusing proinsulin (contains C-peptide) with mature active insulin (A and B chains linked by disulfide bonds, C-peptide removed); mixing cryIAc/cryIIAb (cotton bollworm) with cryIAb (corn borer).",
        "questionType": "5-mark Recombinant insulin processing or RNAi mechanism; 3-mark ADA deficiency permanent vs temporary cure; 2-mark Transgenic animal Rosie the cow."
      },
      "topics": [
        {
          "id": "bio_12_ch10_t1",
          "topicName": "Applications in Agriculture",
          "ncertSection": "10.1",
          "highYield": true,
          "subtopics": [
            "Bt Cotton: Bacillus thuringiensis produces inactive protoxin crystals; alkaline gut pH of insect solubilizes crystals, creates epithelial pores, lysis and death",
            "Bt genes: cryIAc and cryIIAb control cotton bollworms; cryIAb controls corn borer",
            "RNA Interference (RNAi): Cellular defense in eukaryotes; nematode Meloidogyne incognita attacks tobacco roots; Agrobacterium vector introduces sense and anti-sense RNA forming dsRNA to silence nematode mRNA"
          ]
        },
        {
          "id": "bio_12_ch10_t2",
          "topicName": "Applications in Medicine & Transgenic Animals",
          "ncertSection": "10.2",
          "highYield": true,
          "subtopics": [
            "Genetically Engineered Insulin (Humulin, Eli Lilly 1983): Pro-insulin has extra C-peptide (33 amino acids); A and B chains synthesized separately in E. coli and combined via disulfide bonds",
            "Gene Therapy for ADA deficiency: Severe Combined Immunodeficiency (SCID); retroviral transfer of ADA cDNA into lymphocytes (temporary) vs bone marrow stem cells at early embryonic stages (permanent cure)",
            "Molecular Diagnostics: PCR, ELISA, DNA probes for early detection",
            "Transgenic Animals: Rosie the cow (1997, produces human α-lactalbumin enriched milk 2.4 g/L); α-1-antitrypsin for emphysema; vaccine safety testing (polio mice)"
          ]
        },
        {
          "id": "bio_12_ch10_t3",
          "topicName": "Ethical Issues and Biopiracy",
          "ncertSection": "10.3",
          "highYield": true,
          "subtopics": [
            "GEAC (Genetic Engineering Appraisal Committee): Validates safety of GM research and commercial release",
            "Biopiracy: Unauthorized exploitation of bioresources and traditional knowledge (patenting of Basmati rice, neem, turmeric)"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch11",
      "grade": "12",
      "discipline": "ZOOLOGY",
      "unit": "Unit X: Ecology and Environment (10 Marks)",
      "chapterNumber": 11,
      "chapterName": "Organisms and Populations",
      "boardExamFocus": {
        "highYield": "Verhulst-Pearl Logistic Growth equation and sigmoid curve (dN/dt = rN(K-N)/K); Population interaction table (+, -, 0) with real-world examples (Brood parasitism, sexual deceit in Ophrys, Gause exclusion principle); Adaptations (Kangaroo rat, Allen's rule, altitude sickness).",
        "standardTrap": "Assuming exponential growth is realistic in nature (logistic growth with carrying capacity K is realistic); confusing commensalism (+, 0) with amensalism (-, 0).",
        "questionType": "5-mark Logistic vs Exponential growth curves derivation; 3-mark Population interaction identification; 2-mark High altitude adaptation physiological mechanisms."
      },
      "topics": [
        {
          "id": "bio_12_ch011_t1",
          "topicName": "Responses to Abiotic Factors & Adaptations",
          "ncertSection": "11.1",
          "highYield": true,
          "subtopics": [
            "Major Abiotic Factors: Temperature (eurythermal vs stenothermal), Water (euryhaline vs stenohaline), Light, Soil",
            "Responses: Regulate (homeostasis in birds/mammals), Conform (99% animals, heat loss in shrews/hummingbirds due to large surface-to-volume ratio), Migrate (Keoladeo Ghana National Park), Suspend (dormancy, hibernation in bears, aestivation in snails, diapause in zooplankton)",
            "Adaptations: Desert Opuntia (sunken stomata, spines, CAM pathway); Kangaroo rat (internal fat oxidation, concentrated urine); Allen's Rule (shorter limbs/ears in cold); Blubber in seals; Altitude sickness (compensates by increasing RBCs, reducing Hb binding affinity, increasing breathing rate)"
          ]
        },
        {
          "id": "bio_12_ch11_t2",
          "topicName": "Population Attributes & Growth Models",
          "ncertSection": "11.2",
          "highYield": true,
          "subtopics": [
            "Population Attributes: Natality, Mortality, Sex ratio, Age pyramids (Expanding broad base, Stable bell-shaped, Declining urn-shaped)",
            "Population Density formula: N_(t+1) = N_t + [(B + I) - (D + E)]",
            "Exponential Growth: dN/dt = rN, N_t = N₀ e^(rt) (J-shaped curve in unlimited resources)",
            "Logistic Growth (Verhulst-Pearl): dN/dt = rN((K-N)/K) (Sigmoid S-shaped curve with carrying capacity K)"
          ]
        },
        {
          "id": "bio_12_ch11_t3",
          "topicName": "Population Interactions",
          "ncertSection": "11.3",
          "highYield": true,
          "subtopics": [
            "Mutualism (+/+): Lichen, Mycorrhizae, Fig tree & wasp, Mediterranean orchid Ophrys sexual deceit with Colpa bee",
            "Competition (-/-): Abingdon tortoise extinction in Galapagos due to goats, Gause's Competitive Exclusion Principle, MacArthur resource partitioning in warblers",
            "Predation (+/-): Conduit for energy transfer, keeps prey in check (Prickly pear cactus & moth, starfish Pisaster removal led to 10 extinctions); Monarch butterfly unpalatable toxin",
            "Parasitism (+/-): Ectoparasites vs Endoparasites, Brood parasitism (Cuckoo/Koel in Crow nest)",
            "Commensalism (+/0): Orchid on mango tree, Barnacles on whale, Cattle egret and grazing cattle, Clownfish and sea anemone",
            "Amensalism (-/0): Penicillium inhibiting bacteria"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch12",
      "grade": "12",
      "discipline": "BOTANY",
      "unit": "Unit X: Ecology and Environment (10 Marks)",
      "chapterNumber": 12,
      "chapterName": "Ecosystem",
      "boardExamFocus": {
        "highYield": "Lindeman’s 10% law of energy transfer; Ecological Pyramids (always upright pyramid of energy vs inverted pyramid of biomass in aquatic ecosystem); Five steps of decomposition; NPP = GPP - R.",
        "standardTrap": "Drawing an inverted pyramid of energy (pyramid of energy is ALWAYS upright according to 2nd law of thermodynamics); confusing humification with mineralization.",
        "questionType": "3-mark Inverted biomass pyramid in sea explanation; 3-mark Decomposition steps; 2-mark GPP vs NPP."
      },
      "topics": [
        {
          "id": "bio_12_ch12_t1",
          "topicName": "Productivity, Decomposition & Energy Flow",
          "ncertSection": "12.1",
          "highYield": true,
          "subtopics": [
            "Ecosystem structure: Stratification (vertical layers: trees, shrubs, herbs)",
            "Productivity: Gross Primary Productivity (GPP) vs Net Primary Productivity (NPP = GPP - R); Biosphere NPP is 170 billion tons, oceans contribute only 55 billion tons",
            "Decomposition steps: Fragmentation (earthworms), Leaching (water-soluble nutrients percolate), Catabolism (fungal/bacterial enzymes), Humification (dark amorphous humus reservoir), Mineralization",
            "Energy Flow: Unidirectional, plants capture 2-10% PAR; Lindeman's 10% Law (90% lost as heat); Grazing Food Chain (GFC, major in aquatic) vs Detritus Food Chain (DFC, major in terrestrial)"
          ]
        },
        {
          "id": "bio_12_ch12_t2",
          "topicName": "Ecological Pyramids",
          "ncertSection": "12.2",
          "highYield": true,
          "subtopics": [
            "Pyramid of Numbers: Upright in grassland, Inverted in single tree supporting birds and parasites",
            "Pyramid of Biomass: Upright in terrestrial, Inverted in aquatic ecosystem (small biomass of phytoplankton supports large biomass of fish)",
            "Pyramid of Energy: Always upright without exception (energy lost as heat at each trophic step)",
            "Limitations: Does not accommodate species functioning at two trophic levels, ignores food web, excludes saprophytes"
          ]
        }
      ]
    },
    {
      "id": "bio_12_ch13",
      "grade": "12",
      "discipline": "BOTANY",
      "unit": "Unit X: Ecology and Environment (10 Marks)",
      "chapterNumber": 13,
      "chapterName": "Biodiversity and Conservation",
      "boardExamFocus": {
        "highYield": "Species-Area Relationship derivation and plot (log S = log C + Z log A); The Evil Quartet (four major drivers of biodiversity loss); In-situ (National parks, Biosphere reserves, Sacred groves) vs Ex-situ (Cryopreservation, Botanical gardens).",
        "standardTrap": "Using slope Z = 0.1-0.2 for continents (for massive continental areas Z is steeper: 0.6-1.2, e.g. frugivorous birds Z=1.15); placing Botanical gardens under in-situ conservation (they are ex-situ).",
        "questionType": "3-mark Species-Area relationship graph and formula; 3-mark The Evil Quartet with examples; 2-mark In-situ vs Ex-situ conservation."
      },
      "topics": [
        {
          "id": "bio_12_ch13_t1",
          "topicName": "Biodiversity Patterns and Loss",
          "ncertSection": "13.1",
          "highYield": true,
          "subtopics": [
            "Levels of Biodiversity (Edward Wilson): Genetic (Rauwolfia vomitoria reserpine, 50,000 rice strains), Species (Western Ghats amphibians), Ecological (India vs Norway)",
            "Global species richness (Robert May estimate: ~7 million): Animals >70%, plants ≤22%, insects >70% of animals; India has 2.4% land area and 8.1% species diversity",
            "Latitudinal gradients: Equator to poles decline; Amazon rainforest richest (>40,000 plants, 3,000 fish, 1,300 birds)",
            "Species-Area Relationship (Alexander von Humboldt): log S = log C + Z log A (Z = 0.1-0.2 for regions; Z = 0.6-1.2 for continents)",
            "The Evil Quartet: 1. Habitat loss & fragmentation (Amazon cleared for soybeans); 2. Over-exploitation (Steller sea cow, Passenger pigeon); 3. Alien species invasions (Nile perch in Lake Victoria, Parthenium, Eichhornia, Clarias gariepinus); 4. Co-extinctions (plant-pollinator mutualisms)"
          ]
        },
        {
          "id": "bio_12_ch13_t2",
          "topicName": "Conservation Strategies",
          "ncertSection": "13.2",
          "highYield": true,
          "subtopics": [
            "Why Conserve: Narrowly utilitarian (food, medicine >25%), Broadly utilitarian (Amazon 20% oxygen, pollination), Ethical obligation",
            "In-situ Conservation (On-site): National Parks, Wildlife Sanctuaries, Biosphere Reserves (14 in India); Biodiversity Hotspots (high endemism, 34 worldwide, 3 in India: Western Ghats/Sri Lanka, Indo-Burma, Himalayas); Sacred Groves (Khasi/Jaintia hills Meghalaya, Aravalli Rajasthan)",
            "Ex-situ Conservation (Off-site): Zoological Parks, Botanical Gardens, Wildlife Safari Parks",
            "Advanced Ex-situ: Cryopreservation (-196°C in liquid nitrogen), in vitro tissue culture, Seed Banks"
          ]
        }
      ]
    }
  ]
},

  // ==========================================================================
  // 2. SENIOR PHYSICS (Class 11 & Class 12) - JEE Main / Advanced / Boards
  // ==========================================================================
  'PHYSICS': {
    subjectName: 'Senior Physics (+1 & +2)',
    stream: 'COMMON_SENIOR',
    grades: ['11', '12'],
    targetExams: ['CBSE_CLASS_12', 'HP_BOARD_CLASS_12', 'NEET_UG', 'JEE_MAIN'],
    units: [
      { unitNumber: 'I & II', unitName: 'Electrostatics & Current Electricity', weightageMarks: 16, chapters: [1, 2, 3] },
      { unitNumber: 'III & IV', unitName: 'Magnetic Effects, Magnetism & EMI/AC', weightageMarks: 17, chapters: [4, 5, 6, 7] },
      { unitNumber: 'V & VI', unitName: 'Electromagnetic Waves & Optics', weightageMarks: 18, chapters: [8, 9, 10] },
      { unitNumber: 'VII & VIII', unitName: 'Dual Nature, Atoms and Nuclei', weightageMarks: 12, chapters: [11, 12, 13] },
      { unitNumber: 'IX', unitName: 'Electronic Devices (Semiconductors)', weightageMarks: 7, chapters: [14] }
    ],
    boardHighYieldSummary: {
      examBoard: 'CBSE / HPBOSE Class 12 Physics (70 Marks Theory)',
      fiveMarkGuarantees: [
        {
          rank: 1,
          topic: 'Ray Optics Derivations & Ray Diagrams',
          detail: 'Lens Maker\'s Formula derivation, single spherical surface refraction, or complete labelled ray diagram and magnification of Compound Microscope / Astronomical Telescope.',
          chapter: 'Chapter 9: Ray Optics and Optical Instruments'
        },
        {
          rank: 2,
          topic: 'Current Electricity & Magnetism Derivations',
          detail: 'Microscopic deduction of Ohm\'s law (I = neAv_d ⇒ ρ = m/(ne²τ)), magnetic field on the axis of circular current loop, or Moving Coil Galvanometer principle & conversion math.',
          chapter: 'Chapter 3: Current Electricity & Chapter 4: Moving Charges'
        },
        {
          rank: 3,
          topic: 'AC Circuits & Electromagnetic Induction',
          detail: 'Phasor diagram derivation for Series LCR circuit impedance & resonance, AC Generator working & induced EMF derivation, or Full-Wave Rectifier with capacitor filter.',
          chapter: 'Chapter 7: Alternating Current & Chapter 14: Semiconductors'
        }
      ],
      caseStudyFourMark: [
        {
          topic: 'Optics: TIR & Optical Instruments',
          detail: 'Total Internal Reflection in optical fibers, mirages, totally reflecting prisms, or compound microscope adjustments.',
          chapter: 'Chapter 9: Ray Optics'
        },
        {
          topic: 'Modern Physics & Dual Nature',
          detail: 'Photoelectric effect graphical analysis (V₀ vs ν, intensity vs collector potential) and de Broglie wavelength ratio comparisons.',
          chapter: 'Chapter 11: Dual Nature of Radiation and Matter'
        },
        {
          topic: 'Capacitance & Combination of Cells',
          detail: 'Dielectric insertion under battery connected vs disconnected conditions, or parallel/series cell combinations with internal resistances.',
          chapter: 'Chapter 2: Electrostatic Potential & Chapter 3: Current Electricity'
        }
      ],
      threeMarkHeavyweights: [
        {
          topic: 'Wave Optics: Huygens Wave Theory',
          detail: 'Proof of the Law of Reflection and Snell\'s Law of Refraction using Huygens secondary wavelets construction.',
          chapter: 'Chapter 10: Wave Optics'
        },
        {
          topic: 'Semiconductor Full-Wave Rectifier',
          detail: 'Circuit diagram with center-tapped transformer, operation during positive/negative half-cycles, and input/output waveforms.',
          chapter: 'Chapter 14: Semiconductor Electronics'
        },
        {
          topic: 'Atoms & Nuclei Spectral Transitions',
          detail: 'Hydrogen spectral series wavelength calculations (Lyman, Balmer limits) and Bohr radius/energy derivations.',
          chapter: 'Chapter 12: Atoms & Chapter 13: Nuclei'
        },
        {
          topic: 'Gauss\'s Law Applications & Electric Dipole',
          detail: 'Field due to infinitely long straight wire or infinite plane sheet; torque and potential energy of dipole in uniform field.',
          chapter: 'Chapter 1: Electric Charges and Fields'
        }
      ]
    },
    chapters: [
      // --- PART I: CHAPTERS 1 TO 8 ---
      {
        id: 'phy_12_ch01',
        grade: '12',
        discipline: 'ELECTROSTATICS',
        unit: 'Electrostatics & Current Electricity (Unit I & II - 16M)',
        chapterNumber: 1,
        chapterName: 'Electric Charges and Fields',
        boardExamFocus: {
          highYield: 'Gauss\'s Law applications (infinitely long straight wire and uniformly charged infinite plane sheet); Electric field on the equatorial line of a dipole.',
          standardTrap: 'Forgetting vector directions when finding net torque/force or drawing electric field lines terminating perpendicularly on conducting surfaces.',
          questionType: '3-mark Gauss\'s law derivations, 2/3-mark dipole derivations, 1-mark flux through closed surfaces.'
        },
        topics: [
          {
            id: 'phy_12_ch01_t1',
            topicName: 'Fundamentals of Electric Charge & Coulomb\'s Law',
            ncertSection: '1.1',
            highYield: true,
            subtopics: [
              'Properties of Charge: Additivity, conservation, and quantization (q = ±ne)',
              'Coulomb\'s Law in scalar and vector forms: F₁₂ = (1/4πε₀)(q₁q₂/r²) r̂₂₁',
              'Principle of Superposition for discrete charge distributions',
              'Relative permittivity / Dielectric constant: ε_r = K = ε/ε₀ = F_vac/F_med'
            ]
          },
          {
            id: 'phy_12_ch01_t2',
            topicName: 'Electric Field & Electric Dipole',
            ncertSection: '1.2',
            highYield: true,
            subtopics: [
              'Electric Field Intensity (E): Field due to a point charge (E = q/(4πε₀r²)) and continuous field lines',
              'Electric Dipole Moment (p = q(2a))',
              'Derivation: Electric field on the axial line: E_axial = 2pr/(4πε₀(r²-a²)²) ≈ 2p/(4πε₀r³)',
              'Derivation: Electric field on the equatorial line: E_equatorial = p/(4πε₀(r²+a²)^(3/2)) ≈ p/(4πε₀r³)',
              'Relation: E_axial = 2 E_equatorial along opposite relative vectors',
              'Dipole in Uniform External Field: Torque derivation τ = p × E (τ = pE sin θ)',
              'Net force = 0 in uniform field; non-zero in non-uniform field',
              'Potential energy: U = -p · E = -pE cos θ; stable (0°) vs unstable (180°) equilibrium'
            ]
          },
          {
            id: 'phy_12_ch01_t3',
            topicName: 'Gauss\'s Law and Its Applications',
            ncertSection: '1.3',
            highYield: true,
            subtopics: [
              'Electric Flux (Φ_E): Φ_E = ∫ E · dA',
              'Gauss\'s Theorem: ∮ E · dA = q_enclosed / ε₀',
              'Derivation: Field due to an infinitely long straight uniformly charged wire: E = λ/(2πε₀r)',
              'Derivation: Field due to a uniformly charged infinite plane sheet: E = σ/(2ε₀) (independent of distance r)',
              'Derivation: Field due to a uniformly charged thin spherical shell (radius R): Outside, Surface, Inside (E=0), and E vs r plot'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch02',
        grade: '12',
        discipline: 'ELECTROSTATICS',
        unit: 'Electrostatics & Current Electricity (Unit I & II - 16M)',
        chapterNumber: 2,
        chapterName: 'Electrostatic Potential and Capacitance',
        boardExamFocus: {
          highYield: 'Parallel plate capacitor with dielectric slab derivation; Comparison table questions (Battery connected vs. disconnected when slab is inserted); Work done on equipotential surfaces.',
          standardTrap: 'Mixing up energy loss formulas or failing to recognize that V stays constant when battery remains connected, while Q remains constant if disconnected.',
          questionType: '3-mark dielectric slab capacitance proof, 2-mark battery disconnected/connected table, 1-mark equipotential surface sketch.'
        },
        topics: [
          {
            id: 'phy_12_ch02_t1',
            topicName: 'Electrostatic Potential & Potential Energy',
            ncertSection: '2.1',
            highYield: true,
            subtopics: [
              'Potential (V): V = W/q₀; potential due to a point charge: V = q/(4πε₀r)',
              'Electric Potential of a Dipole: General formula V = (p cos θ)/(4πε₀r²); axial value p/(4πε₀r²); equatorial value 0',
              'Equipotential Surfaces: Properties (no work done moving charge W = 0; E ⊥ surface; surfaces never intersect)',
              'Drawing equipotential surfaces: point charge, uniform E field, dipole, and two identical like charges',
              'Relationship between E and V: E = -dV/dr (direction of E is along steepest decrease of V)',
              'Potential Energy of System of Charges: Discrete configurations without and with external fields'
            ]
          },
          {
            id: 'phy_12_ch02_t2',
            topicName: 'Capacitance & Dielectrics',
            ncertSection: '2.2',
            highYield: true,
            subtopics: [
              'Capacitor Principle & Parallel Plate Capacitor: Derivation C₀ = ε₀A/d (vacuum)',
              'Effect of Dielectrics: Polarization P = χ_e E; Derivation with dielectric slab of thickness t: C = ε₀A / [d - t(1 - 1/K)]',
              'Fully filled capacitor: C = KC₀',
              'Combinations: Series 1/C_s = Σ 1/C_i (charge Q constant); Parallel C_p = Σ C_i (potential V constant)',
              'Energy Stored in a Capacitor: Derivation U = 1/2 CV² = Q²/(2C) = 1/2 QV; Energy density u_E = 1/2 ε₀E²',
              'Dielectric insertion conditions: Battery connected (V constant) vs Battery disconnected (Q constant)'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch03',
        grade: '12',
        discipline: 'CURRENT ELECTRICITY',
        unit: 'Electrostatics & Current Electricity (Unit I & II - 16M)',
        chapterNumber: 3,
        chapterName: 'Current Electricity',
        boardExamFocus: {
          highYield: 'Microscopic Ohm\'s Law derivation (I = neAv_d ⇒ ρ = m/(ne²τ)); Equivalent EMF and internal resistance of two parallel cells.',
          standardTrap: 'Solving 2-loop circuits with incorrect Kirchhoff junction or sign conventions; calculating equivalent resistance of unbalanced bridges.',
          questionType: '3/5-mark Kirchhoff loop analysis and parallel cell derivation; 2-mark drift velocity reasoning.'
        },
        topics: [
          {
            id: 'phy_12_ch03_t1',
            topicName: 'Conduction Mechanism & Ohm\'s Law',
            ncertSection: '3.1',
            highYield: true,
            subtopics: [
              'Drift Velocity (v_d): Relation between drift velocity, relaxation time (τ), and electric field: v_d = -(eE/m)τ',
              'Derivation: Relation between electric current and drift velocity: I = neAv_d',
              'Derivation: Deduction of Ohm\'s law and resistivity: ρ = m/(ne²τ), R = ρl/A',
              'Current density: j = σE (vector form of Ohm\'s Law)',
              'Mobility (μ): μ = |v_d|/E = eτ/m',
              'Temperature Dependence of Resistivity: ρ_T = ρ₀[1 + α(T - T₀)]; graphs of ρ vs T for Copper, Silicon, and Nichrome'
            ]
          },
          {
            id: 'phy_12_ch03_t2',
            topicName: 'EMF, Internal Resistance, and Cells',
            ncertSection: '3.2',
            highYield: true,
            subtopics: [
              'Cell EMF (ℰ) vs Terminal Potential (V): Discharging V = ℰ - Ir; Charging V = ℰ + Ir; Open circuit V = ℰ',
              'Combination of Cells: Series combination derivation (ℰ_eq = ℰ₁ + ℰ₂, r_eq = r₁ + r₂)',
              'Derivation: Equivalent EMF and internal resistance for cells in parallel: ℰ_eq = (ℰ₁/r₁ + ℰ₂/r₂)/(1/r₁ + 1/r₂), r_eq = r₁r₂/(r₁+r₂)'
            ]
          },
          {
            id: 'phy_12_ch03_t3',
            topicName: 'Circuit Laws & Measuring Bridges',
            ncertSection: '3.3',
            highYield: true,
            subtopics: [
              'Kirchhoff\'s First Law (Junction Rule): Σ I = 0 (Conservation of Charge)',
              'Kirchhoff\'s Second Law (Loop Rule): Σ ΔV = 0 (Conservation of Energy)',
              'Wheatstone Bridge: Circuit diagram and balance condition derivation using Kirchhoff\'s laws: R₁/R₂ = R₃/R₄ (no galvanometer current)'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch04',
        grade: '12',
        discipline: 'MAGNETISM',
        unit: 'Magnetic Effects, Magnetism & EMI/AC (Unit III & IV - 17M)',
        chapterNumber: 4,
        chapterName: 'Moving Charges and Magnetism',
        boardExamFocus: {
          highYield: 'Magnetic field on the axis of a circular current loop; Force per unit length between parallel wires; Moving Coil Galvanometer (MCG) conversion math.',
          standardTrap: 'Forgetting the condition/role of a radial magnetic field in an MCG; calculating shunt resistance with incorrect full-scale deflection current I_g.',
          questionType: '5-mark MCG/axial loop derivation; 3-mark galvanometer to ammeter/voltmeter conversion numerical.'
        },
        topics: [
          {
            id: 'phy_12_ch04_t1',
            topicName: 'Biot-Savart Law and Applications',
            ncertSection: '4.1',
            highYield: true,
            subtopics: [
              'Biot-Savart Law: dB = (μ₀/4π) [I(dl × r̂) / r²]',
              'Core Derivation: Magnetic field on the axis of a circular current loop: B = (μ₀ I R²) / [2(R² + x²)^(3/2)]',
              'Center of the loop (x = 0): B = μ₀I / (2R)',
              'Right-Hand Thumb Rule for field direction'
            ]
          },
          {
            id: 'phy_12_ch04_t2',
            topicName: 'Ampere’s Circuital Law (ACL)',
            ncertSection: '4.2',
            highYield: true,
            subtopics: [
              'Statement: ∮ B · dl = μ₀ I_enclosed',
              'Derivation: Magnetic field due to an infinitely long, straight current-carrying conductor: B = μ₀I / (2πr)',
              'Solenoid: Magnetic field inside a long straight solenoid: B = μ₀ n I'
            ]
          },
          {
            id: 'phy_12_ch04_t3',
            topicName: 'Magnetic Forces & Torque',
            ncertSection: '4.3',
            highYield: true,
            subtopics: [
              'Lorentz Force: F = q(E + v × B); Magnetic force F = q(v × B) (does zero work since F ⊥ v)',
              'Trajectory in magnetic field: Circular (radius r = mv/(qB)) and Helical (pitch p = 2πmv cos θ/(qB))',
              'Force on a Current-Carrying Conductor: F = I(L × B)',
              'Derivation: Force between two parallel, infinite current-carrying conductors: F/L = (μ₀ I₁ I₂) / (2π d)',
              'Definition of the standard Ampere; Parallel currents attract; antiparallel currents repel',
              'Torque on a Current Loop: τ = M × B where magnetic moment M = NI A'
            ]
          },
          {
            id: 'phy_12_ch04_t4',
            topicName: 'Moving Coil Galvanometer (MCG)',
            ncertSection: '4.4',
            highYield: true,
            subtopics: [
              'Principle, Construction & Working: Deflecting torque = Restoring torque ⇒ NIAB = kθ ⇒ θ = (NAB/k)I',
              'Role of radial magnetic field (cylindrical soft iron core + concave poles) to keep θ = 90° at all orientations',
              'Current sensitivity: I_s = θ/I = NAB/k; Voltage sensitivity: V_s = θ/V = NAB/(kR)',
              'Why increasing I_s does not necessarily increase V_s',
              'Conversion to Ammeter: Low shunt resistance in parallel (S = I_g R_g / (I - I_g))',
              'Conversion to Voltmeter: High resistance in series (R = V/I_g - R_g)'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch05',
        grade: '12',
        discipline: 'MAGNETISM',
        unit: 'Magnetic Effects, Magnetism & EMI/AC (Unit III & IV - 17M)',
        chapterNumber: 5,
        chapterName: 'Magnetism and Matter',
        boardExamFocus: {
          highYield: 'Comparative table of Dia-, Para-, and Ferromagnetic properties (χ_m, μ_r, behavior in non-uniform field, temperature dependence); Physical implication of Gauss\'s Law in Magnetism.',
          standardTrap: 'Confusing magnetization M with magnetic moment m or omitting negative sign for diamagnetic susceptibility.',
          questionType: '2/3-mark comparative table, 1-mark conceptual MCQ on Gauss\'s Law in Magnetism.'
        },
        topics: [
          {
            id: 'phy_12_ch05_t1',
            topicName: 'Bar Magnet as an Equivalent Solenoid',
            ncertSection: '5.1',
            highYield: false,
            subtopics: [
              'Magnetic field lines: continuous, closed loops outside (N to S) and inside (S to N) the magnet',
              'Axial magnetic field of a bar magnet: B_axial = (μ₀/4π)(2m/r³); Equatorial field: B_equatorial = (μ₀/4π)(m/r³)',
              'Potential energy of a magnetic dipole in B: U = -M · B = -mB cos θ'
            ]
          },
          {
            id: 'phy_12_ch05_t2',
            topicName: 'Gauss\'s Law in Magnetism',
            ncertSection: '5.2',
            highYield: true,
            subtopics: [
              'Statement: ∮ B · dA = 0',
              'Physical Significance: Absence of isolated magnetic monopoles; net magnetic flux through any closed Gaussian surface is always zero'
            ]
          },
          {
            id: 'phy_12_ch05_t3',
            topicName: 'Magnetic Properties of Materials',
            ncertSection: '5.3',
            highYield: true,
            subtopics: [
              'Definitions: Magnetization (M), Magnetic Intensity (H), Permeability (μ), Relative permeability (μ_r = 1 + χ_m), Susceptibility (χ_m = M/H)',
              'Diamagnetic: χ_m small and negative (-1 ≤ χ_m < 0), 0 ≤ μ_r < 1; repelled weakly; temperature independent (Meissner effect)',
              'Paramagnetic: χ_m small and positive, μ_r > 1; weakly attracted; Curie’s Law (χ ∝ 1/T)',
              'Ferromagnetic: χ_m ≫ 1, μ_r ≫ 1; strongly attracted; domain theory; transition to paramagnetism above Curie temperature T_c'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch06',
        grade: '12',
        discipline: 'EMI & AC',
        unit: 'Magnetic Effects, Magnetism & EMI/AC (Unit III & IV - 17M)',
        chapterNumber: 6,
        chapterName: 'Electromagnetic Induction (EMI)',
        boardExamFocus: {
          highYield: 'Motional EMF derivations (Blv and rotating rod 1/2 Bωl²); Mutual inductance of two coaxial solenoids.',
          standardTrap: 'Determining incorrect direction of induced current by failing to apply Lenz\'s Law to the change in magnetic flux.',
          questionType: '3-mark mutual inductance derivation, 2-mark Lenz\'s law loop direction reasoning.'
        },
        topics: [
          {
            id: 'phy_12_ch06_t1',
            topicName: 'Magnetic Flux & Induction Laws',
            ncertSection: '6.1',
            highYield: true,
            subtopics: [
              'Magnetic Flux (Φ_B): Φ_B = B · A = BA cos θ',
              'Faraday\'s Laws of Induction: ℰ = -dΦ_B/dt',
              'Lenz\'s Law: Direction of induced EMF opposes the change in flux causing it; verification of Lenz’s Law as Conservation of Energy'
            ]
          },
          {
            id: 'phy_12_ch06_t2',
            topicName: 'Motional Electromotive Force',
            ncertSection: '6.2',
            highYield: true,
            subtopics: [
              'Derivation: Straight conductor of length l translating at velocity v ⊥ B: ℰ = Blv',
              'Induced current: I = Blv/R; Mechanical power expended = Electrical power dissipated: P = B²l²v²/R',
              'Rotating Rod Derivation: Conductor of length l rotating with angular velocity ω about one end: ℰ = 1/2 B ω l²'
            ]
          },
          {
            id: 'phy_12_ch06_t3',
            topicName: 'Inductance',
            ncertSection: '6.3',
            highYield: true,
            subtopics: [
              'Self-Induction: Φ = LI ⇒ ℰ = -L dI/dt',
              'Derivation: Self-inductance of a long solenoid: L = μ₀ N² A / l = μ₀ n² A l; Energy stored: U = 1/2 L I²',
              'Mutual Induction: Φ₂ = MI₁ ⇒ ℰ₂ = -M dI₁/dt',
              'Derivation: Mutual inductance of two co-axial long solenoids: M = μ₀ N₁ N₂ A / l = μ₀ n₁ n₂ π r₁² l'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch07',
        grade: '12',
        discipline: 'EMI & AC',
        unit: 'Magnetic Effects, Magnetism & EMI/AC (Unit III & IV - 17M)',
        chapterNumber: 7,
        chapterName: 'Alternating Current (AC)',
        boardExamFocus: {
          highYield: 'Series LCR impedance and phase angle using phasor diagram; AC Generator working and EMF derivation; Transformer equations and energy loss descriptions.',
          standardTrap: 'Calculating frequency in LCR using angular frequency ω instead of converting to f in Hertz (f = ω/2π).',
          questionType: '5-mark LCR phasor derivation or AC Generator; 3-mark transformer calculations and losses.'
        },
        topics: [
          {
            id: 'phy_12_ch07_t1',
            topicName: 'Pure AC Circuits & Phasors',
            ncertSection: '7.1',
            highYield: true,
            subtopics: [
              'AC voltage: V = V₀ sin ωt; Root-Mean-Square (RMS) Values: V_rms = V₀/√2; I_rms = I₀/√2',
              'Pure Resistor: Current and voltage are in phase (ϕ = 0)',
              'Pure Inductor: Voltage leads current by π/2; Inductive reactance X_L = ωL = 2πfL',
              'Pure Capacitor: Current leads voltage by π/2; Capacitive reactance X_C = 1/(ωC) = 1/(2πfC)'
            ]
          },
          {
            id: 'phy_12_ch07_t2',
            topicName: 'Series LCR Circuit',
            ncertSection: '7.2',
            highYield: true,
            subtopics: [
              'Phasor Diagram Solution: Impedance Z = √[R² + (X_L - X_C)²]; Phase angle tan ϕ = (X_L - X_C)/R',
              'Resonance in Series LCR: Condition X_L = X_C ⇒ Z_min = R, current maximum I₀ = V₀/R',
              'Resonant frequency: ω₀ = 1/√(LC) ⇒ f₀ = 1/(2π√(LC))',
              'Resonance sharpness and Quality factor (Q): Q = ω₀L/R = (1/R)√(L/C)'
            ]
          },
          {
            id: 'phy_12_ch07_t3',
            topicName: 'Power in AC Circuits & Devices',
            ncertSection: '7.3',
            highYield: true,
            subtopics: [
              'Power Dissipation: P_avg = V_rms I_rms cos ϕ; Power Factor cos ϕ = R/Z',
              'Wattless Current: Current in purely reactive circuit (ϕ = π/2 ⇒ P_avg = 0)',
              'AC Generator: Principle, labelled diagram, derivation of induced EMF: ℰ = NBAω sin ωt = ℰ₀ sin ωt',
              'Transformer: Principle (Mutual induction); Transformation ratio: V_s/V_p = N_s/N_p = I_p/I_s',
              'Step-up vs. Step-down transformer parameters',
              'Energy loss mechanisms: Copper losses (I²R), Iron/Eddy current losses (laminated core), Hysteresis loss, Flux leakage'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch08',
        grade: '12',
        discipline: 'EM WAVES',
        unit: 'Electromagnetic Waves & Optics (Unit V & VI - 18M)',
        chapterNumber: 8,
        chapterName: 'Electromagnetic Waves',
        boardExamFocus: {
          highYield: 'Electromagnetic spectrum application questions (identify EM wave type from wavelength or use case); Displacement current numerical during capacitor charging.',
          standardTrap: 'Confusing frequency order with wavelength order across the spectrum.',
          questionType: '2-mark spectrum identification, 2/3-mark displacement current calculation.'
        },
        topics: [
          {
            id: 'phy_12_ch08_t1',
            topicName: 'Displacement Current & Maxwell\'s Equations',
            ncertSection: '8.1',
            highYield: true,
            subtopics: [
              'Inconsistency in Ampere\'s Circuital Law across capacitor plates during charging',
              'Displacement Current: I_d = ε₀ (dΦ_E/dt)',
              'Modified Ampere-Maxwell Law: ∮ B · dl = μ₀(I_c + I_d) = μ₀ I_c + μ₀ ε₀ (dΦ_E/dt)'
            ]
          },
          {
            id: 'phy_12_ch08_t2',
            topicName: 'EM Wave Characteristics',
            ncertSection: '8.2',
            highYield: true,
            subtopics: [
              'Source: Accelerated charges produce electromagnetic waves',
              'Transverse nature: E, B, and propagation direction k are mutually perpendicular (c = E₀/B₀)',
              'Speed: c = 1/√(μ₀ε₀) ≈ 3 × 10⁸ m/s; in medium v = 1/√(με)',
              'Energy density: Shared equally between electric and magnetic fields (u = 1/2 ε₀E² + B²/(2μ₀) = ε₀E_rms²)'
            ]
          },
          {
            id: 'phy_12_ch08_t3',
            topicName: 'The Electromagnetic Spectrum',
            ncertSection: '8.3',
            highYield: true,
            subtopics: [
              'Order (increasing frequency / decreasing wavelength): Radio → Micro → Infrared → Visible → UV → X-rays → Gamma rays',
              'Production, detection, wavelength ranges, and dedicated applications for each band',
              'Microwaves in RADAR/ovens, Infrared in remote controls/physical therapy, UV in water purifiers/LASIK, X-rays in bone imaging'
            ]
          }
        ]
      },

      // --- PART II: CHAPTERS 9 TO 14 ---
      {
        id: 'phy_12_ch09',
        grade: '12',
        discipline: 'OPTICS',
        unit: 'Electromagnetic Waves & Optics (Unit V & VI - 18M)',
        chapterNumber: 9,
        chapterName: 'Ray Optics and Optical Instruments',
        boardExamFocus: {
          highYield: 'Lens Maker’s Formula; Single spherical surface refraction; Prism formula (n = sin((A+δ_m)/2)/sin(A/2)); Clean, labelled ray diagrams of Compound Microscope or Astronomical Telescope.',
          standardTrap: 'Incorrect sign convention for radii of curvature in Lens Maker\'s formula (R₁ > 0, R₂ < 0 for convex lens); forgetting image position at near point vs infinity.',
          questionType: 'Guaranteed 5-mark long answer derivation or 4-mark Case Study with labelled ray diagrams.'
        },
        topics: [
          {
            id: 'phy_12_ch09_t1',
            topicName: 'Refraction & Total Internal Reflection (TIR)',
            ncertSection: '9.1',
            highYield: true,
            subtopics: [
              'Snell\'s Law: n₁ sin i = n₂ sin r',
              'Total Internal Reflection conditions: Ray travels from denser to rarer medium; angle of incidence exceeds critical angle (i > i_c)',
              'Relation: sin i_c = 1/n',
              'Applications: Optical fibers (core n₁ > cladding n₂), mirage, totally reflecting prisms (45°-90°-45°)'
            ]
          },
          {
            id: 'phy_12_ch09_t2',
            topicName: 'Refraction at Spherical Surfaces and Lenses',
            ncertSection: '9.2',
            highYield: true,
            subtopics: [
              'Derivation: Refraction at a single spherical surface: n₂/v - n₁/u = (n₂ - n₁)/R',
              'Derivation: Lens Maker\'s Formula: 1/f = (n₂/n₁ - 1)(1/R₁ - 1/R₂)',
              'Thin lens formula: 1/f = 1/v - 1/u',
              'Derivation: Combination of two thin lenses in contact: 1/F = 1/f₁ + 1/f₂; Net Power P = P₁ + P₂'
            ]
          },
          {
            id: 'phy_12_ch09_t3',
            topicName: 'Prisms',
            ncertSection: '9.3',
            highYield: true,
            subtopics: [
              'Derivation: Refraction through a triangular glass prism: A = r₁ + r₂, δ = i + e - A',
              'Minimum deviation condition: i = e, r₁ = r₂ = A/2, δ = δ_m',
              'Derivation: Refractive index of prism material: n = sin[(A + δ_m)/2] / sin(A/2)'
            ]
          },
          {
            id: 'phy_12_ch09_t4',
            topicName: 'Optical Instruments (Rays, Magnification & Adjustments)',
            ncertSection: '9.4',
            highYield: true,
            subtopics: [
              'Compound Microscope: Ray diagram for image at near point (D) and at infinity (relaxed eye)',
              'Magnification at D: m = -(v₀/u₀)(1 + D/f_e) ≈ -(L/f₀)(1 + D/f_e); at infinity: m = -(L/f₀)(D/f_e)',
              'Astronomical Telescope (Refracting): Ray diagrams for normal adjustment and near point',
              'Magnification: m = -f₀/f_e (at infinity, tube length L = f₀ + f_e); at near point: m = -(f₀/f_e)(1 + f_e/D)',
              'Reflecting Telescopes (Cassegrain): Ray diagram; Advantages over refracting telescopes (free from chromatic & spherical aberration, lightweight mirrors)'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch10',
        grade: '12',
        discipline: 'OPTICS',
        unit: 'Electromagnetic Waves & Optics (Unit V & VI - 18M)',
        chapterNumber: 10,
        chapterName: 'Wave Optics',
        boardExamFocus: {
          highYield: 'Proof of Snell’s Law and Law of Reflection using Huygens’ wave theory; Fringe width calculations in YDSE.',
          standardTrap: 'Confusing conditions for minima in single slit diffraction (a sin θ = nλ) with minima in double slit interference ((2n-1)λ/2).',
          questionType: '3-mark Huygens derivation of reflection/refraction, 3-mark YDSE numerical on fringe shifts.'
        },
        topics: [
          {
            id: 'phy_12_ch10_t1',
            topicName: 'Huygens’ Principle',
            ncertSection: '10.1',
            highYield: true,
            subtopics: [
              'Definitions: Wavefront (locus of points having the same phase); spherical, cylindrical, and plane wavefronts',
              'Huygens’ Postulates: Secondary wavelets spreading at wave velocity; envelope forms new wavefront',
              'Derivation: Proof of the Law of Reflection (i = r) using Huygens\' construction',
              'Derivation: Proof of the Law of Refraction (Snell\'s Law: sin i / sin r = v₁/v₂ = n₂/n₁) using Huygens\' construction'
            ]
          },
          {
            id: 'phy_12_ch10_t2',
            topicName: 'Interference of Light & Young\'s Double Slit Experiment (YDSE)',
            ncertSection: '10.2',
            highYield: true,
            subtopics: [
              'Coherent Sources: Sources having constant or zero phase difference; why two independent sources cannot be coherent',
              'Conditions for Interference: Constructive (Δx = nλ, Δϕ = 2nπ); Destructive (Δx = (2n-1)λ/2, Δϕ = (2n-1)π)',
              'Resultant intensity: I = 4I₀ cos²(ϕ/2) (for identical sources)',
              'Fringe Width expression: β = λD/d; Equal spacing of dark and bright fringes',
              'Effect of changing variables: dipping apparatus in water (β\' = β/μ), changing slit separation d, white light central white fringe'
            ]
          },
          {
            id: 'phy_12_ch10_t3',
            topicName: 'Diffraction of Light (Single Slit)',
            ncertSection: '10.3',
            highYield: true,
            subtopics: [
              'Qualitative explanation of diffraction as bending around obstacles',
              'Single Slit Diffraction Pattern: Minima condition a sin θ = nλ (n = ±1, ±2, ...); Secondary maxima a sin θ = (2n+1)λ/2',
              'Angular width of central maximum: 2θ = 2λ/a; Linear width: 2β₀ = 2λD/a',
              'Differences between Interference (YDSE) and Single Slit Diffraction (fringe width uniformity, intensity distribution)'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch11',
        grade: '12',
        discipline: 'MODERN PHYSICS',
        unit: 'Dual Nature, Atoms and Nuclei (Unit VII & VIII - 12M)',
        chapterNumber: 11,
        chapterName: 'Dual Nature of Radiation and Matter',
        boardExamFocus: {
          highYield: 'Stopping potential (V₀) vs. Frequency (ν) graphs (identifying work function and Planck\'s constant from slope/intercepts); de Broglie wavelength ratio numericals.',
          standardTrap: 'Forgetting to convert electron-volts (eV) to Joules when calculating threshold wavelength or work function in SI units.',
          questionType: '4-mark Case Study with graphs, 3-mark Einstein photoelectric equation numerical.'
        },
        topics: [
          {
            id: 'phy_12_ch11_t1',
            topicName: 'Photoelectric Effect',
            ncertSection: '11.1',
            highYield: true,
            subtopics: [
              'Key Terms: Work function (Φ₀), threshold frequency (ν₀), threshold wavelength (λ₀), stopping potential (V₀)',
              'Experimental Observations (Lenard & Millikan): Effect of intensity on photoelectric current (I ∝ Intensity)',
              'Effect of potential: saturation current vs stopping potential V₀',
              'Effect of frequency on stopping potential: V₀ increases linearly with ν',
              'Instantaneous emission process (no time lag, Δt < 10⁻⁹ s)',
              'Why Classical Wave Theory failed to explain threshold frequency, instantaneous emission, and kinetic energy independence'
            ]
          },
          {
            id: 'phy_12_ch11_t2',
            topicName: 'Einstein’s Photoelectric Equation',
            ncertSection: '11.2',
            highYield: true,
            subtopics: [
              'Formulation: K_max = hν - Φ₀ ⇒ eV₀ = hν - hν₀',
              'Explanation of experimental laws using Einstein\'s photon concept',
              'Graphical Analysis: Stopping potential (V₀) vs Frequency (ν): Slope h/e (universal constant), intercept on frequency axis ν₀, intercept on potential axis -Φ₀/e',
              'K_max vs ν graph: Slope h'
            ]
          },
          {
            id: 'phy_12_ch11_t3',
            topicName: 'de Broglie Hypothesis & Matter Waves',
            ncertSection: '11.3',
            highYield: true,
            subtopics: [
              'de Broglie wavelength: λ = h/p = h/(mv)',
              'In terms of Kinetic Energy (K): λ = h / √(2mK)',
              'In terms of accelerating potential (V) for an electron: λ = h / √(2mqV) = 1.227 / √V nm',
              'Comparison of de Broglie wavelengths of different particles (electron, proton, alpha particle) accelerated through same potential V'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch12',
        grade: '12',
        discipline: 'MODERN PHYSICS',
        unit: 'Dual Nature, Atoms and Nuclei (Unit VII & VIII - 12M)',
        chapterNumber: 12,
        chapterName: 'Atoms',
        boardExamFocus: {
          highYield: 'Derivation of orbit radius r_n and total energy E_n using Bohr\'s postulates; Energy level diagram of Hydrogen with spectral transitions (Lyman, Balmer, Paschen).',
          standardTrap: 'Calculating energy/wavelength ratios without converting eV to Joules when using SI units, or mixing up K, U, and total E negative signs (E = -K = U/2).',
          questionType: '3-mark Bohr derivation, 2/3-mark spectral series wavelength numerical.'
        },
        topics: [
          {
            id: 'phy_12_ch12_t1',
            topicName: 'Alpha-Particle Scattering Experiment (Rutherford)',
            ncertSection: '12.1',
            highYield: false,
            subtopics: [
              'Setup: Geiger-Marsden experiment, thin gold foil, ZnS detector screen',
              'Observations and deductions: Most α-particles pass undeflected; roughly 1 in 8000 rebounds back (180°)',
              'Distance of Closest Approach (r₀): 1/2 m v² = (1/4πε₀)[(2e)(Ze)/r₀] ⇒ r₀ = 2Ze² / (4πε₀ K)',
              'Impact Parameter (b): Definition and relation to scattering angle θ (b = (1/4πε₀) [Ze² cot(θ/2) / K])'
            ]
          },
          {
            id: 'phy_12_ch12_t2',
            topicName: 'Bohr Model of the Hydrogen Atom',
            ncertSection: '12.2',
            highYield: true,
            subtopics: [
              'Bohr\'s Postulates: 1. Electrostatic centripetal force; 2. Quantization of angular momentum mvr = nh/(2π); 3. Energy emission upon transition hν = E₂ - E₁',
              'Core Derivations: Orbit radius r_n = (n²h²ε₀)/(πme²) ∝ n² (r₁ = 0.529 Å for H)',
              'Orbital speed: v_n = e²/(2ε₀nh) ∝ 1/n',
              'Kinetic Energy: K = e²/(8πε₀r); Potential Energy: U = -e²/(4πε₀r); Total Energy: E = -e²/(8πε₀r) = -K = U/2',
              'Quantized Energy Expression: E_n = -13.6 / n² eV'
            ]
          },
          {
            id: 'phy_12_ch12_t3',
            topicName: 'Hydrogen Spectral Series',
            ncertSection: '12.3',
            highYield: true,
            subtopics: [
              'Rydberg Formula: 1/λ = R_H (1/n₁² - 1/n₂²) where R_H ≈ 1.097 × 10⁷ m⁻¹',
              'Series Categorization: Lyman (n₁=1, UV), Balmer (n₁=2, Visible), Paschen (n₁=3, IR), Brackett (n₁=4, IR), Pfund (n₁=5, Far IR)',
              'Calculating shortest wavelength (series limit, n₂=∞) vs longest wavelength (immediate next level n₂=n₁+1)'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch13',
        grade: '12',
        discipline: 'MODERN PHYSICS',
        unit: 'Dual Nature, Atoms and Nuclei (Unit VII & VIII - 12M)',
        chapterNumber: 13,
        chapterName: 'Nuclei',
        boardExamFocus: {
          highYield: 'Proof that nuclear density is independent of mass number A; Interpreting the Binding Energy per nucleon curve to explain energy release in fission and fusion.',
          standardTrap: 'Forgetting to subtract electron masses or confusing atomic mass with nuclear mass in mass defect calculations.',
          questionType: '3-mark binding energy curve explanation, 2-mark density independence proof.'
        },
        topics: [
          {
            id: 'phy_12_ch13_t1',
            topicName: 'Nuclear Composition and Size',
            ncertSection: '13.1',
            highYield: true,
            subtopics: [
              'Nuclear composition: Protons, neutrons, atomic number (Z), mass number (A), isotopes, isobars, isotones',
              'Nuclear Radius: R = R₀ A^(1/3) (R₀ ≈ 1.2 fm)',
              'Nuclear Density: Independence of mass number A (nuclear density is roughly constant across all nuclei, ρ ≈ 2.3 × 10¹⁷ kg/m³)'
            ]
          },
          {
            id: 'phy_12_ch13_t2',
            topicName: 'Mass Defect and Nuclear Binding Energy',
            ncertSection: '13.2',
            highYield: true,
            subtopics: [
              'Einstein\'s mass-energy relation: E = mc² (1 amu ≈ 931.5 MeV)',
              'Mass defect: Δm = [Z m_p + (A - Z)m_n] - M_nucleus',
              'Binding Energy: E_b = Δm · c²; Binding Energy per nucleon: E_bn = E_b / A',
              'The Binding Energy per Nucleon Curve: Peak around Iron (⁵⁶Fe, ~8.75 MeV/nucleon)',
              'Lower E_bn for lighter nuclei (A < 30) explaining Nuclear Fusion; decrease for heavier nuclei (A > 170) explaining Nuclear Fission'
            ]
          }
        ]
      },
      {
        id: 'phy_12_ch14',
        grade: '12',
        discipline: 'ELECTRONICS',
        unit: 'Electronic Devices (Semiconductors) (Unit IX - 7M)',
        chapterNumber: 14,
        chapterName: 'Semiconductor Electronics: Materials, Devices, and Simple Circuits',
        boardExamFocus: {
          highYield: 'Working and circuit diagram of Full-Wave Rectifier with input/output waveforms (5-mark or 3-mark anchor); Forward and Reverse bias V-I characteristic curves.',
          standardTrap: 'Drawing reverse bias V-I characteristics with milliampere (mA) scale instead of microampere (μA) scale.',
          questionType: '5-mark Full-Wave Rectifier with filter, 3-mark V-I characteristics and junction formation explanation.'
        },
        topics: [
          {
            id: 'phy_12_ch14_t1',
            topicName: 'Energy Bands in Solids & Semiconductor Physics',
            ncertSection: '14.1',
            highYield: true,
            subtopics: [
              'Energy Bands: Valence band, conduction band, forbidden energy gap (E_g)',
              'Conductors (E_g = 0 or overlapping bands), Insulators (E_g > 3 eV), Semiconductors (E_g < 3 eV; Si 1.1 eV, Ge 0.7 eV)',
              'Intrinsic Semiconductors: Pure Silicon/Germanium; n_e = n_h = n_i; thermal generation of electron-hole pairs',
              'Extrinsic Semiconductors (Doping): n-type (pentavalent P, As, Sb; majority electrons n_e ≫ n_h); p-type (trivalent B, Al, In; majority holes n_h ≫ n_e)',
              'Mass-action law: n_e · n_h = n_i²'
            ]
          },
          {
            id: 'phy_12_ch14_t2',
            topicName: 'The p-n Junction Diode',
            ncertSection: '14.2',
            highYield: true,
            subtopics: [
              'Junction Formation Mechanics: Diffusion current creating depletion region and space-charge layer',
              'Barrier potential (V_B) and drift current (opposing diffusion); Equilibrium: I_diff = I_drift',
              'Forward Bias: p to +, n to -; depletion layer narrows, low resistance, current in milliamperes (mA)',
              'Reverse Bias: p to -, n to +; depletion layer widens, high resistance, tiny reverse saturation current in microamperes (μA)',
              'V-I Characteristics: Complete labelled graph showing knee voltage, linear forward zone, and reverse breakdown'
            ]
          },
          {
            id: 'phy_12_ch14_t3',
            topicName: 'Diode as a Rectifier',
            ncertSection: '14.3',
            highYield: true,
            subtopics: [
              'Half-Wave Rectifier: Circuit diagram, operation during positive and negative AC half-cycles, waveforms (Efficiency ≈ 40.6%)',
              'Full-Wave Rectifier (Center-Tapped): Circuit diagram with two diodes and center-tapped transformer',
              'Working mechanism: D₁ conducts during positive half-cycle, D₂ conducts during negative half-cycle; unidirectional load current',
              'Input and output voltage waveforms (Efficiency ≈ 81.2%)',
              'Role of capacitor filter: Smoothing rectified DC ripples by charging during peak voltage and discharging through R_L'
            ]
          }
        ]
      },
      {
        id: 'phy_11_ch01',
        grade: '11',
        discipline: 'GENERAL_PHYSICS',
        unit: 'Physical World and Measurement',
        chapterNumber: 1,
        chapterName: 'Units and Measurements',
        boardExamFocus: { highYield: 'Dimensional analysis, principle of homogeneity, and error propagation', questionType: '2/3-mark application questions' },
        topics: [
          { id: 'phy_11_ch01_t1', topicName: 'SI Units & Dimensional Analysis', ncertSection: '1.1', highYield: true, subtopics: ['Fundamental and derived units', 'Dimensional formulas of physical quantities', 'Principle of homogeneity', 'Conversion of units across systems'] },
          { id: 'phy_11_ch01_t2', topicName: 'Errors in Measurement', ncertSection: '1.2', highYield: true, subtopics: ['Absolute, relative and percentage errors', 'Combination of errors in addition, multiplication and powers'] }
        ]
      },
      {
        id: 'phy_11_ch02',
        grade: '11',
        discipline: 'KINEMATICS',
        unit: 'Kinematics',
        chapterNumber: 2,
        chapterName: 'Motion in a Straight Line',
        boardExamFocus: { highYield: 'Equations of motion using calculus, relative velocity, and v-t graphs', questionType: '3-mark derivations and numericals' },
        topics: [
          { id: 'phy_11_ch02_t1', topicName: 'Kinematic Equations of Uniformly Accelerated Motion', ncertSection: '2.1', highYield: true, subtopics: ['Calculus derivation of v = u + at, s = ut + 1/2 at², v² = u² + 2as', 'Motion under gravity (free fall)', 'Stopping distance and reaction time'] }
        ]
      },
      {
        id: 'phy_11_ch03',
        grade: '11',
        discipline: 'KINEMATICS',
        unit: 'Kinematics',
        chapterNumber: 3,
        chapterName: 'Motion in a Plane',
        boardExamFocus: { highYield: 'Projectile motion derivations and centripetal acceleration', questionType: '3/5-mark derivations' },
        topics: [
          { id: 'phy_11_ch03_t1', topicName: 'Projectile Motion', ncertSection: '3.1', highYield: true, subtopics: ['Parabolic trajectory equation', 'Time of flight: T = 2u sin θ / g', 'Maximum height: H = u² sin² θ / 2g', 'Horizontal range: R = u² sin 2θ / g'] },
          { id: 'phy_11_ch03_t2', topicName: 'Uniform Circular Motion & Centripetal Acceleration', ncertSection: '3.2', highYield: true, subtopics: ['Centripetal acceleration derivation: a_c = v²/r = ω²r', 'Angular velocity and frequency relations'] }
        ]
      },
      {
        id: 'phy_11_ch04',
        grade: '11',
        discipline: 'MECHANICS',
        unit: 'Laws of Motion',
        chapterNumber: 4,
        chapterName: 'Laws of Motion',
        boardExamFocus: { highYield: 'Newton\'s second law derivation, impulse, friction, banking of roads', questionType: '3/5-mark derivations and numericals' },
        topics: [
          { id: 'phy_11_ch04_t1', topicName: 'Newton\'s Second Law & Momentum', ncertSection: '4.1', highYield: true, subtopics: ['F = dp/dt = ma derivation', 'Impulse J = F Δt = Δp', 'Law of conservation of linear momentum with recoil of gun'] },
          { id: 'phy_11_ch04_t2', topicName: 'Friction & Banking of Circular Roads', ncertSection: '4.2', highYield: true, subtopics: ['Static and kinetic friction', 'Angle of repose', 'Maximum safe speed on banked road: v_max = sqrt(rg(μ + tan θ)/(1 - μ tan θ))'] }
        ]
      },
      {
        id: 'phy_11_ch05',
        grade: '11',
        discipline: 'MECHANICS',
        unit: 'Work, Energy and Power',
        chapterNumber: 5,
        chapterName: 'Work, Energy and Power',
        boardExamFocus: { highYield: 'Work-Energy Theorem, spring potential energy, 1D elastic collisions', questionType: '3/5-mark derivations' },
        topics: [
          { id: 'phy_11_ch05_t1', topicName: 'Work-Energy Theorem & Variable Forces', ncertSection: '5.1', highYield: true, subtopics: ['Work-Energy Theorem for variable force: W = ∫F dx = ΔK', 'Potential energy of a spring: U = 1/2 k x²', 'Conservative forces and potential energy relation F = -dU/dx'] },
          { id: 'phy_11_ch05_t2', topicName: 'Collisions in One Dimension', ncertSection: '5.2', highYield: true, subtopics: ['Elastic collision velocities in 1D', 'Inelastic collisions and loss of kinetic energy'] }
        ]
      },
      {
        id: 'phy_11_ch06',
        grade: '11',
        discipline: 'ROTATIONAL_MOTION',
        unit: 'System of Particles and Rotational Motion',
        chapterNumber: 6,
        chapterName: 'System of Particles and Rotational Motion',
        boardExamFocus: { highYield: 'Center of mass, torque, angular momentum, moment of inertia, rolling acceleration', questionType: '3/5-mark derivations and JEE Main numericals' },
        topics: [
          { id: 'phy_11_ch06_t1', topicName: 'Center of Mass & Torque', ncertSection: '6.1', highYield: true, subtopics: ['Center of mass of two-particle system and rigid bodies', 'Torque τ = r × F and angular momentum L = r × p', 'Conservation of angular momentum'] },
          { id: 'phy_11_ch06_t2', topicName: 'Moment of Inertia & Rolling Motion', ncertSection: '6.2', highYield: true, subtopics: ['Moment of inertia of ring, disc, cylinder and sphere', 'Radius of gyration', 'Acceleration of rolling without slipping: a = g sin θ / (1 + I/MR²)'] }
        ]
      },
      {
        id: 'phy_11_ch07',
        grade: '11',
        discipline: 'GRAVITATION',
        unit: 'Gravitation',
        chapterNumber: 7,
        chapterName: 'Gravitation',
        boardExamFocus: { highYield: 'Variation of g with altitude and depth, escape speed, orbital velocity', questionType: '3-mark derivations' },
        topics: [
          { id: 'phy_11_ch07_t1', topicName: 'Variation in g with Altitude and Depth', ncertSection: '7.1', highYield: true, subtopics: ['Variation with altitude: g_h = g(1 - 2h/R)', 'Variation with depth: g_d = g(1 - d/R)', 'Gravitational potential and potential energy'] },
          { id: 'phy_11_ch07_t2', topicName: 'Escape Velocity & Satellite Motion', ncertSection: '7.2', highYield: true, subtopics: ['Escape velocity derivation: v_e = sqrt(2gR)', 'Orbital velocity of satellite: v_o = sqrt(GM/r)', 'Kepler\'s three laws of planetary motion'] }
        ]
      },
      {
        id: 'phy_11_ch08',
        grade: '11',
        discipline: 'PROPERTIES_OF_MATTER',
        unit: 'Properties of Bulk Matter',
        chapterNumber: 8,
        chapterName: 'Mechanical Properties of Solids',
        boardExamFocus: { highYield: 'Stress-strain curve, Hooke\'s law, Young\'s modulus', questionType: '2/3-mark questions' },
        topics: [
          { id: 'phy_11_ch08_t1', topicName: 'Elastic Moduli & Stress-Strain Curve', ncertSection: '8.1', highYield: true, subtopics: ['Hooke\'s law', 'Young\'s modulus Y = (F/A)/(ΔL/L)', 'Elastic potential energy density u = 1/2 × stress × strain'] }
        ]
      },
      {
        id: 'phy_11_ch09',
        grade: '11',
        discipline: 'PROPERTIES_OF_MATTER',
        unit: 'Properties of Bulk Matter',
        chapterNumber: 9,
        chapterName: 'Mechanical Properties of Fluids',
        boardExamFocus: { highYield: 'Bernoulli\'s principle, Pascal\'s law, Stoke\'s law, surface tension', questionType: '3/5-mark derivations' },
        topics: [
          { id: 'phy_11_ch09_t1', topicName: 'Bernoulli\'s Theorem & Applications', ncertSection: '9.1', highYield: true, subtopics: ['Equation of continuity: A₁v₁ = A₂v₂', 'Bernoulli\'s equation derivation: P + 1/2 ρv² + ρgh = constant', 'Torricelli\'s law and Venturimeter'] },
          { id: 'phy_11_ch09_t2', topicName: 'Viscosity, Terminal Velocity & Surface Tension', ncertSection: '9.2', highYield: true, subtopics: ['Stoke\'s law: F = 6πηrv', 'Terminal velocity: v_t = 2r²(ρ - σ)g / 9η', 'Surface energy and excess pressure inside liquid drop (2T/R) and bubble (4T/R)'] }
        ]
      },
      {
        id: 'phy_11_ch10',
        grade: '11',
        discipline: 'THERMAL_PHYSICS',
        unit: 'Thermodynamics & Heat',
        chapterNumber: 10,
        chapterName: 'Thermal Properties of Matter',
        boardExamFocus: { highYield: 'Specific heat, latent heat, Newton\'s law of cooling, thermal conduction', questionType: '2/3-mark questions' },
        topics: [
          { id: 'phy_11_ch10_t1', topicName: 'Thermal Expansion & Calorimetry', ncertSection: '10.1', highYield: true, subtopics: ['Thermal expansion coefficients', 'Specific heat capacity and latent heat', 'Principle of calorimetry'] }
        ]
      },
      {
        id: 'phy_11_ch11',
        grade: '11',
        discipline: 'THERMAL_PHYSICS',
        unit: 'Thermodynamics',
        chapterNumber: 11,
        chapterName: 'Thermodynamics',
        boardExamFocus: { highYield: 'First law of thermodynamics, isothermal and adiabatic work done, Mayer\'s relation', questionType: '3/5-mark derivations' },
        topics: [
          { id: 'phy_11_ch11_t1', topicName: 'First Law & Thermodynamic Processes', ncertSection: '11.1', highYield: true, subtopics: ['First law: ΔQ = ΔU + ΔW', 'Isothermal work done: W = nRT ln(V₂/V₁)', 'Adiabatic work done: W = (P₁V₁ - P₂V₂)/(γ - 1)', 'Mayer\'s relation: C_p - C_v = R'] }
        ]
      },
      {
        id: 'phy_11_ch12',
        grade: '11',
        discipline: 'THERMAL_PHYSICS',
        unit: 'Kinetic Theory',
        chapterNumber: 12,
        chapterName: 'Kinetic Theory',
        boardExamFocus: { highYield: 'Pressure of ideal gas, degrees of freedom, equipartition of energy', questionType: '3-mark derivations' },
        topics: [
          { id: 'phy_11_ch12_t1', topicName: 'Pressure of an Ideal Gas', ncertSection: '12.1', highYield: true, subtopics: ['Pressure derivation P = 1/3 ρ v_rms²', 'Kinetic interpretation of temperature: E = 3/2 k_B T', 'Degrees of freedom and molar specific heats'] }
        ]
      },
      {
        id: 'phy_11_ch13',
        grade: '11',
        discipline: 'OSCILLATIONS_AND_WAVES',
        unit: 'Oscillations and Waves',
        chapterNumber: 13,
        chapterName: 'Oscillations',
        boardExamFocus: { highYield: 'Simple Harmonic Motion (SHM), simple pendulum time period, energy conservation', questionType: '3/5-mark derivations' },
        topics: [
          { id: 'phy_11_ch13_t1', topicName: 'Simple Harmonic Motion & Time Period', ncertSection: '13.1', highYield: true, subtopics: ['Differential equation of SHM: d²x/dt² + ω²x = 0', 'Displacement, velocity and acceleration relations', 'Total energy in SHM: E = 1/2 m ω² A²', 'Time period of simple pendulum: T = 2π sqrt(L/g)'] }
        ]
      },
      {
        id: 'phy_11_ch14',
        grade: '11',
        discipline: 'OSCILLATIONS_AND_WAVES',
        unit: 'Oscillations and Waves',
        chapterNumber: 14,
        chapterName: 'Waves',
        boardExamFocus: { highYield: 'Speed of transverse and sound waves, organ pipes standing waves, beats', questionType: '3/5-mark derivations' },
        topics: [
          { id: 'phy_11_ch14_t1', topicName: 'Standing Waves in Organ Pipes & Beats', ncertSection: '14.1', highYield: true, subtopics: ['Speed of longitudinal wave in gas (Newton-Laplace formula)', 'Modes of vibration in open organ pipe: f_n = nv / 2L', 'Modes of vibration in closed organ pipe: f_n = (2n-1)v / 4L', 'Beats frequency: f_beat = |f₁ - f₂|'] }
        ]
      }
    ]
  },

  // ==========================================================================
  // 3. SENIOR CHEMISTRY (Class 11 & Class 12) - Physical, Inorganic, Organic
  // ==========================================================================
  'CHEMISTRY': {
    subjectName: 'Class 12 Chemistry',
    stream: 'COMMON_SENIOR',
    grades: ['12'],
    targetExams: ['CBSE_CLASS_12', 'HP_BOARD_CLASS_12', 'NEET_UG', 'JEE_MAIN'],
    units: [
      { unitNumber: 'I, II & III', unitName: 'Physical Chemistry (Solutions, Electrochemistry, Kinetics)', weightageMarks: 21, chapters: [1, 2, 3] },
      { unitNumber: 'IV & V', unitName: 'Inorganic Chemistry (d- & f-Block, Coordination Compounds)', weightageMarks: 14, chapters: [4, 5] },
      { unitNumber: 'VI to X', unitName: 'Organic Chemistry (Halides, Oxygen & Nitrogen Derivatives, Biomolecules)', weightageMarks: 35, chapters: [6, 7, 8, 9, 10] }
    ],
    boardHighYieldSummary: {
      examBoard: 'CBSE / HPBOSE Class 12 Chemistry (70 Marks Theory)',
      fiveMarkGuarantees: [
        {
          rank: 1,
          topic: 'Physical Chemistry Numericals & Nernst/Kinetics',
          detail: 'Direct 3-mark & 5-mark calculation sets on depression in freezing point with van \'t Hoff factor (ΔT_f = i K_f m), Nernst cell potential with Gibbs free energy (ΔG° = -nFE°_cell), or first-order integrated rate / Arrhenius activation energy (E_a).',
          chapter: 'Chapter 1: Solutions, Chapter 2: Electrochemistry, Chapter 3: Chemical Kinetics'
        },
        {
          rank: 2,
          topic: 'Organic Named Reactions & Synthetic Conversions',
          detail: 'Multi-step synthesis, mechanisms (SN1 vs SN2, acid-catalyzed dehydration of alcohols, nucleophilic addition of HCN), and named reactions (Aldol condensation, Cannizzaro, Reimer-Tiemann, Gabriel Phthalimide, Hofmann bromamide).',
          chapter: 'Chapter 6: Haloalkanes, Chapter 7: Alcohols, Chapter 8: Aldehydes, Chapter 9: Amines'
        },
        {
          rank: 3,
          topic: 'Coordination Compounds & Transition Metal Redox',
          detail: 'Valence Bond Theory (VBT) hybridization & magnetic moment, Crystal Field Theory (CFT) octahedral/tetrahedral splitting (Δ_o vs P), and complete balanced redox reactions of KMnO₄ / K₂Cr₂O₇ in acidic medium.',
          chapter: 'Chapter 4: d- and f-Block, Chapter 5: Coordination Compounds'
        }
      ],
      caseStudyFourMark: [
        {
          topic: 'Solutions: Colligative Properties & Henry\'s Law',
          detail: 'Azeotropic mixtures, abnormal molar mass with association/dissociation degree, and industrial/biological applications of osmotic pressure and reverse osmosis.',
          chapter: 'Chapter 1: Solutions'
        },
        {
          topic: 'Electrochemistry: Commercial Batteries & Conductance',
          detail: 'Lead storage battery discharging/recharging reactions, H₂-O₂ fuel cell mechanism, and Kohlrausch\'s Law calculation of limiting molar conductivity (Λ°_m) and dissociation constant (K_a).',
          chapter: 'Chapter 2: Electrochemistry'
        },
        {
          topic: 'Biomolecules & Organic Functional Group Distinctions',
          detail: 'Glucose open-chain vs cyclic structure proofs, protein denaturation and structural levels, and chemical tests to distinguish pairs (Tollens\', Fehling\'s, Iodoform, Carbylamine, Hinsberg).',
          chapter: 'Chapter 8: Aldehydes & Chapter 10: Biomolecules'
        }
      ],
      threeMarkHeavyweights: [
        {
          topic: 'First-Order Kinetics Proofs & Arrhenius Two-Temperature',
          detail: 'Mathematical proof that t_99% = 2 × t_90% or t_99.9% = 10 × t_1/2, and determination of activation energy E_a from rate constants at two temperatures.',
          chapter: 'Chapter 3: Chemical Kinetics'
        },
        {
          topic: 'Lanthanoid Contraction & 3d Transition Trends',
          detail: 'Consequences of lanthanoid contraction (Zr ≈ Hf, basicity of hydroxides), and reasoning for variable oxidation states, catalytic behavior, and E°(M²⁺/M) electrode potentials.',
          chapter: 'Chapter 4: d- and f-Block Elements'
        },
        {
          topic: 'Distinguishing Chemical Tests for Functional Groups',
          detail: 'Chemical tests with observation and balanced equations to distinguish pairs: Propanal vs Propanone (Tollens\'), Phenol vs Benzoic acid (NaHCO₃), 1° vs 2° vs 3° amines (Hinsberg / Carbylamine).',
          chapter: 'Chapter 7: Alcohols/Phenols, Chapter 8: Aldehydes/Ketones, Chapter 9: Amines'
        },
        {
          topic: 'Glucose Structure Elucidation & Amino Acids Zwitterion',
          detail: 'Chemical reactions confirming 6-carbon straight chain (HI), carbonyl group (HCN/NH₂OH), aldehyde group (Br₂ water), and 5 -OH groups (Ac₂O); Zwitterion amphoteric nature.',
          chapter: 'Chapter 10: Biomolecules'
        }
      ]
    },
    chapters: [
      // --- SECTION 1: PHYSICAL CHEMISTRY (21 MARKS) ---
      {
        id: 'chem_12_ch01',
        grade: '12',
        discipline: 'PHYSICAL_CHEMISTRY',
        unit: 'Physical Chemistry (Unit I, II & III - 21M)',
        chapterNumber: 1,
        chapterName: 'Solutions',
        boardExamFocus: {
          highYield: 'Numericals on ΔT_f or Π combined with the van \'t Hoff factor (i) to determine molar mass and degree of dissociation (α); Raoult\'s law positive/negative deviation examples.',
          standardTrap: 'Forgetting to include the van \'t Hoff factor i in colligative property formulas for electrolytes like NaCl, K₂SO₄, or BaCl₂.',
          questionType: '3-mark colligative numericals with van \'t Hoff factor; 2-mark Henry\'s law / azeotrope conceptual reasoning.'
        },
        topics: [
          {
            id: 'chem_12_ch01_t1',
            topicName: 'Concentration Terms & Solubility',
            ncertSection: '1.1',
            highYield: true,
            subtopics: [
              'Concentration Units: % w/w, % v/v, ppm, Mole fraction (x), Molarity (M), Molality (m)',
              'Temperature dependence: Molarity changes with temperature; Molality is temperature-independent',
              'Solubility of Gases in Liquids (Henry\'s Law): p = K_H · x',
              'Significance of Henry\'s constant (K_H): Higher K_H means lower solubility; increases with temperature',
              'Applications of Henry\'s Law: Soft drinks, scuba divers (He dilution preventing bends), high-altitude anoxia'
            ]
          },
          {
            id: 'chem_12_ch01_t2',
            topicName: 'Vapour Pressure & Raoult\'s Law',
            ncertSection: '1.2',
            highYield: true,
            subtopics: [
              'Raoult\'s Law for volatile solutes: p_A = p°_A x_A, p_B = p°_B x_B; P_total = p°_A + (p°_B - p°_A)x_B',
              'Vapour phase composition: y_A = p_A / P_total',
              'Ideal Solutions: Obey Raoult\'s law, Δ_mix H = 0, Δ_mix V = 0 (n-hexane + n-heptane, benzene + toluene)',
              'Positive Deviation: A-B interactions weaker, P_total > P_calc, Δ_mix H > 0, minimum boiling azeotropes (ethanol + acetone)',
              'Negative Deviation: A-B interactions stronger (new H-bonds), P_total < P_calc, Δ_mix H < 0, maximum boiling azeotropes (chloroform + acetone, HNO₃ + water)'
            ]
          },
          {
            id: 'chem_12_ch01_t3',
            topicName: 'Colligative Properties & Van \'t Hoff Factor',
            ncertSection: '1.3',
            highYield: true,
            subtopics: [
              'Relative Lowering of Vapour Pressure (RLVP): (p°_A - p_A)/p°_A = i · x_B ≈ i (w_B M_A / M_B w_A)',
              'Elevation in Boiling Point: ΔT_b = i · K_b · m (K_b = molal elevation constant / ebullioscopic constant)',
              'Depression in Freezing Point: ΔT_f = i · K_f · m (K_f = molal depression constant / cryoscopic constant)',
              'Osmotic Pressure (Π): Π = i · CRT = i (n_B/V)RT; Isotonic, Hypertonic, and Hypotonic solutions; Reverse Osmosis (RO)',
              'Why osmotic pressure is preferred for biomolecules/polymers (room temperature, uses molarity, measurable magnitudes)',
              'Van \'t Hoff factor (i) = Normal molar mass / Observed molar mass = Total moles after / Initial moles',
              'Degree of Dissociation: α = (i - 1)/(n - 1); Degree of Association: α = (1 - i)/(1 - 1/n)'
            ]
          }
        ]
      },
      {
        id: 'chem_12_ch02',
        grade: '12',
        discipline: 'PHYSICAL_CHEMISTRY',
        unit: 'Physical Chemistry (Unit I, II & III - 21M)',
        chapterNumber: 2,
        chapterName: 'Electrochemistry',
        boardExamFocus: {
          highYield: 'Nernst equation calculations involving log terms and calculation of Δ_r G° or K_c; Kohlrausch\'s law numerical to find Λ°_m and α; Lead storage battery reactions.',
          standardTrap: 'Forgetting the number of electrons n transferred in the cell reaction, or omitting the powers of stoichiometric coefficients in Q_c.',
          questionType: 'Guaranteed 3/5-mark Nernst equation numerical; 3-mark Kohlrausch calculation; 2-mark commercial battery equations.'
        },
        topics: [
          {
            id: 'chem_12_ch02_t1',
            topicName: 'Galvanic Cells & Nernst Equation',
            ncertSection: '2.1',
            highYield: true,
            subtopics: [
              'Electrochemical Daniell Cell: Zn|Zn²⁺||Cu²⁺|Cu; Anode (oxidation, -), Cathode (reduction, +)',
              'Standard Electrode Potential: E°_cell = E°_cathode - E°_anode (both as reduction potentials)',
              'Nernst Equation at 298 K: E_cell = E°_cell - (0.0591/n) log₁₀ Q_c',
              'Equilibrium Constant relation: log K_c = (n E°_cell) / 0.0591',
              'Standard Gibbs Free Energy Change: Δ_r G° = -n F E°_cell (F = 96500 C/mol); Spontaneity: E_cell > 0 ⇔ Δ_r G < 0'
            ]
          },
          {
            id: 'chem_12_ch02_t2',
            topicName: 'Conductance in Electrolytic Solutions',
            ncertSection: '2.2',
            highYield: true,
            subtopics: [
              'Conductivity (κ = G · l/A = G*/R, S cm⁻¹) and Cell constant (G* = l/A, cm⁻¹)',
              'Molar Conductivity: Λ_m = (κ × 1000) / M (S cm² mol⁻¹)',
              'Variation with dilution: κ decreases because ions per unit volume decrease; Λ_m increases on dilution',
              'Strong vs Weak electrolytes dilution curves: Debye-Hückel-Onsager equation (Λ_m = Λ°_m - A√c)',
              'Kohlrausch\'s Law of Independent Migration of Ions: Λ°_m = ν₊ λ°₊ + ν₋ λ°₋',
              'Applications: Calculating Λ°_m of weak electrolytes, degree of dissociation α = Λ_m / Λ°_m, and K_a = cα² / (1 - α)'
            ]
          },
          {
            id: 'chem_12_ch02_t3',
            topicName: 'Electrolysis & Commercial Batteries',
            ncertSection: '2.3',
            highYield: true,
            subtopics: [
              'Faraday\'s Laws: First Law w = ZIt = (M / nF)It; Second Law w₁/E₁ = w₂/E₂',
              'Primary Cells: Dry cell (Leclanché) and Mercury cell (gives constant voltage 1.35 V as no ions in solution change concentration)',
              'Secondary Cells: Lead-acid storage battery: Discharging (Pb + PbO₂ + 2H₂SO₄ → 2PbSO₄ + 2H₂O) and Recharging',
              'Fuel Cells: H₂-O₂ fuel cell reactions (efficiency ~70%, pollution-free, continuous operation)',
              'Corrosion (Rusting of Iron): Electrochemical mechanism (Fe → Fe²⁺ + 2e⁻, O₂ + 4H⁺ + 4e⁻ → 2H₂O); Rust Fe₂O₃ · xH₂O; Galvanization'
            ]
          }
        ]
      },
      {
        id: 'chem_12_ch03',
        grade: '12',
        discipline: 'PHYSICAL_CHEMISTRY',
        unit: 'Physical Chemistry (Unit I, II & III - 21M)',
        chapterNumber: 3,
        chapterName: 'Chemical Kinetics',
        boardExamFocus: {
          highYield: 'First-order rate equation numericals (e.g. prove t_99% = 2 × t_90%); Arrhenius equation two-temperature activation energy (E_a) calculations.',
          standardTrap: 'Confusing order (experimental, can be fractional/zero) with molecularity (theoretical integer); using natural log instead of 2.303 log₁₀.',
          questionType: '3-mark integrated rate law calculation; 3-mark Arrhenius E_a numerical; 2-mark order/molecularity distinction.'
        },
        topics: [
          {
            id: 'chem_12_ch03_t1',
            topicName: 'Rate of Reaction, Rate Law & Order',
            ncertSection: '3.1',
            highYield: true,
            subtopics: [
              'Average rate (-Δ[R]/Δt) vs Instantaneous rate (-d[R]/dt)',
              'Rate Law Expression: Rate = k[A]^x [B]^y (where x, y are experimental orders)',
              'Order vs Molecularity: Order is experimental (can be 0, fraction, negative); Molecularity is theoretical integer (1, 2, 3, never 0)',
              'Units of Rate Constant: (mol L⁻¹)^(1-n) s⁻¹ (Zero-order: mol L⁻¹ s⁻¹; First-order: s⁻¹; Second-order: L mol⁻¹ s⁻¹)'
            ]
          },
          {
            id: 'chem_12_ch03_t2',
            topicName: 'Integrated Rate Equations & Half-Life',
            ncertSection: '3.2',
            highYield: true,
            subtopics: [
              'Zero-Order Reactions: [R] = [R]₀ - kt; Half-life t_1/2 = [R]₀ / (2k) ∝ [R]₀; Linear [R] vs t with slope -k',
              'First-Order Reactions: k = (2.303/t) log₁₀([R]₀/[R]); Half-life t_1/2 = 0.693/k (independent of initial concentration [R]₀)',
              'Graphs: log[R] vs t has slope -k/2.303; t_1/2 vs [R]₀ is a horizontal line',
              'Gas Phase First-Order Reactions: k = (2.303/t) log₁₀[p_i / (2p_i - p_t)]',
              'Pseudo First-Order Reactions: Acid-catalyzed ester hydrolysis (CH₃COOC₂H₅ + H₂O → CH₃COOH + C₂H₅OH) and cane sugar inversion'
            ]
          },
          {
            id: 'chem_12_ch03_t3',
            topicName: 'Temperature Dependence & Collision Theory',
            ncertSection: '3.3',
            highYield: true,
            subtopics: [
              'Arrhenius Equation: k = A e^(-E_a/RT); Logarithmic form: log₁₀ k = log₁₀ A - E_a / (2.303RT)',
              'Two-temperature formula: log₁₀(k₂/k₁) = (E_a / 2.303R) [(T₂ - T₁) / (T₁T₂)]',
              'Activation energy graph: log k vs 1/T straight line with slope = -E_a / (2.303R)',
              'Role of Catalyst: Provides alternate pathway with lower activation energy without altering Δ_r H or K_c',
              'Collision Theory: Rate = P · Z_AB e^(-E_a/RT) (Activation energy threshold and steric orientation factor P)'
            ]
          }
        ]
      },

      // --- SECTION 2: INORGANIC CHEMISTRY (14 MARKS) ---
      {
        id: 'chem_12_ch04',
        grade: '12',
        discipline: 'INORGANIC_CHEMISTRY',
        unit: 'Inorganic Chemistry (Unit IV & V - 14M)',
        chapterNumber: 4,
        chapterName: 'The d- and f-Block Elements',
        boardExamFocus: {
          highYield: 'Reasoning on trends in E°(M²⁺/M) reduction potentials; Lanthanoid contraction causes and consequences; Redox reactions of KMnO₄ and K₂Cr₂O₇ in acidic medium.',
          standardTrap: 'Forgetting that Zn, Cd, Hg are not transition metals because they lack partially filled d-orbitals in both elemental and common ionic states.',
          questionType: '3-mark periodic trends and reasoning; 3-mark balanced ionic redox reactions of dichromate/permanganate; 2-mark lanthanoids vs actinoids.'
        },
        topics: [
          {
            id: 'chem_12_ch04_t1',
            topicName: 'General Trends of 3d-Transition Series',
            ncertSection: '4.1',
            highYield: true,
            subtopics: [
              'Electronic configurations: Cr (3d⁵ 4s¹) and Cu (3d¹⁰ 4s¹); Why Zn, Cd, Hg are not transition elements',
              'Atomic and ionic radii trends; Flat in middle (Fe, Co, Ni) due to d-shielding balancing nuclear charge',
              'Variable oxidation states; Maximum shown by Mn (+7); Stability from reduction potentials (E°_Cu²⁺/Cu is +0.34 V)',
              'Why Cr²⁺ is strongly reducing while Mn³⁺ is oxidizing (Cr³⁺ achieves stable half-filled t_2g³; Mn²⁺ achieves d⁵)',
              'Spin-only magnetic moment formula: μ = √(n(n+2)) BM (n = unpaired electrons)',
              'Formation of colored ions (d-d transitions); Catalytic properties; Interstitial compounds; Alloy formation'
            ]
          },
          {
            id: 'chem_12_ch04_t2',
            topicName: 'Preparation and Reactions of K₂Cr₂O₇ and KMnO₄',
            ncertSection: '4.2',
            highYield: true,
            subtopics: [
              'Potassium Dichromate (K₂Cr₂O₇): Preparation from Chromite ore (FeCr₂O₄) via Na₂CrO₄ and Na₂Cr₂O₇',
              'pH-dependent interconversion: 2CrO₄²⁻ (yellow) + 2H⁺ ⇌ Cr₂O₇²⁻ (orange) + H₂O',
              'Oxidizing actions in acid: Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O (oxidizes I⁻ → I₂, Fe²⁺ → Fe³⁺, H₂S → S, Sn²⁺ → Sn⁴⁺)',
              'Potassium Permanganate (KMnO₄): Preparation from Pyrolusite ore (MnO₂) via green K₂MnO₄',
              'Oxidizing actions in acid: MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O (oxidizes Fe²⁺ → Fe³⁺, C₂O₄²⁻ → CO₂, I⁻ → I₂)',
              'Oxidizing actions in neutral/faintly alkaline: MnO₄⁻ + 2H₂O + 3e⁻ → MnO₂ + 4OH⁻ (oxidizes I⁻ → IO₃⁻ iodate)'
            ]
          },
          {
            id: 'chem_12_ch04_t3',
            topicName: 'Inner Transition Elements (f-Block: Lanthanoids & Actinoids)',
            ncertSection: '4.3',
            highYield: true,
            subtopics: [
              'Lanthanoid Contraction: Cause (poor shielding of 4f electrons) and consequences (identical radii of Zr ≈ Hf, Nb ≈ Ta; basicity decrease La(OH)₃ to Lu(OH)₃)',
              'Lanthanoids common oxidation state +3 (Ce⁴⁺ and Eu²⁺ exceptional stabilities)',
              'Actinoids display wider oxidation states (+3 to +7) due to small energy gap between 5f, 6d, and 7s',
              'Actinoid contraction is greater than lanthanoid contraction due to poorer shielding by 5f vs 4f electrons'
            ]
          }
        ]
      },
      {
        id: 'chem_12_ch05',
        grade: '12',
        discipline: 'INORGANIC_CHEMISTRY',
        unit: 'Inorganic Chemistry (Unit IV & V - 14M)',
        chapterNumber: 5,
        chapterName: 'Coordination Compounds',
        boardExamFocus: {
          highYield: 'IUPAC naming of coordination complexes; VBT prediction of hybridization, shape, and magnetic nature ([Co(NH₃)₆]³⁺, [CoF₆]³⁻, [Ni(CN)₄]²⁻, [NiCl₄]²⁻); CFT splitting diagrams and d⁴-d⁷ configurations.',
          standardTrap: 'Forgetting to add suffix \'-ate\' to central metal when complex is anionic (e.g. ferrate, platinate, cobaltate).',
          questionType: '3-mark VBT / CFT configuration and magnetic property question; 2-mark IUPAC nomenclature; 2-mark isomerism drawing.'
        },
        topics: [
          {
            id: 'chem_12_ch05_t1',
            topicName: 'Nomenclature, Coordination Sphere & Isomerism',
            ncertSection: '5.1',
            highYield: true,
            subtopics: [
              'Terminology: Coordination entity, coordination number, denticity (bidentate en, oxalate; hexadentate EDTA⁴⁻), ambidentate ligands (NO₂⁻/ONO⁻, SCN⁻/NCS⁻)',
              'Chelate effect: Chelating ring complexes exhibit enhanced thermodynamic stability',
              'IUPAC Nomenclature: Alphabetical ligand ordering, anionic complex suffix \'-ate\', oxidation states in Roman numerals',
              'Structural Isomerism: Linkage (ambidentate), Coordination, Ionization (exchange with counter ion), Solvate/Hydrate',
              'Stereoisomerism: Geometrical (cis/trans in [MA₂B₂] square planar and [MA₄B₂] octahedral; fac/mer in [MA₃B₃])',
              'Optical Isomerism: Enantiomers in [Co(en)₃]³⁺ and cis-[Co(en)₂Cl₂]⁺; Trans-[Co(en)₂Cl₂]⁺ is optically inactive (plane of symmetry)'
            ]
          },
          {
            id: 'chem_12_ch05_t2',
            topicName: 'Bonding Theories (Werner, VBT, CFT)',
            ncertSection: '5.2',
            highYield: true,
            subtopics: [
              'Werner\'s Theory: Primary valency (ionizable, oxidation state) vs Secondary valency (non-ionizable, coordination number)',
              'Valence Bond Theory (VBT): sp³ (Tetrahedral), dsp² (Square planar), sp³d² (Outer orbital, high spin), d²sp³ (Inner orbital, low spin)',
              'VBT limitations: Cannot explain color, spectra, or relative ligand strength',
              'Crystal Field Theory (CFT): Octahedral field splitting into lower t_2g (-0.4 Δ_o) and upper e_g (+0.6 Δ_o)',
              'Spectrochemical Series: I⁻ < Br⁻ < S²⁻ < Cl⁻ < F⁻ < OH⁻ < C₂O₄²⁻ < H₂O < NCS⁻ < EDTA⁴⁻ < NH₃ < en < CN⁻ < CO',
              'High spin (Δ_o < P, weak field) vs Low spin (Δ_o > P, strong field) configurations for d⁴ to d⁷ ions',
              'Tetrahedral Field Splitting: Δ_t = (4/9) Δ_o; Pairing energy P > Δ_t always (high spin complexes)',
              'Color mechanism: d-d electronic transition across Δ_o absorbing complementary light'
            ]
          }
        ]
      },

      // --- SECTION 3: ORGANIC CHEMISTRY (35 MARKS) ---
      {
        id: 'chem_12_ch06',
        grade: '12',
        discipline: 'ORGANIC_CHEMISTRY',
        unit: 'Organic Chemistry (Unit VI to X - 35M)',
        chapterNumber: 6,
        chapterName: 'Haloalkanes and Haloarenes',
        boardExamFocus: {
          highYield: 'SN1 vs SN2 mechanism comparison (reactivity order, stereochemical inversion vs racemization); Why haloarenes are less reactive towards nucleophilic substitution; Ambident nucleophile reactions (KCN vs AgCN).',
          standardTrap: 'Using tertiary alkyl halide in Williamson ether synthesis or SN2 substitution where elimination to alkene dominates.',
          questionType: '3-mark SN1/SN2 reactivity ordering with reasoning; 2-mark named reaction conversion; 2-mark haloarene unreactivity reasoning.'
        },
        topics: [
          {
            id: 'chem_12_ch06_t1',
            topicName: 'Preparation and Physical Properties',
            ncertSection: '6.1',
            highYield: false,
            subtopics: [
              'Preparations from alcohols using SOCl₂ (Darzens process, preferred as SO₂ and HCl are escapable gases), PCl₅, PCl₃, HX',
              'Free radical halogenation of alkanes and electrophilic addition of HX to alkenes (Markovnikov vs Peroxide Anti-Markovnikov for HBr)',
              'Halogen Exchange: Finkelstein Reaction (R-X + NaI → R-I in dry acetone) and Swarts Reaction (R-X + AgF/CoF₂ → R-F)',
              'Boiling point trends: Branching decreases surface area and van der Waals forces, lowering boiling point'
            ]
          },
          {
            id: 'chem_12_ch06_t2',
            topicName: 'Nucleophilic Substitution Mechanisms (SN1 vs SN2)',
            ncertSection: '6.2',
            highYield: true,
            subtopics: [
              'SN2 Mechanism: Single-step concerted, bimolecular, backside attack, Walden Inversion; Reactivity: 1° > 2° > 3° > vinyl/aryl; Favored by strong nucleophiles and polar aprotic solvents',
              'SN1 Mechanism: Two-step via carbocation intermediate, unimolecular, racemization (inversion + retention); Reactivity: 3° > 2° > 1°; Allylic and benzylic halides show high reactivity due to resonance; Favored by polar protic solvents'
            ]
          },
          {
            id: 'chem_12_ch06_t3',
            topicName: 'Reactions of Haloalkanes and Haloarenes',
            ncertSection: '6.3',
            highYield: true,
            subtopics: [
              'β-Elimination (Dehydrohalogenation) by alcoholic KOH; Saytzeff’s (Zaitsev) Rule: more substituted alkene is major product',
              'Ambident Nucleophiles: KCN forms alkyl cyanides (R-CN, C-attack); AgCN forms alkyl isocyanides (R-NC, N-attack); KNO₂ forms nitrites (R-ONO); AgNO₂ forms nitroalkanes (R-NO₂)',
              'Low reactivity of haloarenes: 1. Resonance partial double bond C-X; 2. sp² carbon high electronegativity; 3. Phenyl cation instability; 4. Repulsion with π-cloud',
              'Electrophilic substitution in haloarenes: Halogens are deactivating but ortho/para directing due to +R overriding -I at o/p'
            ]
          },
          {
            id: 'chem_12_ch06_t4',
            topicName: 'Named Reactions of Alkyl & Aryl Halides',
            ncertSection: '6.4',
            highYield: true,
            subtopics: [
              'Wurtz Reaction: 2R-X + 2Na → R-R + 2NaX in dry ether',
              'Fittig Reaction: 2Ar-X + 2Na → Ar-Ar (Diphenyl) in dry ether',
              'Wurtz-Fittig Reaction: Ar-X + R-X + 2Na → Ar-R + 2NaX in dry ether'
            ]
          }
        ]
      },
      {
        id: 'chem_12_ch07',
        grade: '12',
        discipline: 'ORGANIC_CHEMISTRY',
        unit: 'Organic Chemistry (Unit VI to X - 35M)',
        chapterNumber: 7,
        chapterName: 'Alcohols, Phenols and Ethers',
        boardExamFocus: {
          highYield: 'Mechanism of acid-catalyzed dehydration of ethanol to ethene (443 K) vs ethoxyethane (413 K); Kolbe\'s and Reimer-Tiemann reactions; Williamson ether synthesis and ether cleavage with HI.',
          standardTrap: 'Cleavage of alkyl-aryl ether with HI: the C-O bond to phenyl cannot break due to partial double bond character, producing phenol and alkyl iodide.',
          questionType: '3-mark dehydration mechanism; 3-mark named reactions (Reimer-Tiemann, Kolbe); 2-mark ether cleavage with HI.'
        },
        topics: [
          {
            id: 'chem_12_ch07_t1',
            topicName: 'Alcohols: Synthesis, Acidity & Distinctions',
            ncertSection: '7.1',
            highYield: true,
            subtopics: [
              'Preparation: Acid-catalyzed hydration (Markovnikov); Hydroboration-Oxidation (B₂H₆ + H₂O₂/OH⁻ ⇒ Anti-Markovnikov addition of water); Grignard reagent addition (HCHO → 1°, RCHO → 2°, RCOR → 3°)',
              'Acidity of alcohols: Alcohols are weaker acids than water due to +I effect of alkyl groups (1° > 2° > 3°)',
              'Lucas Test (conc. HCl + anhyd. ZnCl₂): 3° alcohol gives turbidity immediately, 2° within 5 min, 1° only on heating',
              'Oxidation: PCC converts 1° alcohols to aldehydes (stops at aldehyde stage) and 2° to ketones; KMnO₄/K₂Cr₂O₇ oxidizes to carboxylic acids',
              'Dehydrogenation over Cu at 573 K: 1° gives aldehyde, 2° gives ketone, 3° undergoes dehydration to alkene'
            ]
          },
          {
            id: 'chem_12_ch07_t2',
            topicName: 'Phenols: Synthesis, Acidity & Named Reactions',
            ncertSection: '7.2',
            highYield: true,
            subtopics: [
              'Preparation from Cumene (cumene hydroperoxide process yielding phenol + acetone) and from Benzenediazonium chloride',
              'Acidity of Phenols: More acidic than alcohols due to resonance stabilization of phenoxide ion; EWG (-NO₂) at o/p increases acidity; o-nitrophenol is less acidic than p-nitrophenol due to intramolecular H-bonding',
              'Kolbe’s Reaction: Phenol + NaOH + CO₂ → Salicylic acid (2-hydroxybenzoic acid)',
              'Reimer-Tiemann Reaction: Phenol + CHCl₃ + 3NaOH → Salicylaldehyde (intermediate is dichlorocarbene :CCl₂)',
              'Bromination: With Br₂/CS₂ gives p-bromophenol (major); with Br₂/H₂O gives white precipitate of 2,4,6-tribromophenol',
              'Nitration: Dilute HNO₃ gives steam-volatile o-nitrophenol (intramolecular H-bond) and p-nitrophenol; Conc. HNO₃ gives Picric acid (2,4,6-trinitrophenol)'
            ]
          },
          {
            id: 'chem_12_ch07_t3',
            topicName: 'Ethers: Synthesis & Cleavage',
            ncertSection: '7.3',
            highYield: true,
            subtopics: [
              'Intermolecular dehydration of ethanol: 2C₂H₅OH → C₂H₅OC₂H₅ at 413 K with conc. H₂SO₄ (at 443 K ethene alkene dominates)',
              'Williamson Ether Synthesis: R-X + R\'-O⁻Na⁺ → R-O-R\' + NaX (SN2 mechanism, R-X must be primary 1°; if 3° halide is used, elimination dominates to give alkene)',
              'Cleavage of Ethers by HI: 1°/2° unsymmetrical ethers form smaller alkyl iodide via SN2; if one group is tertiary (3°), it forms 3° alkyl iodide via SN1 carbocation',
              'Anisole (Ph-O-CH₃) with HI gives Phenol + CH₃I (Ph-O bond has partial double bond character)'
            ]
          }
        ]
      },
      {
        id: 'chem_12_ch08',
        grade: '12',
        discipline: 'ORGANIC_CHEMISTRY',
        unit: 'Organic Chemistry (Unit VI to X - 35M)',
        chapterNumber: 8,
        chapterName: 'Aldehydes, Ketones and Carboxylic Acids',
        boardExamFocus: {
          highYield: 'Aldol Condensation and Cannizzaro Reaction; Chemical tests to distinguish pairs (Tollens\', Fehling\'s, Iodoform); Carboxylic acids acidity rankings; Clemmensen & Wolff-Kishner reductions.',
          standardTrap: 'Performing Fehling\'s test on benzaldehyde (aromatic aldehydes do not reduce Fehling\'s solution); writing aldol product for compounds lacking α-hydrogen.',
          questionType: 'Guaranteed 5-mark organic synthesis/mechanism question; 3-mark chemical distinguishing tests; 2-mark acidity ranking.'
        },
        topics: [
          {
            id: 'chem_12_ch08_t1',
            topicName: 'Preparation of Carbonyls',
            ncertSection: '8.1',
            highYield: true,
            subtopics: [
              'Rosenmund Reduction: R-COCl + H₂ → R-CHO over Pd-BaSO₄ / quinoline (poisoned catalyst)',
              'Stephen Reaction: R-CN + SnCl₂ + HCl → R-CH=NH →(H₃O⁺) R-CHO',
              'Etard Reaction: Toluene + CrO₂Cl₂ (in CS₂) → Chromium complex →(H₃O⁺) Benzaldehyde',
              'Gattermann-Koch Reaction: Benzene + CO + HCl →(anhyd. AlCl₃/CuCl) Benzaldehyde',
              'Ozonolysis of alkenes (O₃ followed by Zn/H₂O) and alkyne hydration (ethyne gives ethanal, propyne gives acetone)'
            ]
          },
          {
            id: 'chem_12_ch08_t2',
            topicName: 'Nucleophilic Addition Reactions of Carbonyls',
            ncertSection: '8.2',
            highYield: true,
            subtopics: [
              'Reactivity towards nucleophilic addition: Aldehydes > Ketones (steric hindrance and +I alkyl groups reduce carbonyl carbon electrophilicity); Aliphatic aldehydes > Aromatic aldehydes',
              'Addition of HCN (base-catalyzed forming cyanohydrins)',
              'Addition of NaHSO₃ (bisulphite crystalline adduct for purification)',
              'Addition of alcohols: Aldehydes give hemiacetals and acetals; Ketones give cyclic ethylene glycol ketals',
              'Addition of ammonia derivatives (H₂N-Z): Hydroxylamine (oxime), Hydrazine (hydrazone), Semicarbazide (semicarbazone), 2,4-DNP (orange-yellow precipitate)'
            ]
          },
          {
            id: 'chem_12_ch08_t3',
            topicName: 'Distinguishing Tests & Carbonyl Named Reactions',
            ncertSection: '8.3',
            highYield: true,
            subtopics: [
              'Tollens’ Test (Silver Mirror): Positive for all aldehydes (aliphatic and aromatic); R-CHO + 2[Ag(NH₃)₂]⁺ + 3OH⁻ → R-COO⁻ + 2Ag↓ + 4NH₃ + 2H₂O',
              'Fehling’s Test: Positive for aliphatic aldehydes (red Cu₂O precipitate); Aromatic aldehydes and ketones fail',
              'Iodoform Test (I₂ + NaOH): Positive for CH₃-C=O and CH₃-CH(OH)- groups (ethanal, all methyl ketones, ethanol, propan-2-ol); yields bright yellow CHI₃ precipitate',
              'Aldol Condensation: Carbonyls with α-hydrogen with dilute NaOH yield β-hydroxyaldehyde (aldol) which dehydrates on heating to α,β-unsaturated carbonyl',
              'Cannizzaro Reaction: Aldehydes lacking α-hydrogen (HCHO, PhCHO) with 50% conc. NaOH disproportionate into alcohol and carboxylic acid salt',
              'Clemmensen Reduction: >C=O + Zn-Hg + conc. HCl → >CH₂; Wolff-Kishner Reduction: >C=O + NH₂NH₂ / KOH / ethylene glycol, Δ → >CH₂ + N₂'
            ]
          },
          {
            id: 'chem_12_ch08_t4',
            topicName: 'Carboxylic Acids: Acidity & Reactions',
            ncertSection: '8.4',
            highYield: true,
            subtopics: [
              'Acidity of Carboxylic Acids: Higher than phenols because carboxylate ion stabilizes negative charge equally over two electronegative oxygen atoms',
              'Substituent effects: EWG (-NO₂, -CN, -F, -Cl) increase acidity; EDG decrease acidity (CF₃COOH > CCl₃COOH > CHCl₂COOH > NO₂CH₂COOH > HCOOH > PhCOOH > CH₃COOH)',
              'Hell-Volhard-Zelinsky (HVZ) Reaction: Carboxylic acids with α-hydrogen react with Cl₂/Br₂ and red P to yield α-halocarboxylic acids',
              'Decarboxylation: Sodium salts of carboxylic acids heated with soda-lime (NaOH + CaO 3:1) yield alkane with one fewer carbon'
            ]
          }
        ]
      },
      {
        id: 'chem_12_ch09',
        grade: '12',
        discipline: 'ORGANIC_CHEMISTRY',
        unit: 'Organic Chemistry (Unit VI to X - 35M)',
        chapterNumber: 9,
        chapterName: 'Amines',
        boardExamFocus: {
          highYield: 'Basicity order of amines in aqueous solution ((C₂H₅)₂NH > (C₂H₅)₃N > C₂H₅NH₂ > NH₃ vs (CH₃)₂NH > CH₃NH₂ > (CH₃)₃N > NH₃); Carbylamine and Hinsberg tests; Gabriel phthalimide & Hofmann bromamide reactions.',
          standardTrap: 'Gabriel phthalimide synthesis cannot prepare aromatic primary amines (aniline) because aryl halides do not undergo nucleophilic substitution with phthalimide anion.',
          questionType: '3-mark basicity order with reasoning (inductive, solvation, steric); 3-mark Hinsberg / Carbylamine test; 2-mark diazonium coupling dyes.'
        },
        topics: [
          {
            id: 'chem_12_ch09_t1',
            topicName: 'Classification & Preparations',
            ncertSection: '9.1',
            highYield: true,
            subtopics: [
              'Reduction of nitro compounds (Fe + HCl preferred over Sn + HCl as FeCl₂ hydrolyzes to regenerate HCl)',
              'Ammonolysis of alkyl halides (Hofmann method gives mixture of 1°, 2°, 3° and quaternary ammonium salt)',
              'Reduction of nitriles (R-CN → R-CH₂NH₂) and amides with LiAlH₄',
              'Gabriel Phthalimide Synthesis: Phthalimide + KOH + R-X → N-alkylphthalimide → 1° aliphatic amine (cannot synthesize aniline as aryl halides do not react)',
              'Hofmann Bromamide Degradation: R-CONH₂ + Br₂ + 4NaOH → R-NH₂ + Na₂CO₃ + 2NaBr + 2H₂O (gives 1° amine with one less carbon atom)'
            ]
          },
          {
            id: 'chem_12_ch09_t2',
            topicName: 'Basicity of Amines',
            ncertSection: '9.2',
            highYield: true,
            subtopics: [
              'Gas phase basicity: 3° > 2° > 1° > NH₃ (governed purely by +I electron-donating effect)',
              'Aqueous phase basicity: Interplay of inductive, hydration energy (H-bonding), and steric hindrance',
              'Methyl-substituted in water: 2° > 1° > 3° > NH₃ [(CH₃)₂NH > CH₃NH₂ > (CH₃)₃N > NH₃]',
              'Ethyl-substituted in water: 2° > 3° > 1° > NH₃ [(C₂H₅)₂NH > (C₂H₅)₃N > C₂H₅NH₂ > NH₃]',
              'Basicity of Aniline: Aniline is a weaker base than ammonia and aliphatic amines because nitrogen lone pair is delocalized into the benzene ring via resonance'
            ]
          },
          {
            id: 'chem_12_ch09_t3',
            topicName: 'Chemical Tests and Distinctions',
            ncertSection: '9.3',
            highYield: true,
            subtopics: [
              'Carbylamine Test (Isocyanide test): Specific for 1° amines (aliphatic & aromatic); R-NH₂ + CHCl₃ + 3KOH(alc), Δ → R-NC (foul-smelling isocyanide); 2° and 3° do not respond',
              'Hinsberg\'s Test (Benzenesulphonyl chloride C₆H₅SO₂Cl): 1° amine gives N-alkylbenzenesulphonamide (soluble in alkali KOH); 2° gives N,N-dialkyl derivative (insoluble in alkali); 3° does not react',
              'Reaction with HNO₂ (NaNO₂ + HCl): Primary aliphatic amines liberate N₂ gas quantitatively; Primary aromatic amines at 273-278 K form stable Benzenediazonium chloride'
            ]
          },
          {
            id: 'chem_12_ch09_t4',
            topicName: 'Diazonium Salts & Azo Dyes',
            ncertSection: '9.4',
            highYield: true,
            subtopics: [
              'Sandmeyer Reaction: Ar-N₂⁺Cl⁻ + Cu₂Cl₂/HCl → Ar-Cl; with Cu₂Br₂/HBr → Ar-Br; with CuCN/KCN → Ar-CN',
              'Gattermann Reaction: Ar-N₂⁺Cl⁻ + Cu/HCl → Ar-Cl; with Cu/HBr → Ar-Br',
              'Azo Coupling Reactions: With Phenol in mildly basic medium (pH 9-10) gives p-hydroxyazobenzene (orange dye); With Aniline in mildly acidic medium (pH 4-5) gives p-aminoazobenzene (yellow dye)'
            ]
          }
        ]
      },
      {
        id: 'chem_12_ch10',
        grade: '12',
        discipline: 'ORGANIC_CHEMISTRY',
        unit: 'Organic Chemistry (Unit VI to X - 35M)',
        chapterNumber: 10,
        chapterName: 'Biomolecules',
        boardExamFocus: {
          highYield: 'Chemical reactions confirming the open-chain structure of glucose (HI, Br₂ water, Ac₂O, HNO₃); Differences between Amylose and Amylopectin; Structural levels of proteins and denaturation; Peptide bond and Zwitterion.',
          standardTrap: 'Assuming glucose gives 2,4-DNP or Schiff\'s test in open-chain form (it exists predominantly as cyclic hemiacetal pyranose anomers, failing these aldehyde tests).',
          questionType: '3-mark glucose structure proof reactions; 2-mark protein denaturation & structure levels; 2-mark nucleotide vs nucleoside / vitamins.'
        },
        topics: [
          {
            id: 'chem_12_ch10_t1',
            topicName: 'Carbohydrates: Glucose Structure & Polysaccharides',
            ncertSection: '10.1',
            highYield: true,
            subtopics: [
              'Classification: Monosaccharides, reducing (free hemiacetal) vs non-reducing sugars (sucrose)',
              'Glucose Structure Proofs: 1. HI, Δ gives n-hexane (6-carbon straight chain); 2. NH₂OH and HCN give oxime and cyanohydrin (carbonyl); 3. Br₂ water gives gluconic acid (aldehyde); 4. Ac₂O gives pentaacetate (5 distinct -OH); 5. HNO₃ gives saccharic acid (1° alcohol)',
              'Cyclic Structure & Anomers: α-D-glucose and β-D-glucose differ only at C-1 anomeric carbon',
              'Disaccharides: Sucrose (α-D-glucose + β-D-fructose, C1-C2 glycosidic, non-reducing, invert sugar [dextro +66.5° hydrolyzes to laevo mixture]); Maltose (α-1,4-glycosidic, reducing); Lactose (β-1,4, reducing)',
              'Polysaccharides: Starch (Amylose 15-20% water-soluble unbranched C1-C4 + Amylopectin 80-85% insoluble branched C1-C6); Cellulose (straight chain β-1,4 structural polymer); Glycogen (animal starch, highly branched)'
            ]
          },
          {
            id: 'chem_12_ch10_t2',
            topicName: 'Amino Acids and Proteins',
            ncertSection: '10.2',
            highYield: true,
            subtopics: [
              'Amino Acids: α-amino acids; Essential (Valine, Leucine) vs Non-essential (Glycine, Alanine); Optical activity (all chiral except Glycine)',
              'Zwitterion: Neutral dipolar ion (+H₃N-CH(R)-COO⁻), amphoteric behavior',
              'Peptide Bond: Amide linkage (-CONH-) formed between -COOH and -NH₂ with elimination of water',
              'Protein Structures: Primary (amino acid sequence), Secondary (α-helix and β-pleated sheets via H-bonds), Tertiary (fibrous keratin/collagen vs globular albumin/insulin), Quaternary',
              'Denaturation of Proteins: Disruption of secondary and tertiary structures by heat or pH change; primary structure remains intact (e.g. boiling egg white, curdling milk)'
            ]
          },
          {
            id: 'chem_12_ch10_t3',
            topicName: 'Nucleic Acids & Vitamins',
            ncertSection: '10.3',
            highYield: true,
            subtopics: [
              'Chemical components: Pentose sugar (β-D-ribose in RNA, β-D-2-deoxyribose in DNA), Phosphoric acid, Purines (A, G), Pyrimidines (C, U in RNA, T in DNA)',
              'Nucleoside (Base + Sugar at C-1\') vs Nucleotide (Base + Sugar + Phosphate at C-5\')',
              'DNA Double Helix: Held by complementary hydrogen bonds (A = T double bond, G ≡ C triple bond)',
              'Vitamins: Fat-soluble (A, D, E, K, stored in liver/adipose) vs Water-soluble (B-complex and C, excreted in urine, not stored except B₁₂)',
              'Deficiency diseases: Vitamin A (Night blindness), Vitamin B₁ (Beri-beri), Vitamin C (Scurvy), Vitamin D (Rickets), Vitamin K (Delayed blood clotting)'
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================================
  // 4. SENIOR MATHEMATICS (Class 12 Complete 13 Chapters) - Non-Medical & CBSE / JEE Stream
  // As per Latest Rationalised NCERT Textbook (Part I & Part II) & CBSE Curriculum
  // ==========================================================================
  'MATHEMATICS': {
    subjectName: 'Class 12 Mathematics',
    stream: 'NON_MEDICAL',
    grades: ['12'],
    targetExams: ['CBSE_CLASS_12', 'JEE_MAIN', 'JEE_ADVANCED', 'HP_BOARD_CLASS_12'],
    units: [
      { unitNumber: 'I', unitName: 'Relations and Functions', weightageMarks: 8, chapters: [1, 2] },
      { unitNumber: 'II', unitName: 'Algebra', weightageMarks: 10, chapters: [3, 4] },
      { unitNumber: 'III', unitName: 'Calculus', weightageMarks: 35, chapters: [5, 6, 7, 8, 9] },
      { unitNumber: 'IV', unitName: 'Vectors and Three-Dimensional Geometry', weightageMarks: 14, chapters: [10, 11] },
      { unitNumber: 'V', unitName: 'Linear Programming', weightageMarks: 5, chapters: [12] },
      { unitNumber: 'VI', unitName: 'Probability', weightageMarks: 8, chapters: [13] }
    ],
    boardHighYieldSummary: {
      examBoard: 'CBSE / HPBOSE Class 12 Mathematics (80 Marks Theory)',
      fiveMarkGuarantees: [
        {
          rank: 1,
          topic: 'Matrix Inversion Method',
          detail: 'Solve 3 linear equations using X = A⁻¹B with |A| ≠ 0, adj(A), and cofactor calculations.',
          chapter: 'Chapter 4: Determinants'
        },
        {
          rank: 2,
          topic: 'Shortest Distance Between Skew Lines',
          detail: 'Vector/Cartesian distance d = |((a₂ - a₁) · (b₁ × b₂)) / |b₁ × b₂||, with standard direction ratios.',
          chapter: 'Chapter 11: Three-Dimensional Geometry'
        },
        {
          rank: 3,
          topic: 'Linear Programming (Corner Point Method)',
          detail: 'Feasible region plotting, corner points identification, bounded/unbounded maximum/minimum proof.',
          chapter: 'Chapter 12: Linear Programming'
        },
        {
          rank: 4,
          topic: 'Maxima/Minima Geometric Optimization',
          detail: 'Applied word problems: cylinder inscribed in sphere, minimum surface area for given volume with second derivative test proof.',
          chapter: 'Chapter 6: Applications of Derivatives'
        }
      ],
      caseStudyFourMark: [
        {
          topic: 'Applications of Derivatives (AOD)',
          detail: 'Real-world cost, revenue, or geometric volume optimization scenarios with 3 sub-questions.',
          chapter: 'Chapter 6: Applications of Derivatives'
        },
        {
          topic: 'Bayes\' Theorem & Total Probability',
          detail: 'Industrial manufacturing defects, medical testing reliability, or truth/lie statement probabilities.',
          chapter: 'Chapter 13: Probability'
        },
        {
          topic: 'Relations and Functions',
          detail: 'Real-world equivalence relation modeling or bijective domain/codomain conditions.',
          chapter: 'Chapter 1: Relations and Functions'
        }
      ],
      threeMarkHeavyweights: [
        {
          topic: 'Definite Integrals using King Property (P₄)',
          detail: '∫₀ᵃ f(x)dx = ∫₀ᵃ f(a-x)dx and modulus integrals ∫ₐᵇ |f(x)|dx using P₂.',
          chapter: 'Chapter 7: Integrals'
        },
        {
          topic: 'Linear Differential Equations (LDE)',
          detail: 'dy/dx + Py = Q or dx/dy + P₁x = Q₁ with integrating factor IF = e^∫Pdx.',
          chapter: 'Chapter 9: Differential Equations'
        },
        {
          topic: 'Area Under Simple Curves (AOI)',
          detail: 'Area between parabola and line, or ellipse/circle with labeled graph sketch.',
          chapter: 'Chapter 8: Applications of Integrals'
        },
        {
          topic: 'Proving Equivalence Relations',
          detail: 'Proof of reflexivity, symmetry, and transitivity on pairs of integers ((a, b), (c, d)) ∈ R.',
          chapter: 'Chapter 1: Relations and Functions'
        }
      ]
    },
    chapters: [
      // --- UNIT I: RELATIONS AND FUNCTIONS (8 MARKS) ---
      {
        id: 'math_12_ch01',
        grade: '12',
        discipline: 'RELATIONS & FUNCTIONS',
        unit: 'Relations and Functions (Unit I - 8M)',
        chapterNumber: 1,
        chapterName: 'Relations and Functions',
        boardExamFocus: {
          highYield: 'Proving equivalence relations on pairs of integers like ((a, b), (c, d)) ∈ R ⇔ ad(b+c) = bc(a+d) or a+d = b+c.',
          standardTrap: 'Writing equivalence classes correctly without omitting elements.',
          questionType: '3-mark proofs on Equivalence Relations or 2/3-mark questions testing injectivity/surjectivity with restricted domains.'
        },
        topics: [
          {
            id: 'math_12_ch01_t1',
            topicName: 'Types of Relations',
            ncertSection: '1.1',
            highYield: true,
            subtopics: [
              'Cartesian Product A × B and relation as subset R ⊆ A × A',
              'Empty Relation and Universal Relation',
              'Reflexivity: (a, a) ∈ R for every a ∈ A',
              'Symmetry: (a, b) ∈ R ⇒ (b, a) ∈ R for all a, b ∈ A',
              'Transitivity: (a, b) ∈ R and (b, c) ∈ R ⇒ (a, c) ∈ R for all a, b, c ∈ A',
              'Counter-example mechanics for non-equivalence',
              'Equivalence Relations & Equivalence Classes [a]'
            ]
          },
          {
            id: 'math_12_ch01_t2',
            topicName: 'Types of Functions',
            ncertSection: '1.2',
            highYield: true,
            subtopics: [
              'Injective Functions (One-to-One): f(x₁) = f(x₂) ⇒ x₁ = x₂',
              'Horizontal line test for injectivity',
              'Proving non-injectivity using explicit counter-examples',
              'Surjective Functions (Onto): Range(f) = Codomain(f)',
              'Bijective Functions (simultaneously One-to-One and Onto)',
              'Domain/Codomain dependence (N→N, Z→Z, R→R)'
            ]
          }
        ]
      },
      {
        id: 'math_12_ch02',
        grade: '12',
        discipline: 'INVERSE TRIGONOMETRY',
        unit: 'Relations and Functions (Unit I - 8M)',
        chapterNumber: 2,
        chapterName: 'Inverse Trigonometric Functions',
        boardExamFocus: {
          highYield: '1-mark and 2-mark evaluation problems involving angles outside the principal branch (e.g., cos⁻¹(cos 13π/6)).',
          standardTrap: 'Direct cancellation sin⁻¹(sin x) = x without checking if x lies in the principal interval [-π/2, π/2].',
          questionType: '1/2-mark MCQs and short answer questions on principal values and compositions.'
        },
        topics: [
          {
            id: 'math_12_ch02_t1',
            topicName: 'Restricted Domains and Invertibility',
            ncertSection: '2.1',
            highYield: true,
            subtopics: [
              'Why trigonometric functions require domain truncation for bijection',
              'sin⁻¹x: Domain [-1, 1], Principal Value Branch [-π/2, π/2]',
              'cos⁻¹x: Domain [-1, 1], Principal Value Branch [0, π]',
              'tan⁻¹x: Domain R, Principal Value Branch (-π/2, π/2)',
              'cot⁻¹x: Domain R, Principal Value Branch (0, π)',
              'sec⁻¹x: Domain R - (-1, 1), Principal Value Branch [0, π] - {π/2}',
              'cosec⁻¹x: Domain R - (-1, 1), Principal Value Branch [-π/2, π/2] - {0}'
            ]
          },
          {
            id: 'math_12_ch02_t2',
            topicName: 'Principal Value Evaluation',
            ncertSection: '2.2',
            highYield: true,
            subtopics: [
              'Direct evaluation of principal angles (e.g. sin⁻¹(1/2), cos⁻¹(-1/2))',
              'Negative arguments: sin⁻¹(-x) = -sin⁻¹x, tan⁻¹(-x) = -tan⁻¹x, cosec⁻¹(-x) = -cosec⁻¹x',
              'Negative arguments: cos⁻¹(-x) = π - cos⁻¹x, cot⁻¹(-x) = π - cot⁻¹x, sec⁻¹(-x) = π - sec⁻¹x',
              'Composition outside principal branch: sin⁻¹(sin θ) and cos⁻¹(cos θ)',
              'Reduction via reference angles into the allowed principal window'
            ]
          }
        ]
      },

      // --- UNIT II: ALGEBRA (10 MARKS) ---
      {
        id: 'math_12_ch03',
        grade: '12',
        discipline: 'MATRICES',
        unit: 'Algebra (Unit II - 10M)',
        chapterNumber: 3,
        chapterName: 'Matrices',
        boardExamFocus: {
          highYield: 'Expressing a given 3×3 matrix as the sum of a symmetric and a skew-symmetric matrix (3-mark question).',
          standardTrap: 'Reversal rule in transpose: forgetting that (AB)ᵀ = BᵀAᵀ (not AᵀBᵀ).',
          questionType: '3-mark decomposition theorem and matrix polynomial evaluation A² - 5A + 7I = O.'
        },
        topics: [
          {
            id: 'math_12_ch03_t1',
            topicName: 'Basic Algebra of Matrices',
            ncertSection: '3.1',
            highYield: false,
            subtopics: [
              'Order of matrix (m × n) and compact notation A = [aij]',
              'Matrix Types: Row, column, square, diagonal, scalar, identity, zero',
              'Equality of matrices and solving for unknown variables',
              'Matrix addition and scalar multiplication properties'
            ]
          },
          {
            id: 'math_12_ch03_t2',
            topicName: 'Matrix Multiplication',
            ncertSection: '3.2',
            highYield: true,
            subtopics: [
              'Compatibility condition: columns of A = rows of B',
              'Row-by-column multiplication mechanics',
              'Non-commutativity: AB ≠ BA in general',
              'Zero divisors: AB = O does not imply A = O or B = O',
              'Matrix polynomials: f(A) = A² - 5A + 7I = O and finding A⁻¹'
            ]
          },
          {
            id: 'math_12_ch03_t3',
            topicName: 'Transpose and Symmetry',
            ncertSection: '3.3',
            highYield: true,
            subtopics: [
              'Properties of transpose: (Aᵀ)ᵀ = A, (kA)ᵀ = kAᵀ, (A+B)ᵀ = Aᵀ+Bᵀ, (AB)ᵀ = BᵀAᵀ',
              'Symmetric matrix: Aᵀ = A (aij = aji)',
              'Skew-symmetric matrix: Aᵀ = -A (aii = 0, principal diagonal zero)',
              'Decomposition Theorem: A = 1/2(A + Aᵀ) + 1/2(A - Aᵀ)'
            ]
          }
        ]
      },
      {
        id: 'math_12_ch04',
        grade: '12',
        discipline: 'DETERMINANTS',
        unit: 'Algebra (Unit II - 10M)',
        chapterNumber: 4,
        chapterName: 'Determinants',
        boardExamFocus: {
          highYield: 'Solving a system of 3 linear equations using X = A⁻¹B (Guaranteed 5-mark question).',
          standardTrap: 'Using |adj A| = |A|^(n-1) and |kA| = k^n |A| in 1-mark MCQs without verifying order n.',
          questionType: 'Guaranteed 5-mark matrix inversion method; 1-mark MCQ determinant identities.'
        },
        topics: [
          {
            id: 'math_12_ch04_t1',
            topicName: 'Expansion & Minors/Cofactors',
            ncertSection: '4.1',
            highYield: false,
            subtopics: [
              'Evaluation of determinants of Order 1, 2, and 3',
              'Minors (Mij) and Cofactors (Aij = (-1)^(i+j) Mij)',
              'Cofactor expansion identities along rows and columns'
            ]
          },
          {
            id: 'math_12_ch04_t2',
            topicName: 'Adjoint and Inverse of a Matrix',
            ncertSection: '4.2',
            highYield: true,
            subtopics: [
              'Definition of Adjoint: adj(A) = [Aij]ᵀ',
              'Fundamental theorem: A · adj(A) = adj(A) · A = |A| I',
              'Singular (|A| = 0) and non-singular (|A| ≠ 0) matrices',
              'Formal inverse formula: A⁻¹ = (1/|A|) adj(A)',
              'Determinant identities: |adj A| = |A|^(n-1), |A · adj A| = |A|^n'
            ]
          },
          {
            id: 'math_12_ch04_t3',
            topicName: 'Applications of Determinants & Matrices',
            ncertSection: '4.3',
            highYield: true,
            subtopics: [
              'Area of a triangle using determinants and collinearity condition (Δ = 0)',
              'Solving linear systems by Matrix Method: AX = B ⇒ X = A⁻¹B (5-Mark guaranteed)',
              'Criteria for consistency: unique solution, no solution, infinitely many'
            ]
          }
        ]
      },

      // --- UNIT III: CALCULUS (35 MARKS) ---
      {
        id: 'math_12_ch05',
        grade: '12',
        discipline: 'CALCULUS',
        unit: 'Calculus (Unit III - 35M)',
        chapterNumber: 5,
        chapterName: 'Continuity and Differentiability',
        boardExamFocus: {
          highYield: 'Finding constants a and b for a continuous function (3 marks); Logarithmic differentiation involving y = x^(sin x) + (sin x)^x (4/5 marks); Proving y₂ differential identities like (1 - x²)y₂ - xy₁ + m²y = 0.',
          standardTrap: 'In second derivative of parametric forms, forgetting to multiply by dt/dx at the final step.',
          questionType: '3-mark continuity proofs, 4/5-mark logarithmic or second-order parametric derivatives.'
        },
        topics: [
          {
            id: 'math_12_ch05_t1',
            topicName: 'Continuity',
            ncertSection: '5.1',
            highYield: true,
            subtopics: [
              'Condition at a point: lim(x→c⁻) f(x) = lim(x→c⁺) f(x) = f(c)',
              'Checking continuity on piecewise functions and absolute values',
              'Finding unknown constants (k, a, b) when f(x) is continuous everywhere',
              'Algebra of continuous functions'
            ]
          },
          {
            id: 'math_12_ch05_t2',
            topicName: 'Differentiability Mechanics',
            ncertSection: '5.2',
            highYield: true,
            subtopics: [
              'Left-Hand Derivative (LHD) and Right-Hand Derivative (RHD) at x = c',
              'Fundamental theorem: Differentiability implies continuity, converse is not true'
            ]
          },
          {
            id: 'math_12_ch05_t3',
            topicName: 'Differentiation Techniques',
            ncertSection: '5.3',
            highYield: true,
            subtopics: [
              'Chain rule for composite expressions f(g(h(x)))',
              'Implicit differentiation for mixed x and y terms',
              'Inverse trigonometric differentiation with trigonometric substitutions',
              'Logarithmic differentiation: [u(x)]^[v(x)] and product/quotient simplification',
              'Parametric differentiation: dy/dx = (dy/dt) / (dx/dt)',
              'Second-order derivatives: d²y/dx² = d/dt(dy/dx) · dt/dx (parametric trap)',
              'Proving differential identity equations involving y, y₁, y₂'
            ]
          }
        ]
      },
      {
        id: 'math_12_ch06',
        grade: '12',
        discipline: 'CALCULUS',
        unit: 'Calculus (Unit III - 35M)',
        chapterNumber: 6,
        chapterName: 'Applications of Derivatives (AOD)',
        boardExamFocus: {
          highYield: 'Applied geometric optimization word problems (frequently chosen for 4-mark Case-Based questions or 5-mark long answers).',
          standardTrap: 'Must explicitly show the second derivative test (f\'\'(x) < 0 for max or f\'\'(x) > 0 for min) to secure method marks.',
          questionType: '4-mark Case Study or 5-mark Applied Optimization word problem.'
        },
        topics: [
          {
            id: 'math_12_ch06_t1',
            topicName: 'Rate of Change of Quantities',
            ncertSection: '6.1',
            highYield: true,
            subtopics: [
              'Instantaneous rate of change dy/dx',
              'Related rates problems: Spherical balloons, leaking conical tanks, sliding ladders',
              'Marginal cost and marginal revenue interpretations'
            ]
          },
          {
            id: 'math_12_ch06_t2',
            topicName: 'Increasing and Decreasing Functions',
            ncertSection: '6.2',
            highYield: true,
            subtopics: [
              'Strictly increasing (f\'(x) > 0) and strictly decreasing (f\'(x) < 0)',
              'Partitioning real line into sub-intervals using critical numbers',
              'Step-by-step sign testing of f\'(x) on sub-intervals'
            ]
          },
          {
            id: 'math_12_ch06_t3',
            topicName: 'Maxima and Minima',
            ncertSection: '6.3',
            highYield: true,
            subtopics: [
              'Critical points where f\'(x) = 0 or f\'(x) fails to exist',
              'First Derivative Test (sign change across critical point)',
              'Second Derivative Test: f\'\'(c) < 0 ⇒ Local Max, f\'\'(c) > 0 ⇒ Local Min',
              'Absolute maxima and minima on closed intervals [a, b]',
              'Applied geometric optimization word problems (inscribed cylinders, minimum surface area)'
            ]
          }
        ]
      },
      {
        id: 'math_12_ch07',
        grade: '12',
        discipline: 'CALCULUS',
        unit: 'Calculus (Unit III - 35M)',
        chapterNumber: 7,
        chapterName: 'Integrals',
        boardExamFocus: {
          highYield: 'Proofs and evaluations using King Property P₄ (e.g., ∫₀^(π/2) (√sin x)/(√sin x + √cos x) dx or ∫₀^π (x sin x)/(1 + cos²x) dx); Modulus integrals using P₂ (∫ₐᵇ |f(x)|dx).',
          standardTrap: 'Forgetting to change integration limits during t-substitution in definite integrals.',
          questionType: 'Guaranteed 3/5-mark Definite Integral property proofs and Partial Fractions.'
        },
        topics: [
          {
            id: 'math_12_ch07_t1',
            topicName: 'Indefinite Integration: Algebraic Methods',
            ncertSection: '7.1',
            highYield: true,
            subtopics: [
              'Direct anti-derivative formulas and linearity properties',
              'Integration by substitution (t-substitution): ∫f(g(x))g\'(x)dx, ∫(f\'/f)dx = ln|f| + C',
              'Trigonometric power reduction identities: sin²x, cos³x, sin(mx)cos(nx)'
            ]
          },
          {
            id: 'math_12_ch07_t2',
            topicName: 'Special Integrals & Partial Fractions',
            ncertSection: '7.2',
            highYield: true,
            subtopics: [
              'Nine special integral formulas: 1/(x²±a²), 1/(a²-x²), 1/√(x²±a²), 1/√(a²-x²)',
              'Completing the square on quadratic denominators',
              'Linear-over-quadratic forms: px + q = A d/dx(denom) + B',
              'Partial fractions: Proper vs improper, linear, repeated, and non-factorizable factors'
            ]
          },
          {
            id: 'math_12_ch07_t3',
            topicName: 'Integration by Parts & Definite Integrals',
            ncertSection: '7.3',
            highYield: true,
            subtopics: [
              'Integration by parts formula and ILATE priority ordering',
              'Special exponential identity: ∫e^x [f(x) + f\'(x)] dx = e^x f(x) + C',
              'Fundamental Theorem of Calculus and concurrent limit transformation',
              'The 7 Core Definite Properties P0 through P7',
              'King Property P4: ∫₀ᵃ f(x)dx = ∫₀ᵃ f(a-x)dx and P3: ∫ₐᵇ f(x)dx = ∫ₐᵇ f(a+b-x)dx',
              'Even/Odd property P7 and modulus splitting property P2'
            ]
          }
        ]
      },
      {
        id: 'math_12_ch08',
        grade: '12',
        discipline: 'CALCULUS',
        unit: 'Calculus (Unit III - 35M)',
        chapterNumber: 8,
        chapterName: 'Applications of Integrals (AOI)',
        boardExamFocus: {
          highYield: 'Area of region bounded by an ellipse/circle, or region bounded by a parabola and a line (e.g., y² = 4ax and y = mx).',
          standardTrap: 'Rough sketch is mandatory; board examiners deduct 1 full mark if the area is evaluated without a labeled graph.',
          questionType: '3-mark or 5-mark area computation with rough graph drawing.'
        },
        topics: [
          {
            id: 'math_12_ch08_t1',
            topicName: 'Area Under Simple Curves',
            ncertSection: '8.1',
            highYield: true,
            subtopics: [
              'Vertical slicing strips (Area = ∫ y dx) and horizontal strips (Area = ∫ x dy)',
              'Standard curve geometries: Circles x² + y² = r², parabolas y² = 4ax, x² = 4ay',
              'Ellipses x²/a² + y²/b² = 1 (deriving area πab using ∫√(a² - x²) dx)'
            ]
          },
          {
            id: 'math_12_ch08_t2',
            topicName: 'Bounded Region Integrals',
            ncertSection: '8.2',
            highYield: true,
            subtopics: [
              'Finding intersection points by solving simultaneous curve equations',
              'Mandatory rough sketch, vertices labeling, and shading target region',
              'Partitioning compound regions with vertical drop lines'
            ]
          }
        ]
      },
      {
        id: 'math_12_ch09',
        grade: '12',
        discipline: 'CALCULUS',
        unit: 'Calculus (Unit III - 35M)',
        chapterNumber: 9,
        chapterName: 'Differential Equations',
        boardExamFocus: {
          highYield: 'Linear Differential Equations (LDE: dy/dx + Py = Q) and Homogeneous Equations with particular boundary values (x = x₀, y = y₀).',
          standardTrap: 'Writing degree as defined when derivatives are trapped inside transcendental functions (e.g., d²y/dx² + sin(dy/dx) = 0 ⇒ degree undefined).',
          questionType: '3-mark or 5-mark general/particular solution of LDE or Homogeneous form.'
        },
        topics: [
          {
            id: 'math_12_ch09_t1',
            topicName: 'Classification',
            ncertSection: '9.1',
            highYield: false,
            subtopics: [
              'Order: Highest order derivative present in equation',
              'Degree: Highest power of highest order derivative (polynomial in derivatives)',
              'Recognizing undefined degree cases: sin(y\'), e^(y\'), ln(y\')'
            ]
          },
          {
            id: 'math_12_ch09_t2',
            topicName: 'Formation and Solution Types',
            ncertSection: '9.2',
            highYield: false,
            subtopics: [
              'General Solution (arbitrary constants equal to order)',
              'Particular Solution (zero arbitrary constants, boundary values)'
            ]
          },
          {
            id: 'math_12_ch09_t3',
            topicName: 'Solution of First Order, First Degree Equations',
            ncertSection: '9.3',
            highYield: true,
            subtopics: [
              'Type 1: Variable Separable f(y)dy = g(x)dx',
              'Type 2: Homogeneous Equations y = vx ⇒ dy/dx = v + x dv/dx',
              'Type 3: Linear Differential Equations (LDE) dy/dx + Py = Q, IF = e^∫Pdx',
              'Type 3: LDE dx/dy + P₁x = Q₁, IF = e^∫P₁dy'
            ]
          }
        ]
      },

      // --- UNIT IV: VECTORS AND THREE-DIMENSIONAL GEOMETRY (14 MARKS) ---
      {
        id: 'math_12_ch10',
        grade: '12',
        discipline: 'VECTORS & 3D',
        unit: 'Vectors and Three-Dimensional Geometry (Unit IV - 14M)',
        chapterNumber: 10,
        chapterName: 'Vector Algebra',
        boardExamFocus: {
          highYield: 'Finding a unit vector perpendicular to two given vectors; Finding the projection of a on b; Evaluating |a + b + c| given a + b + c = 0.',
          standardTrap: 'Omitting the factor of 1/2 when finding parallelogram area given its diagonals vs its adjacent sides.',
          questionType: '2-mark projection/dot-product, 3-mark perpendicular unit vectors or norm expansion.'
        },
        topics: [
          {
            id: 'math_12_ch10_t1',
            topicName: 'Vector Basics and Algebra',
            ncertSection: '10.1',
            highYield: false,
            subtopics: [
              'Position vector r = xi + yj + zk and magnitude |r| = √(x² + y² + z²)',
              'Unit vector â = a / |a|',
              'Direction Cosines (l, m, n) and Direction Ratios (a, b, c): l² + m² + n² = 1',
              'Collinearity condition: b = λa or a₁/a₂ = b₁/b₂ = c₁/c₂',
              'Section Formula for internal and external division'
            ]
          },
          {
            id: 'math_12_ch10_t2',
            topicName: 'Dot Product (Scalar Product)',
            ncertSection: '10.2',
            highYield: true,
            subtopics: [
              'Definition: a · b = |a||b| cos θ',
              'Orthogonality test: a ⊥ b ⇔ a · b = 0',
              'Projection of vector a on vector b: (a · b) / |b|',
              'Expansion of norms: |a ± b|² = |a|² + |b|² ± 2(a · b)'
            ]
          },
          {
            id: 'math_12_ch10_t3',
            topicName: 'Cross Product (Vector Product)',
            ncertSection: '10.3',
            highYield: true,
            subtopics: [
              'Definition: a × b = |a||b| sin θ n̂',
              'Evaluation via 3×3 determinant expansion',
              'Collinearity test: a ∥ b ⇔ a × b = 0',
              'Unit vector perpendicular to both a and b: ±(a × b) / |a × b|',
              'Area of triangle: 1/2 |a × b|; Area of parallelogram with sides: |a × b|',
              'Area of parallelogram with diagonals: 1/2 |d₁ × d₂|'
            ]
          }
        ]
      },
      {
        id: 'math_12_ch11',
        grade: '12',
        discipline: 'VECTORS & 3D',
        unit: 'Vectors and Three-Dimensional Geometry (Unit IV - 14M)',
        chapterNumber: 11,
        chapterName: 'Three-Dimensional Geometry (3D)',
        boardExamFocus: {
          highYield: 'Shortest distance between skew lines d = |((a₂ - a₁) · (b₁ × b₂)) / |b₁ × b₂|| (Almost every year in the 3-mark or 5-mark pool).',
          standardTrap: 'Not standardizing line equations before pulling directional ratios (e.g., transforming (1-x)/2 into (x-1)/(-2)).',
          questionType: 'Guaranteed 3-mark or 5-mark Shortest Distance between Skew / Parallel Lines.'
        },
        topics: [
          {
            id: 'math_12_ch11_t1',
            topicName: 'Direction Cosines and Lines in Space',
            ncertSection: '11.1',
            highYield: true,
            subtopics: [
              'Vector equation of line through point a parallel to vector b: r = a + λb',
              'Cartesian equation of line: (x - x₁)/a = (y - y₁)/b = (z - z₁)/c',
              'Line passing through two points: r = a + λ(b - a)',
              'Cartesian form through two points: (x - x₁)/(x₂ - x₁) = (y - y₁)/(y₂ - y₁) = (z - z₁)/(z₂ - z₁)',
              'Standardizing non-standard line forms like (1-x)/2'
            ]
          },
          {
            id: 'math_12_ch11_t2',
            topicName: 'Shortest Distance Between Lines',
            ncertSection: '11.2',
            highYield: true,
            subtopics: [
              'Skew lines definition and shortest distance: d = |((a₂ - a₁) · (b₁ × b₂)) / |b₁ × b₂||',
              'Condition for intersection of two lines: (a₂ - a₁) · (b₁ × b₂) = 0',
              'Parallel lines shortest distance: d = |(b × (a₂ - a₁)) / |b||'
            ]
          }
        ]
      },

      // --- UNIT V: LINEAR PROGRAMMING (5 MARKS) ---
      {
        id: 'math_12_ch12',
        grade: '12',
        discipline: 'LINEAR PROGRAMMING',
        unit: 'Linear Programming (Unit V - 5M)',
        chapterNumber: 12,
        chapterName: 'Linear Programming (LPP)',
        boardExamFocus: {
          highYield: 'Solving a bounded LPP to maximize/minimize Z graphically using the Corner Point Method (Guaranteed 5-mark question).',
          standardTrap: 'Shading the incorrect half-plane by failing to test with (0,0); omitting axis labels, scale, and vertex evaluation table.',
          questionType: 'Guaranteed 5-mark Graphical Corner Point Optimization problem.'
        },
        topics: [
          {
            id: 'math_12_ch12_t1',
            topicName: 'Formulation and Geometry',
            ncertSection: '12.1',
            highYield: false,
            subtopics: [
              'Objective function Z = ax + by, decision variables x, y ≥ 0, constraints',
              'Plotting linear boundary equations and testing half-planes with (0, 0)',
              'Identifying the Feasible Region as intersection of half-planes'
            ]
          },
          {
            id: 'math_12_ch12_t2',
            topicName: 'Corner Point Method',
            ncertSection: '12.2',
            highYield: true,
            subtopics: [
              'Calculating coordinates of all corner points / vertices',
              'Bounded region: Evaluating Z at all corner points for max/min (5-Mark guaranteed)',
              'Unbounded region: Testing open half-plane ax + by > M or < m'
            ]
          }
        ]
      },

      // --- UNIT VI: PROBABILITY (8 MARKS) ---
      {
        id: 'math_12_ch13',
        grade: '12',
        discipline: 'PROBABILITY',
        unit: 'Probability (Unit VI - 8M)',
        chapterNumber: 13,
        chapterName: 'Probability',
        boardExamFocus: {
          highYield: 'Bayes\' Theorem word problems (frequently in 4-mark Case Studies or 5-mark sections); Finding the probability distribution and mean of a random variable (3 marks).',
          standardTrap: 'Confusing P(E₁|A) with P(A|E₁) in word problem statements.',
          questionType: '4-mark Case Study on Bayes\' Theorem or 3-mark Probability Distribution & Mean.'
        },
        topics: [
          {
            id: 'math_12_ch13_t1',
            topicName: 'Conditional Probability & Multiplication Rule',
            ncertSection: '13.1',
            highYield: true,
            subtopics: [
              'Conditional probability formula: P(A|B) = P(A ∩ B) / P(B)',
              'Multiplication rule: P(A ∩ B) = P(B) · P(A|B)',
              'Independent events test: P(A ∩ B) = P(A) · P(B)',
              'Pairwise independence vs mutual independence'
            ]
          },
          {
            id: 'math_12_ch13_t2',
            topicName: 'Partition of Sample Space & Total Probability',
            ncertSection: '13.2',
            highYield: true,
            subtopics: [
              'Conditions for sample space partition: Disjoint and exhaustive',
              'Theorem of Total Probability: P(A) = Σ P(Ei) · P(A|Ei)'
            ]
          },
          {
            id: 'math_12_ch13_t3',
            topicName: 'Bayes\' Theorem',
            ncertSection: '13.3',
            highYield: true,
            subtopics: [
              'Bayes\' formula: P(Ek|A) = (P(Ek)P(A|Ek)) / (Σ P(Ei)P(A|Ei))',
              'Cause-and-effect reversal problems (machine defects, medical diagnostic tests, truth/lie)'
            ]
          },
          {
            id: 'math_12_ch13_t4',
            topicName: 'Random Variables and Probability Distributions',
            ncertSection: '13.4',
            highYield: true,
            subtopics: [
              'Discrete random variable definition',
              'Constructing probability distribution tables: pi ≥ 0 and Σ pi = 1',
              'Mean / Expected Value calculation: E(X) = μ = Σ xi pi'
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================================
  // 5. CLASS 10 SCIENCE (Chemistry, Biology, Physics, Environment) - Complete 13 Chapters
  // As per Latest Rationalised NCERT Textbook & CBSE / HPBOSE Curriculum
  // ==========================================================================
  'CLASS10_SCIENCE': {
    subjectName: 'Class 10 Science',
    stream: 'FOUNDATION',
    grades: ['10'],
    targetExams: ['CBSE_CLASS_10', 'HP_BOARD_CLASS_10'],
    units: [
      { unitNumber: 'I', unitName: 'Chemical Substances – Nature and Behaviour', weightageMarks: 25, chapters: [1, 2, 3, 4] },
      { unitNumber: 'II', unitName: 'World of Living', weightageMarks: 25, chapters: [5, 6, 7, 8] },
      { unitNumber: 'III', unitName: 'Natural Phenomena', weightageMarks: 12, chapters: [9, 10] },
      { unitNumber: 'IV', unitName: 'Effects of Current', weightageMarks: 13, chapters: [11, 12] },
      { unitNumber: 'V', unitName: 'Natural Resources', weightageMarks: 5, chapters: [13] }
    ],
    chapters: [
      // --- UNIT I: CHEMICAL SUBSTANCES – NATURE AND BEHAVIOUR (25 MARKS) ---
      {
        id: 'c10_sci_ch01',
        grade: '10',
        discipline: 'CHEMISTRY',
        unit: 'Chemical Substances – Nature and Behaviour (Unit I - 25M)',
        chapterNumber: 1,
        chapterName: 'Chemical Reactions and Equations',
        topics: [
          {
            id: 'c10_sci_ch01_t1',
            topicName: 'Chemical Reactions and Chemical Equations',
            ncertSection: '1.1',
            highYield: true,
            subtopics: [
              'What is a chemical reaction?',
              'Writing a chemical equation',
              'Balanced chemical equations',
              'Implications of a balanced chemical equation'
            ]
          },
          {
            id: 'c10_sci_ch01_t2',
            topicName: 'Types of Chemical Reactions',
            ncertSection: '1.2',
            highYield: true,
            subtopics: [
              'Combination reaction',
              'Decomposition reaction',
              'Displacement reaction',
              'Double displacement reaction',
              'Precipitation reaction',
              'Endothermic and exothermic reactions'
            ]
          },
          {
            id: 'c10_sci_ch01_t3',
            topicName: 'Oxidation, Reduction, Corrosion and Rancidity',
            ncertSection: '1.3',
            highYield: true,
            subtopics: [
              'Oxidation',
              'Reduction',
              'Corrosion',
              'Rancidity'
            ]
          }
        ]
      },
      {
        id: 'c10_sci_ch02',
        grade: '10',
        discipline: 'CHEMISTRY',
        unit: 'Chemical Substances – Nature and Behaviour (Unit I - 25M)',
        chapterNumber: 2,
        chapterName: 'Acids, Bases and Salts',
        topics: [
          {
            id: 'c10_sci_ch02_t1',
            topicName: 'Acids, Bases and Indicators',
            ncertSection: '2.1',
            highYield: true,
            subtopics: [
              'Definitions of acids and bases (in terms of H+ and OH- ions)',
              'Indicators (natural and synthetic)',
              'General properties of acids and bases',
              'Examples and uses of acids and bases'
            ]
          },
          {
            id: 'c10_sci_ch02_t2',
            topicName: 'Reactions of Acids and Bases',
            ncertSection: '2.2',
            highYield: true,
            subtopics: [
              'Reaction of acids and bases with metals',
              'Reaction of acids with metal carbonates and hydrogen carbonates',
              'Neutralisation reaction',
              'Reaction of metallic oxides with acids',
              'Reaction of non-metallic oxides with bases'
            ]
          },
          {
            id: 'c10_sci_ch02_t3',
            topicName: 'Acids, Bases in Water and Ion Formation',
            ncertSection: '2.3',
            highYield: true,
            subtopics: [
              'What happens when an acid or base is mixed with water?',
              'Importance of pH in everyday life',
              'pH scale (concept without logarithm)'
            ]
          },
          {
            id: 'c10_sci_ch02_t4',
            topicName: 'Salts and Their Importance',
            ncertSection: '2.4',
            highYield: true,
            subtopics: [
              'Family of salts',
              'pH of salts',
              'Chemicals from common salt',
              'Sodium hydroxide',
              'Bleaching powder',
              'Baking soda',
              'Washing soda',
              'Plaster of Paris'
            ]
          }
        ]
      },
      {
        id: 'c10_sci_ch03',
        grade: '10',
        discipline: 'CHEMISTRY',
        unit: 'Chemical Substances – Nature and Behaviour (Unit I - 25M)',
        chapterNumber: 3,
        chapterName: 'Metals and Non-metals',
        topics: [
          {
            id: 'c10_sci_ch03_t1',
            topicName: 'Physical Properties of Metals and Non-metals',
            ncertSection: '3.1',
            highYield: false,
            subtopics: [
              'Physical properties of metals',
              'Physical properties of non-metals',
              'Exceptions and comparison'
            ]
          },
          {
            id: 'c10_sci_ch03_t2',
            topicName: 'Chemical Properties of Metals',
            ncertSection: '3.2',
            highYield: true,
            subtopics: [
              'Reaction of metals with air / oxygen',
              'Reaction of metals with water',
              'Reaction of metals with acids',
              'Reaction of metals with solutions of other metal salts',
              'Reactivity series'
            ]
          },
          {
            id: 'c10_sci_ch03_t3',
            topicName: 'How do Metals and Non-metals React?',
            ncertSection: '3.3',
            highYield: true,
            subtopics: [
              'Properties of ionic compounds',
              'Formation of ionic compounds'
            ]
          },
          {
            id: 'c10_sci_ch03_t4',
            topicName: 'Occurrence of Metals & Corrosion',
            ncertSection: '3.4',
            highYield: true,
            subtopics: [
              'Extraction of metals',
              'Enrichment of ores',
              'Extracting metals low / middle / high in the reactivity series',
              'Refining of metals',
              'Corrosion and its prevention'
            ]
          }
        ]
      },
      {
        id: 'c10_sci_ch04',
        grade: '10',
        discipline: 'CHEMISTRY',
        unit: 'Chemical Substances – Nature and Behaviour (Unit I - 25M)',
        chapterNumber: 4,
        chapterName: 'Carbon and its Compounds',
        topics: [
          {
            id: 'c10_sci_ch04_t1',
            topicName: 'Carbon: Basic Features and Bonding',
            ncertSection: '4.1',
            highYield: true,
            subtopics: [
              'Bonding in carbon – the covalent bond',
              'Versatile nature of carbon',
              'Saturated and unsaturated carbon compounds'
            ]
          },
          {
            id: 'c10_sci_ch04_t2',
            topicName: 'Chains, Branches and Rings',
            ncertSection: '4.2',
            highYield: true,
            subtopics: [
              'Homologous series',
              'Nomenclature of carbon compounds',
              'Functional groups'
            ]
          },
          {
            id: 'c10_sci_ch04_t3',
            topicName: 'Chemical Properties of Carbon Compounds',
            ncertSection: '4.3',
            highYield: true,
            subtopics: [
              'Combustion',
              'Oxidation',
              'Addition reaction',
              'Substitution reaction'
            ]
          },
          {
            id: 'c10_sci_ch04_t4',
            topicName: 'Important Carbon Compounds',
            ncertSection: '4.4',
            highYield: true,
            subtopics: [
              'Ethanol (properties and uses)',
              'Ethanoic acid (properties and uses)',
              'Soaps and detergents'
            ]
          }
        ]
      },

      // --- UNIT II: WORLD OF LIVING (25 MARKS) ---
      {
        id: 'c10_sci_ch05',
        grade: '10',
        discipline: 'BIOLOGY',
        unit: 'World of Living (Unit II - 25M)',
        chapterNumber: 5,
        chapterName: 'Life Processes',
        topics: [
          {
            id: 'c10_sci_ch05_t1',
            topicName: 'What are Life Processes?',
            ncertSection: '5.1',
            highYield: false,
            subtopics: [
              'Basic concept of life processes'
            ]
          },
          {
            id: 'c10_sci_ch05_t2',
            topicName: 'Nutrition',
            ncertSection: '5.2',
            highYield: true,
            subtopics: [
              'Autotrophic nutrition',
              'Heterotrophic nutrition',
              'How do organisms obtain their nutrition?',
              'Nutrition in human beings (digestive system)'
            ]
          },
          {
            id: 'c10_sci_ch05_t3',
            topicName: 'Respiration',
            ncertSection: '5.3',
            highYield: true,
            subtopics: [
              'Aerobic and anaerobic respiration',
              'Respiration in plants',
              'Respiration in animals / human respiratory system'
            ]
          },
          {
            id: 'c10_sci_ch05_t4',
            topicName: 'Transportation',
            ncertSection: '5.4',
            highYield: true,
            subtopics: [
              'Transportation in human beings (circulatory system)',
              'Transportation in plants (xylem and phloem)'
            ]
          },
          {
            id: 'c10_sci_ch05_t5',
            topicName: 'Excretion',
            ncertSection: '5.5',
            highYield: true,
            subtopics: [
              'Excretion in human beings (nephron structure & urine formation)',
              'Excretion in plants'
            ]
          }
        ]
      },
      {
        id: 'c10_sci_ch06',
        grade: '10',
        discipline: 'BIOLOGY',
        unit: 'World of Living (Unit II - 25M)',
        chapterNumber: 6,
        chapterName: 'Control and Coordination',
        topics: [
          {
            id: 'c10_sci_ch06_t1',
            topicName: 'Animals – Nervous System',
            ncertSection: '6.1',
            highYield: true,
            subtopics: [
              'What happens in reflex actions?',
              'Human brain',
              'How are these tissues protected?',
              'How does the nervous tissue cause action?'
            ]
          },
          {
            id: 'c10_sci_ch06_t2',
            topicName: 'Coordination in Plants',
            ncertSection: '6.2',
            highYield: true,
            subtopics: [
              'Immediate response to stimulus',
              'Movement due to growth (tropic movements)',
              'Plant hormones (Auxins, Gibberellins, Cytokinins, Abscisic acid)'
            ]
          },
          {
            id: 'c10_sci_ch06_t3',
            topicName: 'Hormones in Animals',
            ncertSection: '6.3',
            highYield: true,
            subtopics: [
              'Endocrine glands and hormones (Pituitary, Thyroid, Adrenal, Pancreas, Gonads)',
              'Feedback mechanism'
            ]
          }
        ]
      },
      {
        id: 'c10_sci_ch07',
        grade: '10',
        discipline: 'BIOLOGY',
        unit: 'World of Living (Unit II - 25M)',
        chapterNumber: 7,
        chapterName: 'How do Organisms Reproduce?',
        topics: [
          {
            id: 'c10_sci_ch07_t1',
            topicName: 'Do Organisms Create Exact Copies of Themselves?',
            ncertSection: '7.1',
            highYield: true,
            subtopics: [
              'The importance of variation'
            ]
          },
          {
            id: 'c10_sci_ch07_t2',
            topicName: 'Modes of Reproduction Used by Single Organisms',
            ncertSection: '7.2',
            highYield: true,
            subtopics: [
              'Fission',
              'Fragmentation',
              'Regeneration',
              'Budding',
              'Vegetative propagation',
              'Spore formation'
            ]
          },
          {
            id: 'c10_sci_ch07_t3',
            topicName: 'Sexual Reproduction',
            ncertSection: '7.3',
            highYield: true,
            subtopics: [
              'Why the sexual mode of reproduction?',
              'Sexual reproduction in flowering plants',
              'Reproduction in human beings',
              'Male reproductive system',
              'Female reproductive system',
              'Reproductive health'
            ]
          }
        ]
      },
      {
        id: 'c10_sci_ch08',
        grade: '10',
        discipline: 'BIOLOGY',
        unit: 'World of Living (Unit II - 25M)',
        chapterNumber: 8,
        chapterName: 'Heredity',
        topics: [
          {
            id: 'c10_sci_ch08_t1',
            topicName: 'Accumulation of Variation During Reproduction',
            ncertSection: '8.1',
            highYield: false,
            subtopics: [
              'Variation and heredity'
            ]
          },
          {
            id: 'c10_sci_ch08_t2',
            topicName: 'Heredity',
            ncertSection: '8.2',
            highYield: true,
            subtopics: [
              'Inherited traits',
              'Rules for the inheritance of traits – Mendel’s contributions (Monohybrid & Dihybrid cross)',
              'How do these traits get expressed?',
              'Sex determination'
            ]
          }
        ]
      },

      // --- UNIT III: NATURAL PHENOMENA (12 MARKS) ---
      {
        id: 'c10_sci_ch09',
        grade: '10',
        discipline: 'PHYSICS',
        unit: 'Natural Phenomena (Unit III - 12M)',
        chapterNumber: 9,
        chapterName: 'Light – Reflection and Refraction',
        topics: [
          {
            id: 'c10_sci_ch09_t1',
            topicName: 'Reflection of Light',
            ncertSection: '9.1',
            highYield: true,
            subtopics: [
              'Laws of reflection of light',
              'Spherical mirrors',
              'Image formation by spherical mirrors',
              'Representation of images formed by spherical mirrors using ray diagrams',
              'Mirror formula and magnification'
            ]
          },
          {
            id: 'c10_sci_ch09_t2',
            topicName: 'Refraction of Light',
            ncertSection: '9.2',
            highYield: true,
            subtopics: [
              'Refraction through a rectangular glass slab',
              'The refractive index',
              'Refraction by spherical lenses',
              'Image formation by lenses',
              'Sign convention for spherical lenses',
              'Lens formula and magnification',
              'Power of a lens'
            ]
          }
        ]
      },
      {
        id: 'c10_sci_ch10',
        grade: '10',
        discipline: 'PHYSICS',
        unit: 'Natural Phenomena (Unit III - 12M)',
        chapterNumber: 10,
        chapterName: 'The Human Eye and the Colourful World',
        topics: [
          {
            id: 'c10_sci_ch10_t1',
            topicName: 'The Human Eye',
            ncertSection: '10.1',
            highYield: true,
            subtopics: [
              'Structure and working of the human eye',
              'Power of accommodation',
              'Defects of vision and their correction',
              'Myopia (near-sightedness)',
              'Hypermetropia (far-sightedness)',
              'Presbyopia'
            ]
          },
          {
            id: 'c10_sci_ch10_t2',
            topicName: 'Refraction of Light Through a Prism',
            ncertSection: '10.2',
            highYield: true,
            subtopics: [
              'Dispersion of white light by a glass prism',
              'Atmospheric refraction',
              'Scattering of light',
              'Tyndall effect',
              'Applications (why is the sky blue, colour of the sun at sunrise/sunset – as applicable)'
            ]
          }
        ]
      },

      // --- UNIT IV: EFFECTS OF CURRENT (13 MARKS) ---
      {
        id: 'c10_sci_ch11',
        grade: '10',
        discipline: 'PHYSICS',
        unit: 'Effects of Current (Unit IV - 13M)',
        chapterNumber: 11,
        chapterName: 'Electricity',
        topics: [
          {
            id: 'c10_sci_ch11_t1',
            topicName: 'Electric Current and Circuit',
            ncertSection: '11.1',
            highYield: true,
            subtopics: [
              'Electric current',
              'Electric circuit',
              'Electric potential and potential difference',
              'Circuit diagram'
            ]
          },
          {
            id: 'c10_sci_ch11_t2',
            topicName: 'Ohm’s Law',
            ncertSection: '11.2',
            highYield: true,
            subtopics: [
              'Factors on which the resistance of a conductor depends',
              'Resistance of a system of resistors',
              'Series combination of resistors',
              'Parallel combination of resistors'
            ]
          },
          {
            id: 'c10_sci_ch11_t3',
            topicName: 'Heating Effect of Electric Current',
            ncertSection: '11.3',
            highYield: true,
            subtopics: [
              'Joule’s law of heating',
              'Practical applications of heating effect of electric current',
              'Electric power'
            ]
          }
        ]
      },
      {
        id: 'c10_sci_ch12',
        grade: '10',
        discipline: 'PHYSICS',
        unit: 'Effects of Current (Unit IV - 13M)',
        chapterNumber: 12,
        chapterName: 'Magnetic Effects of Electric Current',
        topics: [
          {
            id: 'c10_sci_ch12_t1',
            topicName: 'Magnetic Field and Field Lines',
            ncertSection: '12.1',
            highYield: true,
            subtopics: [
              'Magnetic field and magnetic field lines',
              'Magnetic field due to a current-carrying conductor',
              'Right-hand thumb rule',
              'Magnetic field due to a current through a circular loop',
              'Magnetic field due to a current in a solenoid'
            ]
          },
          {
            id: 'c10_sci_ch12_t2',
            topicName: 'Force on a Current-carrying Conductor in a Magnetic Field',
            ncertSection: '12.2',
            highYield: true,
            subtopics: [
              'Fleming’s left-hand rule',
              'Electric motor'
            ]
          },
          {
            id: 'c10_sci_ch12_t3',
            topicName: 'Electromagnetic Induction',
            ncertSection: '12.3',
            highYield: true,
            subtopics: [
              'Electromagnetic induction',
              'Fleming’s right-hand rule',
              'Electric generator',
              'Domestic electric circuits'
            ]
          }
        ]
      },

      // --- UNIT V: NATURAL RESOURCES (5 MARKS) ---
      {
        id: 'c10_sci_ch13',
        grade: '10',
        discipline: 'ENVIRONMENT',
        unit: 'Natural Resources (Unit V - 5M)',
        chapterNumber: 13,
        chapterName: 'Our Environment',
        topics: [
          {
            id: 'c10_sci_ch13_t1',
            topicName: 'Ecosystem – What are its Components?',
            ncertSection: '13.1',
            highYield: true,
            subtopics: [
              'Ecosystem and its components',
              'Producers, consumers and decomposers',
              'Food chains and food webs',
              'Trophic levels'
            ]
          },
          {
            id: 'c10_sci_ch13_t2',
            topicName: 'How do We Affect Our Environment?',
            ncertSection: '13.2',
            highYield: true,
            subtopics: [
              'Ozone layer and how it is getting depleted',
              'Managing the garbage we produce',
              'Biodegradable and non-biodegradable substances'
            ]
          }
        ]
      }
    ]
  },

  // ==========================================================================
  // 6. CLASS 10 MATHEMATICS - Foundation
  // ==========================================================================
  // ==========================================================================
  // 6. CLASS 10 MATHEMATICS - Complete 14 Chapters
  // As per Latest Rationalised NCERT Textbook & CBSE / HPBOSE Curriculum
  // ==========================================================================
  'CLASS10_MATHEMATICS': {
    subjectName: 'Class 10 Mathematics',
    stream: 'FOUNDATION',
    grades: ['10'],
    targetExams: ['CBSE_CLASS_10', 'HP_BOARD_CLASS_10'],
    units: [
      { unitNumber: 'I', unitName: 'Number Systems', weightageMarks: 6, chapters: [1] },
      { unitNumber: 'II', unitName: 'Algebra', weightageMarks: 20, chapters: [2, 3, 4, 5] },
      { unitNumber: 'III', unitName: 'Coordinate Geometry', weightageMarks: 6, chapters: [7] },
      { unitNumber: 'IV', unitName: 'Geometry', weightageMarks: 15, chapters: [6, 10] },
      { unitNumber: 'V', unitName: 'Trigonometry', weightageMarks: 12, chapters: [8, 9] },
      { unitNumber: 'VI', unitName: 'Mensuration', weightageMarks: 10, chapters: [11, 12] },
      { unitNumber: 'VII', unitName: 'Statistics & Probability', weightageMarks: 11, chapters: [13, 14] }
    ],
    chapters: [
      // --- UNIT I: NUMBER SYSTEMS (6 MARKS) ---
      {
        id: 'c10_math_ch01',
        grade: '10',
        discipline: 'NUMBER SYSTEMS',
        unit: 'Number Systems (Unit I - 6M)',
        chapterNumber: 1,
        chapterName: 'Real Numbers',
        topics: [
          {
            id: 'c10_math_ch01_t1',
            topicName: 'Introduction',
            ncertSection: '1.1',
            highYield: false,
            subtopics: [
              'Review of natural numbers, whole numbers, integers, rational numbers',
              'Introduction to real numbers'
            ]
          },
          {
            id: 'c10_math_ch01_t2',
            topicName: 'The Fundamental Theorem of Arithmetic',
            ncertSection: '1.2',
            highYield: true,
            subtopics: [
              'Statement of the Fundamental Theorem of Arithmetic',
              'Unique prime factorisation of natural numbers',
              'Applications: Finding HCF using prime factorisation',
              'Applications: Finding LCM using prime factorisation',
              'Relation: HCF × LCM = Product of two numbers'
            ]
          },
          {
            id: 'c10_math_ch01_t3',
            topicName: 'Revisiting Irrational Numbers',
            ncertSection: '1.3',
            highYield: true,
            subtopics: [
              'Definition of irrational numbers',
              'Proofs of irrationality of √2, √3, √5',
              'Applications of irrational numbers'
            ]
          }
        ]
      },

      // --- UNIT II: ALGEBRA (20 MARKS) ---
      {
        id: 'c10_math_ch02',
        grade: '10',
        discipline: 'ALGEBRA',
        unit: 'Algebra (Unit II - 20M)',
        chapterNumber: 2,
        chapterName: 'Polynomials',
        topics: [
          {
            id: 'c10_math_ch02_t1',
            topicName: 'Introduction',
            ncertSection: '2.1',
            highYield: false,
            subtopics: [
              'Definition of a polynomial',
              'Degree of a polynomial',
              'Types: linear, quadratic, cubic polynomials'
            ]
          },
          {
            id: 'c10_math_ch02_t2',
            topicName: 'Geometrical Meaning of the Zeroes of a Polynomial',
            ncertSection: '2.2',
            highYield: true,
            subtopics: [
              'Zeroes of a polynomial (roots)',
              'Graphical representation: intersection with x-axis',
              'Number of zeroes of a polynomial'
            ]
          },
          {
            id: 'c10_math_ch02_t3',
            topicName: 'Relationship between Zeroes and Coefficients of a Polynomial',
            ncertSection: '2.3',
            highYield: true,
            subtopics: [
              'For a quadratic polynomial ax² + bx + c: Sum of zeroes = –b/a',
              'For a quadratic polynomial ax² + bx + c: Product of zeroes = c/a',
              'Finding a quadratic polynomial given its zeroes',
              'Verification of the relationship'
            ]
          }
        ]
      },
      {
        id: 'c10_math_ch03',
        grade: '10',
        discipline: 'ALGEBRA',
        unit: 'Algebra (Unit II - 20M)',
        chapterNumber: 3,
        chapterName: 'Pair of Linear Equations in Two Variables',
        topics: [
          {
            id: 'c10_math_ch03_t1',
            topicName: 'Introduction',
            ncertSection: '3.1',
            highYield: false,
            subtopics: [
              'General form: a₁x + b₁y + c₁ = 0 and a₂x + b₂y + c₂ = 0',
              'Solution of a pair of linear equations'
            ]
          },
          {
            id: 'c10_math_ch03_t2',
            topicName: 'Graphical Method of Solution',
            ncertSection: '3.2',
            highYield: true,
            subtopics: [
              'Plotting the two lines on the Cartesian plane',
              'Unique solution (intersecting lines: a1/a2 != b1/b2)',
              'No solution (parallel lines: a1/a2 = b1/b2 != c1/c2)',
              'Infinitely many solutions (coincident lines: a1/a2 = b1/b2 = c1/c2)',
              'Consistency / inconsistency of the system'
            ]
          },
          {
            id: 'c10_math_ch03_t3',
            topicName: 'Algebraic Methods of Solving a Pair of Linear Equations',
            ncertSection: '3.3',
            highYield: true,
            subtopics: [
              '3.3.1 Substitution Method (Steps of substitution, solving for one variable)',
              '3.3.2 Elimination Method (Making coefficients equal, adding/subtracting equations)'
            ]
          },
          {
            id: 'c10_math_ch03_t4',
            topicName: 'Situational / Word Problems',
            ncertSection: '3.4',
            highYield: true,
            subtopics: [
              'Forming equations from real-life situations (ages, digits, speed-distance)',
              'Solving and interpreting the solution'
            ]
          }
        ]
      },
      {
        id: 'c10_math_ch04',
        grade: '10',
        discipline: 'ALGEBRA',
        unit: 'Algebra (Unit II - 20M)',
        chapterNumber: 4,
        chapterName: 'Quadratic Equations',
        topics: [
          {
            id: 'c10_math_ch04_t1',
            topicName: 'Introduction',
            ncertSection: '4.1',
            highYield: false,
            subtopics: [
              'Standard form: ax² + bx + c = 0 (a ≠ 0)',
              'Quadratic equation vs quadratic polynomial'
            ]
          },
          {
            id: 'c10_math_ch04_t2',
            topicName: 'Quadratic Equations',
            ncertSection: '4.2',
            highYield: true,
            subtopics: [
              'Identifying quadratic equations',
              'Roots of a quadratic equation'
            ]
          },
          {
            id: 'c10_math_ch04_t3',
            topicName: 'Solution of a Quadratic Equation by Factorisation',
            ncertSection: '4.3',
            highYield: true,
            subtopics: [
              'Factorisation method (splitting the middle term)',
              'Solving by equating each linear factor to zero'
            ]
          },
          {
            id: 'c10_math_ch04_t4',
            topicName: 'Nature of Roots',
            ncertSection: '4.4',
            highYield: true,
            subtopics: [
              'Quadratic formula: x = (-b ± √(b² - 4ac)) / (2a)',
              'Discriminant (D = b² – 4ac)',
              'D > 0 → two distinct real roots',
              'D = 0 → two equal real roots',
              'D < 0 → no real roots',
              'Situational problems leading to quadratic equations'
            ]
          }
        ]
      },
      {
        id: 'c10_math_ch05',
        grade: '10',
        discipline: 'ALGEBRA',
        unit: 'Algebra (Unit II - 20M)',
        chapterNumber: 5,
        chapterName: 'Arithmetic Progressions',
        topics: [
          {
            id: 'c10_math_ch05_t1',
            topicName: 'Introduction',
            ncertSection: '5.1',
            highYield: false,
            subtopics: [
              'Motivation for studying sequences',
              'Examples of arithmetic progressions in daily life'
            ]
          },
          {
            id: 'c10_math_ch05_t2',
            topicName: 'Arithmetic Progressions',
            ncertSection: '5.2',
            highYield: true,
            subtopics: [
              'Definition of an Arithmetic Progression (AP)',
              'Common difference (d)',
              'General form of an AP: a, a+d, a+2d...'
            ]
          },
          {
            id: 'c10_math_ch05_t3',
            topicName: 'nth Term of an AP',
            ncertSection: '5.3',
            highYield: true,
            subtopics: [
              'Formula: an = a + (n – 1)d',
              'Finding any term of an AP',
              'Finding the number of terms'
            ]
          },
          {
            id: 'c10_math_ch05_t4',
            topicName: 'Sum of First n Terms of an AP',
            ncertSection: '5.4',
            highYield: true,
            subtopics: [
              'Formula: Sn = n/2 [2a + (n – 1)d]',
              'Alternative form: Sn = n/2 (a + l)',
              'Applications in solving daily-life problems'
            ]
          }
        ]
      },

      // --- UNIT IV: GEOMETRY (15 MARKS) ---
      {
        id: 'c10_math_ch06',
        grade: '10',
        discipline: 'GEOMETRY',
        unit: 'Geometry (Unit IV - 15M)',
        chapterNumber: 6,
        chapterName: 'Triangles',
        topics: [
          {
            id: 'c10_math_ch06_t1',
            topicName: 'Introduction',
            ncertSection: '6.1',
            highYield: false,
            subtopics: [
              'Review of congruence of triangles',
              'Introduction to similar figures'
            ]
          },
          {
            id: 'c10_math_ch06_t2',
            topicName: 'Similar Figures',
            ncertSection: '6.2',
            highYield: false,
            subtopics: [
              'Definition of similar figures',
              'Difference between congruence and similarity'
            ]
          },
          {
            id: 'c10_math_ch06_t3',
            topicName: 'Similarity of Triangles',
            ncertSection: '6.3',
            highYield: true,
            subtopics: [
              'Definition of similar triangles',
              'Basic Proportionality Theorem (Thales’ Theorem) – Statement and Proof',
              'Converse of Basic Proportionality Theorem (Statement only)'
            ]
          },
          {
            id: 'c10_math_ch06_t4',
            topicName: 'Criteria for Similarity of Triangles',
            ncertSection: '6.4',
            highYield: true,
            subtopics: [
              'AA (Angle-Angle) similarity criterion',
              'SSS (Side-Side-Side) similarity criterion',
              'SAS (Side-Angle-Side) similarity criterion',
              'Applications of similarity criteria'
            ]
          }
        ]
      },

      // --- UNIT III: COORDINATE GEOMETRY (6 MARKS) ---
      {
        id: 'c10_math_ch07',
        grade: '10',
        discipline: 'COORDINATE GEOMETRY',
        unit: 'Coordinate Geometry (Unit III - 6M)',
        chapterNumber: 7,
        chapterName: 'Coordinate Geometry',
        topics: [
          {
            id: 'c10_math_ch07_t1',
            topicName: 'Introduction',
            ncertSection: '7.1',
            highYield: false,
            subtopics: [
              'Review of Cartesian plane and coordinates',
              'Plotting points'
            ]
          },
          {
            id: 'c10_math_ch07_t2',
            topicName: 'Distance Formula',
            ncertSection: '7.2',
            highYield: true,
            subtopics: [
              'Derivation of distance formula',
              'Distance between two points: d = √((x₂ - x₁)² + (y₂ - y₁)²)',
              'Applications: verifying collinearity, finding length of sides of polygons'
            ]
          },
          {
            id: 'c10_math_ch07_t3',
            topicName: 'Section Formula',
            ncertSection: '7.3',
            highYield: true,
            subtopics: [
              'Section formula for internal division: ((m₁x₂ + m₂x₁)/(m₁ + m₂), (m₁y₂ + m₂y₁)/(m₁ + m₂))',
              'Coordinates of a point dividing a line segment in the ratio m : n',
              'Mid-point formula (special case: ((x₁+x₂)/2, (y₁+y₂)/2))',
              'Applications (centroid, ratio finding, collinearity)'
            ]
          }
        ]
      },

      // --- UNIT V: TRIGONOMETRY (12 MARKS) ---
      {
        id: 'c10_math_ch08',
        grade: '10',
        discipline: 'TRIGONOMETRY',
        unit: 'Trigonometry (Unit V - 12M)',
        chapterNumber: 8,
        chapterName: 'Introduction to Trigonometry',
        topics: [
          {
            id: 'c10_math_ch08_t1',
            topicName: 'Introduction',
            ncertSection: '8.1',
            highYield: true,
            subtopics: [
              'Trigonometric ratios of an acute angle in a right-angled triangle',
              'Definition of sin θ, cos θ, tan θ, cosec θ, sec θ, cot θ',
              'Proof that the ratios are well-defined',
              'Trigonometric ratios of 0° and 90° (motivation)'
            ]
          },
          {
            id: 'c10_math_ch08_t2',
            topicName: 'Trigonometric Ratios of Some Specific Angles',
            ncertSection: '8.2',
            highYield: true,
            subtopics: [
              'Values of trigonometric ratios for 30°, 45°, 60°',
              'Standard angles table (0°, 30°, 45°, 60°, 90°)'
            ]
          },
          {
            id: 'c10_math_ch08_t3',
            topicName: 'Trigonometric Ratios of Complementary Angles',
            ncertSection: '8.3',
            highYield: true,
            subtopics: [
              'sin (90° – A) = cos A',
              'cos (90° – A) = sin A',
              'tan (90° – A) = cot A',
              'cosec (90° – A) = sec A',
              'sec (90° – A) = cosec A',
              'cot (90° – A) = tan A'
            ]
          },
          {
            id: 'c10_math_ch08_t4',
            topicName: 'Trigonometric Identities',
            ncertSection: '8.4',
            highYield: true,
            subtopics: [
              'Proof of sin²A + cos²A = 1',
              'Derived identity: 1 + tan²A = sec²A',
              'Derived identity: 1 + cot²A = cosec²A',
              'Applications of identities in trigonometric proofs'
            ]
          }
        ]
      },
      {
        id: 'c10_math_ch09',
        grade: '10',
        discipline: 'TRIGONOMETRY',
        unit: 'Trigonometry (Unit V - 12M)',
        chapterNumber: 9,
        chapterName: 'Some Applications of Trigonometry',
        topics: [
          {
            id: 'c10_math_ch09_t1',
            topicName: 'Heights and Distances',
            ncertSection: '9.1',
            highYield: true,
            subtopics: [
              'Angle of elevation',
              'Angle of depression',
              'Simple problems involving heights and distances',
              'Problems restricted to angles 30°, 45°, 60°',
              'Problems involving not more than two right triangles'
            ]
          }
        ]
      },

      // --- UNIT IV: GEOMETRY (CIRCLES - 15M CONT.) ---
      {
        id: 'c10_math_ch10',
        grade: '10',
        discipline: 'GEOMETRY',
        unit: 'Geometry (Unit IV - 15M)',
        chapterNumber: 10,
        chapterName: 'Circles',
        topics: [
          {
            id: 'c10_math_ch10_t1',
            topicName: 'Introduction',
            ncertSection: '10.1',
            highYield: false,
            subtopics: [
              'Review of circle and related terms',
              'Tangent to a circle'
            ]
          },
          {
            id: 'c10_math_ch10_t2',
            topicName: 'Tangent to a Circle',
            ncertSection: '10.2',
            highYield: true,
            subtopics: [
              'Definition of a tangent',
              'Theorem: The tangent at any point of a circle is perpendicular to the radius through the point of contact (Proof)',
              'Number of tangents from a point on the circle'
            ]
          },
          {
            id: 'c10_math_ch10_t3',
            topicName: 'Number of Tangents from a Point on a Circle',
            ncertSection: '10.3',
            highYield: true,
            subtopics: [
              'Theorem: The lengths of tangents drawn from an external point to a circle are equal (Proof)',
              'Applications of the tangent theorems'
            ]
          }
        ]
      },

      // --- UNIT VI: MENSURATION (10 MARKS) ---
      {
        id: 'c10_math_ch11',
        grade: '10',
        discipline: 'MENSURATION',
        unit: 'Mensuration (Unit VI - 10M)',
        chapterNumber: 11,
        chapterName: 'Areas Related to Circles',
        topics: [
          {
            id: 'c10_math_ch11_t1',
            topicName: 'Perimeter and Area of a Circle – A Review',
            ncertSection: '11.1',
            highYield: false,
            subtopics: [
              'Circumference and area formulae (2πr, πr²)'
            ]
          },
          {
            id: 'c10_math_ch11_t2',
            topicName: 'Areas of Sector and Segment of a Circle',
            ncertSection: '11.2',
            highYield: true,
            subtopics: [
              'Area of a sector: (θ/360) × πr²',
              'Area of a segment: Area of sector - Area of triangle',
              'Problems restricted to central angles 60°, 90°, 120°',
              'Problems on areas and perimeter of plane figures involving sectors and segments'
            ]
          }
        ]
      },
      {
        id: 'c10_math_ch12',
        grade: '10',
        discipline: 'MENSURATION',
        unit: 'Mensuration (Unit VI - 10M)',
        chapterNumber: 12,
        chapterName: 'Surface Areas and Volumes',
        topics: [
          {
            id: 'c10_math_ch12_t1',
            topicName: 'Introduction',
            ncertSection: '12.1',
            highYield: false,
            subtopics: [
              'Surface areas and volumes of basic solids (review)'
            ]
          },
          {
            id: 'c10_math_ch12_t2',
            topicName: 'Surface Area of a Combination of Solids',
            ncertSection: '12.2',
            highYield: true,
            subtopics: [
              'Combination of any two of: cube, cuboid, sphere, hemisphere, right circular cylinder, right circular cone',
              'Finding total surface area of combined solids'
            ]
          },
          {
            id: 'c10_math_ch12_t3',
            topicName: 'Volume of a Combination of Solids',
            ncertSection: '12.3',
            highYield: true,
            subtopics: [
              'Volume of combination of two solids',
              'Conversion of one solid into another',
              'Application problems'
            ]
          }
        ]
      },

      // --- UNIT VII: STATISTICS & PROBABILITY (11 MARKS) ---
      {
        id: 'c10_math_ch13',
        grade: '10',
        discipline: 'STATISTICS',
        unit: 'Statistics & Probability (Unit VII - 11M)',
        chapterNumber: 13,
        chapterName: 'Statistics',
        topics: [
          {
            id: 'c10_math_ch13_t1',
            topicName: 'Introduction',
            ncertSection: '13.1',
            highYield: false,
            subtopics: [
              'Review of mean, median, mode of ungrouped data'
            ]
          },
          {
            id: 'c10_math_ch13_t2',
            topicName: 'Mean of Grouped Data',
            ncertSection: '13.2',
            highYield: true,
            subtopics: [
              'Direct method: x̄ = Σ(fi·xi) / Σfi',
              'Assumed mean method: x̄ = a + Σ(fi·di) / Σfi',
              'Step-deviation method: x̄ = a + (Σ(fi·ui) / Σfi) × h'
            ]
          },
          {
            id: 'c10_math_ch13_t3',
            topicName: 'Mode of Grouped Data',
            ncertSection: '13.3',
            highYield: true,
            subtopics: [
              'Formula for mode: l + ((f₁ - f₀) / (2f₁ - f₀ - f₂)) × h',
              'Modal class identification'
            ]
          },
          {
            id: 'c10_math_ch13_t4',
            topicName: 'Median of Grouped Data',
            ncertSection: '13.4',
            highYield: true,
            subtopics: [
              'Cumulative frequency (less than type)',
              'Formula for median: l + (((n/2) - cf) / f) × h',
              'Median class identification',
              'Empirical relationship: 3 Median = Mode + 2 Mean',
              'Note: Bimodal situations to be avoided'
            ]
          }
        ]
      },
      {
        id: 'c10_math_ch14',
        grade: '10',
        discipline: 'PROBABILITY',
        unit: 'Statistics & Probability (Unit VII - 11M)',
        chapterNumber: 14,
        chapterName: 'Probability',
        topics: [
          {
            id: 'c10_math_ch14_t1',
            topicName: 'Probability – A Theoretical Approach',
            ncertSection: '14.1',
            highYield: true,
            subtopics: [
              'Classical definition of probability',
              'Probability of an event P(E) = Number of favourable outcomes / Total number of outcomes',
              'Simple problems on finding the probability of an event',
              'Experiments with equally likely outcomes (coins, dice, pack of 52 cards)',
              'Connection with probability concepts from Class 9'
            ]
          }
        ]
      }
    ]
  }
};

/**
 * Helper function to retrieve all chapters & topics for a subject
 */
function getSubjectTaxonomy(subjectKey) {
  const normKey = (subjectKey || 'BIOLOGY').toUpperCase().replace(/\s+/g, '_');
  return CURRICULUM_TAXONOMY[normKey] || CURRICULUM_TAXONOMY['BIOLOGY'];
}

/**
 * Helper function to list all supported subjects
 */
function listAvailableSubjects() {
  return Object.keys(CURRICULUM_TAXONOMY).map(key => ({
    key,
    name: CURRICULUM_TAXONOMY[key].subjectName,
    stream: CURRICULUM_TAXONOMY[key].stream,
    grades: CURRICULUM_TAXONOMY[key].grades,
    totalChapters: CURRICULUM_TAXONOMY[key].chapters.length,
    targetExams: CURRICULUM_TAXONOMY[key].targetExams
  }));
}

module.exports = {
  CURRICULUM_TAXONOMY,
  getSubjectTaxonomy,
  listAvailableSubjects
};
