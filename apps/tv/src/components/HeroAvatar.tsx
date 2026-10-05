import React from 'react';
import {StyleSheet, View} from 'react-native';
import type {Hero} from '../data/showcase';

/**
 * An original, shape-built character: a round body with a face and a silhouette feature per hero.
 * `wobbly` renders the "child's drawing" look for the character card.
 */
export function HeroAvatar({hero, size, wobbly = false}: {hero: Hero; size: number; wobbly?: boolean}) {
  const u = size / 10;
  const feature = {backgroundColor: hero.color, position: 'absolute' as const};
  const outline = wobbly ? {borderWidth: u * 0.35, borderColor: '#2B2140', borderStyle: 'dashed' as const} : null;

  return (
    <View style={{width: size, height: size}} testID={`hero-${hero.id}`}>
      {hero.shape === 'ears' && (
        <>
          <View style={[feature, outline, {left: u * 1.6, top: u * 0.6, width: u * 2.2, height: u * 3, borderRadius: u, transform: [{rotate: '-18deg'}]}]} />
          <View style={[feature, outline, {right: u * 1.6, top: u * 0.6, width: u * 2.2, height: u * 3, borderRadius: u, transform: [{rotate: '18deg'}]}]} />
        </>
      )}
      {hero.shape === 'antenna' && (
        <>
          <View style={[feature, {left: u * 4.8, top: u * 0.4, width: u * 0.4, height: u * 2}]} />
          <View style={[styles.round, styles.antennaTip, {backgroundColor: hero.accent, left: u * 4.4, width: u * 1.2, height: u * 1.2}]} />
        </>
      )}
      {hero.shape === 'hair' && (
        <View style={[feature, outline, styles.hair, {left: u * 1.4, top: u * 1, width: u * 7.2, height: u * 3.4, borderTopLeftRadius: u * 3.6, borderTopRightRadius: u * 3.6}]} />
      )}
      {hero.shape === 'horns' && (
        <>
          <View style={[feature, {left: u * 2.4, top: u * 0.8, width: u * 1.2, height: u * 2.2, borderTopLeftRadius: u, borderTopRightRadius: u, backgroundColor: hero.accent}]} />
          <View style={[feature, {right: u * 2.4, top: u * 0.8, width: u * 1.2, height: u * 2.2, borderTopLeftRadius: u, borderTopRightRadius: u, backgroundColor: hero.accent}]} />
        </>
      )}
      {/* Body */}
      <View
        style={[
          styles.round,
          outline,
          {
            backgroundColor: hero.color,
            left: u * 1.5,
            top: u * 2,
            width: u * 7,
            height: u * (wobbly ? 7.4 : 7),
            transform: wobbly ? [{rotate: '-4deg'}] : [],
          },
        ]}
      />
      {/* Muzzle / face patch */}
      <View style={[styles.round, {backgroundColor: hero.accent, left: u * 3, top: u * 5.2, width: u * 4, height: u * 2.8}]} />
      {/* Eyes */}
      <View style={[styles.round, styles.eye, {left: u * 3.4, top: u * 4.4, width: u * 0.9, height: u * 0.9}]} />
      <View style={[styles.round, styles.eye, {left: u * 5.7, top: u * 4.4, width: u * 0.9, height: u * 0.9}]} />
      {/* Nose */}
      <View style={[styles.round, styles.eye, {left: u * 4.6, top: u * 5.6, width: u * 0.8, height: u * 0.55}]} />
      {hero.legs === 3 && (
        <>
          {/* The child's drawing had three legs; the storybook hero keeps them. */}
          <View style={[feature, outline, {left: u * 2.6, top: u * 8.6, width: u * 0.9, height: u * 1.3, borderRadius: u * 0.4}]} />
          <View style={[feature, outline, {left: u * 4.55, top: u * 8.8, width: u * 0.9, height: u * 1.2, borderRadius: u * 0.4}]} />
          <View style={[feature, outline, {left: u * 6.5, top: u * 8.6, width: u * 0.9, height: u * 1.3, borderRadius: u * 0.4}]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  round: {
    position: 'absolute',
    borderRadius: 9999,
  },
  eye: {
    backgroundColor: '#1C1430',
  },
  antennaTip: {
    top: 0,
  },
  hair: {
    backgroundColor: '#5A3F8C',
  },
});
