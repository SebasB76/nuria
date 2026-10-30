import { Member, Privacy, STATUS } from '@/data/family';
import { Report, REPORT_KINDS, SECTORS } from '@/data/places';
import { Risk } from '@/data/risk';
import { RoutePlan } from '@/data/route';
import { MapScene } from './types';

export const cityView = (key = 'city'): MapScene['view'] => ({ points: SECTORS.map((s) => [s.lat, s.lon]), pad: 30, padTop: 90, padBottom: 210, key });

export function sectorMarks(risk: Record<string, Risk>, selectedId?: string): MapScene['sectors'] {
  return SECTORS.map((s) => {
    const l = risk[s.id].level;
    return { id: s.id, short: s.short, lat: s.lat, lon: s.lon, color: l.color, fill: l.fill, levelName: l.name, selected: s.id === selectedId };
  });
}

export function reportMarks(reports: Report[], hits: Report[] = []): MapScene['reports'] {
  return reports.map((r) => ({
    id: r.id,
    lat: r.lat,
    lon: r.lon,
    icon: REPORT_KINDS[r.kind].icon,
    text: r.mine ? 'Tu reporte: ' + r.text.toLowerCase() : r.text,
    sub: r.mine ? 'ahora · Tamy lo está revisando' : `${r.ago} · ${r.confirmations} vecinos lo confirmaron · ejemplo`,
    hit: hits.some((h) => h.id === r.id),
    mine: r.mine,
  }));
}

export function routeLines(plan: RoutePlan | null, sel: number): MapScene['routes'] {
  if (!plan) return [];
  return plan.list.map((x, i) => ({ i, coords: x.r.coords.map((p) => [p.lat, p.lon] as [number, number]), best: i === 0, selected: i === sel }));
}

export function abMarks(plan: RoutePlan | null): MapScene['marks'] {
  if (!plan) return [];
  return [
    { lat: plan.from.lat, lon: plan.from.lon, label: 'A', name: plan.from.name, bg: '#fff', fg: '#0b131a' },
    { lat: plan.to.lat, lon: plan.to.lon, label: 'B', name: plan.to.name, bg: '#2fd3c6', fg: '#04211f' },
  ];
}

export const hiddenMember = (m: Member, privacy: Privacy) => !!m.me && privacy !== 'always';

export function familyMarks(members: Member[], privacy: Privacy): MapScene['family'] {
  return members
    .filter((m) => !hiddenMember(m, privacy))
    .map((m) => ({ id: m.id, lat: m.lat, lon: m.lon, initials: m.initials, color: m.color, ring: STATUS[m.status].color, sos: m.status === 'help', moving: !!m.moving }));
}
