import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {FocusTile} from '../components/FocusTile';
import {colors, s, safe, type} from '../theme';

export const CHOICE_SECONDS = 20;

/**
 * Two large option cards and a soft countdown. If nobody chooses, the first option is picked
 * so the story keeps going at bedtime.
 */
export function ChoiceOverlay({
  prompt,
  options,
  paused,
  onChoose,
}: {
  prompt: string;
  options: {label: string}[];
  paused: boolean;
  onChoose: (index: number) => void;
}) {
  const [left, setLeft] = useState(CHOICE_SECONDS);

  useEffect(() => {
    if (paused) {
      return;
    }
    if (left <= 0) {
      onChoose(0);
      return;
    }
    const timer = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(timer);
  }, [left, paused, onChoose]);

  return (
    <View style={styles.scrim} testID="choice-overlay">
      <Text style={styles.prompt}>{prompt}</Text>
      <TVFocusGuideView autoFocus trapFocusUp trapFocusDown style={styles.options}>
        {options.map((option, i) => (
          <FocusTile
            key={option.label}
            testID={`choice-${i}`}
            label={option.label}
            hasTVPreferredFocus={i === 0}
            onPress={() => onChoose(i)}
            width={s(620)}
            height={s(220)}
          />
        ))}
      </TVFocusGuideView>
      <View style={styles.countdownTrack}>
        <View style={[styles.countdownFill, {width: `${(left / CHOICE_SECONDS) * 100}%`}]} />
      </View>
      <Text style={styles.countdownText}>{paused ? 'Paused' : `Choosing for you in ${left}…`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 11, 31, 0.78)',
    paddingHorizontal: safe.horizontal,
    justifyContent: 'center',
  },
  prompt: {
    color: colors.ink,
    fontSize: type.title,
    fontWeight: '700',
    marginBottom: s(56),
    maxWidth: s(1400),
  },
  options: {
    flexDirection: 'row',
  },
  countdownTrack: {
    height: s(10),
    borderRadius: s(5),
    backgroundColor: colors.nightCard,
    marginTop: s(56),
    width: s(1280),
    overflow: 'hidden',
  },
  countdownFill: {
    height: '100%',
    backgroundColor: colors.amber,
  },
  countdownText: {
    color: colors.inkMuted,
    fontSize: type.caption,
    marginTop: s(16),
  },
});
