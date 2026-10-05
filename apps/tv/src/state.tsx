import React, {createContext, useContext, useMemo, useState} from 'react';
import {drawnHero, heroes, lessons, type Hero} from './data/showcase';

/** In-memory household state for the showcase (no accounts, no storage). */
interface ShowcaseState {
  listenerId: string;
  setListenerId: (id: string) => void;
  /** Saved heroes, including the drawn hero once the parent accepts it. */
  heroes: Hero[];
  addDrawnHero: () => void;
  captions: boolean;
  setCaptions: (on: boolean) => void;
  allowedLessons: string[];
  toggleLesson: (id: string) => void;
}

const Ctx = createContext<ShowcaseState | undefined>(undefined);

export function ShowcaseStateProvider({children}: {children: React.ReactNode}) {
  const [listenerId, setListenerId] = useState('mira');
  const [hasDrawn, setHasDrawn] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [allowedLessons, setAllowedLessons] = useState(lessons.map(l => l.id));

  const value = useMemo<ShowcaseState>(
    () => ({
      listenerId,
      setListenerId,
      heroes: hasDrawn ? [drawnHero, ...heroes] : heroes,
      addDrawnHero: () => setHasDrawn(true),
      captions,
      setCaptions,
      allowedLessons,
      toggleLesson: id =>
        setAllowedLessons(current => (current.includes(id) ? current.filter(l => l !== id) : [...current, id])),
    }),
    [listenerId, hasDrawn, captions, allowedLessons],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShowcase(): ShowcaseState {
  const state = useContext(Ctx);
  if (!state) {
    throw new Error('useShowcase must be used inside <ShowcaseStateProvider>');
  }
  return state;
}
