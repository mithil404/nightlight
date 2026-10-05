import {defaultRequest, fillText, lanternMoon, storyPages} from '../src/data/showcase';
import {remoteKey} from '../src/input/remote';
import {narrationRate, splitWords, wordIndexAt} from '../src/player/narration';

describe('remoteKey', () => {
  it('maps raw Vega OS 1.2 and normalized names to the same key', () => {
    expect(remoteKey({eventType: 'enter', eventKeyAction: 0})).toBe('select');
    expect(remoteKey({eventType: 'select', eventKeyAction: 0})).toBe('select');
    expect(remoteKey({eventType: 'play', eventKeyAction: 0})).toBe('playPause');
    expect(remoteKey({eventType: 'playpause', eventKeyAction: 0})).toBe('playPause');
    expect(remoteKey({eventType: 'forward', eventKeyAction: 0})).toBe('fastForward');
    expect(remoteKey({eventType: 'skip_forward', eventKeyAction: 0})).toBe('fastForward');
  });

  it('ignores key-up and unknown events', () => {
    expect(remoteKey({eventType: 'enter', eventKeyAction: 1})).toBeUndefined();
    expect(remoteKey({eventType: 'blur', eventKeyAction: 0})).toBeUndefined();
  });
});

describe('narration', () => {
  it('slows from 100% to 80% as energy falls', () => {
    expect(narrationRate(1)).toBeCloseTo(1);
    expect(narrationRate(0.1)).toBeCloseTo(0.8);
    expect(narrationRate(0)).toBeCloseTo(0.8);
  });

  it('advances the highlighted word with time and stops at the end', () => {
    const text = 'one two three four';
    expect(wordIndexAt(text, 1, 0)).toBe(0);
    expect(wordIndexAt(text, 1, 1000)).toBe(2);
    expect(wordIndexAt(text, 1, 60_000)).toBe(splitWords(text).length);
  });
});

describe('story', () => {
  it('only reveals the branch after a choice', () => {
    expect(storyPages(lanternMoon, undefined)).toHaveLength(lanternMoon.opening.length);
    const branched = storyPages(lanternMoon, 0);
    expect(branched).toHaveLength(lanternMoon.opening.length + 1 + lanternMoon.ending.length);
  });

  it('winds down: energy never rises and ends low', () => {
    for (const branch of [0, 1]) {
      const energies = storyPages(lanternMoon, branch).map(p => p.energy);
      energies.forEach((e, i) => i > 0 && expect(e).toBeLessThanOrEqual(energies[i - 1]));
      expect(energies[energies.length - 1]).toBeLessThanOrEqual(0.15);
    }
  });

  it('fills hero, place and listener', () => {
    expect(fillText('{hero} in the {place}, goodnight {listener}', defaultRequest)).toBe('Pip in the forest, goodnight Mira');
  });
});
