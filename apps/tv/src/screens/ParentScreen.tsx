import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {FocusTile} from '../components/FocusTile';
import {Screen} from '../components/Screen';
import {lessons} from '../data/showcase';
import {useShowcase} from '../state';
import {colors, s, type} from '../theme';

/** Showcase PIN. A real build stores a hash per household (PLAN.md §5). */
export const DEMO_PIN = '1234';
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'Del', '0', 'OK'];

export function ParentScreen() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked ? <ParentSettings /> : <PinPad onUnlock={() => setUnlocked(true)} />;
}

function PinPad({onUnlock}: {onUnlock: () => void}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const press = (key: string) => {
    setError(false);
    if (key === 'Del') {
      setPin(p => p.slice(0, -1));
    } else if (key === 'OK') {
      if (pin === DEMO_PIN) {
        onUnlock();
      } else {
        setError(true);
        setPin('');
      }
    } else if (pin.length < 4) {
      setPin(p => p + key);
    }
  };

  return (
    <Screen title="Parents only" subtitle={`Enter your PIN (showcase PIN: ${DEMO_PIN})`} hint="Back: home">
      <View style={styles.pinRow}>
        <View>
          <View style={styles.dots}>
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
            ))}
          </View>
          {error ? <Text style={styles.error}>That PIN didn't match. Try again.</Text> : null}
        </View>
        <TVFocusGuideView autoFocus style={styles.pad}>
          {KEYS.map((key, i) => (
            <FocusTile key={key} testID={`pin-${key}`} label={key} hasTVPreferredFocus={i === 0} onPress={() => press(key)} width={s(150)} height={s(110)} style={styles.key} />
          ))}
        </TVFocusGuideView>
      </View>
    </Screen>
  );
}

function ParentSettings() {
  const {captions, setCaptions, allowedLessons, toggleLesson} = useShowcase();
  const [cleared, setCleared] = useState(false);

  return (
    <Screen title="Parent settings" subtitle="Guardrails stay on for every story: no scary content above the age band, no real brands or people." hint="Back: home">
      <Text style={styles.sectionTitle}>Captions</Text>
      <TVFocusGuideView autoFocus style={styles.row}>
        <FocusTile testID="captions-toggle" label={captions ? 'Captions on' : 'Captions off'} detail="Select to toggle" selected={captions} hasTVPreferredFocus onPress={() => setCaptions(!captions)} width={s(320)} height={s(130)} />
      </TVFocusGuideView>

      <Text style={styles.sectionTitle}>Lessons the wizard can offer</Text>
      <TVFocusGuideView autoFocus style={styles.row}>
        {lessons
          .filter(l => l.id !== 'none')
          .map(l => (
            <FocusTile key={l.id} testID={`allow-${l.id}`} label={l.label} detail={allowedLessons.includes(l.id) ? 'Allowed' : 'Hidden'} selected={allowedLessons.includes(l.id)} onPress={() => toggleLesson(l.id)} width={s(250)} height={s(130)} />
          ))}
      </TVFocusGuideView>

      <Text style={styles.sectionTitle}>Data</Text>
      <TVFocusGuideView autoFocus style={styles.row}>
        <FocusTile testID="delete-data" label={cleared ? 'Nothing stored' : 'Delete drawings & stories'} detail="Drawing photos auto-delete after 24 h" onPress={() => setCleared(true)} width={s(520)} height={s(130)} />
      </TVFocusGuideView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    marginRight: s(120),
  },
  dot: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    borderWidth: s(4),
    borderColor: colors.inkMuted,
    marginRight: s(24),
  },
  dotFilled: {
    backgroundColor: colors.amber,
    borderColor: colors.amber,
  },
  error: {
    color: colors.ember,
    fontSize: type.caption,
    marginTop: s(24),
  },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: s(3 * 186),
    rowGap: s(28),
  },
  key: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.inkMuted,
    fontSize: type.heading,
    fontWeight: '700',
    marginBottom: s(16),
  },
  row: {
    flexDirection: 'row',
    marginBottom: s(32),
  },
});
