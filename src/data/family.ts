import { Point } from './places';

export type MemberStatus = 'ok' | 'wait' | 'unknown' | 'help';
export type Member = Point & {
  id: string;
  rel: string;
  initials: string;
  color: string;
  status: MemberStatus;
  okAgo: number | null;
  battery: number;
  me?: boolean;
  moving?: boolean;
  note?: string;
};

export const STATUS: Record<MemberStatus, { text: string; color: string }> = {
  ok: { text: 'Está bien', color: '#2E9E5B' },
  wait: { text: 'Esperando respuesta…', color: '#7D8C97' },
  unknown: { text: 'Sin confirmar', color: '#F2B01E' },
  help: { text: 'Necesita ayuda', color: '#D43C3C' },
};

// sample family for the demo; Papá drives on real streets from Centro to Durán
export const INITIAL_FAMILY: Member[] = [
  { id: 'me', rel: 'Tú', initials: 'Tú', color: '#0E3550', lat: -2.1405, lon: -79.9008, status: 'ok', okAgo: 0, battery: 78, me: true },
  { id: 'mom', rel: 'Mamá', initials: 'M', color: '#E8746A', lat: -2.1652, lon: -79.9125, status: 'ok', okAgo: 5, battery: 64 },
  { id: 'daughter', rel: 'Hija', initials: 'H', color: '#9A7BD6', lat: -2.1612, lon: -79.9068, status: 'ok', okAgo: 12, battery: 41, note: 'En el colegio' },
  { id: 'dad', rel: 'Papá', initials: 'P', color: '#3E8FC9', lat: -2.194, lon: -79.884, status: 'unknown', okAgo: null, battery: 18, moving: true },
];
export const DAD_DESTINATION: Point = { lat: -2.1705, lon: -79.8365 };

export type Privacy = 'always' | 'emergency' | 'paused';
export const PRIVACY_TEXT: Record<Privacy, string> = {
  always: 'Tu familia ve dónde estás mientras compartes. Puedes pausarlo cuando quieras.',
  emergency: 'Tu familia solo ve dónde estás si tú pides ayuda o Tamy detecta peligro en tu zona.',
  paused: 'Nadie ve dónde estás. Tu familia solo ve si confirmaste que estás bien.',
};
