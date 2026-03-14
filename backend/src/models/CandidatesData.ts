import { Candidate } from './Candidate';
import { Track } from './Track';

export const candidates: Candidate[] = [
  {
    id: 'deobrat',
    name: 'Deobrat Jha',
    specialization: 'Senior Internal Auditor & Technology Risk Advisor',
    skills: [
      'SOX 404', 'ITGC', 'ITAC', 'COSO', 'COBIT',
      'ERP', 'SAP', 'Oracle', 'Workday', 'NetSuite',
      'AuditBoard', 'Onspring', 'process improvement', 'project management'
    ],
    experienceYears: 12,
    regions: ['US', 'Europe', 'India'],
    preferences: {
      remote: true,
      hybrid: true,
      visaSponsorship: true,
      seniority: 'Senior'
    }
  },
  {
    id: 'pooja',
    name: 'Dr. Pooja Choubey',
    specialization: 'Molecular Genetics & Cardiovascular Research Scientist',
    skills: [], // Use poojaProfiles for skills by track
    experienceYears: 10,
    regions: ['US', 'Europe', 'India'],
    preferences: {},
    // track: 'Academic' as Track // default, can be switched
    // Remove 'track' property from here, handle in logic if needed
  }
];
