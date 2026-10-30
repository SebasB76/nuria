import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { tideRising, tideTurns } from '@/data/risk';
import { atHour, hourOf, hShort } from '@/data/time';
import { nowIndex, Tide } from '@/data/weather';
import { C, F } from './theme';

export function tideSentence(tide: Tide) {
  const i = nowIndex(tide.time);
  const turns = tideTurns(tide).filter((x) => x.k - i < 25);
  const hi = turns.find((x) => x.high), lo = turns.find((x) => !x.high);
  const parts = [hi, lo].filter(Boolean).sort((a, b) => a!.k - b!.k);
  return parts.map((x, j) => (j ? 'y ' : 'Estará ') + (x!.high ? 'alto ' : 'bajo ') + atHour(x!.t)).join(' ') + '.';
}

export function TideChart({ tide }: { tide: Tide }) {
  const [W, setW] = useState(320);
  const H = 84;
  const v = tide.sea_level_height_msl, i = nowIndex(tide.time), n = Math.min(25, v.length - i);
  const vals = v.slice(i, i + n), mn = Math.min(...vals), mx = Math.max(...vals);
  const x = (k: number) => 8 + (k * (W - 16)) / (n - 1);
  const y = (val: number) => 22 + (1 - (val - mn) / (mx - mn || 1)) * (H - 40);
  const path = vals.map((val, k) => (k ? 'L' : 'M') + x(k).toFixed(1) + ',' + y(val).toFixed(1)).join('');
  const turns = tideTurns(tide).filter((t) => t.k - i < n);
  const rising = tideRising(tide);
  const clampX = (val: number) => Math.max(30, Math.min(W - 30, val));

  return (
    <View>
      <Text style={styles.now}>
        Ahora el río está <Text style={{ fontFamily: F.black }}>{rising ? 'subiendo ↑' : 'bajando ↓'}</Text>.
      </Text>
      <Text style={styles.txt}>{tideSentence(tide)} Cuando el río está alto, se tapan las salidas de los desagües y el agua de la calle tarda más en irse.</Text>
      <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={{ marginTop: 6 }}>
        <Svg width={W} height={H} accessibilityLabel="Subida y bajada del río en las próximas 24 horas">
          <Path d={path} fill="none" stroke={C.tide} strokeWidth={2.5} strokeLinejoin="round" />
          <Circle cx={x(0)} cy={y(vals[0])} r={5} fill={C.ink} stroke="#fff" strokeWidth={2} />
          <SvgText x={x(0) + 4} y={y(vals[0]) + (rising ? 18 : -9)} fontSize={11} fill={C.ink2}>
            ahora
          </SvgText>
          {turns.map((t) => {
            const k = t.k - i;
            return [
              <Circle key={'c' + t.k} cx={x(k)} cy={y(v[t.k])} r={4} fill={C.tide} stroke="#fff" strokeWidth={2} />,
              <SvgText key={'t' + t.k} x={clampX(x(k))} y={t.high ? y(v[t.k]) - 9 : y(v[t.k]) + 18} fontSize={11} fill={C.ink2} textAnchor="middle">
                {(t.high ? 'alto ' : 'bajo ') + hShort(hourOf(t.t))}
              </SvgText>,
            ];
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  now: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  txt: { fontFamily: F.body, fontSize: 13.5, lineHeight: 19, color: C.ink2, marginTop: 4 },
});
