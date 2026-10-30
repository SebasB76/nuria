import { useState } from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { CSSStyle, cubicBezier } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// press feedback for everything tappable: a 3% scale in 120 ms, shown on press-in, not on release.
// Only a disabled control that has an action fades; a display-only chip keeps its color.
export function PressableScale({ style, onPressIn, onPressOut, disabled, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  const [pressed, setPressed] = useState(false);
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      pressRetentionOffset={16}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={[style, styles.base, pressed && styles.pressed, disabled && rest.onPress && styles.disabled]}
    />
  );
}

// RN's StyleSheet types don't know Reanimated's CSS transition keys, so these stay plain objects
const styles: Record<'base' | 'pressed' | 'disabled', CSSStyle> = {
  base: {
    transform: [{ scale: 1 }],
    transitionProperty: 'transform',
    transitionDuration: '120ms',
    transitionTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
  },
  pressed: { transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.5 },
};
