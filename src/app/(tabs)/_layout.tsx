import { Redirect } from 'expo-router';
import { BottomTabBarProps, Tabs } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useApp } from '@/state/AppState';
import { Icon, IconName, NuriaAvatar } from '@/ui/icons';
import { C, F } from '@/ui/theme';

const TABS: Record<string, { label: string; icon?: IconName }> = {
  index: { label: 'Hoy', icon: 'home' },
  map: { label: 'Mapa', icon: 'map' },
  nuria: { label: 'Nuria' },
  route: { label: 'Ruta', icon: 'route' },
  family: { label: 'Familia', icon: 'people' },
};

export default function TabsLayout() {
  const { prefs } = useApp();
  if (!prefs.onboarded) return <Redirect href="/welcome" />;
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(p) => <TabBar {...p} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="map" />
      <Tabs.Screen name="nuria" />
      <Tabs.Screen name="route" />
      <Tabs.Screen name="family" />
    </Tabs>
  );
}

function TabBar({ state, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name], on = state.index === i;
        const go = () => !on && navigateToTab(route.key);
        if (!tab.icon)
          return (
            <Pressable key={route.key} onPress={go} style={styles.tab} accessibilityRole="button" accessibilityLabel="Hablar con Nuria">
              <View style={[styles.nuria, on && { borderColor: C.cel }]}>
                <NuriaAvatar size={52} />
              </View>
              <Text style={[styles.label, { color: C.navy, marginTop: 2 }]}>{tab.label}</Text>
            </Pressable>
          );
        return (
          <Pressable key={route.key} onPress={go} style={styles.tab} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Icon name={tab.icon} size={23} color={on ? C.navy : '#9AA19D'} strokeWidth={on ? 2.3 : 2} />
            <Text style={[styles.label, on && { color: C.navy }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontFamily: F.bold, fontSize: 11, color: '#9AA19D' },
  nuria: { marginTop: -30, borderRadius: 32, borderWidth: 4, borderColor: '#fff', shadowColor: C.navy, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 8, backgroundColor: '#fff' },
});
