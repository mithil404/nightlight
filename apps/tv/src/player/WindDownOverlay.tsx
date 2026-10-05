import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet} from 'react-native';
import {colors} from '../theme';

/** Warm tint up and brightness down as story energy falls. Opacity only, on the native driver. */
export function WindDownOverlay({energy}: {energy: number}) {
  const calm = 1 - Math.min(1, Math.max(0, energy));
  const warm = useRef(new Animated.Value(calm * 0.28)).current;
  const dim = useRef(new Animated.Value(calm * 0.45)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(warm, {toValue: calm * 0.28, duration: 2500, useNativeDriver: true}),
      Animated.timing(dim, {toValue: calm * 0.45, duration: 2500, useNativeDriver: true}),
    ]);
    animation.start();
    return () => animation.stop();
  }, [calm, warm, dim]);

  return (
    <>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.warm, {opacity: warm}]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dim, {opacity: dim}]} />
    </>
  );
}

const styles = StyleSheet.create({
  warm: {
    backgroundColor: colors.warmTint,
  },
  dim: {
    backgroundColor: '#000000',
  },
});
