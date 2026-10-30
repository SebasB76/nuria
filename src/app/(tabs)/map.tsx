import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { dist, LEVELS, PLACES, sectorById } from '@/data/places';
import { headline } from '@/data/risk';
import { LeafletMap } from '@/map/LeafletMap';
import { cityView, reportMarks, sectorMarks } from '@/map/scenes';
import { MapEvent, MapScene } from '@/map/types';
import { useApp } from '@/state/AppState';
import { Drop, Icon } from '@/ui/icons';
import { Chip } from '@/ui/kit';
import { C, F } from '@/ui/theme';

type Layer = 'clouds' | 'sectors' | 'reports';
const LAYER_LABEL: Record<Layer, string> = { clouds: '☁️ Nubes', sectors: '💧 Barrios', reports: '📣 Reportes' };

export default function MapScreen() {
  const app = useApp();
  const insets = useSafeAreaInsets();
  const [layers, setLayers] = useState<Record<Layer, boolean>>({ clouds: true, sectors: true, reports: true });
  const [playing, setPlaying] = useState(true);
  const [cloudLabel, setCloudLabel] = useState('Cargando la foto del satélite…');
  const [view, setView] = useState<MapScene['view']>(cityView());
  const [sheetH, setSheetH] = useState(240);
  const s = sectorById(app.focusId), l = app.risk[s.id].level;
  const nearReports = app.reports.filter((r) => dist(r, s) < 1800).length;

  const scene: MapScene = useMemo(
    () => ({
      sectors: layers.sectors ? sectorMarks(app.risk, app.focusId) : [],
      reports: layers.reports ? reportMarks(app.reports) : [],
      clouds: layers.clouds,
      cloudsPlaying: playing,
      view,
    }),
    [layers, playing, app.risk, app.focusId, app.reports, view],
  );

  const onEvent = (e: MapEvent) => {
    if (e.type === 'sector') app.setFocusId(e.id);
    if (e.type === 'clouds') setCloudLabel(e.label);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1b2229' }}>
      <LeafletMap scene={scene} onEvent={onEvent} style={StyleSheet.absoluteFill} />

      <View style={[styles.top, { top: insets.top + 8 }]} pointerEvents="box-none">
        {layers.clouds && (
          <Pressable style={styles.float} onPress={() => setPlaying(!playing)} accessibilityLabel={playing ? 'Pausar las nubes' : 'Ver cómo se mueven las nubes'}>
            <Icon name={playing ? 'pause' : 'play'} size={14} color={C.ink} strokeWidth={2.6} />
            <Text style={styles.floatText}>{cloudLabel}</Text>
          </Pressable>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {(Object.keys(LAYER_LABEL) as Layer[]).map((k) => (
            <Chip key={k} label={LAYER_LABEL[k]} on={layers[k]} onPress={() => setLayers({ ...layers, [k]: !layers[k] })} />
          ))}
          <Chip label="🏙️ Toda la ciudad" onPress={() => setView(cityView('city' + Date.now()))} />
        </ScrollView>
      </View>

      <Pressable style={[styles.fab, { bottom: sheetH + 18 }]} onPress={() => router.push('/report')} accessibilityLabel="Reportar mi calle">
        <Icon name="camera" size={20} color="#fff" />
        <Text style={styles.fabText}>Reportar</Text>
      </Pressable>

      <View style={styles.sheet} onLayout={(e) => setSheetH(e.nativeEvent.layout.height)}>
        <View style={styles.grab} />
        <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} onPress={() => setView({ points: [[s.lat, s.lon]], zoom: 14, key: s.id + Date.now() })}>
          <Drop level={l} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sheetTitle}>
              {s.name} · {l.name}
            </Text>
            <Text style={styles.sheetSub}>{headline(app.hourly[s.id], app.tide)}</Text>
            <Text style={styles.sheetSub}>{nearReports ? `📣 ${nearReports} ${nearReports === 1 ? 'reporte' : 'reportes'} de vecinos cerca hoy.` : 'Nadie ha reportado agua cerca hoy.'}</Text>
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Chip label="Ver su día" onPress={() => router.navigate('/')} style={{ flex: 1, justifyContent: 'center' }} />
          <Chip
            label="Ruta desde aquí"
            onPress={() => {
              app.runRoute({ from: PLACES.find((p) => p.id === 's:' + s.id)! });
              router.navigate('/route');
            }}
            style={{ flex: 1, justifyContent: 'center' }}
          />
        </View>
        <View style={styles.legend}>
          {LEVELS.map((lv) => (
            <View key={lv.key} style={styles.legendItem}>
              <Drop level={lv} size={20} />
              <Text style={styles.legendText}>{lv.name}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>La gota más llena = más riesgo de que se inunde la calle. Lo blanco que se mueve son nubes de verdad, vistas por el satélite.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 12, right: 12, gap: 8 },
  float: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 10, elevation: 4, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8 },
  floatText: { fontFamily: F.bold, fontSize: 12.5, color: C.ink },
  fab: { position: 'absolute', right: 14, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.navy, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 15, elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 },
  fabText: { fontFamily: F.bold, fontSize: 14, color: '#fff' },
  sheet: { position: 'absolute', left: 8, right: 8, bottom: 8, backgroundColor: '#fff', borderRadius: 22, padding: 14, paddingTop: 8, elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 14 },
  grab: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#DDD5C7', alignSelf: 'center', marginBottom: 10 },
  sheetTitle: { fontFamily: F.display, fontSize: 19, color: C.ink },
  sheetSub: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.ink2 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EFE8DC' },
  legendItem: { alignItems: 'center', gap: 2, flex: 1 },
  legendText: { fontFamily: F.bold, fontSize: 11, color: C.ink2 },
  note: { fontFamily: F.body, fontSize: 11.5, lineHeight: 15, color: C.muted, marginTop: 8, textAlign: 'center' },
});
