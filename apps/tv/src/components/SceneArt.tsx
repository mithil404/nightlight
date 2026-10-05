import React, {useMemo} from 'react';
import {StyleSheet, View, type ViewStyle} from 'react-native';
import type {ArtStyle, Hero, SceneProp, World} from '../data/showcase';
import {HeroAvatar} from './HeroAvatar';

/** Deterministic pseudo-random numbers so a scene always looks the same. */
function seeded(seed: number) {
  let x = seed % 2147483647 || 1;
  return () => {
    x = (x * 16807) % 2147483647;
    return (x - 1) / 2147483646;
  };
}

function hash(text: string) {
  let h = 7;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 2147483647;
  }
  return Math.abs(h);
}

interface SceneArtProps {
  world: World;
  style: ArtStyle;
  hero: Hero;
  props: SceneProp[];
  width: number;
  height: number;
}

/**
 * A storybook illustration built from shapes. Stands in for generated artwork in the static showcase;
 * the world sets the palette and the art style sets outlines and softness.
 */
export function SceneArt({world, style, hero, props, width, height}: SceneArtProps) {
  const has = (p: SceneProp) => props.includes(p);
  const stroke: ViewStyle = {
    borderWidth: style.outline,
    borderColor: style.outlineColor,
    borderStyle: style.dashed ? 'dashed' : 'solid',
    opacity: style.softness,
  };

  const stars = useMemo(() => {
    const rand = seeded(hash(world.id));
    return Array.from({length: 46}, () => ({
      x: rand() * width,
      y: rand() * height * 0.55,
      r: 2 + rand() * 4,
      o: 0.35 + rand() * 0.6,
    }));
  }, [world.id, width, height]);

  const moonClose = has('moonClose');
  const moonSize = moonClose ? height * 0.34 : height * 0.16;
  const heroSize = height * 0.3;

  return (
    <View style={[styles.fill, {width, height, backgroundColor: world.sky}]}>
      {/* Horizon glow: stacked translucent bands stand in for a gradient. */}
      {[0.18, 0.12, 0.08].map((o, i) => (
        <View
          key={i}
          style={[styles.abs, styles.band, {height: height * (0.65 - i * 0.15), backgroundColor: world.horizon, opacity: o + 0.1}]}
        />
      ))}
      {stars.map((st, i) => (
        <View key={i} style={[styles.round, {left: st.x, top: st.y, width: st.r, height: st.r, opacity: st.o}, styles.star]} />
      ))}
      {/* Moon with halo */}
      <View
        style={[
          styles.round,
          {
            width: moonSize * 1.8,
            height: moonSize * 1.8,
            left: width * (moonClose ? 0.56 : 0.74) - moonSize * 0.4,
            top: height * (moonClose ? 0.1 : 0.08) - moonSize * 0.4,
          },
          styles.moonHalo,
        ]}
      />
      <View
        style={[
          styles.round,
          stroke,
          {
            width: moonSize,
            height: moonSize,
            left: width * (moonClose ? 0.56 : 0.74),
            top: height * (moonClose ? 0.1 : 0.08),
          },
          styles.moon,
        ]}
      />
      {/* Far and near ground */}
      <View style={[styles.round, stroke, {left: -width * 0.2, top: height * 0.62, width: width * 0.9, height: height * 0.8, backgroundColor: world.groundFar}]} />
      <View style={[styles.round, stroke, {left: width * 0.35, top: height * 0.58, width: width * 0.95, height: height * 0.8, backgroundColor: world.groundFar}]} />
      {has('hill') && (
        <View style={[styles.round, stroke, {left: width * 0.3, top: height * 0.42, width: width * 0.5, height: height * 0.9, backgroundColor: world.ground}]} />
      )}
      <View style={[styles.round, stroke, {left: -width * 0.1, top: height * 0.76, width: width * 1.2, height: height * 0.7, backgroundColor: world.ground}]} />

      {has('owl') && (
        <View style={[styles.abs, {left: width * 0.12, top: height * 0.44}]}>
          <View style={[styles.round, stroke, {width: height * 0.14, height: height * 0.17}, styles.owl]} />
          <View style={[styles.round, styles.owlEye, {left: height * 0.025, top: height * 0.04, width: height * 0.04, height: height * 0.04}]} />
          <View style={[styles.round, styles.owlEye, {left: height * 0.075, top: height * 0.04, width: height * 0.04, height: height * 0.04}]} />
        </View>
      )}
      {has('fireflies') &&
        stars.slice(0, 14).map((st, i) => (
          <View
            key={`f${i}`}
            style={[styles.round, {left: width * 0.25 + (st.x % (width * 0.45)), top: height * 0.35 + (st.y % (height * 0.3))}, styles.firefly]}
          />
        ))}
      {has('lantern') && (
        <View style={[styles.abs, {left: width * (moonClose ? 0.62 : 0.6), top: height * (moonClose ? 0.3 : 0.5)}]}>
          <View style={[styles.round, styles.lanternGlow, {left: -height * 0.06, top: -height * 0.06, width: height * 0.2, height: height * 0.2}]} />
          <View style={[stroke, styles.lantern, {width: height * 0.08, height: height * 0.1, borderRadius: height * 0.025}]} />
        </View>
      )}
      <View
        style={[
          styles.abs,
          {
            left: width * (has('bed') ? 0.36 : 0.22),
            top: height * (has('bed') ? 0.64 : 0.56),
            transform: has('bed') ? [{rotate: '-12deg'}] : [],
          },
        ]}>
        <HeroAvatar hero={hero} size={heroSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    overflow: 'hidden',
  },
  abs: {
    position: 'absolute',
  },
  round: {
    position: 'absolute',
    borderRadius: 9999,
  },
  band: {
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    backgroundColor: '#FFF6DA',
  },
  moonHalo: {
    backgroundColor: '#FFE9B0',
    opacity: 0.12,
  },
  moon: {
    backgroundColor: '#FFE9B0',
  },
  owl: {
    backgroundColor: '#8A6A4E',
  },
  owlEye: {
    backgroundColor: '#FFE9B0',
  },
  firefly: {
    width: 10,
    height: 10,
    backgroundColor: '#FFD27A',
    opacity: 0.9,
  },
  lanternGlow: {
    backgroundColor: '#FFB45E',
    opacity: 0.18,
  },
  lantern: {
    backgroundColor: '#FFB45E',
  },
});
