/**
 * orgConfigDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ (Deobrat Jha) — Isolated org config for IT Audit / Cloud Risk Monitor.
 * Completely separate from Pooja's orgConfig.ts — zero crossover.
 *
 * Profile DNA: IT Audit Manager, CISA, AWS Certified Cloud Practitioner.
 * Core Keywords: SOX 404, ITGC/ITAC, Cloud Security, SAP S/4HANA, NIST,
 *                AI/ML Governance, SOC1/SOC2, GRC.
 *
 * 85 orgs total:
 *   US  — Big 4 (4) + Financial Services (20) + Tech/Cloud (10) + Manufacturing (5)
 *   India — Big 4 India (4) + Banking (8) + GCCs Financial (15) + GCCs Tech (19)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type DJSector = 'big4' | 'banking' | 'tech-cloud' | 'manufacturing'
export type DJCountry = 'USA' | 'India' | 'Europe'

export interface DJMonitorOrg {
  name: string
  sector: DJSector
  country: DJCountry
  careersUrl?: string
  rssUrl?: string                                              // RSS feed URL (free, direct job listings)
  apiType: 'websearch' | 'rss' | 'remotive' | 'adzuna'       // adzuna = Adzuna free job API
  searchQuery: string
  adzunaCountry?: string   // Adzuna country code: 'us', 'gb', 'de', 'fr', 'nl'
  serperGl?: string        // Serper Google locale override: 'us', 'gb', 'de', 'in'
  eadFriendly?: boolean    // US contract/W2/consultant roles — EAD appropriate
  managerialGrade?: boolean // India Manager+ filter enforced
  slowFetch?: boolean
}

// ═══ US — Big 4 (IT Audit / Risk Advisory) ═══════════════════════════════════
const US_BIG4: DJMonitorOrg[] = [
  {
    name: 'EY US Technology Risk',
    sector: 'big4', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'EY Ernst Young Technology Risk IT Audit Manager Senior Auditor SOX ITGC Contract W2 2026',
    careersUrl: 'https://careers.ey.com',
  },
  {
    name: 'Deloitte US Risk Advisory',
    sector: 'big4', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Deloitte Risk Advisory IT Audit Manager Senior Auditor SOX ITGC Cloud Security Contract 2026',
    careersUrl: 'https://www2.deloitte.com/us/en/careers.html',
  },
  {
    name: 'KPMG US Technology Risk',
    sector: 'big4', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'KPMG Technology Risk IT Audit Manager Senior Auditor SOX ITGC ITAC W2 2026',
    careersUrl: 'https://kpmgcareers.kpmg.com',
  },
  {
    name: 'PwC US Digital Assurance',
    sector: 'big4', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'PwC Digital Assurance IT Audit Manager Senior Auditor SOX Cloud GRC Contract 2026',
    careersUrl: 'https://www.pwc.com/us/en/careers.html',
  },
]

// ═══ US — Financial Services (Top 100 Firms) ══════════════════════════════════
const US_BANKING: DJMonitorOrg[] = [
  {
    name: 'Goldman Sachs',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Goldman Sachs IT Audit Manager Senior Auditor SOX ITGC Cloud Risk Internal Audit 2026',
    careersUrl: 'https://www.goldmansachs.com/careers',
  },
  {
    name: 'JPMorgan Chase',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'JPMorgan Chase IT Audit Manager Senior Auditor SOX ITGC Cloud Security GRC 2026',
    careersUrl: 'https://careers.jpmorgan.com',
  },
  {
    name: 'Bank of America',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Bank of America IT Audit Manager Senior Auditor SOX ITGC Cloud Risk Assurance 2026',
    careersUrl: 'https://careers.bankofamerica.com',
  },
  {
    name: 'Citigroup',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Citi Citigroup IT Audit Manager Senior Auditor SOX ITGC Technology Risk 2026',
    careersUrl: 'https://jobs.citi.com',
  },
  {
    name: 'Wells Fargo',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Wells Fargo IT Audit Manager Senior Auditor SOX Technology Audit Cloud Security 2026',
    careersUrl: 'https://www.wellsfargojobs.com',
  },
  {
    name: 'Morgan Stanley',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Morgan Stanley IT Audit Manager Senior Auditor Technology Risk SOX ITGC 2026',
    careersUrl: 'https://www.morganstanley.com/people/careers',
  },
  {
    name: 'BlackRock',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'BlackRock IT Audit Manager Senior Auditor Technology Risk SOX Cloud Security 2026',
    careersUrl: 'https://careers.blackrock.com',
  },
  {
    name: 'Fidelity Investments',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Fidelity Investments IT Audit Manager Senior Auditor SOX ITGC Cloud Risk GRC 2026',
    careersUrl: 'https://jobs.fidelity.com',
  },
  {
    name: 'Capital One',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Capital One IT Audit Manager Senior Auditor Cloud Security SOX ITGC AWS GRC 2026',
    careersUrl: 'https://www.capitalonecareers.com',
  },
  {
    name: 'American Express',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'American Express IT Audit Manager Senior Auditor SOX Technology Risk Cloud Security 2026',
    careersUrl: 'https://www.americanexpress.com/en-us/careers',
  },
  {
    name: 'Visa Inc',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Visa IT Audit Manager Senior Auditor Technology Risk SOX Cloud Security 2026',
    careersUrl: 'https://www.visa.com/careers',
  },
  {
    name: 'Mastercard',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Mastercard IT Audit Manager Senior Auditor SOX ITGC Cloud Risk GRC 2026',
    careersUrl: 'https://careers.mastercard.com',
  },
  {
    name: 'Charles Schwab',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Charles Schwab IT Audit Manager Senior Auditor SOX Technology Risk Cloud Security 2026',
    careersUrl: 'https://www.aboutschwab.com/careers',
  },
  {
    name: 'PayPal',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'PayPal IT Audit Manager Senior Auditor SOX ITGC Cloud Risk CISA 2026',
    careersUrl: 'https://www.paypal.com/us/webapps/mpp/jobs',
  },
  {
    name: 'Discover Financial',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Discover Financial IT Audit Manager Senior Auditor SOX Technology Risk 2026',
    careersUrl: 'https://careers.discover.com',
  },
  {
    name: 'State Street',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'State Street IT Audit Manager Senior Auditor Technology Risk SOX Cloud Security 2026',
    careersUrl: 'https://careers.statestreet.com',
  },
  {
    name: 'BNY Mellon',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'BNY Mellon IT Audit Manager Senior Auditor SOX ITGC Technology Risk 2026',
    careersUrl: 'https://www.bnymellon.com/us/en/careers.html',
  },
  {
    name: 'Vanguard',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Vanguard IT Audit Manager Senior Auditor SOX Technology Risk Cloud Security 2026',
    careersUrl: 'https://www.vanguardjobs.com',
  },
  {
    name: 'T. Rowe Price',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'T Rowe Price IT Audit Manager Senior Auditor SOX Technology Risk Cloud Security 2026',
    careersUrl: 'https://www.troweprice.com/personal-investing/about-t-rowe-price/careers.html',
  },
  {
    name: 'Nasdaq',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Nasdaq IT Audit Manager Senior Auditor Technology Risk SOX Cloud Security GRC 2026',
    careersUrl: 'https://www.nasdaq.com/nasdaq-careers',
  },
]

// ═══ US — Tech / Cloud ════════════════════════════════════════════════════════
const US_TECH: DJMonitorOrg[] = [
  {
    name: 'Amazon Web Services',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'AWS Amazon IT Audit Manager Senior Auditor Cloud Security SOX ITGC AI Governance 2026',
    careersUrl: 'https://www.amazon.jobs',
  },
  {
    name: 'Microsoft',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Microsoft IT Audit Manager Senior Auditor Cloud Risk SOX ITGC Azure Security GRC 2026',
    careersUrl: 'https://careers.microsoft.com',
  },
  {
    name: 'Google Cloud',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Google Cloud IT Audit Manager Senior Auditor SOX Technology Risk AI Governance CISA 2026',
    careersUrl: 'https://careers.google.com',
  },
  {
    name: 'Salesforce',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Salesforce IT Audit Manager Senior Auditor SOX Cloud Security GRC ITGC 2026',
    careersUrl: 'https://www.salesforce.com/company/careers',
  },
  {
    name: 'ServiceNow',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'ServiceNow IT Audit Manager Senior Auditor SOX GRC Cloud Risk Technology Audit 2026',
    careersUrl: 'https://www.servicenow.com/careers.html',
  },
  {
    name: 'IBM',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'IBM IT Audit Manager Senior Auditor SOX Cloud Security NIST GRC 2026',
    careersUrl: 'https://www.ibm.com/us-en/employment',
  },
  {
    name: 'Oracle',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Oracle IT Audit Manager Senior Auditor SOX ITGC Cloud Risk Technology Audit 2026',
    careersUrl: 'https://www.oracle.com/corporate/careers',
  },
  {
    name: 'SAP America',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'SAP America IT Audit Manager Senior Auditor SAP S4HANA SOX ITGC Cloud Security 2026',
    careersUrl: 'https://www.sap.com/about/careers.html',
  },
  {
    name: 'Accenture',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Accenture IT Audit Manager Senior Auditor SOX Technology Risk Cloud Security GRC 2026',
    careersUrl: 'https://www.accenture.com/us-en/careers',
  },
  {
    name: 'Cognizant',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Cognizant IT Audit Manager Senior Auditor SOX ITGC Cloud Security 2026',
    careersUrl: 'https://careers.cognizant.com',
  },
]

// ═══ US — Manufacturing / Other ═══════════════════════════════════════════════
const US_MANUFACTURING: DJMonitorOrg[] = [
  {
    name: 'Public Storage',
    sector: 'manufacturing', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Public Storage IT Audit Manager Senior Auditor SOX Technology Risk Internal Audit 2026',
    careersUrl: 'https://jobs.publicstorage.com',
  },
  {
    name: 'Western Digital',
    sector: 'manufacturing', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Western Digital IT Audit Manager Senior Auditor SOX ITGC Cloud Security Technology Risk 2026',
    careersUrl: 'https://www.westerndigital.com/company/careers',
  },
  {
    name: 'Investar Bank',
    sector: 'manufacturing', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Investar Bank IT Audit Manager Senior Auditor SOX Technology Risk Compliance 2026',
  },
  {
    name: 'Intel Corporation',
    sector: 'manufacturing', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Intel Corporation IT Audit Manager Senior Auditor SOX ITGC Cloud Security Technology Risk 2026',
    careersUrl: 'https://www.intel.com/content/www/us/en/jobs/jobs-at-intel.html',
  },
  {
    name: 'Applied Materials',
    sector: 'manufacturing', country: 'USA', eadFriendly: true,
    apiType: 'websearch',
    searchQuery: 'Applied Materials IT Audit Manager Senior Auditor SOX Technology Risk ITGC 2026',
    careersUrl: 'https://careers.appliedmaterials.com',
  },
]

// ═══ India — Big 4 (Manager+ Only) ═══════════════════════════════════════════
const INDIA_BIG4: DJMonitorOrg[] = [
  {
    name: 'EY India GDS',
    sector: 'big4', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'EY India GDS IT Audit Manager Senior Manager SOX ITGC Cloud Security 2026',
    careersUrl: 'https://careers.ey.com',
  },
  {
    name: 'Deloitte India',
    sector: 'big4', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Deloitte India IT Audit Manager Senior Manager SOX ITGC Cloud Risk 2026',
    careersUrl: 'https://www2.deloitte.com/in/en/careers.html',
  },
  {
    name: 'KPMG India',
    sector: 'big4', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'KPMG India IT Audit Manager Director Technology Risk SOX GRC 2026',
    careersUrl: 'https://kpmg.com/in/en/home/careers.html',
  },
  {
    name: 'PwC India',
    sector: 'big4', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'PwC India IT Audit Manager Senior Manager Technology Risk SOX ITGC 2026',
    careersUrl: 'https://www.pwc.in/careers.html',
  },
]

// ═══ India — Banking (Manager+ Only) ══════════════════════════════════════════
const INDIA_BANKING: DJMonitorOrg[] = [
  {
    name: 'HDFC Bank',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'HDFC Bank IT Audit Manager Head Technology Audit SOX GRC CISA 2026',
    careersUrl: 'https://www.hdfcbank.com/careers',
  },
  {
    name: 'ICICI Bank',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'ICICI Bank IT Audit Manager Director Technology Risk SOX Cloud Security 2026',
    careersUrl: 'https://www.icicibankcareer.com',
  },
  {
    name: 'Axis Bank',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Axis Bank IT Audit Manager Senior Manager Technology Risk GRC SOX 2026',
    careersUrl: 'https://www.axisbank.com/about-us/careers',
  },
  {
    name: 'Kotak Mahindra Bank',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Kotak Mahindra Bank IT Audit Manager Technology Risk Cloud Security 2026',
    careersUrl: 'https://www.kotak.com/en/about-us/careers.html',
  },
  {
    name: 'IDFC First Bank',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'IDFC First Bank IT Audit Manager Technology Risk SOX GRC Cloud 2026',
    careersUrl: 'https://www.idfcfirstbank.com/about-us/careers',
  },
  {
    name: 'Yes Bank',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Yes Bank IT Audit Manager Technology Risk Head Internal Audit 2026',
    careersUrl: 'https://www.yesbank.in/careers',
  },
  {
    name: 'IndusInd Bank',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'IndusInd Bank IT Audit Manager AVP VP Technology Risk SOX Cloud 2026',
    careersUrl: 'https://www.indusind.com/iblogs/categories/careers',
  },
  {
    name: 'RBL Bank',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'RBL Bank IT Audit Manager Technology Risk Cloud Security GRC 2026',
    careersUrl: 'https://www.rblbank.com/careers',
  },
]

// ═══ India — GCCs — Financial Services (Manager+ Only) ════════════════════════
const INDIA_GCC_FINANCIAL: DJMonitorOrg[] = [
  {
    name: 'Goldman Sachs India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Goldman Sachs India IT Audit Manager Technology Risk SOX GCC Bengaluru 2026',
    careersUrl: 'https://www.goldmansachs.com/careers',
  },
  {
    name: 'JPMorgan India GCC',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'JPMorgan Chase India GCC IT Audit Manager Technology Risk SOX Cloud 2026',
    careersUrl: 'https://careers.jpmorgan.com',
  },
  {
    name: 'Citi India Technology',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Citi India Technology GCC IT Audit Manager SOX ITGC Cloud Risk 2026',
    careersUrl: 'https://jobs.citi.com',
  },
  {
    name: 'Deutsche Bank India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Deutsche Bank India IT Audit Manager Technology Risk SOX GCC Pune 2026',
    careersUrl: 'https://careers.db.com',
  },
  {
    name: 'HSBC India GCC',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'HSBC India GCC IT Audit Manager Technology Risk SOX Cloud Security 2026',
    careersUrl: 'https://www.hsbc.com/careers',
  },
  {
    name: 'Standard Chartered India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Standard Chartered India GCC IT Audit Manager Technology Risk SOX 2026',
    careersUrl: 'https://www.sc.com/en/careers',
  },
  {
    name: 'Barclays India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Barclays India GCC IT Audit Manager Technology Risk Cloud Security SOX 2026',
    careersUrl: 'https://home.barclays/careers',
  },
  {
    name: 'American Express India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'American Express India GCC IT Audit Manager SOX Technology Risk Cloud 2026',
    careersUrl: 'https://www.americanexpress.com/en-us/careers',
  },
  {
    name: 'Fidelity India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Fidelity India GCC IT Audit Manager Technology Risk SOX GRC 2026',
    careersUrl: 'https://jobs.fidelity.com',
  },
  {
    name: 'BlackRock India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'BlackRock India GCC IT Audit Manager Technology Risk SOX Cloud Security 2026',
    careersUrl: 'https://careers.blackrock.com',
  },
  {
    name: 'Morgan Stanley India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Morgan Stanley India GCC IT Audit Manager Technology Risk SOX 2026',
    careersUrl: 'https://www.morganstanley.com/people/careers',
  },
  {
    name: 'BNP Paribas India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'BNP Paribas India GCC IT Audit Manager Technology Risk SOX ITGC 2026',
    careersUrl: 'https://group.bnpparibas/en/careers',
  },
  {
    name: 'UBS India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'UBS India GCC IT Audit Manager Technology Risk SOX Cloud Security 2026',
    careersUrl: 'https://www.ubs.com/global/en/careers.html',
  },
  {
    name: 'Wells Fargo India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Wells Fargo India GCC IT Audit Manager Technology Risk SOX ITGC 2026',
    careersUrl: 'https://www.wellsfargojobs.com',
  },
  {
    name: 'ANZ India',
    sector: 'banking', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'ANZ India GCC IT Audit Manager Technology Risk Cloud Security SOX 2026',
    careersUrl: 'https://www.anz.com.au/careers',
  },
]

// ═══ India — GCCs — Tech (Manager+ Only) ══════════════════════════════════════
const INDIA_GCC_TECH: DJMonitorOrg[] = [
  {
    name: 'Amazon India GCC',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Amazon India GCC IT Audit Manager AWS Cloud Security SOX AI Governance 2026',
    careersUrl: 'https://www.amazon.jobs',
  },
  {
    name: 'Google India GCC',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Google India GCC IT Audit Manager Cloud Security SOX Technology Risk 2026',
    careersUrl: 'https://careers.google.com',
  },
  {
    name: 'Microsoft India GCC',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Microsoft India GCC IT Audit Manager Azure Cloud Security SOX NIST 2026',
    careersUrl: 'https://careers.microsoft.com',
  },
  {
    name: 'IBM India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'IBM India IT Audit Manager Cloud Security SOX GRC NIST Technology Risk 2026',
    careersUrl: 'https://www.ibm.com/in-en/employment',
  },
  {
    name: 'SAP India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'SAP India GCC IT Audit Manager SAP S4HANA SOX ITGC Cloud Risk 2026',
    careersUrl: 'https://www.sap.com/india/about/careers.html',
  },
  {
    name: 'Oracle India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Oracle India GCC IT Audit Manager Technology Risk SOX Cloud Security 2026',
    careersUrl: 'https://www.oracle.com/in/corporate/careers',
  },
  {
    name: 'Cognizant India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Cognizant India IT Audit Manager SOX ITGC Technology Risk GCC 2026',
    careersUrl: 'https://careers.cognizant.com',
  },
  {
    name: 'Infosys',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Infosys IT Audit Manager SOX ITGC Cloud Security Technology Risk GCC 2026',
    careersUrl: 'https://www.infosys.com/careers',
  },
  {
    name: 'Wipro',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Wipro IT Audit Manager Technology Risk SOX Cloud Security GRC 2026',
    careersUrl: 'https://careers.wipro.com',
  },
  {
    name: 'HCL Technologies',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'HCL Technologies IT Audit Manager SOX Technology Risk Cloud Security 2026',
    careersUrl: 'https://www.hcltech.com/careers',
  },
  {
    name: 'Tech Mahindra',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Tech Mahindra IT Audit Manager SOX Technology Risk Cloud Security GCC 2026',
    careersUrl: 'https://careers.techmahindra.com',
  },
  {
    name: 'Capgemini India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Capgemini India IT Audit Manager SOX ITGC Technology Risk Cloud Security 2026',
    careersUrl: 'https://www.capgemini.com/in-en/careers',
  },
  {
    name: 'Accenture India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Accenture India IT Audit Manager SOX Technology Risk Cloud Security GCC 2026',
    careersUrl: 'https://www.accenture.com/in-en/careers',
  },
  {
    name: 'TCS',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'TCS Tata Consultancy IT Audit Manager SOX Technology Risk Cloud Security 2026',
    careersUrl: 'https://www.tcs.com/careers',
  },
  {
    name: 'Mphasis',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Mphasis IT Audit Manager SOX Technology Risk Cloud Security GRC 2026',
    careersUrl: 'https://www.mphasis.com/careers.html',
  },
  {
    name: 'LTIMindtree',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'LTIMindtree IT Audit Manager SOX ITGC Technology Risk Cloud Security 2026',
    careersUrl: 'https://www.ltimindtree.com/careers',
  },
  {
    name: 'Publicis Sapient India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'Publicis Sapient India IT Audit Manager Technology Risk SOX Cloud Security 2026',
    careersUrl: 'https://careers.publicissapient.com',
  },
  {
    name: 'NTT Data India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'NTT Data India IT Audit Manager SOX Technology Risk Cloud Security GCC 2026',
    careersUrl: 'https://www.nttdata.com/global/en/careers',
  },
  {
    name: 'DXC Technology India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'websearch',
    searchQuery: 'DXC Technology India IT Audit Manager SOX ITGC Cloud Security Technology Risk 2026',
    careersUrl: 'https://dxc.com/us/en/about-dxc/careers',
  },
]

// ═══ FREE SOURCES — Indeed RSS + Remotive API (zero cost, direct listings) ════
// These bypass Serper entirely — structured job data straight from the source.
// Indeed RSS: confirmed job postings with title, company, location, apply URL.
// Remotive: structured JSON API for remote roles (no auth required).
const DJ_FREE_SOURCES: DJMonitorOrg[] = [
  // Manager-level (primary target)
  {
    name: 'Indeed RSS - IT Audit Manager US',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'rss',
    rssUrl: 'https://www.indeed.com/rss?q=it+audit+manager+sox+itgc&l=United+States&sort=date&fromage=14',
    searchQuery: 'IT Audit Manager SOX ITGC United States',
  },
  {
    name: 'Indeed RSS - Technology Risk Manager US',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'rss',
    rssUrl: 'https://www.indeed.com/rss?q=technology+risk+manager+cloud+audit+sox&l=United+States&sort=date&fromage=14',
    searchQuery: 'Technology Risk Manager Cloud Audit SOX',
  },
  {
    name: 'Indeed RSS - Cloud Security Audit Manager US',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'rss',
    rssUrl: 'https://www.indeed.com/rss?q=cloud+security+audit+manager+itgc&l=United+States&sort=date&fromage=14',
    searchQuery: 'Cloud Security Audit Manager ITGC',
  },
  {
    name: 'Indeed RSS - GRC Manager US',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'rss',
    rssUrl: 'https://www.indeed.com/rss?q=grc+manager+it+risk+sox+cisa&l=United+States&sort=date&fromage=14',
    searchQuery: 'GRC Manager IT Risk SOX CISA',
  },
  // Senior-level (one level below — USA only)
  {
    name: 'Indeed RSS - Senior IT Auditor US',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'rss',
    rssUrl: 'https://www.indeed.com/rss?q=senior+it+auditor+sox+itgc&l=United+States&sort=date&fromage=14',
    searchQuery: 'Senior IT Auditor SOX ITGC United States',
  },
  {
    name: 'Indeed RSS - Senior Technology Risk US',
    sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'rss',
    rssUrl: 'https://www.indeed.com/rss?q=senior+technology+risk+audit+sox&l=United+States&sort=date&fromage=14',
    searchQuery: 'Senior Technology Risk Audit SOX United States',
  },
  // India
  {
    name: 'Indeed RSS - IT Audit Manager India',
    sector: 'tech-cloud', country: 'India', managerialGrade: true,
    apiType: 'rss',
    rssUrl: 'https://www.indeed.co.in/rss?q=it+audit+manager+sox+itgc&l=India&sort=date&fromage=14',
    searchQuery: 'IT Audit Manager SOX ITGC India',
  },
  // Europe Indeed RSS
  {
    name: 'Indeed RSS - IT Audit Manager UK',
    sector: 'tech-cloud', country: 'Europe',
    apiType: 'rss',
    rssUrl: 'https://uk.indeed.com/rss?q=it+audit+manager+sox+itgc&l=United+Kingdom&sort=date&fromage=14',
    searchQuery: 'IT Audit Manager SOX ITGC UK',
  },
  {
    name: 'Indeed RSS - Senior IT Auditor UK',
    sector: 'banking', country: 'Europe',
    apiType: 'rss',
    rssUrl: 'https://uk.indeed.com/rss?q=senior+it+auditor+technology+risk+sox&l=United+Kingdom&sort=date&fromage=14',
    searchQuery: 'Senior IT Auditor Technology Risk SOX UK',
  },
  {
    name: 'Remotive - Remote IT Audit Manager',
    sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'remotive',
    searchQuery: 'it audit manager senior sox',
  },
]

// ═══ Europe — Big 4 (UK + Germany) ═══════════════════════════════════════════
const EU_BIG4: DJMonitorOrg[] = [
  {
    name: 'EY UK', sector: 'big4', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'EY UK IT Audit Manager Senior Auditor Technology Risk SOX ITGC London',
    careersUrl: 'https://careers.ey.com',
  },
  {
    name: 'Deloitte UK', sector: 'big4', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'Deloitte UK IT Audit Manager Senior Auditor SOX Technology Risk London',
    careersUrl: 'https://careers2.deloitte.com/gb',
  },
  {
    name: 'KPMG UK', sector: 'big4', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'KPMG UK IT Audit Manager Senior Auditor SOX Technology Risk London',
    careersUrl: 'https://www.kpmgcareers.co.uk',
  },
  {
    name: 'PwC UK', sector: 'big4', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'PwC UK IT Audit Manager Senior Auditor SOX Cloud Risk GRC London',
    careersUrl: 'https://www.pwc.co.uk/careers',
  },
  {
    name: 'EY Germany', sector: 'big4', country: 'Europe', serperGl: 'de',
    apiType: 'websearch',
    searchQuery: 'EY Germany IT Audit Manager Technology Risk SOX ITGC Frankfurt',
    careersUrl: 'https://careers.ey.com',
  },
  {
    name: 'Deloitte Germany', sector: 'big4', country: 'Europe', serperGl: 'de',
    apiType: 'websearch',
    searchQuery: 'Deloitte Germany IT Audit Manager Technology Risk SOX Frankfurt',
    careersUrl: 'https://jobs.deloitte.de',
  },
  {
    name: 'KPMG Germany', sector: 'big4', country: 'Europe', serperGl: 'de',
    apiType: 'websearch',
    searchQuery: 'KPMG Germany IT Audit Manager Technology Risk SOX Cloud',
    careersUrl: 'https://jobs.kpmg.de',
  },
  {
    name: 'PwC Germany', sector: 'big4', country: 'Europe', serperGl: 'de',
    apiType: 'websearch',
    searchQuery: 'PwC Germany IT Audit Manager Technology Risk SOX GRC',
    careersUrl: 'https://www.pwc.de/de/karriere',
  },
]

// ═══ Europe — Banking (UK + EMEA) ═════════════════════════════════════════════
const EU_BANKING: DJMonitorOrg[] = [
  {
    name: 'HSBC UK', sector: 'banking', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'HSBC UK IT Audit Manager Senior Auditor SOX Technology Risk London',
    careersUrl: 'https://www.hsbc.com/careers',
  },
  {
    name: 'Barclays UK', sector: 'banking', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'Barclays IT Audit Manager Senior Auditor SOX Technology Risk London',
    careersUrl: 'https://home.barclays/careers',
  },
  {
    name: 'Standard Chartered UK', sector: 'banking', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'Standard Chartered IT Audit Manager Technology Risk SOX GRC London',
    careersUrl: 'https://www.sc.com/en/careers',
  },
  {
    name: 'Lloyds Banking Group', sector: 'banking', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'Lloyds Banking Group IT Audit Manager Senior Auditor SOX Technology Risk',
    careersUrl: 'https://www.lloydsbankinggroup.com/careers',
  },
  {
    name: 'Deutsche Bank', sector: 'banking', country: 'Europe', serperGl: 'de',
    apiType: 'websearch',
    searchQuery: 'Deutsche Bank IT Audit Manager Technology Risk SOX Cloud Frankfurt London',
    careersUrl: 'https://careers.db.com',
  },
  {
    name: 'UBS', sector: 'banking', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'UBS IT Audit Manager Technology Risk SOX Cloud Security London Zurich',
    careersUrl: 'https://www.ubs.com/global/en/careers.html',
  },
  {
    name: 'BNP Paribas', sector: 'banking', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'BNP Paribas IT Audit Manager Technology Risk SOX London Paris',
    careersUrl: 'https://group.bnpparibas/en/careers',
  },
  {
    name: 'ING Group', sector: 'banking', country: 'Europe', serperGl: 'gb',
    apiType: 'websearch',
    searchQuery: 'ING IT Audit Manager Technology Risk SOX Cloud Security Amsterdam London',
    careersUrl: 'https://www.ing.jobs',
  },
]

// ═══ Adzuna — Free Job API (USA + UK / Europe) ════════════════════════════════
// Register free at https://developer.adzuna.com — set ADZUNA_APP_ID + ADZUNA_APP_KEY in Railway.
// Free tier: 20 results per call, excellent coverage for USA and UK/EU.
const ADZUNA_SOURCES: DJMonitorOrg[] = [
  // USA
  {
    name: 'Adzuna - IT Audit Manager USA', sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'adzuna', adzunaCountry: 'us',
    searchQuery: 'it audit manager sox itgc cloud security',
  },
  {
    name: 'Adzuna - Senior IT Auditor USA', sector: 'tech-cloud', country: 'USA', eadFriendly: true,
    apiType: 'adzuna', adzunaCountry: 'us',
    searchQuery: 'senior it auditor sox technology risk itgc',
  },
  {
    name: 'Adzuna - GRC Manager USA', sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'adzuna', adzunaCountry: 'us',
    searchQuery: 'grc manager it risk sox cisa compliance',
  },
  {
    name: 'Adzuna - Technology Risk Manager USA', sector: 'banking', country: 'USA', eadFriendly: true,
    apiType: 'adzuna', adzunaCountry: 'us',
    searchQuery: 'technology risk manager cloud audit sox internal audit',
  },
  // UK / Europe
  {
    name: 'Adzuna - IT Audit Manager UK', sector: 'tech-cloud', country: 'Europe',
    apiType: 'adzuna', adzunaCountry: 'gb',
    searchQuery: 'it audit manager sox itgc technology risk',
  },
  {
    name: 'Adzuna - Senior IT Auditor UK', sector: 'tech-cloud', country: 'Europe',
    apiType: 'adzuna', adzunaCountry: 'gb',
    searchQuery: 'senior it auditor sox cloud security technology risk',
  },
  {
    name: 'Adzuna - Technology Risk Manager UK', sector: 'banking', country: 'Europe',
    apiType: 'adzuna', adzunaCountry: 'gb',
    searchQuery: 'technology risk manager cloud audit sox financial services',
  },
  {
    name: 'Adzuna - GRC Manager UK', sector: 'banking', country: 'Europe',
    apiType: 'adzuna', adzunaCountry: 'gb',
    searchQuery: 'grc manager it risk sox cisa compliance audit',
  },
  {
    name: 'Adzuna - IT Audit Manager Germany', sector: 'tech-cloud', country: 'Europe',
    apiType: 'adzuna', adzunaCountry: 'de',
    searchQuery: 'it audit manager sox cloud security technology risk',
  },
]

// ─── Master export ────────────────────────────────────────────────────────────
export const DJ_MONITOR_ORGS: DJMonitorOrg[] = [
  ...US_BIG4,
  ...US_BANKING,
  ...US_TECH,
  ...US_MANUFACTURING,
  ...INDIA_BIG4,
  ...INDIA_BANKING,
  ...INDIA_GCC_FINANCIAL,
  ...INDIA_GCC_TECH,
  ...EU_BIG4,
  ...EU_BANKING,
  ...ADZUNA_SOURCES,
  ...DJ_FREE_SOURCES,
]

// 143 orgs: 4 US Big4 + 20 US Banking + 10 US Tech + 5 US Mfg
//         + 4 India Big4 + 8 India Banking + 15 India GCC Financial + 19 India GCC Tech
//         + 8 EU Big4 + 8 EU Banking
//         + 9 Adzuna sources (4 USA + 5 Europe)
//         + 8 Free Sources (6 Indeed RSS + 1 Remotive + 2 EU RSS)
