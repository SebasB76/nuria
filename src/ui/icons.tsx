import { Image } from 'expo-image';
import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { Level } from '@/data/places';
import { C } from './theme';

const useSvgId = () => 'i' + useId().replace(/[^a-zA-Z0-9]/g, '');
const AVATAR = require('@/assets/images/nuria-avatar.jpg');
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

// the bird illustration, cropped to the head so the eye still reads at tab-bar size
export function NuriaAvatar({ size = 40 }: { size?: number }) {
  return <Image source={AVATAR} style={{ width: size, height: size, borderRadius: size / 2 }} accessibilityLabel="Nuria" />;
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
  search: 'M10.5 4a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM15.5 15.5L20 20',
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
