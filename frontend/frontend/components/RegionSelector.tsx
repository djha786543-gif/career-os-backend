import React from 'react';

type Props = {
  regions: string[];
  selected: string;
  onSelect: (region: string) => void;
};

export const RegionSelector: React.FC<Props> = ({ regions, selected, onSelect }) => (
  <div>
    <label>Region: </label>
    <select value={selected} onChange={e => onSelect(e.target.value)}>
      {regions.map(r => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  </div>
);
