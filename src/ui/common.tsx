import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Prefs } from '@/state/storage';
import { F } from './theme';
import { PressableScale } from './PressableScale';

export const placeLabel = (prefs: Prefs, id: string) => (id === prefs.homeId ? 'Casa' : id === prefs.workId ? 'Trabajo' : id === prefs.schoolId ? 'Colegio' : null);

export function ScenarioBanner() {
  return (
    <PressableScale onPress={() => router.push('/settings')} style={styles.banner}>
      <Text style={styles.text}>🎬 Escenario de demostración: aguacero simulado. Toca para cambiarlo.</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#FFF3D3', borderColor: '#F1CF74', borderWidth: 1, borderRadius: 12, padding: 10 },
  text: { fontFamily: F.bold, fontSize: 13, color: '#8A6200' },
});
