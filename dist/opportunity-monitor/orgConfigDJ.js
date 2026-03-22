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
        searchQuery: 'IT Audit Manager EY Ernst Young Technology Risk SOX ITGC',
        careersUrl: 'https://careers.ey.com',
    },
    {
        name: 'Deloitte US Risk Advisory',
        sector: 'big4', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Deloitte Risk Advisory SOX ITGC Cloud Security',
        careersUrl: 'https://www2.deloitte.com/us/en/careers.html',
    },
    {
        name: 'KPMG US Technology Risk',
        sector: 'big4', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager KPMG Technology Risk SOX ITGC',
        careersUrl: 'https://kpmgcareers.kpmg.com',
    },
    {
        name: 'PwC US Digital Assurance',
        sector: 'big4', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager PwC Digital Assurance SOX Cloud GRC',
        careersUrl: 'https://www.pwc.com/us/en/careers.html',
    },
];
// ═══ US — Financial Services (Top 100 Firms) ══════════════════════════════════
const US_BANKING = [
    {
        name: 'Goldman Sachs',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Goldman Sachs SOX ITGC Internal Audit',
        careersUrl: 'https://www.goldmansachs.com/careers',
    },
    {
        name: 'JPMorgan Chase',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager JPMorgan Chase SOX ITGC Cloud Security',
        careersUrl: 'https://careers.jpmorgan.com',
    },
    {
        name: 'Bank of America',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Bank of America SOX ITGC Cloud Risk',
        careersUrl: 'https://careers.bankofamerica.com',
    },
    {
        name: 'Citigroup',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Citi SOX ITGC Technology Risk',
        careersUrl: 'https://jobs.citi.com',
    },
    {
        name: 'Wells Fargo',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Wells Fargo SOX Technology Audit Cloud Security',
        careersUrl: 'https://www.wellsfargojobs.com',
    },
    {
        name: 'Morgan Stanley',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Morgan Stanley Technology Risk SOX ITGC',
        careersUrl: 'https://www.morganstanley.com/people/careers',
    },
    {
        name: 'BlackRock',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager BlackRock Technology Risk SOX Cloud Security',
        careersUrl: 'https://careers.blackrock.com',
    },
    {
        name: 'Fidelity Investments',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Fidelity Investments SOX ITGC GRC',
        careersUrl: 'https://jobs.fidelity.com',
    },
    {
        name: 'Capital One',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Capital One Cloud Security SOX AWS GRC',
        careersUrl: 'https://www.capitalonecareers.com',
    },
    {
        name: 'American Express',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager American Express SOX Technology Risk',
        careersUrl: 'https://www.americanexpress.com/en-us/careers',
    },
    {
        name: 'Visa Inc',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Visa Technology Risk SOX Cloud Security',
        careersUrl: 'https://www.visa.com/careers',
    },
    {
        name: 'Mastercard',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Mastercard SOX ITGC Cloud Risk GRC',
        careersUrl: 'https://careers.mastercard.com',
    },
    {
        name: 'Charles Schwab',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Charles Schwab SOX Technology Risk',
        careersUrl: 'https://www.aboutschwab.com/careers',
    },
    {
        name: 'PayPal',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager PayPal SOX ITGC Cloud Risk CISA',
        careersUrl: 'https://www.paypal.com/us/webapps/mpp/jobs',
    },
    {
        name: 'Discover Financial',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Discover Financial SOX Technology Risk',
        careersUrl: 'https://careers.discover.com',
    },
    {
        name: 'State Street',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager State Street Technology Risk SOX',
        careersUrl: 'https://careers.statestreet.com',
    },
    {
        name: 'BNY Mellon',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager BNY Mellon SOX ITGC Technology Risk',
        careersUrl: 'https://www.bnymellon.com/us/en/careers.html',
    },
    {
        name: 'Vanguard',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Vanguard SOX Technology Risk Cloud Security',
        careersUrl: 'https://www.vanguardjobs.com',
    },
    {
        name: 'T. Rowe Price',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager T Rowe Price SOX Technology Risk',
        careersUrl: 'https://www.troweprice.com/personal-investing/about-t-rowe-price/careers.html',
    },
    {
        name: 'Nasdaq',
        sector: 'banking', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Nasdaq Technology Risk SOX GRC',
        careersUrl: 'https://www.nasdaq.com/nasdaq-careers',
    },
];
// ═══ US — Tech / Cloud ════════════════════════════════════════════════════════
const US_TECH = [
    {
        name: 'Amazon Web Services',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager AWS Amazon Cloud Security SOX AI Governance',
        careersUrl: 'https://www.amazon.jobs',
    },
    {
        name: 'Microsoft',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Microsoft Cloud Risk SOX Azure Security',
        careersUrl: 'https://careers.microsoft.com',
    },
    {
        name: 'Google Cloud',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Google Cloud SOX Technology Risk AI Governance',
        careersUrl: 'https://careers.google.com',
    },
    {
        name: 'Salesforce',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Salesforce SOX Cloud Security GRC',
        careersUrl: 'https://www.salesforce.com/company/careers',
    },
    {
        name: 'ServiceNow',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager ServiceNow SOX GRC Cloud Risk',
        careersUrl: 'https://www.servicenow.com/careers.html',
    },
    {
        name: 'IBM',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager IBM SOX Cloud Security NIST GRC',
        careersUrl: 'https://www.ibm.com/us-en/employment',
    },
    {
        name: 'Oracle',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Oracle SOX ITGC Cloud Risk',
        careersUrl: 'https://www.oracle.com/corporate/careers',
    },
    {
        name: 'SAP America',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager SAP SOX ITGC S4HANA Cloud Security',
        careersUrl: 'https://www.sap.com/about/careers.html',
    },
    {
        name: 'Accenture',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Accenture SOX Technology Risk Cloud Security',
        careersUrl: 'https://www.accenture.com/us-en/careers',
    },
    {
        name: 'Cognizant',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Cognizant SOX ITGC Cloud Security',
        careersUrl: 'https://careers.cognizant.com',
    },
];
// ═══ US — Manufacturing / Other ═══════════════════════════════════════════════
const US_MANUFACTURING = [
    {
        name: 'Public Storage',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Public Storage SOX Internal Audit',
        careersUrl: 'https://jobs.publicstorage.com',
    },
    {
        name: 'Western Digital',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Western Digital SOX ITGC Cloud Security',
        careersUrl: 'https://www.westerndigital.com/company/careers',
    },
    {
        name: 'Investar Bank',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Investar Bank SOX Technology Risk',
    },
    {
        name: 'Intel Corporation',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Intel SOX ITGC Cloud Security',
        careersUrl: 'https://www.intel.com/content/www/us/en/jobs/jobs-at-intel.html',
    },
    {
        name: 'Applied Materials',
        sector: 'manufacturing', country: 'USA', eadFriendly: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Applied Materials SOX Technology Risk ITGC',
        careersUrl: 'https://careers.appliedmaterials.com',
    },
];
// ═══ India — Big 4 (Manager+ Only) ═══════════════════════════════════════════
const INDIA_BIG4 = [
    {
        name: 'EY India GDS',
        sector: 'big4', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager EY India GDS Technology Risk SOX ITGC',
        careersUrl: 'https://careers.ey.com',
    },
    {
        name: 'Deloitte India',
        sector: 'big4', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Deloitte India SOX Technology Risk',
        careersUrl: 'https://www2.deloitte.com/in/en/careers.html',
    },
    {
        name: 'KPMG India',
        sector: 'big4', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager KPMG India SOX GRC Technology Risk',
        careersUrl: 'https://kpmg.com/in/en/home/careers.html',
    },
    {
        name: 'PwC India',
        sector: 'big4', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager PwC India SOX ITGC Technology Risk',
        careersUrl: 'https://www.pwc.in/careers.html',
    },
];
// ═══ India — Banking (Manager+ Only) ══════════════════════════════════════════
const INDIA_BANKING = [
    {
        name: 'HDFC Bank',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager HDFC Bank Technology Audit SOX GRC',
        careersUrl: 'https://www.hdfcbank.com/careers',
    },
    {
        name: 'ICICI Bank',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager ICICI Bank Technology Risk SOX',
        careersUrl: 'https://www.icicibankcareer.com',
    },
    {
        name: 'Axis Bank',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Axis Bank Technology Risk GRC SOX',
        careersUrl: 'https://www.axisbank.com/about-us/careers',
    },
    {
        name: 'Kotak Mahindra Bank',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Kotak Mahindra Bank Technology Risk',
        careersUrl: 'https://www.kotak.com/en/about-us/careers.html',
    },
    {
        name: 'IDFC First Bank',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager IDFC First Bank Technology Risk SOX GRC',
        careersUrl: 'https://www.idfcfirstbank.com/about-us/careers',
    },
    {
        name: 'Yes Bank',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Yes Bank Technology Risk Internal Audit',
        careersUrl: 'https://www.yesbank.in/careers',
    },
    {
        name: 'IndusInd Bank',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager IndusInd Bank Technology Risk SOX',
        careersUrl: 'https://www.indusind.com/iblogs/categories/careers',
    },
    {
        name: 'RBL Bank',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager RBL Bank Technology Risk GRC',
        careersUrl: 'https://www.rblbank.com/careers',
    },
];
// ═══ India — GCCs — Financial Services (Manager+ Only) ════════════════════════
const INDIA_GCC_FINANCIAL = [
    {
        name: 'Goldman Sachs India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Goldman Sachs India Technology Risk SOX',
        careersUrl: 'https://www.goldmansachs.com/careers',
    },
    {
        name: 'JPMorgan India GCC',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager JPMorgan India GCC Technology Risk SOX',
        careersUrl: 'https://careers.jpmorgan.com',
    },
    {
        name: 'Citi India Technology',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Citi India GCC SOX ITGC Cloud Risk',
        careersUrl: 'https://jobs.citi.com',
    },
    {
        name: 'Deutsche Bank India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Deutsche Bank India Technology Risk SOX',
        careersUrl: 'https://careers.db.com',
    },
    {
        name: 'HSBC India GCC',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager HSBC India GCC Technology Risk SOX',
        careersUrl: 'https://www.hsbc.com/careers',
    },
    {
        name: 'Standard Chartered India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Standard Chartered India Technology Risk SOX',
        careersUrl: 'https://www.sc.com/en/careers',
    },
    {
        name: 'Barclays India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Barclays India Technology Risk SOX',
        careersUrl: 'https://home.barclays/careers',
    },
    {
        name: 'American Express India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager American Express India GCC SOX Technology Risk',
        careersUrl: 'https://www.americanexpress.com/en-us/careers',
    },
    {
        name: 'Fidelity India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Fidelity India GCC Technology Risk SOX GRC',
        careersUrl: 'https://jobs.fidelity.com',
    },
    {
        name: 'BlackRock India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager BlackRock India Technology Risk SOX',
        careersUrl: 'https://careers.blackrock.com',
    },
    {
        name: 'Morgan Stanley India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Morgan Stanley India Technology Risk SOX',
        careersUrl: 'https://www.morganstanley.com/people/careers',
    },
    {
        name: 'BNP Paribas India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager BNP Paribas India Technology Risk SOX',
        careersUrl: 'https://group.bnpparibas/en/careers',
    },
    {
        name: 'UBS India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager UBS India GCC Technology Risk SOX',
        careersUrl: 'https://www.ubs.com/global/en/careers.html',
    },
    {
        name: 'Wells Fargo India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Wells Fargo India GCC Technology Risk SOX',
        careersUrl: 'https://www.wellsfargojobs.com',
    },
    {
        name: 'ANZ India',
        sector: 'banking', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager ANZ India GCC Technology Risk SOX',
        careersUrl: 'https://www.anz.com.au/careers',
    },
];
// ═══ India — GCCs — Tech (Manager+ Only) ══════════════════════════════════════
const INDIA_GCC_TECH = [
    {
        name: 'Amazon India GCC',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Amazon India GCC AWS Cloud Security SOX',
        careersUrl: 'https://www.amazon.jobs',
    },
    {
        name: 'Google India GCC',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Google India GCC Cloud Security SOX',
        careersUrl: 'https://careers.google.com',
    },
    {
        name: 'Microsoft India GCC',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Microsoft India GCC Azure Cloud Security SOX',
        careersUrl: 'https://careers.microsoft.com',
    },
    {
        name: 'IBM India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager IBM India Cloud Security SOX GRC',
        careersUrl: 'https://www.ibm.com/in-en/employment',
    },
    {
        name: 'SAP India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager SAP India S4HANA SOX ITGC',
        careersUrl: 'https://www.sap.com/india/about/careers.html',
    },
    {
        name: 'Oracle India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Oracle India Technology Risk SOX',
        careersUrl: 'https://www.oracle.com/in/corporate/careers',
    },
    {
        name: 'Cognizant India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Cognizant India SOX ITGC Technology Risk',
        careersUrl: 'https://careers.cognizant.com',
    },
    {
        name: 'Infosys',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Infosys SOX ITGC Cloud Security',
        careersUrl: 'https://www.infosys.com/careers',
    },
    {
        name: 'Wipro',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Wipro Technology Risk SOX Cloud Security',
        careersUrl: 'https://careers.wipro.com',
    },
    {
        name: 'HCL Technologies',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager HCL Technologies SOX Technology Risk',
        careersUrl: 'https://www.hcltech.com/careers',
    },
    {
        name: 'Tech Mahindra',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Tech Mahindra SOX Technology Risk',
        careersUrl: 'https://careers.techmahindra.com',
    },
    {
        name: 'Capgemini India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Capgemini India SOX ITGC Technology Risk',
        careersUrl: 'https://www.capgemini.com/in-en/careers',
    },
    {
        name: 'Accenture India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Accenture India SOX Technology Risk',
        careersUrl: 'https://www.accenture.com/in-en/careers',
    },
    {
        name: 'TCS',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager TCS SOX Technology Risk Cloud Security',
        careersUrl: 'https://www.tcs.com/careers',
    },
    {
        name: 'Mphasis',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Mphasis SOX Technology Risk Cloud Security',
        careersUrl: 'https://www.mphasis.com/careers.html',
    },
    {
        name: 'LTIMindtree',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager LTIMindtree SOX ITGC Technology Risk',
        careersUrl: 'https://www.ltimindtree.com/careers',
    },
    {
        name: 'Publicis Sapient India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager Publicis Sapient India Technology Risk SOX',
        careersUrl: 'https://careers.publicissapient.com',
    },
    {
        name: 'NTT Data India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager NTT Data India SOX Technology Risk',
        careersUrl: 'https://www.nttdata.com/global/en/careers',
    },
    {
        name: 'DXC Technology India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'websearch',
        searchQuery: 'IT Audit Manager DXC Technology India SOX ITGC',
        careersUrl: 'https://dxc.com/us/en/about-dxc/careers',
    },
];
// ═══ FREE SOURCES — Indeed RSS + Remotive API (zero cost, direct listings) ════
// These bypass Serper entirely — structured job data straight from the source.
// Indeed RSS: confirmed job postings with title, company, location, apply URL.
// Remotive: structured JSON API for remote roles (no auth required).
const DJ_FREE_SOURCES = [
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
    {
        name: 'Indeed RSS - IT Audit Manager India',
        sector: 'tech-cloud', country: 'India', managerialGrade: true,
        apiType: 'rss',
        rssUrl: 'https://www.indeed.co.in/rss?q=it+audit+manager+sox+itgc&l=India&sort=date&fromage=14',
        searchQuery: 'IT Audit Manager SOX ITGC India',
    },
    {
        name: 'Remotive - Remote IT Audit Manager',
        sector: 'tech-cloud', country: 'USA', eadFriendly: true,
        apiType: 'remotive',
        searchQuery: 'it audit manager sox',
    },
];
// ─── Master export ────────────────────────────────────────────────────────────
// Big 4 excluded — focus on Banking, Tech/Cloud, Manufacturing, and India GCCs
exports.DJ_MONITOR_ORGS = [
    ...US_BANKING,
    ...US_TECH,
    ...US_MANUFACTURING,
    ...INDIA_BANKING,
    ...INDIA_GCC_FINANCIAL,
    ...INDIA_GCC_TECH,
    ...DJ_FREE_SOURCES,
];
// 91 orgs: 4 US Big4 + 20 US Banking + 10 US Tech + 5 US Mfg
//        + 4 India Big4 + 8 India Banking + 15 India GCC Financial + 19 India GCC Tech
//        + 6 Free Sources (5 Indeed RSS + 1 Remotive)
