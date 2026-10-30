import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { compareTag, Departure, NamedPoint, routeReasons, routeTip } from '@/data/route';
import { LeafletMap } from '@/map/LeafletMap';
import { abMarks, reportMarks, routeLines } from '@/map/scenes';
import { MapEvent, MapScene } from '@/map/types';
import { useApp } from '@/state/AppState';
import { locateMe } from '@/state/location';
import { ScenarioBanner } from '@/ui/common';
import { Icon, NuriaAvatar } from '@/ui/icons';
import { Card, Header, Screen, Segmented, T, NuriaTip } from '@/ui/kit';
import { PlaceSheet } from '@/ui/Sheets';
import { C, F } from '@/ui/theme';
import { useToast } from '@/ui/Toast';
import { PressableScale } from '@/ui/PressableScale';

type End = 'from' | 'to';
const WHEN: { label: string; value: Departure }[] = [
  { label: 'Ahora', value: 0 },
  { label: 'En 1 h', value: 1 },
  { label: 'En 2 h', value: 2 },
  { label: 'Mejor hora', value: 'best' },
];

export default function RouteScreen() {
  const app = useApp();
  const toast = useToast();
  const { routeReq: req, routePlan: plan, routeStatus: status } = app;
  const [sheet, setSheet] = useState<End | null>(null);
  const [picking, setPicking] = useState<End | null>(null);
  // the selected card belongs to one plan; a new plan starts again on the recommended route
  const [picked, setPicked] = useState<{ plan: typeof plan; i: number }>({ plan: null, i: 0 });
  const sel = picked.plan === plan ? picked.i : 0;
  const setSel = (i: number) => {
    if (i !== sel) Haptics.selectionAsync().catch(() => {});
    setPicked({ plan, i });
  };

  useEffect(() => {
    if (!plan && status === 'idle') app.runRoute();
    // only on first visit; later runs come from user actions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scene: MapScene = useMemo(
    () => ({
      routes: routeLines(plan, sel),
      marks: abMarks(plan),
      reports: reportMarks(app.reports, plan ? plan.list.flatMap((x) => x.a.hits) : []),
      picking: !!picking,
      view: plan ? { points: plan.list.flatMap((x) => x.r.coords.map((p) => [p.lat, p.lon] as [number, number])), pad: 34, key: `${plan.from.id}-${plan.to.id}-${plan.off}` } : undefined,
    }),
    [plan, sel, app.reports, picking],
  );

  const setEnd = (end: End, p: NamedPoint) => {
    app.addCustomPoint(p);
    app.runRoute({ [end]: p });
  };
  const onEvent = (e: MapEvent) => {
    if (e.type === 'route') setSel(e.i);
    if (e.type === 'pick' && picking) {
      setEnd(picking, { id: 'pick:' + picking, name: picking === 'from' ? '📍 Salida en el mapa' : '📍 Destino en el mapa', lat: e.lat, lon: e.lon });
      setPicking(null);
    }
  };
  const locate = async (end: End) => {
    const r = await locateMe();
    if ('error' in r) toast(r.error);
    else setEnd(end, r.point);
  };

  return (
    <Screen>
      <Header title="Ruta segura" />
      {app.prefs.scenario === 'storm' && <ScenarioBanner />}
      <Card style={{ gap: 2, paddingVertical: 6 }}>
        <EndRow badge="A" label="Sales de" name={req.from.name} onPress={() => setSheet('from')} />
        <View style={styles.sep}>
          <PressableScale onPress={() => app.runRoute({ from: req.to, to: req.from })} style={styles.swap} hitSlop={8} accessibilityLabel="Invertir salida y destino">
            <Icon name="swap" size={16} color={C.navy} />
          </PressableScale>
        </View>
        <EndRow badge="B" label="Vas a" name={req.to.name} onPress={() => setSheet('to')} />
      </Card>
      <Segmented options={WHEN} value={req.offSel} onChange={(v) => app.runRoute({ offSel: v })} />

      <View style={styles.mapWrap}>
        <LeafletMap scene={scene} onEvent={onEvent} style={{ flex: 1 }} />
        {picking && (
          <View style={styles.hint}>
            <Text style={styles.hintText}>{picking === 'from' ? 'Toca el mapa donde sales' : 'Toca el mapa a donde vas'}</Text>
            <Pressable onPress={() => setPicking(null)} hitSlop={10}>
              <Icon name="close" size={16} color="#fff" />
            </Pressable>
          </View>
        )}
      </View>

      {status === 'loading' && <T kind="soft">Buscando el camino con menos agua…</T>}
      {status === 'error' && <T kind="soft">No pudimos calcular la ruta ahora. Revisa tu conexión e intenta de nuevo.</T>}
      {status === 'same' && <T kind="soft">Elige un destino distinto de la salida.</T>}

      {plan && status !== 'same' && (
        <>
          <NuriaTip avatar={<NuriaAvatar size={30} />}>
            <Text style={styles.tip}>
              <Text style={{ fontFamily: F.black, color: '#BFE3F5' }}>Nuria: </Text>
              {routeTip(plan)}
            </Text>
          </NuriaTip>
          {plan.list.map((x, i) => (
            <PressableScale key={i} onPress={() => setSel(i)} style={[styles.rc, i === 0 && styles.rcBest, i === sel && styles.rcOn]}>
              <View style={styles.rh}>
                <View style={[styles.line, { backgroundColor: i === 0 ? '#2fd3c6' : '#8a96a0' }]} />
                <Text style={styles.rTitle}>{i === 0 ? 'Ruta recomendada' : 'Alternativa ' + i}</Text>
                <Text style={[styles.badge, i === 0 && { backgroundColor: '#D7F1E0', color: '#1D6B3B' }]}>{i === 0 ? 'Más segura' : compareTag(x, plan.list[0])}</Text>
              </View>
              <Text style={styles.via}>
                {x.r.name ? 'Por ' + x.r.name : 'Por la ruta marcada'} · ~{Math.round(x.r.dur / 60)} min · {(x.r.dist / 1000).toFixed(1).replace('.', ',')} km
              </Text>
              <View style={{ gap: 4, marginTop: 6 }}>
                {routeReasons(x).map(([ic, t]) => (
                  <Text key={t} style={styles.reason}>
                    {ic} {t}
                  </Text>
                ))}
              </View>
            </PressableScale>
          ))}
          <T kind="fine">Los minutos no incluyen el tráfico. Nunca cruces una calle con agua que corre.</T>
        </>
      )}

      <PlaceSheet
        visible={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet === 'from' ? '¿De dónde sales?' : '¿A dónde vas?'}
        value={sheet === 'from' ? req.from.id : req.to.id}
        onPick={(p) => sheet && app.runRoute({ [sheet]: p })}
        onLocate={() => sheet && locate(sheet)}
        onPickOnMap={() => setPicking(sheet)}
      />
    </Screen>
  );
}

function EndRow({ badge, label, name, onPress }: { badge: string; label: string; name: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} style={styles.end}>
      <View style={[styles.ab, badge === 'A' ? { backgroundColor: '#fff', borderWidth: 2, borderColor: C.ink } : { backgroundColor: '#2fd3c6' }]}>
        <Text style={styles.abText}>{badge}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.endLabel}>{label}</Text>
        <Text style={styles.endName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <Icon name="chevron" size={18} color={C.ink2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  end: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  ab: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  abText: { fontFamily: F.black, fontSize: 13, color: C.ink },
  endLabel: { fontFamily: F.medium, fontSize: 12, color: C.ink2 },
  endName: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  sep: { height: 1, backgroundColor: C.line, marginLeft: 40, justifyContent: 'center' },
  swap: { position: 'absolute', right: 30, width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  mapWrap: { height: 300, borderRadius: 20, overflow: 'hidden' },
  hint: { position: 'absolute', top: 10, left: 10, right: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.navy, borderRadius: 12, padding: 10 },
  hintText: { fontFamily: F.bold, fontSize: 14, color: '#fff' },
  tip: { fontFamily: F.body, fontSize: 14.5, lineHeight: 20, color: '#fff' },
  rc: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 16, padding: 12 },
  rcBest: { borderColor: '#A9D9B7', backgroundColor: '#F1FAF3' },
  rcOn: { borderColor: C.navy, borderWidth: 2 },
  rh: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  line: { width: 20, height: 5, borderRadius: 3 },
  rTitle: { fontFamily: F.black, fontSize: 15, color: C.ink, flex: 1 },
  badge: { fontFamily: F.bold, fontSize: 12, color: C.ink2, backgroundColor: '#F1ECE2', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8, overflow: 'hidden' },
  via: { fontFamily: F.medium, fontSize: 13, color: C.ink2, marginTop: 4 },
  reason: { fontFamily: F.body, fontSize: 14, lineHeight: 19, color: C.ink },
});
