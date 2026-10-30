import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DAD_DESTINATION, Member, PRIVACY_TEXT, Privacy, STATUS } from '@/data/family';
import { sectorById } from '@/data/places';
import { LeafletMap } from '@/map/LeafletMap';
import { familyMarks, hiddenMember, reportMarks } from '@/map/scenes';
import { MapEvent, MapScene } from '@/map/types';
import { useApp } from '@/state/AppState';
import { useFamily } from '@/state/FamilyState';
import { Drop, Icon } from '@/ui/icons';
import { Button, Card, Chip, Header, Screen, Segmented, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';
import { useToast } from '@/ui/Toast';

const PRIVACY: { label: string; value: Privacy }[] = [
  { label: 'Siempre', value: 'always' },
  { label: 'Solo emergencia', value: 'emergency' },
  { label: 'Pausado', value: 'paused' },
];

export default function FamilyScreen() {
  const app = useApp();
  const fam = useFamily();
  const toast = useToast();
  const [focus, setFocus] = useState<{ id: string; at: number } | null>(null);
  const ok = fam.members.filter((m) => m.status === 'ok').length, total = fam.members.length;
  const help = fam.members.find((m) => m.status === 'help');

  const scene: MapScene = useMemo(() => {
    const focused = focus && fam.members.find((m) => m.id === focus.id);
    const view: MapScene['view'] = focused
      ? { points: [[focused.lat, focused.lon]], zoom: 15, key: focused.id + focus.at }
      : { points: [...fam.members.map((m) => [m.lat, m.lon] as [number, number]), [DAD_DESTINATION.lat, DAD_DESTINATION.lon]], pad: 40, key: 'all' };
    return { family: familyMarks(fam.members, fam.privacy), reports: reportMarks(app.reports), view };
  }, [fam.members, fam.privacy, app.reports, focus]);

  const see = (id: string) => setFocus({ id, at: Date.now() });
  const call = (m: Member) => toast(`En el prototipo no hacemos llamadas reales. Aquí se llamaría a ${m.rel}.`);
  const routeTo = (m: Member) => {
    app.runRoute({ from: app.routeReq.from, to: { id: 'fam:' + m.id, name: '📍 Donde está ' + m.rel, lat: m.lat, lon: m.lon } });
    router.navigate('/route');
  };

  return (
    <Screen>
      <Header
        title="Tu familia"
        right={<Chip label={`${ok} de ${total} bien`} style={{ backgroundColor: help ? '#FBDADA' : ok === total ? '#E3F3E8' : '#FFF3D3', borderColor: 'transparent' }} />}
      />

      {fam.sos && (
        <View style={styles.sos}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.sosTitle}>🚨 {fam.sos.rel} pidió ayuda</Text>
            <Pressable onPress={fam.clearSos} hitSlop={10} accessibilityLabel="Cerrar aviso">
              <Icon name="close" size={20} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.sosSub}>
            {sectorById(fam.zoneOf(fam.sos).sectorId).name}
            {fam.zoneOf(fam.sos).wet ? ' · cerca de agua reportada' : ''} · hace un momento
          </Text>
          <View style={{ gap: 8, marginTop: 10 }}>
            <Button kind="light" icon="phone" label={`Llamar a ${fam.sos.rel}`} onPress={() => call(fam.sos!)} />
            <Button kind="light" label="🚑 Llamar al 911" onPress={() => toast('En una emergencia real, este botón marca al 911.')} />
            <Button kind="light" icon="route" label={`Ruta segura hasta ${fam.sos.rel}`} onPress={() => routeTo(fam.sos!)} />
          </View>
        </View>
      )}

      <View style={styles.mapWrap}>
        <LeafletMap scene={scene} onEvent={(e: MapEvent) => e.type === 'member' && see(e.id)} style={{ flex: 1 }} />
      </View>

      {fam.members.map((m) => {
        const z = fam.zoneOf(m), s = sectorById(z.sectorId), l = app.risk[s.id].level, st = STATUS[m.status], hidden = hiddenMember(m, fam.privacy);
        const seen = m.me ? 'Tú' : m.status === 'ok' ? `Confirmó ${m.okAgo ? 'hace ' + m.okAgo + ' min' : 'ahora'}` : m.status === 'help' ? 'Pidió ayuda hace un momento' : 'No ha confirmado';
        return (
          <Card key={m.id} style={[styles.row, m.status === 'unknown' && styles.rowWarn, m.status === 'help' && styles.rowHelp]}>
            <View style={[styles.av, { backgroundColor: m.color }]}>
              <Text style={styles.avText}>{m.initials}</Text>
              <View style={[styles.avBadge, { backgroundColor: st.color }]}>
                <Text style={styles.avBadgeText}>{m.status === 'ok' ? '✓' : m.status === 'help' ? '!' : '?'}</Text>
              </View>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name}>
                {m.rel} · <Text style={{ color: st.color === '#F2B01E' ? '#8A6200' : st.color }}>{st.text.toLowerCase()}</Text>
              </Text>
              {hidden ? (
                <Text style={styles.meta}>{fam.privacy === 'paused' ? 'Ubicación pausada' : 'Solo se comparte en una emergencia'}</Text>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <Text style={styles.meta}>{m.moving ? '🚗 En camino · ' : m.note ? m.note + ' · ' : ''}{s.name}</Text>
                  <Drop level={l} size={14} />
                  <Text style={styles.meta}>{l.name}</Text>
                </View>
              )}
              {z.wet && !hidden && <Text style={styles.wet}>⚠️ Cerca de agua reportada: {z.wet.text.toLowerCase()}</Text>}
              <Text style={styles.fine}>
                {seen} · 🔋 {m.battery} %
              </Text>
            </View>
            <View style={{ gap: 6 }}>
              {!m.me && (
                <Pressable style={styles.act} onPress={() => call(m)} accessibilityLabel={`Llamar a ${m.rel}`}>
                  <Icon name="phone" size={16} color={C.navy} />
                </Pressable>
              )}
              {!hidden && (
                <Pressable style={styles.act} onPress={() => see(m.id)} accessibilityLabel={`Ver a ${m.rel} en el mapa`}>
                  <Icon name="pin" size={16} color={C.navy} />
                </Pressable>
              )}
            </View>
          </Card>
        );
      })}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          label="¿Están bien?"
          icon="bell"
          style={{ flex: 1 }}
          onPress={() => {
            fam.askFamily();
            toast('Nuria le preguntó a tu familia si está bien.');
          }}
        />
        <Button
          kind="light"
          label="Estoy bien"
          icon="check"
          style={{ flex: 1 }}
          onPress={() => {
            fam.setStatus('me', 'ok');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            toast('Listo: tu familia ya sabe que estás bien.');
          }}
        />
      </View>

      <Card style={{ gap: 8 }}>
        <T kind="bold">¿Quién ve dónde estás?</T>
        <Segmented options={PRIVACY} value={fam.privacy} onChange={fam.setPrivacy} />
        <T kind="soft">{PRIVACY_TEXT[fam.privacy]}</T>
      </Card>

      <Pressable
        onPress={() => {
          fam.triggerSos('dad');
          see('dad');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        }}>
        <T kind="fine">Demo: simular que Papá pide ayuda</T>
      </Pressable>
      <T kind="fine">La familia de esta pantalla es de ejemplo. Papá se mueve por calles reales de Guayaquil.</T>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sos: { backgroundColor: C.peligro, borderRadius: 20, padding: 14 },
  sosTitle: { fontFamily: F.display, fontSize: 21, color: '#fff' },
  sosSub: { fontFamily: F.medium, fontSize: 14, color: '#FFE3E3', marginTop: 2 },
  mapWrap: { height: 260, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12 },
  rowWarn: { borderColor: '#F1CF74', backgroundColor: '#FFFBEF' },
  rowHelp: { borderColor: '#EFA2A2', backgroundColor: '#FFF5F5' },
  av: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avText: { fontFamily: F.black, fontSize: 15, color: '#fff' },
  avBadge: { position: 'absolute', right: -3, bottom: -3, width: 19, height: 19, borderRadius: 10, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avBadgeText: { fontFamily: F.black, fontSize: 10, color: '#fff' },
  name: { fontFamily: F.bold, fontSize: 15.5, color: C.ink },
  meta: { fontFamily: F.body, fontSize: 13, color: C.ink2 },
  wet: { fontFamily: F.bold, fontSize: 12.5, color: '#A64A14' },
  fine: { fontFamily: F.body, fontSize: 12, color: C.muted },
  act: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.celSoft, alignItems: 'center', justifyContent: 'center' },
});
