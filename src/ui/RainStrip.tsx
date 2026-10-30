import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { rainCat } from '@/data/places';
import { windows } from '@/data/risk';
import { hourOf, hShort } from '@/data/time';
import { Hourly, nowIndex, Tide } from '@/data/weather';
import { C, F } from './theme';

const HEIGHTS = [8, 28, 52, 76, 100];

// one bar per hour, height by rain category; the bar text tooltip replaces hover on a phone
export function RainStrip({ h, tide, hours = 15, compact, marks = true }: { h: Hourly; tide: Tide; hours?: number; compact?: boolean; marks?: boolean }) {
  const i = nowIndex(h.time), n = Math.min(hours, h.time.length - i);
  const cols = Array.from({ length: n }, (_, k) => ({ t: h.time[i + k], mm: h.precipitation[i + k], p: h.precipitation_probability[i + k] }));
  const { best, worst } = windows(h, tide);
  const [sel, setSel] = useState<number | null>(null);
  const showWorst = worst && rainCat(worst.peak).n >= 2 && worst.k - i < n;
  const s = sel != null ? cols[sel] : null;

  return (
    <View>
      <View style={[styles.bars, { height: compact ? 40 : 56 }]} accessibilityLabel={`Lluvia esperada en las próximas ${n} horas`}>
        {cols.map((c, k) => {
          const cat = rainCat(c.mm);
          return (
            <Pressable key={c.t} onPress={() => setSel(sel === k ? null : k)} style={styles.barHit} hitSlop={4}>
              <View style={[styles.bar, { height: `${HEIGHTS[cat.n]}%`, backgroundColor: cat.n ? C.cel : '#E7E1D6' }, sel === k && styles.barSel]} />
            </Pressable>
          );
        })}
      </View>
      {marks && (
        <View style={styles.marks}>
          {best && best.k - i < n && <Mark k={best.k - i} n={n} label="sal" color={C.tranquilo} ink="#1D6B3B" />}
          {showWorst && <Mark k={worst!.k - i} n={n} label="evita" color={C.cuidado} ink="#A64A14" />}
        </View>
      )}
      <View style={styles.hours}>
        {cols
          .filter((_, k) => k % 3 === 0)
          .map((c, k) => (
            <Text key={c.t} style={styles.hour}>
              {k === 0 ? 'ahora' : hShort(hourOf(c.t))}
            </Text>
          ))}
      </View>
      <Text style={styles.key}>
        {s ? (
          <>
            {hShort(hourOf(s.t))} · <Text style={{ fontFamily: F.bold, color: C.ink }}>{rainCat(s.mm).word}</Text>
            {s.p != null ? ` · ${s.p} % de probabilidad` : ''}
          </>
        ) : (
          'Barra más alta = lluvia más fuerte. Toca una barra para ver la hora.'
        )}
      </Text>
    </View>
  );
}

function Mark({ k, n, label, color, ink }: { k: number; n: number; label: string; color: string; ink: string }) {
  const w = Math.min(2, n - k);
  return (
    <View style={[styles.mark, { left: `${(k / n) * 100}%`, width: `${(w / n) * 100}%`, borderTopColor: color }]}>
      <Text style={[styles.markText, { color: ink }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barHit: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 },
  barSel: { backgroundColor: C.navy },
  marks: { height: 18, marginTop: 4 },
  mark: { position: 'absolute', top: 0, borderTopWidth: 3, paddingTop: 1, alignItems: 'center' },
  markText: { fontFamily: F.black, fontSize: 10.5 },
  hours: { flexDirection: 'row', marginTop: 2 },
  hour: { flex: 1, fontFamily: F.medium, fontSize: 11, color: C.muted },
  key: { fontFamily: F.body, fontSize: 12, color: C.ink2, marginTop: 6 },
});
