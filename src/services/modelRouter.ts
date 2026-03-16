/**
 * modelRouter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Three-model routing table for Career-OS AI endpoints.
 *
 * ROUTING TABLE:
 *   POST /api/ai/skill       → Gemini Flash   (long-form skill analysis)
 *   POST /api/ai/trend       → Claude          (needs web_search tool)
 *   POST /api/ai/pathway     → DeepSeek        (structured cert pathway JSON)
 *   POST /api/ai/track       → DeepSeek        (structured learning track)
 *   POST /api/ai/vault-entry → Gemini Flash    (long-form exam prep content)
 *   POST /api/ai/assist      → Gemini Flash    (cover letter / interview / gap)
 *
 * COST RATIONALE:
 *   Claude (Anthropic) — reserved for web_search endpoints only (~$2-3/mo)
 *   DeepSeek           — cheapest for structured JSON generation (~$0.50/mo)
 *   Gemini Flash       — cheapest for long-form text generation (~$1-2/mo)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AiRoute = 'skill' | 'trend' | 'pathway' | 'track' | 'vault-entry' | 'assist';
export type ModelProvider = 'claude' | 'deepseek' | 'gemini';

export const ROUTE_TABLE: Record<AiRoute, ModelProvider> = {
  skill:       'gemini',   // long-form skill gap analysis
  trend:       'claude',   // MUST use Claude — requires web_search tool
  pathway:     'deepseek', // structured cert pathway
  track:       'deepseek', // structured learning track
  'vault-entry': 'gemini', // long-form exam prep content
  assist:      'gemini',   // cover letter / interview / skill gap per-job
};

export { geminiGenerate }   from './geminiClient';
export { deepseekGenerate } from './deepseekClient';
