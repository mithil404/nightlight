import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, s, safe} from '../theme';
import {splitWords} from './narration';

/**
 * Captions with the current word highlighted. Each word is its own <Text> in a wrapping row
 * rather than nested <Text>, which the Vega template flags as unreliable.
 */
export function CaptionBar({text, wordIndex}: {text: string; wordIndex: number}) {
  const words = splitWords(text);
  return (
    <View style={styles.bar} testID="caption-bar">
      <View style={styles.words}>
        {words.map((word, i) => (
          <Text key={i} style={[styles.word, i < wordIndex && styles.read, i === wordIndex && styles.current]}>
            {word}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: safe.horizontal,
    right: safe.horizontal,
    bottom: safe.vertical,
    backgroundColor: 'rgba(14, 11, 31, 0.72)',
    borderRadius: s(24),
    paddingHorizontal: s(40),
    paddingVertical: s(28),
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  word: {
    color: colors.inkFaint,
    fontSize: s(40),
    lineHeight: s(56),
    marginRight: s(12),
  },
  read: {
    color: colors.ink,
  },
  current: {
    color: colors.moon,
    fontWeight: '700',
  },
});
