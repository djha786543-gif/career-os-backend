export const PROFILES = {
  dj: {
    name: "Deobrat Jha",
    title: "IT Audit Manager",
    initials: "DJ",
    domain: "IT Audit, AI Governance, Cloud Security, GRC, SOX Compliance",
    color: "#06b6d4",
    colorDim: "rgba(6,182,212,.15)",
    colorBorder: "rgba(6,182,212,.35)",
    currentRole: "IT Audit Manager at Public Storage Corporation",
    certs: "CISA, AWS Cloud Practitioner, Lean Six Sigma Black Belt, Certified Scrum Master",
    activeCert: "ISACA AAIA (AI Auditing & Assurance) — exam March 2026",
    targetRole: "AI Audit Director / VP of IT Risk / CISO",
    skills: "SOX 404, ITGC Testing, AI/ML Governance, AWS Cloud Audit, SAP S/4HANA, Risk Assessment, NIST Framework, ISO 27001, Python, Power BI, IAM, COBIT/COSO",
    yoe: "10+ years",
    heatmap: [
      { name: "AI Governance", score: 97, delta: "+8", color: "#f43f5e" },
      { name: "LLM Security", score: 94, delta: "+12", color: "#f43f5e" },
      { name: "Cloud Audit", score: 93, delta: "+6", color: "#f59e0b" },
      { name: "EU AI Act/AIGP", score: 92, delta: "+15", color: "#f43f5e" },
      { name: "SOX/ITGC", score: 89, delta: "+2", color: "#10b981" },
      { name: "GRC Platforms", score: 88, delta: "+5", color: "#f59e0b" },
      { name: "Zero Trust Audit", score: 86, delta: "+9", color: "#f59e0b" },
      { name: "NIST AI RMF", score: 85, delta: "+11", color: "#f43f5e" },
      { name: "Python/Analytics", score: 83, delta: "+4", color: "#10b981" },
      { name: "ISO 42001", score: 82, delta: "+18", color: "#f43f5e" },
      { name: "ServiceNow GRC", score: 80, delta: "+7", color: "#f59e0b" },
      { name: "Data Governance", score: 78, delta: "+6", color: "#10b981" }
    ],
    rising: [
      { skill: "ISO 42001 (AI Management)", demand: 82, signal: "🔥 Exploding", tag: "NEW" },
      { skill: "NIST AI RMF Auditing", demand: 85, signal: "🔥 Critical", tag: "URGENT" },
      { skill: "EU AI Act / AIGP", demand: 92, signal: "🔥 Critical", tag: "URGENT" },
      { skill: "LLM Security Controls", demand: 94, signal: "🔥 Exploding", tag: "NEW" }
    ],
    gaps: [
      { skill: "LLM / GenAI Red-teaming", demand: 94, signal: "⚡ High Gap", tag: "GAP" },
      { skill: "AIGP Certification (IAPP)", demand: 92, signal: "⚡ High Gap", tag: "GAP" },
      { skill: "ServiceNow GRC Hands-on", demand: 80, signal: "📈 Growing Gap", tag: "GAP" },
      { skill: "RAG/Vector DB Audit", demand: 78, signal: "📈 Emerging Gap", tag: "GAP" }
    ],
    gaugeVal: 87,
    gaugeTrend: "↑ +6 pts vs last month",
    gaugeBars: [
      { label: "AI Governance Demand", val: 97, color: "#f43f5e" },
      { label: "Cloud Security Demand", val: 93, color: "#f59e0b" },
      { label: "Your Skill Match", val: 81, color: "#6366f1" },
      { label: "Cert Premium Signal", val: 88, color: "#10b981" }
    ],
    vault: {
      immediate: [
        {
          name: "ISACA AAIA",
          issuer: "ISACA",
          timeline: "March 2026",
          demand: 97,
          salaryImpact: "+$18–28K",
          difficulty: "Intermediate",
          why: "Highest ROI cert in your pipeline — AI governance demand up 8 pts MoM. First-mover advantage before market saturation.",
          pathway: [
            { n: 1, task: "Complete AAIA modules 1–3 (AI Governance, Ethics, Risk)", dur: "Wk 1–2" },
            { n: 2, task: "AAIA modules 4–6 (Controls, Compliance, Audit Methodology)", dur: "Wk 3–4" },
            { n: 3, task: "Full mock exam in CertLab (target ≥85%)", dur: "Wk 5" },
            { n: 4, task: "Review weak domains via CertLab weakness tracker", dur: "Wk 6" },
            { n: 5, task: "Sit ISACA AAIA exam", dur: "Mar 2026" }
          ]
        },
        {
          name: "IAPP AIGP",
          issuer: "IAPP",
          timeline: "Q3 2026",
          demand: 92,
          salaryImpact: "+$15–22K",
          difficulty: "Intermediate",
          why: "EU AI Act demand exploding — AIGP is the only cert covering both US + EU AI governance. 0 prerequisites. 4-week study plan.",
          pathway: [
            { n: 1, task: "IAPP AIGP self-study: EU AI Act Article overview", dur: "Wk 1" },
            { n: 2, task: "Study NIST AI RMF 1.0 core functions + IAPP materials", dur: "Wk 2" },
            { n: 3, task: "ISO 42001 overview + OECD AI Principles", dur: "Wk 3" },
            { n: 4, task: "Practice exam + register for AIGP test date", dur: "Wk 4" }
          ]
        }
      ],
      midterm: [
        {
          name: "CCAK (Certificate in Cloud Auditing Knowledge)",
          issuer: "ISACA / CSA",
          timeline: "Q1 2027",
          demand: 88,
          salaryImpact: "+$12–20K",
          difficulty: "Intermediate",
          why: "AWS CCP ≠ cloud audit competency. CCAK is the market standard — required in 34% of cloud audit JDs.",
          pathway: [
            { n: 1, task: "CSA CCAK study guide + CCAK domain review", dur: "Month 1" },
            { n: 2, task: "Cloud controls matrix (CCM v4) deep dive", dur: "Month 2" },
            { n: 3, task: "Mock exam + ISACA CCAK official practice questions", dur: "Month 3" }
          ]
        },
        {
          name: "CISM",
          issuer: "ISACA",
          timeline: "Q4 2026",
          demand: 85,
          salaryImpact: "+$20–35K",
          difficulty: "Advanced",
          why: "Unlocks AAISM credential and $20K+ salary premium. Prerequisite: 5yr infosec mgmt experience (waivable with CISA).",
          pathway: [
            { n: 1, task: "CISM QA&E manual domains 1–2 (Info Security Governance, Risk Mgmt)", dur: "Month 1" },
            { n: 2, task: "Domains 3–4 (Info Security Program, Incident Management)", dur: "Month 2" },
            { n: 3, task: "1,000+ CISM practice questions + ISACA mock exams", dur: "Month 3" }
          ]
        }
      ],
      longterm: [
        {
          name: "CGEIT",
          issuer: "ISACA",
          timeline: "2029",
          demand: 78,
          salaryImpact: "+$25–40K",
          difficulty: "Expert",
          why: "CGEIT holders command $175K+ median. Unlocks Governance VP / CISO track. Requires senior governance experience.",
          pathway: [
            { n: 1, task: "Complete CISM first — CGEIT requires governance leadership evidence", dur: "Prerequisite" },
            { n: 2, task: "Document 5+ governance initiatives as portfolio", dur: "Year 1–2" },
            { n: 3, task: "CGEIT review manual + exam registration", dur: "2028 Q4" }
          ]
        },
        {
          name: "CISSP",
          issuer: "ISC²",
          timeline: "2028",
          demand: 82,
          salaryImpact: "+$22–38K",
          difficulty: "Expert",
          why: "CISSP + CISA combination is the gold standard for IT audit leadership. Commands a $15K premium on top of CISM.",
          pathway: [
            { n: 1, task: "All 8 CISSP domains self-study (900+ hrs total)", dur: "6 months" },
            { n: 2, task: "Endorsed ISC² application process", dur: "Month 7" },
            { n: 3, task: "CAT exam attempt + CPE maintenance", dur: "Month 8" }
          ]
        }
      ]
    },
    trends: [
      {
        icon: "🤖",
        title: "AI Audit Industrialization",
        score: 96,
        color: "#f43f5e",
        desc: "Enterprises now require dedicated AI audit functions. Average AI governance headcount up 340% in F500 since 2024. AAIA holders getting 3× interview rate vs non-certified peers.",
        urgency: "CRITICAL"
      },
      {
        icon: "🇪🇺",
        title: "EU AI Act Enforcement",
        score: 94,
        color: "#f43f5e",
        desc: "Full enforcement from Aug 2026. US multinationals scrambling. AIGP-certified professionals have <200 in global supply vs thousands of open roles. First-mover window closes Q4 2026.",
        urgency: "CRITICAL"
      },
      {
        icon: "☁️",
        title: "Cloud-Native Audit Tools",
        score: 89,
        color: "#f59e0b",
        desc: "Continuous monitoring replacing point-in-time audits. 67% of audit JDs now require cloud audit tooling expertise (Wiz, Orca, Lacework). CCAK bridges this gap.",
        urgency: "HIGH"
      },
      {
        icon: "🔐",
        title: "Zero Trust Architecture Audit",
        score: 86,
        color: "#f59e0b",
        desc: "ZTA now default for government and financial services. Auditors who can assess ZTA implementations command $20–30K premium.",
        urgency: "HIGH"
      },
      {
        icon: "📊",
        title: "Data Governance & AI Act Overlap",
        score: 83,
        color: "#6366f1",
        desc: "ISO 42001 bridging AI Act compliance with ISO 27001. Demand for dual-certified AI+Data governance professionals accelerating.",
        urgency: "GROWING"
      },
      {
        icon: "⚡",
        title: "LLM Red-Teaming Skills",
        score: 78,
        color: "#10b981",
        desc: "Adversarial AI testing now part of internal audit scope. OWASP LLM Top 10 becoming audit standard. Early movers building differentiated portfolio.",
        urgency: "EMERGING"
      }
    ],
    salary: [
      { skill: "AAIA + AIGP (dual)", impact: "+$28–40K", tier: "S" },
      { skill: "CGEIT (standalone)", impact: "+$25–40K", tier: "S" },
      { skill: "CISM", impact: "+$20–35K", tier: "A" },
      { skill: "CISSP", impact: "+$22–38K", tier: "A" },
      { skill: "CCAK", impact: "+$12–20K", tier: "B" }
    ],
    timing: [
      { skill: "AIGP (IAPP)", status: "BUY NOW", color: "#f43f5e", reason: "EU AI Act enforcement Aug 2026 — window closes Q4 2026" },
      { skill: "AAIA (ISACA)", status: "BUY NOW", color: "#f43f5e", reason: "First-mover advantage still available — market not saturated" },
      { skill: "CCAK", status: "Q1 2027", color: "#f59e0b", reason: "After AAIA+AIGP — cloud audit gap growing but not urgent" },
      { skill: "CISM", status: "Q4 2026", color: "#f59e0b", reason: "After AAIA — unlocks CGEIT pathway" }
    ],
    trendStats: [
      { val: "97", lbl: "AI Governance Demand", delta: "↑ +8 MoM", up: true },
      { val: "4×", lbl: "AI Audit Job Growth (YoY)", delta: "↑ +1.2× vs Q4 2025", up: true },
      { val: "$162K", lbl: "AI Auditor Median Salary", delta: "↑ +$12K YoY", up: true },
      { val: "<200", lbl: "Global AIGP Supply", delta: "⚠ Critical shortage", up: true }
    ],
    tracks: [
      {
        icon: "🤖",
        title: "AAIA Exam Sprint (6 Weeks)",
        color: "#f43f5e",
        desc: "Intensive certification prep — exam March 2026",
        weeks: [
          { lbl: "Wk 1–2", tasks: ["AAIA Domains 1–2: AI Governance Frameworks + AI Ethics", "CertLab: Complete 60 practice questions", "Read: NIST AI RMF 1.0 full document"] },
          { lbl: "Wk 3–4", tasks: ["AAIA Domains 3–4: AI Risk Management + AI Controls", "CertLab lab simulations: AI audit scenario exercises", "Study ISACA AI Auditing guidance whitepaper"] },
          { lbl: "Wk 5", tasks: ["AAIA Domains 5–6: Compliance + Audit Methodology", "CertLab full mock exam #1 (target 80%+)", "Review all incorrect answers — map to domain"] },
          { lbl: "Wk 6", tasks: ["Weak domain intensive review (use CertLab tracker)", "CertLab mock exam #2 (target 85%+)", "Final skim: AAIA glossary + key frameworks"] }
        ]
      },
      {
        icon: "🇪🇺",
        title: "AIGP 4-Week Prep Plan",
        color: "#6366f1",
        desc: "EU AI Act + AI governance certification",
        weeks: [
          { lbl: "Wk 1", tasks: ["EU AI Act: Titles I–IV (risk classification, prohibited practices)", "NIST AI RMF: Govern, Map, Measure, Manage functions", "IAPP AIGP official study guide chapter 1–3"] },
          { lbl: "Wk 2", tasks: ["ISO 42001 overview (AI management systems)", "OECD AI Principles + UNESCO AI Ethics rec", "50 AIGP practice questions"] },
          { lbl: "Wk 3", tasks: ["EU AI Act: High-risk AI systems + conformity assessment", "Global AI governance comparison (US, EU, UK, Canada)", "IAPP practice exam — benchmark score"] },
          { lbl: "Wk 4", tasks: ["Weak area review + final reading", "Register exam date (target Q3 2026)", "Book 2 hrs final review day before exam"] }
        ]
      }
    ]
  },
  pooja: {
    name: "Pooja Jha",
    title: "Postdoctoral Researcher",
    initials: "PJ",
    domain: "Cardiovascular Research, Molecular Biology, Genomics, Cell Biology",
    color: "#ec4899",
    colorDim: "rgba(236,72,153,.15)",
    colorBorder: "rgba(236,72,153,.35)",
    currentRole: "Postdoctoral Researcher — Cardiovascular Biology Lab",
    certs: "Nature Communications publication (2024), ongoing ASCP MB",
    activeCert: "ASCP Molecular Biology (MB) — exam May 2026",
    targetRole: "Scientist II / Senior Scientist at Biotech OR Assistant Professor (tenure track) — both paths open",
    skills: "qPCR, RNA Sequencing, scRNA-seq, CRISPR-Cas9, Western Blotting, Immunofluorescence, ChIP-seq, Flow Cytometry, Mouse Models, Lentiviral Transduction, Confocal Microscopy",
    yoe: "6 years",
    heatmap: [
      { name: "scRNA-seq Analysis", score: 98, delta: "+14", color: "#f43f5e" },
      { name: "CRISPR Screens", score: 96, delta: "+11", color: "#f43f5e" },
      { name: "Spatial Transcriptomics", score: 95, delta: "+22", color: "#f43f5e" },
      { name: "Bioinformatics/R/Python", score: 93, delta: "+16", color: "#f43f5e" },
      { name: "AI/ML in Biology", score: 91, delta: "+19", color: "#f43f5e" },
      { name: "Cell Therapy (CAR-T)", score: 90, delta: "+8", color: "#f59e0b" },
      { name: "NGS/Sequencing Tech", score: 88, delta: "+6", color: "#10b981" },
      { name: "Flow Cytometry", score: 86, delta: "+3", color: "#10b981" },
      { name: "Grant Writing (NIH)", score: 85, delta: "+5", color: "#f59e0b" },
      { name: "Proteomics/MS", score: 82, delta: "+10", color: "#f59e0b" },
      { name: "Organoids/3D Models", score: 79, delta: "+17", color: "#f43f5e" },
      { name: "ASCP Certification", score: 75, delta: "+4", color: "#10b981" }
    ],
    rising: [
      { skill: "Spatial Transcriptomics", demand: 95, signal: "🔥 Exploding", tag: "NEW" },
      { skill: "AI/ML in Drug Discovery", demand: 91, signal: "🔥 Critical", tag: "URGENT" },
      { skill: "3D Organoid Models", demand: 79, signal: "⚡ Rising Fast", tag: "GROWING" },
      { skill: "Bioinformatics (Python/R)", demand: 93, signal: "🔥 Critical", tag: "URGENT" }
    ],
    gaps: [
      { skill: "Python for Bioinformatics", demand: 93, signal: "⚡ High Gap", tag: "GAP" },
      { skill: "Spatial Transcriptomics", demand: 95, signal: "⚡ High Gap", tag: "GAP" },
      { skill: "NIH Grant Writing", demand: 85, signal: "📈 Career Gap", tag: "GAP" },
      { skill: "Regulatory Science (IND/NDA)", demand: 78, signal: "📈 Industry Gap", tag: "GAP" }
    ],
    gaugeVal: 91,
    gaugeTrend: "↑ +11 pts vs last month",
    gaugeBars: [
      { label: "Genomics/Sequencing Demand", val: 98, color: "#f43f5e" },
      { label: "Biotech Hiring Signal", val: 91, color: "#f59e0b" },
      { label: "Your Skill Match", val: 84, color: "#ec4899" },
      { label: "Publication Premium", val: 93, color: "#10b981" }
    ],
    vault: {
      immediate: [
        {
          name: "ASCP Molecular Biology (MB)",
          issuer: "ASCP Board of Certification",
          timeline: "May 2026",
          demand: 75,
          salaryImpact: "+$8–15K (clinical)",
          difficulty: "Intermediate",
          why: "Clinical laboratory credential — opens hospital research + biotech QC roles. Validates molecular techniques on a standardized national benchmark.",
          pathway: [
            { n: 1, task: "ASCP BOC Study Guide: Domains 1–2 (Mol Diagnostics, Nucleic Acid Extraction)", dur: "Mar Wk 1–2" },
            { n: 2, task: "Domain 3 intensive: PCR methodologies (largest exam domain 25%)", dur: "Mar Wk 3–4" },
            { n: 3, task: "Domain 4: Sequencing Technologies (NGS, Sanger, variants)", dur: "Apr Wk 1–2" },
            { n: 4, task: "Domains 5–6: Gene Expression + QC/Lab Ops (weakest areas)", dur: "Apr Wk 3–4" },
            { n: 5, task: "2 full practice exams + ASCP BOC practice question bank", dur: "Final 2 wks" }
          ]
        },
        {
          name: "NIH Grant Writing Certificate",
          issuer: "NIH OER / ASBMB / Coursera",
          timeline: "Q4 2026",
          demand: 85,
          salaryImpact: "+$20–40K (PI track)",
          difficulty: "Intermediate",
          why: "K99 eligibility requires demonstrated grant-writing proficiency. Academic PI hiring committees screen for funded/pending grants. Essential milestone for 2027 K99 application.",
          pathway: [
            { n: 1, task: "NIH OER grant writing fundamentals course (free)", dur: "Month 1" },
            { n: 2, task: "ASBMB scientific communication workshop", dur: "Month 1–2" },
            { n: 3, task: "Draft K99 Specific Aims page — get mentor feedback", dur: "Month 2–3" },
            { n: 4, task: "Enroll NRSA/K-award writing course (GrantForward or Coursera)", dur: "Month 4" }
          ]
        }
      ],
      midterm: [
        {
          name: "Bioinformatics Specialization (Coursera/Python)",
          issuer: "UC San Diego / JHU / edX",
          timeline: "2026 Q3",
          demand: 93,
          salaryImpact: "+$20–35K",
          difficulty: "Intermediate",
          why: "93% of senior biotech roles now list Python/R bioinformatics as required. Wet-lab scientists who add computational skills see 35% salary premium at Scientist II+ level.",
          pathway: [
            { n: 1, task: "Python for Bioinformatics (Coursera — 6 wks)", dur: "Month 1–2" },
            { n: 2, task: "R for scRNA-seq analysis (Seurat/Scanpy pipeline)", dur: "Month 2–3" },
            { n: 3, task: "Apply to own RNA-seq dataset from postdoc work", dur: "Month 3" },
            { n: 4, task: "GitHub portfolio: 2 public bioinformatics repos", dur: "Month 4" }
          ]
        },
        {
          name: "Spatial Transcriptomics Proficiency (10x Visium / Xenium)",
          issuer: "10x Genomics / Vizgen / NanoString",
          timeline: "2027 Q1",
          demand: 95,
          salaryImpact: "+$25–40K",
          difficulty: "Advanced",
          why: "Fastest-growing skill in academic + biotech research. 10x Genomics Visium is standard platform. Demand up 22 pts in 90 days. First-mover advantage still open.",
          pathway: [
            { n: 1, task: "10x Genomics Visium spatial transcriptomics online course", dur: "Wk 1–2" },
            { n: 2, task: "Seurat spatial vignette + BayesSpace analysis pipeline", dur: "Wk 3–4" },
            { n: 3, task: "Apply technique to cardiovascular tissue sample in lab", dur: "Month 2" },
            { n: 4, task: "Present results at lab meeting — add to CV + LinkedIn", dur: "Month 3" }
          ]
        }
      ],
      longterm: [
        {
          name: "RAC — Biologics (Regulatory Affairs)",
          issuer: "RAPS",
          timeline: "2028",
          demand: 78,
          salaryImpact: "+$20–35K",
          difficulty: "Advanced",
          why: "Opens pharma regulatory science + CMC + IND/BLA submission roles. Highly specialized — <2,000 RAC-Biologics holders globally. Commands $145K+ median.",
          pathway: [
            { n: 1, task: "Land industry Scientist II role first — 2+ yrs industry exp needed", dur: "Prerequisite" },
            { n: 2, task: "RAPS Fundamentals of Regulatory Affairs course", dur: "Year 2" },
            { n: 3, task: "RAC Biologics exam preparation + RAPS study guide", dur: "Year 3" }
          ]
        },
        {
          name: "NIH K99/R00 Pathway to Independence",
          issuer: "NIH",
          timeline: "2027 Q1",
          demand: 90,
          salaryImpact: "$250K funding + PI track",
          difficulty: "Expert",
          why: "The premier NIH fellowship for transitioning to independent PI. Must apply within 4 years of PhD. Comes with $250K in funding. Opens every R1/medical school faculty track.",
          pathway: [
            { n: 1, task: "Draft Specific Aims with current mentor review (start 6 months before)", dur: "2026 Q3–Q4" },
            { n: 2, task: "Assemble K99 team: sponsor, co-sponsor, consultants", dur: "2026 Q4" },
            { n: 3, task: "Full application submission (NIH standard February/June deadline)", dur: "2027 Q1" },
            { n: 4, task: "Prepare for site visit / impact score review", dur: "2027 Q2–Q3" }
          ]
        }
      ]
    },
    trends: [
      {
        icon: "🧬",
        title: "Single-Cell + Spatial Revolution",
        score: 98,
        color: "#f43f5e",
        desc: "scRNA-seq + spatial transcriptomics is the dominant platform in both academia and industry. Biotech roles listing these skills up 340% since 2023. Computational integration now required — not optional.",
        urgency: "CRITICAL"
      },
      {
        icon: "🤖",
        title: "AI in Drug Discovery",
        score: 94,
        color: "#f43f5e",
        desc: "ML-powered target ID and lead optimization now standard at Genentech, AZ, Recursion, BioNTech. Scientists who add Python/ML skills see 35–50% salary premium. AlphaFold 3 reshaping structural biology hiring.",
        urgency: "CRITICAL"
      },
      {
        icon: "✂️",
        title: "CRISPR Screens Going Mainstream",
        score: 91,
        color: "#f59e0b",
        desc: "Genome-wide CRISPR screens (Brunello, Brie libraries) now routine in pharma. CRISPR functional genomics + data analysis combo valued at $20K+ premium over traditional wet-lab skills.",
        urgency: "HIGH"
      },
      {
        icon: "🫀",
        title: "Cardiovascular Biotech Surge",
        score: 89,
        color: "#f59e0b",
        desc: "Post-COVID cardiovascular disease prioritization. Heart failure, AFib, cardiometabolic pipeline accelerating. Genentech, AZ, Amgen, BMS all expanding CVD research teams 2025–2027.",
        urgency: "HIGH"
      },
      {
        icon: "🏥",
        title: "Gene Therapy Manufacturing Scale-Up",
        score: 85,
        color: "#6366f1",
        desc: "Lentiviral/AAV vector manufacturing scaling rapidly. Scientists with experience in viral transduction + functional assays in high demand for CMC roles.",
        urgency: "GROWING"
      },
      {
        icon: "🧫",
        title: "3D Organoid Models Replacing 2D Culture",
        score: 81,
        color: "#10b981",
        desc: "Cardiac organoids emerging as preferred disease model platform. 17 pts demand increase in 90 days. Early adopters getting first-author opportunities and job market differentiation.",
        urgency: "EMERGING"
      }
    ],
    salary: [
      { skill: "Spatial Transcriptomics + Bioinformatics", impact: "+$35–50K", tier: "S" },
      { skill: "NIH K99/R00 (PI Track)", impact: "+Tenure + Lab Funding", tier: "S" },
      { skill: "RAC Biologics Cert", impact: "+$25–35K", tier: "A" },
      { skill: "ASCP MB Certification", impact: "+$8–15K (clinical)", tier: "B" },
      { skill: "Python/R for scRNA-seq", impact: "+$20–35K", tier: "A" }
    ],
    timing: [
      { skill: "Python/R Bioinformatics", status: "START NOW", color: "#f43f5e", reason: "93% of senior roles require it — zero delay acceptable" },
      { skill: "Spatial Transcriptomics", status: "START NOW", color: "#f43f5e", reason: "First-mover window — rapidly becoming table-stakes" },
      { skill: "ASCP MB", status: "May 2026", color: "#f59e0b", reason: "Currently in active study — 8 weeks to exam" },
      { skill: "NIH K99 Application", status: "2027 Q1", color: "#6366f1", reason: "Requires full year of prep — start Specific Aims Q3 2026" }
    ],
    trendStats: [
      { val: "98", lbl: "scRNA-seq Demand Score", delta: "↑ +14 MoM", up: true },
      { val: "340%", lbl: "Spatial Transcriptomics Growth", delta: "↑ since 2023", up: true },
      { val: "$138K", lbl: "Scientist II Median Salary", delta: "↑ +$11K YoY", up: true },
      { val: "+35%", lbl: "Comp Premium (Python/Wet-lab Combo)", delta: "↑ Rising fast", up: true }
    ],
    tracks: [
      {
        icon: "🧬",
        title: "ASCP MB Exam Sprint (8 Weeks)",
        color: "#ec4899",
        desc: "Intensive certification prep — exam May 2026",
        weeks: [
          { lbl: "Mar Wk 1–2", tasks: ["ASCP BOC Domain 1: Molecular Diagnostics Principles (50% → 70%)", "Domain 2: Nucleic Acid Extraction & QC (60% → 80%)", "50 practice questions per domain"] },
          { lbl: "Mar Wk 3–4", tasks: ["Domain 3: PCR Methodologies — LARGEST domain (25% of exam)", "Focus: ddPCR, multiplex PCR, Ct value interpretation", "100 PCR-specific practice questions"] },
          { lbl: "Apr Wk 1–2", tasks: ["Domain 4: Sequencing Technologies (weakest area — start fresh)", "NGS workflow, variant calling, FASTQ/BAM/VCF formats", "ACMG variant classification guidelines review"] },
          { lbl: "Apr Wk 3–4", tasks: ["Domain 5: Gene Expression (leverage own RNA-seq experience)", "Domain 6: QC & Lab Operations (CLIA, CAP, Westgard rules)", "Full-length mock exam #1 + score benchmark"] },
          { lbl: "Final 2 Wks", tasks: ["Weak domain intensive (use score from mock #1)", "Full-length mock exam #2 (target 75%+)", "ASCP BOC official practice question bank — all remaining questions"] }
        ]
      },
      {
        icon: "💻",
        title: "Bioinformatics Upskill (12 Weeks)",
        color: "#a855f7",
        desc: "Python + R for scRNA-seq and NGS analysis",
        weeks: [
          { lbl: "Wk 1–3", tasks: ["Python fundamentals for biologists (Codecademy Bio track)", "Pandas + NumPy for biological data manipulation", "BioPython basics: sequence analysis, file parsing"] },
          { lbl: "Wk 4–6", tasks: ["R for scRNA-seq: Seurat workflow (QC, normalization, clustering)", "UMAP/tSNE visualization of single-cell data", "Apply Seurat to a published cardiovascular scRNA-seq dataset"] },
          { lbl: "Wk 7–9", tasks: ["Differential expression analysis (DESeq2, edgeR)", "Gene ontology + pathway enrichment (clusterProfiler)", "Pseudotime analysis (Monocle3/Velocyto)"] },
          { lbl: "Wk 10–12", tasks: ["Spatial transcriptomics intro: 10x Visium pipeline", "Integrate spatial + scRNA-seq datasets", "GitHub portfolio: publish 2 analysis notebooks publicly"] }
        ]
      }
    ]
  }
} as const;