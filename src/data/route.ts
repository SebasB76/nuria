import { dist, isBlocking, nearestSector, Point, rainCat, Report } from './places';
import { atHour, hoursFromNowKey } from './time';
import { Hourly, nowIndex } from './weather';

export type Route = { coords: Point[]; dist: number; dur: number; name: string; detour?: boolean };
export type Assessment = { cost: number; peak: number; hits: Report[]; low: number };
export type RouteOption = { r: Route; a: Assessment };
export type Departure = number | 'best';
export type RoutePlan = { from: NamedPoint; to: NamedPoint; off: number; offSel: Departure; list: RouteOption[]; later: { o: number; c: number; peak: number } };
export type NamedPoint = Point & { id: string; name: string };

export async function osrm(points: Point[], alternatives: boolean): Promise<Route[]> {
  const coords = points.map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(';');
  const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?alternatives=${alternatives ? 3 : 'false'}&overview=full&geometries=geojson&steps=true`);
  const j = await r.json();
  if (j.code !== 'Ok') throw new Error(j.code);
  return j.routes.map((x: any) => ({
    coords: x.geometry.coordinates.map(([lon, lat]: number[]) => ({ lat, lon })),
    dist: x.distance,
    dur: x.duration,
    name: [...new Set<string>(x.legs.flatMap((l: any) => l.summary.split(', ')).filter(Boolean))].slice(0, 2).join(' y ').replace(/Avenida/g, 'Av.'),
  }));
}

export function samples(coords: Point[], step = 250) {
  const seg = coords.slice(1).map((c, i) => dist(coords[i], c));
  const total = seg.reduce((a, b) => a + b, 0) || 1;
  const out = [{ ...coords[0], frac: 0 }];
  let acc = 0, next = step;
  seg.forEach((d, i) => {
    while (d && acc + d >= next) {
      const f = (next - acc) / d, a = coords[i], b = coords[i + 1];
      out.push({ lat: a.lat + (b.lat - a.lat) * f, lon: a.lon + (b.lon - a.lon) * f, frac: next / total });
      next += step;
    }
    acc += d;
  });
  out.push({ ...coords[coords.length - 1], frac: 1 });
  return out;
}

// cost of driving a route if you leave `off` hours from now: rain on the way, reported water, low ground, then time
export function assess(r: Route, off: number, hourly: Record<string, Hourly>, reports: Report[]): Assessment {
  const pts = samples(r.coords), blocking = reports.filter(isBlocking), hits = new Set<Report>();
  let rain = 0, peak = 0, low = 0;
  for (const p of pts) {
    const s = nearestSector(p), h = hourly[s.id];
    const k = Math.min(nowIndex(h.time) + off + Math.floor((p.frac * r.dur) / 3600), h.precipitation.length - 1);
    const mm = h.precipitation[k] || 0;
    rain += mm;
    peak = Math.max(peak, mm);
    low += s.terrain;
    blocking.forEach((rep) => dist(p, rep) < 220 && hits.add(rep));
  }
  const n = pts.length;
  return { cost: (rain / n) * 8 + hits.size * 30 + (low / n) * 6 + (r.dur / 60) * 0.5, peak, hits: [...hits], low: low / n };
}

export async function planRoute(from: NamedPoint, to: NamedPoint, offSel: Departure, hourly: Record<string, Hourly>, reports: Report[]): Promise<RoutePlan> {
  const ev = (r: Route, o: number) => assess(r, o, hourly, reports);
  const cands = await osrm([from, to], true);
  const first = cands.map((r) => ev(r, 0));
  if (first.every((a) => a.hits.length)) {
    // every option crosses reported water: ask for a way around the first flooded point, on both sides
    const rep = first[0].hits[0], dx = to.lon - from.lon, dy = to.lat - from.lat, len = Math.hypot(dx, dy) || 1;
    for (const sg of [1, -1]) {
      try {
        const [d] = await osrm([from, { lat: rep.lat + (dx / len) * 0.008 * sg, lon: rep.lon - (dy / len) * 0.008 * sg }, to], false);
        if (d) cands.push({ ...d, detour: true });
      } catch {}
    }
  }
  const uniq = cands.filter((r, i) => !cands.slice(0, i).some((q) => Math.abs(q.dist - r.dist) < r.dist * 0.01));
  let off = 0;
  if (offSel === 'best') {
    let best: { c: number; o: number } | null = null;
    for (let o = 0; o <= 6; o++) for (const r of uniq) { const c = ev(r, o).cost; if (!best || c < best.c) best = { c, o }; }
    off = best!.o;
  } else off = offSel;
  const list = uniq.map((r) => ({ r, a: ev(r, off) })).sort((x, y) => x.a.cost - y.a.cost).slice(0, 3);
  const later = [0, 1, 2, 3, 4, 5, 6].map((o) => { const a = ev(list[0].r, o); return { o, c: a.cost, peak: a.peak }; }).reduce((m, x) => (x.c < m.c ? x : m));
  return { from, to, off, offSel, list, later };
}

export const departWords = (off: number) => (off === 0 ? 'ahora' : atHour(hoursFromNowKey(off)));

export function routeReasons(x: RouteOption): [string, string][] {
  const a = x.a, c = rainCat(a.peak), out: [string, string][] = [];
  out.push(['☔', c.n === 0 ? 'Sin lluvia en el camino.' : `En el camino: ${c.word}.`]);
  out.push(a.hits.length ? ['⚠️', `Pasa por ${a.hits.length === 1 ? 'un punto' : a.hits.length + ' puntos'} con agua reportada: ${a.hits[0].text.toLowerCase()}.`] : ['✅', 'Sin agua reportada en el camino.']);
  if (a.low > 0.72) out.push(['🏘️', 'Cruza zonas bajas, donde el agua se junta rápido.']);
  if (x.r.detour) out.push(['↪️', 'Rodea el punto con agua.']);
  return out;
}

export function compareTag(x: RouteOption, b: RouteOption) {
  const dm = Math.round((b.r.dur - x.r.dur) / 60);
  return dm >= 1 ? `${dm} min más corta` : dm <= -1 ? `${-dm} min más larga` : 'Tiempo parecido';
}

export function routeTip(plan: RoutePlan) {
  const b = plan.list[0];
  if (plan.offSel === 'best') return `Sal ${departWords(plan.off)}: es cuando menos llueve en tu camino.`;
  // suggest another hour only when the rain on the way drops a whole category, not by a few drops
  if (plan.later.o !== plan.off && rainCat(plan.later.peak).n < rainCat(b.a.peak).n) return `Si puedes, sal ${departWords(plan.later.o)}: habrá menos lluvia en el camino.`;
  return plan.off === 0 ? 'Es un buen momento para salir.' : `Saliendo ${departWords(plan.off)} vas bien.`;
}
