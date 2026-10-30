import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Depth, nearestSector, Point, REPORT_KINDS, ReportKind, sectorById } from '@/data/places';
import { useApp } from '@/state/AppState';
import { locateMe } from '@/state/location';
import { FloodArt, Icon, Person } from '@/ui/icons';
import { Button, Header, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';
import { useToast } from '@/ui/Toast';
import { PressableScale } from '@/ui/PressableScale';

const DEPTHS: { d: Depth; share: number }[] = [
  { d: 'Tobillo', share: 0.12 },
  { d: 'Rodilla', share: 0.34 },
  { d: 'Cintura', share: 0.55 },
];

export default function ReportScreen() {
  const app = useApp();
  const toast = useToast();
  const { width } = useWindowDimensions();
  const [photo, setPhoto] = useState<string | undefined>();
  const [kind, setKind] = useState<ReportKind>('water');
  const [depth, setDepth] = useState<Depth>('Rodilla');
  const focus = sectorById(app.focusId);
  // without GPS, the report lands a block away from the barrio center instead of on top of its drop
  const [where, setWhere] = useState<Point & { real: boolean }>({ lat: focus.lat + 0.0015, lon: focus.lon + 0.0015, real: false });

  useEffect(() => {
    locateMe().then((r) => 'point' in r && setWhere({ ...r.point, real: true }));
  }, []);

  const takePhoto = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return toast('Sin permiso para usar la cámara. Puedes reportar sin foto.');
    const r = camera ? await ImagePicker.launchCameraAsync({ quality: 0.5 }) : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, mediaTypes: ['images'] });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const pick = (fn: () => void) => {
    Haptics.selectionAsync().catch(() => {});
    fn();
  };

  const send = () => {
    app.addReport({ kind, depth: kind === 'water' ? depth : undefined, lat: where.lat, lon: where.lon, photo });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toast('Tu reporte ya está en el mapa. Gracias por cuidar a tu cuadra.');
    router.back();
  };

  const photoW = width - 32;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Header
          title="Reportar mi calle"
          right={
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Cerrar">
              <Icon name="close" size={24} color={C.ink} />
            </Pressable>
          }
        />
        <View style={styles.photo}>
          {photo ? <Image source={{ uri: photo }} style={{ width: photoW, height: photoW * 0.62 }} /> : <FloodArt width={photoW} />}
          <View style={styles.tag}>
            <Icon name="pin" size={12} color="#fff" />
            <Text style={styles.tagText}>
              {nearestSector(where).name}
              {where.real ? '' : ' (aprox.)'} · ahora
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button kind="light" icon="camera" label={photo ? 'Otra foto' : 'Tomar foto'} onPress={() => takePhoto(true)} style={{ flex: 1 }} />
          <Button kind="light" label="Galería" onPress={() => takePhoto(false)} style={{ flex: 1 }} />
        </View>

        <T kind="bold">¿Qué ves?</T>
        <View style={styles.kinds}>
          {(Object.keys(REPORT_KINDS) as ReportKind[]).map((k) => (
            <PressableScale key={k} onPress={() => pick(() => setKind(k))} style={[styles.kind, kind === k && styles.on]}>
              <Text style={{ fontSize: 22 }}>{REPORT_KINDS[k].icon}</Text>
              <Text style={styles.kindText}>{REPORT_KINDS[k].label}</Text>
            </PressableScale>
          ))}
        </View>

        {kind === 'water' && (
          <>
            <T kind="bold">¿Hasta dónde llega el agua?</T>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DEPTHS.map((x) => (
                <PressableScale key={x.d} onPress={() => pick(() => setDepth(x.d))} style={[styles.depth, depth === x.d && styles.on]}>
                  <Person share={x.share} size={64} />
                  <Text style={styles.kindText}>{x.d}</Text>
                </PressableScale>
              ))}
            </View>
          </>
        )}

        <Button label="Enviar reporte" onPress={send} style={{ marginTop: 6 }} />
        <T kind="fine">Nuria revisa la foto y avisa a tus vecinos. Tu nombre no se muestra.</T>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  photo: { borderRadius: 18, overflow: 'hidden' },
  tag: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(14,53,80,0.85)', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 10 },
  tagText: { fontFamily: F.bold, fontSize: 12.5, color: '#fff' },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kind: { width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 14, padding: 12 },
  kindText: { fontFamily: F.bold, fontSize: 14, color: C.ink, flexShrink: 1 },
  depth: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.line, borderRadius: 14, paddingVertical: 12 },
  on: { borderColor: C.cel, backgroundColor: '#EEF8FD', borderWidth: 2 },
});
