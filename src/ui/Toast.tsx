import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, FadeInUp, FadeOutUp, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F } from './theme';

const ToastContext = createContext<(text: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

// enters and leaves through the top edge; the exit is ~20% faster because the reading is done
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER = FadeInUp.duration(260).easing(EASE_OUT).reduceMotion(ReduceMotion.System);
const EXIT = FadeOutUp.duration(210).easing(EASE_OUT).reduceMotion(ReduceMotion.System);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();

  const show = useCallback((text: string) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), text });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <Animated.View key={toast.id} entering={ENTER} exiting={EXIT} pointerEvents="none" style={[styles.toast, { top: insets.top + 10 }]}>
          <Text style={styles.text}>{toast.text}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: C.navy,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  text: { color: '#fff', fontFamily: F.bold, fontSize: 14, lineHeight: 19 },
});
