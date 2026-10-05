import {BackHandler} from 'react-native';
import {act, fireEvent, render} from '@testing-library/react-native';
import * as React from 'react';

import {App} from '../src/App';
import {defaultRequest, lanternMoon, storyPages} from '../src/data/showcase';
import {CHOICE_SECONDS} from '../src/player/ChoiceOverlay';
import {pageMs} from '../src/player/narration';

describe('App flows', () => {
  it('starts on Home with the main entry points', () => {
    const screen = render(<App />);
    expect(screen.getByTestId('new-story')).toBeTruthy();
    expect(screen.getByTestId('continue-series')).toBeTruthy();
    expect(screen.getByTestId('open-library')).toBeTruthy();
    expect(screen.getByTestId('open-parent')).toBeTruthy();
  });

  it('walks the wizard from Home to the player', () => {
    const screen = render(<App />);
    fireEvent.press(screen.getByTestId('new-story'));
    fireEvent.press(screen.getByTestId('hero-tile-bo'));
    fireEvent.press(screen.getByTestId('world-space'));
    fireEvent.press(screen.getByTestId('style-papercut'));
    fireEvent.press(screen.getByTestId('lesson-bravery'));
    fireEvent.press(screen.getByTestId('length-short'));
    fireEvent.press(screen.getByTestId('voice-arlo'));
    expect(screen.getByText('Bo · Space')).toBeTruthy();
    fireEvent.press(screen.getByTestId('begin-story'));
    expect(screen.getByTestId('player')).toBeTruthy();
    expect(screen.getByText('Bo and the Lantern Moon')).toBeTruthy();
  });

  it('adds a drawn hero through the pairing flow', () => {
    jest.useFakeTimers();
    const screen = render(<App />);
    fireEvent.press(screen.getByTestId('new-story'));
    fireEvent.press(screen.getByTestId('draw-your-own'));
    fireEvent.press(screen.getByTestId('use-sample-drawing'));
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    fireEvent.press(screen.getByTestId('accept-hero'));
    // Back in the wizard, on the World step, with the new hero chosen.
    expect(screen.getByTestId('world-forest')).toBeTruthy();
    jest.useRealTimers();
  });

  it('unlocks parent settings with the showcase PIN only', () => {
    const screen = render(<App />);
    fireEvent.press(screen.getByTestId('open-parent'));
    for (const key of ['1', '2', '3', '5', 'OK']) {
      fireEvent.press(screen.getByTestId(`pin-${key}`));
    }
    expect(screen.getByText("That PIN didn't match. Try again.")).toBeTruthy();
    for (const key of ['1', '2', '3', '4', 'OK']) {
      fireEvent.press(screen.getByTestId(`pin-${key}`));
    }
    expect(screen.getByTestId('captions-toggle')).toBeTruthy();
  });
});

describe('Player', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const playOpening = () => {
    for (const page of lanternMoon.opening) {
      act(() => {
        jest.advanceTimersByTime(pageMs(page.text, page.energy) + 500);
      });
    }
  };

  it('reaches the choice point after the opening pages and branches on a pick', () => {
    const screen = render(<App initialRoute={{name: 'player', request: defaultRequest}} />);
    expect(screen.getByTestId('caption-bar')).toBeTruthy();
    playOpening();
    expect(screen.getByTestId('choice-overlay')).toBeTruthy();
    fireEvent.press(screen.getByTestId('choice-1'));
    expect(screen.queryByTestId('choice-overlay')).toBeNull();
    expect(screen.getByText(`Page ${lanternMoon.opening.length + 1} of ${storyPages(lanternMoon, 1).length}`)).toBeTruthy();
  });

  it('picks the first option when nobody chooses', () => {
    const screen = render(<App initialRoute={{name: 'player', request: defaultRequest}} />);
    playOpening();
    // The countdown re-arms a 1 s timer after each render, so step one second at a time.
    for (let i = 0; i <= CHOICE_SECONDS; i++) {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(screen.queryByTestId('choice-overlay')).toBeNull();
    expect(screen.getByText(`Page ${lanternMoon.opening.length + 1} of ${storyPages(lanternMoon, 0).length}`)).toBeTruthy();
  });
});

describe('Back button', () => {
  const pressBack = () =>
    act(() => {
      (BackHandler as unknown as {mockPressBack: () => void}).mockPressBack();
    });

  it('steps back through the wizard, then returns Home, then lets the OS exit', () => {
    const screen = render(<App />);
    fireEvent.press(screen.getByTestId('new-story'));
    fireEvent.press(screen.getByTestId('hero-tile-pip'));
    expect(screen.getByTestId('world-forest')).toBeTruthy();
    pressBack();
    expect(screen.getByTestId('hero-tile-pip')).toBeTruthy();
    pressBack();
    expect(screen.getByTestId('new-story')).toBeTruthy();
    pressBack();
    expect(BackHandler.exitApp).toHaveBeenCalled();
  });
});
