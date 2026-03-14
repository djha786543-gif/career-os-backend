import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { SourceBadge } from '../SourceBadge';

interface Week {
  lbl: string;
  tasks: string[];
}

const DJ_SCHEDULE: Week[] = [
  { lbl: 'Week 1-2', tasks: ['AI fundamentals + LLM risk concepts', 'Read NIST AI RMF'] },
  { lbl: 'Week 3', tasks: ['AI governance frameworks (NIST AI RMF, EU AI Act)'] },
  { lbl: 'Week 4', tasks: ['AI audit methodology + ISACA guidance'] },
  { lbl: 'Week 5', tasks: ['Practical labs — evaluating AI systems'] },
  { lbl: 'Week 6-7', tasks: ['Practice exams + weak area review'] },
  { lbl: 'Week 8', tasks: ['Final prep + exam readiness check'] }
];

const POOJA_SCHEDULE: Week[] = [
  { lbl: 'Week 1-2', tasks: ['Molecular diagnostics + PCR methods'] },
  { lbl: 'Week 3', tasks: ['Hematology + coagulation'] },
  { lbl: 'Week 4', tasks: ['Blood banking + immunology'] },
  { lbl: 'Week 5', tasks: ['Clinical chemistry + urinalysis'] },
  { lbl: 'Week 6', tasks: ['Microbiology'] },
  { lbl: 'Week 7', tasks: ['Full practice exams (timed x2)'] },
  { lbl: 'Week 8', tasks: ['Weak area review + mental prep'] }
];

export function StudyPlan() {
  const { profile } = useProfile();
  const schedule = profile === 'dj' ? DJ_SCHEDULE : POOJA_SCHEDULE;
  
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`study_plan_${profile}`);
    if (saved) {
      setCheckedTasks(JSON.parse(saved));
    } else {
      setCheckedTasks({});
    }
  }, [profile]);

  const toggleTask = (weekIdx: number, taskIdx: number) => {
    const key = `${weekIdx}-${taskIdx}`;
    const newChecked = { ...checkedTasks, [key]: !checkedTasks[key] };
    setCheckedTasks(newChecked);
    localStorage.setItem(`study_plan_${profile}`, JSON.stringify(newChecked));
  };

  // Heuristic for "Current Week" - based on March 14, 2026
  const today = new Date('2026-03-14');

  return (
    <div className="study-plan-section" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <SourceBadge source="static" />
      </div>
      
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>8-Week Study Plan</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>Target: {profile === 'dj' ? 'AAIA Certification' : 'ASCP MB Certification'}</p>
        </div>
        <div style={{ fontSize: '0.8rem', background: 'var(--profile-color)22', color: 'var(--profile-color)', padding: '4px 12px', borderRadius: '12px', fontWeight: 700 }}>
          Today: March 14, 2026
        </div>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {schedule.map((week, wIdx) => {
          const isCurrent = (wIdx === 1); // Mock: Week 1-2 is current for March 14
          
          return (
            <div key={wIdx} style={{ 
              padding: '20px', 
              borderRadius: '12px', 
              background: isCurrent ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)', 
              border: isCurrent ? `1px solid var(--profile-color)` : '1px solid rgba(255,255,255,0.05)',
              boxShadow: isCurrent ? `0 0 20px var(--profile-color)11` : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: isCurrent ? 'var(--profile-color)' : 'white' }}>
                  {week.lbl}
                </h3>
                {isCurrent && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', background: 'var(--profile-color)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>
                    Current Week
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {week.tasks.map((task, tIdx) => {
                  const isChecked = !!checkedTasks[`${wIdx}-${tIdx}`];
                  return (
                    <label key={tIdx} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '6px',
                      background: isChecked ? 'rgba(255,255,255,0.02)' : 'transparent',
                      transition: 'background 0.2s'
                    }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => toggleTask(wIdx, tIdx)}
                        style={{ 
                          width: '18px', 
                          height: '18px', 
                          accentColor: 'var(--profile-color)',
                          cursor: 'pointer'
                        }}
                      />
                      <span style={{ 
                        fontSize: '0.95rem', 
                        color: isChecked ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
                        textDecoration: isChecked ? 'line-through' : 'none'
                      }}>
                        {task}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
