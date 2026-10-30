import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F } from './theme';

const ToastContext = createContext<(text: string) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [text, setText] = useState('');
  const [opacity] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const insets = useSafeAreaInsets();

  const show = useCallback(
    (t: string) => {
      setText(t);
      clearTimeout(timer.current);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      timer.current = setTimeout(() => Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(), 3200);
    },
    [opacity],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <Animated.View pointerEvents="none" style={[styles.toast, { opacity, top: insets.top + 10 }]}>
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
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
