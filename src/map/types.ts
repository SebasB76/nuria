export type LatLng = [number, number];

export type MapScene = {
  sectors?: { id: string; short: string; lat: number; lon: number; color: string; fill: number; levelName: string; selected: boolean }[];
  reports?: { id: string; lat: number; lon: number; icon: string; text: string; sub: string; hit?: boolean; mine?: boolean }[];
  routes?: { i: number; coords: LatLng[]; best: boolean; selected: boolean }[];
  marks?: { lat: number; lon: number; label: string; name: string; bg: string; fg: string }[];
  family?: { id: string; lat: number; lon: number; initials: string; color: string; ring: string; sos: boolean; moving: boolean }[];
  me?: { lat: number; lon: number } | null;
  view?: { points: LatLng[]; pad?: number; padTop?: number; padBottom?: number; zoom?: number; maxZoom?: number; animate?: boolean; key?: string };
  clouds?: boolean;
  cloudsPlaying?: boolean;
  picking?: boolean;
};

export type MapEvent =
  | { type: 'ready' }
  | { type: 'sector'; id: string }
  | { type: 'route'; i: number }
  | { type: 'member'; id: string }
  | { type: 'pick'; lat: number; lon: number }
  | { type: 'clouds'; label: string; frame: number; frames: number };
