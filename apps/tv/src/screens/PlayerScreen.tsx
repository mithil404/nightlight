import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Dimensions, StyleSheet, Text, View} from 'react-native';
import {useTVEventHandler, type HWEvent} from '@amazon-devices/react-native-kepler';
import {SceneArt} from '../components/SceneArt';
import {fillText, findHero, findListener, findStyle, findWorld, lanternMoon, storyPages, type StoryRequest} from '../data/showcase';
import {remoteKey} from '../input/remote';
import {useRouter} from '../navigation/router';
import {CaptionBar} from '../player/CaptionBar';
import {ChoiceOverlay} from '../player/ChoiceOverlay';
import {KenBurns} from '../player/KenBurns';
import {pageMs, wordIndexAt} from '../player/narration';
import {WindDownOverlay} from '../player/WindDownOverlay';
import {useShowcase} from '../state';
import {colors, s, safe, type} from '../theme';

const TICK_MS = 100;

type Phase = 'reading' | 'choice';

/** Full-screen story playback: illustration, timed captions, choice point and wind-down. */
export function PlayerScreen({request}: {request: StoryRequest}) {
  const {replace} = useRouter();
  const {captions} = useShowcase();
  const script = lanternMoon;
  const [branch, setBranch] = useState<number | undefined>(undefined);
  const [pageIndex, setPageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState<Phase>('reading');

  const pages = useMemo(() => storyPages(script, branch), [script, branch]);
  const page = pages[pageIndex];
  const text = fillText(page.text, request);
  const duration = pageMs(text, page.energy);
  const {width, height} = Dimensions.get('window');

  const goTo = useCallback((index: number) => {
    setPageIndex(index);
    setElapsed(0);
  }, []);

  const next = useCallback(() => {
    if (branch === undefined && pageIndex === script.opening.length - 1) {
      setPhase('choice');
      return;
    }
    if (pageIndex < pages.length - 1) {
      goTo(pageIndex + 1);
      return;
    }
    replace({name: 'sleep', listenerName: findListener(request.listenerId).name});
  }, [branch, pageIndex, pages.length, script.opening.length, goTo, replace, request.listenerId]);

  const previous = useCallback(() => goTo(Math.max(0, pageIndex - 1)), [goTo, pageIndex]);

  // Narration clock.
  useEffect(() => {
    if (paused || phase !== 'reading') {
      return;
    }
    const timer = setInterval(() => setElapsed(e => e + TICK_MS), TICK_MS);
    return () => clearInterval(timer);
  }, [paused, phase]);

  useEffect(() => {
    if (phase === 'reading' && elapsed >= duration) {
      next();
    }
  }, [elapsed, duration, phase, next]);

  const onTVEvent = useCallback(
    (event: HWEvent) => {
      const key = remoteKey(event);
      if (key === 'playPause' || (key === 'select' && phase === 'reading')) {
        setPaused(p => !p);
      } else if (phase === 'reading' && (key === 'right' || key === 'fastForward')) {
        next();
      } else if (phase === 'reading' && (key === 'left' || key === 'rewind')) {
        previous();
      }
    },
    [phase, next, previous],
  );
  useTVEventHandler(onTVEvent);

  const choose = useCallback(
    (index: number) => {
      setBranch(index);
      setPhase('reading');
      goTo(script.opening.length);
    },
    [goTo, script.opening.length],
  );

  return (
    <View style={styles.root} testID="player">
      <KenBurns pageKey={`${branch}-${pageIndex}`} durationMs={duration} paused={paused || phase === 'choice'} direction={pageIndex % 2 ? -1 : 1} panPx={s(70)}>
        <SceneArt world={findWorld(request.worldId)} style={findStyle(request.styleId)} hero={findHero(request.heroId)} props={page.props} width={width} height={height} />
      </KenBurns>
      <WindDownOverlay energy={page.energy} />

      <View style={styles.topBar}>
        <Text style={styles.title}>{fillText(script.title, request)}</Text>
        <Text style={styles.pageCount}>
          Page {pageIndex + 1}
          {branch === undefined ? '' : ` of ${pages.length}`}
        </Text>
      </View>

      {captions && phase === 'reading' ? <CaptionBar text={text} wordIndex={wordIndexAt(text, page.energy, elapsed)} /> : null}

      {phase === 'choice' ? (
        <ChoiceOverlay prompt={fillText(script.choice.prompt, request)} options={script.choice.options} paused={paused} onChoose={choose} />
      ) : null}

      {paused && phase === 'reading' ? (
        <View style={styles.pausedPill}>
          <Text style={styles.pausedText}>Paused · Play or Select to continue</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night,
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: safe.vertical,
    left: safe.horizontal,
    right: safe.horizontal,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: type.heading,
    fontWeight: '700',
    opacity: 0.9,
  },
  pageCount: {
    color: colors.inkMuted,
    fontSize: type.caption,
  },
  pausedPill: {
    position: 'absolute',
    top: s(180),
    alignSelf: 'center',
    backgroundColor: 'rgba(14, 11, 31, 0.8)',
    borderRadius: s(40),
    paddingHorizontal: s(40),
    paddingVertical: s(16),
  },
  pausedText: {
    color: colors.ink,
    fontSize: type.caption,
  },
});
