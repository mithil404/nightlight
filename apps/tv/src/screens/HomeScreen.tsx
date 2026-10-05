import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {TVFocusGuideView} from '@amazon-devices/react-native-kepler';
import {FocusTile} from '../components/FocusTile';
import {HeroAvatar} from '../components/HeroAvatar';
import {findHero, listeners, pastStories, series} from '../data/showcase';
import {useRouter} from '../navigation/router';
import {useShowcase} from '../state';
import {colors, s, safe, type} from '../theme';

export function HomeScreen() {
  const {push} = useRouter();
  const {listenerId, setListenerId, heroes} = useShowcase();
  const withListener = <T extends {listenerId: string}>(request: T) => ({...request, listenerId});

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.moon} />
        <View>
          <Text style={styles.brand}>Nightlight</Text>
          <Text style={styles.tagline}>Who's listening tonight?</Text>
        </View>
      </View>

      <TVFocusGuideView autoFocus style={styles.row}>
        {listeners.map(l => (
          <FocusTile
            key={l.id}
            testID={`listener-${l.id}`}
            label={l.name}
            detail={`Ages ${l.ageBand}`}
            selected={l.id === listenerId}
            onPress={() => setListenerId(l.id)}
            width={s(260)}
            height={s(130)}
          />
        ))}
        <FocusTile testID="open-parent" label="Parents" detail="Settings · PIN" onPress={() => push({name: 'parent'})} width={s(260)} height={s(130)} />
      </TVFocusGuideView>

      <TVFocusGuideView autoFocus style={styles.row}>
        <FocusTile
          testID="new-story"
          label="New story"
          detail="Build tonight's story together"
          hasTVPreferredFocus
          onPress={() => push({name: 'wizard'})}
          width={s(420)}
          height={s(300)}>
          <View style={styles.newStoryMoon} />
        </FocusTile>
        <FocusTile
          testID="continue-series"
          label={series.title}
          detail={series.subtitle}
          onPress={() => push({name: 'player', request: withListener(series.request)})}
          width={s(760)}
          height={s(300)}>
          <HeroAvatar hero={findHero(series.request.heroId)} size={s(150)} />
        </FocusTile>
        <FocusTile testID="open-library" label="Library" detail={`${heroes.length} heroes · ${pastStories.length} stories`} onPress={() => push({name: 'library'})} width={s(300)} height={s(300)} />
      </TVFocusGuideView>

      <Text style={styles.rowTitle}>Past stories</Text>
      <TVFocusGuideView autoFocus style={styles.row}>
        {pastStories.map(story => (
          <FocusTile
            key={story.id}
            testID={`past-${story.id}`}
            label={story.title}
            detail={story.subtitle}
            onPress={() => push({name: 'player', request: withListener(story.request)})}
            width={s(460)}
            height={s(200)}
          />
        ))}
      </TVFocusGuideView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(32),
  },
  moon: {
    width: s(84),
    height: s(84),
    borderRadius: s(42),
    backgroundColor: colors.moon,
    marginRight: s(28),
  },
  brand: {
    color: colors.ink,
    fontSize: type.display,
    fontWeight: '800',
  },
  tagline: {
    color: colors.inkMuted,
    fontSize: type.body,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(36),
  },
  rowTitle: {
    color: colors.inkMuted,
    fontSize: type.heading,
    fontWeight: '700',
    marginBottom: s(16),
  },
  newStoryMoon: {
    width: s(110),
    height: s(110),
    borderRadius: s(55),
    backgroundColor: colors.moon,
  },
});
