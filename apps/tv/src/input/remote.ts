import type {HWEvent} from '@amazon-devices/react-native-kepler';

export type RemoteKey =
  | 'select'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'playPause'
  | 'fastForward'
  | 'rewind'
  | 'back'
  | 'menu';

// Vega OS 1.2 reports raw key names (`enter`, `play`, `forward`); a later OS normalizes
// them (`select`, `skip_forward`). Match both. See docs/decisions.md D-009.
const KEY_NAMES: Record<string, RemoteKey> = {
  select: 'select',
  enter: 'select',
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
  play: 'playPause',
  pause: 'playPause',
  playpause: 'playPause',
  play_pause: 'playPause',
  forward: 'fastForward',
  fastforward: 'fastForward',
  skip_forward: 'fastForward',
  rewind: 'rewind',
  skip_backward: 'rewind',
  back: 'back',
  menu: 'menu',
};

/** The logical remote key for a key-down event, or undefined for key-up and unknown events. */
export function remoteKey(event: Pick<HWEvent, 'eventType' | 'eventKeyAction'>): RemoteKey | undefined {
  if (event.eventKeyAction !== 0 || !event.eventType) {
    return undefined;
  }
  return KEY_NAMES[event.eventType.toLowerCase()];
}
