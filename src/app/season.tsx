import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AFTER_STEPS, SEASON, WEEKLY_TASKS } from '@/data/season';
import { useApp } from '@/state/AppState';
import { Bucket, Icon, NuriaAvatar } from '@/ui/icons';
import { Bullets, Card, Chip, Header, Screen, T } from '@/ui/kit';
import { C, F } from '@/ui/theme';

export default function SeasonScreen() {
  const { prefs, updatePrefs } = useApp();
  const done = prefs.tasksDone;
  const toggle = (i: number) => updatePrefs({ tasksDone: done.includes(i) ? done.filter((x) => x !== i) : [...done, i] });

  return (
    <Screen>
      <Header
        title="Así va el invierno"
        right={
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Chip label="El Niño" />
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Cerrar">
              <Icon name="close" size={24} color={C.ink} />
            </Pressable>
          </View>
        }
      />
      <Card style={styles.hero}>
        <Bucket share={SEASON.rainedShare} size={92} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.heroText}>Ya llovió 2 de cada 3 partes de un invierno normal.</Text>
          <T kind="soft">Y el invierno recién empieza.</T>
        </View>
      </Card>
      <View style={styles.tip}>
        <NuriaAvatar size={32} />
        <Text style={styles.tipText}>
          Se esperan lluvias fuertes <Text style={{ fontFamily: F.black }}>hasta abril</Text>. Prepara tu casa con calma, una tarea por semana.
        </Text>
      </View>

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T kind="bold">Prepárate esta semana</T>
          <T kind="soft">
            {done.length} de {WEEKLY_TASKS.length}
          </T>
        </View>
        <View style={styles.prog}>
          <View style={[styles.progFill, { width: `${(done.length / WEEKLY_TASKS.length) * 100}%` }]} />
        </View>
        {WEEKLY_TASKS.map((t, i) => (
          <Pressable key={t} onPress={() => toggle(i)} style={styles.ck}>
            <View style={[styles.box, done.includes(i) && styles.boxOn]}>{done.includes(i) && <Icon name="check" size={14} color="#fff" strokeWidth={3} />}</View>
            <Text style={[styles.ckText, done.includes(i) && { color: C.muted, textDecorationLine: 'line-through' }]}>{t}</Text>
          </Pressable>
        ))}
      </Card>

      <Card style={{ gap: 8 }}>
        <T kind="bold">Lo que dicen los expertos</T>
        <Bullets items={SEASON.facts} />
        <T kind="fine" style={{ textAlign: 'left' }}>
          Fuentes: {SEASON.sources}.
        </T>
      </Card>

      <Card style={{ gap: 8 }}>
        <T kind="bold">Después de cada lluvia</T>
        <Bullets numbered items={AFTER_STEPS} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#EEF8FD', borderColor: '#CBE7F6' },
  heroText: { fontFamily: F.display, fontSize: 21, lineHeight: 25, color: C.ink },
  tip: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#FFF3D3', borderRadius: 18, padding: 13 },
  tipText: { flex: 1, fontFamily: F.body, fontSize: 14.5, lineHeight: 20, color: C.ink },
  prog: { height: 8, borderRadius: 4, backgroundColor: '#EFE8DC', overflow: 'hidden' },
  progFill: { height: 8, backgroundColor: C.tranquilo },
  ck: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: '#CFC6B6', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: C.tranquilo, borderColor: C.tranquilo },
  ckText: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.ink },
});
