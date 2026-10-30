export type ApiMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCall[]; reasoning_content?: string }
  | { role: 'tool'; tool_call_id: string; content: string };
export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };

// any OpenAI-compatible server with tool calling works, e.g. Ollama or vLLM serving the same open weights
const BASE_URL = process.env.EXPO_PUBLIC_AI_BASE_URL || 'https://api.deepseek.com';
const IS_DEEPSEEK = BASE_URL.includes('api.deepseek.com');

export async function chatCompletion(opts: { apiKey: string; model: string; messages: ApiMessage[]; tools?: unknown[]; signal?: AbortSignal }) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.apiKey}` },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      tools: opts.tools,
      tool_choice: opts.tools ? 'auto' : undefined,
      // DeepSeek thinks by default; a chat answer on a phone needs speed more than depth
      thinking: IS_DEEPSEEK ? { type: 'disabled' } : undefined,
      temperature: 0.4,
      max_tokens: 700,
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${BASE_URL} ${res.status}: ${body.slice(0, 200)}`);
  }
  const j = await res.json();
  return j.choices[0].message as Extract<ApiMessage, { role: 'assistant' }>;
}
