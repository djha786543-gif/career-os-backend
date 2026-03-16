import React, { useState, useEffect } from 'react';
import { Candidate } from '../models/Candidate';
import { Job } from '../models/Job';
import { fetchJobs } from '../utils/api';
import { CandidateSelector } from '../components/CandidateSelector';
import { RegionSelector } from '../components/RegionSelector';
import { SmartFiltersPanel } from '../components/SmartFiltersPanel';
import { JobList } from '../components/JobList';
import { TrackSelector } from '../components/TrackSelector';

const candidates: Candidate[] = [
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
    name: 'Pooja Choubey',
    specialization: '[Insert specialization here]',
    skills: [],
    experienceYears: 0,
    regions: ['US', 'Europe', 'India'],
    preferences: {}
  }
];

const regions = ['US', 'Europe', 'India'];

export default function Home() {
  const [selectedCandidate, setSelectedCandidate] = useState('deobrat');
  const [selectedRegion, setSelectedRegion] = useState('US');
  const [filters, setFilters] = useState({});
  const [jobs, setJobs] = useState<Job[]>([]);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [track, setTrack] = useState('Academic');

  useEffect(() => {
    const params: any = { candidate: selectedCandidate, region: selectedRegion, ...filters };
    if (selectedCandidate === 'pooja') params.track = track;
    fetchJobs(selectedCandidate, selectedRegion, params).then(setJobs);
  }, [selectedCandidate, selectedRegion, filters, track]);

  const handleSave = (job: Job) => {
    setSavedJobs(prev => prev.find(j => j.id === job.id) ? prev : [...prev, job]);
  };

  return (
    <div>
      <h1>Career OS – Job Search</h1>
      <CandidateSelector candidates={candidates} selected={selectedCandidate} onSelect={setSelectedCandidate} />
      {selectedCandidate === 'pooja' && (
        <TrackSelector track={track} onSelect={setTrack} />
      )}
      <RegionSelector regions={regions} selected={selectedRegion} onSelect={setSelectedRegion} />
      <SmartFiltersPanel filters={filters} onChange={setFilters} />
      <h2>Job Results</h2>
      <JobList jobs={jobs} onSave={handleSave} />
      <h2>Saved Jobs</h2>
      <JobList jobs={savedJobs} onSave={() => {}} />
    </div>
  );
}
