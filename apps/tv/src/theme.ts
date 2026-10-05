import {Dimensions} from 'react-native';

/** Layout is designed on a 1920×1080 grid (PLAN.md §8) and scaled to the actual window width. */
const DESIGN_WIDTH = 1920;
const ratio = Dimensions.get('window').width / DESIGN_WIDTH || 1;

/** Scale a design-grid pixel value to the device. */
export const s = (px: number) => Math.round(px * ratio);

/** Dark, warm night palette. Never pure white in the player. */
export const colors = {
  night: '#0E0B1F',
  nightRaised: '#1A1533',
  nightCard: '#241C45',
  ink: '#F6EBDD',
  inkMuted: '#B9AEC9',
  inkFaint: '#7E7499',
  moon: '#FFE9B0',
  amber: '#FFB45E',
  ember: '#FF7A59',
  focus: '#FFD27A',
  warmTint: '#FF8A3D',
};

export const type = {
  display: s(72),
  title: s(52),
  heading: s(36),
  body: s(30),
  caption: s(28),
};

/** ≥ 5% safe-area margins. */
export const safe = {
  horizontal: s(112),
  vertical: s(64),
};

/** Shared focus treatment: physical change (scale + border), not just colour. */
export const focusRing = {
  borderColor: colors.focus,
  borderWidth: s(5),
  transform: [{scale: 1.08}],
};
