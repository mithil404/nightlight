import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {FocusTile} from '../components/FocusTile';
import {Screen} from '../components/Screen';
import {useRouter} from '../navigation/router';
import {colors, s, type} from '../theme';

const CODE = 'MOON-42';
const GRID = 21;

/**
 * "Draw your own" pairing panel. In the showcase build the QR is decorative (there's no companion
 * service yet), so a sample drawing stands in for the phone upload.
 */
export function PairingScreen() {
  const {push} = useRouter();

  // A fixed QR-like pattern with the three finder squares, purely illustrative.
  const cells = useMemo(() => {
    const out: boolean[] = [];
    let x = 1337;
    for (let i = 0; i < GRID * GRID; i++) {
      x = (x * 48271) % 2147483647;
      const r = Math.floor(i / GRID);
      const c = i % GRID;
      const finder = [
        [0, 0],
        [0, GRID - 7],
        [GRID - 7, 0],
      ].find(([fr, fc]) => r >= fr && r < fr + 7 && c >= fc && c < fc + 7);
      if (finder) {
        const lr = r - finder[0];
        const lc = c - finder[1];
        const ring = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const core = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        out.push(ring || core);
      } else {
        out.push(x % 3 === 0);
      }
    }
    return out;
  }, []);
  const cell = s(16);

  return (
    <Screen title="Draw your own hero" subtitle="Draw a character on paper, then send a photo from your phone." hint="Back: choose a different hero">
      <View style={styles.row}>
        <View style={styles.qrCard}>
          <View style={[styles.qr, {width: cell * GRID, height: cell * GRID}]}>
            {cells.map((on, i) => (on ? <View key={i} style={[styles.qrCell, {width: cell, height: cell, left: (i % GRID) * cell, top: Math.floor(i / GRID) * cell}]} /> : null))}
          </View>
          <Text style={styles.code}>nightlight.app/c/{CODE}</Text>
        </View>
        <View style={styles.steps}>
          {['Draw your hero on paper', 'Scan the code with a phone', 'Snap a photo and tap “Send to TV”'].map((step, i) => (
            <View key={step} style={styles.step}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
          <View style={styles.status}>
            <View style={styles.pulse} />
            <Text style={styles.statusText}>Waiting for a photo…</Text>
          </View>
          <FocusTile
            testID="use-sample-drawing"
            label="Use the sample drawing"
            detail="Showcase: stands in for the phone upload"
            hasTVPreferredFocus
            onPress={() => push({name: 'characterCard'})}
            width={s(560)}
            height={s(150)}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrCard: {
    backgroundColor: colors.ink,
    borderRadius: s(28),
    padding: s(36),
    alignItems: 'center',
    marginRight: s(96),
  },
  qr: {
    position: 'relative',
  },
  qrCell: {
    position: 'absolute',
    backgroundColor: colors.night,
  },
  code: {
    color: colors.night,
    fontSize: s(26),
    marginTop: s(20),
    fontWeight: '700',
  },
  steps: {
    flex: 1,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(28),
  },
  stepNum: {
    color: colors.night,
    backgroundColor: colors.amber,
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: s(56),
    fontSize: s(30),
    fontWeight: '800',
    marginRight: s(24),
  },
  stepText: {
    color: colors.ink,
    fontSize: type.heading,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: s(36),
  },
  pulse: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: colors.amber,
    marginRight: s(16),
  },
  statusText: {
    color: colors.inkMuted,
    fontSize: type.body,
  },
});
