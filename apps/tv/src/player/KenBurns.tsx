import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';

interface KenBurnsProps {
  /** Changing this restarts the pan/zoom (one move per page). */
  pageKey: string | number;
  durationMs: number;
  paused: boolean;
  /** Alternate pan direction per page. */
  direction: 1 | -1;
  panPx: number;
  children: React.ReactNode;
}

/** Slow zoom + pan over the page illustration, on the native driver. Pauses with the story. */
export function KenBurns({pageKey, durationMs, paused, direction, panPx, children}: KenBurnsProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const at = useRef(0);

  // New page: start from the beginning.
  useEffect(() => {
    at.current = 0;
    progress.setValue(0);
  }, [pageKey, progress]);

  useEffect(() => {
    if (paused) {
      progress.stopAnimation(value => {
        at.current = value;
      });
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: Math.max(0, (1 - at.current) * durationMs),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [pageKey, paused, durationMs, progress]);

  const scale = progress.interpolate({inputRange: [0, 1], outputRange: [1.02, 1.14]});
  const translateX = progress.interpolate({inputRange: [0, 1], outputRange: [0, direction * panPx]});

  return <Animated.View style={[StyleSheet.absoluteFill, {transform: [{scale}, {translateX}]}]}>{children}</Animated.View>;
}
