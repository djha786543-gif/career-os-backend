import React from 'react';

type Props = {
  filters: Record<string, any>;
  onChange: (filters: Record<string, any>) => void;
};

export const SmartFiltersPanel: React.FC<Props> = ({ filters, onChange }) => (
  <div>
    <label>
      Remote
      <input type="checkbox" checked={!!filters.remote} onChange={e => onChange({ ...filters, remote: e.target.checked })} />
    </label>
    <label>
      Hybrid
      <input type="checkbox" checked={!!filters.hybrid} onChange={e => onChange({ ...filters, hybrid: e.target.checked })} />
    </label>
    <label>
      Visa Sponsorship
      <input type="checkbox" checked={!!filters.visaSponsorship} onChange={e => onChange({ ...filters, visaSponsorship: e.target.checked })} />
    </label>
    <label>
      Seniority
      <input type="text" value={filters.seniority || ''} onChange={e => onChange({ ...filters, seniority: e.target.value })} />
    </label>
    {/* Add more filters as needed */}
  </div>
);
