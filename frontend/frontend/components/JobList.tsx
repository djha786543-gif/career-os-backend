import React from 'react';
import { Job } from '../models/Job';

type Props = {
  jobs: Job[];
  onSave: (job: Job) => void;
};

export const JobList: React.FC<Props> = ({ jobs, onSave }) => (
  <div>
    {jobs.map(job => (
      <div key={job.id} style={{ border: '1px solid #ccc', margin: 8, padding: 8 }}>
        <h3>{job.title} @ {job.company}</h3>
        <div>Location: {job.location} ({job.region})</div>
        <div>Match Score: {job.matchScore ?? 0}/100</div>
        <div>Source: {job.jobBoard}</div>
        <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">Quick Apply</a>
        <button onClick={() => onSave(job)}>Save</button>
      </div>
    ))}
  </div>
);
