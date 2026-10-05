import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle} from 'react-native';
import {colors, focusRing, s, type} from '../theme';

export interface FocusTileProps {
  label: string;
  detail?: string;
  onPress: () => void;
  /** Artwork shown above the label. */
  children?: React.ReactNode;
  width?: number;
  height?: number;
  selected?: boolean;
  hasTVPreferredFocus?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** Large D-pad tile (≥ 240 px) with a physical focus change: scale + border. */
export function FocusTile({
  label,
  detail,
  onPress,
  children,
  width = s(300),
  height = s(260),
  selected,
  hasTVPreferredFocus,
  testID,
  style,
}: FocusTileProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={[
        styles.tile,
        {width, height},
        selected && styles.selected,
        focused && styles.focused,
        style,
      ]}>
      {children ? <View style={styles.art}>{children}</View> : null}
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      {detail ? (
        <Text style={styles.detail} numberOfLines={2}>
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: colors.nightCard,
    borderRadius: s(28),
    borderWidth: s(5),
    borderColor: 'transparent',
    padding: s(24),
    justifyContent: 'flex-end',
    marginRight: s(36),
  },
  selected: {
    borderColor: colors.amber,
  },
  focused: focusRing,
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(12),
  },
  label: {
    color: colors.ink,
    fontSize: type.body,
    fontWeight: '700',
  },
  detail: {
    color: colors.inkMuted,
    fontSize: s(24),
    marginTop: s(6),
  },
});
