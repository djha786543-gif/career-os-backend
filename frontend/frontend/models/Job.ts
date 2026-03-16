export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  region: 'US' | 'Europe' | 'India';
  description: string;
  skills: string[];
  experienceLevel: string;
  employmentType: string;
  remote: boolean;
  hybrid: boolean;
  visaSponsorship: boolean;
  salaryRange?: { min: number; max: number; currency: string };
  jobBoard: string;
  applyUrl: string;
  postedDate: string;
  normalized: boolean;
  matchScore?: number;
}
