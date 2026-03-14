import React, { useState, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { SourceBadge } from '../SourceBadge';

interface Topic {
  name: string;
  weight: number;
}

interface Resource {
  name: string;
  url: string;
}

interface Term {
  q: string;
  a: string;
}

const POOJA_DATA = {
  exam: "ASCP MB — Molecular Biology",
  overview: "100 questions · 2.5 hours · Pass ~400/500",
  targetDate: new Date('2026-05-15'),
  topics: [
    { name: "Blood Banking", weight: 20 },
    { name: "Molecular Diagnostics", weight: 18 },
    { name: "Hematology", weight: 16 },
    { name: "Clinical Chemistry", weight: 15 },
    { name: "Immunology", weight: 12 },
    { name: "Microbiology", weight: 12 },
    { name: "Urinalysis", weight: 7 }
  ],
  resources: [
    { name: "ASCP BOC", url: "https://www.ascp.org/content/board-of-certification" },
    { name: "Labce.com", url: "https://www.labce.com/" },
    { name: "MLS Study Guide", url: "https://www.amazon.com/Medical-Laboratory-Science-Review-Robert/dp/0803628285" }
  ],
  terms: [
    { q: "PCR", a: "Polymerase Chain Reaction - technique to amplify DNA." },
    { q: "Ct Value", a: "Cycle Threshold - intersection between amplification curve and threshold line." },
    { q: "Haplotype", a: "A group of genes inherited together from a single parent." },
    { q: "Western Blot", a: "Technique to detect specific proteins in a sample." },
    { q: "CRISPR", a: "Clustered Regularly Interspaced Short Palindromic Repeats - gene editing tool." }
  ]
};

const DJ_DATA = {
  exam: "ISACA AAIA — AI Auditing",
  overview: "75 questions · 2 hours · Focus on AI Governance & Risk",
  targetDate: new Date('2026-06-30'),
  topics: [
    { name: "AI Fundamentals", weight: 25 },
    { name: "AI Governance", weight: 20 },
    { name: "AI Risk Management", weight: 20 },
    { name: "Audit Methodology", weight: 20 },
    { name: "Ethics & Compliance", weight: 15 }
  ],
  resources: [
    { name: "ISACA AAIA Guide", url: "https://www.isaca.org/credentialing/ai-fundamentals" },
    { name: "NIST AI RMF", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
    { name: "EU AI Act", url: "https://artificialintelligenceact.eu/" }
  ],
  terms: [
    { q: "Hallucination", a: "AI output that is confident but factually incorrect." },
    { q: "RLHF", a: "Reinforcement Learning from Human Feedback." },
    { q: "AI RMF", a: "NIST's framework for managing AI-related risks." },
    { q: "Model Bias", a: "Systematic errors in an AI model due to biased training data." },
    { q: "Audit Trail", a: "Chronological record providing evidence of AI system activities." }
  ]
};

const FlipCard = ({ term }: { term: Term }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div 
      onClick={() => setFlipped(!flipped)}
      style={{
        height: '120px',
        perspective: '1000px',
        cursor: 'pointer'
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        textAlign: 'center',
        transition: 'transform 0.6s',
        transformStyle: 'preserve-3d',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
      }}>
        {/* Front */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          fontWeight: 700
        }}>
          {term.q}
        </div>
        {/* Back */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          background: 'var(--profile-color)',
          color: 'white',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          fontSize: '0.85rem',
          transform: 'rotateY(180deg)'
        }}>
          {term.a}
        </div>
      </div>
    </div>
  );
};

export function PrepVault() {
  const { profile } = useProfile();
  const data = profile === 'dj' ? DJ_DATA : POOJA_DATA;
  
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    const calcDays = () => {
      const diff = data.targetDate.getTime() - new Date().getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };
    setDaysLeft(calcDays());
  }, [data.targetDate]);

  return (
    <div className="prep-vault-section" style={{ display: 'grid', gap: '32px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-10px', right: '0' }}>
        <SourceBadge source="static" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        
        {/* Exam Overview Card */}
        <div style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>{data.exam}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '24px' }}>{data.overview}</p>
          
          <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Exam Countdown</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--profile-color)' }}>{daysLeft} Days</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>Target: {data.targetDate.toLocaleDateString()}</div>
          </div>

          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Topic Weightage</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {data.topics.map((topic, idx) => (
              <span key={idx} style={{ 
                padding: '6px 12px', 
                borderRadius: '20px', 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: '0.8rem',
                fontWeight: 600
              }}>
                {topic.name} ({topic.weight}%)
              </span>
            ))}
          </div>
        </div>

        {/* Resources & Quick Recall */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Study Resources</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {data.resources.map((res, idx) => (
                <a 
                  key={idx} 
                  href={res.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  {res.name}
                  <span style={{ color: 'var(--profile-color)' }}>↗</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Recall Section */}
      <div style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Quick Recall (Flashcards)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {data.terms.map((term, idx) => (
            <FlipCard key={idx} term={term} />
          ))}
        </div>
      </div>
    </div>
  );
}
