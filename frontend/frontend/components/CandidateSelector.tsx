import React from 'react';
import { Candidate } from '../models/Candidate';

type Props = {
  candidates: Candidate[];
  selected: string;
  onSelect: (id: string) => void;
};

export const CandidateSelector: React.FC<Props> = ({ candidates, selected, onSelect }) => (
  <div>
    <label>Candidate: </label>
    <select value={selected} onChange={e => onSelect(e.target.value)}>
      {candidates.map(c => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  </div>
);
