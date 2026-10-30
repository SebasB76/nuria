import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card as CardData } from '@/ai/tools';
import { STATUS } from '@/data/family';
import { sectorById } from '@/data/places';
import { headline } from '@/data/risk';
import { routeTip } from '@/data/route';
import { KIT_ITEMS, SEASON } from '@/data/season';
import { useApp } from '@/state/AppState';
import { useFamily } from '@/state/FamilyState';
import { Bucket, Drop } from './icons';
import { Bullets } from './kit';
import { RainStrip } from './RainStrip';
import { TideChart } from './TideChart';
import { C, F, LEVEL_TINT } from './theme';
import { useToast } from './Toast';
import { PressableScale } from './PressableScale';

export function ChatCard({ card }: { card: CardData }) {
  switch (card.type) {
    case 'risk':
      return <RiskCard sectorId={card.sectorId} />;
    case 'rain':
      return <RainCard sectorId={card.sectorId} />;
    case 'tide':
      return <TideCard />;
    case 'route':
      return <RouteCard card={card} />;
    case 'family':
      return <FamilyCard />;
    case 'season':
      return <SeasonCard />;
    case 'kit':
      return <KitCard />;
    case 'steps':
      return (
        <View style={styles.box}>
          <Text style={styles.title}>{card.title}</Text>
          <Bullets numbered items={card.items} textStyle={{ fontSize: 14 }} />
        </View>
      );
    case 'whatsapp':
      return <WhatsAppCard text={card.text} />;
    case 'report':
      return (
        <View style={styles.box}>
          <Text style={styles.title}>📍 Tu reporte está en el mapa</Text>
          <Text style={styles.soft}>
            {card.text} · {card.sectorName} · ahora
          </Text>
          <Action label="Ver en el mapa" onPress={() => router.navigate('/map')} />
        </View>
      );
  }
}

function Action({ label, onPress, light }: { label: string; onPress: () => void; light?: boolean }) {
  return (
    <PressableScale onPress={onPress} style={[styles.action, light && styles.actionLight]}>
      <Text style={[styles.actionText, light && { color: C.navy }]}>{label}</Text>
    </PressableScale>
  );
}

function RiskCard({ sectorId }: { sectorId: string }) {
  const { risk, hourly, tide } = useApp();
  const s = sectorById(sectorId), l = risk[s.id].level, tint = LEVEL_TINT[l.key];
  return (
    <View style={[styles.box, { backgroundColor: tint.bg, borderColor: tint.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Drop level={l} size={36} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {s.name} · {l.name}
          </Text>
          <Text style={styles.soft}>{headline(hourly[s.id], tide)}</Text>
        </View>
      </View>
      <RainStrip h={hourly[s.id]} tide={tide} compact />
    </View>
  );
}

function RainCard({ sectorId }: { sectorId: string }) {
  const { hourly, tide } = useApp();
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Lluvia en {sectorById(sectorId).name}</Text>
      <RainStrip h={hourly[sectorId]} tide={tide} compact />
    </View>
  );
}

function TideCard() {
  const { tide } = useApp();
  return (
    <View style={styles.box}>
      <TideChart tide={tide} />
    </View>
  );
}

function RouteCard({ card }: { card: Extract<CardData, { type: 'route' }> }) {
  const b = card.plan.list[0];
  return (
    <View style={[styles.box, { backgroundColor: '#F1FAF3', borderColor: '#A9D9B7' }]}>
      <Text style={styles.title}>
        {card.plan.from.name} → {card.plan.to.name}
      </Text>
      <Text style={styles.soft}>
        {b.r.name ? 'Por ' + b.r.name : 'Por la ruta marcada'} · ~{Math.round(b.r.dur / 60)} min · {b.a.hits.length ? '⚠️ pasa por agua' : '✅ sin agua reportada'}
      </Text>
      <Text style={styles.soft}>{routeTip(card.plan)}</Text>
      <Action label="Ver la ruta en el mapa" onPress={() => router.navigate('/route')} />
    </View>
  );
}

function FamilyCard() {
  const fam = useFamily();
  const toast = useToast();
  const pending = fam.members.some((m) => !m.me && m.status !== 'ok');
  return (
    <View style={styles.box}>
      {fam.members
        .filter((m) => !m.me)
        .map((m) => (
          <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.dot, { backgroundColor: m.color }]}>
              <Text style={styles.dotText}>{m.initials}</Text>
            </View>
            <Text style={[styles.soft, { flex: 1 }]}>
              <Text style={{ fontFamily: F.bold, color: C.ink }}>{m.rel}</Text> · {STATUS[m.status].text.toLowerCase()}
              {fam.zoneOf(m).wet ? ' · ⚠️ cerca de agua' : ''}
            </Text>
            <View style={[styles.status, { backgroundColor: STATUS[m.status].color }]} />
          </View>
        ))}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {pending && (
          <Action
            label="¿Están bien?"
            onPress={() => {
              fam.askFamily();
              toast('Nuria le preguntó a tu familia si está bien.');
            }}
          />
        )}
        <Action light label="Ver en el mapa" onPress={() => router.navigate('/family')} />
      </View>
    </View>
  );
}

function SeasonCard() {
  return (
    <View style={[styles.box, { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#EEF8FD', borderColor: '#CBE7F6' }]}>
      <Bucket share={SEASON.rainedShare} size={60} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.title}>Lo que ya llovió, frente a un invierno normal</Text>
        <Text style={styles.soft}>Fuentes: {SEASON.sources}.</Text>
        <Action light label="Ver la temporada" onPress={() => router.push('/season')} />
      </View>
    </View>
  );
}

function KitCard() {
  const [done, setDone] = useState<number[]>([]);
  const toast = useToast();
  const toggle = (i: number) => {
    const next = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    setDone(next);
    if (next.length === KIT_ITEMS.length) toast('¡Mochila lista! Nuria te recuerda revisarla cada mes.');
  };
  return (
    <View style={styles.box}>
      {KIT_ITEMS.map((t, i) => (
        <Pressable key={t} onPress={() => toggle(i)} style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
          <View style={[styles.check, done.includes(i) && styles.checkOn]}>{done.includes(i) && <Text style={styles.checkMark}>✓</Text>}</View>
          <Text style={[styles.soft, { flex: 1, color: C.ink }, done.includes(i) && { textDecorationLine: 'line-through', color: C.muted }]}>{t}</Text>
        </Pressable>
      ))}
      <View style={styles.prog}>
        <View style={[styles.progFill, { width: `${(done.length / KIT_ITEMS.length) * 100}%` }]} />
      </View>
      <Text style={styles.soft}>
        {done.length} de {KIT_ITEMS.length} listos
      </Text>
    </View>
  );
}

function WhatsAppCard({ text }: { text: string }) {
  const toast = useToast();
  // wa.me opens the WhatsApp app when it is installed; the person still picks the chat and taps send
  const send = () => Linking.openURL('https://wa.me/?text=' + encodeURIComponent(text)).catch(() => toast('No pudimos abrir WhatsApp.'));
  return (
    <View style={[styles.box, { backgroundColor: '#E7F8EE', borderColor: '#B7E6C8' }]}>
      <Text style={styles.label}>Para tu grupo «Familia»</Text>
      <View style={styles.wa}>
        <Text style={styles.waText}>{text}</Text>
      </View>
      <PressableScale onPress={send} style={[styles.action, { backgroundColor: C.wa }]}>
        <Text style={styles.actionText}>Enviar por WhatsApp</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 12, gap: 8 },
  title: { fontFamily: F.bold, fontSize: 14.5, color: C.ink },
  soft: { fontFamily: F.body, fontSize: 13.5, lineHeight: 18, color: C.ink2 },
  label: { fontFamily: F.bold, fontSize: 11.5, letterSpacing: 0.6, color: '#1D6B3B', textTransform: 'uppercase' },
  action: { alignSelf: 'flex-start', backgroundColor: C.navy, borderRadius: 11, paddingVertical: 8, paddingHorizontal: 12 },
  actionLight: { backgroundColor: C.celSoft },
  actionText: { fontFamily: F.bold, fontSize: 13.5, color: '#fff' },
  dot: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontFamily: F.black, fontSize: 11, color: '#fff' },
  status: { width: 10, height: 10, borderRadius: 5 },
  check: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: '#CFC6B6', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: C.tranquilo, borderColor: C.tranquilo },
  checkMark: { color: '#fff', fontFamily: F.black, fontSize: 13 },
  prog: { height: 8, borderRadius: 4, backgroundColor: '#EFE8DC', overflow: 'hidden' },
  progFill: { height: 8, backgroundColor: C.tranquilo },
  wa: { backgroundColor: C.waDark, borderRadius: 12, borderTopLeftRadius: 4, padding: 10 },
  waText: { fontFamily: F.body, fontSize: 14.5, lineHeight: 20, color: '#fff' },
});
