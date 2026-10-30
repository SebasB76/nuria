import { STATUS } from '@/data/family';
import { Depth, fold, PLACES, rainCat, REPORT_KINDS, ReportKind, sectorById, SECTORS } from '@/data/places';
import { bestWorstText, headline, nextHigh, reasons, tideRising, todoFor } from '@/data/risk';
import { Departure, NamedPoint, RoutePlan, routeReasons, routeTip } from '@/data/route';
import { HOME_WATER_STEPS, KIT_ITEMS, SEASON } from '@/data/season';
import { atHour, hourOf, hShort } from '@/data/time';
import { nowIndex } from '@/data/weather';
import { useApp } from '@/state/AppState';
import { useFamily } from '@/state/FamilyState';
import { tideSentence } from '@/ui/TideChart';

export type Card =
  | { type: 'risk'; sectorId: string }
  | { type: 'rain'; sectorId: string }
  | { type: 'tide' }
  | { type: 'route'; plan: RoutePlan }
  | { type: 'family' }
  | { type: 'season' }
  | { type: 'kit' }
  | { type: 'steps'; title: string; items: string[] }
  | { type: 'whatsapp'; text: string }
  | { type: 'report'; text: string; sectorName: string };

export type TamyEnv = { app: ReturnType<typeof useApp>; family: ReturnType<typeof useFamily> };
type ToolResult = { data: unknown; card?: Card };

const fn = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []) => ({
  type: 'function' as const,
  function: { name, description, parameters: { type: 'object', properties, required } },
});
const hood = { type: 'string', description: 'Barrio o sector de Guayaquil (por ejemplo "Alborada", "Guasmo", "Durán"). Omítelo para usar la casa del usuario.' };

export const TOOL_SPECS = [
  fn('get_neighborhood_risk', 'Flood risk level for a Guayaquil neighborhood today: level, headline, best and worst time to go out, reasons and what to do.', { neighborhood: hood }),
  fn('get_hourly_rain', 'Hour-by-hour rain forecast for a neighborhood (next hours), in plain words.', { neighborhood: hood, hours: { type: 'integer', description: 'How many hours ahead, 3 to 24. Default 12.' } }),
  fn('get_river_tide', 'Guayas river tide: whether it is rising and when it will be high or low. A high river makes street water drain slower.'),
  fn('plan_safe_route', 'Plan the driving route with the least rain and no reported flooded streets, plus alternatives and the best time to leave.', {
    from: { type: 'string', description: 'Start: a neighborhood, a place (Malecón 2000, Terminal Terrestre, Aeropuerto, Mall del Sol, ESPOL), "casa", "trabajo", "colegio", "mi ubicación" or a family member ("papá"). Default: home.' },
    to: { type: 'string', description: 'Destination, same options as "from".' },
    depart: { type: 'string', enum: ['now', 'in_1h', 'in_2h', 'best'], description: 'When the user leaves. "best" finds the hour with the least rain on the way.' },
  }, ['to']),
  fn('get_family_status', "Where each family member is right now, whether they confirmed they are OK, their zone's risk level and if they are near reported water."),
  fn('ask_family_if_ok', 'Send every family member a check-in asking if they are OK. Answers arrive in the app over the next seconds.'),
  fn('draft_family_message', 'Prepare a WhatsApp message for the family group. The user reviews it before sending.', { text: { type: 'string', description: 'The message, in simple Spanish, first person, short.' } }, ['text']),
  fn('report_street_problem', 'Put a neighbor report on the map when the user says what they see in the street.', {
    kind: { type: 'string', enum: ['water', 'closed', 'drain', 'landslide'], description: 'water = agua en la calle, closed = calle cerrada, drain = alcantarilla tapada, landslide = deslave' },
    depth: { type: 'string', enum: ['Tobillo', 'Rodilla', 'Cintura'], description: 'Only for water: how deep it is.' },
    neighborhood: hood,
  }, ['kind']),
  fn('get_el_nino_season', 'How the El Niño season is going in Guayaquil: rain so far against a normal winter, official outlook.'),
  fn('show_emergency_kit', 'Show the emergency backpack checklist the user can tick.'),
  fn('show_home_flood_steps', 'Show the ordered steps for when water gets into the house.'),
];

export function findSector(name: string | undefined, env: TamyEnv) {
  if (!name) return sectorById(env.app.prefs.homeId);
  const t = fold(name);
  if (/casa|hogar/.test(t)) return sectorById(env.app.prefs.homeId);
  if (/trabajo|oficina/.test(t)) return sectorById(env.app.prefs.workId);
  if (/colegio|escuela/.test(t)) return sectorById(env.app.prefs.schoolId);
  return SECTORS.find((s) => t.includes(fold(s.short).split(' ')[0]) || fold(s.name).includes(t)) ?? sectorById(env.app.prefs.homeId);
}

function findPoint(name: string | undefined, env: TamyEnv): NamedPoint {
  const { app, family } = env, home = PLACES.find((p) => p.id === 's:' + app.prefs.homeId)!;
  if (!name) return home;
  const t = fold(name);
  const member = family.members.find((m) => !m.me && t.includes(fold(m.rel)));
  if (member) return { id: 'fam:' + member.id, name: 'Donde está ' + member.rel, lat: member.lat, lon: member.lon };
  if (/ubicacion|aqui|donde estoy/.test(t)) return app.customPoints.find((p) => p.id === 'me') ?? home;
  if (/casa|hogar/.test(t)) return home;
  if (/trabajo|oficina/.test(t)) return PLACES.find((p) => p.id === 's:' + app.prefs.workId)!;
  if (/colegio|escuela/.test(t)) return PLACES.find((p) => p.id === 's:' + app.prefs.schoolId)!;
  const all = [...app.customPoints, ...PLACES];
  return all.find((p) => fold(p.name).includes(t) || t.includes(fold(p.name).split(' ')[0])) ?? findSectorPlace(t) ?? home;
}
const findSectorPlace = (t: string) => {
  const s = SECTORS.find((x) => t.includes(fold(x.short).split(' ')[0]));
  return s ? PLACES.find((p) => p.id === 's:' + s.id) : undefined;
};

export async function runTool(name: string, args: any, env: TamyEnv): Promise<ToolResult> {
  const { app, family } = env;
  switch (name) {
    case 'get_neighborhood_risk': {
      const s = findSector(args.neighborhood, env), h = app.hourly[s.id], r = app.risk[s.id], bw = bestWorstText(h, app.tide);
      app.setFocusId(s.id);
      return {
        data: {
          neighborhood: s.name,
          level: r.level.name,
          level_meaning: r.level.desc,
          headline: headline(h, app.tide),
          best_time_to_go_out: bw.best,
          avoid_going_out: bw.worst,
          reasons: reasons(s, r, app.tide, app.reports).map((x) => x.text),
          what_to_do: todoFor(r.level, h, app.tide),
          data_is_live: app.live.rain && app.prefs.scenario === 'live',
        },
        card: { type: 'risk', sectorId: s.id },
      };
    }
    case 'get_hourly_rain': {
      const s = findSector(args.neighborhood, env), h = app.hourly[s.id], i = nowIndex(h.time), n = Math.max(3, Math.min(24, args.hours || 12));
      return {
        data: {
          neighborhood: s.name,
          hours: h.time.slice(i, i + n).map((t, k) => ({ hour: hShort(hourOf(t)), rain: rainCat(h.precipitation[i + k]).word, chance_percent: h.precipitation_probability[i + k] })),
        },
        card: { type: 'rain', sectorId: s.id },
      };
    }
    case 'get_river_tide': {
      const ht = nextHigh(app.tide);
      return { data: { now: tideRising(app.tide) ? 'subiendo' : 'bajando', next_high: ht ? atHour(ht.t) : null, summary: tideSentence(app.tide) }, card: { type: 'tide' } };
    }
    case 'plan_safe_route': {
      const from = findPoint(args.from, env), to = findPoint(args.to, env);
      const offSel: Departure = { now: 0, in_1h: 1, in_2h: 2, best: 'best' as const }[args.depart as 'now'] ?? 0;
      const plan = await app.runRoute({ from, to, offSel });
      if (!plan) return { data: { error: from.id === to.id ? 'Origin and destination are the same place.' : 'The route service did not answer. Suggest trying again in a moment.' } };
      return {
        data: {
          from: from.name,
          to: to.name,
          leave_advice: routeTip(plan),
          options: plan.list.map((x, i) => ({
            label: i === 0 ? 'recomendada' : 'alternativa ' + i,
            via: x.r.name || 'ruta marcada en el mapa',
            minutes_without_traffic: Math.round(x.r.dur / 60),
            km: +(x.r.dist / 1000).toFixed(1),
            notes: routeReasons(x).map(([, t]) => t),
          })),
        },
        card: { type: 'route', plan },
      };
    }
    case 'get_family_status':
      return {
        data: family.members.map((m) => {
          const z = family.zoneOf(m), s = sectorById(z.sectorId);
          return { who: m.rel, status: STATUS[m.status].text, where: s.name, zone_level: app.risk[s.id].level.name, moving: !!m.moving, note: m.note ?? null, near_reported_water: z.wet?.text ?? null, battery_percent: m.battery };
        }),
        card: { type: 'family' },
      };
    case 'ask_family_if_ok':
      family.askFamily();
      return { data: { sent: true, note: 'Answers show up in the Familia tab within seconds.' }, card: { type: 'family' } };
    case 'draft_family_message':
      return { data: { shown_to_user: true }, card: { type: 'whatsapp', text: String(args.text || '') } };
    case 'report_street_problem': {
      const kind = (args.kind in REPORT_KINDS ? args.kind : 'water') as ReportKind;
      const s = findSector(args.neighborhood, env);
      const rep = app.addReport({ kind, depth: kind === 'water' ? (args.depth as Depth) : undefined, lat: s.lat + (Math.random() - 0.5) * 0.006, lon: s.lon + (Math.random() - 0.5) * 0.006 });
      return { data: { saved: true, on_map: true, neighborhood: s.name }, card: { type: 'report', text: rep.text, sectorName: s.name } };
    }
    case 'get_el_nino_season':
      return { data: { share_of_normal_winter_already_rained: Math.round(SEASON.rainedShare * 100) + '%', facts: SEASON.facts, sources: SEASON.sources }, card: { type: 'season' } };
    case 'show_emergency_kit':
      return { data: { items: KIT_ITEMS }, card: { type: 'kit' } };
    case 'show_home_flood_steps':
      return { data: { steps: HOME_WATER_STEPS }, card: { type: 'steps', title: 'Si entra agua a tu casa', items: HOME_WATER_STEPS } };
    default:
      return { data: { error: 'unknown tool ' + name } };
  }
}
