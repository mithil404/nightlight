import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {FocusTile} from '../components/FocusTile';
import {HeroAvatar} from '../components/HeroAvatar';
import {Screen} from '../components/Screen';
import {defaultRequest, findHero, pastStories, series} from '../data/showcase';
import {useRouter} from '../navigation/router';
import {useShowcase} from '../state';
import {colors, s, type} from '../theme';

/** Saved heroes, the running series and past stories (replayed instantly, no regeneration). */
export function LibraryScreen() {
  const {push} = useRouter();
  const {heroes, listenerId} = useShowcase();

  return (
    <Screen title="Library" hint="Back: home">
      <Text style={styles.rowTitle}>Continue a series</Text>
      <TVFocusGuideView autoFocus style={styles.row}>
        <FocusTile
          testID="library-series"
          label={series.title}
          detail={series.subtitle}
          hasTVPreferredFocus
          onPress={() => push({name: 'player', request: {...series.request, listenerId}})}
          width={s(900)}
          height={s(220)}>
          <HeroAvatar hero={findHero(series.request.heroId)} size={s(110)} />
        </FocusTile>
      </TVFocusGuideView>

      <Text style={styles.rowTitle}>Your heroes</Text>
      <TVFocusGuideView autoFocus style={styles.row}>
        {heroes.map(h => (
          <FocusTile
            key={h.id}
            testID={`library-hero-${h.id}`}
            label={h.name}
            detail={h.kind}
            onPress={() => push({name: 'player', request: {...defaultRequest, heroId: h.id, listenerId}})}
            width={s(250)}
            height={s(250)}>
            <HeroAvatar hero={h} size={s(120)} />
          </FocusTile>
        ))}
      </TVFocusGuideView>

      <Text style={styles.rowTitle}>Past stories</Text>
      <TVFocusGuideView autoFocus style={styles.row}>
        {pastStories.map(story => (
          <FocusTile
            key={story.id}
            testID={`library-story-${story.id}`}
            label={story.title}
            detail={story.subtitle}
            onPress={() => push({name: 'player', request: {...story.request, listenerId}})}
            width={s(460)}
            height={s(170)}
          />
        ))}
      </TVFocusGuideView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  rowTitle: {
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
