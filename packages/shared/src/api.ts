// REST + WebSocket contract (PLAN.md §7). Keep in sync with services/api.

export type AgeBand = '3-5' | '6-8' | '9-10';
export type StoryLength = 'short' | 'medium' | 'long';
export type StoryStatus = 'generating' | 'ready' | 'failed';
export type PageStatus = 'pending' | 'ready' | 'failed';

export interface ChoiceOption {
  label: string;
  nextBranch: string;
}

export interface Choice {
  prompt: string;
  options: ChoiceOption[];
}

export interface CreateStoryRequest {
  listenerId: string;
  heroId: string;
  worldId: string;
  styleId: string;
  lesson?: string;
  length: StoryLength;
  voiceId: string;
  seriesId?: string;
}

export interface CreateStoryResponse {
  storyId: string;
}

export interface StoryPage {
  n: number;
  status: PageStatus;
  text?: string;
  imageUrl?: string;
  audioUrl?: string;
  marksUrl?: string;
  /** 0 (asleep) to 1 (full energy); drives the wind-down overlay and narration rate. */
  energy?: number;
  choice?: Choice;
}

export interface StoryMeta {
  storyId: string;
  title?: string;
  status: StoryStatus;
  createdAt: string;
}

export interface GetStoryResponse {
  meta: StoryMeta;
  pages: StoryPage[];
}

export interface CreateSessionResponse {
  code: string;
  qrUrl: string;
  expiresAt: string;
}

/** Server -> TV events over WebSocket. */
export type ServerEvent =
  | {type: 'story.bible.ready'; storyId: string}
  | {type: 'page.ready'; storyId: string; n: number}
  | {type: 'story.ready'; storyId: string}
  | {type: 'story.failed'; storyId: string; reason: string}
  | {type: 'character.ready'; sessionCode: string; characterId: string}
  | {type: 'session.photoReceived'; sessionCode: string};

/** TV -> server messages over WebSocket. */
export type ClientMessage =
  | {type: 'subscribe'; storyId: string}
  | {type: 'subscribe'; sessionCode: string};
