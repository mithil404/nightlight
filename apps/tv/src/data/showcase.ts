// Static content for the showcase build: no generation, no network. Every character, world and
// line of story here is original (no third-party IP).

export interface Hero {
  id: string;
  name: string;
  kind: string;
  /** Body colour of the HeroAvatar shape. */
  color: string;
  accent: string;
  /** Ear/fin/antenna silhouette for HeroAvatar. */
  shape: 'ears' | 'antenna' | 'hair' | 'horns';
  /** Only drawn heroes carry odd details from the child's drawing. */
  legs?: 3;
}

export interface World {
  id: string;
  label: string;
  /** Word used in the story text: "the edge of the {place}". */
  place: string;
  sky: string;
  horizon: string;
  ground: string;
  groundFar: string;
}

export interface ArtStyle {
  id: string;
  label: string;
  /** How SceneArt renders shapes in this style. */
  outline: number;
  outlineColor: string;
  softness: number;
  dashed: boolean;
}

export interface Option {
  id: string;
  label: string;
  detail?: string;
}

export interface Listener {
  id: string;
  name: string;
  ageBand: '3-5' | '6-8' | '9-10';
}

export const listeners: Listener[] = [
  {id: 'mira', name: 'Mira', ageBand: '3-5'},
  {id: 'leo', name: 'Leo', ageBand: '6-8'},
];

export const heroes: Hero[] = [
  {id: 'pip', name: 'Pip', kind: 'little fox', color: '#F08A4B', accent: '#FFE3C7', shape: 'ears'},
  {id: 'bo', name: 'Bo', kind: 'tiny robot', color: '#5FB8B0', accent: '#DDF5F2', shape: 'antenna'},
  {id: 'luna', name: 'Luna', kind: 'brave kid', color: '#B49AE8', accent: '#F1E9FF', shape: 'hair'},
  {id: 'ember', name: 'Ember', kind: 'pocket dragon', color: '#E4606D', accent: '#FFD9DC', shape: 'horns'},
];

/** The hero produced by the (simulated) drawing-to-character flow. */
export const drawnHero: Hero = {
  id: 'drawn',
  name: 'Wobble',
  kind: 'three-legged moon cat',
  color: '#7FA6F0',
  accent: '#FFF1A8',
  shape: 'ears',
  legs: 3,
};

export const worlds: World[] = [
  {id: 'forest', label: 'Enchanted forest', place: 'forest', sky: '#1B1F4A', horizon: '#3B3270', ground: '#1F4636', groundFar: '#2D5A45'},
  {id: 'ocean', label: 'Ocean', place: 'sea', sky: '#0F2147', horizon: '#1F4A7A', ground: '#16506B', groundFar: '#21698A'},
  {id: 'space', label: 'Space', place: 'stars', sky: '#0A0820', horizon: '#251B52', ground: '#3A2E6E', groundFar: '#4B3D86'},
  {id: 'town', label: 'Cozy town', place: 'town', sky: '#22193F', horizon: '#4A2F5E', ground: '#3B2A3A', groundFar: '#563C4E'},
  {id: 'clouds', label: 'Cloud kingdom', place: 'clouds', sky: '#2A2F6B', horizon: '#5A5C9E', ground: '#8C8FC4', groundFar: '#A9ACD8'},
];

export const surpriseWorld: Option = {id: 'surprise', label: 'Surprise me'};

export const styles: ArtStyle[] = [
  {id: 'watercolor', label: 'Watercolor', outline: 0, outlineColor: 'transparent', softness: 0.85, dashed: false},
  {id: 'papercut', label: 'Paper cut-out', outline: 3, outlineColor: '#0B0918', softness: 1, dashed: false},
  {id: 'crayon', label: 'Soft crayon', outline: 4, outlineColor: '#F6EBDD', softness: 0.9, dashed: true},
  {id: 'clay', label: 'Claymation look', outline: 0, outlineColor: 'transparent', softness: 1, dashed: false},
  {id: 'ink', label: 'Storybook ink', outline: 5, outlineColor: '#120E22', softness: 0.95, dashed: false},
];

export const lessons: Option[] = [
  {id: 'kindness', label: 'Kindness'},
  {id: 'bravery', label: 'Bravery'},
  {id: 'sharing', label: 'Sharing'},
  {id: 'new-things', label: 'Trying new things'},
  {id: 'feelings', label: "It's OK to feel sad"},
  {id: 'none', label: 'No lesson tonight'},
];

export const lengths: Option[] = [
  {id: 'short', label: 'Short', detail: '~5 min · 6 pages'},
  {id: 'medium', label: 'Medium', detail: '~8 min · 9 pages'},
  {id: 'long', label: 'Long', detail: '~12 min · 12 pages'},
];

export const voices: Option[] = [
  {id: 'willow', label: 'Willow', detail: 'warm and slow'},
  {id: 'arlo', label: 'Arlo', detail: 'gentle storyteller'},
  {id: 'juniper', label: 'Juniper', detail: 'soft and bright'},
];

export interface StoryRequest {
  listenerId: string;
  heroId: string;
  worldId: string;
  styleId: string;
  lessonId: string;
  lengthId: string;
  voiceId: string;
}

export const defaultRequest: StoryRequest = {
  listenerId: 'mira',
  heroId: 'pip',
  worldId: 'forest',
  styleId: 'watercolor',
  lessonId: 'kindness',
  lengthId: 'short',
  voiceId: 'willow',
};

/** Scene elements SceneArt can draw for a page. */
export type SceneProp = 'lantern' | 'fireflies' | 'owl' | 'hill' | 'moonClose' | 'bed';

export interface StoryPage {
  text: string;
  /** 1 = full energy, 0 = asleep. Drives narration pace and the wind-down overlay. */
  energy: number;
  props: SceneProp[];
}

export interface StoryChoice {
  prompt: string;
  options: {label: string; props: SceneProp[]; pages: StoryPage[]}[];
}

export interface StoryScript {
  title: string;
  opening: StoryPage[];
  choice: StoryChoice;
  ending: StoryPage[];
}

/**
 * The showcase story. `{hero}`, `{place}` and `{listener}` are filled in from the wizard choices.
 * Energy falls page by page so the story winds down toward sleep.
 */
export const lanternMoon: StoryScript = {
  title: '{hero} and the Lantern Moon',
  opening: [
    {
      text: 'When the first star blinked awake, {hero} noticed a soft glow at the edge of the {place}.',
      energy: 0.9,
      props: ['lantern'],
    },
    {
      text: "The glow was a little lantern, humming a sleepy tune. \"I've lost my way home to the moon,\" it whispered.",
      energy: 0.8,
      props: ['lantern'],
    },
  ],
  choice: {
    prompt: '{hero} wants to help. Should they follow the fireflies, or ask the wise old owl?',
    options: [
      {
        label: 'Follow the fireflies',
        props: ['fireflies'],
        pages: [
          {
            text: 'The fireflies drew little arrows in the air. Left, then right, then slowly up, up, up.',
            energy: 0.6,
            props: ['fireflies', 'lantern'],
          },
        ],
      },
      {
        label: 'Ask the wise old owl',
        props: ['owl'],
        pages: [
          {
            text: '"The moon is closest from the tallest hill," the owl yawned, pointing one soft feather.',
            energy: 0.6,
            props: ['owl', 'lantern'],
          },
        ],
      },
    ],
  },
  ending: [
    {
      text: 'Together they climbed the hill, step by quiet step, until the moon was close enough to touch.',
      energy: 0.4,
      props: ['hill', 'lantern', 'moonClose'],
    },
    {
      text: 'The lantern floated up and nestled beside the moon, a nightlight for the whole {place}.',
      energy: 0.25,
      props: ['hill', 'moonClose'],
    },
    {
      text: '{hero} curled up in the soft grass, warm and proud. Goodnight, {hero}. Goodnight, {listener}.',
      energy: 0.1,
      props: ['bed', 'moonClose'],
    },
  ],
};

export interface LibraryItem {
  id: string;
  title: string;
  subtitle: string;
  request: StoryRequest;
}

export const series: LibraryItem = {
  id: 'pip-series',
  title: "Tonight: Pip's next adventure",
  subtitle: 'Episode 3 · Last time, Pip found a map made of moonlight',
  request: defaultRequest,
};

export const pastStories: LibraryItem[] = [
  {
    id: 'lantern',
    title: 'Pip and the Lantern Moon',
    subtitle: 'Enchanted forest · Watercolor',
    request: defaultRequest,
  },
  {
    id: 'bo-rocket',
    title: 'Bo and the Lantern Moon',
    subtitle: 'Space · Paper cut-out',
    request: {...defaultRequest, heroId: 'bo', worldId: 'space', styleId: 'papercut', listenerId: 'leo'},
  },
  {
    id: 'luna-ferry',
    title: 'Luna and the Lantern Moon',
    subtitle: 'Cloud kingdom · Soft crayon',
    request: {...defaultRequest, heroId: 'luna', worldId: 'clouds', styleId: 'crayon'},
  },
];

export const findHero = (id: string) => heroes.find(h => h.id === id) ?? (id === drawnHero.id ? drawnHero : heroes[0]);
export const findWorld = (id: string) => worlds.find(w => w.id === id) ?? worlds[0];
export const findStyle = (id: string) => styles.find(st => st.id === id) ?? styles[0];
export const findListener = (id: string) => listeners.find(l => l.id === id) ?? listeners[0];

/** Fill `{hero}`, `{place}` and `{listener}` placeholders. */
export function fillText(text: string, request: StoryRequest): string {
  return text
    .replace(/\{hero\}/g, findHero(request.heroId).name)
    .replace(/\{place\}/g, findWorld(request.worldId).place)
    .replace(/\{listener\}/g, findListener(request.listenerId).name);
}

/** The full page sequence once a branch is chosen (or just the opening, before the choice). */
export function storyPages(script: StoryScript, branch: number | undefined): StoryPage[] {
  if (branch === undefined) {
    return script.opening;
  }
  return [...script.opening, ...script.choice.options[branch].pages, ...script.ending];
}
