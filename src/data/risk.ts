import { Level, levelOf, RAIN, rainCat, Report, Sector, SECTORS, dist } from './places';
import { atHour, hourOf, partOfDay, range } from './time';
import { Hourly, nowIndex, Tide } from './weather';

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sum = (a: number[]) => a.reduce((x, y) => x + (y || 0), 0);

export type Risk = { score: number; level: Level; r3: number; r24: number };

function tideNorm(tide: Tide) {
  const tv = tide.sea_level_height_msl, min = Math.min(...tv), max = Math.max(...tv);
  return (v: number) => clamp((v - min) / (max - min || 1));
}

// neighbor reports near the barrio raise its risk on top of the illustrative base value
export function reportFactor(s: Sector, reports: Report[]) {
  const near = reports.filter((r) => r.mine && dist(r, s) < 1500).length;
  return clamp(s.reports + 0.15 * near);
}

export function computeRisk(s: Sector, h: Hourly, tide: Tide, reports: Report[]): Risk {
  const i = nowIndex(h.time), ti = nowIndex(tide.time), norm = tideNorm(tide);
  const r3 = sum(h.precipitation.slice(i, i + 3)), r24 = sum(h.precipitation.slice(i, i + 24));
  const tideN = norm(Math.max(...tide.sea_level_height_msl.slice(ti, ti + 6)));
  const score = Math.round(30 * clamp(r3 / 25) + 25 * clamp(r24 / 70) + 15 * tideN + 20 * s.terrain + 10 * reportFactor(s, reports));
  return { score, level: levelOf(score), r3, r24 };
}

export function computeAllRisk(hourly: Record<string, Hourly>, tide: Tide, reports: Report[]) {
  return Object.fromEntries(SECTORS.map((s) => [s.id, computeRisk(s, hourly[s.id], tide, reports)])) as Record<string, Risk>;
}

export type Window = { k: number; rain: number; peak: number };

// best = gentlest 2-hour window to go out (rain plus high river), worst = the heaviest rain, over the next 14 hours
export function windows(h: Hourly, tide: Tide) {
  const i = nowIndex(h.time), ti = nowIndex(tide.time), norm = tideNorm(tide), tv = tide.sea_level_height_msl;
  let best: (Window & { cost: number }) | null = null, worst: Window | null = null;
  for (let k = i; k < i + 14 && k + 2 < h.time.length; k++) {
    const hour = hourOf(h.time[k]), rain = h.precipitation[k] + h.precipitation[k + 1];
    const peak = Math.max(h.precipitation[k], h.precipitation[k + 1]);
    const cost = rain + 3 * norm(tv[ti + (k - i)] ?? Math.min(...tv));
    if (hour >= 6 && hour <= 21 && (!best || cost < best.cost)) best = { k, cost, rain, peak };
    if (!worst || rain > worst.rain) worst = { k, rain, peak };
  }
  return { best, worst, i };
}

export type TideTurn = { k: number; t: string; high: boolean };
export function tideTurns(tide: Tide): TideTurn[] {
  const v = tide.sea_level_height_msl, i = nowIndex(tide.time), out: TideTurn[] = [];
  for (let k = Math.max(1, i); k < v.length - 1; k++) {
    if (v[k] >= v[k - 1] && v[k] > v[k + 1]) out.push({ k, t: tide.time[k], high: true });
    if (v[k] <= v[k - 1] && v[k] < v[k + 1]) out.push({ k, t: tide.time[k], high: false });
  }
  return out;
}
export const nextHigh = (tide: Tide) => tideTurns(tide).find((x) => x.high);
export function tideRising(tide: Tide) {
  const v = tide.sea_level_height_msl, i = nowIndex(tide.time);
  return v[i + 1] > v[i];
}

export function headline(h: Hourly, tide: Tide) {
  const { worst } = windows(h, tide), c = worst ? rainCat(worst.peak) : RAIN[0];
  if (!worst || c.n === 0) return 'No se espera lluvia en las próximas horas.';
  const verb = ['', 'Puede caer una llovizna', 'Puede llover moderado', 'Puede llover fuerte', 'Puede llover muy fuerte'][c.n];
  const a = hourOf(h.time[worst.k]);
  return `${verb} ${partOfDay(h.time[worst.k])}, de ${range(a, a + 2)}.`;
}

export function reasons(s: Sector, risk: Risk, tide: Tide, reports: Report[]) {
  const ht = nextHigh(tide), rf = reportFactor(s, reports);
  const amount = risk.r24 < 2 ? 'Casi no se espera lluvia' : risk.r24 < 10 ? 'Se espera poca lluvia' : risk.r24 < 30 ? 'Se espera bastante lluvia' : 'Se espera mucha lluvia';
  return [
    { icon: '☔', text: `${amount} en las próximas 24 horas.` },
    { icon: '🌊', text: ht ? `El río estará alto ${atHour(ht.t)}. Con el río alto, el agua de la calle se va más lento.` : 'El río está bajo por ahora.' },
    { icon: '🏘️', text: s.terrain > 0.7 ? 'Es una zona baja: el agua se junta rápido.' : s.terrain > 0.5 ? 'A veces se junta agua en esta zona.' : 'Es una zona alta: el agua se va rápido.', demo: true },
    { icon: '📣', text: rf > 0.5 ? 'Varios vecinos reportaron agua hoy.' : rf > 0.2 ? 'Un par de vecinos reportaron agua hoy.' : 'Nadie ha reportado agua hoy.', demo: true },
  ];
}

export function todoFor(level: Level, h: Hourly, tide: Tide) {
  const { best, worst } = windows(h, tide), ht = nextHigh(tide);
  const win = (w: Window | null) => (w ? range(hourOf(h.time[w.k]), hourOf(h.time[w.k]) + 2) : '');
  return {
    tranquilo: ['Revisa que la alcantarilla de tu cuadra no tenga basura.', 'Guarda tus papeles importantes en una funda plástica.', 'Activa los avisos de Nuria para tu barrio.'],
    ojo: [
      'Carga el celular y la batería externa.',
      best ? `Si tienes que salir, hazlo de ${win(best)}.` : 'Planifica tus salidas con Nuria.',
      ht ? `El río estará alto ${atHour(ht.t)}: si llueve a esa hora, el agua tarda en irse.` : 'Ten lista la mochila de emergencia.',
    ],
    cuidado: ['Sube papeles, medicinas y aparatos a un lugar alto.', 'Mueve el carro a una zona alta antes de la lluvia.', worst ? `No salgas de ${win(worst)}.` : 'Evita los pasos a desnivel.'],
    peligro: ['Quédate en un lugar alto y seguro.', 'No camines ni manejes por calles con agua que corre.', 'Si el agua entra a tu casa, corta la luz y llama al 911.'],
  }[level.key];
}

export function bestWorstText(h: Hourly, tide: Tide) {
  const { best, worst } = windows(h, tide);
  const win = (w: Window) => range(hourOf(h.time[w.k]), hourOf(h.time[w.k]) + 2);
  return {
    best: best ? win(best) : null,
    bestWord: best ? rainCat(best.peak).word : null,
    worst: worst && rainCat(worst.peak).n >= 2 ? win(worst) : null,
    worstWord: worst ? rainCat(worst.peak).word : null,
  };
}
