/**
 * deepseekClient.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * DeepSeek V3 client for structured JSON generation tasks:
 *   - Cert pathway generation
 *   - Learning track generation
 *   - Fit scoring (returns structured JSON)
 *
 * Uses the OpenAI-compatible API.
 * Requires env var: DEEPSEEK_API_KEY
 * ─────────────────────────────────────────────────────────────────────────────
 */

import OpenAI from 'openai';

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('DEEPSEEK_API_KEY not configured');
  if (!_client) {
    _client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey:  key,
    });
  }
  return _client;
}

/**
 * Generate content using DeepSeek Chat (V3).
 * @param systemPrompt  System-level instructions
 * @param userPrompt    User message / task
 * @param maxTokens     Max output tokens (default 2000)
 */
export async function deepseekGenerate(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 2000,
): Promise<string> {
  const client = getClient();
  const completion = await client.chat.completions.create({
    model:      'deepseek-chat',
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
  });
  return completion.choices[0]?.message?.content ?? '';
}
