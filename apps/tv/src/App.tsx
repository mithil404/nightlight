import React from 'react';
import {StyleSheet, View} from 'react-native';
import {RouterProvider, useRouter, type Route} from './navigation/router';
import {CharacterCardScreen} from './screens/CharacterCardScreen';
import {HomeScreen} from './screens/HomeScreen';
import {LibraryScreen} from './screens/LibraryScreen';
import {PairingScreen} from './screens/PairingScreen';
import {ParentScreen} from './screens/ParentScreen';
import {PlayerScreen} from './screens/PlayerScreen';
import {SleepScreen} from './screens/SleepScreen';
import {WizardScreen} from './screens/WizardScreen';
import {ShowcaseStateProvider} from './state';
import {colors} from './theme';

function CurrentScreen() {
  const {route} = useRouter();
  switch (route.name) {
    case 'home':
      return <HomeScreen />;
    case 'wizard':
      return <WizardScreen heroId={route.heroId} />;
    case 'pairing':
      return <PairingScreen />;
    case 'characterCard':
      return <CharacterCardScreen />;
    case 'player':
      return <PlayerScreen request={route.request} />;
    case 'sleep':
      return <SleepScreen listenerName={route.listenerName} />;
    case 'library':
      return <LibraryScreen />;
    case 'parent':
      return <ParentScreen />;
  }
}

export const App = ({initialRoute = {name: 'home'}}: {initialRoute?: Route}) => (
  <ShowcaseStateProvider>
    <RouterProvider initial={initialRoute}>
      <View style={styles.root}>
        <CurrentScreen />
      </View>
    </RouterProvider>
  </ShowcaseStateProvider>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.night,
  },
});
