import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { INITIAL_FAMILY } from '@/data/family';
import { sectorById } from '@/data/places';
import { requestAlertPermission } from '@/state/alerts';
import { useApp } from '@/state/AppState';
import { Icon, IconName, WelcomeArt } from '@/ui/icons';
import { Button, T } from '@/ui/kit';
import { Row, SectorSheet } from '@/ui/Sheets';
import { C, F } from '@/ui/theme';

type PlaceKey = 'homeId' | 'workId' | 'schoolId';
const PLACE_ROWS: { key: PlaceKey; title: string; icon: IconName }[] = [
  { key: 'homeId', title: 'Casa', icon: 'home' },
  { key: 'workId', title: 'Trabajo', icon: 'work' },
  { key: 'schoolId', title: 'Colegio de los chicos', icon: 'school' },
];

export default function WelcomeScreen() {
  const { prefs, updatePrefs, setFocusId } = useApp();
  const { width } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState<PlaceKey | null>(null);
  const [phone, setPhone] = useState(prefs.notifyPhone);
  const [quiet, setQuiet] = useState(prefs.quietNights);

  const finish = async () => {
    if (phone) await requestAlertPermission().catch(() => false);
    updatePrefs({ onboarded: true, notifyPhone: phone, quietNights: quiet });
    setFocusId(prefs.homeId);
    router.replace('/');
  };

  if (step === 0)
    return (
      <View style={{ flex: 1, backgroundColor: '#E6F4FB' }}>
        <WelcomeArt width={width} />
        <SafeAreaView edges={['bottom']} style={styles.intro}>
          <Text style={styles.big}>Hola, soy Tamy</Text>
          <T style={{ fontSize: 17, lineHeight: 24 }}>
            Te aviso antes de que llueva fuerte en tu barrio, te digo por dónde ir sin mojarte y te ayudo a cuidar a tu familia este invierno.
          </T>
          <View style={{ flex: 1 }} />
          <Button label="Empezar" onPress={() => setStep(1)} />
          <T kind="fine">Mi nombre viene de «tamya», lluvia en kichwa.</T>
        </SafeAreaView>
      </View>
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.step}>Paso {step} de 2</Text>
        {step === 1 ? (
          <>
            <Text style={styles.title}>¿Qué lugares te importan?</Text>
            <T kind="soft">Te aviso por cada uno. Toca para cambiar el barrio.</T>
            {PLACE_ROWS.map((p) => (
              <Row
                key={p.key}
                title={p.title}
                sub={sectorById(prefs[p.key]).name}
                on
                onPress={() => setEditing(p.key)}
                left={
                  <View style={styles.pi}>
                    <Icon name={p.icon} size={20} color={C.celDeep} />
                  </View>
                }
              />
            ))}
          </>
        ) : (
          <>
            <Text style={styles.title}>¿Cómo te aviso?</Text>
            <Toggle icon="bell" title="En el celular" sub="Notificación con sonido" value={phone} onChange={setPhone} />
            <Toggle icon="moon" title="No me despiertes" sub="De 11 pm a 6 am, salvo peligro" value={quiet} onChange={setQuiet} />
            <Toggle icon="drop" title="Por WhatsApp" sub="Llega aunque no abras la app. Viene en la próxima versión." value={false} disabled />
            <View style={{ marginTop: 10, gap: 8 }}>
              <T kind="bold">Avisar también a mi familia</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {INITIAL_FAMILY.filter((m) => !m.me).map((m) => (
                  <View key={m.id} style={[styles.fav, { backgroundColor: m.color }]}>
                    <Text style={styles.favText}>{m.initials}</Text>
                  </View>
                ))}
                <T kind="soft" style={{ marginLeft: 4 }}>
                  {INITIAL_FAMILY.filter((m) => !m.me)
                    .map((m) => m.rel)
                    .join(', ')}
                </T>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      <View style={styles.foot}>
        <Button label={step === 1 ? 'Seguir' : 'Listo'} onPress={() => (step === 1 ? setStep(2) : finish())} />
      </View>
      <SectorSheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        value={editing ? prefs[editing] : ''}
        onPick={(id) => editing && updatePrefs({ [editing]: id })}
        title={PLACE_ROWS.find((p) => p.key === editing)?.title ?? ''}
      />
    </SafeAreaView>
  );
}

function Toggle({ icon, title, sub, value, onChange, disabled }: { icon: IconName; title: string; sub: string; value: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <View style={[styles.tg, disabled && { opacity: 0.55 }]}>
      <Icon name={icon} size={22} color={C.ink} />
      <View style={{ flex: 1 }}>
        <T kind="bold">{title}</T>
        <T kind="soft">{sub}</T>
      </View>
      <Switch value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: C.tranquilo, false: '#D7D0C3' }} thumbColor="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { flex: 1, backgroundColor: C.paper, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -26, padding: 22, gap: 12 },
  big: { fontFamily: F.display, fontSize: 36, lineHeight: 40, color: C.ink, letterSpacing: -1 },
  body: { padding: 20, gap: 10 },
  step: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.8, color: C.celDeep, textTransform: 'uppercase' },
  title: { fontFamily: F.display, fontSize: 28, lineHeight: 32, color: C.ink, letterSpacing: -0.5 },
  pi: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.celSoft, alignItems: 'center', justifyContent: 'center' },
  tg: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDE6DA' },
  fav: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  favText: { fontFamily: F.black, color: '#fff', fontSize: 13 },
  foot: { padding: 20, paddingTop: 8 },
});
