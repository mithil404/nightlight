import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Dimensions, StyleSheet, Text, View} from 'react-native';
import {colors, s, safe, type} from '../theme';

const SLEEP_TIMER_S = 10 * 60;

/** Night-light screen after the goodnight page: a dim, slowly twinkling star field and a sleep timer. */
export function SleepScreen({listenerName}: {listenerName: string}) {
  const {width, height} = Dimensions.get('window');
  const [left, setLeft] = useState(SLEEP_TIMER_S);
  const twinkle = useRef(new Animated.Value(0.35)).current;
  const goodnight = useRef(new Animated.Value(1)).current;

  const stars = useMemo(() => {
    let x = 4242;
    const rand = () => {
      x = (x * 16807) % 2147483647;
      return x / 2147483647;
    };
    return Array.from({length: 70}, () => ({left: rand() * width, top: rand() * height, size: 2 + rand() * 4}));
  }, [width, height]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {toValue: 0.8, duration: 3000, useNativeDriver: true}),
        Animated.timing(twinkle, {toValue: 0.35, duration: 3000, useNativeDriver: true}),
      ]),
    );
    // The goodnight message fades away so only the night light remains.
    const fade = Animated.timing(goodnight, {toValue: 0, delay: 6000, duration: 4000, useNativeDriver: true});
    loop.start();
    fade.start();
    return () => {
      loop.stop();
      fade.stop();
    };
  }, [twinkle, goodnight]);

  useEffect(() => {
    if (left <= 0) {
      return;
    }
    const timer = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <View style={styles.root} testID="sleep-screen">
      <Animated.View style={[StyleSheet.absoluteFill, {opacity: left > 0 ? twinkle : 0}]}>
        {stars.map((st, i) => (
          <View key={i} style={[styles.star, {left: st.left, top: st.top, width: st.size, height: st.size, borderRadius: st.size}]} />
        ))}
      </Animated.View>
      <Animated.View style={[styles.center, {opacity: goodnight}]}>
        <View style={styles.moon} />
        <Text style={styles.goodnight}>Goodnight, {listenerName}</Text>
      </Animated.View>
      <Text style={styles.timer}>{left > 0 ? `Night light off in ${mm}:${ss}` : ''}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#05040C',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#FFE9B0',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moon: {
    width: s(140),
    height: s(140),
    borderRadius: s(70),
    backgroundColor: colors.moon,
    opacity: 0.7,
    marginBottom: s(36),
  },
  goodnight: {
    color: colors.inkMuted,
    fontSize: type.title,
  },
  timer: {
    position: 'absolute',
    right: safe.horizontal,
    bottom: safe.vertical,
    color: colors.inkFaint,
    fontSize: s(26),
    opacity: 0.6,
  },
});
