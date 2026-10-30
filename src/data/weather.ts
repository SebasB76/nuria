import { SECTORS, Sector } from './places';
import { hourKey, hourOf, localNow } from './time';

export type Hourly = { time: string[]; precipitation: number[]; precipitation_probability: (number | null)[] };
export type Tide = { time: string[]; sea_level_height_msl: number[] };

async function getJSON(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

function synthSeries(fn: (hour: number, i: number) => number) {
  const start = localNow();
  start.setUTCMinutes(0, 0, 0);
  start.setUTCHours(start.getUTCHours() - 1);
  const time: string[] = [], v: number[] = [];
  for (let i = 0; i < 50; i++) {
    const d = new Date(start.getTime() + i * 3600e3);
    time.push(hourKey(d));
    v.push(fn(d.getUTCHours(), i));
  }
  return { time, v };
}

// offline fallback: an afternoon storm, the usual shape of a rainy day in Guayaquil
function synthRain(s: Sector): Hourly {
  const r = synthSeries((h) => +(Math.exp(-Math.pow((h - 16) / 2.2, 2)) * (12 + 8 * s.terrain) + (h > 20 || h < 4 ? 0.6 : 0.1)).toFixed(1));
  return {
    time: r.time,
    precipitation: r.v,
    precipitation_probability: r.time.map((t) => Math.round(40 + 55 * Math.exp(-Math.pow((hourOf(t) - 16) / 4, 2)))),
  };
}

function synthTide(): Tide {
  const r = synthSeries((_, i) => +(0.6 + 1.2 * Math.cos((2 * Math.PI * (i - 10)) / 12.42)).toFixed(2));
  return { time: r.time, sea_level_height_msl: r.v };
}

export async function loadForecast(): Promise<{ hourly: Record<string, Hourly>; live: boolean }> {
  const lat = SECTORS.map((s) => s.lat).join(','), lon = SECTORS.map((s) => s.lon).join(',');
  try {
    const j = await getJSON(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,precipitation_probability&past_hours=1&forecast_hours=49&timezone=America%2FGuayaquil`,
    );
    const arr = Array.isArray(j) ? j : [j];
    return { hourly: Object.fromEntries(SECTORS.map((s, i) => [s.id, arr[i].hourly as Hourly])), live: true };
  } catch {
    return { hourly: Object.fromEntries(SECTORS.map((s) => [s.id, synthRain(s)])), live: false };
  }
}

// modeled sea level at the mouth of the Guayas; it drives how fast street water drains
export async function loadTide(): Promise<{ tide: Tide; live: boolean }> {
  try {
    const j = await getJSON(
      'https://marine-api.open-meteo.com/v1/marine?latitude=-2.45&longitude=-79.95&hourly=sea_level_height_msl&past_hours=1&forecast_hours=49&timezone=America%2FGuayaquil',
    );
    return { tide: j.hourly, live: true };
  } catch {
    return { tide: synthTide(), live: false };
  }
}

export function nowIndex(times: string[]) {
  const i = times.indexOf(hourKey(localNow()));
  return i < 0 ? 0 : i;
}

// pitch scenario: a heavy storm that peaks two hours from now, so the demo never depends on today's sky
export function stormScenario(): Record<string, Hourly> {
  return Object.fromEntries(
    SECTORS.map((s) => {
      // index 1 is the current hour, so the peak sits at index 3
      const r = synthSeries((_, i) => +(Math.exp(-Math.pow((i - 3) / 1.8, 2)) * (10 + 26 * s.terrain) + 0.3).toFixed(1));
      return [s.id, { time: r.time, precipitation: r.v, precipitation_probability: r.v.map((mm) => Math.min(98, Math.round(30 + mm * 3))) }];
    }),
  );
}
