import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { levelByKey, sectorById } from '@/data/places';
import { useApp } from '@/state/AppState';
import { useFamily } from '@/state/FamilyState';
import { Drop, Icon, TamyAvatar } from '@/ui/icons';
import { Card, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';
import { useToast } from '@/ui/Toast';

const STEPS = ['Corta la luz, si llegas sin pisar agua.', 'Sube papeles y medicinas a lo alto.', 'No cruces calles con agua que corre.'];

// in danger, less is more: one color, big buttons, three steps
export default function DangerScreen() {
  const { prefs } = useApp();
  const fam = useFamily();
  const toast = useToast();
  const home = sectorById(prefs.homeId);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.paper }}>
      <SafeAreaView edges={['top']} style={styles.top}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Drop level={levelByKey('peligro')} size={58} dark fill="#fff" />
            <View>
              <Text style={styles.where}>TU CASA · {home.name.toUpperCase()}</Text>
              <Text style={styles.word}>Peligro</Text>
            </View>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Cerrar">
            <Icon name="close" size={26} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.msg}>El agua puede entrar a las casas de tu cuadra en la próxima hora.</Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
        <Pressable style={[styles.big, { backgroundColor: C.peligro }]} onPress={() => toast('En una emergencia real, este botón marca al 911.')}>
          <Icon name="phone" size={24} color="#fff" />
          <Text style={[styles.bigText, { color: '#fff' }]}>Llamar al 911</Text>
        </Pressable>
        <Pressable
          style={[styles.big, { backgroundColor: '#fff', borderWidth: 2, borderColor: C.line }]}
          onPress={() => {
            fam.setStatus('me', 'ok');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            toast('Tu familia ya sabe que estás bien.');
          }}>
          <Icon name="check" size={24} color={C.tranquilo} strokeWidth={3} />
          <Text style={styles.bigText}>Avisar: «Estoy bien»</Text>
        </Pressable>

        <T kind="bold" style={{ marginTop: 6 }}>
          Haz esto ahora
        </T>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepRow}>
            <Text style={styles.stepNum}>{i + 1}</Text>
            <Text style={styles.stepText}>{s}</Text>
          </View>
        ))}

        <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Icon name="pin" size={22} color={C.peligro} />
          <View style={{ flex: 1 }}>
            <T kind="bold">Lugar seguro más cerca</T>
            <T kind="soft">Escuela del barrio, en lo alto · a 600 m (ejemplo)</T>
          </View>
        </Card>
        <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }} onPress={() => router.navigate('/tamy')}>
          <TamyAvatar size={34} />
          <View style={{ flex: 1 }}>
            <T kind="bold">Pregúntale a Tamy</T>
            <T kind="soft">Qué hacer, por dónde salir, cómo está tu familia</T>
          </View>
          <Icon name="chevron" size={20} color={C.ink2} />
        </Card>
        <T kind="fine">Sigue los avisos oficiales del INAMHI y de la SNGR.</T>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { backgroundColor: C.peligro, paddingHorizontal: 18, paddingBottom: 20, paddingTop: 10 },
  where: { fontFamily: F.black, fontSize: 12, letterSpacing: 1, color: '#FFE3E3' },
  word: { fontFamily: F.display, fontSize: 44, lineHeight: 46, color: '#fff', letterSpacing: -1 },
  msg: { fontFamily: F.bold, fontSize: 18, lineHeight: 24, color: '#fff', marginTop: 12 },
  big: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, paddingVertical: 18 },
  bigText: { fontFamily: F.black, fontSize: 18, color: C.ink },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.line },
  stepNum: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FBDADA', color: C.peligro, textAlign: 'center', lineHeight: 30, fontFamily: F.black, fontSize: 15, overflow: 'hidden' },
  stepText: { flex: 1, fontFamily: F.bold, fontSize: 16, lineHeight: 21, color: C.ink },
});
