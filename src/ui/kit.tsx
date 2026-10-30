import { ReactNode } from 'react';
import { Pressable, ScrollView, ScrollViewProps, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Level } from '@/data/places';
import { Drop, Icon, IconName } from './icons';
import { C, F } from './theme';

export function Screen({ children, scroll = true, style, ...rest }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> } & ScrollViewProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, style]} showsVerticalScrollIndicator={false} {...rest}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function T({ style, kind = 'body', ...rest }: TextProps & { kind?: 'body' | 'soft' | 'bold' | 'display' | 'label' | 'fine' }) {
  return <Text style={[styles[kind], style]} {...rest} />;
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  if (onPress)
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && { opacity: 0.85 }]}>
        {children}
      </Pressable>
    );
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  icon,
  style,
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'light' | 'danger' | 'wa';
  icon?: IconName | ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const bg = { primary: C.navy, light: '#fff', danger: C.peligro, wa: C.wa }[kind];
  const fg = kind === 'light' ? C.navy : '#fff';
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg }, kind === 'light' && styles.btnLight, style, (pressed || disabled) && { opacity: 0.7 }]}>
      {typeof icon === 'string' ? <Icon name={icon as IconName} size={18} color={fg} /> : icon}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, onPress, on, icon, style }: { label: string; onPress?: () => void; on?: boolean; icon?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, on && styles.chipOn, style, pressed && { opacity: 0.8 }]}>
      {icon}
      <Text style={[styles.chipText, on && { color: '#fff' }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Segmented<V extends string | number>({ options, value, onChange }: { options: { label: string; value: V }[]; value: V; onChange: (v: V) => void }) {
  return (
    <View style={styles.segm}>
      {options.map((o) => (
        <Pressable key={String(o.value)} onPress={() => onChange(o.value)} style={[styles.segmItem, o.value === value && styles.segmOn]}>
          <Text style={[styles.segmText, o.value === value && { color: '#fff' }]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function LevelPill({ level, size = 16 }: { level: Level; size?: number }) {
  return (
    <View style={styles.pill}>
      <Drop level={level} size={size} />
      <Text style={styles.pillText}>{level.name}</Text>
    </View>
  );
}

export function NuriaTip({ children, avatar }: { children: ReactNode; avatar: ReactNode }) {
  return (
    <View style={styles.tip}>
      {avatar}
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function Header({ title, right, left }: { title: string; right?: ReactNode; left?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
        {left}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function Bullets({ items, numbered, textStyle }: { items: (string | ReactNode)[]; numbered?: boolean; textStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={{ gap: 8 }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          {numbered ? (
            <View style={styles.num}>
              <Text style={styles.numText}>{i + 1}</Text>
            </View>
          ) : (
            <Text style={[styles.body, { color: C.cel }]}>•</Text>
          )}
          {typeof it === 'string' ? <Text style={[styles.body, { flex: 1 }, textStyle]}>{it}</Text> : <View style={{ flex: 1 }}>{it}</View>}
        </View>
      ))}
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  content: { padding: 16, paddingBottom: 120, gap: 12 },
  body: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.ink },
  soft: { fontFamily: F.body, fontSize: 13.5, lineHeight: 19, color: C.ink2 },
  bold: { fontFamily: F.bold, fontSize: 15, lineHeight: 21, color: C.ink },
  display: { fontFamily: F.display, fontSize: 28, lineHeight: 32, color: C.ink, letterSpacing: -0.5 },
  label: { fontFamily: F.bold, fontSize: 11.5, letterSpacing: 0.8, color: C.ink2, textTransform: 'uppercase' },
  fine: { fontFamily: F.body, fontSize: 12, lineHeight: 16, color: C.muted, textAlign: 'center' },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 14 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  btnLight: { borderWidth: 1.5, borderColor: C.line },
  btnText: { fontFamily: F.bold, fontSize: 15.5 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6DED0', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12 },
  chipOn: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  segm: { flexDirection: 'row', gap: 3, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E6DED0', borderRadius: 13, padding: 3 },
  segmItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  segmOn: { backgroundColor: C.navy },
  segmText: { fontFamily: F.bold, fontSize: 13, color: C.ink2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff', borderRadius: 999, borderWidth: 1, borderColor: C.line, paddingVertical: 3, paddingHorizontal: 9, alignSelf: 'flex-start' },
  pillText: { fontFamily: F.bold, fontSize: 13, color: C.ink },
  tip: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: C.navy, borderRadius: 18, padding: 13 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 },
  headerTitle: { fontFamily: F.display, fontSize: 24, color: C.ink, letterSpacing: -0.4 },
  num: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.celSoft, alignItems: 'center', justifyContent: 'center', marginTop: 0 },
  numText: { fontFamily: F.black, fontSize: 12, color: C.celDeep },
});
