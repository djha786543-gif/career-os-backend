import React, { useState } from 'react';
import { AppLayout, TabId } from '../src/components/AppLayout';
import { JobHub }          from '../src/components/tabs/JobHub';
import { PrepVault }       from '../src/components/tabs/PrepVault';
import { MarketHeatmap }   from '../src/components/tabs/MarketHeatmap';
import { SkillEngine }     from '../src/components/tabs/SkillEngine';
import { CertVault }       from '../src/components/tabs/CertVault';
import { TrendRadar }      from '../src/components/tabs/TrendRadar';
import { SalaryBenchmark } from '../src/components/tabs/SalaryBenchmark';
import { StudyPlan }       from '../src/components/tabs/StudyPlan';
import { Tracker }         from '../src/components/tabs/Tracker';

const TAB_VIEWS: Record<TabId, React.ReactElement> = {
  'job-hub':      <JobHub />,
  'prep-vault':   <PrepVault />,
  'heatmap':      <MarketHeatmap />,
  'skill-engine': <SkillEngine />,
  'cert-vault':   <CertVault />,
  'trend-radar':  <TrendRadar />,
  'salary':       <SalaryBenchmark />,
  'study-plan':   <StudyPlan />,
  'tracker':      <Tracker />,
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('job-hub');
  return (
    <AppLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {TAB_VIEWS[activeTab]}
    </AppLayout>
  );
}
