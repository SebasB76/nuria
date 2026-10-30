import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { NuriaAvatar } from './icons';
import { C } from './theme';

// fonts may not be loaded yet, so this screen uses system text
export function Splash() {
  return (
    <View style={styles.wrap}>
      <NuriaAvatar size={88} />
      <Text style={styles.title}>Nuria</Text>
      <Text style={styles.sub}>Mirando el cielo de Guayaquil…</Text>
      <ActivityIndicator color="#fff" style={{ marginTop: 18 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', gap: 6 },
  title: { color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 14, letterSpacing: -0.5 },
  sub: { color: '#BFE3F5', fontSize: 15 },
});
