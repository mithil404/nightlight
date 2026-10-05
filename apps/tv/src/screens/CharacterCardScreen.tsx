import React, {useEffect, useRef, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {FocusTile} from '../components/FocusTile';
import {HeroAvatar} from '../components/HeroAvatar';
import {Screen} from '../components/Screen';
import {drawnHero} from '../data/showcase';
import {useRouter} from '../navigation/router';
import {useShowcase} from '../state';
import {colors, s, type} from '../theme';

const REVEAL_MS = 2200;

/** The child's drawing next to the storybook hero made from it. */
export function CharacterCardScreen() {
  const {popTo, back} = useRouter();
  const {addDrawnHero} = useShowcase();
  const [revealed, setRevealed] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Showcase: a short "bringing it to life" beat stands in for generation time.
    const reveal = Animated.timing(fade, {toValue: 1, duration: 700, useNativeDriver: true});
    const timer = setTimeout(() => {
      setRevealed(true);
      reveal.start();
    }, REVEAL_MS);
    return () => {
      clearTimeout(timer);
      reveal.stop();
    };
  }, [fade]);

  return (
    <Screen title={revealed ? `Meet ${drawnHero.name}` : 'Bringing your drawing to life…'} subtitle={revealed ? `A ${drawnHero.kind}, three legs and all.` : undefined}>
      <View style={styles.row}>
        <View style={[styles.panel, styles.paper]}>
          <HeroAvatar hero={drawnHero} size={s(360)} wobbly />
          <Text style={styles.captionDark}>Your drawing</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
        <Animated.View style={[styles.panel, styles.storybook, {opacity: fade}]}>
          <View style={styles.halo} />
          <HeroAvatar hero={drawnHero} size={s(360)} />
          <Text style={styles.caption}>Storybook hero</Text>
        </Animated.View>
      </View>
      {revealed && (
        <TVFocusGuideView autoFocus style={styles.actions}>
          <FocusTile
            testID="accept-hero"
            label="Use this hero"
            hasTVPreferredFocus
            onPress={() => {
              addDrawnHero();
              popTo({name: 'wizard', heroId: drawnHero.id});
            }}
            width={s(380)}
            height={s(130)}
          />
          <FocusTile testID="retry-hero" label="Try again" onPress={back} width={s(300)} height={s(130)} />
        </TVFocusGuideView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  panel: {
    width: s(560),
    height: s(520),
    borderRadius: s(28),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  paper: {
    backgroundColor: '#EFE6D6',
  },
  storybook: {
    backgroundColor: '#2A2F6B',
  },
  halo: {
    position: 'absolute',
    width: s(440),
    height: s(440),
    borderRadius: s(220),
    backgroundColor: colors.moon,
    opacity: 0.15,
  },
  arrow: {
    color: colors.amber,
    fontSize: s(96),
    marginHorizontal: s(48),
  },
  caption: {
    color: colors.ink,
    fontSize: type.body,
    marginTop: s(12),
  },
  captionDark: {
    color: '#2B2140',
    fontSize: type.body,
    marginTop: s(12),
  },
  actions: {
    flexDirection: 'row',
    marginTop: s(48),
  },
});
