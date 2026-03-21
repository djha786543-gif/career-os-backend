"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DJ_MONITOR_ORGS = void 0;
// ═══ US — Big 4 (IT Audit / Risk Advisory) ═══════════════════════════════════
const US_BIG4 = [
    {
        name: 'EY US Technology Risk',
        sector: 'big4', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'EY Ernst Young Technology Risk IT Audit Manager SOX ITGC Contract Consultant W2 2026',
        careersUrl: 'https://careers.ey.com',
    },
    {
        name: 'Deloitte US Risk Advisory',
        sector: 'big4', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Deloitte Risk Advisory IT Audit Manager SOX ITGC Cloud Security Contract Consultant 2026',
        careersUrl: 'https://www2.deloitte.com/us/en/careers.html',
    },
    {
        name: 'KPMG US Technology Risk',
        sector: 'big4', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'KPMG Technology Risk IT Audit Manager SOX ITGC ITAC W2 Immediate Start 2026',
        careersUrl: 'https://kpmgcareers.kpmg.com',
    },
    {
        name: 'PwC US Digital Assurance',
        sector: 'big4', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'PwC Digital Assurance IT Audit Manager SOX Cloud Risk GRC Contract Consultant 2026',
        careersUrl: 'https://www.pwc.com/us/en/careers.html',
    },
];
// ═══ US — Financial Services (Top 100 Firms) ══════════════════════════════════
const US_BANKING = [
    {
        name: 'Goldman Sachs',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Goldman Sachs IT Audit Manager SOX ITGC Cloud Risk Internal Audit Contract 2026',
        careersUrl: 'https://www.goldmansachs.com/careers',
    },
    {
        name: 'JPMorgan Chase',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'JPMorgan Chase IT Audit Manager SOX ITGC Cloud Security GRC W2 Consultant 2026',
        careersUrl: 'https://careers.jpmorgan.com',
    },
    {
        name: 'Bank of America',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Bank of America IT Audit Manager SOX ITGC Cloud Risk Assurance Contract 2026',
        careersUrl: 'https://careers.bankofamerica.com',
    },
    {
        name: 'Citigroup',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Citi Citigroup IT Audit Manager SOX ITGC Technology Risk Contract Consultant 2026',
        careersUrl: 'https://jobs.citi.com',
    },
    {
        name: 'Wells Fargo',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Wells Fargo IT Audit Manager SOX Technology Audit Cloud Security W2 2026',
        careersUrl: 'https://www.wellsfargojobs.com',
    },
    {
        name: 'Morgan Stanley',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Morgan Stanley IT Audit Manager Technology Risk SOX ITGC Contract 2026',
        careersUrl: 'https://www.morganstanley.com/people/careers',
    },
    {
        name: 'BlackRock',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'BlackRock IT Audit Manager Technology Risk SOX Cloud Security Consultant 2026',
        careersUrl: 'https://careers.blackrock.com',
    },
    {
        name: 'Fidelity Investments',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Fidelity Investments IT Audit Manager SOX ITGC Cloud Risk GRC Contract W2 2026',
        careersUrl: 'https://jobs.fidelity.com',
    },
    {
        name: 'Capital One',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Capital One IT Audit Manager Cloud Security SOX ITGC AWS GRC Consultant 2026',
        careersUrl: 'https://www.capitalonecareers.com',
    },
    {
        name: 'American Express',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'American Express IT Audit Manager SOX Technology Risk Cloud Security W2 2026',
        careersUrl: 'https://www.americanexpress.com/en-us/careers',
    },
    {
        name: 'Visa Inc',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Visa IT Audit Manager Technology Risk SOX Cloud Security Consultant 2026',
        careersUrl: 'https://www.visa.com/careers',
    },
    {
        name: 'Mastercard',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Mastercard IT Audit Manager SOX ITGC Cloud Risk GRC Contract 2026',
        careersUrl: 'https://careers.mastercard.com',
    },
    {
        name: 'Charles Schwab',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Charles Schwab IT Audit Manager SOX Technology Risk Cloud Security W2 2026',
        careersUrl: 'https://www.aboutschwab.com/careers',
    },
    {
        name: 'PayPal',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'PayPal IT Audit Manager SOX ITGC Cloud Risk CISA Contract Consultant 2026',
        careersUrl: 'https://www.paypal.com/us/webapps/mpp/jobs',
    },
    {
        name: 'Discover Financial',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Discover Financial IT Audit Manager SOX Technology Risk Consultant W2 2026',
        careersUrl: 'https://careers.discover.com',
    },
    {
        name: 'State Street',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'State Street IT Audit Manager Technology Risk SOX Cloud Security 2026',
        careersUrl: 'https://careers.statestreet.com',
    },
    {
        name: 'BNY Mellon',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'BNY Mellon IT Audit Manager SOX ITGC Technology Risk Contract W2 2026',
        careersUrl: 'https://www.bnymellon.com/us/en/careers.html',
    },
    {
        name: 'Vanguard',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Vanguard IT Audit Manager SOX Technology Risk Cloud Security Consultant 2026',
        careersUrl: 'https://www.vanguardjobs.com',
    },
    {
        name: 'T. Rowe Price',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'T Rowe Price IT Audit Manager SOX Technology Risk Cloud Security 2026',
        careersUrl: 'https://www.troweprice.com/personal-investing/about-t-rowe-price/careers.html',
    },
    {
        name: 'Nasdaq',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Nasdaq IT Audit Manager Technology Risk SOX Cloud Security GRC Contract 2026',
        careersUrl: 'https://www.nasdaq.com/nasdaq-careers',
    },
];
// ═══ US — Tech / Cloud ════════════════════════════════════════════════════════
const US_TECH = [
    {
        name: 'Amazon Web Services',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'AWS Amazon IT Audit Manager Cloud Security SOX ITGC AI Governance Contract W2 2026',
        careersUrl: 'https://www.amazon.jobs',
    },
    {
        name: 'Microsoft',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Microsoft IT Audit Manager Cloud Risk SOX ITGC Azure Security GRC Consultant 2026',
        careersUrl: 'https://careers.microsoft.com',
    },
    {
        name: 'Google Cloud',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Google Cloud IT Audit Manager SOX Technology Risk AI Governance CISA Contract 2026',
        careersUrl: 'https://careers.google.com',
    },
    {
        name: 'Salesforce',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Salesforce IT Audit Manager SOX Cloud Security GRC ITGC W2 Consultant 2026',
        careersUrl: 'https://www.salesforce.com/company/careers',
    },
    {
        name: 'ServiceNow',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'ServiceNow IT Audit Manager SOX GRC Cloud Risk Technology Audit Contract 2026',
        careersUrl: 'https://www.servicenow.com/careers.html',
    },
    {
        name: 'IBM',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IBM IT Audit Manager SOX Cloud Security NIST GRC Consultant W2 2026',
        careersUrl: 'https://www.ibm.com/us-en/employment',
    },
    {
        name: 'Oracle',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Oracle IT Audit Manager SOX ITGC Cloud Risk Technology Audit Contract 2026',
        careersUrl: 'https://www.oracle.com/corporate/careers',
    },
    {
        name: 'SAP America',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'SAP America IT Audit Manager SAP S4HANA SOX ITGC Cloud Security Contract W2 2026',
        careersUrl: 'https://www.sap.com/about/careers.html',
    },
    {
        name: 'Accenture',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Accenture IT Audit Manager SOX Technology Risk Cloud Security GRC Consultant 2026',
        careersUrl: 'https://www.accenture.com/us-en/careers',
    },
    {
        name: 'Cognizant',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Cognizant IT Audit Manager SOX ITGC Cloud Security W2 Contract Consultant 2026',
        careersUrl: 'https://careers.cognizant.com',
    },
];
// ═══ US — Manufacturing / Other ═══════════════════════════════════════════════
const US_MANUFACTURING = [
    {
        name: 'Public Storage',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Public Storage IT Audit Manager SOX Technology Risk Internal Audit Contract 2026',
        careersUrl: 'https://jobs.publicstorage.com',
    },
    {
        name: 'Western Digital',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Western Digital IT Audit Manager SOX ITGC Cloud Security Technology Risk 2026',
        careersUrl: 'https://www.westerndigital.com/company/careers',
    },
    {
        name: 'Investar Bank',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Investar Bank IT Audit Manager SOX Technology Risk Compliance Contract 2026',
    },
    {
        name: 'Intel Corporation',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Intel Corporation IT Audit Manager SOX ITGC Cloud Security Technology Risk W2 2026',
        careersUrl: 'https://www.intel.com/content/www/us/en/jobs/jobs-at-intel.html',
    },
    {
        name: 'Applied Materials',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'Applied Materials IT Audit Manager SOX Technology Risk ITGC Contract Consultant 2026',
        careersUrl: 'https://careers.appliedmaterials.com',
    },
];
// ═══ India — Big 4 (Manager+ Only) ═══════════════════════════════════════════
const INDIA_BIG4 = [
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
];
// ═══ India — Banking (Manager+ Only) ══════════════════════════════════════════
const INDIA_BANKING = [
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
];
// ═══ India — GCCs — Financial Services (Manager+ Only) ════════════════════════
const INDIA_GCC_FINANCIAL = [
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
];
// ═══ India — GCCs — Tech (Manager+ Only) ══════════════════════════════════════
const INDIA_GCC_TECH = [
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
];
// ─── Master export ────────────────────────────────────────────────────────────
exports.DJ_MONITOR_ORGS = [
    ...US_BIG4,
    ...US_BANKING,
    ...US_TECH,
    ...US_MANUFACTURING,
    ...INDIA_BIG4,
    ...INDIA_BANKING,
    ...INDIA_GCC_FINANCIAL,
    ...INDIA_GCC_TECH,
];
// 85 orgs: 4 US Big4 + 20 US Banking + 10 US Tech + 5 US Mfg
//        + 4 India Big4 + 8 India Banking + 15 India GCC Financial + 19 India GCC Tech
