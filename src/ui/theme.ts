export const C = {
  paper: '#F3EEE4',
  paper2: '#E9E1D2',
  card: '#FFFFFF',
  line: '#ECE5D8',
  ink: '#10283A',
  ink2: '#4B5D69',
  muted: '#8B9297',
  cel: '#3BA7DE',
  celDeep: '#1F86C0',
  celSoft: '#DCEFF9',
  navy: '#0E3550',
  tranquilo: '#2E9E5B',
  ojo: '#F2B01E',
  cuidado: '#EE7A3A',
  peligro: '#D43C3C',
  wa: '#25D366',
  waDark: '#005C4B',
  tide: '#199E70',
};

export const F = {
  display: 'BricolageGrotesque_800ExtraBold',
  body: 'Onest_400Regular',
  medium: 'Onest_500Medium',
  bold: 'Onest_700Bold',
  black: 'Onest_800ExtraBold',
};

export type LevelKey = 'tranquilo' | 'ojo' | 'cuidado' | 'peligro';

// card tint for each level, from the screen-flow design
export const LEVEL_TINT: Record<LevelKey, { bg: string; border: string; ink: string }> = {
  tranquilo: { bg: '#E3F3E8', border: '#A9D9B7', ink: '#1D6B3B' },
  ojo: { bg: '#FFF3D3', border: '#F1CF74', ink: '#8A6200' },
  cuidado: { bg: '#FDE6D7', border: '#F3B48E', ink: '#A64A14' },
  peligro: { bg: '#FBDADA', border: '#EFA2A2', ink: '#A12A2A' },
};
