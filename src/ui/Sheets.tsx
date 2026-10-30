import { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PLACES, SECTORS } from '@/data/places';
import { NamedPoint } from '@/data/route';
import { useApp } from '@/state/AppState';
import { Drop, Icon } from './icons';
import { C, F } from './theme';
import { PressableScale } from './PressableScale';

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.grab} />
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Cerrar">
            <Icon name="close" size={22} color={C.ink2} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: 6, paddingBottom: 8 }}>
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function Row({ left, title, sub, onPress, on }: { left?: ReactNode; title: string; sub?: string; onPress: () => void; on?: boolean }) {
  return (
    <PressableScale onPress={onPress} style={[styles.row, on && styles.rowOn]}>
      {left}
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      {on && <Icon name="check" size={18} color={C.tranquilo} strokeWidth={2.6} />}
    </PressableScale>
  );
}

export function SectorSheet({ visible, onClose, value, onPick, title = 'Elige un barrio' }: { visible: boolean; onClose: () => void; value: string; onPick: (id: string) => void; title?: string }) {
  const { risk } = useApp();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {SECTORS.map((s) => (
        <Row
          key={s.id}
          on={s.id === value}
          left={<Drop level={risk[s.id].level} size={26} />}
          title={s.name}
          sub={`${risk[s.id].level.name} · ${risk[s.id].level.short}`}
          onPress={() => {
            onPick(s.id);
            onClose();
          }}
        />
      ))}
    </Sheet>
  );
}

export function PlaceSheet({
  visible,
  onClose,
  title,
  value,
  onPick,
  onLocate,
  onPickOnMap,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onPick: (p: NamedPoint) => void;
  onLocate: () => void;
  onPickOnMap: () => void;
}) {
  const { customPoints } = useApp();
  const pick = (p: NamedPoint) => {
    onPick(p);
    onClose();
  };
  const groups: [string, NamedPoint[]][] = [
    ['Tus puntos', customPoints],
    ['Barrios', PLACES.filter((p) => p.group === 'Barrios')],
    ['Lugares', PLACES.filter((p) => p.group === 'Lugares')],
  ];
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
        <PressableScale style={styles.action} onPress={() => (onClose(), onLocate())}>
          <Icon name="locate" size={18} color={C.celDeep} />
          <Text style={styles.actionText}>Mi ubicación</Text>
        </PressableScale>
        <PressableScale style={styles.action} onPress={() => (onClose(), onPickOnMap())}>
          <Icon name="pin" size={18} color={C.celDeep} />
          <Text style={styles.actionText}>Elegir en el mapa</Text>
        </PressableScale>
      </View>
      {groups.map(([g, list]) =>
        list.length ? (
          <View key={g} style={{ gap: 6 }}>
            <Text style={styles.group}>{g}</Text>
            {list.map((p) => (
              <Row key={p.id} title={p.name} on={p.id === value} onPress={() => pick(p)} />
            ))}
          </View>
        ) : null,
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(16,40,58,0.35)' },
  sheet: { backgroundColor: C.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 8 },
  grab: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D5CDBF', alignSelf: 'center', marginBottom: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontFamily: F.display, fontSize: 21, color: C.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: C.line, paddingVertical: 11, paddingHorizontal: 12 },
  rowOn: { borderColor: C.tranquilo },
  rowTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink },
  rowSub: { fontFamily: F.body, fontSize: 12.5, color: C.ink2, marginTop: 1 },
  group: { fontFamily: F.bold, fontSize: 12, color: C.ink2, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 8 },
  action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.celSoft, borderRadius: 14, paddingVertical: 11 },
  actionText: { fontFamily: F.bold, fontSize: 14, color: C.celDeep },
});
