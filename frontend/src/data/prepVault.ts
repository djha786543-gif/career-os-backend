export const PREP_VAULT = {
  dj: {
    title: "Preparation Vault — AAIA + AIGP (DJ)",
    sub: "Pre-built reference for ISACA AAIA (March 2026) and IAPP AIGP — definitions, formulas, frameworks, exam traps",
    quickTopics: [
      "NIST AI RMF Core Functions", "ISO 42001 vs ISO 27001", "EU AI Act Risk Tiers", "AI Model Drift Types",
      "FAIR Quantification Formulas", "SOC 2 vs SOC 1 Differences", "Compensating Controls Analysis", "AI Bias Metrics"
    ],
    sections: [
      {
        id: "aaia-governance",
        icon: "🏛️",
        title: "AI Governance Frameworks",
        weight: "critical",
        subtitle: "NIST AI RMF · ISO 42001 · OECD Principles · EU AI Act — Domain 1 AAIA",
        category: "AI Governance",
        tag: "formula",
        subsections: [
          {
            heading: "NIST AI RMF — Four Core Functions",
            content: `
<div class="pv-def"><strong>GOVERN</strong> — Establishes organization-wide policies, accountability structures, and culture for responsible AI. Sets risk tolerances, assigns roles, integrates AI risk into enterprise risk management. <em>The foundation all other functions rest on.</em></div>
<div class="pv-def"><strong>MAP</strong> — Identifies context, stakeholders, and AI risks before deployment. Categorizes system purpose, potential impacts, and risk tolerances. Produces risk context documentation.</div>
<div class="pv-def"><strong>MEASURE</strong> — Analyzes and assesses AI risks using quantitative and qualitative tools. Includes bias testing, performance monitoring, drift detection, and red-teaming. Ongoing throughout lifecycle.</div>
<div class="pv-def"><strong>MANAGE</strong> — Prioritizes and responds to identified AI risks. Includes risk treatment decisions, incident response, remediation, and stakeholder communication. Continuous feedback into GOVERN.</div>
<div class="pv-formula">
  <div class="pv-formula-title">AI RMF Risk Calculation Framework</div>
  <div class="pv-formula-math">AI Risk = Likelihood of Harm × Severity × Breadth of Impact
Residual Risk = Inherent Risk − (Control Effectiveness × Coverage)
Risk Appetite Threshold → triggers Manage function response</div>
  <div class="pv-formula-example">Example: High-stakes hiring AI. Likelihood: 0.7 (historical bias data). Severity: HIGH (employment impact). Breadth: 10,000 applicants/yr → triggers mandatory MEASURE controls.</div>
</div>`
          },
          {
            heading: "Framework Comparison — NIST AI RMF vs ISO 42001 vs EU AI Act",
            content: `
<table class="pv-table">
  <thead><tr><th>Dimension</th><th>NIST AI RMF</th><th>ISO 42001</th><th>EU AI Act</th></tr></thead>
  <tbody>
    <tr><td>Type</td><td>Voluntary framework</td><td>Certifiable standard</td><td>Binding regulation</td></tr>
    <tr><td>Jurisdiction</td><td>US-focused, global adoption</td><td>Global</td><td>EU + extraterritorial</td></tr>
    <tr><td>Enforcement</td><td>None (voluntary)</td><td>Third-party audit</td><td>Fines up to €35M / 7% revenue</td></tr>
    <tr><td>Core structure</td><td>Govern/Map/Measure/Manage</td><td>PDCA management system</td><td>Risk tiers + prohibited acts</td></tr>
    <tr><td>Audit hook</td><td>Measure function</td><td>Clause 9: Performance evaluation</td><td>Article 9: Risk management system</td></tr>
    <tr class="pv-row-critical"><td>Exam weight (AAIA)</td><td>★★★★★ Very high</td><td>★★★★ High</td><td>★★★★ High</td></tr>
  </tbody>
</table>`
          },
          {
            heading: "Exam Traps — Governance Questions",
            content: `
<div class="pv-trap"><strong>TRAP #1:</strong> "NIST AI RMF is mandatory for all US federal agencies." → <strong>FALSE.</strong> AI RMF is voluntary for all organizations. Only OMB M-24-10 mandates certain AI governance actions for federal agencies — not the AI RMF itself. Exam frequently conflates these.</div>
<div class="pv-trap"><strong>TRAP #2:</strong> "ISO 42001 replaces ISO 27001 for AI systems." → <strong>FALSE.</strong> ISO 42001 addresses AI management systems; ISO 27001 addresses information security. They are complementary and often implemented together. AI systems processing personal data need both.</div>
<div class="pv-trap"><strong>TRAP #3:</strong> "The EU AI Act applies only to AI developers in the EU." → <strong>FALSE.</strong> It has extraterritorial reach — any organization deploying AI whose outputs are used in the EU must comply, regardless of where they are headquartered.</div>
<div class="pv-trap"><strong>TRAP #4:</strong> "GOVERN is the last NIST AI RMF function, applied after implementation." → <strong>FALSE.</strong> GOVERN is implemented first and operates continuously — it sets the policy infrastructure that all other functions execute within.</div>`
          }
        ]
      },
      {
        id: "aaia-risk",
        icon: "⚖️",
        title: "AI Risk Assessment & Quantification",
        weight: "critical",
        subtitle: "FAIR model · Risk scoring · Residual risk · Loss event frequency — Domain 2 AAIA",
        category: "AI Risk",
        tag: "formula",
        subsections: [
          {
            heading: "FAIR Risk Quantification — Full Formula Set",
            content: `
<div class="pv-formula">
  <div class="pv-formula-title">FAIR Core Decomposition</div>
  <div class="pv-formula-math">Risk = Loss Event Frequency (LEF) × Loss Magnitude (LM)
LEF = Threat Event Frequency (TEF) × Vulnerability (Vuln %)
LM = Primary Loss + Secondary Loss
Primary Loss = Productivity + Response + Replacement + Fines/Judgments
Secondary Loss = Reputation + Competitive Advantage + Regulatory</div>
  <div class="pv-formula-example">Example: Healthcare AI breach — TEF: 1.5/yr, Vuln: 40% → LEF: 0.6/yr. LM per event: $18M (100K records × $180). ALE = 0.6 × $18M = $10.8M/yr</div>
</div>
<div class="pv-formula">
  <div class="pv-formula-title">EU AI Act Risk Tier Classification</div>
  <div class="pv-formula-math">Tier 1 — PROHIBITED: Social scoring, real-time biometric surveillance (public spaces), emotion recognition (workplace/education)
Tier 2 — HIGH RISK: Hiring/firing, credit scoring, medical devices, law enforcement, critical infrastructure, education
Tier 3 — LIMITED RISK: Chatbots, deepfakes → transparency obligations only
Tier 4 — MINIMAL RISK: Spam filters, AI in video games → no obligations</div>
  <div class="pv-formula-example">Exam tip: "Hiring AI" → always HIGH RISK. "Customer service chatbot" → LIMITED RISK (transparency req only). Know the exact tier for 8 key use cases.</div>
</div>`
          },
          {
            heading: "AI Drift Detection — Diagnostic Framework",
            content: `
<div class="pv-def"><strong>Data Drift</strong> — Input feature distributions shift from training data. ALL metrics degrade uniformly. Cause: population change, data pipeline issues. Detection: PSI (Population Stability Index) &gt; 0.2 = significant drift.</div>
<div class="pv-def"><strong>Concept Drift</strong> — The relationship between features and target variable changes. Diagnostic signature: <em>accuracy stays stable, precision/recall collapse</em> (masked by class imbalance). Cause: fraud pattern evolution, behavioral shifts. Most common exam question.</div>
<div class="pv-def"><strong>Prediction Drift</strong> — Output distribution shifts without corresponding ground truth change. Detectable before labels are available. Often first signal of upstream data drift.</div>
<div class="pv-formula">
  <div class="pv-formula-title">Drift Diagnostic Decision Tree</div>
  <div class="pv-formula-math">All metrics drop uniformly → Data Drift
Precision/Recall drop, Accuracy stable → Concept Drift (imbalanced class)
Output distribution shifts, inputs stable → Prediction Drift
Random errors, no pattern → Pipeline/infrastructure issue</div>
</div>
<div class="pv-trap"><strong>TRAP:</strong> "Stable accuracy means the model is performing well." → In highly imbalanced datasets (fraud ~1%), predicting the majority class exclusively gives ~99% accuracy. Always evaluate precision AND recall together. Accuracy alone is meaningless for imbalanced classes.</div>`
          }
        ]
      },
      {
        id: "aaia-audit",
        icon: "🔍",
        title: "AI Audit Methodology & Evidence",
        weight: "high",
        subtitle: "Audit procedures · Evidence standards · Control testing · Reporting — Domain 5 AAIA",
        category: "AI Audit",
        tag: "trap",
        subsections: [
          {
            heading: "AI Audit Lifecycle — Phases and Key Deliverables",
            content: `
<div class="pv-tree">AI AUDIT LIFECYCLE
├── PHASE 1: PLANNING
│   ├── Define AI system scope + inventory
│   ├── Stakeholder mapping (developer, deployer, affected parties)
│   ├── Risk assessment → prioritize audit procedures
│   └── Deliverable: AI Audit Plan + Risk Assessment
│
├── PHASE 2: FIELDWORK
│   ├── Model card review (purpose, training data, limitations)
│   ├── Bias testing (disparate impact analysis, group fairness metrics)
│   ├── Drift monitoring controls assessment
│   ├── Access controls for model training environment
│   ├── Change management for model updates
│   └── Deliverable: Workpapers + Evidence Matrix
│
├── PHASE 3: EVALUATION
│   ├── Control gap analysis (design vs operating effectiveness)
│   ├── Risk rating (Critical/High/Medium/Low)
│   ├── Compensating control assessment
│   └── Deliverable: Finding Sheets + Management Response
│
└── PHASE 4: REPORTING
    ├── Audit report with risk-prioritized findings
    ├── Root cause analysis per finding
    ├── Management action plans with owners + due dates
    └── Deliverable: Final Audit Report → Audit Committee</div>`
          },
          {
            heading: "Compensating Controls — Assessment Framework",
            content: `
<div class="pv-def"><strong>Compensating Control</strong> — An alternative control that provides equivalent assurance to the primary control when the primary cannot be implemented. Must: (1) address the same risk, (2) provide comparable rigor, (3) be formally documented, and (4) be tested separately.</div>
<table class="pv-table">
  <thead><tr><th>Primary Control Missing</th><th>Adequate Compensating Control</th><th>Insufficient Compensating</th><th>Finding Severity</th></tr></thead>
  <tbody>
    <tr><td>Automated bias monitoring</td><td>Monthly manual review + quarterly 3rd-party audit + complaint tracking</td><td>Annual self-assessment only</td><td>MEDIUM (detection gap)</td></tr>
    <tr class="pv-row-high"><td>Change management approval</td><td>Documented emergency procedure + retrospective approval within 24hrs</td><td>Verbal approval only</td><td>HIGH (undocumented)</td></tr>
    <tr class="pv-row-critical"><td>Model access controls</td><td>None acceptable — access controls have no adequate compensating control</td><td>Any manual process</td><td>CRITICAL (no equiv.)</td></tr>
    <tr><td>Drift alerting</td><td>Weekly manual metric review with documented thresholds and sign-off</td><td>Ad hoc review with no schedule</td><td>MEDIUM</td></tr>
  </tbody>
</table>
<div class="pv-tip"><strong>TIP:</strong> The AAIA exam always provides 3 compensating controls and asks if they are collectively sufficient. Evaluate: (1) do they cover the same risk? (2) is there a detection latency gap? (3) are they formally documented? A combination of weak controls ≠ a strong compensating control.</div>`
          },
          {
            heading: "Third-Party AI Risk — Vendor Management Checklist",
            content: `
<div class="pv-def"><strong>EU AI Act: Deployer Liability</strong> — Under the EU AI Act, the "deployer" (organization using AI) bears primary compliance responsibility, NOT the vendor/developer. Even if a vendor provides a "fairness certificate," the deployer must conduct independent validation.</div>
<div class="pv-def"><strong>Model Card</strong> — Documentation artifact disclosing: (1) intended use cases, (2) training data sources, (3) known limitations, (4) fairness metrics by protected class, (5) evaluation methodology. Absence = HIGH finding in AI audit.</div>
<div class="pv-trap"><strong>TRAP:</strong> "A vendor's ISO 42001 certification means no further audit work is needed." → FALSE. Third-party certification reduces but does not eliminate audit procedures. You still need: scoping review, key control testing, ongoing monitoring, and contractual right-to-audit clause.</div>`
          }
        ]
      },
      {
        id: "aigp-euai",
        icon: "🇪🇺",
        title: "EU AI Act — Deep Reference",
        weight: "critical",
        subtitle: "Risk tiers · Prohibited uses · Conformity assessment · AIGP exam focus",
        category: "EU AI Act",
        tag: "trap",
        subsections: [
          {
            heading: "Prohibited AI Practices — Article 5 (Must Memorize)",
            content: `
<div class="pv-trap"><strong>PROHIBITED (effective Aug 2026):</strong>
<br>• Subliminal manipulation techniques exploiting unconscious biases
<br>• Exploitation of vulnerabilities (age, disability, social situation)
<br>• Social scoring by public authorities for general purposes
<br>• Real-time remote biometric identification in public spaces (narrow LE exceptions only)
<br>• Predictive policing based solely on profiling (no observable facts)
<br>• Emotion recognition in workplace and educational institutions
<br>• Biometric categorization inferring sensitive attributes (race, political opinions, sexual orientation)
</div>
<div class="pv-tip"><strong>Exam Tip:</strong> "Biometric ID for border control" = NOT prohibited (security exception). "Biometric ID in shopping mall for marketing" = PROHIBITED. The distinction is always the specific use case and authorization.</div>`
          },
          {
            heading: "High-Risk AI Systems — Annex III (8 Categories)",
            content: `
<table class="pv-table">
  <thead><tr><th>#</th><th>Category</th><th>Examples</th><th>Key Obligation</th></tr></thead>
  <tbody>
    <tr class="pv-row-critical"><td>1</td><td>Critical infrastructure</td><td>Water, energy, transport management</td><td>Risk management system + logging</td></tr>
    <tr class="pv-row-critical"><td>2</td><td>Education/vocational</td><td>Student assessment, admission systems</td><td>Human oversight + transparency</td></tr>
    <tr class="pv-row-critical"><td>3</td><td>Employment/HR</td><td>Hiring, performance evaluation, termination</td><td>Conformity assessment required</td></tr>
    <tr class="pv-row-high"><td>4</td><td>Essential services</td><td>Credit scoring, insurance, emergency dispatch</td><td>Transparency to affected individuals</td></tr>
    <tr class="pv-row-high"><td>5</td><td>Law enforcement</td><td>Polygraphs, risk assessment, crime prediction</td><td>Strict human oversight mandatory</td></tr>
    <tr><td>6</td><td>Migration/asylum</td><td>Document verification, risk assessment</td><td>Fundamental rights impact assessment</td></tr>
    <tr><td>7</td><td>Justice/democracy</td><td>Court outcome prediction, electoral influence</td><td>Highest oversight tier</td></tr>
    <tr><td>8</td><td>General purpose AI (GPAI)</td><td>LLMs with systemic risk (10²³ FLOPs+)</td><td>Separate GPAI Title</td></tr>
  </tbody>
</table>`
          }
        ]
      },
      {
        id: "aaia-ethics",
        icon: "⚖️",
        title: "AI Ethics & Bias — Metrics & Frameworks",
        weight: "high",
        subtitle: "Fairness metrics · Disparate impact · Protected attributes · Bias audit procedures",
        category: "AI Fairness",
        tag: "formula",
        subsections: [
          {
            heading: "Fairness Metrics — Definitions and Formulas",
            content: `
<div class="pv-formula">
  <div class="pv-formula-title">Disparate Impact Ratio (Four-Fifths Rule)</div>
  <div class="pv-formula-math">DIR = Selection Rate (protected group) / Selection Rate (reference group)
DIR &lt; 0.8 → Adverse impact presumed (EEOC 4/5ths rule)
DIR = 1.0 → Perfect parity
DIR &gt; 1.0 → Positive discrimination toward protected group</div>
  <div class="pv-formula-example">Example: Hiring AI approves 40% of minority applicants vs 65% for majority → DIR = 40/65 = 0.615 → Below 0.8 threshold → ADVERSE IMPACT finding required</div>
</div>
<div class="pv-formula">
  <div class="pv-formula-title">Key Fairness Metric Taxonomy</div>
  <div class="pv-formula-math">Individual Fairness: Similar individuals get similar outcomes
Group Fairness:
  Demographic Parity: P(ŷ=1|A=0) = P(ŷ=1|A=1)
  Equal Opportunity: TPR equal across groups
  Equalized Odds: TPR + FPR equal across groups
Counterfactual Fairness: Outcome unchanged if protected attribute were different</div>
</div>
<div class="pv-trap"><strong>TRAP:</strong> "Removing protected attributes from training data ensures fairness." → FALSE. Proxy variables (zip code, school name, surname) can encode protected attributes. This is called 'proxy discrimination' — a HIGH finding in AI fairness audits. The exam tests this almost every session.</div>`
          },
          {
            heading: "Bias Types — Taxonomy Tree",
            content: `
<div class="pv-tree">AI BIAS TAXONOMY
├── PRE-PROCESSING BIAS (Data-Level)
│   ├── Historical bias — training data reflects past discrimination
│   ├── Representation bias — underrepresentation of subgroups
│   ├── Measurement bias — inconsistent data collection across groups
│   └── Aggregation bias — ignoring subgroup heterogeneity
│
├── IN-PROCESSING BIAS (Model-Level)
│   ├── Optimization bias — loss function doesn't penalize disparate outcomes
│   ├── Inductive bias — model architecture assumptions
│   └── Feedback loops — model outputs become future training data
│
└── POST-PROCESSING BIAS (Deployment-Level)
    ├── Evaluation bias — benchmark datasets not representative
    ├── Deployment drift — population shifts post-launch
    └── Human-in-loop bias — biased reviewers override model outputs</div>`
          }
        ]
      },
      {
        id: "conflict-frameworks",
        icon: "⚡",
        title: "Conflicting Framework Resolution",
        weight: "high",
        subtitle: "GDPR vs retention · HIPAA vs AI · SOX vs AI models — Framework conflict exam scenarios",
        category: "Framework Conflicts",
        tag: "trap",
        subsections: [
          {
            heading: "Common Framework Conflicts — Decision Matrix",
            content: `
<table class="pv-table">
  <thead><tr><th>Conflict</th><th>Framework A</th><th>Framework B</th><th>Resolution Approach</th><th>Exam Answer Pattern</th></tr></thead>
  <tbody>
    <tr class="pv-row-critical"><td>Data retention vs privacy</td><td>Law enforcement: 7yr retention</td><td>GDPR Art.17: right to erasure</td><td>Pseudonymize + retain under Art.6(1)(c) legal obligation</td><td>Technical + legal solution satisfying BOTH</td></tr>
    <tr class="pv-row-high"><td>Model explainability vs IP</td><td>GDPR Art.22: right to explanation</td><td>Trade secret protection</td><td>Functional explanation (not source code) per WP29</td><td>Proportionate disclosure — outcome not algorithm</td></tr>
    <tr><td>AI monitoring vs labor law</td><td>NIST AI RMF: monitor AI outputs</td><td>EU employee monitoring restrictions</td><td>Aggregate monitoring (not individual tracking); works council approval</td><td>Privacy-preserving monitoring design</td></tr>
    <tr><td>Audit access vs data minimization</td><td>Auditor needs model training data</td><td>GDPR minimization principle</td><td>Anonymized representative sample + certified deletion after audit</td><td>Minimum necessary + documented destruction</td></tr>
  </tbody>
</table>
<div class="pv-tip"><strong>TIP:</strong> Exam conflict questions always have one answer that blindly prioritizes one framework over the other (wrong) and one that finds a technical + legal solution satisfying both (correct). Look for the "both/and" answer, not the "either/or."</div>`
          }
        ]
      }
    ],
    flashcards: [
      { q: "What is the NIST AI RMF Govern function's primary purpose?", a: "Sets organization-wide policies, accountability structures, roles, and risk tolerances for responsible AI. The policy layer that all other functions operate within." },
      { q: "What does DIR < 0.8 mean in the EEOC Four-Fifths Rule?", a: "Adverse impact is presumed. Selection rate for protected group is less than 80% of the reference group. Triggers investigation requirement." },
      { q: "Under EU AI Act, who bears compliance responsibility — developer or deployer?", a: "The DEPLOYER (organization using the AI) bears primary compliance responsibility, even if they purchase AI from a vendor." },
      { q: "What is the diagnostic signature of CONCEPT drift vs DATA drift?", a: "Concept drift: accuracy stays stable, precision/recall collapse (masked by class imbalance). Data drift: ALL metrics degrade uniformly." },
      { q: "Name the 4 NIST AI RMF core functions in order.", a: "GOVERN → MAP → MEASURE → MANAGE. GOVERN is implemented first and is continuous. The functions are iterative, not sequential." },
      { q: "What is a 'proxy variable' in AI bias?", a: "A variable that correlates with a protected attribute (e.g., zip code → race, school name → socioeconomic status) and can encode discrimination even when protected attributes are removed." },
      { q: "What triggers mandatory revalidation of an AI model per NIST AI RMF?", a: "Performance metrics dropping >5% from validated baseline, significant feature drift (PSI > 0.2), or change in deployment context. Any combination triggers Manage function response." },
      { q: "What is the EU AI Act penalty for Tier 1 (prohibited) violations?", a: "Up to €35 million OR 7% of global annual turnover, whichever is higher." },
      { q: "What must a Model Card contain?", a: "Intended use cases, training data sources, known limitations, fairness metrics by protected class, evaluation methodology, and version history." },
      { q: "FAIR formula: What is Loss Event Frequency (LEF)?", a: "LEF = Threat Event Frequency (TEF) × Vulnerability. Example: 2 attempts/year × 50% success rate = 1.0 LEF." },
      { q: "When is a compensating control 'adequate' per audit standards?", a: "When it: (1) addresses the same risk as the primary control, (2) provides comparable assurance level, (3) is formally documented with ownership, and (4) is independently tested." },
      { q: "What is the difference between ISO 42001 and NIST AI RMF applicability?", a: "NIST AI RMF is voluntary, US-origin, no certification. ISO 42001 is a certifiable management standard (third-party audit), globally applicable, PDCA-structured." }
    ]
  },
  pooja: {
    title: "Preparation Vault — ASCP MB (Pooja)",
    sub: "Pre-built reference for ASCP Molecular Biology certification (May 2026) — all 6 domains with definitions, techniques, QC formulas, traps",
    quickTopics: [
      "PCR Variants Comparison", "NGS Workflow Steps", "CLIA QC Requirements", "Sanger vs Next-Gen Sequencing",
      "RNA Extraction Best Practices", "ACMG Variant Classification", "Westgard Rules", "ddPCR Applications"
    ],
    sections: [
      {
        id: "ascp-pcr",
        icon: "🧬",
        title: "PCR Methodologies — Domain 3 (25% of Exam)",
        weight: "critical",
        subtitle: "Largest exam domain · RT-PCR · qPCR · ddPCR · Multiplex PCR · Allele-specific PCR",
        category: "PCR Methods",
        tag: "formula",
        subsections: [
          {
            heading: "PCR Variant Comparison — Master Table",
            content: `
<table class="pv-table">
  <thead><tr><th>PCR Type</th><th>Key Principle</th><th>Primary Application</th><th>Quantification?</th><th>Exam Hook</th></tr></thead>
  <tbody>
    <tr class="pv-row-critical"><td>Real-time qPCR</td><td>Fluorescence measured each cycle; Ct value inversely proportional to starting template</td><td>Gene expression, pathogen load, copy number</td><td>Relative or absolute</td><td>Ct shift of 3.3 = 10-fold difference in template</td></tr>
    <tr class="pv-row-critical"><td>ddPCR (Droplet Digital)</td><td>Sample partitioned into 20,000 droplets; Poisson statistics; endpoint detection</td><td>Rare variant detection, MRD, copy number</td><td>Absolute (no standard curve needed)</td><td>Gold standard for &lt;1% variant allele frequency</td></tr>
    <tr class="pv-row-high"><td>RT-PCR</td><td>Reverse transcriptase converts RNA→cDNA first, then PCR amplification</td><td>RNA virus detection, gene expression from RNA</td><td>With real-time: yes</td><td>One-step vs two-step RT-PCR distinction</td></tr>
    <tr><td>Multiplex PCR</td><td>Multiple primer pairs in single reaction; each amplifies different target</td><td>Respiratory panels, STI panels, HLA typing</td><td>With qPCR: yes</td><td>Primer competition / nonspecific binding artifacts</td></tr>
    <tr><td>Allele-specific PCR</td><td>Primer 3' end perfectly matches one allele; mismatch = no amplification</td><td>SNP genotyping, drug resistance mutations</td><td>No (presence/absence)</td><td>Why 3' mismatch blocks amplification: no extension</td></tr>
    <tr><td>Nested PCR</td><td>Two sequential PCR rounds with inner primer set</td><td>Increase sensitivity for low-copy targets</td><td>No</td><td>Highest contamination risk — open-tube transfer</td></tr>
  </tbody>
</table>`
          },
          {
            heading: "qPCR Fundamentals — Formulas and Ct Interpretation",
            content: `
<div class="pv-formula">
  <div class="pv-formula-title">Ct Value Relationships</div>
  <div class="pv-formula-math">Efficiency = (10^(-1/slope) - 1) × 100%
Ideal efficiency = 90–110% (slope: -3.1 to -3.6)
ΔCt = Ct(target) - Ct(reference gene)
ΔΔCt = ΔCt(sample) - ΔCt(calibrator)
Fold change = 2^(-ΔΔCt)
Ct 3.3 cycles difference = 10-fold concentration difference (at 100% efficiency)</div>
  <div class="pv-formula-example">Example: ΔΔCt = 2.0 → Fold change = 2^(-2.0) = 0.25 → Target is 4× downregulated vs calibrator</div>
</div>
<div class="pv-trap"><strong>TRAP #1:</strong> "Higher Ct = more template." → FALSE. Higher Ct = LESS starting template (more cycles needed to reach threshold). Classic direction reversal trap.</div>
<div class="pv-trap"><strong>TRAP #2:</strong> "ddPCR requires a standard curve." → FALSE. ddPCR uses Poisson statistics for absolute quantification — this is its key advantage over qPCR. No standard curve needed.</div>
<div class="pv-trap"><strong>TRAP #3:</strong> "Housekeeping gene Ct values should be identical across all samples." → Not exactly. Reference gene Ct should be stable (low CV) but minor variation is acceptable. Genes with Ct variation &gt;1 between conditions are poor reference choices.</div>`
          }
        ]
      },
      {
        id: "ascp-ngs",
        icon: "🔬",
        title: "Sequencing Technologies — Domain 4 (20% of Exam)",
        weight: "critical",
        subtitle: "NGS workflow · Variant calling · File formats · Sanger comparison · Clinical interpretation",
        category: "Sequencing",
        tag: "formula",
        subsections: [
          {
            heading: "NGS Workflow — Complete Pipeline",
            content: `
<div class="pv-tree">NGS CLINICAL WORKFLOW
├── 1. SAMPLE INPUT
│   ├── DNA/RNA extraction (check integrity: RIN ≥ 7 for RNA)
│   ├── Quantification: Qubit (fluorometric) or NanoDrop (UV — less sensitive)
│   └── Quality check: 260/280 ratio ~1.8 (DNA) or ~2.0 (RNA)
│
├── 2. LIBRARY PREPARATION
│   ├── Fragmentation (mechanical: sonication, or enzymatic)
│   ├── End repair + A-tailing
│   ├── Adapter ligation (adds flow cell binding sequences + index)
│   ├── Size selection (AMPure beads)
│   └── Library amplification (optional; adds duplicates)
│
├── 3. SEQUENCING
│   ├── Flow cell hybridization
│   ├── Bridge amplification → cluster generation
│   ├── Sequencing-by-synthesis (Illumina) — reversible terminators
│   └── Base calling → FASTQ output
│
├── 4. BIOINFORMATICS PIPELINE
│   ├── QC: FastQC → trim adapters (Trimmomatic/Cutadapt)
│   ├── Alignment: BWA-MEM → SAM/BAM output
│   ├── Mark duplicates: Picard MarkDuplicates
│   ├── Base quality score recalibration (BQSR — GATK)
│   ├── Variant calling: GATK HaplotypeCaller → VCF output
│   └── Annotation: VEP, ANNOVAR → clinical significance
│
└── 5. VARIANT INTERPRETATION
    ├── ACMG/AMP 5-tier classification (see below)
    ├── Population frequency check (gnomAD)
    └── Clinical report generation</div>`
          },
          {
            heading: "ACMG/AMP Variant Classification — 5-Tier System",
            content: `
<table class="pv-table">
  <thead><tr><th>Class</th><th>Name</th><th>Reporting</th><th>Key Criteria</th></tr></thead>
  <tbody>
    <tr class="pv-row-critical"><td>Class 5</td><td>Pathogenic</td><td>Report + genetic counseling</td><td>PVS1 (null variant in LOF gene) + PS/PM criteria</td></tr>
    <tr class="pv-row-critical"><td>Class 4</td><td>Likely Pathogenic</td><td>Report with qualifier</td><td>≥90% probability pathogenic but insufficient for Class 5</td></tr>
    <tr class="pv-row-high"><td>Class 3</td><td>Variant of Uncertain Significance (VUS)</td><td>Report as VUS; no clinical action</td><td>Insufficient evidence for classification; reclassify as evidence accrues</td></tr>
    <tr><td>Class 2</td><td>Likely Benign</td><td>May report; no clinical action</td><td>≥90% probability benign</td></tr>
    <tr><td>Class 1</td><td>Benign</td><td>Generally not reported</td><td>High population frequency + known benign functional data</td></tr>
  </tbody>
</table>
<div class="pv-trap"><strong>TRAP:</strong> "A VUS (Class 3) means the variant is harmless." → FALSE. VUS means INSUFFICIENT EVIDENCE to classify — it may be pathogenic or benign. Clinical labs must not use VUS for diagnostic decisions without additional evidence. Frequent reclassification exam scenario.</div>`
          },
          {
            heading: "File Formats — Quick Reference",
            content: `
<div class="pv-def"><strong>FASTQ</strong> — Raw sequencing output. Contains: read sequence + quality scores (Phred, ASCII-encoded). Q30 = 99.9% base call accuracy. Q20 = 99%. Minimum Q20 per base for clinical NGS.</div>
<div class="pv-def"><strong>SAM/BAM</strong> — Sequence Alignment Map / Binary Alignment Map. Read sequences aligned to reference genome. BAM is compressed binary SAM. CRAM = even more compressed.</div>
<div class="pv-def"><strong>VCF</strong> — Variant Call Format. Lists all variants detected vs reference. Fields: CHROM, POS, ID, REF, ALT, QUAL, FILTER, INFO, FORMAT. GT field = genotype (0/0 = homozygous ref, 0/1 = het, 1/1 = homozygous alt).</div>
<div class="pv-tip"><strong>Exam tip:</strong> Know the transformation: FASTQ → (alignment) → BAM → (variant calling) → VCF → (annotation) → clinical report. Each step has a corresponding tool: BWA-MEM, GATK, VEP/ANNOVAR.</div>`
          }
        ]
      },
      {
        id: "ascp-extraction",
        icon: "🧪",
        title: "Nucleic Acid Extraction & QC — Domain 2",
        weight: "high",
        subtitle: "Extraction methods · QC metrics · Inhibitors · Storage conditions",
        category: "Nucleic Acids",
        tag: "formula",
        subsections: [
          {
            heading: "Extraction Method Comparison",
            content: `
<table class="pv-table">
  <thead><tr><th>Method</th><th>Principle</th><th>Best For</th><th>Key Limitation</th></tr></thead>
  <tbody>
    <tr class="pv-row-critical"><td>Silica column (spin column)</td><td>DNA binds silica under chaotropic + low pH; elutes with low-salt buffer or water</td><td>High-purity DNA/RNA from most samples</td><td>Lower yield vs precipitation; can lose small fragments</td></tr>
    <tr class="pv-row-high"><td>Magnetic bead</td><td>DNA/RNA binds paramagnetic beads; magnetic separation removes contaminants</td><td>Automation, blood, FFPE, small volumes</td><td>Higher cost; bead carryover can inhibit downstream assays</td></tr>
    <tr><td>Phenol-chloroform</td><td>Phase separation: DNA in aqueous, proteins in organic phase</td><td>High-molecular-weight DNA, research</td><td>Toxic (phenol), manual, not automation-friendly</td></tr>
    <tr><td>Chelex resin</td><td>Chelates metal ions that inhibit PCR; heat lysis releases DNA</td><td>Forensic (touch DNA, old samples)</td><td>Single-stranded DNA (heat denaturation); not for restriction digestion</td></tr>
  </tbody>
</table>
<div class="pv-formula">
  <div class="pv-formula-title">Purity Ratios — NanoDrop Interpretation</div>
  <div class="pv-formula-math">A260/A280 ratio:
  DNA: ~1.8 (acceptable: 1.7–2.0)
  RNA: ~2.0 (acceptable: 1.9–2.1)
  &lt;1.7 → protein contamination (absorbs at 280nm)
  &gt;2.1 → RNA contamination in DNA prep

A260/A230 ratio:
  Acceptable: 2.0–2.2
  &lt;1.8 → chaotropic salt, phenol, or polysaccharide contamination
  Low A260/A230 = most common PCR inhibitor source</div>
  <div class="pv-formula-example">TRAP: A260/A280 = 2.2 on a DNA sample. Most students say "RNA contamination." But first check the A260/A230 — if that's fine, the 2.2 may indicate slightly alkaline elution buffer (acceptable).</div>
</div>`
          }
        ]
      },
      {
        id: "ascp-qc",
        icon: "📊",
        title: "QC, Lab Ops & CLIA Regulations — Domain 6",
        weight: "high",
        subtitle: "Westgard rules · CLIA requirements · Proficiency testing · Delta checks · QC frequency",
        category: "Lab QC",
        tag: "formula",
        subsections: [
          {
            heading: "Westgard Rules — Complete Reference",
            content: `
<div class="pv-formula">
  <div class="pv-formula-title">Westgard Multi-Rules for QC Failure Detection</div>
  <div class="pv-formula-math">1₂s — WARNING: 1 QC value exceeds ±2SD (evaluate further; do not reject alone)
1₃s — REJECTION: 1 QC value exceeds ±3SD → reject run (random error)
2₂s — REJECTION: 2 consecutive QC values exceed +2SD or -2SD on same side → systematic error
R₄s — REJECTION: 1 QC value exceeds +2SD AND another exceeds -2SD in same run → random error
4₁s — REJECTION: 4 consecutive values on same side of mean (all +1SD or all -1SD) → systematic shift
10x  — REJECTION: 10 consecutive values on same side of mean → long-term systematic drift</div>
  <div class="pv-formula-example">Memory aid: "1 warning, reject with 1-3, 2-2, R-4, 4-1, or 10x." The R4s rule is the most commonly tested — it catches random error across ONE run.</div>
</div>
<div class="pv-trap"><strong>TRAP:</strong> "If only one QC control fails, the entire run must be repeated." → The 1₂s rule is a WARNING only. You do NOT reject the run on 1₂s alone — you evaluate using the multi-rule system. Automatic rejection only occurs on 1₃s, 2₂s, R₄s, 4₁s, or 10ₓ.</div>`
          },
          {
            heading: "CLIA Requirements — Critical Reference Points",
            content: `
<div class="pv-def"><strong>CLIA (Clinical Laboratory Improvement Amendments)</strong> — Federal law regulating all US clinical laboratories performing testing on human specimens. Administered by CMS. Three levels: Certificate of Waiver, Certificate of PPM Procedures, Certificate of Compliance/Accreditation.</div>
<table class="pv-table">
  <thead><tr><th>CLIA Requirement</th><th>Frequency/Threshold</th><th>Consequence of Non-Compliance</th></tr></thead>
  <tbody>
    <tr class="pv-row-critical"><td>Proficiency Testing (PT)</td><td>3 times/year per analyte; ≥80% score required</td><td>Suspension of testing for that analyte</td></tr>
    <tr class="pv-row-high"><td>QC frequency (non-waived)</td><td>Minimum 2 levels per day of testing (high + low)</td><td>Finding on inspection; invalidate results</td></tr>
    <tr><td>Personnel qualifications (High complexity)</td><td>Laboratory Director: MD/PhD or doctoral degree + board certified</td><td>CLIA certificate revocation</td></tr>
    <tr><td>Calibration verification</td><td>Every 6 months or when reagent lot changes</td><td>Results unreliable; may require repeat testing</td></tr>
    <tr><td>Delta check</td><td>Compare current vs previous patient result; flag if outside expected delta</td><td>Specimen mix-up detection; repeat required</td></tr>
  </tbody>
</table>
<div class="pv-trap"><strong>TRAP:</strong> "Proficiency testing samples must be tested with extra care." → ILLEGAL. PT samples must be tested exactly as patient samples — same personnel, same process, no consultation with other labs. Intentional manipulation = CLIA violation + possible exclusion from Medicare/Medicaid.</div>`
          }
        ]
      },
      {
        id: "ascp-expression",
        icon: "📈",
        title: "Gene Expression & Epigenetics — Domain 5",
        weight: "medium",
        subtitle: "RNA-seq workflow · scRNA-seq · Epigenetic modifications · ChIP-seq · ATAC-seq",
        category: "Gene Expression",
        tag: "formula",
        subsections: [
          {
            heading: "RNA-seq vs scRNA-seq — Key Distinctions",
            content: `
<table class="pv-table">
  <thead><tr><th>Dimension</th><th>Bulk RNA-seq</th><th>scRNA-seq</th></tr></thead>
  <tbody>
    <tr><td>Input</td><td>Pooled RNA from thousands of cells</td><td>Single-cell suspension; ~1,000–10,000 cells captured</td></tr>
    <tr class="pv-row-high"><td>Resolution</td><td>Average expression across all cells</td><td>Cell-by-cell expression profile; reveals heterogeneity</td></tr>
    <tr><td>Sensitivity</td><td>High (many cells pool signal)</td><td>Lower per cell (high dropout rate for lowly expressed genes)</td></tr>
    <tr><td>Cost</td><td>Lower (~$300–500/sample)</td><td>Higher (~$1,000–3,000/sample on 10x platform)</td></tr>
    <tr class="pv-row-critical"><td>Key use case</td><td>DEG analysis between conditions; bulk comparison</td><td>Cell type identification, trajectory analysis, rare cell discovery</td></tr>
    <tr><td>Normalization</td><td>DESeq2, edgeR (negative binomial)</td><td>Seurat SCTransform; log-normalization</td></tr>
  </tbody>
</table>
<div class="pv-def"><strong>Dropout (scRNA-seq)</strong> — Zero counts for a gene in a cell when the gene IS expressed, due to capture inefficiency. Typical dropout rates: 80–95% in 10x Chromium. Imputation methods (MAGIC, scImpute) address this but introduce their own biases.</div>`
          },
          {
            heading: "Epigenetic Modification Summary",
            content: `
<div class="pv-def"><strong>DNA Methylation</strong> — Addition of CH₃ to cytosine at CpG dinucleotides. Promoter methylation → gene silencing. Bisulfite sequencing converts unmethylated C→U (then T in sequencing), methylated C remains C. WGBS = whole-genome bisulfite sequencing.</div>
<div class="pv-def"><strong>Histone Modifications</strong> — Post-translational modifications of histone tails. H3K4me3 = active promoter. H3K27me3 = repressed. H3K36me3 = actively transcribed gene body. H3K27ac = active enhancer. Detected by ChIP-seq.</div>
<div class="pv-def"><strong>ChIP-seq</strong> — Chromatin Immunoprecipitation sequencing. Cross-link protein-DNA, sonicate, immunoprecipitate with antibody, sequence. Input control essential for peak calling normalization.</div>
<div class="pv-trap"><strong>TRAP:</strong> "Promoter methylation always silences gene expression." → Generally true but NOT always. Gene body methylation is associated with ACTIVE transcription. Context (location relative to gene) determines effect. Exam will test CpG island (promoter) vs gene body methylation distinction.</div>`
          }
        ]
      }
    ],
    flashcards: [
      { q: "What does a Ct value of 3.3 cycles difference represent in qPCR?", a: "A 10-fold (one log) difference in starting template concentration. Higher Ct = less template. Ct increases as template decreases." },
      { q: "What is the key advantage of ddPCR over qPCR?", a: "Absolute quantification without a standard curve, using Poisson statistics. Gold standard for rare variants (<1% VAF) and minimal residual disease (MRD) detection." },
      { q: "ACMG Class 3 (VUS) — what does this mean clinically?", a: "Variant of Uncertain Significance — INSUFFICIENT evidence to classify as pathogenic or benign. Cannot be used for clinical decision-making without additional evidence." },
      { q: "What does an A260/A280 ratio of 1.4 indicate for a DNA sample?", a: "Protein contamination (absorbs at 280nm). Acceptable range for DNA is 1.7–2.0. Below 1.7 indicates protein/aromatic compound contamination." },
      { q: "The 1₂s Westgard rule — action required?", a: "WARNING ONLY. One QC value exceeding ±2SD is a warning flag — do NOT reject the run. Evaluate further using multi-rule system before deciding." },
      { q: "What NGS file format contains raw reads with quality scores?", a: "FASTQ. Q30 = 99.9% base call accuracy. Each base has a Phred quality score. Minimum Q20 acceptable for clinical sequencing." },
      { q: "Bisulfite sequencing converts what to what?", a: "Unmethylated cytosine (C) → uracil (U), which reads as thymine (T) after PCR. Methylated cytosine remains as C. This allows discrimination of methylated vs unmethylated sites." },
      { q: "CLIA proficiency testing — what score is required?", a: "≥80% (4 out of 5 challenges per analyte per testing event). PT must be conducted 3 times per year. Failure triggers suspension of that test." },
      { q: "What is the H3K27me3 histone modification associated with?", a: "Gene repression / silenced chromatin. H3K4me3 = active promoter. H3K27ac = active enhancer. H3K36me3 = active transcription elongation." },
      { q: "Nested PCR — what is the primary clinical concern?", a: "High contamination risk due to open-tube transfer between first and second PCR. Requires strict physical separation of pre- and post-amplification areas. Highest contamination risk of all PCR methods." },
      { q: "What does the R₄s Westgard rule detect?", a: "Random error within a single run. One QC exceeds +2SD AND another exceeds -2SD in the same run. The 4-SD range between the two QC values triggers run rejection." },
      { q: "scRNA-seq dropout — what causes it and what is the typical rate?", a: "Stochastic failure to capture/amplify low-abundance transcripts from a single cell. Typical dropout rate: 80–95% on 10x Chromium platform. Leads to zero-inflated count matrices." }
    ]
  }
} as const;