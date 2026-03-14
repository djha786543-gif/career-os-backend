-- sync_jobs.sql
-- Synchronizes fresh IT Audit and Biotech roles into the production jobs table.

INSERT INTO jobs (
    profile_id, title, company, location, region, description, 
    apply_url, is_remote, source, match_score
) VALUES
-- IT Audit Manager Roles (for DJ)
(
    'dj', 'Senior Auditor, Internal Audit', 'Western Digital', 
    'Bangalore, India', 'India', 'Focus on technology-driven risk assessments and internal audit. Key skills: CISA, CIA, IT Audit.', 
    'https://www.westerndigital.com/company/careers', false, 'Web Search', 88
),
(
    'dj', 'SOX IA and Risk Management Manager', 'Kaufman Rossin', 
    'Bangalore, India', 'India', 'End-to-end SOX compliance and internal audit solutions. Key skills: SOX, CISA.', 
    'https://kaufmanrossin.com/careers', false, 'Web Search', 90
),
(
    'dj', 'Senior IT SOX Auditor', 'ServiceNow', 
    'Hyderabad, India', 'India', 'Managing audit requests, test plans, and SOX methodologies. Key skills: SOX, ITGC.', 
    'https://www.servicenow.com/careers', false, 'Web Search', 92
),
(
    'dj', 'Auditor, IT Internal Audit', 'Qualcomm', 
    'Hyderabad, India', 'India', 'Internal controls and risk consulting; CISA highly preferred. Key skills: IT Audit.', 
    'https://www.qualcomm.com/company/careers', false, 'Web Search', 85
),
(
    'dj', 'Information Technology Internal Auditor', 'Flutter Entertainment', 
    'Hyderabad, India', 'India', 'Strong experience in IT General Controls (ITGC) and CISA/CISM. Key skills: ITGC, CISA.', 
    'https://www.flutter.com/careers', false, 'Web Search', 87
),
-- Biotech Research Roles (for Pooja)
(
    'pooja', 'Research Associate (Biology)', 'NBE-Therapeutics', 
    'Basel, Switzerland', 'Europe', 'Hands-on wet-lab work: Cloning, PCR, cell culture.', 
    'https://www.nbe-therapeutics.com/careers', false, 'Web Search', 90
),
(
    'pooja', 'Lab Technician (Molecular Biology)', 'Roche', 
    'Zug, Switzerland', 'Europe', 'SOP-driven molecular experiments and diagnostics. Key skills: Molecular Biology.', 
    'https://www.roche.com/careers', false, 'Web Search', 92
),
(
    'pooja', 'Research Associate (Downstream)', 'Formo Bio', 
    'Frankfurt, Germany', 'Europe', 'Bachelor’s in Biotech/MolBio; microbial processing focus.', 
    'https://formo.bio/careers', false, 'Web Search', 85
),
(
    'pooja', 'Lab Technician (MolBio/Cell Bio)', 'Revvity', 
    'Martinsried, Germany', 'Europe', 'Experience with qPCR, ddPCR, or ELISA.', 
    'https://www.revvity.com/careers', false, 'Web Search', 88
),
(
    'pooja', 'Research Associate (Protein Science)', 'Proteros', 
    'Munich, Germany', 'Europe', 'Training as BTA/CTA or BSc; protein chemistry focus.', 
    'https://www.proteros.com/careers', false, 'Web Search', 86
);
