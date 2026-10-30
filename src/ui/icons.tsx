import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { Level } from '@/data/places';
import { C } from './theme';

const useSvgId = () => 'i' + useId().replace(/[^a-zA-Z0-9]/g, '');
const DROP = 'M20 2C20 2 4 19 4 30a16 16 0 0 0 32 0C36 19 20 2 20 2Z';

// the risk level drawn as a drop that fills up: the fuller, the worse
export function Drop({ level, size = 24, dark, fill }: { level: Level; size?: number; dark?: boolean; fill?: string }) {
  const id = useSvgId(), y = 46 - 44 * level.fill;
  return (
    <Svg width={Math.round((size * 40) / 48)} height={size} viewBox="0 0 40 48" accessibilityLabel={level.name}>
      <Defs>
        <ClipPath id={id}>
          <Path d={DROP} />
        </ClipPath>
      </Defs>
      <Path d={DROP} fill={dark ? 'rgba(255,255,255,0.14)' : '#fff'} />
      <G clipPath={`url(#${id})`}>
        <Path d={`M-2 ${y} q5.5 -3.5 11 0 t11 0 t11 0 t11 0 V50 H-2Z`} fill={fill || level.color} />
      </G>
      <Path d={DROP} fill="none" stroke={dark ? '#fff' : level.color} strokeWidth={2.6} />
    </Svg>
  );
}

export function TamyAvatar({ size = 40 }: { size?: number }) {
  const id = useSvgId();
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Tamy">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={C.cel} />
          <Stop offset="1" stopColor={C.navy} />
        </LinearGradient>
      </Defs>
      <Circle cx={32} cy={32} r={32} fill={`url(#${id})`} />
      <Path d="M13 17l-2 5M53 15l-2 5M50 47l-2 5M12 46l-2 5" stroke="#fff" strokeOpacity={0.45} strokeWidth={2} strokeLinecap="round" />
      <Path d="M32 11C32 11 17 28 17 38.5a15 15 0 0 0 30 0C47 28 32 11 32 11z" fill="#fff" />
      <Path d="M23.5 29c1.5-3.5 3.5-6 5.5-8" stroke="#CFEAF8" strokeWidth={2.6} fill="none" strokeLinecap="round" />
      <Circle cx={27} cy={38} r={2.3} fill={C.navy} />
      <Circle cx={37} cy={38} r={2.3} fill={C.navy} />
      <Circle cx={23.5} cy={43} r={2.3} fill="#F6A6A0" opacity={0.75} />
      <Circle cx={40.5} cy={43} r={2.3} fill="#F6A6A0" opacity={0.75} />
      <Path d="M28 44q4 3.4 8 0" stroke={C.navy} strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={9} fill={C.navy} />
      <Path d="M16 5c3.6 4.4 6 7.7 6 10.6a6 6 0 0 1-12 0C10 12.7 12.4 9.4 16 5z" fill={C.cel} />
      <Path d="M5 24c2.2-1.6 4.4-1.6 6.6 0s4.4 1.6 6.6 0 4.4-1.6 6.6 0" stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

const ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  work: 'M3 7h18v13H3zM9 7V5h6v2M3 12h18',
  school: 'M7 9a5 5 0 0 1 10 0v11H7zM9.5 14h5M12 4V2',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20.5a2 2 0 0 0 4 0',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  drop: 'M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  people: 'M9 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM15.5 14.2c3 .2 5.5 2.6 5.5 5.8',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 15V9a4 4 0 0 1 4-4h2M18 9v6a4 4 0 0 1-4 4h-2',
  cloud: 'M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8.5a4.8 4.8 0 0 1-.5 9.5zM9 21l1-2M13 21l1-2',
  doc: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  send: 'M4 12l16-8-6 16-2.5-6.5z',
  speaker: 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
  stop: 'M7 7h10v10H7z',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1',
  locate: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3',
  close: 'M6 6l12 12M18 6L6 18',
  chevron: 'M9 6l6 6-6 6',
  play: 'M8 5v14l11-7z',
  pause: 'M8 5v14M16 5v14',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  alert: 'M12 3l10 18H2zM12 10v5M12 18v.5',
  swap: 'M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3',
} as const;
export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color = C.ink, strokeWidth = 2 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={ICONS[name]} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill={name === 'play' ? color : 'none'} />
    </Svg>
  );
}

// share = how much of the body is under water, from the feet up
export function Person({ share, size = 62 }: { share: number; size?: number }) {
  const y = 62 - 58 * share;
  return (
    <Svg width={(size * 44) / 62} height={size} viewBox="0 0 44 62">
      <G fill={C.ink}>
        <Circle cx={22} cy={9} r={6} />
        <Rect x={14} y={17} width={16} height={22} rx={6} />
        <Rect x={15} y={34} width={6} height={26} rx={3} />
        <Rect x={23} y={34} width={6} height={26} rx={3} />
      </G>
      <Rect x={0} y={y} width={44} height={62 - y} fill={C.cel} opacity={0.55} />
      <Path d={`M0 ${y} q5.5 -3 11 0 t11 0 t11 0 t11 0`} stroke={C.celDeep} strokeWidth={2} fill="none" />
    </Svg>
  );
}

export function Bucket({ share, size = 84 }: { share: number; size?: number }) {
  const id = useSvgId(), y = 78 - 64 * share;
  return (
    <Svg width={(size * 70) / 84} height={size} viewBox="0 0 70 84" accessibilityLabel={`Balde lleno al ${Math.round(share * 100)} por ciento`}>
      <Defs>
        <ClipPath id={id}>
          <Path d="M8 14h54l-6 64H14z" />
        </ClipPath>
      </Defs>
      <Path d="M8 14h54l-6 64H14z" fill="#fff" />
      <G clipPath={`url(#${id})`}>
        <Path d={`M0 ${y} q8.75 -5 17.5 0t17.5 0t17.5 0t17.5 0V84H0z`} fill={C.cel} />
      </G>
      <Path d="M8 14h54l-6 64H14z" fill="none" stroke={C.navy} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M12 14C14 2 56 2 58 14" fill="none" stroke={C.navy} strokeWidth={2.5} />
      <SvgText x={35} y={62} textAnchor="middle" fontWeight="800" fontSize={15} fill="#fff">
        {Math.round(share * 100)}%
      </SvgText>
    </Svg>
  );
}

// Cerro Santa Ana, the Guayas river and Tamy waving, for the welcome screen
export function WelcomeArt({ width = 300 }: { width?: number }) {
  return (
    <Svg width={width} height={(width * 250) / 264} viewBox="0 0 264 250">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7CC6EC" />
          <Stop offset="1" stopColor="#E6F4FB" />
        </LinearGradient>
      </Defs>
      <Rect width={264} height={250} fill="url(#sky)" />
      <G fill="#fff">
        <Ellipse cx={176} cy={70} rx={40} ry={22} />
        <Ellipse cx={146} cy={78} rx={27} ry={17} />
        <Ellipse cx={208} cy={80} rx={28} ry={15} />
      </G>
      <Ellipse cx={178} cy={90} rx={60} ry={7} fill="#D3E7F2" />
      <Path d="M140 102l-5 13M156 100l-5 13M172 104l-5 13M188 100l-5 13M204 103l-5 13M220 99l-5 13M148 120l-4 10M180 121l-4 10M212 120l-4 10" stroke={C.celDeep} strokeWidth={2.6} strokeLinecap="round" />
      <Path d="M0 196C24 150 62 118 102 112c28-4 50 22 74 66v40H0z" fill="#BFDDB4" />
      <G stroke={C.ink} strokeWidth={1.2}>
        <Rect x={16} y={178} width={17} height={15} fill="#F6C343" />
        <Rect x={36} y={164} width={16} height={15} fill="#E8746A" />
        <Rect x={54} y={150} width={17} height={15} fill="#5BB6E4" />
        <Rect x={72} y={136} width={16} height={15} fill="#F29C5A" />
        <Rect x={118} y={134} width={17} height={15} fill="#9AD18B" />
        <Rect x={137} y={148} width={16} height={15} fill="#F6C343" />
        <Rect x={154} y={163} width={16} height={15} fill="#E8746A" />
        <Path d="M14 178l10.5-8 10.5 8M34 164l10-8 10 8M52 150l10.5-8 10.5 8M70 136l10-8 10 8M116 134l10.5-8 10.5 8M135 148l10-8 10 8M152 163l10-8 10 8" fill="#C4553F" />
        <Rect x={96} y={76} width={12} height={38} fill="#fff" />
        <Path d="M93 76h18l-3-8h-12z" fill={C.celDeep} />
        <Rect x={99} y={64} width={6} height={4} fill="#F6C343" />
      </G>
      <Path d="M96 90h12M96 102h12" stroke={C.cel} strokeWidth={2.5} />
      <Rect y={206} width={264} height={44} fill={C.cel} />
      <Path d="M8 220c8-4 16-4 24 0s16 4 24 0M80 232c8-4 16-4 24 0s16 4 24 0M150 218c8-4 16-4 24 0M20 242c8-4 16-4 24 0" stroke="#9BD5F2" strokeWidth={2} fill="none" strokeLinecap="round" />
      <G transform="translate(176 128) scale(1.35)">
        <Ellipse cx={26} cy={64} rx={18} ry={4} fill={C.celDeep} opacity={0.35} />
        <Path d="M26 2C26 2 6 24 6 38a20 20 0 0 0 40 0C46 24 26 2 26 2z" fill="#fff" stroke={C.ink} strokeWidth={1.6} />
        <Path d="M15 26c2-4.5 4.5-8 7-10.5" stroke="#BFE3F5" strokeWidth={3} fill="none" strokeLinecap="round" />
        <Circle cx={19.5} cy={38} r={2.6} fill={C.ink} />
        <Circle cx={32.5} cy={38} r={2.6} fill={C.ink} />
        <Circle cx={15} cy={44} r={2.8} fill="#F6A6A0" opacity={0.8} />
        <Circle cx={37} cy={44} r={2.8} fill="#F6A6A0" opacity={0.8} />
        <Path d="M21 45q5 4.2 10 0" stroke={C.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d="M45 30c5-3 7-8 6-12" stroke={C.ink} strokeWidth={2} fill="none" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

// placeholder for the report photo until the person takes a real one
export function FloodArt({ width = 300 }: { width?: number }) {
  return (
    <Svg width={width} height={(width * 170) / 236} viewBox="0 0 236 170">
      <Rect width={236} height={170} fill="#9FB6C4" />
      <Rect x={0} y={20} width={70} height={110} fill="#E9DCC3" />
      <Rect x={74} y={40} width={60} height={90} fill="#F2C9A1" />
      <Rect x={138} y={10} width={98} height={120} fill="#D9E2E7" />
      <G fill="#5F7A8A">
        {[[12, 36], [40, 36], [12, 66], [40, 66], [152, 28], [180, 28], [208, 28], [152, 62], [180, 62]].map(([x, y]) => (
          <Rect key={`${x}-${y}`} x={x} y={y} width={14} height={16} />
        ))}
        <Rect x={86} y={54} width={12} height={14} />
        <Rect x={108} y={54} width={12} height={14} />
      </G>
      <Rect x={96} y={92} width={18} height={38} fill="#7A5A44" />
      <Rect x={0} y={108} width={236} height={62} fill="#6E8C7A" opacity={0.85} />
      <Path d="M10 124c10-4 20-4 30 0M70 140c10-4 20-4 30 0M140 122c10-4 20-4 30 0M180 150c10-4 20-4 30 0M30 158c10-4 20-4 30 0" stroke="#B9CDBF" strokeWidth={2} fill="none" strokeLinecap="round" />
      <Rect x={150} y={96} width={60} height={18} rx={6} fill="#C0392B" />
      <Rect x={160} y={88} width={38} height={12} rx={4} fill="#E06666" />
    </Svg>
  );
}
