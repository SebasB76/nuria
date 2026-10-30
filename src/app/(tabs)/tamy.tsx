import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';

import { ApiMessage } from '@/ai/deepseek';
import { offlineTamy } from '@/ai/offline';
import { askTamy, TamyReply, trimHistory } from '@/ai/tamy';
import { Card } from '@/ai/tools';
import { sectorById } from '@/data/places';
import { useApp } from '@/state/AppState';
import { useFamily } from '@/state/FamilyState';
import { getApiKey } from '@/state/storage';
import { ChatCard } from '@/ui/ChatCards';
import { Icon, TamyAvatar } from '@/ui/icons';
import { RichText } from '@/ui/RichText';
import { C, F } from '@/ui/theme';

type Msg = { id: string; from: 'tamy' | 'me'; text: string; cards?: Card[]; note?: string };

const CHIPS = [
  '¿Va a llover fuerte hoy?',
  '¿Por dónde me voy al Malecón?',
  '¿A qué hora salgo?',
  '¿Qué hago si entra agua a mi casa?',
  'Arma mi mochila de emergencia',
  'Hay agua hasta la rodilla en mi calle',
  '¿Cómo va El Niño?',
  '¿Dónde está mi familia?',
  'Avísale a mi familia que estoy bien',
];

export default function TamyScreen() {
  const app = useApp();
  const family = useFamily();
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [speaking, setSpeaking] = useState<string | null>(null);
  const home = sectorById(app.prefs.homeId), level = app.risk[home.id].level;
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 'hello',
      from: 'tamy',
      text: `¡Hola! Soy **Tamy** 💧. Mi nombre viene de «tamya», lluvia en kichwa. Vigilo el cielo, el río Guayas y lo que reportan tus vecinos.\n\nAhora mismo, ${home.name} está en **${level.name}**. ¿En qué te ayudo?`,
    },
  ]);
  const api = useRef<ApiMessage[]>([]);
  const scroll = useRef<ScrollViewInstance>(null);

  // the key can change in Ajustes, so check again each time the tab gets focus
  useFocusEffect(
    useCallback(() => {
      getApiKey().then((k) => setHasKey(!!k));
    }, []),
  );
  useEffect(() => () => void Speech.stop(), []);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setText('');
    setMsgs((m) => [...m, { id: 'u' + Date.now(), from: 'me', text: question }]);
    setBusy(true);
    const env = { app, family };
    let reply: TamyReply, note: string | undefined;
    const key = await getApiKey();
    setHasKey(!!key);
    if (key) {
      try {
        const r = await askTamy(trimHistory([...api.current, { role: 'user', content: question }]), env, key);
        api.current = r.history;
        reply = r.reply;
      } catch {
        reply = await offlineTamy(question, env);
        note = 'Sin conexión con la IA: te respondí con lo básico.';
      }
    } else reply = await offlineTamy(question, env);
    setMsgs((m) => [...m, { id: 't' + Date.now(), from: 'tamy', text: reply.text, cards: reply.cards, note }]);
    setBusy(false);
  };

  const speak = (m: Msg) => {
    Speech.stop();
    if (speaking === m.id) return setSpeaking(null);
    setSpeaking(m.id);
    Speech.speak(m.text.replace(/\*\*|\*|#/g, '').replace(/^\s*[-•]\s*/gm, ''), { language: 'es-US', rate: 0.98, onDone: () => setSpeaking(null), onStopped: () => setSpeaking(null) });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.paper }}>
      <View style={styles.head}>
        <TamyAvatar size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>Tamy</Text>
          <Text style={[styles.status, hasKey === false && { color: C.ink2 }]}>{hasKey === false ? '● modo sin conexión · respuestas básicas' : '● en línea'}</Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityLabel="Ajustes de Tamy">
          <Icon name="gear" size={22} color={C.ink2} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={styles.list} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          {msgs.map((m) =>
            m.from === 'me' ? (
              <View key={m.id} style={[styles.bub, styles.me]}>
                <Text style={styles.meText}>{m.text}</Text>
              </View>
            ) : (
              <View key={m.id} style={{ gap: 8, alignSelf: 'stretch' }}>
                <View style={[styles.bub, styles.tamy]}>
                  <RichText text={m.text} />
                  <Pressable onPress={() => speak(m)} style={styles.listen} hitSlop={6}>
                    <Icon name={speaking === m.id ? 'stop' : 'speaker'} size={14} color={C.celDeep} />
                    <Text style={styles.listenText}>{speaking === m.id ? 'Detener' : 'Escuchar'}</Text>
                  </Pressable>
                </View>
                {m.cards?.map((c, i) => (
                  <View key={i} style={{ maxWidth: '92%' }}>
                    <ChatCard card={c} />
                  </View>
                ))}
                {m.note && <Text style={styles.note}>{m.note}</Text>}
              </View>
            ),
          )}
          {busy && (
            <View style={[styles.bub, styles.tamy, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}>
              <ActivityIndicator size="small" color={C.celDeep} />
              <Text style={styles.typing}>Tamy está revisando el cielo…</Text>
            </View>
          )}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
          {CHIPS.map((c) => (
            <Pressable key={c} onPress={() => ask(c)} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.75 }]} disabled={busy}>
              <Text style={styles.chipText}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escríbele a Tamy…"
            placeholderTextColor={C.muted}
            style={styles.input}
            onSubmitEditing={() => ask(text)}
            returnKeyType="send"
            multiline
            submitBehavior="submit"
          />
          <Pressable onPress={() => ask(text)} style={[styles.send, (!text.trim() || busy) && { opacity: 0.4 }]} disabled={!text.trim() || busy} accessibilityLabel="Enviar">
            <Icon name="send" size={20} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: C.line },
  name: { fontFamily: F.display, fontSize: 20, color: C.ink },
  status: { fontFamily: F.bold, fontSize: 12, color: C.tranquilo },
  list: { padding: 14, gap: 10, paddingBottom: 20 },
  bub: { maxWidth: '88%', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 13 },
  me: { alignSelf: 'flex-end', backgroundColor: '#D6F0FF', borderTopRightRadius: 5 },
  meText: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.ink },
  tamy: { alignSelf: 'flex-start', backgroundColor: '#fff', borderTopLeftRadius: 5, borderWidth: 1, borderColor: C.line },
  listen: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, alignSelf: 'flex-start' },
  listenText: { fontFamily: F.bold, fontSize: 12.5, color: C.celDeep },
  note: { fontFamily: F.body, fontSize: 12, color: C.muted, marginLeft: 4 },
  typing: { fontFamily: F.medium, fontSize: 14, color: C.ink2 },
  chips: { gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  chip: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#CBE7F6', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  chipText: { fontFamily: F.bold, fontSize: 13, color: C.celDeep },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingBottom: 10, paddingTop: 2 },
  input: { flex: 1, maxHeight: 110, backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: C.line, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontFamily: F.body, fontSize: 15.5, color: C.ink },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
});
