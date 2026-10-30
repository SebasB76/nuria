import { C, LevelKey } from '@/ui/theme';

export type Level = {
  max: number;
  key: LevelKey;
  name: string;
  color: string;
  fill: number;
  short: string;
  desc: string;
};

export const LEVELS: Level[] = [
  { max: 25, key: 'tranquilo', name: 'Tranquilo', color: C.tranquilo, fill: 0.24, short: 'sin agua en la calle', desc: 'No se espera agua en la calle.' },
  { max: 50, key: 'ojo', name: 'Ojo', color: C.ojo, fill: 0.46, short: 'mantente atento', desc: 'Mantente atento. Ten un plan si vas a salir.' },
  { max: 75, key: 'cuidado', name: 'Cuidado', color: C.cuidado, fill: 0.7, short: 'agua en calles bajas', desc: 'Es probable que se junte agua en las calles bajas.' },
  { max: 101, key: 'peligro', name: 'Peligro', color: C.peligro, fill: 0.92, short: 'riesgo de inundación', desc: 'Riesgo alto de inundación. Evita las zonas bajas y sigue al INAMHI y a la SNGR.' },
];
export const levelOf = (score: number) => LEVELS.find((l) => score < l.max) ?? LEVELS[3];
export const levelByKey = (key: LevelKey) => LEVELS.find((l) => l.key === key)!;

export const RAIN = [
  { max: 0.5, n: 0, word: 'sin lluvia' },
  { max: 2.5, n: 1, word: 'llovizna' },
  { max: 7.6, n: 2, word: 'lluvia moderada' },
  { max: 30, n: 3, word: 'lluvia fuerte' },
  { max: 1e9, n: 4, word: 'lluvia muy fuerte' },
];
export const rainCat = (mm: number) => RAIN.find((r) => mm < r.max) ?? RAIN[4];

export type Point = { lat: number; lon: number };
export type Sector = Point & { id: string; name: string; short: string; terrain: number; reports: number };

// terrain (how low the ground is) and reports are illustrative values for the demo
export const SECTORS: Sector[] = [
  { id: 'alborada', name: 'Alborada', short: 'Alborada', lat: -2.14, lon: -79.902, terrain: 0.75, reports: 0.6 },
  { id: 'sauces', name: 'Sauces y Samanes', short: 'Sauces', lat: -2.121, lon: -79.904, terrain: 0.8, reports: 0.7 },
  { id: 'urdesa', name: 'Urdesa', short: 'Urdesa', lat: -2.164, lon: -79.91, terrain: 0.6, reports: 0.3 },
  { id: 'centro', name: 'Centro', short: 'Centro', lat: -2.194, lon: -79.884, terrain: 0.5, reports: 0.4 },
  { id: 'trinitaria', name: 'Isla Trinitaria', short: 'Trinitaria', lat: -2.236, lon: -79.922, terrain: 0.85, reports: 0.5 },
  { id: 'guasmo', name: 'Guasmo', short: 'Guasmo', lat: -2.268, lon: -79.888, terrain: 0.8, reports: 0.6 },
  { id: 'bastion', name: 'Bastión Popular', short: 'Bastión', lat: -2.083, lon: -79.957, terrain: 0.7, reports: 0.5 },
  { id: 'mapasingue', name: 'Mapasingue', short: 'Mapasingue', lat: -2.152, lon: -79.935, terrain: 0.6, reports: 0.3 },
  { id: 'costa', name: 'Vía a la Costa', short: 'Vía a la Costa', lat: -2.183, lon: -79.995, terrain: 0.35, reports: 0.1 },
  { id: 'samborondon', name: 'Samborondón', short: 'Samborondón', lat: -2.142, lon: -79.866, terrain: 0.55, reports: 0.3 },
  { id: 'duran', name: 'Durán', short: 'Durán', lat: -2.172, lon: -79.833, terrain: 0.7, reports: 0.4 },
];
export const sectorById = (id: string) => SECTORS.find((s) => s.id === id) ?? SECTORS[0];

export type ReportKind = 'water' | 'closed' | 'drain' | 'landslide';
export const REPORT_KINDS: Record<ReportKind, { icon: string; label: string }> = {
  water: { icon: '🌊', label: 'Agua en la calle' },
  closed: { icon: '🚧', label: 'Calle cerrada' },
  drain: { icon: '🕳️', label: 'Alcantarilla tapada' },
  landslide: { icon: '⛰️', label: 'Deslave' },
};
export type Depth = 'Tobillo' | 'Rodilla' | 'Cintura';

export type Report = Point & {
  id: string;
  kind: ReportKind;
  text: string;
  ago: string;
  confirmations: number;
  mine?: boolean;
  photo?: string;
};

// the first one sits on Av. Juan Tanca Marengo, so the Alborada → Malecón route has to go around it
export const DEMO_REPORTS: Report[] = [
  { id: 'd1', lat: -2.1553, lon: -79.895, kind: 'water', text: 'Agua hasta la rodilla en la avenida', ago: 'hace 15 min', confirmations: 6 },
  { id: 'd2', lat: -2.137, lon: -79.897, kind: 'water', text: 'Agua hasta la rodilla', ago: 'hace 25 min', confirmations: 3 },
  { id: 'd3', lat: -2.118, lon: -79.909, kind: 'closed', text: 'Paso a desnivel cerrado', ago: 'hace 40 min', confirmations: 5 },
  { id: 'd4', lat: -2.262, lon: -79.884, kind: 'drain', text: 'Alcantarilla tapada', ago: 'hace 1 hora', confirmations: 2 },
  { id: 'd5', lat: -2.233, lon: -79.917, kind: 'water', text: 'Agua en la calle', ago: 'hace 1 hora', confirmations: 4 },
  { id: 'd6', lat: -2.15, lon: -79.94, kind: 'landslide', text: 'Tierra suelta en el cerro', ago: 'hace 2 horas', confirmations: 2 },
  { id: 'd7', lat: -2.17, lon: -79.838, kind: 'water', text: 'Agua hasta el tobillo', ago: 'hace 2 horas', confirmations: 3 },
];
// standing water and closed streets block a route; a clogged drain or a loose hillside does not
export const isBlocking = (r: Report) => r.kind === 'water' || r.kind === 'closed';

export type Place = Point & { id: string; name: string; group: 'Barrios' | 'Lugares' | 'Tus puntos' };
export const PLACES: Place[] = [
  ...SECTORS.map((s) => ({ id: 's:' + s.id, name: s.name, lat: s.lat, lon: s.lon, group: 'Barrios' as const })),
  { id: 'p:malecon', name: 'Malecón 2000', lat: -2.1935, lon: -79.8798, group: 'Lugares' },
  { id: 'p:terminal', name: 'Terminal Terrestre', lat: -2.1409, lon: -79.8889, group: 'Lugares' },
  { id: 'p:aeropuerto', name: 'Aeropuerto', lat: -2.1574, lon: -79.8836, group: 'Lugares' },
  { id: 'p:malldelsol', name: 'Mall del Sol', lat: -2.1543, lon: -79.8928, group: 'Lugares' },
  { id: 'p:espol', name: 'ESPOL (Prosperina)', lat: -2.147, lon: -79.9655, group: 'Lugares' },
];

export const GYE_CENTER: Point = { lat: -2.17, lon: -79.9 };

export function dist(a: Point, b: Point) {
  const x = ((b.lon - a.lon) * Math.PI) / 180 * Math.cos(((a.lat + b.lat) * Math.PI) / 360);
  const y = ((b.lat - a.lat) * Math.PI) / 180;
  return Math.hypot(x, y) * 6371000;
}
export const nearestSector = (p: Point) => SECTORS.reduce((m, s) => (dist(p, s) < dist(p, m) ? s : m));

export const fold = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
