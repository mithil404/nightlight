import React, {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {FocusTile} from '../components/FocusTile';
import {HeroAvatar} from '../components/HeroAvatar';
import {Screen} from '../components/Screen';
import {
  defaultRequest,
  findHero,
  findStyle,
  findWorld,
  lengths,
  lessons,
  styles as artStyles,
  surpriseWorld,
  voices,
  worlds,
  type StoryRequest,
} from '../data/showcase';
import {useBackOverride, useRouter} from '../navigation/router';
import {useShowcase} from '../state';
import {colors, s, type} from '../theme';

const STEPS = ['Hero', 'World', 'Art style', 'Lesson', 'Length', 'Voice', 'Ready'] as const;

export function WizardScreen({heroId}: {heroId?: string}) {
  const {replace, push} = useRouter();
  const {heroes, listenerId, allowedLessons} = useShowcase();
  // Returning from the drawing flow with a new hero skips straight to the World step.
  const [step, setStep] = useState(heroId ? 1 : 0);
  const [request, setRequest] = useState<StoryRequest>({...defaultRequest, listenerId, heroId: heroId ?? defaultRequest.heroId});

  useBackOverride(() => {
    if (step > 0) {
      setStep(step - 1);
      return true;
    }
    return false;
  });

  const choose = (patch: Partial<StoryRequest>) => {
    setRequest(r => ({...r, ...patch}));
    setStep(i => i + 1);
  };

  let body: React.ReactNode;
  switch (STEPS[step]) {
    case 'Hero':
      body = (
        <>
          {heroes.map((h, i) => (
            <FocusTile key={h.id} testID={`hero-tile-${h.id}`} label={h.name} detail={h.kind} hasTVPreferredFocus={i === 0} selected={h.id === request.heroId} onPress={() => choose({heroId: h.id})}>
              <HeroAvatar hero={h} size={s(130)} />
            </FocusTile>
          ))}
          <FocusTile testID="draw-your-own" label="Draw your own" detail="Scan with a phone" onPress={() => push({name: 'pairing'})}>
            <Text style={styles.bigGlyph}>+</Text>
          </FocusTile>
        </>
      );
      break;
    case 'World':
      body = (
        <>
          {worlds.map((w, i) => (
            <FocusTile key={w.id} testID={`world-${w.id}`} label={w.label} hasTVPreferredFocus={i === 0} selected={w.id === request.worldId} onPress={() => choose({worldId: w.id})} width={s(250)}>
              <View style={[styles.swatch, {backgroundColor: w.sky}]}>
                <View style={[styles.swatchGround, {backgroundColor: w.ground}]} />
              </View>
            </FocusTile>
          ))}
          <FocusTile
            testID="world-surprise"
            label={surpriseWorld.label}
            width={s(250)}
            onPress={() => choose({worldId: worlds[Math.floor(Math.random() * worlds.length)].id})}>
            <Text style={styles.bigGlyph}>?</Text>
          </FocusTile>
        </>
      );
      break;
    case 'Art style':
      body = artStyles.map((st, i) => (
        <FocusTile key={st.id} testID={`style-${st.id}`} label={st.label} hasTVPreferredFocus={i === 0} selected={st.id === request.styleId} onPress={() => choose({styleId: st.id})} width={s(280)}>
          <View style={[styles.styleSample, {borderWidth: s(st.outline), borderColor: st.outlineColor, borderStyle: st.dashed ? 'dashed' : 'solid', opacity: st.softness}]} />
        </FocusTile>
      ));
      break;
    case 'Lesson':
      body = lessons
        .filter(l => l.id === 'none' || allowedLessons.includes(l.id))
        .map((l, i) => (
          <FocusTile key={l.id} testID={`lesson-${l.id}`} label={l.label} hasTVPreferredFocus={i === 0} selected={l.id === request.lessonId} onPress={() => choose({lessonId: l.id})} width={s(250)} height={s(160)} />
        ));
      break;
    case 'Length':
      body = lengths.map((l, i) => (
        <FocusTile key={l.id} testID={`length-${l.id}`} label={l.label} detail={l.detail} hasTVPreferredFocus={i === 0} selected={l.id === request.lengthId} onPress={() => choose({lengthId: l.id})} height={s(180)} />
      ));
      break;
    case 'Voice':
      body = voices.map((v, i) => (
        <FocusTile key={v.id} testID={`voice-${v.id}`} label={v.label} detail={v.detail} hasTVPreferredFocus={i === 0} selected={v.id === request.voiceId} onPress={() => choose({voiceId: v.id})} height={s(180)} />
      ));
      break;
    case 'Ready': {
      const hero = findHero(request.heroId);
      body = (
        <View style={styles.ready}>
          <HeroAvatar hero={hero} size={s(260)} />
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>
              {hero.name} · {findWorld(request.worldId).label}
            </Text>
            <Text style={styles.summaryLine}>
              {findStyle(request.styleId).label} · {lessons.find(l => l.id === request.lessonId)?.label} · {lengths.find(l => l.id === request.lengthId)?.label} · read by {voices.find(v => v.id === request.voiceId)?.label}
            </Text>
            <FocusTile testID="begin-story" label="Begin story" detail="Lights down, story up" hasTVPreferredFocus onPress={() => replace({name: 'player', request})} width={s(420)} height={s(170)} style={styles.begin} />
          </View>
        </View>
      );
      break;
    }
  }

  return (
    <Screen title={STEPS[step] === 'Ready' ? 'Ready for tonight' : `Choose a ${STEPS[step].toLowerCase()}`} hint="Back: previous step">
      <View style={styles.steps}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, i < step && styles.stepDone, i === step && styles.stepCurrent]} />
            <Text style={[styles.stepLabel, i === step && styles.stepLabelCurrent]}>{label}</Text>
          </View>
        ))}
      </View>
      {/* Remount per step so hasTVPreferredFocus lands on the new step's first tile. */}
      <TVFocusGuideView key={step} autoFocus style={styles.grid}>
        {body}
      </TVFocusGuideView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  steps: {
    flexDirection: 'row',
    marginBottom: s(48),
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: s(40),
  },
  stepDot: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: colors.nightCard,
    marginRight: s(12),
  },
  stepDone: {
    backgroundColor: colors.amber,
  },
  stepCurrent: {
    backgroundColor: colors.focus,
    transform: [{scale: 1.3}],
  },
  stepLabel: {
    color: colors.inkFaint,
    fontSize: s(26),
  },
  stepLabelCurrent: {
    color: colors.ink,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    rowGap: s(36),
  },
  bigGlyph: {
    color: colors.moon,
    fontSize: s(96),
  },
  swatch: {
    width: s(170),
    height: s(110),
    borderRadius: s(16),
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  swatchGround: {
    height: s(40),
  },
  styleSample: {
    width: s(120),
    height: s(120),
    borderRadius: s(60),
    backgroundColor: colors.amber,
  },
  ready: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summary: {
    marginLeft: s(64),
    flex: 1,
  },
  summaryTitle: {
    color: colors.ink,
    fontSize: type.title,
    fontWeight: '700',
  },
  summaryLine: {
    color: colors.inkMuted,
    fontSize: type.body,
    marginTop: s(12),
    marginBottom: s(40),
  },
  begin: {
    backgroundColor: colors.ember,
  },
});
