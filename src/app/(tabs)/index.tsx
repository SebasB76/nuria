import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { sectorById } from '@/data/places';
import { bestWorstText, headline, reasons, todoFor } from '@/data/risk';
import { SEASON } from '@/data/season';
import { clock } from '@/data/time';
import { useApp } from '@/state/AppState';
import { Bucket, Drop, Icon, Logo, TamyAvatar } from '@/ui/icons';
import { placeLabel, ScenarioBanner } from '@/ui/common';
import { Bullets, Button, Card, Chip, Header, Screen, T, TamyTip } from '@/ui/kit';
import { RainStrip } from '@/ui/RainStrip';
import { SectorSheet } from '@/ui/Sheets';
import { TideChart } from '@/ui/TideChart';
import { C, F, LEVEL_TINT } from '@/ui/theme';

export default function TodayScreen() {
  const app = useApp();
  const { prefs, focusId, risk, hourly, tide, reports } = app;
  const [picker, setPicker] = useState(false);
  const s = sectorById(focusId), r = risk[s.id], l = r.level, h = hourly[s.id], tint = LEVEL_TINT[l.key];
  const bw = bestWorstText(h, tide);
  const label = placeLabel(prefs, s.id);
  const others = (['homeId', 'workId', 'schoolId'] as const).map((k) => prefs[k]).filter((id, i, a) => id !== s.id && a.indexOf(id) === i);

  return (
    <Screen refreshControl={<RefreshControl refreshing={app.loading} onRefresh={app.refresh} tintColor={C.navy} />}>
      <Header
        title="Hoy"
        left={<Logo size={28} />}
        right={
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Chip label={`${label ? label + ' · ' : ''}${s.short} ▾`} icon={<Icon name="pin" size={14} color={C.ink} />} onPress={() => setPicker(true)} />
            <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityLabel="Ajustes">
              <Icon name="gear" size={22} color={C.ink2} />
            </Pressable>
          </View>
        }
      />
      {prefs.scenario === 'storm' && <ScenarioBanner />}

      <View style={[styles.level, { backgroundColor: tint.bg, borderColor: tint.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Drop level={l} size={58} />
          <View>
            <T kind="label">{label ? `Tu ${label.toLowerCase()} hoy` : `${s.name} hoy`}</T>
            <Text style={styles.word}>{l.name}</Text>
          </View>
        </View>
        <Text style={styles.head}>{headline(h, tide)}</Text>
        <T kind="soft">{l.desc}</T>
        {l.key === 'peligro' && <Button kind="danger" label="Qué hago ahora" icon="alert" onPress={() => router.push('/danger')} style={{ marginTop: 10 }} />}
      </View>

      <Card>
        <View style={styles.cardHead}>
          <T kind="bold">Tu día</T>
          <T kind="fine">próximas 15 horas</T>
        </View>
        <RainStrip h={h} tide={tide} />
      </Card>

      <TamyTip avatar={<TamyAvatar size={34} />}>
        <Text style={styles.tipText}>
          <Text style={styles.tipStrong}>Tamy: </Text>
          {bw.best ? `si tienes que salir, hazlo de ${bw.best}. ` : 'hoy no veo un buen momento para salir. '}
          {bw.worst ? `Evita salir de ${bw.worst}: ${bw.worstWord}.` : 'No se espera lluvia fuerte en las próximas horas.'}
        </Text>
        <Pressable onPress={() => router.navigate('/tamy')} style={styles.tipBtn}>
          <Text style={styles.tipBtnText}>Pregúntale a Tamy ›</Text>
        </Pressable>
      </TamyTip>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <QuickAction icon="route" title="Ruta segura" sub="El camino con menos agua" onPress={() => router.navigate('/route')} />
        <QuickAction icon="camera" title="Reportar" sub="Agua en tu calle" onPress={() => router.push('/report')} />
      </View>

      {others.length > 0 && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {others.map((id) => {
            const o = sectorById(id), ol = risk[id].level;
            return (
              <Card key={id} style={styles.place} onPress={() => app.setFocusId(id)}>
                <Drop level={ol} size={26} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.placeTitle}>{placeLabel(prefs, id)}</Text>
                  <Text style={styles.placeSub} numberOfLines={1}>
                    {o.short} · {ol.name}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Card>
        <T kind="bold" style={{ marginBottom: 4 }}>
          🌊 El río Guayas
        </T>
        <TideChart tide={tide} />
      </Card>

      <Card>
        <T kind="bold" style={{ marginBottom: 8 }}>
          ¿Por qué {l.name.toLowerCase()}?
        </T>
        <Bullets
          items={reasons(s, r, tide, reports).map((x) => (
            <Text key={x.icon} style={styles.reason}>
              {x.icon} {x.text}
              {x.demo ? <Text style={styles.demo}> ejemplo</Text> : null}
            </Text>
          ))}
        />
      </Card>

      <Card>
        <T kind="bold" style={{ marginBottom: 8 }}>
          Haz esto
        </T>
        <Bullets numbered items={todoFor(l, h, tide)} />
      </Card>

      <Card style={styles.season} onPress={() => router.push('/season')}>
        <Bucket share={SEASON.rainedShare} size={64} />
        <View style={{ flex: 1 }}>
          <T kind="bold">Así va el invierno</T>
          <T kind="soft">Ya llovió 2 de cada 3 partes de un invierno normal, y recién empieza.</T>
        </View>
        <Icon name="chevron" size={20} color={C.ink2} />
      </Card>

      <T kind="fine">
        {app.prefs.scenario === 'storm'
          ? 'Escenario de demostración: la lluvia es simulada.'
          : app.live.rain
            ? `Pronóstico en vivo · actualizado a las ${app.updatedAt ? clock(app.updatedAt) : ''}`
            : 'Sin conexión al pronóstico: datos de ejemplo.'}
        {'\n'}Aguaje no es una fuente oficial. Sigue al INAMHI y a la SNGR. En una emergencia, llama al 911.
      </T>

      <SectorSheet visible={picker} onClose={() => setPicker(false)} value={s.id} onPick={app.setFocusId} title="¿Qué barrio quieres ver?" />
    </Screen>
  );
}

function QuickAction({ icon, title, sub, onPress }: { icon: 'route' | 'camera'; title: string; sub: string; onPress: () => void }) {
  return (
    <Card style={{ flex: 1, gap: 6 }} onPress={onPress}>
      <View style={styles.qaIcon}>
        <Icon name={icon} size={20} color={C.celDeep} />
      </View>
      <T kind="bold">{title}</T>
      <T kind="soft" style={{ fontSize: 12.5, lineHeight: 16 }}>
        {sub}
      </T>
    </Card>
  );
}

const styles = StyleSheet.create({
  level: { borderRadius: 22, borderWidth: 1.5, padding: 16, gap: 4 },
  word: { fontFamily: F.display, fontSize: 38, lineHeight: 40, color: C.ink, letterSpacing: -1 },
  head: { fontFamily: F.bold, fontSize: 18, lineHeight: 23, color: C.ink, marginTop: 10 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  tipText: { fontFamily: F.body, fontSize: 14.5, lineHeight: 20, color: '#fff' },
  tipStrong: { fontFamily: F.black, color: '#BFE3F5' },
  tipBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
  tipBtnText: { fontFamily: F.bold, fontSize: 13, color: '#fff' },
  qaIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: C.celSoft, alignItems: 'center', justifyContent: 'center' },
  place: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 11 },
  placeTitle: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  placeSub: { fontFamily: F.body, fontSize: 12.5, color: C.ink2 },
  reason: { fontFamily: F.body, fontSize: 14.5, lineHeight: 20, color: C.ink },
  demo: { fontFamily: F.bold, fontSize: 11, color: C.muted },
  season: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EEF8FD', borderColor: '#CBE7F6' },
});
