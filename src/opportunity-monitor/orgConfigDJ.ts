/**
 * orgConfigDJ.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DJ (Deobrat Jha) org configuration.
 * IT Audit Manager | CISA | AWS Certified Cloud Practitioner
 * Profile DNA: SOX 404, ITGC/ITAC, Cloud Security, SAP S/4HANA,
 *              NIST, AI/ML Governance, SOC1/SOC2, GRC
 *
 * COMPLETELY ISOLATED from Pooja's orgConfig.ts — no shared orgs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type DJSector =
  | 'us-big4'
  | 'us-finance'
  | 'us-tech'
  | 'us-manufacturing'
  | 'india-gcc'
  | 'india-bank'
  | 'india-tech'

export interface MonitorOrgDJ {
  name: string
  djSector: DJSector
  country: string
  careersUrl?: string
  apiType: 'websearch'         // all DJ orgs use AI websearch
  searchQuery: string
}

// ─── US TARGET ORGS ──────────────────────────────────────────────────────────

const US_BIG4: MonitorOrgDJ[] = [
  {
    name: 'EY Americas IT Audit',
    djSector: 'us-big4', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'EY Ernst Young IT Audit Manager SOX ITGC CISA cloud security GRC 2025 2026 site:ey.com'
  },
  {
    name: 'Deloitte US IT Audit',
    djSector: 'us-big4', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Deloitte US IT Audit Manager SOX 404 ITAC cloud risk GRC CISA 2025 2026 site:deloitte.com'
  },
  {
    name: 'KPMG US IT Audit',
    djSector: 'us-big4', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'KPMG US IT Audit Manager SOX ITGC cloud security CISA contract consultant 2025 2026 site:kpmg.com'
  },
  {
    name: 'PwC US IT Audit',
    djSector: 'us-big4', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'PwC PricewaterhouseCoopers IT Audit Manager SOX ITGC CISA cloud risk EAD 2025 2026 site:pwc.com'
  },
  {
    name: 'BDO USA IT Risk',
    djSector: 'us-big4', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'BDO USA IT Audit Risk Advisory Manager SOX ITGC CISA cloud 2025 2026'
  },
  {
    name: 'Grant Thornton US IT Audit',
    djSector: 'us-big4', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Grant Thornton IT Audit Manager SOX ITGC cloud risk CISA 2025 2026'
  },
  {
    name: 'RSM US IT Audit',
    djSector: 'us-big4', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'RSM US IT Audit Manager ITGC SOX cloud risk GRC contract consultant 2025 2026'
  },
]

const US_FINANCE: MonitorOrgDJ[] = [
  {
    name: 'JPMorgan Chase IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'JPMorgan Chase IT Audit Manager ITGC SOX cloud security GRC 2025 2026 contract EAD'
  },
  {
    name: 'Bank of America IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Bank of America IT Audit Manager SOX ITGC cloud risk GRC CISA 2025 2026'
  },
  {
    name: 'Goldman Sachs IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Goldman Sachs IT Audit Internal Audit Manager SOX cloud security 2025 2026'
  },
  {
    name: 'Morgan Stanley IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Morgan Stanley IT Audit Manager SOX ITGC cloud risk CISA 2025 2026'
  },
  {
    name: 'Citigroup IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Citi Citigroup IT Audit Manager SOX ITGC cloud security GRC 2025 2026 contract'
  },
  {
    name: 'Wells Fargo IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Wells Fargo IT Audit Manager SOX ITGC CISA cloud security 2025 2026'
  },
  {
    name: 'Capital One IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Capital One IT Audit Manager cloud security AWS SOX ITGC AI governance 2025 2026'
  },
  {
    name: 'American Express IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'American Express Amex IT Audit Manager SOX ITGC cloud GRC 2025 2026'
  },
  {
    name: 'BlackRock IT Risk',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'BlackRock IT Audit Risk Manager SOX cloud security CISA 2025 2026'
  },
  {
    name: 'Fidelity Investments IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Fidelity Investments IT Audit Manager SOX ITGC cloud security GRC CISA 2025 2026'
  },
  {
    name: 'State Street IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'State Street Corporation IT Audit Manager SOX ITGC cloud risk 2025 2026'
  },
  {
    name: 'BNY Mellon IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'BNY Mellon IT Audit Manager SOX ITGC cloud security GRC 2025 2026'
  },
  {
    name: 'Charles Schwab IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Charles Schwab IT Audit Manager cloud security SOX CISA 2025 2026'
  },
  {
    name: 'Vanguard IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Vanguard IT Audit Manager SOX ITGC cloud risk GRC 2025 2026'
  },
  {
    name: 'T. Rowe Price IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'T. Rowe Price IT Audit Manager SOX ITGC cloud security 2025 2026'
  },
  {
    name: 'MetLife IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'MetLife IT Audit Manager SOX cloud security GRC CISA 2025 2026 contract consultant'
  },
  {
    name: 'Prudential Financial IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Prudential Financial IT Audit Manager SOX ITGC cloud risk 2025 2026'
  },
  {
    name: 'AIG IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'AIG American International Group IT Audit Manager SOX cloud security GRC 2025 2026'
  },
  {
    name: 'Visa IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Visa IT Audit Manager SOX ITGC cloud security PCIDSS GRC 2025 2026'
  },
  {
    name: 'Mastercard IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Mastercard IT Audit Manager SOX ITGC cloud security GRC 2025 2026'
  },
  {
    name: 'Ameriprise Financial IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Ameriprise Financial IT Audit Manager SOX ITGC cloud security 2025 2026'
  },
  {
    name: 'Northern Trust IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Northern Trust IT Audit Manager SOX ITGC cloud risk GRC 2025 2026'
  },
  {
    name: 'TIAA IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'TIAA IT Audit Manager SOX cloud security GRC CISA 2025 2026'
  },
  {
    name: 'Public Storage IT Audit',
    djSector: 'us-finance', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Public Storage IT Audit Manager SOX ITGC cloud security GRC 2025 2026'
  },
]

const US_TECH: MonitorOrgDJ[] = [
  {
    name: 'AWS Cloud Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Amazon AWS IT Audit Manager cloud security GRC SOX ITGC AI governance 2025 2026 site:amazon.jobs'
  },
  {
    name: 'Google Cloud IT Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Google IT Internal Audit Manager cloud security SOX GRC AI governance 2025 2026 site:careers.google.com'
  },
  {
    name: 'Microsoft IT Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Microsoft IT Audit Manager cloud security SOX ITGC GRC AI governance 2025 2026'
  },
  {
    name: 'IBM Security GRC',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'IBM IT Audit Manager GRC cloud security SOX ITGC consultant contract 2025 2026'
  },
  {
    name: 'Oracle US IT Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Oracle IT Audit Manager SOX ITGC cloud security ERP audit SAP 2025 2026'
  },
  {
    name: 'SAP North America IT Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'SAP North America IT Audit Manager S/4HANA SOX GRC cloud security 2025 2026'
  },
  {
    name: 'Salesforce IT Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Salesforce IT Internal Audit Manager SOX cloud security GRC AI governance 2025 2026'
  },
  {
    name: 'ServiceNow IT GRC',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'ServiceNow IT Audit GRC Manager SOX cloud security 2025 2026'
  },
  {
    name: 'Workday IT Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Workday IT Audit Manager SOX ITGC cloud security GRC 2025 2026'
  },
  {
    name: 'Western Digital IT Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Western Digital IT Audit Manager SOX ITGC cloud security GRC CISA 2025 2026'
  },
  {
    name: 'Investar Bank IT Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Investar IT Audit Manager SOX ITGC cloud security GRC contract consultant 2025 2026'
  },
  {
    name: 'Palo Alto Networks IT Audit',
    djSector: 'us-tech', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Palo Alto Networks IT Audit Manager cloud security SOX GRC CISA 2025 2026'
  },
]

const US_MANUFACTURING: MonitorOrgDJ[] = [
  {
    name: 'General Electric IT Audit',
    djSector: 'us-manufacturing', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'GE General Electric IT Audit Manager SOX ITGC cloud security SAP GRC 2025 2026'
  },
  {
    name: 'Honeywell IT Audit',
    djSector: 'us-manufacturing', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Honeywell IT Audit Manager SOX ITGC SAP cloud security GRC 2025 2026'
  },
  {
    name: 'Caterpillar IT Audit',
    djSector: 'us-manufacturing', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Caterpillar IT Audit Manager SOX ITGC SAP S/4HANA cloud security 2025 2026'
  },
  {
    name: '3M IT Audit',
    djSector: 'us-manufacturing', country: 'USA',
    apiType: 'websearch',
    searchQuery: '3M IT Audit Manager SOX ITGC SAP cloud security GRC 2025 2026'
  },
  {
    name: 'Johnson Controls IT Audit',
    djSector: 'us-manufacturing', country: 'USA',
    apiType: 'websearch',
    searchQuery: 'Johnson Controls IT Audit Manager SOX ITGC cloud security GRC SAP 2025 2026'
  },
]

// ─── INDIA TARGET ORGS ───────────────────────────────────────────────────────

const INDIA_GCC: MonitorOrgDJ[] = [
  {
    name: 'EY India GCC IT Audit',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'EY Ernst Young India GCC IT Audit Manager SOX ITGC cloud security GRC Director 2025 2026'
  },
  {
    name: 'Deloitte India GCC IT Audit',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Deloitte India GCC IT Audit Manager Director SOX ITGC cloud risk GRC 2025 2026'
  },
  {
    name: 'KPMG India GCC IT Audit',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'KPMG India GCC IT Audit Manager Director SOX ITGC cloud security GRC 2025 2026'
  },
  {
    name: 'PwC India GCC IT Audit',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'PwC India GCC IT Audit Manager Director SOX ITGC cloud security GRC 2025 2026'
  },
  {
    name: 'Goldman Sachs India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Goldman Sachs India GCC IT Audit Manager Director SOX ITGC cloud security 2025 2026 Bengaluru'
  },
  {
    name: 'JPMorgan India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'JPMorgan Chase India GCC IT Audit Manager Director SOX ITGC cloud security 2025 2026'
  },
  {
    name: 'Morgan Stanley India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Morgan Stanley India GCC IT Audit Manager Director SOX cloud security CISA 2025 2026'
  },
  {
    name: 'Citi India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Citi Citibank India GCC IT Audit Manager Director SOX ITGC cloud GRC 2025 2026 Pune Mumbai'
  },
  {
    name: 'Wells Fargo India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Wells Fargo India GCC IT Audit Manager SOX ITGC cloud security 2025 2026 Hyderabad'
  },
  {
    name: 'Bank of America India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Bank of America India GCC IT Audit Manager Director SOX ITGC cloud security 2025 2026'
  },
  {
    name: 'BlackRock India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'BlackRock India GCC IT Audit Manager Risk SOX cloud security GRC 2025 2026 Gurugram'
  },
  {
    name: 'Fidelity India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Fidelity Investments India GCC IT Audit Manager SOX ITGC cloud security GRC 2025 2026 Chennai'
  },
  {
    name: 'State Street India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'State Street India GCC IT Audit Manager SOX ITGC cloud risk 2025 2026 Bengaluru'
  },
  {
    name: 'BNY Mellon India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'BNY Mellon India GCC IT Audit Manager SOX ITGC cloud security GRC 2025 2026 Pune'
  },
  {
    name: 'T. Rowe Price India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'T. Rowe Price India GCC IT Audit Manager SOX cloud security GRC 2025 2026 Hyderabad'
  },
  {
    name: 'MetLife India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'MetLife India GCC IT Audit Manager SOX ITGC cloud security 2025 2026 Noida'
  },
  {
    name: 'Ameriprise India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Ameriprise Financial India GCC IT Audit Manager SOX ITGC cloud 2025 2026 Gurugram'
  },
  {
    name: 'Northern Trust India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Northern Trust India GCC IT Audit Manager SOX ITGC cloud risk 2025 2026 Pune'
  },
  {
    name: 'Vanguard India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Vanguard India GCC IT Audit Manager SOX ITGC cloud security 2025 2026'
  },
  {
    name: 'AWS India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Amazon AWS India IT Audit Manager cloud security SOX GRC AI governance 2025 2026 Bangalore Hyderabad'
  },
  {
    name: 'Google India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Google India GCC IT Audit Manager cloud security SOX GRC AI governance 2025 2026 Bengaluru Hyderabad'
  },
  {
    name: 'Microsoft India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Microsoft India GCC IT Audit Manager cloud security SOX ITGC GRC 2025 2026 Hyderabad Bengaluru'
  },
  {
    name: 'Oracle India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Oracle India GCC IT Audit Manager SOX ITGC cloud security ERP audit 2025 2026 Bengaluru'
  },
  {
    name: 'SAP India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'SAP India GCC IT Audit Manager S/4HANA SOX GRC cloud security 2025 2026 Bengaluru'
  },
  {
    name: 'IBM India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'IBM India GCC IT Audit Manager GRC cloud security SOX ITGC 2025 2026 Pune Bengaluru'
  },
  {
    name: 'Accenture India IT Audit',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Accenture India IT Audit Manager GRC SOX cloud security CISA Director 2025 2026'
  },
  {
    name: 'Honeywell India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Honeywell India GCC IT Audit Manager SOX ITGC SAP cloud security 2025 2026 Bengaluru'
  },
  {
    name: 'GE India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'GE General Electric India GCC IT Audit Manager SOX ITGC SAP cloud 2025 2026 Bengaluru'
  },
  {
    name: 'Visa India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Visa India GCC IT Audit Manager SOX ITGC cloud security PCIDSS GRC 2025 2026 Bengaluru Pune'
  },
  {
    name: 'Mastercard India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Mastercard India GCC IT Audit Manager SOX ITGC cloud security GRC 2025 2026 Pune'
  },
  {
    name: 'Barclays India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Barclays India GCC IT Audit Manager SOX ITGC cloud security GRC Director 2025 2026 Pune Chennai'
  },
  {
    name: 'Standard Chartered India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Standard Chartered India GCC IT Audit Manager SOX ITGC cloud security GRC 2025 2026 Bengaluru'
  },
  {
    name: 'Deutsche Bank India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Deutsche Bank India GCC IT Audit Manager SOX ITGC cloud security GRC Director 2025 2026 Pune'
  },
  {
    name: 'Societe Generale India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Societe Generale India GCC IT Audit Manager SOX cloud security GRC Director 2025 2026 Bengaluru'
  },
  {
    name: 'BNP Paribas India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'BNP Paribas India GCC IT Audit Manager SOX ITGC cloud security GRC 2025 2026 Mumbai'
  },
  {
    name: 'UBS India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'UBS India GCC IT Audit Manager SOX ITGC cloud security 2025 2026 Pune'
  },
  {
    name: 'Caterpillar India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Caterpillar India GCC IT Audit Manager SOX ITGC SAP S/4HANA cloud security 2025 2026'
  },
  {
    name: 'Siemens India GCC',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Siemens India GCC IT Audit Manager SOX ITGC SAP cloud security GRC Director 2025 2026'
  },
  {
    name: 'Cognizant Technology IT Audit',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Cognizant IT Audit Manager SOX ITGC cloud security GRC Director 2025 2026 India'
  },
  {
    name: 'Capgemini India IT Audit',
    djSector: 'india-gcc', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Capgemini India IT Audit Manager SOX ITGC SAP cloud security GRC Director 2025 2026'
  },
]

const INDIA_BANKING: MonitorOrgDJ[] = [
  {
    name: 'HDFC Bank IT Audit',
    djSector: 'india-bank', country: 'India',
    apiType: 'websearch',
    searchQuery: 'HDFC Bank IT Audit Manager AVP VP Head cloud security ITGC GRC CISA 2025 2026'
  },
  {
    name: 'ICICI Bank IT Audit',
    djSector: 'india-bank', country: 'India',
    apiType: 'websearch',
    searchQuery: 'ICICI Bank IT Audit Manager AVP VP cloud security ITGC GRC CISA 2025 2026'
  },
  {
    name: 'Axis Bank IT Audit',
    djSector: 'india-bank', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Axis Bank IT Audit Manager AVP cloud security ITGC GRC CISA 2025 2026'
  },
  {
    name: 'Kotak Mahindra Bank IT Audit',
    djSector: 'india-bank', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Kotak Mahindra Bank IT Audit Manager cloud security ITGC GRC CISA 2025 2026'
  },
  {
    name: 'Yes Bank IT Audit',
    djSector: 'india-bank', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Yes Bank IT Audit Manager AVP cloud security ITGC GRC CISA 2025 2026'
  },
  {
    name: 'IndusInd Bank IT Audit',
    djSector: 'india-bank', country: 'India',
    apiType: 'websearch',
    searchQuery: 'IndusInd Bank IT Audit Manager cloud security GRC ITGC 2025 2026'
  },
  {
    name: 'IDFC First Bank IT Audit',
    djSector: 'india-bank', country: 'India',
    apiType: 'websearch',
    searchQuery: 'IDFC First Bank IT Audit Manager cloud security ITGC GRC 2025 2026'
  },
  {
    name: 'Federal Bank IT Audit',
    djSector: 'india-bank', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Federal Bank IT Audit Manager cloud security ITGC GRC CISA 2025 2026'
  },
]

const INDIA_TECH: MonitorOrgDJ[] = [
  {
    name: 'Infosys IT Audit',
    djSector: 'india-tech', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Infosys IT Audit Manager Internal Audit SOX ITGC cloud GRC Director 2025 2026'
  },
  {
    name: 'Wipro IT Audit',
    djSector: 'india-tech', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Wipro IT Audit Manager Internal Audit SOX ITGC cloud security GRC Director 2025 2026'
  },
  {
    name: 'TCS IT Audit',
    djSector: 'india-tech', country: 'India',
    apiType: 'websearch',
    searchQuery: 'TCS Tata Consultancy Services IT Audit Manager Internal Audit SOX ITGC cloud 2025 2026'
  },
  {
    name: 'HCL IT Audit',
    djSector: 'india-tech', country: 'India',
    apiType: 'websearch',
    searchQuery: 'HCL Technologies IT Audit Manager SOX ITGC cloud security GRC Director 2025 2026'
  },
  {
    name: 'Tech Mahindra IT Audit',
    djSector: 'india-tech', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Tech Mahindra IT Audit Manager SOX ITGC cloud security GRC 2025 2026'
  },
  {
    name: 'Mphasis IT Audit',
    djSector: 'india-tech', country: 'India',
    apiType: 'websearch',
    searchQuery: 'Mphasis IT Audit Manager SOX ITGC cloud security GRC Director 2025 2026'
  },
]

// ─── MASTER LIST ─────────────────────────────────────────────────────────────
// Total: 96 DJ-specific orgs (zero overlap with Pooja's life-science orgs)

export const DJ_ORGS: MonitorOrgDJ[] = [
  ...US_BIG4,
  ...US_FINANCE,
  ...US_TECH,
  ...US_MANUFACTURING,
  ...INDIA_GCC,
  ...INDIA_BANKING,
  ...INDIA_TECH,
]

// Map DJ sector → canonical DB sector (monitor_orgs.sector column)
// Used so Pooja's existing sector-filter queries don't surface DJ jobs
export function djSectorToDbSector(djSector: DJSector): string {
  if (djSector.startsWith('us-')) return 'dj-us'
  if (djSector.startsWith('india-')) return 'dj-india'
  return 'dj-us'
}
