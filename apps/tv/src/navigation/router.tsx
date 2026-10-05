import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {BackHandler} from 'react-native';
import type {StoryRequest} from '../data/showcase';

/**
 * A minimal screen stack. The showcase has a handful of screens and no deep links, so this avoids
 * pulling native navigation modules into the app (docs/decisions.md D-010).
 */
export type Route =
  | {name: 'home'}
  | {name: 'wizard'; heroId?: string}
  | {name: 'pairing'}
  | {name: 'characterCard'}
  | {name: 'player'; request: StoryRequest}
  | {name: 'sleep'; listenerName: string}
  | {name: 'library'}
  | {name: 'parent'};

/** Return true if the back press was handled. */
type BackOverride = () => boolean;

interface Router {
  route: Route;
  canGoBack: boolean;
  push: (route: Route) => void;
  replace: (route: Route) => void;
  back: () => void;
  reset: (route: Route) => void;
  /** Pop back to the nearest screen with the same name, replacing it with `route` (or push if absent). */
  popTo: (route: Route) => void;
  /** Lets the current screen intercept Back (e.g. the wizard steps back through its own pages). */
  setBackOverride: (override: BackOverride | undefined) => void;
}

const RouterContext = createContext<Router | undefined>(undefined);

export function RouterProvider({initial, children}: {initial: Route; children: React.ReactNode}) {
  const [stack, setStack] = useState<Route[]>([initial]);
  const backOverride = useRef<BackOverride | undefined>(undefined);

  const push = useCallback((route: Route) => setStack(s => [...s, route]), []);
  const replace = useCallback((route: Route) => setStack(s => [...s.slice(0, -1), route]), []);
  const back = useCallback(() => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const reset = useCallback((route: Route) => setStack([route]), []);
  const popTo = useCallback(
    (route: Route) =>
      setStack(s => {
        const i = s.map(r => r.name).lastIndexOf(route.name);
        return i < 0 ? [...s, route] : [...s.slice(0, i), route];
      }),
    [],
  );
  const setBackOverride = useCallback((override: BackOverride | undefined) => {
    backOverride.current = override;
  }, []);

  // One BackHandler for the whole app. Returning false on the root screen lets the OS exit the app.
  const depth = stack.length;
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (backOverride.current?.()) {
        return true;
      }
      if (depth > 1) {
        back();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [depth, back]);

  const value = useMemo<Router>(
    () => ({route: stack[stack.length - 1], canGoBack: depth > 1, push, replace, back, reset, popTo, setBackOverride}),
    [stack, depth, push, replace, back, reset, popTo, setBackOverride],
  );
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): Router {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error('useRouter must be used inside <RouterProvider>');
  }
  return router;
}

/** Intercept Back while this screen is mounted. The handler returns true when it handled the press. */
export function useBackOverride(handler: BackOverride) {
  const {setBackOverride} = useRouter();
  const latest = useRef(handler);
  latest.current = handler;
  useEffect(() => {
    setBackOverride(() => latest.current());
    return () => setBackOverride(undefined);
  }, [setBackOverride]);
}
