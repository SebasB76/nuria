import { sectorById } from '@/data/places';
import { clock, todayLong } from '@/data/time';
import { ApiMessage, chatCompletion } from './deepseek';
import { Card, runTool, NuriaEnv, TOOL_SPECS } from './tools';

const MAX_ROUNDS = 4;

function systemPrompt(env: NuriaEnv) {
  const { app } = env, home = sectorById(app.prefs.homeId);
  return `You are Nuria, the assistant of the Nuria app, which helps people in Guayaquil, Ecuador, get through the El Niño rainy season.
Your picture is a teal bird that watches the rain over the Guayas. You are warm, calm, practical. In Spanish you speak of yourself in the feminine ("estoy lista").

Context
- Now: ${todayLong()}, ${clock(new Date())} in Guayaquil.
- User's home: ${home.name}. Work: ${sectorById(app.prefs.workId).name}. Kids' school: ${sectorById(app.prefs.schoolId).name}.
- User's family in the app: ${env.family.members.filter((m) => !m.me).map((m) => m.rel).join(', ')}.
- Forecast data: ${app.prefs.scenario === 'storm' ? 'a demo storm scenario for a pitch, not the real sky. Do not bring it up; only if the user asks whether the data is real, say it is a demo scenario' : app.live.rain ? 'live (Open-Meteo)' : 'offline example data'}. Neighborhood terrain and neighbor reports are example data in this prototype.

How you answer
- Always in Spanish from Ecuador, using "tú". Simple words that an older person understands. No technical terms: never say millimeters, msl, OSRM, API or model names. Say "lluvia fuerte", "el río está alto".
- Short: 2 to 4 sentences, or a short list. Lead with the answer. Use **bold** only for the key time or action.
- Use the tools for anything about rain, risk, the river, routes, family, reports or the season. Never invent forecasts, times or places. The app shows a card under your answer with the tool data, so do not repeat every number.
- When the user describes water, a closed street, a clogged drain or a landslide they see, call report_street_problem.
- When the user asks to tell the family they are OK, call draft_family_message with a short message.

Safety (never break these)
- Never tell anyone to walk or drive through moving water: 15 cm can knock a person down and 30 cm can carry a car.
- In danger, say: go to a high place, cut the power only without stepping in water, and call 911.
- You are not an official source. For official alerts, point to INAMHI (weather) and the SNGR (risk management).
- If you are unsure, say so and give the safest option.`;
}

export type NuriaReply = { text: string; cards: Card[] };

export async function askNuria(history: ApiMessage[], env: NuriaEnv, apiKey: string, signal?: AbortSignal): Promise<{ reply: NuriaReply; history: ApiMessage[] }> {
  const msgs: ApiMessage[] = [{ role: 'system', content: systemPrompt(env) }, ...history];
  const cards: Card[] = [];
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const m = await chatCompletion({ apiKey, model: env.app.prefs.model, messages: msgs, tools: round < MAX_ROUNDS - 1 ? TOOL_SPECS : undefined, signal });
    // reasoning_content must travel back with the assistant turn, or the API rejects the next call
    msgs.push(m);
    if (!m.tool_calls?.length) return { reply: { text: m.content || '', cards }, history: msgs.slice(1) };
    for (const call of m.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {}
      const r = await runTool(call.function.name, args, env).catch((e) => ({ data: { error: String(e) }, card: undefined }));
      if (r.card && !cards.some((c) => c.type === r.card!.type)) cards.push(r.card);
      msgs.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(r.data) });
    }
  }
  return { reply: { text: 'Te dejo lo que encontré.', cards }, history: msgs.slice(1) };
}

// keep the last turns only, cutting at a user message so tool calls stay paired with their results
export function trimHistory(h: ApiMessage[], maxUserTurns = 6) {
  const idx = h.map((m, i) => (m.role === 'user' ? i : -1)).filter((i) => i >= 0);
  return idx.length > maxUserTurns ? h.slice(idx[idx.length - maxUserTurns]) : h;
}
