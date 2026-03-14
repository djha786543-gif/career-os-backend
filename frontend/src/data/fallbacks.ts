export const DEMO_JOBS_FALLBACK = {
  status: "success",
  source: "demo",
  totalResults: 3,
  jobs: [
    {
      id: "demo-1",
      title: "Senior IT Audit Manager (Demo)",
      company: "TechCorp Systems",
      location: "Los Angeles, CA (Remote)",
      salary: "$165,000 - $190,000",
      snippet: "Leading IT audit engagements and AI governance reviews. Experience with NIST AI RMF and SOC2 required.",
      applyUrl: "https://example.com/apply",
      fitScore: 95,
      workMode: "Remote",
      isRemote: true,
      postedDate: "2h ago",
      keySkills: ["IT Audit", "AI Governance", "NIST"],
      region: "US"
    },
    {
      id: "demo-2",
      title: "Director of IT Risk (Demo)",
      company: "FinanceFlow Inc",
      location: "Torrance, CA",
      salary: "Not disclosed",
      snippet: "Overseeing enterprise-wide IT risk assessments and compliance frameworks. Strong background in COBIT and ISO 27001.",
      applyUrl: "https://example.com/apply",
      fitScore: 88,
      workMode: "On-site",
      isRemote: false,
      postedDate: "1d ago",
      keySkills: ["Risk Management", "Compliance", "ISO 27001"],
      region: "US"
    },
    {
      id: "demo-3",
      title: "Postdoctoral Researcher - Bioinformatics (Demo)",
      company: "BioGen Institute",
      location: "San Francisco, CA (Hybrid)",
      salary: "$75,000 - $85,000",
      snippet: "Conducting advanced genomic analysis using scRNA-seq and spatial transcriptomics. PhD in Molecular Biology required.",
      applyUrl: "https://example.com/apply",
      fitScore: 92,
      workMode: "Hybrid",
      isRemote: false,
      postedDate: "3d ago",
      keySkills: ["Bioinformatics", "scRNA-seq", "Genomics"],
      region: "US"
    }
  ]
};

export const DEMO_MARKET_FALLBACK = {
  source: "demo",
  data: [
    { city: "San Francisco", demand: 95, jobs: 1240, yoy: "+12%" },
    { city: "New York", demand: 88, jobs: 980, yoy: "+8%" },
    { city: "Los Angeles", demand: 82, jobs: 750, yoy: "-2%" },
    { city: "Boston", demand: 91, jobs: 620, yoy: "+15%" }
  ]
};

export const DEMO_SALARY_FALLBACK = {
  source: "demo",
  data: [
    { title: "IT Audit Manager", low: 130000, mid: 155000, high: 185000, remote_premium: "+12%" },
    { title: "AI Risk Lead", low: 150000, mid: 175000, high: 210000, remote_premium: "+15%" },
    { title: "Senior Scientist", low: 110000, mid: 135000, high: 165000, remote_premium: "N/A" }
  ]
};

export const DEMO_TRENDS_FALLBACK = {
  source: "demo",
  trends: {
    hot: ["AI Governance", "EU AI Act", "LLM Security"],
    rising: ["ISO 42001", "NIST AI RMF", "Spatial Transcriptomics"],
    stable: ["SOC2", "ITGC", "qPCR"],
    cooling: ["Manual Testing", "On-prem Security"]
  }
};

export const DEMO_SKILLS_FALLBACK = {
  source: "demo",
  skills: {
    current: { "IT Audit": 95, "Risk Assessment": 90, "AI Governance": 65, "Cloud Security": 75 },
    gaps: ["LLM Red-teaming", "EU AI Act Compliance", "ServiceNow GRC"],
    target_roles: ["AI Audit Director", "VP IT Risk"]
  }
};
