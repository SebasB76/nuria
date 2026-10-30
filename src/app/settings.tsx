import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { chatCompletion } from '@/ai/deepseek';
import { sectorById } from '@/data/places';
import { scheduleDemoAlert } from '@/state/alerts';
import { useApp } from '@/state/AppState';
import { useFamily } from '@/state/FamilyState';
import { getApiKey, getStoredKey, Scenario, setStoredKey } from '@/state/storage';
import { Icon } from '@/ui/icons';
import { Bullets, Button, Card, Header, Screen, Segmented, T } from '@/ui/kit';
import { Row, SectorSheet } from '@/ui/Sheets';
import { C, F } from '@/ui/theme';
import { useToast } from '@/ui/Toast';

type PlaceKey = 'homeId' | 'workId' | 'schoolId';
const MODELS = [
  { label: 'Rápido (flash)', value: 'deepseek-flash' },
  { label: 'Más listo (pro)', value: 'deepseek-v4-pro' },
];
const SCENARIOS: { label: string; value: Scenario }[] = [
  { label: 'Pronóstico real', value: 'live' },
  { label: 'Aguacero simulado', value: 'storm' },
];

export default function SettingsScreen() {
  const app = useApp();
  const fam = useFamily();
  const toast = useToast();
  const [key, setKey] = useState('');
  const [stored, setStored] = useState(false);
  const [testing, setTesting] = useState(false);
  const [editing, setEditing] = useState<PlaceKey | null>(null);
  const envKey = !!process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY;

  useEffect(() => {
    getStoredKey().then((k) => setStored(!!k));
  }, []);

  const saveKey = async () => {
    await setStoredKey(key.trim());
    setStored(!!key.trim());
    setKey('');
    toast(key.trim() ? 'Guardé la key en el celular. Nuria ya usa la IA.' : 'Borré la key del celular.');
  };
  const test = async () => {
    setTesting(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) throw new Error('no key');
      const m = await chatCompletion({ apiKey, model: app.prefs.model, messages: [{ role: 'user', content: 'Responde solo: listo' }] });
      toast(`DeepSeek responde: «${(m.content || '').trim().slice(0, 40)}»`);
    } catch (e) {
      toast(String(e).includes('no key') ? 'Primero pega una key de DeepSeek.' : 'DeepSeek no respondió. Revisa la key y el saldo.');
    }
    setTesting(false);
  };
  const alert = async () => {
    const home = sectorById(app.prefs.homeId);
    const ok = await scheduleDemoAlert({
      title: `Peligro en ${home.name}`,
      body: 'Lluvia muy fuerte en unos 30 minutos y el río está alto. Toca para ver qué hacer.',
      seconds: 5,
      to: '/danger',
    });
    toast(ok ? 'Bloquea el celular: el aviso llega en 5 segundos.' : 'Sin permiso para avisos. Actívalo en los ajustes del celular.');
  };

  return (
    <Screen>
      <Header
        title="Ajustes"
        right={
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Cerrar">
            <Icon name="close" size={24} color={C.ink} />
          </Pressable>
        }
      />

      <Card style={{ gap: 10 }}>
        <T kind="bold">Demo para el pitch</T>
        <T kind="soft">Si hoy no llueve, el aguacero simulado muestra cómo responde la app a una tormenta que llega en 2 horas.</T>
        <Segmented options={SCENARIOS} value={app.prefs.scenario} onChange={(v) => app.updatePrefs({ scenario: v })} />
        <Button kind="light" icon="bell" label="Simular aviso en 5 segundos" onPress={alert} />
        <Button kind="light" icon="alert" label="Abrir modo peligro" onPress={() => router.push('/danger')} />
        <Button
          kind="light"
          icon="people"
          label="Papá pide ayuda"
          onPress={() => {
            fam.triggerSos('dad');
            router.navigate('/family');
          }}
        />
        <Button
          kind="light"
          label="Ver la bienvenida otra vez"
          onPress={() => {
            app.updatePrefs({ onboarded: false });
            router.replace('/welcome');
          }}
        />
      </Card>

      <Card style={{ gap: 10 }}>
        <T kind="bold">Nuria con IA (DeepSeek)</T>
        <T kind="soft">
          {stored ? 'Hay una key guardada en este celular.' : envKey ? 'Nuria usa la key del archivo .env.' : 'Sin key: Nuria responde con lo básico, sin IA.'}
        </T>
        <TextInput
          value={key}
          onChangeText={setKey}
          placeholder={stored ? 'Pega otra key para cambiarla' : 'Pega aquí tu key (sk-…)'}
          placeholderTextColor={C.muted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button label={key.trim() ? 'Guardar key' : stored ? 'Borrar key' : 'Guardar key'} onPress={saveKey} style={{ flex: 1 }} disabled={!key.trim() && !stored} />
          <Button kind="light" label={testing ? 'Probando…' : 'Probar'} onPress={test} style={{ flex: 1 }} disabled={testing} />
        </View>
        <Segmented options={MODELS} value={app.prefs.model} onChange={(v) => app.updatePrefs({ model: v })} />
        <T kind="fine" style={{ textAlign: 'left' }}>
          La key queda cifrada en este celular. Usa una key solo para la demo, con poco saldo, y bórrala después del hackathon.
        </T>
      </Card>

      <Card style={{ gap: 8 }}>
        <T kind="bold">Mis lugares</T>
        {(
          [
            ['homeId', 'Casa'],
            ['workId', 'Trabajo'],
            ['schoolId', 'Colegio'],
          ] as [PlaceKey, string][]
        ).map(([k, label]) => (
          <Row key={k} title={label} sub={sectorById(app.prefs[k]).name} onPress={() => setEditing(k)} />
        ))}
      </Card>

      <Card style={{ gap: 8 }}>
        <T kind="bold">De dónde salen los datos</T>
        <Bullets
          textStyle={{ fontSize: 14 }}
          items={[
            'Lluvia por hora: Open-Meteo, para cada barrio.',
            'Subida y bajada del río: modelo de marea de Open-Meteo.',
            'Nubes: satélite GOES-19 de la NOAA, vía NASA.',
            'Calles y rutas: OpenStreetMap.',
            'Nuria: DeepSeek V4 Flash, un modelo abierto (licencia MIT), con los datos de la app.',
            'Terreno de cada barrio, reportes de vecinos y familia: datos de ejemplo.',
          ]}
        />
      </Card>
      <T kind="fine">
        Nuria {Constants.expoConfig?.version} · prototipo para hackathon{'\n'}No es una fuente oficial. En una emergencia, llama al 911.
      </T>

      <SectorSheet visible={!!editing} onClose={() => setEditing(null)} value={editing ? app.prefs[editing] : ''} onPick={(id) => editing && app.updatePrefs({ [editing]: id })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { backgroundColor: C.paper, borderRadius: 12, borderWidth: 1, borderColor: C.line, paddingHorizontal: 12, paddingVertical: 11, fontFamily: F.body, fontSize: 15, color: C.ink },
});
