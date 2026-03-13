export interface Candidate {
  id: string;
  name: string;
  specialization: string;
  skills: string[];
  experienceYears: number;
  regions: string[];
  preferences: {
    remote?: boolean;
    hybrid?: boolean;
    visaSponsorship?: boolean;
    salaryRange?: { min: number; max: number; currency: string };
    seniority?: string;
  };
}
