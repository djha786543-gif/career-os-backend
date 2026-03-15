/**
 * cpProfiles.ts
 * Career Portal profile configurations — kanban columns, search defaults, system prompts.
 * Sourced from career-os-v2.html TRACKER_STAGES + PROFILES.
 */

export const CP_PROFILES = {
  dj: {
    name:                  'Deobrat Jha',
    role:                  'IT Audit Manager',
    accent:                '#06b6d4',
    storageKey:            'careerOS_tracker_dj',
    columns:               ['Saved', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'],
    searchKeywordsDefault: 'IT Audit Manager OR SOX ITGC OR IT Compliance OR Cloud Security Auditor remote',
    systemPrompt: `You are a career intelligence engine for Deobrat Jha — IT Audit Manager, CISA certified, 10+ years experience, EY alumni, Public Storage Corp. Skills: SOX 404, ITGC, AI Governance, AWS Cloud Audit, NIST AI RMF, ISO 42001. Target: AI Audit Director / CISO. Active cert: AAIA (March 2026). Provide concise, data-driven, actionable intelligence. Format with bullet points and key metrics. Be direct and specific — no generic advice.`,
  },
  pj: {
    name:                  'Pooja Jha',
    role:                  'Postdoctoral Researcher',
    accent:                '#ec4899',
    storageKey:            'careerOS_tracker_pj',
    columns:               ['Saved', 'Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'],
    searchKeywordsDefault: 'postdoctoral researcher cardiovascular molecular biology OR biotech research scientist Los Angeles',
    systemPrompt: `You are a career intelligence engine for Pooja Jha — Postdoctoral Researcher, Cardiovascular & Molecular Biology. Nature Communications author. Skills: NGS, qPCR, scRNA-seq, CRISPR, ChIP-seq. Target: Research Scientist / PI track. Active cert: ASCP Molecular Biology (May 2026). Provide concise, data-driven, actionable intelligence. Format with bullet points and key metrics. Be direct and specific — no generic advice.`,
  },
} as const;

export const TRACKER_STAGES = {
  dj: ['Saved', 'Applied', 'Phone Screen', 'Interview', 'Offer', 'Rejected'],
  pj: ['Saved', 'Applied', 'Shortlisted', 'Interview', 'Offer', 'Rejected'],
} as const;

export const STAGE_COLORS: Record<string, string> = {
  'Saved':        '#6366f1',
  'Applied':      '#3b82f6',
  'Phone Screen': '#f59e0b',
  'Shortlisted':  '#f59e0b',
  'Interview':    '#8b5cf6',
  'Offer':        '#22c55e',
  'Rejected':     '#ef4444',
};
