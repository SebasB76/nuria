export type ApiMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[]; reasoning_content?: string }
  | { role: 'tool'; tool_call_id: string; content: string };
export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };

const BASE_URL = 'https://api.deepseek.com';

export async function chatCompletion(opts: { apiKey: string; model: string; messages: ApiMessage[]; tools?: unknown[]; signal?: AbortSignal }) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.apiKey}` },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      tools: opts.tools,
      tool_choice: opts.tools ? 'auto' : undefined,
      // thinking is on by default; a chat answer on a phone needs speed more than depth
      thinking: { type: 'disabled' },
      temperature: 0.4,
      max_tokens: 700,
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`DeepSeek ${res.status}: ${body.slice(0, 200)}`);
  }
  const j = await res.json();
  return j.choices[0].message as Extract<ApiMessage, { role: 'assistant' }>;
}
