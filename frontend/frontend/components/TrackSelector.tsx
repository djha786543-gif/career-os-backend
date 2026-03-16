import React from 'react';

type Props = {
  track: string;
  onSelect: (track: string) => void;
};

export const TrackSelector: React.FC<Props> = ({ track, onSelect }) => (
  <div>
    <label>Track: </label>
    <select value={track} onChange={e => onSelect(e.target.value)}>
      <option value="Academic">Academic</option>
      <option value="Industry">Industry</option>
    </select>
  </div>
);
