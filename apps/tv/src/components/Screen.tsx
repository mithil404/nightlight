import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors, s, safe, type} from '../theme';

/** Full-screen container with safe-area margins, an optional title and a hint line. */
export function Screen({
  title,
  subtitle,
  hint,
  children,
}: {
  title?: string;
  subtitle?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.root}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.body}>{children}</View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night,
    paddingHorizontal: safe.horizontal,
    paddingVertical: safe.vertical,
  },
  title: {
    color: colors.ink,
    fontSize: type.title,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.inkMuted,
    fontSize: type.body,
    marginTop: s(8),
  },
  body: {
    flex: 1,
    marginTop: s(40),
  },
  hint: {
    color: colors.inkFaint,
    fontSize: s(24),
  },
});
